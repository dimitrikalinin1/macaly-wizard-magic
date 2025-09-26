-- Создаем таблицу для входящих сообщений
CREATE TABLE public.incoming_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  telegram_account_id UUID NOT NULL,
  from_phone TEXT NOT NULL,
  from_username TEXT,
  from_first_name TEXT,
  from_last_name TEXT,
  message_text TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  chat_id BIGINT NOT NULL,
  message_id BIGINT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.incoming_messages ENABLE ROW LEVEL SECURITY;

-- Создаем политики RLS
CREATE POLICY "Пользователи могут видеть свои сообщения" 
ON public.incoming_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои сообщения" 
ON public.incoming_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Добавляем индекс для быстрого поиска
CREATE INDEX idx_incoming_messages_user_id ON public.incoming_messages(user_id);
CREATE INDEX idx_incoming_messages_telegram_account_id ON public.incoming_messages(telegram_account_id);
CREATE INDEX idx_incoming_messages_received_at ON public.incoming_messages(received_at DESC);