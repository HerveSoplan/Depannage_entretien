import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';

export function useClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClients = useCallback(async (options: any = {}) => {
    setLoading(true);
    try {
      const data = await db.clients.list(options);
      const list = Array.isArray(data) ? data : (data?.list || []);
      console.log('Clients chargés:', list.length);
      setClients(list);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = async (clientData: any) => {
    try {
      const newClient = await db.clients.create(clientData);
      await fetchClients();
      return newClient;
    } catch (error) {
      console.error('Erreur création client:', error);
      throw error;
    }
  };

  const updateClient = async (id: string, clientData: any) => {
    try {
      await db.clients.update(id, clientData);
      await fetchClients();
    } catch (error) {
      console.error('Erreur mise à jour client:', error);
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await db.clients.delete(id);
      await fetchClients();
    } catch (error) {
      console.error('Erreur suppression client:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient
  };
}
