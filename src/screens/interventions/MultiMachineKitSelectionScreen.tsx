//MultiMachineKitSelectionScreen.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ArrowLeft, Wrench, CheckCircle } from 'lucide-react';
import { useMachines } from '../../hooks/useMachines';
import { useMaintenanceKits } from '../../hooks/useMaintenanceKits';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
  clientId: string;
  machineIds: string[];
}

interface MachineKitSelection {
  machineId: string;
  kitId: string;
}

export function MultiMachineKitSelectionScreen(props: Props) {
  const { onNavigate, clientId, machineIds } = props;

  console.log('🚀 [MultiMachineKitSelectionScreen] MOUNT - Props:', { clientId, machineIdsLength: machineIds?.length, machineIds });

  if (!machineIds || !Array.isArray(machineIds) || machineIds.length === 0) {
    console.error('❌ [MultiMachineKitSelectionScreen] MACHINE IDS MANQUANT OU VIDE !');
    return (
      <div className="p-8 text-center text-red-600 bg-red-50">
        <h2 className="text-xl font-bold mb-2">Erreur de Navigation</h2>
        <p>Aucune machine n'a été sélectionnée ou transmise à l'écran.</p>
        <p className="text-sm mt-2 font-mono">Reçu: {JSON.stringify(props)}</p>
        <Button onClick={() => onNavigate('intervention-form')} className="mt-4">Retour</Button>
      </div>
    );
  }

  const { getMachineById } = useMachines();
  const maintenanceKitsHook = useMaintenanceKits();

  // Protection contre le hook cassé
  if (!maintenanceKitsHook || !maintenanceKitsHook.getKitsByMachineModels) {
    console.error('❌ [MultiMachineKitSelectionScreen] HOOK useMaintenanceKits INVALIDE:', maintenanceKitsHook);
    return <div className="p-4 bg-red-100">Erreur interne: Hook useMaintenanceKits invalide.</div>
  }

  const { getKitsByMachineModels, loading: kitsLoading } = maintenanceKitsHook;

  const [selectedMachines, setSelectedMachines] = useState<any[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filteredKits, setFilteredKits] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null); // DEBUG


  // Effet de reset supprimé pour éviter conflits

  useEffect(() => {
    const loadMachines = async () => {
      console.log('🔍 Chargement des machines:', machineIds);
      setIsLoading(true);
      const machinesData = await Promise.all(machineIds.map(id => getMachineById(id)));
      const validMachines = machinesData.filter(Boolean);

      if (validMachines.length > 0) {
        console.log('📦 STRUCTURE MACHINE:', JSON.stringify(validMachines[0], null, 2));
      }

      setSelectedMachines(validMachines);
      console.log('✅ Machines chargées:', validMachines.length);
      setIsLoading(false);
    };
    loadMachines();
  }, [machineIds, getMachineById]);

  useEffect(() => {
    const loadCompatibleKits = async () => {
      if (selectedMachines.length === 0) {
        console.log('⏳ En attente du chargement des machines...');
        return;
      }

      console.log('🔍 Extraction des modèles depuis les machines...');

      const machineModels = [...new Set(
        selectedMachines.map(m => {
          console.log('📋 Machine analysée:', {
            nom: m.nom,
            model: m.model,
            machineType: m.machineType,
            modele: m.modele,
            type: m.type
          });

          // ✅ Essayer tous les champs possibles
          let modelName = m.model || m.machineType || m.modele || m.type;

          if (!modelName && m.nom) {
            // ✅ CORRECTION : Supporter "V 300" avec espace
            const match = m.nom.match(/^(VMS\s*\d+|V\s*\d+)/i);
            if (match) {
              modelName = match[0].replace(/\s+/g, ' ').trim();
              console.log('🔍 Extraction depuis nom:', m.nom, '→ Résultat:', modelName);
            }
          }

          console.log('✅ Modèle final retenu:', modelName);
          return modelName;
        })
          .filter(model => {
            const isValid = model !== null && model !== undefined && model !== '';
            if (!isValid) {
              console.warn('⚠️ Modèle invalide filtré:', model);
            }
            return isValid;
          })
      )];

      console.log('📋 Modèles détectés (après déduplication):', machineModels);

      if (machineModels.length === 0) {
        console.error('❌ ERREUR: Aucun modèle valide trouvé dans les machines');
        setFilteredKits([]);
        return;
      }

      console.log('🚀 Appel de getKitsByMachineModels avec:', machineModels);
      const kits = await getKitsByMachineModels(machineModels); // ✅ Appel réel réactivé
      // const kits: any[] = []; // Simulation (DÉSACTIVÉE)

      console.log('📦 Kits compatibles trouvés:', kits.length);

      setDebugInfo({
        machineModels,
        kitsFound: kits.length,
        kitsDetails: kits.map((k: any) => `${k.numeroKit || 'N/A'}`).join(', '),
        // DEBUG: Charger TOUS les types de kits dispos en base pour voir ce qui cloche
        availableTypes: [] // Je ne peux pas les avoir ici facilement car getKitsByMachineModels filtre déjà
      });
      // Je vais modifier getKitsByMachineModels pour retourner { matches, allTypes } ? Trop compliqué pour l'instant.
      // Je vais plutôt faire un appel séparé juste pour le debug ici.
      setFilteredKits(kits);
    };

    loadCompatibleKits();
  }, [selectedMachines, getKitsByMachineModels]);

  // Surveillance pour mettre à jour debugInfo avec les types trouvés
  useEffect(() => {
    if (maintenanceKitsHook.maintenanceKits.length > 0) {
      const types = Array.from(new Set(maintenanceKitsHook.maintenanceKits.map((k: any) => k.machineType))).filter(Boolean).sort();
      setDebugInfo((prev: any) => ({
        ...prev,
        availableTypes: types.join(', ') || 'Aucun type (champs vides)'
      }));
    }
  }, [maintenanceKitsHook.maintenanceKits]);

  const handleKitChange = (machineId: string, kitId: string) => {
    console.log('🔄 Sélection kit:', { machineId, kitId });
    setSelections(prev => ({ ...prev, [machineId]: kitId }));
  };

  const getKitsForMachine = (machineType: string) => {
    console.log('🔍 [getKitsForMachine] Recherche kits pour:', machineType);
    console.log('🔍 [getKitsForMachine] Kits disponibles au total:', filteredKits.length);

    if (!machineType) {
      console.warn('⚠️ [getKitsForMachine] Pas de type de machine fourni');
      return [];
    }

    if (filteredKits.length === 0) {
      console.warn('⚠️ [getKitsForMachine] Aucun kit dans filteredKits');
      return [];
    }

    // ✅ Normaliser en retirant les espaces
    const normalizedMachineType = machineType.toLowerCase().replace(/\s+/g, '').trim();
    console.log('🔍 [getKitsForMachine] Type normalisé:', normalizedMachineType);

    const filtered = filteredKits.filter(kit => {
      if (!kit.machineType) {
        console.log('⚠️ [getKitsForMachine] Kit sans machineType:', kit.nom);
        return false;
      }

      const normalizedKitType = kit.machineType.toLowerCase().replace(/\s+/g, '').trim();
      const match = normalizedKitType === normalizedMachineType ||
        normalizedKitType.includes(normalizedMachineType) ||
        normalizedMachineType.includes(normalizedKitType);

      if (match) {
        console.log('✅ [getKitsForMachine] Match trouvé:', kit.nom, '("' + kit.machineType + '" ↔ "' + machineType + '")');
      }

      return match;
    });

    console.log(`✅ [getKitsForMachine] ${filtered.length} kits trouvés pour ${machineType}`);
    return filtered;
  };

  const handleConfirm = () => {
    if (Object.keys(selections).length !== machineIds.length) {
      alert('⚠️ Veuillez sélectionner un kit pour chaque machine.');
      return;
    }

    const machineKitSelections: MachineKitSelection[] = Object.entries(selections).map(
      ([machineId, kitId]) => ({ machineId, kitId })
    );

    console.log('✅ Sélections validées:', machineKitSelections);

    onNavigate('multi-machine-section-selection', {
      clientId,
      machineKitSelections
    });
  };

  if (isLoading || kitsLoading) {
    return (
      <Card className="text-center py-12">
        <p>⏳ Chargement des machines et kits...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => onNavigate('intervention-form', { clientId })}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sélection des Kits d'Entretien</h1>
          <p className="text-gray-600 mt-1">Choisissez un kit pour chaque machine sélectionnée.</p>
        </div>
      </div>



      {filteredKits.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-800">
            🔍 <strong>{filteredKits.length}</strong> kits disponibles pour les modèles :
            <strong> {[...new Set(
              selectedMachines
                .map(m => m.model || m.machineType || m.modele || m.type || m.nom?.match(/^(VMS\s*\d+|V\s*\d+)/i)?.[0])
                .filter(Boolean)
            )].join(', ')}</strong>
          </p>
        </div>
      )}

      {selectedMachines.map(machine => {
        let machineType = machine.model || machine.machineType || machine.modele || machine.type;

        if (!machineType && machine.nom) {
          const match = machine.nom.match(/^(VMS\s*\d+|V\s*\d+)/i);
          machineType = match ? match[0].replace(/\s+/g, ' ').trim() : machine.nom.split('-')[0]?.trim();
        }



        const kitsForThisMachine = getKitsForMachine(machineType);

        return (
          <Card key={machine._id}>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench size={20} />
              {machine.modele || machine.model || machine.nom || 'Machine sans nom'} - {machine.numeroSerie}
              <span className="text-sm font-normal text-gray-500">
                (Type: {machineType || 'Non défini'})
              </span>
            </h2>

            {kitsForThisMachine.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">
                  ✅ {kitsForThisMachine.length} kit(s) disponible(s) :
                </p>
                {kitsForThisMachine.map(kit => (
                  <label
                    key={kit._id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                  >
                    <input
                      type="radio"
                      name={`kit-${machine._id}`}
                      value={kit._id}
                      checked={selections[machine._id] === kit._id}
                      onChange={() => handleKitChange(machine._id, kit._id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{kit.nom}</div>
                      <div className="text-sm text-gray-600">
                        {kit.machineType} - Service {kit.serviceNumber}
                      </div>
                    </div>
                    {selections[machine._id] === kit._id && (
                      <CheckCircle className="text-green-500" size={20} />
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-yellow-800">
                  ⚠️ Aucun kit d'entretien trouvé pour le type : <strong>{machineType || 'Non défini'}</strong>
                </p>
                <p className="text-sm text-yellow-600 mt-2">
                  Machine: {machine.nom} | Model: {machine.model || 'N/A'} | MachineType: {machine.machineType || 'N/A'}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  💡 Vérifiez la console pour voir la structure complète de la machine
                </p>
              </div>
            )}
          </Card>
        );
      })}

      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleConfirm}
          disabled={Object.keys(selections).length !== machineIds.length}
        >
          Valider la sélection ({Object.keys(selections).length}/{machineIds.length})
        </Button>
      </div>
    </div>
  );
}
