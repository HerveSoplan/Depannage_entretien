// src/screens/interventions/InstallationProtocolScreen.tsx
// Protocole de montage & Suivi / Calcul des heures
// Vue globale des montages et vue détaillée d'un chantier de montage

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Plus,
  MapPin,
  X,
  Clock,
  Hammer,
  Search,
  Filter,
  Users,
  Wrench,
  FileText,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useMachines } from '../../hooks/useMachines';
import { useUsers } from '../../hooks/useUsers';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { db } from '../../lib/supabase';
import { getCurrentPosition } from '../../utils/geoUtils';
import { GPSTrackingAlert } from '../../components/installation/GPSTrackingAlert';
import { MachineTasksView } from '../installation/MachineTasksView';
import { AddMachineModal } from '../../components/installation/AddMachineModal';
import { sendInstallationReportToResponsable } from '../../services/installationReportService';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const genId = (): string => Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

const formatHeures = (heures: number) => {
  const h = Math.floor(heures || 0);
  const m = Math.round(((heures || 0) - h) * 60);
  return m > 0 ? `${h}h ${m.toString().padStart(2, '0')}min` : `${h}h 00min`;
};

// Générer le numéro d'intervention au format AAAAMMJJHHXXX
const genererNumeroIntervention = (userId: string): string => {
  const now = new Date();
  const annee = now.getFullYear().toString();
  const mois = (now.getMonth() + 1).toString().padStart(2, '0');
  const jour = now.getDate().toString().padStart(2, '0');
  const heure = now.getHours().toString().padStart(2, '0');
  const userCode = (userId || '000').slice(-3).padStart(3, '0');
  return `${annee}${mois}${jour}${heure}${userCode}`;
};

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════
interface InstallationProtocolScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  interventionId?: string;
  clientId?: string;
  machineId?: string;
  readOnly?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export function InstallationProtocolScreen({
  onNavigate,
  interventionId: propInterventionId,
  clientId: propClientId,
  machineId: propMachineId,
  readOnly = false
}: InstallationProtocolScreenProps) {
  const { clients, fetchClients } = useClients();
  const { machines: allMachines, fetchMachines } = useMachines();
  const { users: utilisateurs, fetchUsers } = useUsers();
  const { currentUser } = useCurrentUser();

  // Mode actif : soit sélectionné via prop, soit choisi depuis la liste des montages
  const [activeInterventionId, setActiveInterventionId] = useState<string | null>(propInterventionId || null);
  const [activeClientId, setActiveClientId] = useState<string | null>(propClientId || null);
  const [activeMachineId, setActiveMachineId] = useState<string | null>(propMachineId || null);

  // Données du montage actif
  const [installationData, setInstallationData] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [referenceMachine, setReferenceMachine] = useState<any>(null);
  const [montageId, setMontageId] = useState<string | null>(null);
  const [machineGPS, setMachineGPS] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingMontage, setIsLoadingMontage] = useState<boolean>(false);

  // Vues internes
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Liste globale des montages (lorsqu'aucun montage spécifique n'est ouvert)
  const [allMontages, setAllMontages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EN_COURS' | 'TERMINEE'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMontageClientId, setNewMontageClientId] = useState('');
  const [newMontageMachineId, setNewMontageMachineId] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // ─── Chargement initial ─────────────────────────────────────
  useEffect(() => {
    fetchClients({ limit: 100 });
    fetchMachines({ limit: 100 });
    fetchUsers({ limit: 100 });
  }, []);

  // Synchronisation des props
  useEffect(() => {
    if (propInterventionId) {
      setActiveInterventionId(propInterventionId);
      setActiveClientId(propClientId || null);
      setActiveMachineId(propMachineId || null);
    }
  }, [propInterventionId, propClientId, propMachineId]);

  // Chargement de la liste globale des montages
  const refreshMontagesList = async () => {
    try {
      const list = await db.montages.list();
      setAllMontages(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn('Erreur chargement liste montages:', e);
      setAllMontages([]);
    }
  };

  useEffect(() => {
    if (!activeInterventionId) {
      refreshMontagesList();
    }
  }, [activeInterventionId]);

  // Client et machine de référence pour le montage actif
  useEffect(() => {
    if (activeClientId && clients.length > 0) {
      setClient(clients.find((c: any) => c._id === activeClientId || c.id === activeClientId) || null);
    }
  }, [activeClientId, clients]);

  useEffect(() => {
    if (activeMachineId && allMachines.length > 0) {
      const m = allMachines.find((mach: any) => mach._id === activeMachineId || mach.id === activeMachineId);
      setReferenceMachine(m || null);
    }
  }, [activeMachineId, allMachines]);

  // Chargement ou initialisation du montage actif
  useEffect(() => {
    if (!activeInterventionId) {
      setInstallationData(null);
      setMontageId(null);
      setIsLoadingMontage(false);
      return;
    }

    let isMounted = true;
    setIsLoadingMontage(true);

    const loadOrInitMontage = async () => {
      try {
        console.log('🔍 Recherche montage pour intervention:', activeInterventionId);

        // 1. Chercher par montageId ou interventionId
        let existingMontage = await db.montages.get(activeInterventionId);

        if (!existingMontage) {
          // Chercher dans l'intervention liée
          try {
            const inter = await db.interventions.get(activeInterventionId);
            if (inter?.montageId) {
              existingMontage = await db.montages.get(inter.montageId);
            }
          } catch {
            // ignore
          }
        }

        if (existingMontage && isMounted) {
          console.log('✅ Montage existant trouvé:', existingMontage._id || existingMontage.id);
          setInstallationData(existingMontage);
          setMontageId(existingMontage._id || existingMontage.id);
          if (existingMontage.clientId && !activeClientId) {
            setActiveClientId(existingMontage.clientId);
          }
          if (existingMontage.gpsLat && existingMontage.gpsLng) {
            setMachineGPS({ lat: existingMontage.gpsLat, lng: existingMontage.gpsLng });
          }
          setIsLoadingMontage(false);
          return;
        }

        // 2. Si pas de montage existant et qu'on a un currentUser, créer le montage
        if (currentUser && isMounted) {
          console.log('🆕 Création automatique d\'un nouveau montage pour intervention:', activeInterventionId);
          const numero = genererNumeroIntervention(currentUser._id || currentUser.id || '001');

          const initialMachines: any[] = [];
          if (activeMachineId && allMachines.length > 0) {
            const refM = allMachines.find((m: any) => m._id === activeMachineId || m.id === activeMachineId);
            if (refM) {
              initialMachines.push({
                id: genId(),
                machineId: refM._id || refM.id,
                nom: refM.nom || 'Sans nom',
                typeMachineId: refM.typeMachineId || '',
                typeMachineNom: typeof refM.typeMachine === 'object' ? refM.typeMachine?.nom || 'Machine' : (refM.typeMachine || 'Machine'),
                serie: refM.numeroSerie || '',
                notes: refM.notes || '',
                relationType: 'MAITRE',
                heuresParTechnicien: []
              });
            }
          }

          const newMontage = await db.montages.create({
            numeroIntervention: numero,
            interventionId: activeInterventionId,
            clientId: activeClientId || '',
            machineReferenceId: activeMachineId || null,
            machines: initialMachines,
            statut: 'EN_COURS',
            dateDebut: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          if (isMounted) {
            setInstallationData(newMontage);
            setMontageId(newMontage._id || newMontage.id);
            try {
              await db.interventions.update(activeInterventionId, {
                montageId: newMontage._id || newMontage.id,
                statut: 'EN_COURS'
              });
            } catch {
              // ignore
            }
            setIsLoadingMontage(false);
          }
        } else if (isMounted) {
          setIsLoadingMontage(false);
        }
      } catch (err) {
        console.error('❌ Erreur initialisation montage:', err);
        if (isMounted) setIsLoadingMontage(false);
      }
    };

    loadOrInitMontage();

    return () => {
      isMounted = false;
    };
  }, [activeInterventionId, currentUser, activeMachineId, allMachines.length]);

  // Sauvegarde des modifications du montage
  const saveMontage = async (updates: any) => {
    if (!montageId) return;
    try {
      const updated = await db.montages.update(montageId, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      setInstallationData(updated);
      refreshMontagesList();
      console.log('💾 Montage sauvegardé:', montageId);
    } catch (e) {
      console.error('❌ Erreur sauvegarde montage:', e);
    }
  };

  // Calculs d'heures
  const calculerTotalMachine = (machine: any): number => {
    if (!machine?.heuresParTechnicien) return 0;
    return machine.heuresParTechnicien.reduce((total: number, tech: any) => {
      const totalTech = (tech.taches || []).reduce((sum: number, t: any) => sum + (parseFloat(t.heures) || 0), 0);
      return total + totalTech;
    }, 0);
  };

  const calculerTotalGlobal = (montageObj = installationData): number => {
    if (!montageObj?.machines) return montageObj?.totalHeures || 0;
    return montageObj.machines.reduce((sum: number, m: any) => sum + calculerTotalMachine(m), 0);
  };

  // Liste de tous les techniciens avec leurs tâches pour le tracking GPS
  const techniciensForGPS = useMemo(() => {
    if (!installationData?.machines) return [];
    const techMap = new Map<string, any>();
    installationData.machines.forEach((m: any) => {
      (m.heuresParTechnicien || []).forEach((t: any) => {
        const id = t.technicienId;
        if (!techMap.has(id)) {
          techMap.set(id, {
            id,
            nom: t.technicienNom || 'Technicien',
            taches: [...(t.taches || [])]
          });
        } else {
          techMap.get(id).taches.push(...(t.taches || []));
        }
      });
    });
    return Array.from(techMap.values());
  }, [installationData]);

  // Prise de point GPS
  const handlePrendreGPS = async () => {
    try {
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      await saveMontage({
        gpsLat: lat,
        gpsLng: lng,
        gpsPrisLe: new Date().toISOString()
      });
      setMachineGPS({ lat, lng });
      alert('✅ Point GPS du chantier enregistré');
    } catch (error) {
      console.error('❌ Erreur GPS:', error);
      alert('❌ Impossible de récupérer la position GPS actuelle');
    }
  };

  // Chef de chantier
  const handleSetChefChantier = async (chefId: string) => {
    const chef = utilisateurs?.find((u: any) => u._id === chefId || u.id === chefId);
    if (chef) {
      await saveMontage({
        chefDeChantierId: chef._id || chef.id,
        chefDeChantierNom: `${chef.prenom || ''} ${chef.nom || ''}`.trim()
      });
    }
  };

  // Clôture définitive du montage
  const handleClose = async () => {
    if (!confirm('Clôturer définitivement ce montage ?')) return;
    setIsClosing(true);

    try {
      const machines = installationData?.machines || [];
      let totalHeures = 0;
      const resumeParTech: any[] = [];
      const resumeParMachine: any[] = [];
      const resumeParTache: Record<string, { description: string; totalHeures: number }> = {};

      machines.forEach((machine: any) => {
        let totalMachine = 0;
        const techsSurMachine: any[] = [];

        (machine.heuresParTechnicien || []).forEach((tech: any) => {
          let totalTech = 0;

          (tech.taches || []).forEach((tache: any) => {
            const h = parseFloat(tache.heures) || 0;
            totalTech += h;
            totalMachine += h;
            totalHeures += h;

            if (!resumeParTache[tache.description]) {
              resumeParTache[tache.description] = { description: tache.description, totalHeures: 0 };
            }
            resumeParTache[tache.description].totalHeures += h;
          });

          techsSurMachine.push({
            technicienId: tech.technicienId,
            technicienNom: tech.technicienNom,
            heures: totalTech
          });

          let existingTech = resumeParTech.find((t) => t.technicienId === tech.technicienId);
          if (!existingTech) {
            existingTech = {
              technicienId: tech.technicienId,
              nom: tech.technicienNom,
              totalHeures: 0,
              parMachine: []
            };
            resumeParTech.push(existingTech);
          }
          existingTech.totalHeures += totalTech;
          existingTech.parMachine.push({
            machineId: machine.machineId,
            machineNom: machine.nom,
            heures: totalTech
          });
        });

        resumeParMachine.push({
          machineId: machine.machineId,
          nom: machine.nom,
          totalHeures: totalMachine,
          parTechnicien: techsSurMachine
        });
      });

      const journaliers = {
        parTechnicien: resumeParTech,
        parMachine: resumeParMachine,
        parTache: Object.values(resumeParTache)
      };

      await saveMontage({
        statut: 'TERMINEE',
        journaliers,
        totalHeures,
        dateCloture: new Date().toISOString()
      });

      if (activeInterventionId) {
        await db.interventions.update(activeInterventionId, {
          statut: 'TERMINEE',
          dateFin: new Date().toISOString()
        });
      }

      const reportResult = await sendInstallationReportToResponsable({
        installationData: {
          ...installationData,
          statut: 'TERMINEE',
          journaliers,
          totalHeures,
          dateCloture: new Date().toISOString()
        },
        interventionId: activeInterventionId || '',
        clientId: activeClientId || ''
      });

      if (reportResult.success) {
        alert(
          `✅ Montage clôturé!\n\n` +
          `N° ${installationData?.numeroIntervention}\n` +
          `Total heures: ${formatHeures(totalHeures)}\n` +
          `Machines: ${machines.length}\n\n` +
          `📧 Compte-rendu envoyé à ${reportResult.responsableTechnique?.nom || 'Responsable technique'}`
        );
      } else {
        alert(`✅ Montage clôturé!\n⚠️ Rapport généré (note: ${reportResult.error || 'prêt'})`);
      }

      if (propInterventionId) {
        onNavigate('client-detail', { clientId: activeClientId });
      } else {
        setActiveInterventionId(null);
        refreshMontagesList();
      }
    } catch (error) {
      console.error('❌ Erreur clôture montage:', error);
      alert(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsClosing(false);
    }
  };

  // Génération PDF
  const handleGeneratePDF = async () => {
    try {
      const { generateInstallationReportPDF } = await import('../../utils/pdfGenerator');
      const pdfData = {
        installationData,
        client,
        machines: allMachines.filter((m: any) =>
          (installationData.machines || []).some((im: any) => im.machineId === (m._id || m.id))
        ),
        intervention: {
          dateDebut: installationData.dateDebut,
          dateFin: installationData.dateCloture,
          type: 'INSTALLATION'
        },
        responsableTechnique: currentUser
      };

      const doc = await generateInstallationReportPDF(pdfData);
      doc.save(`Montage_${installationData.numeroIntervention || 'chantier'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('❌ Erreur lors de la génération du PDF');
    }
  };

  // Création d'un nouveau montage depuis la vue globale
  const handleCreateNewMontage = async () => {
    if (!newMontageClientId) {
      alert('Veuillez sélectionner un client.');
      return;
    }

    try {
      setIsCreatingNew(true);
      const now = new Date();
      const techCode = (currentUser?._id || currentUser?.id || '001').slice(-3);
      const numeroIntervention =
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        techCode;

      const newInter = await db.interventions.create({
        numeroIntervention,
        clientId: newMontageClientId,
        machineIds: newMontageMachineId ? [newMontageMachineId] : [],
        type: 'INSTALLATION',
        statut: 'EN_COURS',
        dateDebut: new Date().toISOString(),
        technicienPrincipalId: currentUser?._id || currentUser?.id || '',
        creator: 'system'
      });

      const newInterId = newInter._id || newInter.id;
      setShowCreateModal(false);
      setNewMontageClientId('');
      setNewMontageMachineId('');

      // Ouvrir directement ce montage
      setActiveInterventionId(newInterId);
      setActiveClientId(newMontageClientId);
      setActiveMachineId(newMontageMachineId || null);
    } catch (err: any) {
      console.error('Erreur création nouveau montage:', err);
      alert('Erreur lors de la création du protocole de montage.');
    } finally {
      setIsCreatingNew(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // VUE TÂCHES D'UNE MACHINE
  // ═══════════════════════════════════════════════════════════════
  if (selectedMachineId && installationData) {
    const machine = (installationData.machines || []).find((m: any) => m.id === selectedMachineId);
    if (!machine) {
      setSelectedMachineId(null);
      return null;
    }

    return (
      <MachineTasksView
        machine={machine}
        currentUser={currentUser}
        installationData={{
          ...installationData,
          utilisateurs
        }}
        onBack={() => setSelectedMachineId(null)}
        onSave={(updatedMachine) => {
          const machines = (installationData.machines || []).map((m: any) =>
            m.id === updatedMachine.id ? updatedMachine : m
          );
          saveMontage({ machines });
        }}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VUE 1 : ACCUEIL & LISTE GLOBALE DES PROTOCOLES DE MONTAGE
  // (Affichée lorsqu'aucun montage spécifique n'est actif)
  // ═══════════════════════════════════════════════════════════════
  if (!activeInterventionId) {
    const filteredMontages = allMontages.filter((m: any) => {
      const num = m.numeroIntervention || m.numero_intervention || '';
      const clientObj = clients.find((c) => c._id === m.clientId || c.id === m.clientId);
      const clientNom = clientObj?.nom || '';
      const clientFerme = clientObj?.nomFerme || '';
      const matchesSearch =
        num.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientNom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientFerme.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || m.statut === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const totalHeuresTousMontages = allMontages.reduce((sum, m) => sum + calculerTotalGlobal(m), 0);
    const montagesEnCours = allMontages.filter((m) => m.statut === 'EN_COURS');
    const montagesTermines = allMontages.filter((m) => m.statut === 'TERMINEE');

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center shadow-sm">
                <Hammer className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Protocole de montage</h1>
                <p className="text-gray-600 text-sm">Gestion des chantiers d'installation et calcul des heures d'intervention</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm"
          >
            <Plus size={18} />
            Nouveau montage
          </Button>
        </div>

        {/* Cartes KPI Calcul des heures & Avancement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Cumul des heures</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{formatHeures(totalHeuresTousMontages)}</p>
                <p className="text-xs text-green-600 mt-0.5">Calculées sur tous les chantiers</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-600 text-white flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Chantiers en cours</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{montagesEnCours.length}</p>
                <p className="text-xs text-blue-600 mt-0.5">Montages actifs sur le terrain</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Hammer className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Chantiers clôturés</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{montagesTermines.length}</p>
                <p className="text-xs text-purple-600 mt-0.5">Installations achevées</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Total chantiers</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{allMontages.length}</p>
                <p className="text-xs text-amber-600 mt-0.5">Protocoles répertoriés</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par N° montage, client, ferme..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'ALL' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('ALL')}
            >
              Tous ({allMontages.length})
            </Button>
            <Button
              variant={statusFilter === 'EN_COURS' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('EN_COURS')}
              className={statusFilter === 'EN_COURS' ? 'bg-blue-600 text-white' : ''}
            >
              En cours ({montagesEnCours.length})
            </Button>
            <Button
              variant={statusFilter === 'TERMINEE' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('TERMINEE')}
              className={statusFilter === 'TERMINEE' ? 'bg-green-600 text-white' : ''}
            >
              Terminés ({montagesTermines.length})
            </Button>
          </div>
        </div>

        {/* Liste des chantiers de montage */}
        <div className="space-y-3">
          {filteredMontages.length === 0 ? (
            <Card className="text-center py-12">
              <div className="w-14 h-14 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-3">
                <Hammer className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Aucun protocole de montage trouvé</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                Démarrez une nouvelle installation pour affecter les machines, désigner le chef de chantier et enregistrer les heures par technicien.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus size={16} /> Démarrer un montage
              </Button>
            </Card>
          ) : (
            filteredMontages.map((montage) => {
              const clientObj = clients.find((c) => c._id === montage.clientId || c.id === montage.clientId);
              const mTotalHeures = calculerTotalGlobal(montage);
              const nbMachines = (montage.machines || []).length;
              const isTermine = montage.statut === 'TERMINEE';

              return (
                <Card
                  key={montage._id || montage.id}
                  className="hover:shadow-md transition-shadow border border-gray-200 cursor-pointer"
                  onClick={() => {
                    setActiveInterventionId(montage.interventionId || montage._id || montage.id);
                    setActiveClientId(montage.clientId || '');
                    setActiveMachineId(montage.machineReferenceId || null);
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-base">
                          N° {montage.numeroIntervention || montage.numero_intervention || 'Montage'}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            isTermine
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isTermine ? 'Terminé' : 'En cours'}
                        </span>
                        {montage.chefDeChantierNom && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded border border-orange-200 font-medium">
                            Chef: {montage.chefDeChantierNom}
                          </span>
                        )}
                      </div>

                      {clientObj && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Users size={15} className="text-gray-400 flex-shrink-0" />
                          <span className="font-semibold">{clientObj.nom}</span>
                          {clientObj.nomFerme && <span className="text-gray-500">• {clientObj.nomFerme}</span>}
                          {clientObj.ville && <span className="text-gray-400">({clientObj.ville})</span>}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                        <div className="flex items-center gap-1">
                          <Wrench size={13} />
                          <span>{nbMachines} machine(s)</span>
                        </div>
                        {montage.dateDebut && (
                          <div className="flex items-center gap-1">
                            <Calendar size={13} />
                            <span>Début : {new Date(montage.dateDebut).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                        {montage.gpsLat && (
                          <div className="flex items-center gap-1 text-green-600 font-medium">
                            <MapPin size={13} />
                            <span>GPS validé</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bloc Heures calculées & Action */}
                    <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                      <div className="text-left md:text-right">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase">Calcul des heures</p>
                        <p className="text-xl font-bold text-green-700 tabular-nums">{formatHeures(mTotalHeures)}</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm flex items-center gap-1"
                      >
                        <Hammer size={15} />
                        Ouvrir le protocole
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Modal de démarrage d'un nouveau montage */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Hammer className="text-green-600" size={20} />
                  Démarrer un protocole de montage
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Client *</label>
                <select
                  value={newMontageClientId}
                  onChange={(e) => {
                    setNewMontageClientId(e.target.value);
                    setNewMontageMachineId('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionner un client...</option>
                  {clients.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.nom} {c.nomFerme ? `(${c.nomFerme})` : ''} - {c.ville || ''}
                    </option>
                  ))}
                </select>
              </div>

              {newMontageClientId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Machine de référence (optionnelle)
                  </label>
                  <select
                    value={newMontageMachineId}
                    onChange={(e) => setNewMontageMachineId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Aucune machine de référence (sélectionner plus tard)</option>
                    {allMachines
                      .filter((m) => m.clientId === newMontageClientId)
                      .map((m) => (
                        <option key={m._id || m.id} value={m._id || m.id}>
                          {m.nom} {m.numeroSerie ? `• N° ${m.numeroSerie}` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                💡 Le protocole de montage permettra d'enregistrer les machines (Maître/Esclave), les tâches obligatoires et personnalisées, ainsi que les heures de chaque technicien intervenant.
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateNewMontage}
                  disabled={!newMontageClientId || isCreatingNew}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isCreatingNew ? 'Création...' : 'Lancer le montage'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ÉTAT DE CHARGEMENT DU CHANTIER ACTIF
  // ═══════════════════════════════════════════════════════════════
  if (isLoadingMontage || !installationData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 font-medium text-sm">Chargement du protocole de montage...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VUE 2 : CHANTIER DE MONTAGE ACTIF
  // ═══════════════════════════════════════════════════════════════
  const machines = installationData.machines || [];
  const voitTout = currentUser?.permissions?.includes('admin_access') || currentUser?.role === 'ADMINISTRATEUR';
  const totalGlobalHeures = calculerTotalGlobal();
  const isChantierTermine = installationData.statut === 'TERMINEE';

  // Décomposition des heures par technicien pour le chantier actif
  const resumeHeuresTechniciens: Array<{ id: string; nom: string; heures: number; specialite?: string }> = [];
  machines.forEach((m: any) => {
    (m.heuresParTechnicien || []).forEach((t: any) => {
      const existing = resumeHeuresTechniciens.find((x) => x.id === t.technicienId);
      const h = (t.taches || []).reduce((sum: number, tach: any) => sum + (parseFloat(tach.heures) || 0), 0);
      if (existing) {
        existing.heures += h;
      } else {
        resumeHeuresTechniciens.push({
          id: t.technicienId,
          nom: t.technicienNom || 'Technicien',
          heures: h,
          specialite: t.specialite
        });
      }
    });
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* GPS Tracking Alert */}
      {machineGPS && !isChantierTermine && (
        <GPSTrackingAlert
          machineId={montageId || activeInterventionId || ''}
          machineLat={machineGPS.lat}
          machineLng={machineGPS.lng}
          techniciens={techniciensForGPS}
          currentUserId={currentUser?._id || currentUser?.id || ''}
        />
      )}

      {/* Header Sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (propInterventionId) {
                  onNavigate('client-detail', { clientId: activeClientId });
                } else {
                  setActiveInterventionId(null);
                  refreshMontagesList();
                }
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Retour"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">
                  🔨 Montage N° {installationData.numeroIntervention || 'En cours'}
                </h1>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isChantierTermine ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isChantierTermine ? 'Terminé' : 'En cours'}
                </span>
              </div>
              {client && (
                <p className="text-xs text-gray-500">
                  {client.nom} {client.nomFerme ? `(${client.nomFerme})` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isChantierTermine && (
              <Button
                onClick={handleGeneratePDF}
                className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
              >
                <FileText size={16} /> PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* ═══════════════════════════════════════════════════════════════
            CARTE SYNTHÈSE & CALCUL DES HEURES
        ═══════════════════════════════════════════════════════════════ */}
        <Card className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-emerald-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-bold text-emerald-950 uppercase tracking-wide">
                  Calcul & Suivi des heures du montage
                </h2>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                Total cumulé enregistré sur l'ensemble des machines et des tâches de ce chantier
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur px-4 py-2.5 rounded-xl border border-emerald-200 shadow-sm text-right">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase block">Total Chantier</span>
              <span className="text-2xl md:text-3xl font-extrabold text-emerald-800 tabular-nums">
                {formatHeures(totalGlobalHeures)}
              </span>
            </div>
          </div>

          {/* Décomposition par technicien */}
          <div className="pt-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase mb-2">Ventilation par intervenant :</h3>
            {resumeHeuresTechniciens.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                Aucune heure enregistrée pour le moment. Cliquez sur une machine ci-dessous pour saisir les temps passés.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {resumeHeuresTechniciens.map((tech) => (
                  <div
                    key={tech.id}
                    className="p-2.5 bg-white/80 rounded-lg border border-emerald-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{tech.nom}</p>
                      {tech.specialite && <p className="text-[10px] text-gray-500">{tech.specialite}</p>}
                    </div>
                    <span className="font-bold text-emerald-800 text-sm">{formatHeures(tech.heures)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Info Client & Machine de référence */}
        {client && (
          <Card>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Client & Exploitation</p>
                <p className="text-lg font-bold text-gray-900">{client.nom}</p>
                {client.nomFerme && <p className="text-sm font-medium text-gray-700">Ferme : {client.nomFerme}</p>}
                {client.adresse && <p className="text-xs text-gray-500 mt-0.5">{client.adresse} {client.ville ? `(${client.ville})` : ''}</p>}
              </div>

              {referenceMachine && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-[11px] text-blue-700 font-bold uppercase">Machine de référence (Maître)</p>
                  <p className="font-bold text-blue-900 text-sm mt-0.5">{referenceMachine.nom}</p>
                  {referenceMachine.numeroSerie && (
                    <p className="text-xs text-blue-700">N° Série : {referenceMachine.numeroSerie}</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Chef de chantier */}
        <Card>
          <h2 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
            👷 Chef de chantier
          </h2>
          {installationData.chefDeChantierId ? (
            <div className="flex items-center justify-between p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
              <span className="text-sm font-bold text-orange-900">{installationData.chefDeChantierNom}</span>
              {!isChantierTermine && (
                <button
                  onClick={() => saveMontage({ chefDeChantierId: null, chefDeChantierNom: null })}
                  className="p-1 hover:bg-orange-100 rounded text-orange-600"
                  title="Désassigner"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ) : !isChantierTermine ? (
            <select
              value=""
              onChange={(e) => handleSetChefChantier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">Sélectionner un chef de chantier...</option>
              {utilisateurs?.map((u: any) => (
                <option key={u._id || u.id} value={u._id || u.id}>
                  {u.prenom} {u.nom} - {u.role}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-gray-500">Aucun chef de chantier désigné</p>
          )}
        </Card>

        {/* Point GPS du chantier */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <MapPin size={16} className="text-green-600" /> Point GPS du chantier
            </h2>
            {installationData.gpsLat && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">
                Coordonnées validées
              </span>
            )}
          </div>

          {!installationData.gpsLat ? (
            !isChantierTermine ? (
              <Button onClick={handlePrendreGPS} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm">
                <MapPin size={16} /> 📍 Prendre le point GPS actuel
              </Button>
            ) : (
              <p className="text-xs text-gray-500">Aucun point GPS enregistré</p>
            )
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-700">
                <span className="font-semibold">Latitude:</span> {installationData.gpsLat.toFixed(6)} |{' '}
                <span className="font-semibold">Longitude:</span> {installationData.gpsLng.toFixed(6)}
                {installationData.gpsPrisLe && (
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Pris le {new Date(installationData.gpsPrisLe).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${installationData.gpsLat},${installationData.gpsLng}`,
                    '_blank'
                  )
                }
                className="text-xs"
              >
                🗺️ Voir sur Google Maps
              </Button>
            </div>
          )}
        </Card>

        {/* Machines du montage */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-gray-900 text-base">🏭 Machines du montage ({machines.length})</h2>
              <p className="text-xs text-gray-500">
                Cliquez sur une machine pour gérer ses tâches obligatoires et saisir les heures
              </p>
            </div>
            {!isChantierTermine && (
              <Button
                onClick={() => setShowAddMachine(true)}
                variant="secondary"
                size="sm"
                className="text-xs flex items-center gap-1"
              >
                <Plus size={15} /> Ajouter machine
              </Button>
            )}
          </div>

          {machines.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg p-6">
              <p className="text-gray-500 text-sm mb-3">
                Aucune machine associée à ce montage.
              </p>
              {!isChantierTermine && (
                <Button onClick={() => setShowAddMachine(true)} className="bg-green-600 hover:bg-green-700 text-white text-sm">
                  <Plus size={16} /> Ajouter la première machine
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {machines.map((machine: any) => {
                const totalHMachine = calculerTotalMachine(machine);
                const nbTechs = (machine.heuresParTechnicien || []).length;
                const isRef = machine.machineId === referenceMachine?._id || machine.machineId === referenceMachine?.id;

                return (
                  <div
                    key={machine.id}
                    onClick={() => !isChantierTermine && setSelectedMachineId(machine.id)}
                    className={`p-4 border rounded-xl transition bg-white ${
                      isChantierTermine ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:border-green-500'
                    } ${isRef ? 'border-blue-300 bg-blue-50/40' : 'border-gray-200'}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              machine.relationType === 'MAITRE'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {machine.relationType}
                          </span>
                          <h3 className="font-bold text-gray-900 text-base">{machine.nom}</h3>
                          {isRef && (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              RÉFÉRENCE
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-600">
                          {machine.typeMachineNom} {machine.serie && `• N° Série: ${machine.serie}`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <div className="text-left sm:text-right">
                          <span className="text-[11px] font-medium text-gray-500 block">Total machine</span>
                          <span className="text-base font-bold text-green-700 tabular-nums">
                            ⏱️ {formatHeures(totalHMachine)}
                          </span>
                          <span className="text-[11px] text-gray-400 block">{nbTechs} intervenant(s)</span>
                        </div>

                        {!isChantierTermine && (
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100">
                            Gérer tâches & heures →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Résumé après clôture */}
        {isChantierTermine && installationData.journaliers && (
          <Card className="bg-green-50 border-green-200">
            <h2 className="font-bold text-green-950 mb-3 flex items-center gap-2 text-base">
              <CheckCircle className="text-green-600" size={18} /> Récapitulatif de clôture
            </h2>
            <div className="space-y-2">
              {(installationData.journaliers.parTechnicien || []).map((t: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-green-100 text-xs">
                  <span className="font-semibold text-gray-800">{t.nom}</span>
                  <span className="font-bold text-green-800">{formatHeures(t.totalHeures)}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-green-200 mt-3 flex justify-between items-center">
              <span className="font-bold text-green-900 text-sm">Total définitif :</span>
              <span className="font-extrabold text-green-900 text-lg">
                {formatHeures(installationData.totalHeures || totalGlobalHeures)}
              </span>
            </div>
          </Card>
        )}
      </div>

      {/* Barre d'action fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
        <div className="max-w-xl mx-auto flex gap-3">
          {isChantierTermine ? (
            <Button
              variant="secondary"
              onClick={() => {
                if (propInterventionId) {
                  onNavigate('client-detail', { clientId: activeClientId });
                } else {
                  setActiveInterventionId(null);
                  refreshMontagesList();
                }
              }}
              className="flex-1"
            >
              <ArrowLeft size={16} /> Retour
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={async () => {
                  await saveMontage({});
                  alert('💾 Données du montage enregistrées avec succès.');
                }}
                className="flex-1"
              >
                <Save size={16} /> Enregistrer
              </Button>
              <Button
                onClick={handleClose}
                disabled={isClosing}
                className={`flex-1 ${isClosing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white font-medium`}
              >
                {isClosing ? '⏳ Clôture...' : <><CheckCircle size={16} /> Clôturer le chantier</>}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modal Ajout Machine */}
      {showAddMachine && (
        <AddMachineModal
          clientId={activeClientId || ''}
          allMachines={allMachines}
          montageExistingMachines={machines}
          onClose={() => setShowAddMachine(false)}
          onAdd={(newMachine) => {
            const updatedMachines = [...(installationData.machines || []), newMachine];
            saveMontage({ machines: updatedMachines });
            setShowAddMachine(false);
          }}
        />
      )}
    </div>
  );
}
