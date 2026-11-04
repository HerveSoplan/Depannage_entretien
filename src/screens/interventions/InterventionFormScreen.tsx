//InterventionFormScreen.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ArrowLeft, Save, MapPin, Clock, Play, Pause, StopCircle, Plus, X, Search, Package, FileText, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useMachines } from '../../hooks/useMachines';
import { useInterventions } from '../../hooks/useInterventions';
import { useSpareParts } from '../../hooks/useSpareParts';
import { INTERVENTION_TYPES } from '../../constants';
import { useInterventionGPS } from '../../hooks/useInterventionGPS';
import { getCurrentPosition } from '../../utils/geoUtils';
import { db } from '../../lib/supabase';
import { ErrorCodeSearchModal } from '../../components/common/ErrorCodeSearchModal';
import { useErrorCodes } from '../../hooks/useErrorCodes';
import { useSelectedClient } from '../../contexts/SelectedClientContext';

interface InterventionFormScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  interventionId?: string;
  clientId?: string;
  machineId?: string;
  maintenanceSelectionData?: any;
  readOnly?: boolean;  // ⬅️ Enlève l'espace avant le point-virgule
}

interface Diagnostic {
  id: string;
  constatation: string;
  resolu: boolean;
  action: string;
}

interface SelectedPart {
  partId: string;
  quantity: number;
}

export function InterventionFormScreen({
  onNavigate,
  interventionId,
  clientId,
  machineId,
  maintenanceSelectionData,  // ⬅️ AJOUTE LA VIRGULE ICI
  readOnly = false
}: InterventionFormScreenProps) {
  console.log('🔍 [FORM] readOnly reçu:', readOnly);
  const { clients, fetchClients } = useClients();
  const { machines, fetchMachines } = useMachines();
  const { createIntervention, updateIntervention } = useInterventions();
  const { spareParts, fetchSpareParts } = useSpareParts();
  const { selectedClient: globalSelectedClient } = useSelectedClient();

  // États Modal et Recherche instantanée de Codes Erreur
  const [isErrorCodeModalOpen, setIsErrorCodeModalOpen] = useState(false);
  const [errorCodeInput, setErrorCodeInput] = useState('');
  const [showErrorCodeSuggestions, setShowErrorCodeSuggestions] = useState(false);
  const [inscribedCodeMessage, setInscribedCodeMessage] = useState<string | null>(null);
  const lastInscribedCodeRef = useRef<string | null>(null);

  // Chargement des codes erreur
  const { errorCodes } = useErrorCodes();

  // Codes erreur filtrés dès le 1er caractère / chiffre saisi
  const matchingErrorCodes = useMemo(() => {
    const query = errorCodeInput.trim().toLowerCase();
    if (!query) return [];

    return errorCodes
      .filter((c: any) => {
        const alarme = (c.alarme || c.Alarme || '').toLowerCase();
        const titre = (c.titre || c.Titre || '').toLowerCase();
        const cause = (c.cause || c.Cause || '').toLowerCase();
        const action = (c.action || c.Action || '').toLowerCase();
        const typeAlarme = (c.typeAlarme || c.Type_alarme || c.type_alarme || '').toLowerCase();
        return (
          alarme.includes(query) ||
          titre.includes(query) ||
          cause.includes(query) ||
          action.includes(query) ||
          typeAlarme.includes(query)
        );
      })
      .sort((a: any, b: any) => {
        const aAlarme = (a.alarme || a.Alarme || '').toLowerCase();
        const bAlarme = (b.alarme || b.Alarme || '').toLowerCase();
        // 1. Correspondance exacte en priorité absolue
        const aExact = aAlarme === query;
        const bExact = bAlarme === query;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        // 2. Préfixe commençant par le terme (ex: "8" ou "8." affiche "8.16..." en premier)
        const aStarts = aAlarme.startsWith(query);
        const bStarts = bAlarme.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        // 3. Contient la portion dans le code d'alarme (ex: "6.10" dans "8.16.6.10")
        const aInAlarme = aAlarme.includes(query);
        const bInAlarme = bAlarme.includes(query);
        if (aInAlarme && !bInAlarme) return -1;
        if (!aInAlarme && bInAlarme) return 1;
        return aAlarme.localeCompare(bAlarme, undefined, { numeric: true });
      });
  }, [errorCodes, errorCodeInput]);

  // Fonction universelle d'inscription du code erreur dans le formulaire
  const applyErrorCode = useCallback((code: any, isAuto: boolean = false) => {
    if (!code) return;
    const alarme = (code.alarme || code.Alarme || code.code || '').trim();
    let titre = code.titre || code.Titre || '';
    let cause = code.cause || code.Cause || '';
    let action = code.action || code.Action || '';

    if (!titre && !cause && !action && (code.chapitre || code.Chapitre)) {
      const chap = code.chapitre || code.Chapitre;
      const parts = chap.split(",");
      if (parts.length >= 6) {
        titre = parts[1].replace(/\//g, '').trim();
        cause = parts[4].replace(/\//g, '').trim();
        action = parts[5].replace(/\//g, '').trim();
      }
    }

    const text = `CODE ERREUR: ${alarme}\nTITRE: ${titre || 'N/A'}\nCAUSE: ${cause || 'N/A'}\nACTION: ${action || 'N/A'}`;
    setFormData(prev => ({
      ...prev,
      diagnostic: text
    }));

    lastInscribedCodeRef.current = alarme;
    const msg = isAuto
      ? `Code erreur ${alarme}${titre ? ` (${titre})` : ''} inscrit automatiquement dans le diagnostic.`
      : `Code erreur ${alarme}${titre ? ` (${titre})` : ''} sélectionné et inscrit dans le diagnostic.`;
    setInscribedCodeMessage(msg);
    // En mode automatique on garde les suggestions ouvertes pour visibilité
    if (!isAuto) {
      setShowErrorCodeSuggestions(false);
    }
  }, []);

  // Détection et inscription automatique dès le 1er chiffre / saisie
  useEffect(() => {
    const query = errorCodeInput.trim().toLowerCase();
    if (!query) {
      lastInscribedCodeRef.current = null;
      return;
    }

    // 1. Inscription automatique dès que la saisie correspond exactement à un code d'alarme
    const exactMatch = matchingErrorCodes.find(
      (c: any) => (c.alarme || c.Alarme || '').trim().toLowerCase() === query
    );
    if (exactMatch) {
      const codeKey = (exactMatch.alarme || exactMatch.Alarme || '').trim();
      if (lastInscribedCodeRef.current !== codeKey) {
        applyErrorCode(exactMatch, true);
      }
      return;
    }

    // 2. Inscription automatique dès le 1er chiffre si correspondance unique dans la base
    if (matchingErrorCodes.length === 1 && query.length >= 1) {
      const singleMatch = matchingErrorCodes[0];
      const singleAlarme = (singleMatch.alarme || singleMatch.Alarme || '').trim().toLowerCase();
      const codeKey = (singleMatch.alarme || singleMatch.Alarme || '').trim();
      if ((singleAlarme.startsWith(query) || singleAlarme.includes(query)) && lastInscribedCodeRef.current !== codeKey) {
        applyErrorCode(singleMatch, true);
      }
    }
  }, [errorCodeInput, matchingErrorCodes, applyErrorCode]);

  // Bloc UI de recherche instantanée de code erreur réutilisable
  const renderErrorCodeSearchSection = () => (
    <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50/70">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <label className="block text-sm font-bold text-blue-900">
          Recherche instantanée de Code Erreur
        </label>
        <span className="text-xs text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full font-medium">
          Dès le 1er chiffre & inscription automatique
        </span>
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Tapez le code (ex: 8 ou 8.16.7.25)..."
              value={errorCodeInput}
              onChange={(e) => {
                setErrorCodeInput(e.target.value);
                setShowErrorCodeSuggestions(true);
              }}
              onFocus={() => {
                if (errorCodeInput.trim().length >= 1) {
                  setShowErrorCodeSuggestions(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (matchingErrorCodes.length > 0) {
                    applyErrorCode(matchingErrorCodes[0], false);
                  }
                }
              }}
              className="w-full pl-9 pr-8"
              disabled={readOnly}
            />
            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={18} />
            {errorCodeInput && !readOnly && (
              <button
                type="button"
                onClick={() => {
                  setErrorCodeInput('');
                  setShowErrorCodeSuggestions(false);
                }}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                title="Effacer la recherche"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsErrorCodeModalOpen(true)}
            className="flex items-center gap-1.5 whitespace-nowrap text-sm"
            disabled={readOnly}
          >
            <Search size={16} />
            Parcourir tout
          </Button>
        </div>

        {/* Alerte confirmation inscription automatique */}
        {inscribedCodeMessage && (
          <div className="mt-2.5 p-2.5 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-xs text-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
              <span className="font-medium">{inscribedCodeMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setInscribedCodeMessage(null)}
              className="text-green-600 hover:text-green-800 ml-2"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Suggestions instantanées dès le 1er caractère / chiffre */}
        {showErrorCodeSuggestions && errorCodeInput.trim().length >= 1 && (
          <div className="mt-2 bg-white border border-blue-200 rounded-lg shadow-lg max-h-72 overflow-y-auto divide-y divide-gray-100 z-20">
            <div className="p-2 bg-blue-100 text-xs font-semibold text-blue-900 flex justify-between items-center sticky top-0 z-10">
              <span>
                {matchingErrorCodes.length} résultat{matchingErrorCodes.length > 1 ? 's' : ''} trouvé{matchingErrorCodes.length > 1 ? 's' : ''} pour « {errorCodeInput} »
              </span>
              <span className="text-gray-500 text-[11px] font-normal">
                Cliquez pour inscrire ou Entrée
              </span>
            </div>

            {matchingErrorCodes.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <AlertCircle size={16} className="text-amber-500" />
                <span>Aucun code erreur correspondant à « {errorCodeInput} »</span>
              </div>
            ) : (
              matchingErrorCodes.slice(0, 15).map((code: any) => {
                const alarme = code.alarme || code.Alarme || code.code || 'Code inconnu';
                const titre = code.titre || code.Titre || '';
                const cause = code.cause || code.Cause || '';
                const action = code.action || code.Action || '';
                const isCurrent = formData.diagnostic.includes(`CODE ERREUR: ${alarme}`);

                return (
                  <div
                    key={code._id || code.id || alarme}
                    onClick={() => applyErrorCode(code, false)}
                    className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors flex items-start justify-between gap-3 ${
                      isCurrent ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-900 text-sm">{alarme}</span>
                        {titre && (
                          <span className="text-xs font-semibold text-gray-800 truncate">
                            - {titre}
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-semibold">
                            Inscrit ✓
                          </span>
                        )}
                      </div>
                      {cause && (
                        <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
                          <span className="font-semibold text-gray-700">Cause :</span> {cause}
                        </p>
                      )}
                      {action && (
                        <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
                          <span className="font-semibold text-gray-700">Action :</span> {action}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isCurrent ? "secondary" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        applyErrorCode(code, false);
                      }}
                      className="text-xs py-1 px-2.5 h-auto flex-shrink-0"
                    >
                      {isCurrent ? 'Réinscrire' : 'Inscrire'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );

  const [formData, setFormData] = useState({
    type: 'REPAIR' as 'REPAIR' | 'MAINTENANCE' | 'INSTALLATION' | 'COMMISSIONING',
    clientId: clientId || globalSelectedClient?._id || '',
    machineIds: machineId ? [machineId] : [] as string[],
    technicienId: 'TECH001',
    statut: 'PLANIFIEE' as 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE',
    dateDebut: new Date().toISOString().slice(0, 16),
    diagnostic: '',
    actionsRealisees: '',
    gpsLat: '',
    gpsLng: ''
  });

  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientMachines, setClientMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [interventionStarted, setInterventionStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [newConstatation, setNewConstatation] = useState('');
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  /* const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]); */ // Suppression ligne dupliquée
  const [partSearchQuery, setPartSearchQuery] = useState('');
  const [showPartSearch, setShowPartSearch] = useState(false);

  // Refs pour éviter les boucles infinies de chargement
  const clientsLoadedRef = useRef<string | null>(null);
  const machinesLoadedRef = useRef<string | null>(null);

  const gpsTracking = useInterventionGPS({
    machineId: selectedMachine?._id || '',
    machineLat: parseFloat(selectedMachine?.gpsLat || '0'),
    machineLng: parseFloat(selectedMachine?.gpsLng || '0'),
    onAutoStart: () => { alert('🎯 Intervention démarrée automatiquement'); handleStartIntervention(); },
    onAutoPause: () => { alert('⏸️ Intervention en pause'); },
    onAutoResume: () => { alert('▶️ Intervention reprise'); }
  });

  // ✅ CHARGEMENT INITIAL (Données globales)
  useEffect(() => {
    fetchClients({ limit: 100 });
    fetchMachines({ limit: 100 });
    fetchSpareParts({ limit: 200 });
    loadCurrentUser();
  }, []);

  // ✅ Chargement au montage du composant
  useEffect(() => {
    if (interventionId) {
      console.log('🔄 Chargement de l\'intervention existante:', interventionId);
      loadInterventionData(interventionId);
    }
  }, []); // ⬅️ TABLEAU VIDE = charge une seule fois au montage
  const loadInterventionData = async (id: string) => {
    try {
      const result = await db.interventions.get(id);

      if (!result) {
        console.error('❌ Intervention non trouvée:', id);
        alert('Cette intervention n\'existe plus ou a été supprimée.');
        onNavigate('interventions');
        return;
      }

      if (result) {
        console.log('✅ Données chargées, mise à jour du formulaire');

        // 1. Mise à jour du formulaire principal
        setFormData({
          type: result.type,
          clientId: result.clientId,
          machineIds: result.machineIds || [],
          technicienId: result.technicienId || 'TECH001',
          statut: result.statut,
          dateDebut: result.dateDebut ? new Date(result.dateDebut).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          diagnostic: result.diagnostic || '',
          actionsRealisees: result.actionsRealisees || '',
          gpsLat: result.gpsLat || '',
          gpsLng: result.gpsLng || ''
        });

        // 🔴 2. RESTAURATION DE PROTOCOLDATA (avec vérifications strictes)
        console.log('📦 PROTOCOLDATA CHARGÉ:', result.protocolData);

        if (result.protocolData) {
          // Restaurer les diagnostics depuis protocolData
          if (result.protocolData.diagnostics && Array.isArray(result.protocolData.diagnostics)) {
            console.log('✅ Restauration diagnostics depuis protocolData');
            setDiagnostics(result.protocolData.diagnostics);
          }

          // Restaurer les pièces depuis protocolData
          if (result.protocolData.pieces && Array.isArray(result.protocolData.pieces)) {
            console.log('✅ Restauration pièces depuis protocolData');
            setSelectedParts(result.protocolData.pieces);
          }
        }

        // 🔴 3. FALLBACK : Restauration depuis les anciens champs (si protocolData vide)
        // Restauration des Diagnostics (si stockés en JSON dans le vieux format)
        if (!result.protocolData?.diagnostics && result.diagnostics) {
          try {
            // Vérifier que ce n'est pas la chaîne "undefined"
            if (result.diagnostics !== 'undefined' && result.diagnostics !== 'null' && result.diagnostics !== '') {
              const parsedDiagnostics = JSON.parse(result.diagnostics);
              console.log('⚠️ Restauration diagnostics depuis ancien format');
              setDiagnostics(parsedDiagnostics);
            }
          } catch (e) {
            console.error('❌ Erreur parsing diagnostics:', e);
          }
        }

        // Restauration des Pièces (si stockées en JSON dans le vieux format)
        if (!result.protocolData?.pieces && result.piecesUtilisees) {
          try {
            // Vérifier que ce n'est pas la chaîne "undefined"
            if (result.piecesUtilisees !== 'undefined' && result.piecesUtilisees !== 'null' && result.piecesUtilisees !== '') {
              const parsedParts = JSON.parse(result.piecesUtilisees);
              console.log('⚠️ Restauration pièces depuis ancien format');
              setSelectedParts(parsedParts.map((p: any) => ({ partId: p.partId, quantity: p.quantity })));
            }
          } catch (e) {
            console.error('❌ Erreur parsing pièces:', e);
          }
        }

        // 4. Gestion de l'état "Démarré" pour le chrono/GPS
        if (result.statut === 'EN_COURS') {
          setInterventionStarted(true);
          setStartTime(new Date(result.dateDebut));
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement intervention:', error);
      alert('Impossible de charger les données de cette intervention.');
    }
  };


  // Pré-remplissage maintenance
  useEffect(() => {
    if (maintenanceSelectionData && !interventionId) {
      console.log('📥 [MAINTENANCE] Pré-remplissage du formulaire avec la sélection');

      const machineIds = maintenanceSelectionData.machineKitSelections.map((s: any) => s.machineId);

      setFormData(prev => ({
        ...prev,
        type: 'MAINTENANCE',
        clientId: maintenanceSelectionData.clientId || prev.clientId,
        machineIds: machineIds,
        actionsRealisees: 'Maintenance programmée'
      }));
    }
  }, [maintenanceSelectionData, interventionId]);

  const loadCurrentUser = async () => {
    try {
      const result: any = await db.utilisateurs.list({ limit: 1 });
      const usersList = Array.isArray(result) ? result : (result.list || []);
      if (usersList.length > 0) setCurrentUser(usersList[0]);
    } catch (error) { console.error('Erreur chargement user:', error); }
  };

  // Gestion du Client
  useEffect(() => {
    if (formData.clientId) {
      const foundClient = clients.find(c => c._id === formData.clientId);
      setSelectedClient(foundClient || null);

      if (!foundClient && clientsLoadedRef.current !== formData.clientId) {
        clientsLoadedRef.current = formData.clientId;
        console.log('🔄 Chargement client manquant:', formData.clientId);
        fetchClients({ filter: { _id: formData.clientId } });
      }
    }
  }, [formData.clientId, clients]);

  // Gestion des Machines
  useEffect(() => {
    if (formData.clientId) {
      const filtered = machines.filter(m => m.client_id === formData.clientId || m.clientId === formData.clientId);
      setClientMachines(filtered);

      if (filtered.length === 0 && machinesLoadedRef.current !== formData.clientId) {
        console.log('⚠️ Machines vides pour le client:', formData.clientId, '=> Chargement spécifique...');
        machinesLoadedRef.current = formData.clientId;
        fetchMachines({ filter: { clientId: formData.clientId } });
      }
    } else {
      setSelectedClient(null);
      setClientMachines([]);
      setFormData(prev => ({ ...prev, machineIds: [] }));
    }
  }, [formData.clientId, machines]);

  useEffect(() => {
    if (!interventionStarted || !startTime || gpsTracking?.isPaused) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [interventionStarted, startTime, gpsTracking?.isPaused]);

  useEffect(() => {
    if (formData.machineIds.length > 0) {
      setSelectedMachine(machines.find(m => m._id === formData.machineIds[0]));
    } else {
      setSelectedMachine(null);
    }
  }, [formData.machineIds, machines]);

  // --- Helpers Diagnostics & Pièces ---
  const addDiagnostic = () => {
    if (!newConstatation.trim()) return alert('Veuillez saisir une constatation');
    setDiagnostics(prev => [...prev, { id: Date.now().toString(), constatation: newConstatation, resolu: false, action: '' }]);
    setNewConstatation('');
  };
  const removeDiagnostic = (id: string) => setDiagnostics(prev => prev.filter(d => d.id !== id));
  const updateDiagnosticAction = (id: string, action: string) => setDiagnostics(prev => prev.map(d => d.id === id ? { ...d, action } : d));
  const toggleDiagnosticResolved = (id: string) => setDiagnostics(prev => prev.map(d => d.id === id ? { ...d, resolu: !d.resolu } : d));

  const addSparePart = (partId: string) => {
    if (selectedParts.find(p => p.partId === partId)) return alert('Pièce déjà ajoutée');
    setSelectedParts(prev => [...prev, { partId, quantity: 1 }]);
    setShowPartSearch(false);
    setPartSearchQuery('');
  };
  const updatePartQuantity = (partId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedParts(prev => prev.map(p => p.partId === partId ? { ...p, quantity } : p));
  };
  const removeSparePart = (partId: string) => setSelectedParts(prev => prev.filter(p => p.partId !== partId));
  const filteredSpareParts = spareParts.filter(part =>
    part.reference?.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
    part.designation?.toLowerCase().includes(partSearchQuery.toLowerCase())
  );

  const handleGetLocation = async () => {
    try {
      const pos = await getCurrentPosition();
      setFormData(prev => ({ ...prev, gpsLat: pos.coords.latitude.toString(), gpsLng: pos.coords.longitude.toString() }));
      alert('✅ Position GPS enregistrée !');
    } catch (error) { alert('❌ Impossible d\'obtenir la position'); }
  };

  const handleStartIntervention = () => {
    setInterventionStarted(true);
    setStartTime(new Date());
    setFormData(prev => ({ ...prev, statut: 'EN_COURS' }));
  };

  const handleManualStart = async () => {
    if (!selectedMachine?.gpsLat || !selectedMachine?.gpsLng) return alert('⚠️ Pas de GPS sur cette machine');
    try { await gpsTracking?.manualStart(); handleStartIntervention(); }
    catch (error) { alert('❌ Erreur démarrage'); }
  };

  const handleEndIntervention = () => {
    gpsTracking?.endIntervention();
    setFormData(prev => ({ ...prev, statut: 'TERMINEE' }));
  };

  const formatElapsedTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleMachine = (machineId: string) => {
    setFormData(prev => ({
      ...prev,
      machineIds: prev.machineIds.includes(machineId) ? prev.machineIds.filter(id => id !== machineId) : [...prev.machineIds, machineId]
    }));
  };

  // --- FONCTION POUR DÉMARRER LE DÉPANNAGE ---
  const handleStartTroubleshooting = async () => {
    if (!formData.clientId || formData.machineIds.length === 0) {
      alert('Veuillez sélectionner un client et une machine.');
      return;
    }

    try {
      // 1. On génère le numéro d'intervention
      const now = new Date();
      const numeroIntervention =
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        formData.technicienId.slice(-3);

      // 2. On crée l'intervention en base pour avoir un ID
      const newIntervention = await createIntervention({
        ...formData,
        numeroIntervention,
        statut: 'EN_COURS',
        dateDebut: new Date().toISOString(),
        creator: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('✅ Intervention Dépannage créée, ID:', newIntervention._id);

      // 3. IMPORTANT : On redirige vers l'écran de dépannage
      onNavigate('troubleshooting', {
        interventionId: newIntervention._id,
        clientId: newIntervention.clientId,
        machineId: newIntervention.machineIds[0] // On prend la première machine
      });

    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du démarrage du dépannage');
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || formData.machineIds.length === 0) return alert('Client et Machine requis');
    setLoading(true);

    try {
      const now = new Date();
      const numeroIntervention =
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        formData.technicienId.slice(-3);

      let maintenanceData = undefined;
      if (maintenanceSelectionData) {
        maintenanceData = {
          machines: maintenanceSelectionData.machineKitSelections.map((sel: any) => {
            const sections = maintenanceSelectionData.sectionsData?.[sel.machineId] || [];
            return {
              machineId: sel.machineId,
              machineNom: machines.find(m => m._id === sel.machineId)?.nom || 'Machine',
              kitId: sel.kitId,
              kitNom: 'Kit d\'entretien',
              sections: sections.map((section: any) => ({
                sectionNom: section.nom,
                tachesIds: section.taches?.map((t: any) => t.idTache || t._id) || [],
                tachesCompletees: [],
                progression: 0
              }))
            };
          }),
          tachesCompletees: [],
          progressionGlobale: 0,
          totalTaches: maintenanceSelectionData.machineKitSelections.reduce((total: number, sel: any) => {
            const sections = maintenanceSelectionData.sectionsData?.[sel.machineId] || [];
            return total + sections.reduce((sum: number, section: any) =>
              sum + (section.taches?.length || 0), 0);
          }, 0),
          tachesCompleteesCount: 0
        };
      }

      const interventionData = {
        ...formData,
        numeroIntervention,
        dateDebut: startTime ? startTime.toISOString() : new Date(formData.dateDebut).toISOString(),
        dateFin: formData.statut === 'TERMINEE' ? new Date().toISOString() : undefined,
        duree: elapsedTime && formData.statut === 'TERMINEE' ? Math.floor(elapsedTime / 60) : undefined,
        totalDuration: elapsedTime && formData.statut === 'TERMINEE' ? Math.floor(elapsedTime / 60) : undefined,
        creator: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...maintenanceData,

        // 🔴 AJOUT DE PROTOCOLDATA
        protocolData: {
          constatations: diagnostics.map(d => d.constatation).join('\n\n'),
          diagnostic: formData.diagnostic,
          pieces: selectedParts,
          actionsRealisees: diagnostics.map(d => d.action).filter(a => a).join('\n\n'),
          diagnostics: diagnostics,
          verifications: {},
          // Pour les interventions de maintenance
          ...(maintenanceSelectionData && {
            sectionsEntretien: maintenanceSelectionData.machineKitSelections || []
          })
        }
      };

      console.log('💾 SAUVEGARDE AVEC PROTOCOLDATA:', interventionData.protocolData);

      let savedId = interventionId;

      if (interventionId) {
        await updateIntervention(interventionId, interventionData);
        const typeEmojis: Record<string, string> = {
          'MAINTENANCE': '⚙️', 'REPAIR': '🔧', 'INSTALLATION': '🔨', 'COMMISSIONING': '🚀'
        };
        alert(`${typeEmojis[formData.type]} Intervention mise à jour avec succès !`);
      } else {
        const created = await createIntervention(interventionData);
        savedId = created._id;

        const typeEmojis: Record<string, string> = {
          'MAINTENANCE': '🔧', 'REPAIR': '🔨', 'INSTALLATION': '📦', 'COMMISSIONING': '🚀'
        };
        const typeLabels: Record<string, string> = {
          'MAINTENANCE': 'Entretien',
          'REPAIR': 'Dépannage',
          'INSTALLATION': 'Installation',
          'COMMISSIONING': 'Mise en service'
        };
        const emoji = typeEmojis[formData.type] || '⚙️';
        const label = typeLabels[formData.type] || 'Intervention';

        alert(`${emoji} ${label} créé(e) avec succès !\nN° ${numeroIntervention}`);
      }

      setTimeout(() => {
        onNavigate('client-detail', { clientId: formData.clientId });
      }, 500);
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert(`❌ Erreur lors de l'enregistrement: ${error instanceof Error ? error.message : 'Inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseIntervention = async () => {
    if (!formData.clientId || formData.machineIds.length === 0) return alert('Client/Machine requis');
    if (diagnostics.some(d => !d.resolu)) {
      if (!confirm('⚠️ Certains diagnostics ne sont pas résolus. Clôturer quand même ?')) return;
    }
    if (!confirm('Clôturer définitivement cette intervention et retourner au client ?')) return;

    console.log('🔴 Clôture...');
    setLoading(true);

    try {
      handleEndIntervention();
      const now = new Date();
      const numeroIntervention =
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        formData.technicienId.slice(-3);

      const interventionData = {
        ...formData,
        statut: 'TERMINEE',
        numeroIntervention,
        dateDebut: startTime ? startTime.toISOString() : new Date(formData.dateDebut).toISOString(),
        dateFin: new Date().toISOString(),
        duree: elapsedTime ? Math.floor(elapsedTime / 60) : undefined,
        totalDuration: elapsedTime ? Math.floor(elapsedTime / 60) : undefined,
        constatations: diagnostics.map(d => d.constatation).join('\n\n'),
        travauxEffectues: diagnostics.map(d => d.action).filter(a => a).join('\n\n'),
        resolu: diagnostics.length > 0 ? diagnostics.every(d => d.resolu) : undefined,
        diagnostics: JSON.stringify(diagnostics),
        piecesUtilisees: JSON.stringify(selectedParts),
        gpsStartLat: gpsTracking?.events[0]?.lat?.toString(),
        gpsStartLng: gpsTracking?.events[0]?.lng?.toString(),
        gpsEndLat: gpsTracking?.currentPosition?.lat?.toString(),
        gpsEndLng: gpsTracking?.currentPosition?.lng?.toString(),
        pausesGps: JSON.stringify(gpsTracking?.events.filter(e => e.type === 'PAUSE' || e.type === 'RESUME')),
        distanceEvents: JSON.stringify(gpsTracking?.events),
        creator: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let savedInterventionId = interventionId;
      if (interventionId) {
        await updateIntervention(interventionId, interventionData);
      } else {
        const newIntervention = await createIntervention(interventionData);
        savedInterventionId = newIntervention._id;
      }

      if (selectedParts.length > 0 && savedInterventionId) {
        for (const sp of selectedParts) {
          try {
            await db.intervention_parts.create({
              interventionId: savedInterventionId.toString(),
              partId: sp.partId.toString(),
              quantite: sp.quantity,
              creator: 'system',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            const part = spareParts.find(p => p._id === sp.partId);
            if (part && part.stock >= sp.quantity) {
              await db.spare_parts.update(sp.partId, { stock: part.stock - sp.quantity, updatedAt: new Date().toISOString() });
            }
          } catch (partError) { console.error('Erreur pièce:', partError); }
        }
      }

      alert(`✅ Intervention Clôturée !\nN° ${numeroIntervention}`);
      onNavigate('interventions');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur clôture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => onNavigate('interventions')} className="flex items-center gap-2">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {interventionId ? 'Modifier l\'intervention' : 'Nouvelle intervention'}
          </h1>
          <p className="text-gray-600 mt-1">Remplissez les informations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ✅ BANDEAU LECTURE SEULE */}
        {readOnly && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📋</div>
                <div>
                  <h3 className="font-bold text-blue-900">Mode consultation - Intervention terminée</h3>
                  <p className="text-sm text-blue-700">Cette intervention est clôturée. Vous ne pouvez pas la modifier.</p>
                </div>
              </div>

              <Button
                type="button"
                onClick={async () => {
                  try {
                    console.log('🔵 Début génération PDF');
                    const { generateInterventionPDF } = await import('../../utils/pdfGenerator');

                    console.log('🔵 Module PDF importé, préparation des données...');

                    // Génération du PDF
                    const pdfData = {
                      intervention: {
                        ...formData,
                        _id: interventionId,
                        numeroIntervention: formData.numeroIntervention || interventionId?.slice(-6),
                        protocolData: {
                          diagnostics: diagnostics,
                          pieces: selectedParts,
                          diagnostic: formData.diagnostic
                        }
                      },
                      client: selectedClient,
                      machines: clientMachines.filter(m => formData.machineIds.includes(m._id)),
                      usedParts: selectedParts.map(sp => {
                        const part = spareParts.find(p => p._id === sp.partId);
                        return {
                          ...part,
                          quantite: sp.quantity,
                          partId: sp.partId
                        };
                      })
                    };

                    console.log('🔵 Données préparées:', {
                      interventionId: pdfData.intervention._id,
                      clientNom: pdfData.client?.nom,
                      machinesCount: pdfData.machines?.length,
                      partsCount: pdfData.usedParts?.length
                    });

                    const pdf = await generateInterventionPDF(pdfData);

                    console.log('✅ PDF généré avec succès');

                    const fileName = `Rapport_${formData.numeroIntervention || interventionId?.slice(-6)}.pdf`;
                    pdf.save(fileName);

                    alert('✅ Rapport PDF téléchargé !');
                  } catch (error) {
                    console.error('❌ Erreur génération PDF:', error);
                    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
                    console.error('❌ Message:', error instanceof Error ? error.message : String(error));
                    alert(`Erreur lors de la génération du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
                  }
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText size={18} />
                Télécharger le rapport PDF
              </Button>
            </div>
          </div>
        )}

        {/* Type */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Type d'intervention</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(INTERVENTION_TYPES).map(([key, { label, icon }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: key as any }))}
                className={`p-4 border-2 rounded-lg transition-all ${formData.type === key ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                disabled={readOnly}
              >
                <div className="text-3xl mb-2">{icon}</div>
                <div className="font-medium text-sm">{label}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Client & Machines */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Client et Machines</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              disabled={readOnly || !!maintenanceSelectionData || !!interventionId}  // ✅ Désactivé en mode édition pour éviter l'erreur
            >
              <option value="">Sélectionnez un client</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.nom} - {client.nomFerme}
                </option>
              ))}
            </select>
            {!interventionId && globalSelectedClient && formData.clientId === globalSelectedClient._id && (
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                <Info size={16} />
                <span>Client pré-sélectionné automatiquement : <strong>{globalSelectedClient.nom}</strong></span>
              </div>
            )}
          </div>

          {selectedClient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Machines *</label>
              {clientMachines.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune machine (Vérifiez le client et rechargez si nécessaire)</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {clientMachines.map(machine => (
                    <button
                      key={machine._id}
                      type="button"
                      onClick={() => toggleMachine(machine._id)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${formData.machineIds.includes(machine._id) ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                      disabled={readOnly}
                    >
                      <div className="font-medium">{machine.modele || machine.model || machine.nom || 'Machine sans nom'}</div>
                      <div className="text-sm text-gray-600">N° {machine.numeroSerie}</div>
                    </button>
                  ))}
                </div>
              )}

              {!readOnly && formData.type === 'MAINTENANCE' && formData.clientId && formData.machineIds.length > 0 && (
                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={() => {
                      onNavigate('multi-machine-kit-selection', {
                        clientId: formData.clientId,
                        machineIds: formData.machineIds
                      });
                    }}
                    className="flex items-center gap-2"
                  >
                    Suivant : Sélectionner les kits d'entretien
                  </Button>
                </div>
              )}

              {!readOnly && formData.type === 'COMMISSIONING' && formData.clientId && formData.machineIds.length > 0 && (
                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!formData.clientId || formData.machineIds.length === 0) {
                        alert('Veuillez sélectionner un client et une machine.');
                        return;
                      }

                      try {
                        const now = new Date();
                        const numeroIntervention =
                          now.getFullYear().toString() +
                          (now.getMonth() + 1).toString().padStart(2, '0') +
                          now.getDate().toString().padStart(2, '0') +
                          now.getHours().toString().padStart(2, '0') +
                          formData.technicienId.slice(-3);

                        const newIntervention = await createIntervention({
                          ...formData,
                          numeroIntervention,
                          statut: 'EN_COURS',
                          dateDebut: new Date().toISOString(),
                          creator: 'system',
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        });

                        onNavigate('commissioning-protocol', {
                          interventionId: newIntervention._id,
                          clientId: newIntervention.clientId,
                          machineIds: newIntervention.machineIds
                        });

                      } catch (error) {
                        console.error('Erreur:', error);
                        alert('Erreur lors de la création.');
                      }
                    }}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Play size={18} />
                    Ouvrir le protocole de mise en service VMS
                  </Button>
                </div>
              )}

              {!readOnly && formData.type === 'INSTALLATION' && formData.clientId && formData.machineIds.length > 0 && (
                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!formData.clientId || formData.machineIds.length === 0) {
                        alert('Veuillez sélectionner un client et une machine.');
                        return;
                      }

                      try {
                        let targetInterventionId = interventionId;

                        if (targetInterventionId) {
                          await updateIntervention(targetInterventionId, {
                            ...formData,
                            statut: 'EN_COURS',
                            updatedAt: new Date().toISOString()
                          });
                        } else {
                          const now = new Date();
                          const numeroIntervention =
                            now.getFullYear().toString() +
                            (now.getMonth() + 1).toString().padStart(2, '0') +
                            now.getDate().toString().padStart(2, '0') +
                            now.getHours().toString().padStart(2, '0') +
                            (formData.technicienId || '000').slice(-3);

                          const newIntervention = await createIntervention({
                            ...formData,
                            numeroIntervention,
                            statut: 'EN_COURS',
                            dateDebut: new Date().toISOString(),
                            creator: 'system',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                          });
                          targetInterventionId = newIntervention._id;
                        }

                        onNavigate('installation-protocol', {
                          interventionId: targetInterventionId,
                          clientId: formData.clientId,
                          machineId: formData.machineIds[0]
                        });

                      } catch (error) {
                        console.error('Erreur:', error);
                        alert('Erreur lors de la création.');
                      }
                    }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play size={18} />
                    Ouvrir le protocole de montage
                  </Button>
                </div>
              )}



            </div>
          )}
        </Card>

        {/* GPS */}
        {!readOnly && selectedMachine && selectedMachine.gpsLat && selectedMachine.gpsLng && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Suivi GPS</h3>
                {interventionStarted ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${gpsTracking?.isPaused ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 animate-pulse'}`} />
                      <span className="font-medium">{gpsTracking?.isPaused ? 'En pause' : 'En cours'}</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 tabular-nums">{formatElapsedTime(elapsedTime)}</div>
                  </div>
                ) : (
                  <p className="text-gray-600">Démarrage auto ou manuel</p>
                )}
              </div>
              <div className="flex gap-2">
                {!interventionStarted ? (
                  <Button type="button" size="sm" onClick={handleManualStart} className="flex items-center gap-2"><Play size={16} /> Démarrer</Button>
                ) : (
                  <Button type="button" size="sm" variant="destructive" onClick={handleEndIntervention} className="flex items-center gap-2"><StopCircle size={16} /> Terminer</Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Diagnostics (REPAIR) */}
        {formData.type === 'REPAIR' && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Diagnostics et Constatations</h2>
            {!readOnly && renderErrorCodeSearchSection()}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnostic principal</label>
              <textarea
                value={formData.diagnostic}
                onChange={(e) => setFormData(prev => ({ ...prev, diagnostic: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Le diagnostic principal..."
                disabled={readOnly}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nouvelle constatation</label>
              <div className="flex gap-2">
                <input type="text" value={newConstatation} onChange={(e) => setNewConstatation(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" disabled={readOnly} />
                <Button type="button" onClick={addDiagnostic} className="flex items-center gap-2"><Plus size={20} /> Ajouter</Button>
              </div>
            </div>
            {diagnostics.length > 0 && (
              <div className="space-y-4">
                {diagnostics.map((diag, index) => (
                  <div key={diag.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900">Constatation #{index + 1}</span>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${diag.resolu ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{diag.resolu ? 'Résolu' : 'En attente'}</div>
                        </div>
                        <p className="text-gray-700">{diag.constatation}</p>
                      </div>
                      <Button type="button" variant="ghost" onClick={() => removeDiagnostic(diag.id)} disabled={readOnly}><X size={20} /></Button>
                    </div>
                    <div className="space-y-3">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Action réalisée</label><textarea value={diag.action} onChange={(e) => updateDiagnosticAction(diag.id, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={2} disabled={readOnly} /></div>
                      <div className="flex items-center gap-2" disabled={readOnly}><input type="checkbox" id={`resolu-${diag.id}`} checked={diag.resolu} onChange={() => toggleDiagnosticResolved(diag.id)} className="w-4 h-4 text-blue-600" /><label htmlFor={`resolu-${diag.id}`} className="text-sm font-medium cursor-pointer">Marquer comme résolu</label></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Pièces Détachées (REPAIR) */}
        {formData.type === 'REPAIR' && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pièces détachées</h2>
            <div className="mb-4">
              <Button type="button" onClick={() => setShowPartSearch(!showPartSearch)} disabled={readOnly}><Search size={20} /> {showPartSearch ? 'Masquer' : 'Rechercher'}</Button>
              {showPartSearch && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <Input placeholder="Réf ou désignation..." value={partSearchQuery} onChange={(e) => setPartSearchQuery(e.target.value)} disabled={readOnly} />
                  <div className="max-h-60 overflow-y-auto space-y-2 mt-3">
                    {filteredSpareParts.map(part => (
                      <button key={part._id} type="button" onClick={() => addSparePart(part._id)} className="w-full p-3 border border-gray-200 rounded-lg hover:bg-blue-50 text-left" disabled={readOnly || selectedParts.some(p => p.partId === part._id)}>
                        <div className="font-medium">{part.reference}</div>
                        <div className="text-sm text-gray-600">{part.designation}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {selectedParts.length > 0 && (
              <div className="space-y-3">
                {selectedParts.map(sp => {
                  const part = spareParts.find(p => p._id === sp.partId);
                  return (
                    <div key={sp.partId} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                      <Package size={20} className="text-blue-600" />
                      <div className="flex-1"><div className="font-medium">{part?.reference}</div><div className="text-sm text-gray-600">{part?.designation}</div></div>
                      <div className="flex items-center gap-2"><label className="text-sm">Qté:</label><input type="number" min="1" value={sp.quantity} onChange={(e) => updatePartQuantity(sp.partId, parseInt(e.target.value) || 1)} disabled={readOnly} /></div>
                      <Button type="button" variant="ghost" onClick={() => removeSparePart(sp.partId)} disabled={readOnly}><X size={20} /></Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Code Erreur si hors REPAIR */}
        {!readOnly && formData.type !== 'REPAIR' && (
          <Card className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recherche de Code Erreur</h2>
            {renderErrorCodeSearchSection()}
            {formData.diagnostic && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Diagnostic renseigné</label>
                <textarea
                  value={formData.diagnostic}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnostic: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  disabled={readOnly}
                />
              </div>
            )}
          </Card>
        )}
        {/* Info Complémentaires */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informations complémentaires</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date et heure de début *</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input type="datetime-local" value={formData.dateDebut} onChange={(e) => setFormData(prev => ({ ...prev, dateDebut: e.target.value }))} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required disabled={readOnly} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut *</label>
              <select value={formData.statut} onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as any }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" disabled={readOnly}>
                <option value="PLANIFIEE">Planifiée</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINEE">Terminée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-700 mb-2">Géolocalisation</label>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={handleGetLocation} className="flex items-center gap-2" disabled={readOnly}><MapPin size={20} /> Obtenir position GPS</Button>
                {formData.gpsLat && formData.gpsLng && <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm"><MapPin size={16} /> Position enregistrée</div>}
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          {readOnly ? (
            // ✅ MODE LECTURE SEULE : Bouton Retour uniquement
            <Button
              type="button"
              onClick={() => onNavigate('client-detail', { clientId: formData.clientId })}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={20} /> Retour au client
            </Button>
          ) : (
            // ✅ MODE ÉDITION : Boutons normaux
            <>
              <Button type="button" variant="ghost" onClick={() => onNavigate('interventions')}>Annuler</Button>
              {formData.type === 'REPAIR' && diagnostics.length > 0 && (
                <Button type="button" onClick={handleCloseIntervention} className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500">
                  <StopCircle size={20} /> Clôturer le dépannage
                </Button>
              )}
              <Button type="submit" disabled={loading} className="intervention-action-save flex items-center gap-2">
                <Save size={20} /> {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </>
          )}
        </div>        </form>

      <ErrorCodeSearchModal
        isVisible={isErrorCodeModalOpen}
        onClose={() => setIsErrorCodeModalOpen(false)}
        onSelect={(errorCodeData) => {
          applyErrorCode(errorCodeData, false);
          setIsErrorCodeModalOpen(false);
          setErrorCodeInput('');
        }}
        initialSearchTerm={errorCodeInput}
      />
    </div>
  );
}
