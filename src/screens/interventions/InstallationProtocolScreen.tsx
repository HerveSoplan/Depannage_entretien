// InstallationProtocolScreen.tsx - VERSION FINALE
// Vue principale : Liste des machines du montage

import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {ArrowLeft, Save, CheckCircle, Plus, MapPin, X, Clock} from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useMachines } from '../../hooks/useMachines';
import { useUsers } from '../../hooks/useUsers';
import { db } from '../../lib/supabase';
import { getCurrentPosition } from '../../utils/geoUtils';
import { GPSTrackingAlert } from '../../components/installation/GPSTrackingAlert';
import { MachineTasksView } from '../installation/MachineTasksView';
import { AddMachineModal } from '../../components/installation/AddMachineModal';
import { sendInstallationReportToResponsable } from '../../services/installationReportService';

// ═══════════════════════════════════════════════════════════════
// TÂCHES OBLIGATOIRES
// ═══════════════════════════════════════════════════════════════
const TACHES_OBLIGATOIRES = [
  { id: 'oblig_electricite_generale', description: 'Électricité générale', obligatoire: true },
  { id: 'oblig_plomberie_generale', description: 'Plomberie générale', obligatoire: true },
  { id: 'oblig_electricite_machine', description: 'Électricité machine', obligatoire: true },
  { id: 'oblig_plomberie_machine', description: 'Plomberie machine', obligatoire: true },
  { id: 'oblig_frigoriste', description: 'Frigoriste', obligatoire: true },
  { id: 'oblig_monteur_machine', description: 'Monteur machine', obligatoire: true },
  { id: 'oblig_tuyauterie_inox', description: 'Tuyauterie inox', obligatoire: true },
  { id: 'oblig_prt', description: 'PRT', obligatoire: true },
  { id: 'oblig_vis', description: 'Vis', obligatoire: true },
  { id: 'oblig_circulation', description: 'Circulation', obligatoire: true },
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const genId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2);

const formatHeures = (heures: number) => {
  const h = Math.floor(heures);
  const m = Math.round((heures - h) * 60);
  return m > 0 ? `${h}h ${m.toString().padStart(2, '0')}min` : `${h}h 00min`;
};

// Générer le numéro d'intervention au format AAAAMMJJHHXXX
const genererNumeroIntervention = (userId: string): string => {
  const now = new Date();
  const annee = now.getFullYear().toString(); // 2026
  const mois = (now.getMonth() + 1).toString().padStart(2, '0'); // 01-12
  const jour = now.getDate().toString().padStart(2, '0'); // 01-31
  const heure = now.getHours().toString().padStart(2, '0'); // 00-23
  
  // Extraire les 3 derniers caractères de l'ID utilisateur (ou padding si trop court)
  const userCode = userId.slice(-3).padStart(3, '0');
  
  return `${annee}${mois}${jour}${heure}${userCode}`;
};

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════
interface InstallationProtocolScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  interventionId: string;
  clientId: string;
  machineId?: string; // Machine de référence (optionnelle)
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export function InstallationProtocolScreen({
  onNavigate,
  interventionId,
  clientId,
  machineId
}: InstallationProtocolScreenProps) {

  const { clients, fetchClients } = useClients();
  const { machines: allMachines, fetchMachines } = useMachines();
  const { users: utilisateurs, fetchUsers } = useUsers();

  // ─── States ─────────────────────────────────────────────────
  const [installationData, setInstallationData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [referenceMachine, setReferenceMachine] = useState<any>(null); // Machine de référence
  const [montageId, setMontageId] = useState<string | null>(null);
  const [machineGPS, setMachineGPS] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingMontage, setIsLoadingMontage] = useState(true); // Nouveau : tracker le chargement

  // Vue active
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [showAddMachine, setShowAddMachine] = useState(false);
  
  // Clôture
  const [isClosing, setIsClosing] = useState(false);

  // ─── Chargement initial ─────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      await loadCurrentUser();
      await loadMontage();
    };
    init();
    fetchClients({ filter: { _id: clientId } });
    fetchMachines({ filter: { clientId: clientId } });
    fetchUsers({ limit: 100 });
  }, []);

  useEffect(() => {
    if (clientId && clients.length > 0) {
      setClient(clients.find((c: any) => c._id === clientId) || null);
    }
  }, [clientId, clients]);

  // Charger la machine de référence
  useEffect(() => {
    if (machineId && allMachines.length > 0) {
      const machine = allMachines.find((m: any) => m._id === machineId);
      setReferenceMachine(machine || null);
    }
  }, [machineId, allMachines]);

  // GPS du chantier
  useEffect(() => {
    if (installationData?.gpsLat && installationData?.gpsLng) {
      setMachineGPS({
        lat: installationData.gpsLat,
        lng: installationData.gpsLng
      });
    }
  }, [installationData]);

  // ═══════════════════════════════════════════════════════════════
  // FONCTIONS DE CHARGEMENT
  // ═══════════════════════════════════════════════════════════════

  const loadCurrentUser = async () => {
    try {
      const user = await lumi.auth.refreshUser();
      if (user) {
        const result = await db.utilisateurs.list({ 
          filter: { email: user.email }, 
          limit: 1 
        });
        if (result.list && result.list.length > 0) {
          setCurrentUser(result.list[0]);
        }
      }
    } catch (e) {
      console.error('Erreur chargement user:', e);
    }
  };

  const loadMontage = async () => {
    try {
      console.log('🔍 Recherche d\'un montage existant pour intervention:', interventionId);
      const inter = await db.interventions.get(interventionId);
      if (inter?.montageId) {
        console.log('📦 MontageId trouvé dans l\'intervention:', inter.montageId);
        const montage = await db.montages.get(inter.montageId);
        if (montage) {
          console.log('✅ Montage existant chargé:', montage._id, 'avec', (montage.machines || []).length, 'machine(s)');
          setInstallationData(montage);
          setMontageId(montage._id);
          setIsLoadingMontage(false);
          return true; // Montage existant trouvé
        }
      }
      console.log('❌ Aucun montage existant trouvé');
      setIsLoadingMontage(false);
      return false; // Pas de montage existant
    } catch (e) {
      console.error('❌ Erreur chargement montage:', e);
      setIsLoadingMontage(false);
      return false;
    }
  };

  const creerMontage = async () => {
    try {
      // Générer le numéro d'intervention avec l'ID utilisateur
      const numero = genererNumeroIntervention(currentUser?._id || '000');
      
      // Préparer la liste des machines avec la machine de référence si elle existe
      const machines: any[] = [];
      
      if (machineId && allMachines.length > 0) {
        const refMachine = allMachines.find((m: any) => m._id === machineId);
        if (refMachine) {
          // Créer l'objet machine avec les tâches obligatoires par défaut
          const machineData = {
            id: genId(),
            machineId: refMachine._id,
            nom: refMachine.nom || 'Sans nom',
            typeMachineId: refMachine.typeMachineId || '',
            typeMachineNom: typeof refMachine.typeMachine === 'object' 
              ? refMachine.typeMachine?.nom || 'Type inconnu'
              : refMachine.typeMachine || 'Type inconnu',
            serie: refMachine.numeroSerie || '',
            notes: refMachine.notes || '',
            relationType: 'MAITRE', // Machine de référence est toujours MAITRE
            heuresParTechnicien: [] // Vide au début, les techniciens seront ajoutés plus tard
          };
          machines.push(machineData);
          console.log('✅ Machine de référence ajoutée:', refMachine.nom);
        }
      }
      
      const montage = await db.montages.create({
        numeroIntervention: numero,
        interventionId,
        clientId,
        machineReferenceId: machineId || null, // Stocker la machine de référence
        machines, // Contient la machine de référence si elle existe
        statut: 'EN_COURS',
        dateDebut: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setInstallationData(montage);
      setMontageId(montage._id);

      await db.interventions.update(interventionId, {
        montageId: montage._id,
        statut: 'EN_COURS'
      });

      console.log('✅ Nouveau montage créé:', montage._id, 'N°', numero);
      if (machines.length > 0) {
        console.log('✅ Machine de référence ajoutée automatiquement');
      }
    } catch (e) {
      console.error('❌ Erreur création montage:', e);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // SAUVEGARDE
  // ═══════════════════════════════════════════════════════════════

  const saveMontage = async (updates: any) => {
    if (!montageId) return;
    try {
      const updated = await db.montages.update(montageId, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      setInstallationData(updated);
      console.log('💾 Montage sauvegardé:', montageId, 'avec', (updated.machines || []).length, 'machine(s)');
    } catch (e) {
      console.error('❌ Erreur sauvegarde:', e);
    }
  };

  // Enregistrer et retourner au client
  const handleSaveAndReturn = async () => {
    await saveMontage({}); // Force une sauvegarde
    onNavigate('client-detail', { clientId });
  };

  // ═══════════════════════════════════════════════════════════════
  // GPS DU CHANTIER
  // ═══════════════════════════════════════════════════════════════

  const handlePrendreGPS = async () => {
    try {
      const pos = await getCurrentPosition();
      await saveMontage({
        gpsLat: pos.coords.latitude,
        gpsLng: pos.coords.longitude,
        gpsPrisLe: new Date().toISOString()
      });
      alert('✅ Point GPS enregistré');
    } catch (error) {
      console.error('❌ Erreur GPS:', error);
      alert('❌ Impossible de récupérer la position GPS');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CHEF DE CHANTIER
  // ═══════════════════════════════════════════════════════════════

  const handleSetChefChantier = async (chefId: string) => {
    const chef = utilisateurs?.find((u: any) => u._id === chefId);
    if (chef) {
      await saveMontage({
        chefDeChantierId: chef._id,
        chefDeChantierNom: `${chef.prenom || ''} ${chef.nom || ''}`.trim()
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CALCULER TOTAL HEURES MACHINE
  // ═══════════════════════════════════════════════════════════════

  const calculerTotalMachine = (machine: any): number => {
    if (!machine.heuresParTechnicien) return 0;
    return machine.heuresParTechnicien.reduce((total: number, tech: any) => {
      const totalTech = (tech.taches || []).reduce((sum: number, t: any) => sum + (t.heures || 0), 0);
      return total + totalTech;
    }, 0);
  };

  // ═══════════════════════════════════════════════════════════════
  // GÉNÉRATION PDF
  // ═══════════════════════════════════════════════════════════════

  const handleGeneratePDF = async () => {
    try {
      // Importer la fonction depuis pdfGenerator
      const { generateInstallationReportPDF } = await import('../../utils/pdfGenerator');
      
      // Préparer les données pour le PDF
      const pdfData = {
        installationData,
        client,
        machines: allMachines.filter((m: any) => 
          installationData.machines.some((im: any) => im.machineId === m._id)
        ),
        intervention: { 
          dateDebut: installationData.dateDebut,
          dateFin: installationData.dateCloture,
          type: 'INSTALLATION'
        },
        responsableTechnique: currentUser
      };

      // Générer le PDF
      const doc = await generateInstallationReportPDF(pdfData);
      
      // Télécharger le PDF
      doc.save(`Installation_${installationData.numeroIntervention}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('❌ Erreur lors de la génération du PDF');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CLÔTURE
  // ═══════════════════════════════════════════════════════════════

  const handleClose = async () => {
    if (!confirm('Clôturer définitivement ce montage ?')) return;
    setIsClosing(true);

    try {
      // Calculer les totaux
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
            const h = tache.heures || 0;
            totalTech += h;
            totalMachine += h;
            totalHeures += h;

            // Par tâche global
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

          // Par technicien global
          let existingTech = resumeParTech.find(t => t.technicienId === tech.technicienId);
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

console.log('📊 DEBUG - Données machines avant calcul journaliers:', JSON.stringify(machines, null, 2));
      const journaliers = {
        parTechnicien: resumeParTech,
        parMachine: resumeParMachine,
        parTache: Object.values(resumeParTache)
      };

      // Sauvegarder
      await saveMontage({
        statut: 'TERMINEE',
        journaliers,
        totalHeures,
        dateCloture: new Date().toISOString()
      });

      await db.interventions.update(interventionId, {
        statut: 'TERMINEE',
        dateFin: new Date().toISOString()
      });

      // Envoyer compte-rendu
      const reportResult = await sendInstallationReportToResponsable({
        installationData: {
          ...installationData,
          statut: 'TERMINEE',
          journaliers,
          totalHeures,
          dateCloture: new Date().toISOString()
        },
        interventionId,
        clientId
      });

      if (reportResult.success) {
        alert(
          `✅ Montage clôturé!\n\n` +
          `N° ${installationData?.numeroIntervention}\n` +
          `Total: ${formatHeures(totalHeures)}\n` +
          `Machines: ${machines.length}\n\n` +
          `📧 Compte-rendu envoyé à ${reportResult.responsableTechnique?.nom}`
        );
      } else {
        alert(`✅ Montage clôturé!\n⚠️ Erreur envoi compte-rendu: ${reportResult.error}`);
      }

      onNavigate('client-detail', { clientId });

    } catch (error) {
      console.error('❌ Erreur clôture:', error);
      alert(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsClosing(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CRÉATION MONTAGE SI INEXISTANT
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    // ATTENDRE que le chargement soit terminé avant de créer
    if (isLoadingMontage) {
      console.log('⏳ Chargement du montage en cours, attente...');
      return;
    }

    // Ne créer le montage QUE si :
    // 1. Le chargement est terminé
    // 2. L'utilisateur est chargé
    // 3. On n'a pas encore de montageId (pas de montage existant trouvé)
    // 4. installationData est null (confirmation qu'il n'y a pas de montage)
    // On attend que allMachines soit chargé si on a une machineId
    const shouldCreate = !isLoadingMontage && currentUser && !montageId && installationData === null;
    const canCreate = !machineId || (machineId && allMachines.length > 0);
    
    if (shouldCreate && canCreate) {
      console.log('🆕 Aucun montage existant → Création d\'un nouveau montage...');
      creerMontage();
    }
  }, [isLoadingMontage, currentUser, montageId, installationData, allMachines.length]);

  // ═══════════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════════

  if (isLoadingMontage || !installationData || !montageId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VUE TÂCHES D'UNE MACHINE
  // ═══════════════════════════════════════════════════════════════

  if (selectedMachineId) {
    const machine = installationData.machines?.find((m: any) => m.id === selectedMachineId);
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
          utilisateurs // Passer la liste des utilisateurs
        }}
        onBack={() => setSelectedMachineId(null)}
        onSave={(updatedMachine) => {
          const machines = installationData.machines.map((m: any) =>
            m.id === updatedMachine.id ? updatedMachine : m
          );
          saveMontage({ machines });
        }}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDU PRINCIPAL - LISTE DES MACHINES
  // ═══════════════════════════════════════════════════════════════

  const machines = installationData.machines || [];
  const voitTout = currentUser?.permissions?.includes('admin_access');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* GPS Tracking */}
      {machineGPS && installationData.statut !== 'TERMINEE' && (
        <GPSTrackingAlert
          machineId={montageId}
          machineLat={machineGPS.lat}
          machineLng={machineGPS.lng}
          techniciens={[]} // Pas utilisé ici
          currentUserId={currentUser?._id || ''}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={handleSaveAndReturn}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-gray-800">
              📋 Installation - {installationData.numeroIntervention}
            </h1>
          </div>
          {installationData.statut === 'TERMINEE' && (
            <Button
              onClick={handleGeneratePDF}
              className="bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-2"
            >
              📄 Voir PDF
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 pb-24 space-y-4">
        {/* Info Client */}
        {client && (
          <Card>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Client</p>
            <p className="text-lg font-bold text-gray-800">{client.nom}</p>
            {client.adresse && <p className="text-sm text-gray-600">{client.adresse}</p>}
            
            {/* Machine de référence - info en haut */}
            {referenceMachine && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Machine de référence</p>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-800">{referenceMachine.nom}</span>
                  {referenceMachine.typeMachine && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
                      {typeof referenceMachine.typeMachine === 'object' 
                        ? referenceMachine.typeMachine.nom 
                        : referenceMachine.typeMachine}
                    </span>
                  )}
                </div>
                {referenceMachine.numeroSerie && (
                  <p className="text-sm text-gray-600 mt-1">
                    N° Série: {referenceMachine.numeroSerie}
                  </p>
                )}
              </div>
            )}
            
            <span className={`inline-block mt-3 text-xs font-semibold px-2 py-0.5 rounded-full ${
              installationData.statut === 'TERMINEE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {installationData.statut === 'TERMINEE' ? 'Terminé' : 'En cours'}
            </span>
          </Card>
        )}

        {/* Chef de chantier */}
        {voitTout && (
          <Card>
            <h2 className="font-semibold text-gray-800 mb-3">👷 Chef de chantier</h2>
            {installationData.chefDeChantierId ? (
              <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="text-sm font-bold text-orange-800">{installationData.chefDeChantierNom}</span>
                {installationData.statut !== 'TERMINEE' && (
                  <button onClick={() => saveMontage({ chefDeChantierId: null, chefDeChantierNom: null })}>
                    <X size={16} className="text-orange-400 hover:text-red-500" />
                  </button>
                )}
              </div>
            ) : installationData.statut !== 'TERMINEE' ? (
              <select
                value=""
                onChange={(e) => handleSetChefChantier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Sélectionner un chef...</option>
                {utilisateurs?.map((u: any) => (
                  <option key={u._id} value={u._id}>
                    {u.prenom} {u.nom} - {u.role}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500">Aucun chef de chantier désigné</p>
            )}
          </Card>
        )}

        {/* GPS */}
        {voitTout && (
          <Card>
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin size={18} /> GPS du chantier
            </h2>
            {!installationData.gpsLat ? (
              installationData.statut !== 'TERMINEE' ? (
                <Button onClick={handlePrendreGPS} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <MapPin size={18} /> 📍 Prendre le point GPS
                </Button>
              ) : (
                <p className="text-sm text-gray-500">Aucun point GPS enregistré</p>
              )
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Lat:</span> {installationData.gpsLat.toFixed(6)} &nbsp;
                  <span className="font-medium">Lng:</span> {installationData.gpsLng.toFixed(6)}
                </p>
                <p className="text-xs text-gray-500">
                  Pris le {new Date(installationData.gpsPrisLe).toLocaleString('fr-FR')}
                </p>
                {installationData.gpsLat && installationData.gpsLng && (
                  <Button
                    variant="secondary"
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${installationData.gpsLat},${installationData.gpsLng}`, '_blank')}
                    className="text-sm flex items-center gap-1"
                  >
                    🗺️ Ouvrir dans Maps
                  </Button>
                )}
              </div>
            )}
          </Card>
        )}

        {/* MACHINES */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-lg">🏭 Machines</h2>
            {installationData.statut !== 'TERMINEE' && (
              <Button onClick={() => setShowAddMachine(true)} variant="secondary" className="text-sm">
                <Plus size={16} /> Ajouter machine
              </Button>
            )}
          </div>

          {machines.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              Aucune machine ajoutée. Cliquez sur "Ajouter machine" pour commencer.
            </p>
          ) : (
            <div className="space-y-3">
              {machines.map((machine: any, index: number) => {
                const totalHeures = calculerTotalMachine(machine);
                const nbTechniciens = machine.heuresParTechnicien?.length || 0;
                const isReferenceMachine = machine.machineId === referenceMachine?._id;
                const isTerminee = installationData.statut === 'TERMINEE';

                return (
                  <div
                    key={machine.id}
                    onClick={() => !isTerminee && setSelectedMachineId(machine.id)}
                    className={`p-4 border rounded-lg transition bg-white ${
                      isTerminee 
                        ? 'cursor-default' 
                        : 'cursor-pointer hover:shadow-md'
                    } ${
                      isReferenceMachine 
                        ? 'border-blue-400 bg-blue-50' 
                        : isTerminee
                        ? 'border-gray-200'
                        : 'border-gray-200 hover:border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {isReferenceMachine && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded">
                              RÉFÉRENCE
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                            machine.relationType === 'MAITRE' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {machine.relationType}
                          </span>
                          <h3 className="font-bold text-gray-900">{machine.nom}</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {machine.typeMachineNom} {machine.serie && `• N° ${machine.serie}`}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-600">
                            ⏱️ <strong>{formatHeures(totalHeures)}</strong>
                          </span>
                          <span className="text-sm text-gray-600">
                            👷 <strong>{nbTechniciens}</strong> technicien(s)
                          </span>
                        </div>
                      </div>
                      {!isTerminee && (
                        <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                          Voir tâches →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Résumé après clôture */}
        {installationData.statut === 'TERMINEE' && installationData.journaliers && (
          <Card>
            <h2 className="font-semibold text-gray-800 mb-3">📊 Résumé</h2>
            <div className="space-y-2">
              {installationData.journaliers.parTechnicien.map((t: any, i: number) => (
                <div key={i} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{t.nom}</span>
                  <span className="text-sm font-bold text-blue-600">{formatHeures(t.totalHeures)}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-200 mt-3 flex justify-between">
              <span className="font-semibold">Total global</span>
              <span className="font-bold text-blue-600">{formatHeures(installationData.totalHeures || 0)}</span>
            </div>
          </Card>
        )}
      </div>

      {/* Boutons bas de page */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-xl mx-auto flex gap-3">
          {installationData.statut === 'TERMINEE' ? (
            <Button 
              variant="secondary" 
              onClick={handleSaveAndReturn} 
              className="flex-1"
            >
              <ArrowLeft size={16} /> Retour
            </Button>
          ) : (
            <>
              <Button 
                variant="secondary" 
                onClick={handleSaveAndReturn} 
                className="flex-1"
              >
                <Save size={16} /> Enregistrer
              </Button>
              <Button
                onClick={handleClose}
                disabled={isClosing}
                className={`flex-1 ${isClosing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white`}
              >
                {isClosing ? '⏳ Clôture...' : <><CheckCircle size={16} /> Clôturer</>}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modal Ajout Machine */}
      {showAddMachine && (
        <AddMachineModal
          clientId={clientId}
          allMachines={allMachines}
          montageExistingMachines={machines}
          onClose={() => setShowAddMachine(false)}
          onAdd={(newMachine) => {
            const machines = [...installationData.machines, newMachine];
            saveMontage({ machines });
            setShowAddMachine(false);
          }}
        />
      )}
    </div>
  );
}
