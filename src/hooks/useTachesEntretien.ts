import { useState, useCallback, useEffect } from 'react';
import { db } from '../lib/supabase';
import defaultTachesData from '../data/defaultTachesEntretien.json';

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
      let result = await (db as any).taches_entretien.list({
        where: { kitId },
        limit: 300
      });
      let list = (result as DbResponseList).list || [];
      if (list.length === 0) {
        const kit = await (db as any).maintenance_kits?.get?.(kitId);
        if (kit && kit.kitId && kit.kitId !== kitId) {
          result = await (db as any).taches_entretien.list({
            where: { kitId: kit.kitId },
            limit: 300
          });
          list = (result as DbResponseList).list || [];
        }
      }
      return list;
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
      const list = await fetchTachesByKit(kitId);
      const sectionsSet = new Set<string>();
      list.forEach((tache: Tache) => {
        const sec = tache.section_title || tache.section;
        if (sec) {
          sectionsSet.add(sec);
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
  }, [fetchTachesByKit]);

  const fetchTachesBySection = useCallback(async (kitId: string, section: string): Promise<Tache[]> => {
    setLoading(true);
    try {
      let result = await (db as any).taches_entretien.list({
        where: { kitId, section },
        limit: 300
      });
      let list = (result as DbResponseList).list || [];
      if (list.length === 0) {
        const kit = await (db as any).maintenance_kits?.get?.(kitId);
        if (kit && kit.kitId && kit.kitId !== kitId) {
          result = await (db as any).taches_entretien.list({
            where: { kitId: kit.kitId, section },
            limit: 300
          });
          list = (result as DbResponseList).list || [];
        }
      }
      return list;
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

    if (!kitId) {
      console.warn('⚠️ [getSectionsByKit] kitId vide ou indéfini');
      return [];
    }

    setLoading(true);
    try {
      let taches: Tache[] = [];

      // ==========================================
      // RÉCUPÉRATION DU KIT DANS maintenance_kits
      // ==========================================
      let kit: any = null;
      try {
        if ((db as any).maintenance_kits?.get) {
          kit = await (db as any).maintenance_kits.get(kitId);
        }

        if (!kit) {
          const kitResult = await (db as any).maintenance_kits.list({
            filter: { id: kitId },
            limit: 1
          }) as DbResponseKitList;
          kit = kitResult.list && kitResult.list.length > 0 ? kitResult.list[0] : null;
        }

        if (!kit) {
          const kitResultByCode = await (db as any).maintenance_kits.list({
            filter: { kitId: kitId },
            limit: 1
          }) as DbResponseKitList;
          kit = kitResultByCode.list && kitResultByCode.list.length > 0 ? kitResultByCode.list[0] : null;
        }
      } catch (error) {
        console.warn('⚠️ [getSectionsByKit] Erreur recherche kit:', error);
      }

      // ==========================================
      // MÉTHODE 1 : Recherche des tâches via les infos du kit
      // ==========================================
      if (kit) {
        console.log('✅ Kit trouvé:', {
          nom: kit.nom,
          machineType: kit.machineType,
          kitNumber: kit.kitNumber,
          serviceNumber: kit.serviceNumber,
          kitId: kit.kitId,
          id: kit.id || kit._id
        });

        // 1.a Recherche directe avec le code kit_id officiel
        if (kit.kitId) {
          try {
            const res = await (db as any).taches_entretien.list({
              where: { kitId: kit.kitId },
              sort: { task_order: 1 },
              limit: 300
            }) as DbResponseList;
            taches = res.list || [];
            if (taches.length > 0) {
              console.log(`→ [Méthode 1.a] ${taches.length} tâches trouvées pour kitId = "${kit.kitId}"`);
            }
          } catch (e) {
            console.warn('⚠️ [Méthode 1.a] Erreur:', e);
          }
        }

        // 1.b Recherche avec l'UUID id du kit dans la colonne kit_id
        if (taches.length === 0 && (kit.id || kit._id)) {
          const uuid = kit.id || kit._id;
          try {
            const res = await (db as any).taches_entretien.list({
              where: { kitId: uuid },
              sort: { task_order: 1 },
              limit: 300
            }) as DbResponseList;
            taches = res.list || [];
            if (taches.length > 0) {
              console.log(`→ [Méthode 1.b] ${taches.length} tâches trouvées pour UUID kit = "${uuid}"`);
            }
          } catch (e) {
            console.warn('⚠️ [Méthode 1.b] Erreur:', e);
          }
        }

        // 1.c Recherche par couple machineType + serviceNumber
        if (taches.length === 0 && kit.machineType && kit.serviceNumber) {
          try {
            const res = await (db as any).taches_entretien.list({
              where: {
                machine_type: kit.machineType,
                service_number: kit.serviceNumber
              },
              sort: { task_order: 1 },
              limit: 300
            }) as DbResponseList;
            taches = res.list || [];
            if (taches.length > 0) {
              console.log(`→ [Méthode 1.c] ${taches.length} tâches trouvées pour machineType="${kit.machineType}" et serviceNumber=${kit.serviceNumber}`);
            }
          } catch (e) {
            console.warn('⚠️ [Méthode 1.c] Erreur:', e);
          }
        }
      }

      // ==========================================
      // MÉTHODE 2 : Recherche directe avec le paramètre kitId brut
      // ==========================================
      if (taches.length === 0) {
        console.log('🔍 [Méthode 2] Recherche directe avec kitId brut =', kitId);
        try {
          const result2 = await (db as any).taches_entretien.list({
            where: { kitId: kitId },
            sort: { task_order: 1 },
            limit: 300
          }) as DbResponseList;
          taches = result2.list || [];
          if (taches.length > 0) {
            console.log(`→ [Méthode 2] ${taches.length} tâches trouvées`);
          }
        } catch (error) {
          console.warn('⚠️ [Méthode 2] Erreur:', error);
        }
      }

      // ==========================================
      // MÉTHODE 3 : Recherche partielle / scan avec matching intelligent
      // ==========================================
      if (taches.length === 0) {
        console.log('🔍 [Méthode 3] Recherche intelligente par pattern...');
        try {
          const allTasksResult = await (db as any).taches_entretien.list({
            limit: 1000
          }) as DbResponseList;
          const allTasks = allTasksResult.list || [];

          if (allTasks.length > 0) {
            const targetType = kit?.machineType?.toLowerCase().replace(/\s+/g, '') || '';
            const targetService = kit?.serviceNumber ? `_${kit.serviceNumber}` : '';
            const targetKitIdClean = kitId.toLowerCase().replace(/[^a-z0-9]/g, '');

            taches = allTasks.filter((task: Tache) => {
              const taskKit = (task.kitId || task.kit_id || '').toLowerCase();
              if (!taskKit) return false;

              // Match direct de sous-chaîne avec kitId
              if (taskKit.includes(targetKitIdClean) || targetKitIdClean.includes(taskKit.replace(/[^a-z0-9]/g, ''))) {
                return true;
              }

              // Match avec machineType et serviceNumber
              if (targetType && targetService) {
                const normalizedTaskKit = taskKit.replace(/\s+/g, '');
                if (normalizedTaskKit.includes(targetType) && normalizedTaskKit.includes(targetService)) {
                  return true;
                }
              }

              return false;
            });

            console.log(`→ [Méthode 3] ${taches.length} tâches trouvées par filtrage intelligent`);
          }
        } catch (error) {
          console.warn('⚠️ [Méthode 3] Erreur:', error);
        }
      }

      // ==========================================
      // MÉTHODE 4 : Repli de secours sur le catalogue standard embarqué
      // ==========================================
      if (taches.length === 0 && defaultTachesData && defaultTachesData.length > 0) {
        console.log('🔄 [Méthode 4] Repli sur les tâches d\'entretien standards embarquées...');
        const targetType = (kit?.machineType || '').toLowerCase().replace(/\s+/g, '');
        const targetService = kit?.serviceNumber ? Number(kit.serviceNumber) : null;
        const targetKitIdClean = kitId.toLowerCase().replace(/[^a-z0-9]/g, '');

        taches = (defaultTachesData as any[]).filter((task: any) => {
          const taskKit = (task.kit_id || task.kitId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (taskKit && (taskKit.includes(targetKitIdClean) || targetKitIdClean.includes(taskKit))) {
            return true;
          }
          if (targetType && targetService) {
            const mType = (task.machine_type || task.machineType || '').toLowerCase().replace(/\s+/g, '');
            const sNum = Number(task.service_number || task.serviceNumber);
            if (mType.includes(targetType) && sNum === targetService) {
              return true;
            }
          }
          return false;
        }).map((t: any) => ({
          ...t,
          _id: t.id || t.taskId || t.task_id || `std_${Math.random()}`,
          idTache: t.taskId || t.task_id || t.idTache,
          taskId: t.taskId || t.task_id || t.idTache,
          kitId: t.kit_id || t.kitId || kitId,
          section: t.section_title || t.section || 'Général',
          sectionTitle: t.section_title || t.section || 'Général',
          description: t.task_label || t.description || '',
          taskLabel: t.task_label || t.description || '',
          ordre: t.task_order ?? t.ordre ?? 1,
          taskOrder: t.task_order ?? t.ordre ?? 1
        }));

        if (taches.length > 0) {
          console.log(`→ [Méthode 4] ${taches.length} tâches standards chargées avec succès`);
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
      const options: any = { limit: 1000 };
      if (filters && Object.keys(filters).length > 0) {
        options.where = filters;
      }
      const result = await (db as any).taches_entretien.list(options);
      const rawList = Array.isArray(result) ? result : (result?.list || []);
      const normalized = rawList.map((item: any) => {
        const id = item.id || item._id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const taskId = item.taskId || item.task_id || item.idTache || id;
        const kitId = item.kitId || item.kit_id || '';
        const section = item.sectionTitle || item.section_title || item.section || 'Section générale';
        const description = item.taskLabel || item.task_label || item.description || '';
        const ordre = item.taskOrder ?? item.task_order ?? item.ordre ?? 0;
        const machineType = item.machineType || item.machine_type || '';

        return {
          ...item,
          _id: id,
          id: id,
          taskId,
          task_id: taskId,
          idTache: taskId,
          kitId,
          kit_id: kitId,
          section,
          sectionTitle: section,
          section_title: section,
          description,
          taskLabel: description,
          task_label: description,
          ordre,
          taskOrder: ordre,
          task_order: ordre,
          machineType,
          machine_type: machineType
        };
      });

      setTachesEntretien(normalized);
      return normalized;
    } catch (error) {
      console.error('Erreur chargement tâches d\'entretien:', error);
      setTachesEntretien([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ AJOUT POUR ADMIN
  const fetchTachesEntretienForAdmin = useCallback(async () => {
    return await fetchTachesEntretien();
  }, [fetchTachesEntretien]);

  const deleteTacheEntretien = useCallback(async (id: string) => {
    try {
      await (db as any).taches_entretien.delete(id);
      await fetchTachesEntretien();
    } catch (error) {
      throw error;
    }
  }, [fetchTachesEntretien]);

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