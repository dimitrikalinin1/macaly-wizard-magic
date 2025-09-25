-- Добавить поля для хранения данных авторизации
ALTER TABLE telegram_accounts 
ADD COLUMN IF NOT EXISTS session_data TEXT,
ADD COLUMN IF NOT EXISTS last_auth_attempt TIMESTAMP WITH TIME ZONE;

-- Добавить индекс для поиска аккаунтов по статусу
CREATE INDEX IF NOT EXISTS idx_telegram_accounts_status ON telegram_accounts(status);

-- Создать функцию для очистки старых данных авторизации
CREATE OR REPLACE FUNCTION cleanup_auth_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Очистить данные авторизации старше 1 часа
  UPDATE telegram_accounts 
  SET session_data = NULL 
  WHERE session_data IS NOT NULL 
    AND last_auth_attempt < NOW() - INTERVAL '1 hour';
END;
$$;