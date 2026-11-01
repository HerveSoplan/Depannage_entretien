// src/screens/interventions/MultiMachineSectionSelectionScreen.tsx

import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {ArrowLeft, Wrench} from 'lucide-react';
import { useMachines } from '../../hooks/useMachines';
import { useTachesEntretien } from '../../hooks/useTachesEntretien';
import { useInterventions } from '../../hooks/useInterventions';
import { useUsers } from '../../hooks/useUsers';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
  clientId: string;
  machineKitSelections: Array<{ machineId: string; kitId: string }>;
  updatedSectionsData?: Record<string, any[]>;
  resumeInterventionId?: string; // ✅ NOUVEAU
  savedSectionsState?: any[]; // ✅ NOUVEAU
}

export function MultiMachineSectionSelectionScreen({ 
  onNavigate, 
  clientId, 
  machineKitSelections,
  updatedSectionsData,
  resumeInterventionId, // ✅ NOUVEAU
  savedSectionsState // ✅ NOUVEAU
}: Props) {
  const [machines, setMachines] = useState<any[]>([]);
  const [sectionsData, setSectionsData] = useState<Record<string, any[]>>({});
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  
  const { getMachineById } = useMachines();
  const { getSectionsByKit, fetchTachesBySection } = useTachesEntretien();
  const { createIntervention } = useInterventions();
  const { users, fetchUsers } = useUsers();
const [currentUser, setCurrentUser] = useState<any>(null);

useEffect(() => {
  const loadCurrentUser = async () => {
    await fetchUsers({ limit: 100 });
    // Récupérer l'utilisateur connecté (à adapter selon ton système)
    const user = users[0]; // ⚠️ À ADAPTER
    setCurrentUser(user);
    console.log('👤 Utilisateur chargé:', user);
  };
  loadCurrentUser();
}, []);
  
  const peutValiderSection = (role: string) => {
    return ['Chef Technicien CMS', 'Chef Technicien VMS', 'Responsable Technique', 'Directeur', 'Administrateur'].includes(role);
  };

useEffect(() => {
  const loadData = async () => {
    setLoading(true);

    const machinesData = await Promise.all(
      machineKitSelections.map(sel => getMachineById(sel.machineId))
    );
    setMachines(machinesData.filter(Boolean));

    // ✅ CAS 1 : Reprise d'intervention (on charge TOUT le kit + on applique les tâches complétées)
    if (resumeInterventionId && savedSectionsState) {
      console.log('✅ [REPRISE INTERVENTION] Chargement complet du kit');
      
      const sectionsMap: Record<string, any[]> = {};
      const restoredSelections: Record<string, string[]> = {}; // ✅ NOUVEAU
      
      for (const sel of machineKitSelections) {
        // Charger TOUTES les sections du kit
        const allSections = await getSectionsByKit(sel.kitId);
        
        // ✅ NOUVEAU : Identifier les sections qui étaient cochées
        const selectedSectionNames: string[] = [];
        
        // Pour chaque section, restaurer les tâches complétées
        const sectionsWithProgress = allSections.map(section => {
          // Chercher si cette section était dans les sections sauvegardées
          const savedSection = savedSectionsState.find(
            (s: any) => s.machineId === sel.machineId && s.sectionName === section.nom
          );
          
          if (savedSection) {
            // ✅ Cette section était cochée : on la rajoute
            selectedSectionNames.push(section.nom);
            
            // Appliquer les tâches complétées
            const tachesWithProgress = section.taches?.map((tache: any) => {
              const savedTask = savedSection.tasks?.find(
                (t: any) => t.id === tache.idTache || t.id === tache.id || t.description === tache.description
              );
              
              if (savedTask) {
                return {
                  ...tache,
                  completed: savedTask.completed || false,
                  completedAt: savedTask.completedAt || null
                };
              }
              
              return {
                ...tache,
                completed: false,
                completedAt: null
              };
            }) || [];
            
            return { ...section, taches: tachesWithProgress };
          }
          
          // Section non encore validée : toutes les tâches à false
          return {
            ...section,
            taches: section.taches?.map((tache: any) => ({
              ...tache,
              completed: false,
              completedAt: null
            })) || []
          };
        });
        
        sectionsMap[sel.machineId] = sectionsWithProgress;
        restoredSelections[sel.machineId] = selectedSectionNames; // ✅ NOUVEAU
      }
      
      console.log('✅ Sections chargées avec progression:', sectionsMap);
      console.log('✅ Selections restaurées:', restoredSelections);
      
      setSectionsData(sectionsMap);
      setSelections(restoredSelections); // ✅ NOUVEAU : Restaurer les sections cochées
      setLoading(false);
      return;
    }

    // ✅ CAS 2 : Retour depuis TaskExecution (conservation des données)
    if (updatedSectionsData && Object.keys(updatedSectionsData).length > 0) {
      console.log('✅ [RETOUR] Données reçues, conservation des coches');
      console.log('📦 updatedSectionsData:', updatedSectionsData);
      setSectionsData(updatedSectionsData);
      setLoading(false);
      return;
    }

    // ✅ CAS 3 : Nouvelle intervention (sections vides)
    console.log('🔄 [NOUVELLE INTERVENTION] Chargement des sections vides');
    setSectionsData({});
    setSelections({});
    
    const sectionsMap: Record<string, any[]> = {};
    const initialSelections: Record<string, string[]> = {};

    for (const sel of machineKitSelections) {
      const sections = await getSectionsByKit(sel.kitId);
      initialSelections[sel.machineId] = [];

      const sectionsVierges = sections.map(section => ({
        ...section,
        taches: section.taches?.map((tache: any) => ({
          ...tache,
          completed: false,
          completedAt: null
        })) || []
      }));
      sectionsMap[sel.machineId] = sectionsVierges;
    }

    setSectionsData(sectionsMap);
    setSelections(initialSelections);
    setLoading(false);
  };
  loadData();
}, [machineKitSelections, updatedSectionsData, resumeInterventionId, savedSectionsState]);


  // ✅ CORRECTION : Ne pas mettre à jour automatiquement lors d'une reprise
useEffect(() => {
  // ✅ Si on est en mode reprise, ne pas écraser les selections
  if (resumeInterventionId) {
    console.log('⏭️ Mode reprise : conservation des selections restaurées');
    return;
  }

  const newSelections: Record<string, string[]> = {};

  Object.keys(sectionsData).forEach(machineId => {
    const sections = sectionsData[machineId];
    const selectedSectionNames: string[] = [];

    sections.forEach(section => {
      const allTasksCompleted = section.taches &&
          section.taches.length > 0 &&
          section.taches.every((t: any) => t.completed === true);

      if (allTasksCompleted) {
        selectedSectionNames.push(section.nom);
      }
    });

    newSelections[machineId] = selectedSectionNames;
  });

  setSelections(newSelections);
}, [sectionsData, resumeInterventionId]); // ✅ Ajout de resumeInterventionId


  const validerTachesDeLaSection = async (machineId: string, kitId: string, nomSection: string) => {
    try {
      const taches = await fetchTachesBySection(kitId, nomSection);
      console.log(`✅ Validation de ${taches.length} tâches pour "${nomSection}"`);
      
      setSectionsData(prevData => {
        const newData = JSON.parse(JSON.stringify(prevData));
        const sections = newData[machineId] || [];
        const updatedSections = sections.map((section: any) => {
          if (section.nom === nomSection) {
            const updatedTaches = section.taches.map((t: any) => ({ 
              ...t, 
              completed: true,
              completedAt: new Date().toISOString()
            }));
            return { ...section, taches: updatedTaches };
          }
          return section;
        });
        newData[machineId] = updatedSections;
        return newData;
      });

    } catch (error) {
      console.error('Erreur validation section:', error);
    }
  };

  const handleSectionToggle = async (machineId: string, sectionName: string) => {
    const isSelected = selections[machineId]?.includes(sectionName);
    const kitId = machineKitSelections.find(s => s.machineId === machineId)?.kitId || '';
    
    if (isSelected) {
      console.log(`🔄 Décochage de la section "${sectionName}"`);
      setSectionsData(prevData => {
        const newData = JSON.parse(JSON.stringify(prevData));
        const sections = newData[machineId] || [];
        const updatedSections = sections.map((section: any) => {
          if (section.nom === sectionName) {
            const updatedTaches = section.taches.map((t: any) => ({ 
              ...t, 
              completed: false,
              completedAt: null 
            }));
            return { ...section, taches: updatedTaches };
          }
          return section;
        });
        newData[machineId] = updatedSections;
        return newData;
      });
    } else {
      console.log(`✅ Cochage de la section "${sectionName}"`);
      await validerTachesDeLaSection(machineId, kitId, sectionName);
    }
  };

  const handleValiderSectionEntiere = async (machineId: string, kitId: string, nomSection: string) => {
    await validerTachesDeLaSection(machineId, kitId, nomSection);
  };

  const getTotalAndCompletedTasks = () => {
    let total = 0;
    let completed = 0;
    
    machineKitSelections.forEach(sel => {
      const sections = sectionsData[sel.machineId] || [];
      const selectedSectionNames = selections[sel.machineId] || [];
      
      sections
        .filter(s => selectedSectionNames.includes(s.nom))
        .forEach(section => {
          const tasks = section.taches || [];
          total += tasks.length;
          completed += tasks.filter((t: any) => t.completed).length;
        });
    });
    
    return { total, completed };
  };

  const { total: totalTasksCount, completed: completedCount } = getTotalAndCompletedTasks();

  // ✅ NOUVELLE FONCTION : Vérifier que TOUTES les sections sont cochées
  const areAllSectionsSelected = () => {
    for (const sel of machineKitSelections) {
      const sections = sectionsData[sel.machineId] || [];
      const selectedSectionNames = selections[sel.machineId] || [];
      
      // Si le nombre de sections cochées != nombre total de sections
      if (selectedSectionNames.length !== sections.length) {
        return false;
      }
    }
    
    return true;
  };

  // ✅ Vérifier si TOUTES les tâches des sections cochées sont complétées
  const isAllTasksCompleted = () => {
    if (totalTasksCount === 0) return false;
    return completedCount === totalTasksCount;
  };

  // ✅ NOUVELLE FONCTION : Tout est prêt pour clôturer
  const canCloturer = () => {
    return areAllSectionsSelected() && isAllTasksCompleted();
  };

  const handleSaveAsDraft = async () => {
    const hasSelections = machineKitSelections.some(sel => 
      selections[sel.machineId] && selections[sel.machineId].length > 0
    );
    
    if (!hasSelections) {
      alert('⚠️ Veuillez sélectionner au moins une section avant d\'enregistrer');
      return;
    }
    
    try {
      console.log('💾 [1/6] Enregistrement du brouillon...');
      
      const finalClientId = clientId || (machines && machines.length > 0 ? machines[0]?.clientId : null);
      
      if (!finalClientId) {
        alert('❌ Erreur: Client non trouvé');
        return;
      }
      
      console.log('✅ [2/6] ClientId validé:', finalClientId);

      const selectedSectionsData = machineKitSelections.map(sel => {
        const machine = machines.find(m => m._id === sel.machineId);
        const sections = sectionsData[sel.machineId] || [];
        const selectedSectionNames = selections[sel.machineId] || [];
        
        const machineSections = sections
          .filter(s => selectedSectionNames.includes(s.nom))
          .map(section => ({
            machineId: sel.machineId,
            machineName: machine?.nom || '',
            sectionName: section.nom,
            tasks: section.taches?.map((t: any) => ({
              id: t.idTache || t.id,
              description: t.description,
              completed: t.completed || false,
              completedAt: t.completedAt || null,
              ordre: t.ordre || 0,
              refPiece: t.refPiece,
              quantite: t.quantite,
              module: t.module
            })) || []
          }));
        
        return machineSections;
      }).flat();

      console.log('✅ [3/6] Sections préparées:', selectedSectionsData.length);

      const { total, completed } = getTotalAndCompletedTasks();
      const progression = total > 0 ? Math.round((completed / total) * 100) : 0;

      console.log('✅ [4/6] Progression:', `${completed}/${total} (${progression}%)`);

     const now = new Date();
const userId = currentUser?._id || users?.[0]?._id || '000';
const numeroTechnicien = userId.toString().slice(-3);
const numeroIntervention = 
  now.getFullYear().toString() +
  (now.getMonth() + 1).toString().padStart(2, '0') +
  now.getDate().toString().padStart(2, '0') +
  now.getHours().toString().padStart(2, '0') +
  now.getMinutes().toString().padStart(2, '0') +
  numeroTechnicien;

const interventionData = {
  type: 'MAINTENANCE',
  numeroIntervention,
  clientId: finalClientId,
        machineIds: machineKitSelections.map(s => s.machineId),
        userId: currentUser?._id,
        technicianName: currentUser?.name,
        status: 'EN_COURS',
        statut: 'EN_COURS',
        progress: progression,
        createdAt: new Date().toISOString(),
        selectedSections: selectedSectionsData,
        kits: machineKitSelections.map(sel => {
          const machine = machines.find(m => m._id === sel.machineId);
          return {
            machineId: sel.machineId,
            machineName: machine?.nom,
            kitId: sel.kitId
          };
        }),
        totalTasks: total,
        completedTasks: completed,
        actionsRealisees: `Entretien en cours - ${completed}/${total} tâches complétées (${progression}%)`,
        diagnostic: `Sections: ${selectedSectionsData.map(s => s.sectionName).join(', ')}`
      };

      console.log('💾 [5/6] Appel createIntervention...');

      const newIntervention = await createIntervention(interventionData);
      
      console.log('✅ [6/6] Intervention enregistrée:', newIntervention);
      
      if (!newIntervention || !newIntervention._id) {
        throw new Error('Pas d\'_id retourné');
      }
      
      console.log('🎉 ID intervention:', newIntervention._id);
      
      alert(`✅ Intervention enregistrée avec succès !\n\nID: ${newIntervention._id}\nProgression: ${progression}%\nTâches: ${completed}/${total}\n\nVous pouvez la reprendre à tout moment depuis la page client.`);
      
      console.log('🚀 Navigation vers client-detail');
      onNavigate('client-detail', { clientId: finalClientId });
      
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      alert(`❌ Erreur lors de l'enregistrement:\n${error.message}`);
    }
  };

  // ✅ CORRECTION : Clôturer UNIQUEMENT si TOUTES sections cochées + TOUTES tâches complétées
  const handleCloturer = async () => {
    const hasSelections = machineKitSelections.some(sel => 
      selections[sel.machineId] && selections[sel.machineId].length > 0
    );
    
    if (!hasSelections) {
      alert('⚠️ Veuillez sélectionner au moins une section avant de clôturer');
      return;
    }
    
    // ✅ Vérifier que TOUTES les sections sont cochées
    if (!areAllSectionsSelected()) {
      const totalSections = machineKitSelections.reduce((sum, sel) => {
        return sum + (sectionsData[sel.machineId]?.length || 0);
      }, 0);
      
      const selectedSectionsCount = Object.values(selections).reduce((sum, arr) => sum + arr.length, 0);
      
      alert(
        `❌ Impossible de clôturer l'intervention\n\nVous devez cocher TOUTES les sections.\n\nSections cochées : ${selectedSectionsCount}/${totalSections}\n\n💡 Utilisez le bouton "💾 Enregistrer" pour sauvegarder votre progression.`
      );
      return;
    }
    
    // ✅ Vérifier que TOUTES les tâches sont complétées
    const { total, completed } = getTotalAndCompletedTasks();
    const progression = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    if (progression < 100) {
      alert(
        `❌ Impossible de clôturer l'intervention\n\nVous devez compléter TOUTES les tâches de TOUTES les sections.\n\nProgression : ${completed}/${total} tâches (${progression}%)\n\n💡 Utilisez le bouton "💾 Enregistrer" pour sauvegarder.`
      );
      return;
    }
    
    try {
      console.log('💾 Début de la clôture...');
      
      const finalClientId = clientId || (machines && machines.length > 0 ? machines[0]?.clientId : null);
      
      if (!finalClientId) {
        alert('❌ Erreur: Client non trouvé');
        return;
      }

      const selectedSectionsData = machineKitSelections.map(sel => {
        const machine = machines.find(m => m._id === sel.machineId);
        const sections = sectionsData[sel.machineId] || [];
        const selectedSectionNames = selections[sel.machineId] || [];
        
        const machineSections = sections
          .filter(s => selectedSectionNames.includes(s.nom))
          .map(section => ({
            machineId: sel.machineId,
            machineName: machine?.nom || '',
            sectionName: section.nom,
            tasks: section.taches?.map((t: any) => ({
              id: t.idTache || t.id,
              description: t.description,
              completed: t.completed || false,
              completedAt: t.completedAt || null,
              ordre: t.ordre || 0,
              refPiece: t.refPiece,
              quantite: t.quantite,
              module: t.module
            })) || []
          }));
        
        return machineSections;
      }).flat();

     const now = new Date();
const userId = currentUser?._id || users?.[0]?._id || '000';
const numeroTechnicien = userId.toString().slice(-3);
const numeroIntervention = 
  now.getFullYear().toString() +
  (now.getMonth() + 1).toString().padStart(2, '0') +
  now.getDate().toString().padStart(2, '0') +
  now.getHours().toString().padStart(2, '0') +
  now.getMinutes().toString().padStart(2, '0') +
  numeroTechnicien;

const interventionData = {
  type: 'MAINTENANCE',
  numeroIntervention,
  clientId: finalClientId,
        machineIds: machineKitSelections.map(s => s.machineId),
        userId: currentUser?._id,
        technicianName: currentUser?.name,
        status: 'terminé',
        statut: 'TERMINEE',
        progress: 100,
        createdAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        selectedSections: selectedSectionsData,
        kits: machineKitSelections.map(sel => {
          const machine = machines.find(m => m._id === sel.machineId);
          return {
            machineId: sel.machineId,
            machineName: machine?.nom,
            kitId: sel.kitId
          };
        }),
        totalTasks: total,
        completedTasks: completed,
        actionsRealisees: `Entretien 100% complété - ${completed}/${total} tâches`,
        diagnostic: `Sections: ${selectedSectionsData.map(s => s.sectionName).join(', ')}`
      };

      const newIntervention = await createIntervention(interventionData);
      
      alert(`✅ Intervention clôturée avec succès !\n\nProgression: 100%\nTâches: ${completed}/${total}`);
      
      onNavigate('client-detail', { clientId: finalClientId });
      
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      alert(`❌ Erreur:\n${error.message}`);
    }
  };

  if (loading) {
    return (
      <Card className="text-center py-12">
        <p>Chargement des sections d'entretien...</p>
      </Card>
    );
  }

  return (
    <div key={`sections-${machineKitSelections.map(s => s.kitId).join('-')}`} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => onNavigate('multi-machine-kit-selection', { 
            clientId, 
            machineIds: machineKitSelections.map(s => s.machineId) 
          })}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sélection des Sections d'Entretien</h1>
          <p className="text-gray-600 mt-1">Choisissez les sections à effectuer pour chaque machine.</p>
        </div>
      </div>

      {machines.map((machine) => {
        const selection = machineKitSelections.find(s => s.machineId === machine._id);
        if (!selection) return null;

        const sections = sectionsData[machine._id] || [];
        const selectedSections = selections[machine._id] || [];

        return (
          <Card key={machine._id}>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench size={20} />
              {machine.nom} - {machine.numeroSerie}
            </h2>

            {sections.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-3">Sections disponibles :</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sections.map(section => {
                    const { nom, count, taches } = section;
                    const isSelected = selectedSections.includes(nom);
                    const nombreValidees = taches?.filter((t: any) => t.completed).length || 0;
                    
                    return (
                      <div
                        key={nom}
                        className={`p-4 border rounded-lg transition-colors ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSectionToggle(machine._id, nom)}
                              className="mr-3 h-5 w-5 text-blue-600 cursor-pointer"
                            />
                            <span 
                              className="font-medium text-gray-900 cursor-pointer flex-1"
                              onClick={() => onNavigate('task-execution', { 
                                machineId: machine._id, 
                                kitId: selection.kitId, 
                                sectionName: nom,
                                sectionsData: sectionsData[machine._id],
                                machineKitSelections: machineKitSelections,
                                clientId: clientId
                              })}
                            >
                              {nom}
                            </span>
                          </div>
                          
                          {peutValiderSection(currentUser?.role || '') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleValiderSectionEntiere(machine._id, selection.kitId, nom);
                              }}
                              className="text-xs flex-shrink-0"
                            >
                              Valider tout
                            </Button>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Progression : {nombreValidees} / {count} tâches validées
                          </p>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-green-500 transition-all duration-300"
                              style={{ width: `${count > 0 ? (nombreValidees / count) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-blue-600 font-medium cursor-pointer"
                            onClick={() => onNavigate('task-execution', { 
                              machineId: machine._id, 
                              kitId: selection.kitId, 
                              sectionName: nom,
                              sectionsData: sectionsData[machine._id],
                              machineKitSelections: machineKitSelections,
                              clientId: clientId
                            })}
                          >
                            Cliquez pour voir les tâches
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-red-600">Aucune section d'entretien trouvée pour ce kit.</p>
            )}
          </Card>
        );
      })}

      {/* Boutons d'action */}
      <div className="flex justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          <p>Sections : {Object.values(selections).reduce((sum, arr) => sum + arr.length, 0)}/{machineKitSelections.reduce((sum, sel) => sum + (sectionsData[sel.machineId]?.length || 0), 0)} cochées</p>
          <p>Tâches : {completedCount}/{totalTasksCount} complétées
            {totalTasksCount > 0 && ` (${Math.round((completedCount / totalTasksCount) * 100)}%)`}
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Bouton Enregistrer */}
          <Button
            variant="secondary"
            onClick={handleSaveAsDraft}
            disabled={!machineKitSelections.some(sel => selections[sel.machineId]?.length > 0)}
          >
            💾 Enregistrer
          </Button>
          
          {/* Bouton Clôturer (UNIQUEMENT si TOUTES sections + TOUTES tâches) */}
          <Button 
            onClick={handleCloturer}
            disabled={!canCloturer()}
            className={`${
              canCloturer() 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={
              !areAllSectionsSelected() 
                ? `Cochez toutes les sections pour clôturer` 
                : !isAllTasksCompleted()
                ? `Complétez toutes les tâches pour clôturer (${completedCount}/${totalTasksCount})`
                : 'Clôturer l\'intervention'
            }
          >
            {canCloturer() ? '✅ Clôturer' : '🔒 Clôturer'} ({completedCount}/{totalTasksCount})
          </Button>
        </div>
      </div>
    </div>
  );
}
