//MachineFormScreen.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { TextArea } from '../../components/common/TextArea';
import { Save, ArrowLeft, MapPin, Trash2, Info } from 'lucide-react';
import { db } from '../../lib/supabase';
import { geocodeAddress } from '../../utils/geoUtils';
import { useSelectedClient } from '../../contexts/SelectedClientContext';

interface MachineFormScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  machineId?: string;
  clientId?: string;
}

export function MachineFormScreen({ onNavigate, machineId, clientId }: MachineFormScreenProps) {
  const { selectedClient: globalSelectedClient } = useSelectedClient();

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [existingMachineNames, setExistingMachineNames] = useState<string[]>([]);
  const [existingTypeRelations, setExistingTypeRelations] = useState<string[]>([]);

  const [machineFields, setMachineFields] = useState<any[]>([]);
  const [fieldOptions, setFieldOptions] = useState<any>({});

  const [configType, setConfigType] = useState<string>('');

  // États Pompe à vide
  const [pumpType, setPumpType] = useState<string>('');
  const [pumpVariator, setPumpVariator] = useState<string>('');
  const [pumpCabinet, setPumpCabinet] = useState<string>('');
  const [pumpExtraFields, setPumpExtraFields] = useState<Array<{ label: string; value: string }>>([]);

  // États V300
  const [v300Option, setV300Option] = useState<string>('');
  const [v300ExtraFields, setV300ExtraFields] = useState<Array<{ label: string; value: string }>>([]);

  // États Autre / Générique
  const [otherConfigDetails, setOtherConfigDetails] = useState<string>('');
  const [otherExtraFields, setOtherExtraFields] = useState<Array<{ label: string; value: string }>>([]);

  const [customFields, setCustomFields] = useState<Array<{
    name: string;
    value: string;
    type: 'text' | 'textarea' | 'number' | 'date' | 'boolean'
  }>>([]);

  // ✅ État pour l'historique intelligent par type de config
  // Structure: { 'pump': { labels: [], values: {} }, 'v300': { ... }, 'other': { ... }, 'generic': { ... } }
  const [historyMap, setHistoryMap] = useState<Record<string, { labels: string[], values: Record<string, string[]> }>>({
    pump: { labels: [], values: {} },
    v300: { labels: [], values: {} },
    other: { labels: [], values: {} },
    generic: { labels: [], values: {} }
  });

  const [formData, setFormData] = useState({
    nom: '',
    numeroSerie: '',
    versionNumero: '',
    clientId: clientId || globalSelectedClient?._id || '',
    typeRelation: 'MAITRE',
    dateInstallation: '',
    compteur: 0,
    gpsLat: '',
    gpsLng: '',
    gpsSource: 'ADDRESS' as 'ADDRESS' | 'FIELD',
    notes: ''
  });

  const typeRelations = [
    { value: 'MAITRE', label: 'Maître' },
    { value: 'ESCLAVE', label: 'Esclave' },
    { value: 'PARENT', label: 'Parent' },
    { value: 'ENFANT', label: 'Enfant' }
  ];

  useEffect(() => {
    loadClients();
    loadExistingMachineNames();
    loadExistingTypeRelations();
    loadMachineFields();
    loadFieldOptions();
    loadConfigurationHistory();
  }, []);

  // ✅ Pré-remplir le client depuis le contexte global si disponible
  useEffect(() => {
    // Si on est en mode création (pas de machineId) et qu'on a un client dans le contexte
    // ET que le formulaire n'a pas déjà un clientId
    if (!machineId && globalSelectedClient && !formData.clientId) {
      setFormData(prev => ({ ...prev, clientId: globalSelectedClient._id }));
    }
  }, [globalSelectedClient, machineId]);

  useEffect(() => {
    if (machineId) {
      loadMachine();
    }
  }, [machineId]);

  useEffect(() => {
    if (formData.clientId && clients.length > 0 && !machineId) {
      geocodeClientAddress();
    }
  }, [formData.clientId, clients.length, machineId]);

  // Détection automatique du type
  useEffect(() => {
    if (formData.nom) {
      const nomLower = formData.nom.toLowerCase().trim();
      if (nomLower.includes('v300') || nomLower.includes('v 300')) {
        setConfigType('v300');
      } else if (nomLower.includes('pompe') || nomLower.includes('vide')) {
        setConfigType('pump');
      } else {
        setConfigType('');
      }
    } else {
      setConfigType('');
    }
  }, [formData.nom]);

  const loadClients = async () => {
    try {
      const result: any = await db.clients.list({ limit: 1000 });
      const clientsList = Array.isArray(result) ? result : (result.list || []);
      setClients(clientsList);
    } catch (error) {
      console.error('❌ Erreur chargement clients:', error);
    }
  };

  const geocodeClientAddress = async () => {
    if (!formData.clientId) return;
    const client = clients.find(c => c._id === formData.clientId);
    if (!client) return;
    const address = `${client.adresse || ''}, ${client.codePostal || ''} ${client.ville || ''}, France`;
    const coords = await geocodeAddress(address);
    if (coords) {
      setFormData(prev => ({ ...prev, gpsLat: coords.lat.toString(), gpsLng: coords.lng.toString(), gpsSource: 'ADDRESS' }));
    }
  };

  const loadExistingMachineNames = async () => {
    try {
      // Liste prédéfinie de machines
      const predefinedNames = [
        'V300/1',
        'V300/2',
        'Chauffe eau 900l ACV steatite',
        'Adoucisseur ocene 30L',
        'DVPF/1',
        'DVPF/2',
        'Vis d alimentation',
        'Vms/1'
      ];

      // Charger les machines existantes de la base de données
      const result: any = await db.machines.list({ limit: 10000 });
      const machines = Array.isArray(result) ? result : (result.list || []);
      const dbNames = machines.map((m: any) => m.nom).filter((nom: string) => nom && nom.trim() !== '');

      // Fusionner les deux listes (prédéfinie + base de données) et supprimer les doublons
      const allNames = [...predefinedNames, ...dbNames];
      const uniqueNames = allNames.filter((nom: string, index: number, self: string[]) => self.indexOf(nom) === index);

      // Trier par ordre alphabétique
      uniqueNames.sort((a: string, b: string) => a.localeCompare(b, 'fr'));

      setExistingMachineNames(uniqueNames);
    } catch (error) {
      console.error('❌ Erreur chargement noms machines:', error);
      // En cas d'erreur, au moins afficher la liste prédéfinie
      const predefinedNames = [
        'V300/1',
        'V300/2',
        'Chauffe eau 900l ACV steatite',
        'Adoucisseur ocene 30L',
        'DVPF/1',
        'DVPF/2',
        'Vis d alimentation',
        'Vms/1'
      ];
      setExistingMachineNames(predefinedNames);
    }
  };

  const loadExistingTypeRelations = async () => {
    try {
      const result: any = await db.machines.list({ limit: 10000 });
      const machines = Array.isArray(result) ? result : (result.list || []);
      const types = machines.map((m: any) => m.typeRelation).filter((type: string) => type && type.trim() !== '')
        .filter((type: string, index: number, self: string[]) => self.indexOf(type) === index);
      const baseTypes = ['MAITRE', 'ESCLAVE', 'PARENT', 'ENFANT'];
      const allTypes = [...new Set([...baseTypes, ...types])].sort();
      setExistingTypeRelations(allTypes);
    } catch (error) {
      console.error('❌ Erreur chargement types relation:', error);
      setExistingTypeRelations(['MAITRE', 'ESCLAVE', 'PARENT', 'ENFANT']);
    }
  };

  // ✅ FONCTION UNIFIÉE : Charge l'historique de TOUS les types de config
  const loadConfigurationHistory = async () => {
    try {
      const result: any = await db.machines.list({ limit: 2000, fields: ['configType', 'pumpExtraFields', 'v300ExtraFields'] });
      const machines = Array.isArray(result) ? result : (result.list || []);

      const initialMap: Record<string, { labels: Set<string>, values: Record<string, Set<string>> }> = {
        pump: { labels: new Set(['Type de pompe', 'Variateur', 'Armoire']), values: {} }, // Ajout manuel des champs standards
        v300: { labels: new Set(['Option']), values: {} },
        other: { labels: new Set(), values: {} },
        generic: { labels: new Set(), values: {} }
      };

      // Helper pour traiter un tableau de champs
      const processFields = (fields: any[], typeKey: string) => {
        if (!fields || !Array.isArray(fields)) return;
        const typeMap = initialMap[typeKey];
        if (!typeMap) return;

        fields.forEach((item: any) => {
          if (item.label) {
            typeMap.labels.add(item.label);
            if (!typeMap.values[item.label]) typeMap.values[item.label] = new Set();
            if (item.value) typeMap.values[item.label].add(item.value);
          }
        });
      };

      machines.forEach((m: any) => {
        if (m.configType === 'pump') processFields(m.pumpExtraFields, 'pump');
        if (m.configType === 'v300') processFields(m.v300ExtraFields, 'v300');
        if (m.configType === 'other') processFields(m.otherExtraFields, 'other');
        if (!m.configType) processFields(m.otherExtraFields, 'generic'); // Fallback
      });

      // Conversion des Sets en Arrays triés pour l'état React
      const finalMap: Record<string, { labels: string[], values: Record<string, string[]> }> = {};
      (Object.keys(initialMap) as Array<keyof typeof initialMap>).forEach(key => {
        const data = initialMap[key];
        const valuesObj: Record<string, string[]> = {};
        Object.keys(data.values).forEach(label => {
          valuesObj[label] = Array.from(data.values[label]).sort();
        });
        finalMap[key] = {
          labels: Array.from(data.labels).sort(),
          values: valuesObj
        };
      });

      setHistoryMap(finalMap);
      console.log('✅ Historique universel chargé');
    } catch (error) {
      console.error('❌ Erreur chargement historique config:', error);
    }
  };

  // Gestion des champs POMPE
  const addPumpExtraField = () => {
    setPumpExtraFields([...pumpExtraFields, { label: '', value: '' }]);
  };
  const removePumpExtraField = (index: number) => {
    setPumpExtraFields(pumpExtraFields.filter((_, i) => i !== index));
  };
  const updatePumpExtraField = (index: number, field: 'label' | 'value', val: string) => {
    const newFields = [...pumpExtraFields];
    newFields[index][field] = val;
    setPumpExtraFields(newFields);
  };

  // Gestion des champs V300
  const addV300ExtraField = () => {
    setV300ExtraFields([...v300ExtraFields, { label: '', value: '' }]);
  };
  const removeV300ExtraField = (index: number) => {
    setV300ExtraFields(v300ExtraFields.filter((_, i) => i !== index));
  };
  const updateV300ExtraField = (index: number, field: 'label' | 'value', val: string) => {
    const newFields = [...v300ExtraFields];
    newFields[index][field] = val;
    setV300ExtraFields(newFields);
  };

  // ✅ Gestion des champs AUTRE / GÉNÉRIQUE
  const addOtherExtraField = () => {
    setOtherExtraFields([...otherExtraFields, { label: '', value: '' }]);
  };
  const removeOtherExtraField = (index: number) => {
    setOtherExtraFields(otherExtraFields.filter((_, i) => i !== index));
  };
  const updateOtherExtraField = (index: number, field: 'label' | 'value', val: string) => {
    const newFields = [...otherExtraFields];
    newFields[index][field] = val;
    setOtherExtraFields(newFields);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { name: '', value: '', type: 'text' }]);
  };
  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };
  const updateCustomFieldName = (index: number, name: string) => {
    const newFields = [...customFields];
    newFields[index].name = name;
    setCustomFields(newFields);
  };
  const updateCustomFieldType = (index: number, type: 'text' | 'textarea' | 'number' | 'date' | 'boolean') => {
    const newFields = [...customFields];
    newFields[index].type = type;
    if (type === 'boolean' && newFields[index].value === '') {
      newFields[index].value = 'false';
    }
    setCustomFields(newFields);
  };
  const updateCustomFieldValue = (index: number, value: string) => {
    const newFields = [...customFields];
    newFields[index].value = value;
    setCustomFields(newFields);
  };

  const renderCustomFieldInput = (field: any, index: number) => {
    switch (field.type) {
      case 'text': return <Input label="Valeur" value={field.value} onChange={(e) => updateCustomFieldValue(index, e.target.value)} placeholder="Ex: Bleu..." />;
      case 'textarea': return <TextArea label="Valeur" value={field.value} onChange={(e) => updateCustomFieldValue(index, e.target.value)} placeholder="Description..." rows={3} />;
      case 'number': return <Input label="Valeur" type="number" value={field.value} onChange={(e) => updateCustomFieldValue(index, e.target.value)} placeholder="Ex: 15..." />;
      case 'date': return <Input label="Valeur" type="date" value={field.value} onChange={(e) => updateCustomFieldValue(index, e.target.value)} />;
      case 'boolean': return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Valeur</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name={`boolean-${index}`} checked={field.value === 'true'} onChange={() => updateCustomFieldValue(index, 'true')} className="w-4 h-4 text-blue-600" />
              <span className="text-sm">✅ Oui</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name={`boolean-${index}`} checked={field.value === 'false'} onChange={() => updateCustomFieldValue(index, 'false')} className="w-4 h-4 text-blue-600" />
              <span className="text-sm">❌ Non</span>
            </label>
          </div>
        </div>
      );
      default: return null;
    }
  };

  const loadMachine = async () => {
    console.log(`📥 Chargement des données pour la machine ID: ${machineId}`);
    setLoading(true);
    try {
      const machine = await db.machines.get(machineId);
      if (machine) {
        console.log('✅ Machine trouvée:', machine);
        setFormData({
          nom: machine.modele || machine.nom || '',
          numeroSerie: machine.numeroSerie || '',
          versionNumero: machine.versionNumero || '',
          clientId: machine.clientId || '',
          typeRelation: machine.typeRelation || 'MAITRE',
          dateInstallation: machine.dateInstallation?.split('T')[0] || '',
          compteur: machine.compteur || 0,
          gpsLat: machine.gpsLat?.toString() || '',
          gpsLng: machine.gpsLng?.toString() || '',
          gpsSource: machine.gpsSource || 'ADDRESS',
          notes: machine.notes || ''
        });

        if (machine.customFields && Array.isArray(machine.customFields)) {
          setCustomFields(machine.customFields);
        }

        setConfigType(machine.configType || '');

        // Chargement Pump
        setPumpType(machine.pumpType || '');
        setPumpVariator(machine.pumpVariator || '');
        setPumpCabinet(machine.pumpCabinet || '');
        if (machine.pumpExtraFields && Array.isArray(machine.pumpExtraFields)) setPumpExtraFields(machine.pumpExtraFields);

        // Chargement V300
        setV300Option(machine.v300Option || '');
        if (machine.v300ExtraFields && Array.isArray(machine.v300ExtraFields)) setV300ExtraFields(machine.v300ExtraFields);

        // Chargement Other/Generic
        setOtherConfigDetails(machine.otherConfigDetails || '');
        if (machine.otherExtraFields && Array.isArray(machine.otherExtraFields)) setOtherExtraFields(machine.otherExtraFields);
      } else {
        alert('Machine introuvable');
      }
    } catch (error) {
      console.error('❌ Erreur chargement machine:', error);
      alert('Erreur lors du chargement de la machine');
    } finally {
      setLoading(false);
    }
  };

  const loadMachineFields = async () => {
    try {
      const result = await db.machine_fields.list({
        filter: { isActive: true },
        sort: { order: 1 },
        limit: 1000
      });
      setMachineFields(result.list || []);
    } catch (error) {
      console.error('❌ Erreur chargement champs dynamiques:', error);
      setMachineFields([]);
    }
  };

  const loadFieldOptions = async () => {
    try {
      const result = await db.machine_field_options.list({
        sort: { order: 1 },
        limit: 1000
      });
      const options = result.list || [];
      const groupedOptions: any = {};
      options.forEach((opt: any) => {
        if (!groupedOptions[opt.fieldId]) groupedOptions[opt.fieldId] = [];
        groupedOptions[opt.fieldId].push(opt.value);
      });
      setFieldOptions(groupedOptions);
    } catch (error) {
      console.error('❌ Erreur chargement options:', error);
      setFieldOptions({});
    }
  };

  const shouldDisplayField = (field: any) => {
    if (!field.conditionalRules) return field.isActive;
    const { parentField, parentValue } = field.conditionalRules;
    const currentParentValue = formData[parentField];
    return field.isActive && currentParentValue === parentValue;
  };

  const renderDynamicField = (field: any) => {
    const fieldValue = formData[field.label];
    const options = fieldOptions[field._id] || [];

    return (
      <div key={field._id}>
        {field.fieldType === 'select' ? (
          <>
            <Select
              label={field.label + (field.isRequired ? ' *' : '')}
              value={fieldValue}
              onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
              options={options.map((opt: string) => ({ value: opt, label: opt }))}
              required={field.isRequired}
            />
            {field.allowCustomValue && fieldValue === 'Autre' && (
              <div className="mt-2">
                <Input label={`${field.label} - Préciser`} value={formData[`${field.label}_custom`] || ''} onChange={(e) => setFormData({ ...formData, [`${field.label}_custom`]: e.target.value })} placeholder="Veuillez préciser..." />
              </div>
            )}
          </>
        ) : field.fieldType === 'number' ? (
          <Input label={field.label + (field.isRequired ? ' *' : '')} type="number" value={fieldValue} onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })} required={field.isRequired} />
        ) : field.fieldType === 'date' ? (
          <Input label={field.label + (field.isRequired ? ' *' : '')} type="date" value={fieldValue} onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })} required={field.isRequired} />
        ) : field.fieldType === 'checkbox' ? (
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={fieldValue === 'true' || fieldValue === true} onChange={(e) => setFormData({ ...formData, [field.label]: e.target.checked.toString() })} className="w-4 h-4" />
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
          </div>
        ) : (
          <Input label={field.label + (field.isRequired ? ' *' : '')} value={fieldValue} onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })} required={field.isRequired} />
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.nom || !formData.numeroSerie) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);

    try {
      // Préparation des champs additionnels pour custom_fields (car non existants en colonnes)
      const additionalCustomFields = {
        ...(configType === 'pump' ? {
          pumpVariator,
          pumpCabinet,
          pumpExtraFields
        } : {}),
        ...(configType === 'v300' ? {
          v300ExtraFields
        } : {}),
        ...(configType === 'other' ? {
          otherConfigDetails,
          otherExtraFields
        } : {}),
        ...((!configType || configType === '') ? {
          otherExtraFields
        } : {}),
        // Champs généraux non supportés par le schéma strict
        gpsSource: formData.gpsSource,
        notes: formData.notes,
        versionNumero: formData.versionNumero
      };

      const finalCustomFields = {
        ...customFields,
        ...additionalCustomFields
      };

      const machineData: any = {
        modele: formData.nom, // ✅ Mappage vers la colonne 'modele' obligatoire
        // nom: formData.nom, // Colonne inexistante en base
        numeroSerie: formData.numeroSerie,
        // versionNumero: formData.versionNumero,
        clientId: formData.clientId,
        typeRelation: formData.typeRelation,
        dateInstallation: formData.dateInstallation ? new Date(formData.dateInstallation).toISOString() : undefined,
        compteur: Number(formData.compteur),
        latitude: formData.gpsLat ? parseFloat(formData.gpsLat) : undefined, // ✅ Mappage vers 'latitude'
        longitude: formData.gpsLng ? parseFloat(formData.gpsLng) : undefined, // ✅ Mappage vers 'longitude'
        // gpsSource: formData.gpsSource, // Déplacé dans customFields
        // notes: formData.notes, // Déplacé dans customFields
        customFields: finalCustomFields, // ✅ Stockage des infos sup en JSONB

        configType: configType || null,

        // Colonnes existantes en base (selon SQL)
        pumpType: configType === 'pump' ? pumpType : null,
        v300Option: configType === 'v300' ? v300Option : null,

        updatedAt: new Date().toISOString()
      };

      if (machineId) {
        console.log('🔄 UPDATE de la machine avec ID:', machineId);
        await db.machines.update(machineId, machineData);
        alert('Machine modifiée avec succès !');
      } else {
        console.log('➕ CREATE nouvelle machine');

        machineData.createdAt = new Date().toISOString();
        await db.machines.create(machineData);
        alert('Machine créée avec succès !');
      }

      setTimeout(() => {
        onNavigate('client-detail', { clientId: formData.clientId });
      }, 500);
    } catch (error) {
      console.error('❌ ERREUR ENREGISTREMENT:', error);
      alert(`Erreur lors de l'enregistrement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const clientOptions = clients.map(c => ({
    value: c._id,
    label: `${c.nom} - ${c.nomFerme} (${c.numeroClient})`
  }));

  // Helper pour récupérer l'historique actuel selon le configType
  const getCurrentHistory = () => {
    if (configType === 'pump') return historyMap.pump;
    if (configType === 'v300') return historyMap.v300;
    if (configType === 'other') return historyMap.other;
    return historyMap.generic; // Fallback
  };

  const currentHistory = getCurrentHistory();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('machines')} className="flex items-center gap-2">
          <ArrowLeft size={20} /> Retour
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {machineId ? 'Modifier la machine' : 'Nouvelle machine'}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Identification</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la machine <span className="text-red-500">*</span></label>
                <input type="text" list="machine-names-datalist" value={formData.nom} onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Tapez ou choisissez un nom..." />
                <datalist id="machine-names-datalist">{existingMachineNames.map((name, i) => <option key={i} value={name} />)}</datalist>
                <p className="mt-1 text-xs text-gray-500">💡 {existingMachineNames.length} noms existants</p>
              </div>
              <Input label="Numéro de série" value={formData.numeroSerie} onChange={(e) => setFormData(prev => ({ ...prev, numeroSerie: e.target.value }))} required placeholder="Numéro unique" />
              <Input label="Version N°" value={formData.versionNumero} onChange={(e) => setFormData(prev => ({ ...prev, versionNumero: e.target.value }))} placeholder="Ex: 1.0, 2.5..." />
              <div>
                <Select label="Client" options={clientOptions} value={formData.clientId} onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))} required />
                {!clientId && !machineId && globalSelectedClient && formData.clientId === globalSelectedClient._id && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    <Info size={16} />
                    <span>Client pré-sélectionné automatiquement : <strong>{globalSelectedClient.nom}</strong></span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de relation <span className="text-red-500">*</span></label>
                <input type="text" list="type-relation-datalist" value={formData.typeRelation} onChange={(e) => setFormData(prev => ({ ...prev, typeRelation: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Tapez ou choisissez..." />
                <datalist id="type-relation-datalist">{existingTypeRelations.map((type, i) => <option key={i} value={type} />)}</datalist>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Données techniques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Date d'installation" type="date" value={formData.dateInstallation} onChange={(e) => setFormData(prev => ({ ...prev, dateInstallation: e.target.value }))} />
              <Input label="Compteur (heures)" type="number" value={formData.compteur} onChange={(e) => setFormData(prev => ({ ...prev, compteur: parseInt(e.target.value) || 0 }))} min="0" />
            </div>
          </div>

          <div className="border-t-2 border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Configuration Technique</h2>

            <Select
              label="Type de configuration"
              value={configType}
              onChange={(e) => setConfigType(e.target.value)}
              options={[
                { value: '', label: '-- Standard / Générique --' },
                { value: 'pump', label: 'Pompe à vide' },
                { value: 'v300', label: 'V300' },
                { value: 'other', label: 'Autre / Personnalisé' }
              ]}
            />

            {/* ✅ LOGIQUE UNIFIÉE POUR TOUS LES TYPES */}

            {/* POMPE À VIDE (Avec raccourcis hardcoded) */}
            {configType === 'pump' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-4">
                <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                  <h3 className="text-blue-800 font-semibold">Détails Pompe à vide</h3>
                  <Button type="button" variant="secondary" size="sm" onClick={addPumpExtraField} className="text-blue-700 hover:bg-blue-100 border-blue-200">➕ Ajouter un détail</Button>
                </div>

                {/* Champs standards pour aller plus vite */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select label="Type de pompe" value={pumpType} onChange={(e) => setPumpType(e.target.value)} options={[{ value: '', label: 'Sélectionner...' }, { value: 'DVP', label: 'Type DVP' }, { value: 'DVPF', label: 'Type DVPF' }, { value: 'VP', label: 'Type VP' }, { value: 'Autre', label: 'Autre...' }]} />
                  <Select label="Variateur" value={pumpVariator} onChange={(e) => setPumpVariator(e.target.value)} options={[{ value: '', label: 'Sélectionner...' }, { value: 'NFO22', label: 'Variateur NFO 2.2' }, { value: 'Ext', label: 'Variateur Ext' }, { value: 'Socidix', label: 'Socidix' }, { value: 'Autre', label: 'Autre...' }]} />
                  <Select label="Armoire" value={pumpCabinet} onChange={(e) => setPumpCabinet(e.target.value)} options={[{ value: '', label: 'Sélectionner...' }, { value: 'Commutateur', label: 'Armoire Commutateur à came' }, { value: '3Contacteur', label: 'Armoire 3 contacteur' }, { value: 'Socidix', label: 'Armoire Socidix' }, { value: 'Autre', label: 'Autre...' }]} />
                </div>

                {pumpExtraFields.length > 0 && (
                  <div className="pt-4 border-t border-blue-200 space-y-3">
                    <h4 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Détails supplémentaires</h4>
                    {pumpExtraFields.map((field, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input label="Nom du champ" placeholder="Ex: Pression..." value={field.label} onChange={(e) => updatePumpExtraField(index, 'label', e.target.value)} list="current-label-history" />
                        </div>
                        <div className="flex-1">
                          <Input label="Valeur" placeholder="Ex: 10 Bars" value={field.value} onChange={(e) => updatePumpExtraField(index, 'value', e.target.value)} list={`pump-values-${index}`} />
                        </div>
                        <div className="pt-6"><Button type="button" variant="danger" size="sm" onClick={() => removePumpExtraField(index)} className="h-10 w-10 flex items-center justify-center"><Trash2 size={16} /></Button></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* V300 */}
            {configType === 'v300' && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100 space-y-4">
                <div className="flex justify-between items-center border-b border-green-200 pb-2">
                  <h3 className="text-green-800 font-semibold">Options V300</h3>
                  <Button type="button" variant="secondary" size="sm" onClick={addV300ExtraField} className="text-green-700 hover:bg-green-100 border-green-200">➕ Ajouter une option</Button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Option Principale</label>
                  <input type="text" list="v300-options-list" value={v300Option} onChange={(e) => setV300Option(e.target.value)} placeholder="Ex: HN100..." className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <datalist id="v300-options-list">
                    <option value="HN100">HN100</option>
                    <option value="Compteur">Compteur</option>
                    <option value="MCA">MCA</option>
                  </datalist>
                </div>
                {v300ExtraFields.length > 0 && (
                  <div className="pt-4 border-t border-green-200 space-y-3">
                    <h4 className="text-sm font-semibold text-green-700 uppercase tracking-wide">Options supplémentaires</h4>
                    {v300ExtraFields.map((field, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input label="Nom de l'option" value={field.label} onChange={(e) => updateV300ExtraField(index, 'label', e.target.value)} list="current-label-history" />
                        </div>
                        <div className="flex-1">
                          <Input label="Valeur" value={field.value} onChange={(e) => updateV300ExtraField(index, 'value', e.target.value)} list={`v300-values-${index}`} />
                        </div>
                        <div className="pt-6"><Button type="button" variant="danger" size="sm" onClick={() => removeV300ExtraField(index)} className="h-10 w-10 flex items-center justify-center"><Trash2 size={16} /></Button></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AUTRE (Maintenant avec Smart Dropdowns !) */}
            {(configType === 'other' || configType === '') && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100 space-y-4">
                <div className="flex justify-between items-center border-b border-purple-200 pb-2">
                  <h3 className="text-purple-800 font-semibold">Détails Techniques {configType === 'other' ? '(Autre)' : '(Générique)'}</h3>
                  <Button type="button" variant="secondary" size="sm" onClick={addOtherExtraField} className="text-purple-700 hover:bg-purple-100 border-purple-200">➕ Ajouter un détail</Button>
                </div>

                {/* Zone texte libre toujours dispo pour les descriptions longues */}
                {configType === 'other' && (
                  <div>
                    <TextArea label="Description générale" value={otherConfigDetails} onChange={(e) => setOtherConfigDetails(e.target.value)} placeholder="Description globale..." rows={2} />
                  </div>
                )}

                {otherExtraFields.length > 0 && (
                  <div className="pt-4 border-t border-purple-200 space-y-3">
                    <h4 className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Liste des caractéristiques</h4>
                    {otherExtraFields.map((field, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input label="Caractéristique" value={field.label} onChange={(e) => updateOtherExtraField(index, 'label', e.target.value)} list="current-label-history" />
                        </div>
                        <div className="flex-1">
                          <Input label="Valeur" value={field.value} onChange={(e) => updateOtherExtraField(index, 'value', e.target.value)} list={`other-values-${index}`} />
                        </div>
                        <div className="pt-6"><Button type="button" variant="danger" size="sm" onClick={() => removeOtherExtraField(index)} className="h-10 w-10 flex items-center justify-center"><Trash2 size={16} /></Button></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {machineFields.filter(field => shouldDisplayField(field)).length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Configuration spécifique (Base de données)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {machineFields.filter(field => shouldDisplayField(field)).map(field => renderDynamicField(field))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
              🔧 Champs personnalisés libres
              <Button type="button" variant="secondary" size="sm" onClick={addCustomField}>➕ Ajouter</Button>
            </h2>
            {customFields.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">Aucun champ personnalisé.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <Input label="Nom du champ" value={field.name} onChange={(e) => updateCustomFieldName(index, e.target.value)} placeholder="Ex: Couleur..." />
                      <Select label="Type" value={field.type} onChange={(e) => updateCustomFieldType(index, e.target.value as any)} options={[{ value: 'text', label: 'Texte' }, { value: 'textarea', label: 'Zone de texte' }, { value: 'number', label: 'Nombre' }, { value: 'date', label: 'Date' }, { value: 'boolean', label: 'Oui/Non' }]} />
                      <div className="flex items-end"><Button type="button" variant="danger" size="sm" onClick={() => removeCustomField(index)}>🗑️</Button></div>
                    </div>
                    <div>{renderCustomFieldInput(field, index)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={20} /> Localisation GPS</h2>
            {formData.gpsLat && formData.gpsLng && formData.gpsSource === 'ADDRESS' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">ℹ️ Position GPS approximative basée sur l'adresse du client.</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Latitude" type="number" step="any" value={formData.gpsLat} onChange={(e) => setFormData(prev => ({ ...prev, gpsLat: e.target.value }))} />
              <Input label="Longitude" type="number" step="any" value={formData.gpsLng} onChange={(e) => setFormData(prev => ({ ...prev, gpsLng: e.target.value }))} />
            </div>
          </div>

          <div>
            <TextArea label="Notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={4} />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => onNavigate('machines')}>Annuler</Button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2"><Save size={20} />{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        </form>
      </Card>

      {/* ✅ DATALISTS GLOBALES ET DYNAMIQUES */}
      <datalist id="current-label-history">
        {currentHistory.labels.map((label, i) => <option key={i} value={label} />)}
      </datalist>

      {pumpExtraFields.map((field, index) => (
        <datalist key={`pump-val-${index}`} id={`pump-values-${index}`}>
          {(currentHistory.values[field.label] || []).map((val, i) => <option key={i} value={val} />)}
        </datalist>
      ))}

      {v300ExtraFields.map((field, index) => (
        <datalist key={`v300-val-${index}`} id={`v300-values-${index}`}>
          {(currentHistory.values[field.label] || []).map((val, i) => <option key={i} value={val} />)}
        </datalist>
      ))}

      {otherExtraFields.map((field, index) => (
        <datalist key={`other-val-${index}`} id={`other-values-${index}`}>
          {(currentHistory.values[field.label] || []).map((val, i) => <option key={i} value={val} />)}
        </datalist>
      ))}
    </div>
  );
}
