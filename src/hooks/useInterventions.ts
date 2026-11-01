import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';

export function useInterventions() {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInterventions = async () => {
    setLoading(true);
    try {
      const data = await db.interventions.list();
      console.log('Interventions chargées:', data);
      setInterventions(data || []);
    } catch (error) {
      console.error('Erreur chargement interventions:', error);
      setInterventions([]);
    } finally {
      setLoading(false);
    }
  };

  const getIntervention = async (id: string) => {
    try {
      const data = await db.interventions.get(id);
      return data;
    } catch (error) {
      console.error('Erreur chargement intervention:', error);
      return null;
    }
  };

  const createIntervention = async (interventionData: any) => {
    try {
      const newIntervention = await db.interventions.create(interventionData);
      await fetchInterventions();
      return newIntervention;
    } catch (error) {
      console.error('Erreur création intervention:', error);
      throw error;
    }
  };

  const updateIntervention = async (id: string, interventionData: any) => {
    try {
      await db.interventions.update(id, interventionData);
      await fetchInterventions();
    } catch (error) {
      console.error('Erreur mise à jour intervention:', error);
      throw error;
    }
  };

  const deleteIntervention = async (id: string) => {
    try {
      await db.interventions.delete(id);
      await fetchInterventions();
    } catch (error) {
      console.error('Erreur suppression intervention:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  return {
    interventions,
    loading,
    fetchInterventions,
    getIntervention,
    createIntervention,
    updateIntervention,
    deleteIntervention
  };
}