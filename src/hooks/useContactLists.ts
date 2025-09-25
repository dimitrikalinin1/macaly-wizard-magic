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

    // Симулируем проверку контактов
    setTimeout(() => {
      simulateVerification(contactList.id, phoneNumbers.length);
    }, 2000);

    return { data: contactList, error: null };
  };

  const simulateVerification = async (contactListId: string, totalNumbers: number) => {
    const verifiedNumbers = Math.floor(totalNumbers * 0.9);
    const telegramUsers = Math.floor(totalNumbers * 0.7);

    // Обновляем статистику списка
    const { data, error } = await supabase
      .from('contact_lists')
      .update({
        verified_numbers: verifiedNumbers,
        telegram_users: telegramUsers,
        status: 'completed'
      })
      .eq('id', contactListId)
      .select()
      .single();

    if (!error && data) {
      setContactLists(prev => prev.map(list => 
        list.id === contactListId ? data as ContactList : list
      ));

      // Обновляем случайные контакты как проверенные
      await supabase
        .from('contacts')
        .update({ is_verified: true, has_telegram: true })
        .eq('contact_list_id', contactListId)
        .limit(telegramUsers);
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