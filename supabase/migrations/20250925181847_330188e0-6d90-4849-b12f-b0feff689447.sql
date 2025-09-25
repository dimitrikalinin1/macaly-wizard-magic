-- Add API credentials to telegram_accounts table
ALTER TABLE public.telegram_accounts 
ADD COLUMN api_id integer,
ADD COLUMN api_hash text;