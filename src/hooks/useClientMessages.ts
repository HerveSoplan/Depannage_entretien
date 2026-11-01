import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';

export function useClientMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async (clientId?: string) => {
    setLoading(true);
    try {
      const data = await db.clientMessages.list(clientId);
      console.log('Messages chargés:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const createMessage = async (messageData: any) => {
    try {
      const newMessage = await db.clientMessages.create(messageData);
      await fetchMessages();
      return newMessage;
    } catch (error) {
      console.error('Erreur création message:', error);
      throw error;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await db.clientMessages.markAsRead(id);
      await fetchMessages();
    } catch (error) {
      console.error('Erreur marquage message:', error);
      throw error;
    }
  };

  const countUnreadMessages = async (clientId: string) => {
    try {
      const { count, error } = await db.clientMessages.countUnread(clientId);
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Erreur comptage messages non lus:', error);
      return 0;
    }
  };

  return {
    messages,
    loading,
    fetchMessages,
    createMessage,
    markAsRead,
    countUnreadMessages
  };
}