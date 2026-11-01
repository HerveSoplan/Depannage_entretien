//useMaintenanceKits.ts
import { useState, useCallback } from 'react';
import { db } from '../lib/supabase';

export function useMaintenanceKits() {
  const [maintenanceKits, setMaintenanceKits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fonction 1 : fetchMaintenanceKits
  const fetchMaintenanceKits = useCallback(async (filter?: any) => {
    setLoading(true);
    try {
      const result = await db.maintenance_kits.list({
        filter: { ...filter },
        // sort: { kitNumber: 1 }
      });
      // Gérer le format { list, count }
      setMaintenanceKits(result.list || (Array.isArray(result) ? result : []));
    } catch (error) {
      console.error('Erreur chargement kits:', error);
      setMaintenanceKits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Fonction 2 : getKitsByMachineType
  const getKitsByMachineType = useCallback(async (machineType: string) => {
    setLoading(true);
    try {
      const result = await db.maintenance_kits.list({
        filter: { machineType, actif: true },
        // sort: { kitNumber: 1 } 
      });
      return result.list || (Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Erreur chargement kits:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 🆕 Fonction 3 : getKitsByMachineModels (AJOUTÉE ICI, AVANT LE RETURN)
  const getKitsByMachineModels = useCallback(async (machineModels: string[]) => {


    setLoading(true);
    try {
      // 1. Normaliser les modèles recherchés (minuscule, sans espaces)
      const searchTokens = machineModels
        .filter(m => m && typeof m === 'string')
        .flatMap(m => m.toLowerCase().split(/[\s/\-_]+/)) // Split par espaces, /, -, _
        .filter(t => t.length > 2) // Ignorer tokens trop courts (ex: v, 1, a) sauf si V300 ? V300 len=4.
        .map(t => t.trim());



      // 2. Charger TOUS les kits actifs
      const result = await db.maintenance_kits.list({
        filter: { actif: true },
        // sort: { kitNumber: 1 } // CAUSE ERREUR 400 - On désactive le tri serveur pour l'instant
      });

      const allKits = result.list || (Array.isArray(result) ? result : []);


      // 3. Filtrer en JS avec matching par tokens
      const matchingKits = allKits.filter((kit: any) => {
        if (!kit.machineType) return false;

        const kitTypeRaw = kit.machineType.toLowerCase();
        // Tokens du kit
        const kitTokens = kitTypeRaw.split(/[\s/\-_]+/).filter((t: string) => t.length > 1);

        // Vérifier intersection
        const hasMatch = kitTokens.some((kToken: string) =>
          searchTokens.some(sToken => kToken.includes(sToken) || sToken.includes(kToken))
        );



        return hasMatch;
      });


      return matchingKits;

    } catch (error) {
      console.error('❌ Erreur chargement kits:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Fonction Create
  const createMaintenanceKit = useCallback(async (kitData: any) => {
    setLoading(true);
    try {
      // Conversion camelCase -> snake_case gérée par db.maintenance_kits.create ?
      // Supposons que db gère ou que kitData soit déjà bon.
      // Dans le doute, on passe kitData tel quel, supabase.ts s'en charge.
      const newKit = await db.maintenance_kits.create(kitData);
      await fetchMaintenanceKits();
      return newKit;
    } catch (error) {
      console.error('Erreur création kit:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchMaintenanceKits]);

  // ✅ Fonction Update
  const updateMaintenanceKit = useCallback(async (id: string, kitData: any) => {
    setLoading(true);
    try {
      await db.maintenance_kits.update(id, kitData);
      await fetchMaintenanceKits();
    } catch (error) {
      console.error('Erreur mise à jour kit:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchMaintenanceKits]);

  // ✅ Fonction Delete
  const deleteMaintenanceKit = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await db.maintenance_kits.delete(id);
      await fetchMaintenanceKits();
    } catch (error) {
      console.error('Erreur suppression kit:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchMaintenanceKits]);


  // ✅ RETURN ICI (avec les 3 fonctions exportées)
  return {
    maintenanceKits,
    loading,
    fetchMaintenanceKits,
    getKitsByMachineType,
    getKitsByMachineModels,
    createMaintenanceKit,
    updateMaintenanceKit,
    deleteMaintenanceKit
  };
}
