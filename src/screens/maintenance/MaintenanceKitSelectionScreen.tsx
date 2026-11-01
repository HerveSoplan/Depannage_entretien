//MaintenanceKitSelectionScreen.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useMaintenanceKits } from '../../hooks/useMaintenanceKits';
import { useMachines } from '../../hooks/useMachines';
import { useInterventions } from '../../hooks/useInterventions';
import { useTachesEntretien } from '../../hooks/useTachesEntretien';

interface MaintenanceKitSelectionScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  machineId: string;
}

export function MaintenanceKitSelectionScreen({ onNavigate, machineId }: MaintenanceKitSelectionScreenProps) {
  const { getKitsByMachineModels } = useMaintenanceKits();
  const { machines, fetchMachines } = useMachines();
  const { interventions, fetchInterventions } = useInterventions();
  const { getSectionsByKit } = useTachesEntretien();

  const [machine, setMachine] = useState<any>(null);
  const [selectedServiceNumber, setSelectedServiceNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Compteurs
  const [compteurVide, setCompteurVide] = useState('');
  const [compteurCompresseur, setCompteurCompresseur] = useState('');

  // Vérifications
  const [petiteVerification, setPetiteVerification] = useState(false);
  const [grandeVerification, setGrandeVerification] = useState(false);

  // États pour les 12 services
  const [services, setServices] = useState<any[]>([]);
  const [kitNumbers, setKitNumbers] = useState<{ [key: number]: string }>({});
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [machineId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charge uniquement la machine concernée
      await fetchMachines({ filter: { _id: machineId } });
      // Les kits seront chargés après avoir identifié le type de machine
      await fetchInterventions({ filter: { machineId, type: 'MAINTENANCE' }, limit: 1000 });
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Trouver la machine
  useEffect(() => {
    if (machines.length > 0) {
      const found = machines.find(m => m._id === machineId);
      setMachine(found);
      console.log('🔧 Machine trouvée:', found);
    }
  }, [machines, machineId]);

  // Charger les kits et générer les services une fois la machine identifiée
  useEffect(() => {
    const loadServices = async () => {
      if (!machine) return;

      const machineType = machine.typeMachine || machine.type || machine.modele || machine.nom;
      console.log('🔍 Type de machine:', machineType);

      // Charger les kits spécifiques à ce type de machine
      // On utilise normalize pour éviter les problèmes d'espaces (ex: "V 300" vs "V300")
      const normalizedType = machineType.replace(/\s+/g, '');

      // On essaie de charger les kits correspondants (API filtering)
      // Note: On pourrait améliorer useMaintenanceKits pour accepter un tableau de variantes si besoin
      // Pour l'instant on fait confiance au filtre 'machineType' ou on charge un peu plus large si besoin

      // Pour être sûr, on demande les kits pour ce modèle
      const kits = await getKitsByMachineModels([machineType]);

      console.log('📦 Kits chargés pour services:', kits.length);

      // DEBUG: Stocker les infos pour afficher à l'utilisateur
      setDebugInfo({
        machineType,
        kitsFound: kits.length,
        kitsDetails: kits.map((k: any) => `${k.numeroKit} (${k.machineType})`).join(', ')
      });

      // Créer 12 services
      const servicesData = [];
      for (let i = 1; i <= 12; i++) {
        // Trouver le kit correspondant avec matching précis
        const kit = kits.find((k: any) => {
          const serviceNum = parseInt(String(k.serviceNumber || 0));
          return serviceNum === i;
        });

        // Charger le nombre de tâches pour ce kit
        let taskCount = 0;
        let completedCount = 0;
        let lastMaintenanceDate = null;

        if (kit) {
          try {
            const sections = await getSectionsByKit(kit.kitId || kit._id);
            taskCount = sections.reduce((sum, s) => sum + (s.count || 0), 0);

            // Rechercher les interventions complétées pour ce service
            const completedInterventions = interventions.filter((inter: any) =>
              inter.machineId === machineId &&
              inter.type === 'MAINTENANCE' &&
              inter.status === 'CLOSED' &&
              (inter.serviceNumber === i || inter.kitId === (kit.kitId || kit._id))
            );

            if (completedInterventions.length > 0) {
              completedCount = taskCount; // Service complété
              const lastInter = completedInterventions.sort((a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
              )[0];
              lastMaintenanceDate = lastInter.date;
            }
          } catch (error) {
            console.error('Erreur chargement tâches:', error);
          }
        }

        servicesData.push({
          serviceNumber: i,
          kit: kit || null,
          taskCount,
          completedCount,
          progression: taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0,
          status: completedCount === taskCount && taskCount > 0 ? 'COMPLETE' : i === 1 ? 'EN_COURS' : 'A_VENIR',
          lastMaintenanceDate
        });
      }

      setServices(servicesData);
      console.log('✅ Services chargés:', servicesData);
    };

    loadServices();
  }, [machine, interventions, machineId, getKitsByMachineModels]); // dépendance à getKitsByMachineModels (stable)


  const handleServiceSelect = (serviceNumber: number) => {
    setSelectedServiceNumber(serviceNumber);
  };

  const handleContinue = () => {
    const selectedService = services.find(s => s.serviceNumber === selectedServiceNumber);
    if (!selectedService || !selectedService.kit) {
      alert('⚠️ Service non disponible ou kit manquant');
      return;
    }

    const kitNumInput = kitNumbers[selectedServiceNumber];
    if (!kitNumInput || kitNumInput.trim() === '') {
      alert('⚠️ Veuillez saisir le numéro de kit');
      return;
    }

    // Naviguer vers l'écran d'exécution avec les données
    onNavigate('maintenance-execution', {
      machineId,
      kitId: selectedService.kit._id || selectedService.kit.kitId,
      serviceNumber: selectedServiceNumber,
      compteurVide,
      compteurCompresseur,
      petiteVerification,
      grandeVerification,
      kitNumber: kitNumInput
    });
  };

  if (loading) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-500">Chargement des kits d'entretien...</p>
      </Card>
    );
  }

  if (!machine) {
    return (
      <Card className="text-center py-12">
        <p className="text-red-500">Machine introuvable</p>
        <Button onClick={() => onNavigate('machines')} className="mt-4">
          Retour aux machines
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          onClick={() => onNavigate('machine-detail', { machineId })}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Sélection du service d'entretien</h1>
          <p className="text-gray-600 mt-1">
            {machine.modele || machine.model || machine.nom || 'Machine sans nom'} - {machine.numeroSerie || 'N/S non défini'}
          </p>
        </div>
      </div>

      {/* 🛠️ DEBUG TEMPORAIRE */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h4 className="font-bold text-yellow-800">Debug Info (Kits)</h4>
        <p className="text-sm">Machine Type: <strong>{machine.modele || machine.model || machine.nom}</strong></p>
        {debugInfo && (
          <div className="mt-2 text-xs font-mono text-gray-700 break-all">
            <p>Kits Trouvés: {debugInfo.kitsFound}</p>
            <p>Détails: {debugInfo.kitsDetails || 'Aucun'}</p>
          </div>
        )}
      </div>


      {/* Compteurs et Vérifications */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-blue-600 rounded"></div>
          <h2 className="text-xl font-bold text-gray-900">Compteurs et Vérifications</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Compteur Vide */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compteur Vide
            </label>
            <input
              type="text"
              value={compteurVide}
              onChange={(e) => setCompteurVide(e.target.value)}
              placeholder="8 chiffres"
              maxLength={8}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Compteur Compresseur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compteur Compresseur
            </label>
            <input
              type="text"
              value={compteurCompresseur}
              onChange={(e) => setCompteurCompresseur(e.target.value)}
              placeholder="8 chiffres"
              maxLength={8}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Petite Vérification */}
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={petiteVerification}
                onChange={(e) => setPetiteVerification(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
              />
              <div>
                <div className="font-medium text-gray-900">Petite Vérification</div>
                <div className="text-sm text-gray-600">Vérification rapide des points principaux</div>
              </div>
            </label>
          </div>

          {/* Grande Vérification */}
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={grandeVerification}
                onChange={(e) => setGrandeVerification(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
              />
              <div>
                <div className="font-medium text-gray-900">Grande Vérification</div>
                <div className="text-sm text-gray-600">Vérification complète de la machine</div>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* Sélection du service */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sélectionnez le numéro de service à effectuer :
        </h3>

        {/* Grille des 12 services */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const isSelected = service.serviceNumber === selectedServiceNumber;
            const hasKit = !!service.kit;

            return (
              <div
                key={service.serviceNumber}
                onClick={() => hasKit && handleServiceSelect(service.serviceNumber)}
                className={`
                    border-2 rounded-lg p-4 transition-all cursor-pointer relative
                    ${isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : service.status === 'COMPLETE'
                      ? 'border-green-300 bg-green-50 hover:border-green-400'
                      : hasKit
                        ? 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-md'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  }
                  `}
              >
                {/* En-tête avec radio et badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${isSelected ? 'border-blue-500' : 'border-gray-400'}
                      `}>
                      {isSelected && (
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">
                      Service {service.serviceNumber}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.status === 'COMPLETE' && (
                      <CheckCircle2 size={18} className="text-green-600" />
                    )}
                    <span className={`
                        px-2.5 py-1 rounded text-xs font-medium
                        ${service.status === 'COMPLETE'
                        ? 'bg-green-100 text-green-700'
                        : service.status === 'EN_COURS'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }
                      `}>
                      {service.status === 'COMPLETE' ? 'Complété' : service.status === 'EN_COURS' ? 'En cours' : 'À venir'}
                    </span>
                  </div>
                </div>

                {/* Progression */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progression</span>
                    <span className="font-semibold text-gray-900">{service.progression} %</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${service.progression}%` }}
                    ></div>
                  </div>
                </div>

                {/* Compteur de tâches */}
                <p className="text-sm text-gray-600 mb-2">
                  {service.completedCount} / {service.taskCount} tâche(s) complétée(s)
                </p>

                {/* Date dernière maintenance */}
                {service.lastMaintenanceDate && (
                  <p className="text-xs text-green-600 font-medium mb-3">
                    Dernière maintenance: {new Date(service.lastMaintenanceDate).toLocaleDateString('fr-FR')}
                  </p>
                )}

                {/* N° Kit */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">N° Kit</label>
                  <input
                    type="text"
                    value={kitNumbers[service.serviceNumber] || ''}
                    onChange={(e) => setKitNumbers(prev => ({
                      ...prev,
                      [service.serviceNumber]: e.target.value
                    }))}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={hasKit ? (service.kit.kitNumber || service.kit.numeroKit || '') : 'Non disponible'}
                    disabled={!hasKit}
                    className={`
                        w-full px-3 py-2 border rounded-lg text-sm
                        ${hasKit
                        ? 'border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                      }
                      `}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bouton Continuer */}
      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!services.find(s => s.serviceNumber === selectedServiceNumber)?.kit}
          className="px-8 py-3 text-lg"
        >
          Continuer avec Service {selectedServiceNumber}
        </Button>
      </div>
    </div>
  );
}
