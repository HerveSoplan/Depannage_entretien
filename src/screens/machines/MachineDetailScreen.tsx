//MachineDetailScreen.tsx
import { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ArrowLeft, Edit, MapPin, Calendar, Settings, Wrench, History, Navigation, Target, Cpu, Zap, Clock, Database } from 'lucide-react';
import { useInterventions } from '../../hooks/useInterventions';
import { useMaintenanceKits } from '../../hooks/useMaintenanceKits';
import { getCurrentPosition, openNavigation } from '../../utils/geoUtils';
import { db } from '../../lib/supabase';
import { InterventionHistoryCard } from '../../components/domain/InterventionHistoryCard';

interface MachineDetailScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  machineId: string;
  clientId?: string;
}

export function MachineDetailScreen({ onNavigate, machineId, clientId }: MachineDetailScreenProps) {
  const { interventions, fetchInterventions } = useInterventions();
  const { maintenanceKits, fetchMaintenanceKits } = useMaintenanceKits();

  const [machine, setMachine] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [machineInterventions, setMachineInterventions] = useState<any[]>([]);
  const [machineKits, setMachineKits] = useState<any[]>([]);
  const [geolocating, setGeolocating] = useState(false);
  const [editingVersion, setEditingVersion] = useState(false);
  const [versionNumero, setVersionNumero] = useState('');

  useEffect(() => {
    loadData();
  }, [machineId]);

  const loadData = async () => {
    try {
      const machineData = await db.machines.get(machineId);
      setMachine(machineData);

      if (machineData?.clientId) {
        const clientData = await db.clients.get(machineData.clientId);
        setClient(clientData);
      }

      await fetchInterventions({ filter: { machineIds: machineId }, limit: 200 });
      await fetchMaintenanceKits({ filter: { machineId }, limit: 100 });
    } catch (error) {
      console.error('❌ Erreur chargement machine:', error);
    }
  };

  useEffect(() => {
    if (machine) {
      const filtered = interventions.filter(i => i.machineIds?.includes(machineId))
        .sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime());
      setMachineInterventions(filtered);

      const kits = maintenanceKits.filter(k => k.machineId === machineId);
      setMachineKits(kits);
    }
  }, [interventions, maintenanceKits, machine, machineId]);

  const openInMaps = () => {
    if (machine?.gpsLat && machine?.gpsLng) {
      openNavigation(parseFloat(machine.gpsLat), parseFloat(machine.gpsLng));
    }
  };

  const handleGeolocateMachine = async () => {
    setGeolocating(true);
    try {
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      await db.machines.update(machineId, {
        gpsLat: lat.toString(),
        gpsLng: lng.toString(),
        gpsSource: 'FIELD',
        gpsConfirmedAt: new Date().toISOString(),
        lastUpdatedBy: 'system',
        updatedAt: new Date().toISOString()
      });

      alert('✅ Position GPS de la machine enregistrée avec succès !');
      loadData();
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      alert('❌ Impossible d\'obtenir la position GPS. Vérifiez les autorisations.');
    } finally {
      setGeolocating(false);
    }
  };

  const handleSaveVersion = async () => {
    try {
      await db.machines.update(machineId, {
        versionNumero: versionNumero,
        updatedAt: new Date().toISOString()
      });
      setEditingVersion(false);
      loadData();
    } catch (error) {
      console.error('Erreur sauvegarde version:', error);
      alert('❌ Erreur lors de la sauvegarde du numéro de version');
    }
  };

  if (!machine) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-500">Chargement de la machine...</p>
      </Card>
    );
  }

  const effectiveType = machine.typeMachine || machine.type_machine || machine.configType || '';

  // Helper pour afficher le style de configuration
  const getConfigStyle = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('pump') || t.includes('pompe')) return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Pompe à vide', icon: <Cpu size={20} /> };
    if (t.includes('v300') || t.includes('v 300')) return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'V 300', icon: <Zap size={20} /> };
    if (t.includes('vms')) return { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'VMS 2014', icon: <Wrench size={20} /> };
    return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: type || 'Configuration', icon: <Settings size={20} /> };
  };

  // Traitement des données de configuration dynamique
  const customFieldsObj = (machine.customFields && typeof machine.customFields === 'object' && !Array.isArray(machine.customFields))
    ? machine.customFields
    : {};

  const ignoredKeys = new Set(['notes', 'gpsSource', 'versionNumero', 'extraFields', 'customFields']);
  const dynamicConfigEntries = Object.entries(customFieldsObj).filter(([k, v]) => !ignoredKeys.has(k) && v !== null && v !== undefined && v !== '');

  // Récupération des extraFields additionnels
  const additionalDetails: Array<{ label: string; value: string }> = [
    ...(Array.isArray(customFieldsObj.extraFields) ? customFieldsObj.extraFields : []),
    ...(Array.isArray(machine.extraFields) ? machine.extraFields : []),
    ...(Array.isArray(machine.pumpExtraFields) ? machine.pumpExtraFields : []),
    ...(Array.isArray(machine.v300ExtraFields) ? machine.v300ExtraFields : []),
    ...(Array.isArray(machine.otherExtraFields) ? machine.otherExtraFields : [])
  ].filter(item => item && item.label && item.value);

  // Champs personnalisés libres additionnels (format { name, value, type })
  const freeformCustomFields: any[] = Array.isArray(machine.customFields)
    ? machine.customFields
    : (Array.isArray(customFieldsObj.customFields) ? customFieldsObj.customFields : []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" onClick={() => clientId ? onNavigate('client-detail', { clientId }) : onNavigate('machines')} className="flex items-center gap-2">
            <ArrowLeft size={20} />
            Retour
          </Button>
          <div>
            {client && clientId && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span className="hover:text-blue-600 cursor-pointer" onClick={() => onNavigate('client-detail', { clientId })}>
                  {client.nom}
                </span>
                <span>›</span>
                <span className="text-gray-700 font-medium">Machine {machine.numeroSerie}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{machine.modele || machine.model || machine.nom}</h1>
              {effectiveType && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full flex items-center gap-1.5">
                  <Database size={14} />
                  {effectiveType}
                </span>
              )}
              {machine.typeRelation && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                  {machine.typeRelation}
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-1">N° de série: <strong>{machine.numeroSerie}</strong></p>

            {/* Version N° éditable */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-gray-600 text-sm">Version N°:</span>
              {editingVersion ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={versionNumero}
                    onChange={(e) => setVersionNumero(e.target.value)}
                    className="px-2 py-1 border border-blue-300 rounded text-sm w-32 focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 1.0"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveVersion}
                    className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setEditingVersion(false);
                      setVersionNumero(machine.versionNumero || '');
                    }}
                    className="px-2 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span
                  onClick={() => setEditingVersion(true)}
                  className="text-blue-600 font-medium text-sm cursor-pointer hover:underline"
                >
                  {machine.versionNumero || 'Cliquer pour ajouter'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {machine.gpsLat && machine.gpsLng && (
            <Button variant="secondary" onClick={openInMaps} className="flex items-center gap-2">
              <Navigation size={18} />
              Itinéraire
            </Button>
          )}
          <Button variant="secondary" onClick={handleGeolocateMachine} disabled={geolocating} className="flex items-center gap-2">
            <Target size={18} />
            {geolocating ? 'Géolocalisation...' : 'Géolocaliser'}
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('machine-form', { machineId })} className="flex items-center gap-2">
            <Edit size={18} />
            Modifier
          </Button>
          <Button variant="primary" onClick={() => onNavigate('intervention-form', { machineId, clientId: machine.clientId })} className="flex items-center gap-2">
            <Wrench size={18} />
            Intervention
          </Button>
        </div>
      </div>

      {/* Infos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Client</h2>
          {client ? (
            <div className="space-y-2">
              <div className="font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => onNavigate('client-detail', { clientId: client._id })}>
                {client.nom}
              </div>
              <div className="text-gray-600 text-sm">{client.nomFerme}</div>
              <div className="text-sm text-gray-500">{client.ville} ({client.codePostal})</div>
              <div className="text-xs text-gray-500">N° {client.numeroClient}</div>
            </div>
          ) : (
            <p className="text-gray-500">Client non trouvé</p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Dates
          </h2>
          <div className="space-y-3">
            {machine.dateInstallation && (
              <div>
                <div className="text-sm text-gray-600">Installation</div>
                <div className="font-medium">{new Date(machine.dateInstallation).toLocaleDateString('fr-FR')}</div>
              </div>
            )}
            {machine.dateDernierEntretien && (
              <div>
                <div className="text-sm text-gray-600">Dernier entretien</div>
                <div className="font-medium">{new Date(machine.dateDernierEntretien).toLocaleDateString('fr-FR')}</div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings size={20} />
            Techniques
          </h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Compteur</div>
              <div className="font-medium text-2xl text-blue-600">{machine.compteur || 0}h</div>
            </div>
            {machine.gpsLat && machine.gpsLng && (
              <div>
                <div className="text-sm text-gray-600 mb-2">GPS</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  {machine.gpsSource === 'FIELD' ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1"><Target size={12} /> Terrain</span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1"><MapPin size={12} /> Adresse</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ✅ BLOC CONFIGURATION SPÉCIFIQUE DYNAMIQUE (Issu de la table machine_fields) */}
      {(effectiveType || dynamicConfigEntries.length > 0 || machine.pumpType || machine.v300Option) && (
        <div className={`p-5 rounded-xl border-l-4 ${getConfigStyle(effectiveType)?.bg} ${getConfigStyle(effectiveType)?.border}`}>
          <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-full bg-white shadow-sm ${getConfigStyle(effectiveType)?.color}`}>
                {getConfigStyle(effectiveType)?.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  Configuration Spécifique : {effectiveType || 'Standard'}
                </h3>
                <p className="text-xs text-gray-500">
                  Paramètres et caractéristiques enregistrés depuis la table dédiée
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Affichage direct des colonnes historiques spécifiques si présentes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {machine.pumpType && (
                <div className="bg-white/80 p-3 rounded-lg border border-blue-100 shadow-sm">
                  <div className="text-xs text-gray-500 uppercase font-semibold">Type de Pompe</div>
                  <div className="font-semibold text-gray-900 mt-0.5">{machine.pumpType}</div>
                </div>
              )}
              {machine.pumpVariator && (
                <div className="bg-white/80 p-3 rounded-lg border border-blue-100 shadow-sm">
                  <div className="text-xs text-gray-500 uppercase font-semibold">Variateur</div>
                  <div className="font-semibold text-gray-900 mt-0.5">{machine.pumpVariator}</div>
                </div>
              )}
              {machine.pumpCabinet && (
                <div className="bg-white/80 p-3 rounded-lg border border-blue-100 shadow-sm">
                  <div className="text-xs text-gray-500 uppercase font-semibold">Armoire</div>
                  <div className="font-semibold text-gray-900 mt-0.5">{machine.pumpCabinet}</div>
                </div>
              )}
              {machine.v300Option && (
                <div className="bg-white/80 p-3 rounded-lg border border-green-100 shadow-sm">
                  <div className="text-xs text-gray-500 uppercase font-semibold">Option Principale</div>
                  <div className="font-semibold text-gray-900 mt-0.5">{machine.v300Option}</div>
                </div>
              )}
            </div>

            {/* Affichage des champs dynamiques enregistrés */}
            {dynamicConfigEntries.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dynamicConfigEntries.map(([key, val], idx) => (
                  <div key={idx} className="bg-white/80 p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{key}</div>
                    <div className="font-semibold text-gray-900 mt-0.5 text-base">
                      {val === 'true' || val === true ? '✅ Oui' : (val === 'false' || val === false ? '❌ Non' : String(val))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Description générale si renseignée */}
            {machine.otherConfigDetails && (
              <div className="bg-white/80 p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Description générale</div>
                <div className="font-medium text-gray-900 whitespace-pre-wrap">{machine.otherConfigDetails}</div>
              </div>
            )}

            {/* Caractéristiques additionnelles libres */}
            {additionalDetails.length > 0 && (
              <div className="pt-3 border-t border-gray-200/80">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Caractéristiques additionnelles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {additionalDetails.map((field, index) => (
                    <div key={index} className="bg-white/90 p-2.5 rounded-lg border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 uppercase font-semibold">{field.label}</div>
                      <div className="font-medium text-gray-800">{field.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Champs personnalisés libres */}
      {freeformCustomFields.length > 0 && (
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings size={20} />
            Champs personnalisés
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {freeformCustomFields.map((field: any, index: number) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">{field.name || field.label}</div>
                <div className="font-medium text-gray-800">
                  {field.type === 'boolean' ? (field.value === 'true' || field.value === true ? 'Oui' : 'Non') : field.value}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Kits d'entretien */}
      {machineKits.length > 0 && (
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={20} />
            Kits d'entretien
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machineKits.map((kit) => (
              <div key={kit._id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="font-medium text-lg mb-2">{kit.nom}</div>
                <div className="text-sm text-gray-600 mb-3">{kit.description}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{kit.sections?.length || 0} sections</span>
                  {kit.ordre && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Kit #{kit.ordre}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Historique des interventions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History size={20} />
            Historique ({machineInterventions.length})
          </h2>
        </div>

        {machineInterventions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune intervention</p>
        ) : (
          <div className="space-y-3">
            {machineInterventions.slice(0, 10).map((intervention) => (
              <InterventionHistoryCard
                key={intervention._id}
                intervention={intervention}
                onNavigate={onNavigate}
                showClient={true}
                showMachine={false}
              />
            ))}

            {machineInterventions.length > 10 && (
              <Button variant="ghost" className="w-full" onClick={() => onNavigate('interventions', { machineId })}>
                Voir toutes les interventions ({machineInterventions.length})
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-600">{machineInterventions.length}</div>
          <div className="text-sm text-gray-600 mt-1">Interventions</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">{machineInterventions.filter(i => i.statut === 'TERMINEE').length}</div>
          <div className="text-sm text-gray-600 mt-1">Terminées</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-yellow-600">{machineInterventions.filter(i => i.statut === 'EN_COURS').length}</div>
          <div className="text-sm text-gray-600 mt-1">En cours</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-purple-600">{machineKits.length}</div>
          <div className="text-sm text-gray-600 mt-1">Kits</div>
        </Card>
      </div>
    </div>
  );
}
