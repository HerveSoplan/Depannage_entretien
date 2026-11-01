import { useState, useCallback, useEffect } from 'react';
import { db } from '../lib/supabase';

// --- INTERFACES POUR TYPESCRIPT (Cela corrige les erreurs de types) ---

interface Tache {
  _id: string;
  id?: string;
  // Nouveaux champs obligatoires de la structure SQL
  kit_id: string;
  machine_type: string;
  kit_number: number;
  service_number: number;
  section_id: string;
  section_title: string;
  task_id: string;
  task_label: string;
  task_order: number;
  is_critical?: boolean;
  estimated_duration?: number;
  // Anciens champs pour compatibilité
  idTache?: string;
  section?: string;
  description?: string;
  kitId?: string;
  ordre?: number;
  completed?: boolean;
  completedAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface Kit {
  _id: string;
  id?: string;
  kitId: string;
  nom?: string;
  machineType?: string;
  kitNumber?: number;
  serviceNumber?: number;
  customKitId?: string;
}

interface DbResponseList {
  list: Tache[];
}

interface DbResponseKitList {
  list: Kit[];
}

// ---------------------------------------------------------------------

export function useTachesEntretien() {
  const [loading, setLoading] = useState(false);
  const [tachesEntretien, setTachesEntretien] = useState<Tache[]>([]);

  const fetchTachesByKit = useCallback(async (kitId: string): Promise<Tache[]> => {
    setLoading(true);
    try {
      const result = await (db as any).taches_entretien.list({
        where: { kitId },
        limit: 200
      });
      return (result as DbResponseList).list || [];
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSectionsByKit = useCallback(async (kitId: string) => {
    setLoading(true);
    try {
      const result = await (db as any).taches_entretien.list({
        where: { kitId },
        limit: 200
      });

      const sectionsSet = new Set<string>();
      ((result as DbResponseList).list || []).forEach((tache: Tache) => {
        if (tache.section) {
          sectionsSet.add(tache.section);
        }
      });

      return Array.from(sectionsSet).map(section => ({
        nom: section,
        kitId
      }));
    } catch (error) {
      console.error('Erreur chargement sections:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTachesBySection = useCallback(async (kitId: string, section: string): Promise<Tache[]> => {
    setLoading(true);
    try {
      const result = await (db as any).taches_entretien.list({
        where: { kitId, section },
        limit: 200
      });
      return (result as DbResponseList).list || [];
    } catch (error) {
      console.error('Erreur chargement tâches par section:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const validateAllTasksInSection = useCallback(async (kitId: string, section: string): Promise<boolean> => {
    setLoading(true);
    try {
      const tasks = await fetchTachesBySection(kitId, section);

      const updatePromises = tasks.map((task: Tache) =>
        (db as any).taches_entretien.update(task._id, {
          completed: true,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      );

      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Erreur validation section:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTachesBySection]);

  const getSectionsByKit = useCallback(async (kitId: string) => {
    console.log('🔍 [getSectionsByKit] kitId reçu:', kitId);

    setLoading(true);
    try {
      let taches: Tache[] = [];

      // ==========================================
      // MÉTHODE 1 : Charger le kit et utiliser ses métadonnées
      // ==========================================
      console.log('📦 [Méthode 1] Recherche du kit dans maintenance_kits...');

      try {
        const kitResult = await (db as any).maintenance_kits.list({
          where: { id: kitId },  // Utiliser 'id' au lieu de '_id'
          limit: 1
        }) as DbResponseKitList;

        const kit = kitResult.list && kitResult.list.length > 0 ? kitResult.list[0] : null;

        if (kit) {
          console.log('✅ Kit trouvé:', {
            nom: kit.nom,
            machineType: kit.machineType,
            kitNumber: kit.kitNumber,
            serviceNumber: kit.serviceNumber,
            kitId: kit.kitId
          });

          // Rechercher les tâches avec les champs de la nouvelle structure
          console.log('🔍 [Méthode 1] Recherche avec kit_id, machine_type, kit_number, service_number');
          const result1 = await (db as any).taches_entretien.list({
            where: {
              kit_id: kit.kitId,
              machine_type: kit.machineType,
              kit_number: kit.kitNumber,
              service_number: kit.serviceNumber
            },
            sort: { task_order: 1 },
            limit: 200
          }) as DbResponseList;
          taches = result1.list || [];
          console.log(`→ [Méthode 1] ${taches.length} tâches trouvées`);
        } else {
          console.warn('⚠️ [Méthode 1] Kit introuvable dans maintenance_kits');
        }
      } catch (error) {
        console.warn('⚠️ [Méthode 1] Erreur:', error);
      }

      // ==========================================
      // MÉTHODE 2 : Recherche directe avec l'ObjectId
      // ==========================================
      if (taches.length === 0) {
        console.log('🔍 [Méthode 2] Recherche avec ObjectId =', kitId);
        try {
          const result2 = await (db as any).taches_entretien.list({
            where: { kitId: kitId },
            sort: { ordre: 1 },
            limit: 200
          }) as DbResponseList;
          taches = result2.list || [];
          console.log(`→ [Méthode 2] ${taches.length} tâches trouvées`);
        } catch (error) {
          console.warn('⚠️ [Méthode 2] Erreur:', error);
        }
      }

      // ==========================================
      // MÉTHODE 3 : Recherche partielle (fallback)
      // ==========================================
      if (taches.length === 0) {
        console.log('🔍 [Méthode 3] Recherche partielle...');
        try {
          const kitResult = await (db as any).maintenance_kits.list({
            where: { _id: kitId },
            limit: 1
          }) as DbResponseKitList;

          const kit = kitResult.list && kitResult.list.length > 0 ? kitResult.list[0] : null;

          if (kit && kit.machineType && kit.serviceNumber) {
            console.log('🔍 [Méthode 3] Recherche par pattern:', {
              machineType: kit.machineType,
              serviceNumber: kit.serviceNumber
            });

            const allTasksResult = await (db as any).taches_entretien.list({
              limit: 1000
            }) as DbResponseList;

            const allTasks = allTasksResult.list || [];
            console.log(`📦 [Méthode 3] ${allTasks.length} tâches au total dans la base`);

            if (allTasks.length > 0) {
              const sampleKitIds = [...new Set(allTasks.slice(0, 10).map(t => t.kitId))];
              console.log('📋 [Méthode 3] Exemples de kitId dans la base:', sampleKitIds);
            }

            const machineTypeNormalized = kit.machineType.toLowerCase().replace(/\s+/g, '');
            console.log('🔍 [Méthode 3] Pattern recherché:', machineTypeNormalized, '+ _' + kit.serviceNumber);

            taches = allTasks.filter((task: Tache) => {
              if (!task.kitId) return false;

              const taskKitIdLower = task.kitId.toLowerCase();
              const matchMachine = taskKitIdLower.includes(machineTypeNormalized);
              const matchService = taskKitIdLower.includes(`_${kit.serviceNumber}`);

              if (matchMachine && matchService) {
                console.log('✅ [Méthode 3] Match trouvé:', task.kitId);
                return true;
              }
              return false;
            });

            console.log(`→ [Méthode 3] ${taches.length} tâches trouvées par recherche partielle`);
          } else {
            console.warn('⚠️ [Méthode 3] Kit non trouvé ou données incomplètes');
          }
        } catch (error) {
          console.warn('⚠️ [Méthode 3] Erreur:', error);
        }
      }

      // ==========================================
      // RÉSULTAT FINAL
      // ==========================================
      if (taches.length === 0) {
        console.error('❌ AUCUNE MÉTHODE N\'A TROUVÉ DE TÂCHES');
        console.log('💡 Débug info - kitId recherché:', kitId);
        console.log('💡 Vérifiez dans Administration > taches_entretien que des tâches existent avec ce kitId');
        return [];
      }

      console.log('✅ Total tâches trouvées:', taches.length);

      if (taches.length > 0) {
        console.log('📋 Première tâche:', {
          idTache: taches[0].idTache,
          section: taches[0].section,
          description: taches[0].description,
          kitId: taches[0].kitId
        });
      }

      // ==========================================
      // GROUPEMENT PAR SECTION
      // ==========================================
      const sectionsMap = new Map<string, Tache[]>();
      taches.forEach((tache: Tache) => {
        const sectionTitle = tache.section_title || tache.section || 'Section inconnue';
        if (!sectionsMap.has(sectionTitle)) {
          sectionsMap.set(sectionTitle, []);
        }
        sectionsMap.get(sectionTitle)!.push(tache);
      });

      const finalSections = Array.from(sectionsMap.entries()).map(([nom, tasksInSection]) => ({
        nom,
        count: tasksInSection.length,
        taches: tasksInSection.sort((a, b) => (a.task_order || a.ordre || 0) - (b.task_order || b.ordre || 0))
      }));

      console.log('✅ Sections groupées:', finalSections.length);
      if (finalSections.length > 0) {
        console.log('📋 Sections:', finalSections.map(s => `${s.nom} (${s.count} tâches)`).join(', '));
      }

      return finalSections;

    } catch (error) {
      console.error('❌ Erreur getSectionsByKit:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTachesEntretien = useCallback(async (filters: object = {}): Promise<Tache[]> => {
    setLoading(true);
    try {
      const result = await (db as any).taches_entretien.list({
        where: filters,
        limit: 200
      }) as DbResponseList;
      return result.list || [];
    } catch (error) {
      console.error('Erreur chargement tâches d\'entretien:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ AJOUT POUR ADMIN
  const fetchTachesEntretienForAdmin = useCallback(async () => {
    setLoading(true);
    try {
      // Assure-toi que c'est bien 'list' et non 'select' selon ton wrapper Supabase
      const data = await (db as any).taches_entretien.list() as DbResponseList;
      setTachesEntretien(data.list || []);
    } catch (error) {
      console.error('Erreur:', error);
      setTachesEntretien([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTacheEntretien = useCallback(async (id: string) => {
    try {
      await (db as any).taches_entretien.delete(id);
      await fetchTachesEntretienForAdmin();
    } catch (error) {
      throw error;
    }
  }, [fetchTachesEntretienForAdmin]);

  useEffect(() => {
    fetchTachesEntretienForAdmin();
  }, [fetchTachesEntretienForAdmin]);

  return {
    loading,
    fetchTachesByKit,
    fetchSectionsByKit,
    fetchTachesBySection,
    validateAllTasksInSection,
    getSectionsByKit,
    fetchTachesEntretien,
    tachesEntretien,
    deleteTacheEntretien
  };
}