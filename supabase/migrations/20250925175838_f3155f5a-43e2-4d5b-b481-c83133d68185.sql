-- Создание таблиц для Telegram менеджера

-- Таблица аккаунтов Telegram
CREATE TABLE public.telegram_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'waiting', 'blocked')) DEFAULT 'waiting',
  daily_limit INTEGER NOT NULL DEFAULT 50,
  sent_today INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, phone_number)
);

-- Таблица списков контактов
CREATE TABLE public.contact_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_numbers INTEGER NOT NULL DEFAULT 0,
  verified_numbers INTEGER NOT NULL DEFAULT 0,
  telegram_users INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'error')) DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица контактов
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_list_id UUID NOT NULL REFERENCES public.contact_lists(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  has_telegram BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица кампаний
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_list_id UUID NOT NULL REFERENCES public.contact_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'running', 'paused', 'completed', 'stopped')) DEFAULT 'draft',
  total_targets INTEGER NOT NULL DEFAULT 0,
  sent INTEGER NOT NULL DEFAULT 0,
  delivered INTEGER NOT NULL DEFAULT 0,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица активностей
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включение RLS для всех таблиц
ALTER TABLE public.telegram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Политики RLS для telegram_accounts
CREATE POLICY "Пользователи могут видеть свои аккаунты" 
ON public.telegram_accounts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои аккаунты" 
ON public.telegram_accounts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои аккаунты" 
ON public.telegram_accounts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свои аккаунты" 
ON public.telegram_accounts FOR DELETE 
USING (auth.uid() = user_id);

-- Политики RLS для contact_lists
CREATE POLICY "Пользователи могут видеть свои списки контактов" 
ON public.contact_lists FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои списки контактов" 
ON public.contact_lists FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои списки контактов" 
ON public.contact_lists FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свои списки контактов" 
ON public.contact_lists FOR DELETE 
USING (auth.uid() = user_id);

-- Политики RLS для contacts
CREATE POLICY "Пользователи могут видеть контакты из своих списков" 
ON public.contacts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.contact_lists 
    WHERE contact_lists.id = contacts.contact_list_id 
    AND contact_lists.user_id = auth.uid()
  )
);

CREATE POLICY "Пользователи могут создавать контакты в своих списках" 
ON public.contacts FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contact_lists 
    WHERE contact_lists.id = contacts.contact_list_id 
    AND contact_lists.user_id = auth.uid()
  )
);

CREATE POLICY "Пользователи могут обновлять контакты в своих списках" 
ON public.contacts FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.contact_lists 
    WHERE contact_lists.id = contacts.contact_list_id 
    AND contact_lists.user_id = auth.uid()
  )
);

CREATE POLICY "Пользователи могут удалять контакты из своих списков" 
ON public.contacts FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.contact_lists 
    WHERE contact_lists.id = contacts.contact_list_id 
    AND contact_lists.user_id = auth.uid()
  )
);

-- Политики RLS для campaigns
CREATE POLICY "Пользователи могут видеть свои кампании" 
ON public.campaigns FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои кампании" 
ON public.campaigns FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои кампании" 
ON public.campaigns FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свои кампании" 
ON public.campaigns FOR DELETE 
USING (auth.uid() = user_id);

-- Политики RLS для activities
CREATE POLICY "Пользователи могут видеть свои активности" 
ON public.activities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои активности" 
ON public.activities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_telegram_accounts_updated_at
  BEFORE UPDATE ON public.telegram_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_lists_updated_at
  BEFORE UPDATE ON public.contact_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Функция для сброса ежедневного лимита
CREATE OR REPLACE FUNCTION public.reset_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE public.telegram_accounts 
  SET sent_today = 0, last_reset_date = CURRENT_DATE 
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Индексы для производительности
CREATE INDEX idx_telegram_accounts_user_id ON public.telegram_accounts(user_id);
CREATE INDEX idx_contact_lists_user_id ON public.contact_lists(user_id);
CREATE INDEX idx_contacts_contact_list_id ON public.contacts(contact_list_id);
CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);