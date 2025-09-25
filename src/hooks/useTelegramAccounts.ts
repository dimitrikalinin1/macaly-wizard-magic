import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TelegramAccount {
  id: string;
  phone_number: string;
  api_id: number | null;
  api_hash: string | null;
  status: 'active' | 'waiting' | 'blocked';
  daily_limit: number;
  sent_today: number;
  created_at: string;
  updated_at: string;
}

export const useTelegramAccounts = () => {
  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAccounts = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('telegram_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching accounts:', error);
    } else {
      setAccounts((data || []) as TelegramAccount[]);
    }
    setLoading(false);
  };

  const addAccount = async (phoneNumber: string, apiId: number, apiHash: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('telegram_accounts')
      .insert([{
        user_id: user.id,
        phone_number: phoneNumber,
        api_id: apiId,
        api_hash: apiHash,
        status: 'waiting'
      }])
      .select()
      .single();

    if (!error && data) {
      setAccounts(prev => [data as TelegramAccount, ...prev]);
      
      // Добавить активность
      await supabase.from('activities').insert([{
        user_id: user.id,
        type: 'account_added',
        description: `Аккаунт ${phoneNumber} добавлен`
      }]);
    }

    return { data, error };
  };

  const updateAccountStatus = async (id: string, status: 'active' | 'waiting' | 'blocked') => {
    const { data, error } = await supabase
      .from('telegram_accounts')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setAccounts(prev => prev.map(acc => acc.id === id ? data as TelegramAccount : acc));
      
      // Добавить активность
      if (user) {
        await supabase.from('activities').insert([{
          user_id: user.id,
          type: 'account_status_changed',
          description: `Аккаунт ${data.phone_number} изменен на ${status === 'active' ? 'активен' : status === 'blocked' ? 'заблокирован' : 'ожидание'}`
        }]);
      }
    }

    return { data, error };
  };

  const deleteAccount = async (id: string) => {
    const account = accounts.find(acc => acc.id === id);
    const { error } = await supabase
      .from('telegram_accounts')
      .delete()
      .eq('id', id);

    if (!error) {
      setAccounts(prev => prev.filter(acc => acc.id !== id));
      
      // Добавить активность
      if (user && account) {
        await supabase.from('activities').insert([{
          user_id: user.id,
          type: 'account_deleted',
          description: `Аккаунт ${account.phone_number} удален`
        }]);
      }
    }

    return { error };
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  return {
    accounts,
    loading,
    addAccount,
    updateAccountStatus,
    deleteAccount,
    refetch: fetchAccounts
  };
};