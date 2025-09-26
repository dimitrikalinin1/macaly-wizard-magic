import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface IncomingMessage {
  id: string;
  telegram_account_id: string;
  from_phone: string;
  from_username?: string;
  from_first_name?: string;
  from_last_name?: string;
  message_text?: string;
  message_type: string;
  chat_id: number;
  message_id: number;
  received_at: string;
  created_at: string;
}

export const useIncomingMessages = () => {
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMessages = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('incoming_messages')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching incoming messages:', error);
    } else {
      setMessages((data || []) as IncomingMessage[]);
    }
    setLoading(false);
  };

  const markAsRead = async (messageId: string) => {
    // В будущем можно добавить поле is_read в таблицу
    console.log('Mark as read:', messageId);
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('incoming_messages')
      .delete()
      .eq('id', messageId);

    if (!error) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    }

    return { error };
  };

  useEffect(() => {
    fetchMessages();
  }, [user]);

  // Подписка на новые сообщения в реальном времени
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('incoming-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'incoming_messages',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New incoming message:', payload);
          setMessages(prev => [payload.new as IncomingMessage, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    messages,
    loading,
    markAsRead,
    deleteMessage,
    refetch: fetchMessages
  };
};