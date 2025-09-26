import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ContactList {
  id: string;
  name: string;
  total_numbers: number;
  verified_numbers: number;
  telegram_users: number;
  status: 'processing' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
}

export const useContactLists = () => {
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchContactLists = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_lists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact lists:', error);
    } else {
      setContactLists((data || []) as ContactList[]);
    }
    setLoading(false);
  };

  const createContactList = async (name: string, phoneNumbers: string[]) => {
    if (!user) return { error: 'Not authenticated' };

    // Создаем список контактов
    const { data: contactList, error: listError } = await supabase
      .from('contact_lists')
      .insert([{
        user_id: user.id,
        name,
        total_numbers: phoneNumbers.length,
        status: 'processing'
      }])
      .select()
      .single();

    if (listError) return { error: listError };

    // Добавляем контакты
    const contacts = phoneNumbers.map(phone => ({
      contact_list_id: contactList.id,
      phone_number: phone.trim(),
      is_verified: false,
      has_telegram: false
    }));

    const { error: contactsError } = await supabase
      .from('contacts')
      .insert(contacts);

    if (contactsError) return { error: contactsError };

    // Обновляем локальное состояние
    setContactLists(prev => [contactList as ContactList, ...prev]);

    // Добавить активность
    await supabase.from('activities').insert([{
      user_id: user.id,
      type: 'contacts_uploaded',
      description: `Загружен список из ${phoneNumbers.length} контактов`
    }]);

    // Запускаем реальную проверку через Telegram
    setTimeout(() => {
      verifyContactsWithTelegram(contactList.id);
    }, 1000);

    return { data: contactList, error: null };
  };

  const verifyContactsWithTelegram = async (contactListId: string) => {
    try {
      console.log('Starting telegram verification for list:', contactListId);
      
      const { data, error } = await supabase.functions.invoke('telegram-checker', {
        body: { contactListId }
      });

      if (error) {
        console.error('Telegram verification error:', error);
        // В случае ошибки обновляем статус на error
        await supabase
          .from('contact_lists')
          .update({ status: 'error' })
          .eq('id', contactListId);
        
        setContactLists(prev => prev.map(list => 
          list.id === contactListId ? { ...list, status: 'error' as const } : list
        ));
        return;
      }

      console.log('Telegram verification completed:', data);
      
      // Обновляем локальное состояние с актуальными данными
      fetchContactLists();
      
    } catch (error) {
      console.error('Error calling telegram-checker:', error);
      // В случае ошибки обновляем статус
      await supabase
        .from('contact_lists')
        .update({ status: 'error' })
        .eq('id', contactListId);
      
      setContactLists(prev => prev.map(list => 
        list.id === contactListId ? { ...list, status: 'error' as const } : list
      ));
    }
  };

  const deleteContactList = async (id: string) => {
    const contactList = contactLists.find(list => list.id === id);
    const { error } = await supabase
      .from('contact_lists')
      .delete()
      .eq('id', id);

    if (!error) {
      setContactLists(prev => prev.filter(list => list.id !== id));
      
      // Добавить активность
      if (user && contactList) {
        await supabase.from('activities').insert([{
          user_id: user.id,
          type: 'contact_list_deleted',
          description: `Список контактов "${contactList.name}" удален`
        }]);
      }
    }

    return { error };
  };

  useEffect(() => {
    fetchContactLists();
  }, [user]);

  return {
    contactLists,
    loading,
    createContactList,
    deleteContactList,
    refetch: fetchContactLists
  };
};