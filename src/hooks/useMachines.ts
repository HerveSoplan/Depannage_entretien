import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';

export function useMachines() {
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMachines = useCallback(async (options: any = {}) => {
    setLoading(true);
    try {
      const result = await db.machines.list(options);
      // Gérer le format { list, count } retourné par la nouvelle implémentation
      const machinesList = result.list || (Array.isArray(result) ? result : []);
      console.log('Machines chargées:', machinesList.length);
      setMachines(machinesList);
    } catch (error) {
      console.error('Erreur chargement machines:', error);
      setMachines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMachinesByClient = useCallback(async (clientId: string) => {
    try {
      const data = await db.machines.getByClient(clientId);
      return data || [];
    } catch (error) {
      console.error('Erreur chargement machines client:', error);
      return [];
    }
  }, []);

  const getMachineById = useCallback(async (id: string) => {
    try {
      const data = await db.machines.get(id);
      return data;
    } catch (error) {
      console.error('Erreur chargement machine:', error);
      return null;
    }
  }, []);

  const createMachine = useCallback(async (machineData: any) => {
    try {
      const newMachine = await db.machines.create(machineData);
      await fetchMachines();
      return newMachine;
    } catch (error) {
      console.error('Erreur création machine:', error);
      throw error;
    }
  }, [fetchMachines]);

  const updateMachine = useCallback(async (id: string, machineData: any) => {
    try {
      await db.machines.update(id, machineData);
      await fetchMachines();
    } catch (error) {
      console.error('Erreur mise à jour machine:', error);
      throw error;
    }
  }, [fetchMachines]);

  const deleteMachine = useCallback(async (id: string) => {
    try {
      await db.machines.delete(id);
      await fetchMachines();
    } catch (error) {
      console.error('Erreur suppression machine:', error);
      throw error;
    }
  }, [fetchMachines]);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  return {
    machines,
    loading,
    fetchMachines,
    getMachinesByClient,
    getMachineById,
    createMachine,
    updateMachine,
    deleteMachine
  };
}