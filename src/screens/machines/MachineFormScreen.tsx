//MachineFormScreen.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { TextArea } from '../../components/common/TextArea';
import { Save, ArrowLeft, MapPin, Trash2, Info, Settings, Database, Plus, Wrench } from 'lucide-react';
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
  const [availableMachineTypes, setAvailableMachineTypes] = useState<string[]>([]);

  // ✅ Champs dynamiques récupérés directement depuis la table dédiée machine_fields
  const [machineFields, setMachineFields] = useState<any[]>([]);
  // ✅ Options des listes déroulantes récupérées depuis la table machine_field_options
  const [fieldOptions, setFieldOptions] = useState<Record<string, string[]>>({});

  // ✅ Valeurs de configuration spécifique dynamiques
  const [specificConfigValues, setSpecificConfigValues] = useState<Record<string, any>>({});

  // Détails supplémentaires libres (caractéristiques additionnelles)
  const [extraFields, setExtraFields] = useState<Array<{ label: string; value: string }>>([]);

  // Champs personnalisés libres additionnels (structure { name, value, type })
  const [customFields, setCustomFields] = useState<Array<{
    name: string;
    value: string;
    type: 'text' | 'textarea' | 'number' | 'date' | 'boolean'
  }>>([]);

  const [formData, setFormData] = useState({
    nom: '',
    typeMachine: '', // ✅ Type de machine récupéré dans la table dédiée
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
    loadMachineTypes();
    loadMachineFields();
    loadFieldOptions();
  }, []);

  // Pré-remplir le client depuis le contexte global si disponible
  useEffect(() => {
    if (!machineId && globalSelectedClient && !formData.clientId) {
      setFormData(prev => ({ ...prev, clientId: globalSelectedClient._id || globalSelectedClient.id }));
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

  // Détection automatique assistée du type de machine si l'utilisateur ne l'a pas encore choisi
  useEffect(() => {
    if (formData.nom && !formData.typeMachine) {
      const nomLower = formData.nom.toLowerCase().trim();
      if (nomLower.includes('v300') || nomLower.includes('v 300')) {
        setFormData(prev => ({ ...prev, typeMachine: 'V 300' }));
      } else if (nomLower.includes('pompe') || nomLower.includes('vide') || nomLower.includes('dvp')) {
        setFormData(prev => ({ ...prev, typeMachine: 'Pompe à vide' }));
      } else if (nomLower.includes('vms')) {
        setFormData(prev => ({ ...prev, typeMachine: 'VMS 2014' }));
      } else if (nomLower.includes('adoucisseur') || nomLower.includes('ocene')) {
        setFormData(prev => ({ ...prev, typeMachine: 'Adoucisseur' }));
      } else if (nomLower.includes('chauffe') || nomLower.includes('eau')) {
        setFormData(prev => ({ ...prev, typeMachine: 'Chauffe-eau' }));
      }
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
    const client = clients.find(c => c._id === formData.clientId || c.id === formData.clientId);
    if (!client) return;
    const address = `${client.adresse || ''}, ${client.codePostal || ''} ${client.ville || ''}, France`;
    const coords = await geocodeAddress(address);
    if (coords) {
      setFormData(prev => ({ ...prev, gpsLat: coords.lat.toString(), gpsLng: coords.lng.toString(), gpsSource: 'ADDRESS' }));
    }
  };

  const loadExistingMachineNames = async () => {
    try {
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
      const result: any = await db.machines.list({ limit: 10000 });
      const machines = Array.isArray(result) ? result : (result.list || []);
      const dbNames = machines.map((m: any) => m.nom || m.modele).filter((nom: string) => nom && nom.trim() !== '');
      const uniqueNames = [...new Set([...predefinedNames, ...dbNames])].sort((a, b) => a.localeCompare(b, 'fr'));
      setExistingMachineNames(uniqueNames);
    } catch (error) {
      console.error('❌ Erreur chargement noms machines:', error);
    }
  };

  const loadExistingTypeRelations = async () => {
    try {
      const result: any = await db.machines.list({ limit: 10000 });
      const machines = Array.isArray(result) ? result : (result.list || []);
      const types = machines.map((m: any) => m.typeRelation).filter((type: string) => type && type.trim() !== '');
      const baseTypes = ['MAITRE', 'ESCLAVE', 'PARENT', 'ENFANT'];
      const allTypes = [...new Set([...baseTypes, ...types])].sort();
      setExistingTypeRelations(allTypes);
    } catch (error) {
      console.error('❌ Erreur chargement types relation:', error);
      setExistingTypeRelations(['MAITRE', 'ESCLAVE', 'PARENT', 'ENFANT']);
    }
  };

  // ✅ CHARGEMENT DYNAMIQUE DES TYPES DE MACHINE DEPUIS LA TABLE DÉDIÉE machine_fields
  const loadMachineTypes = async () => {
    try {
      // 1. Types de machine présents dans la table machine_fields (priorité absolue)
      const fieldsResult: any = await db.machineFields.list();
      const fieldsList = Array.isArray(fieldsResult) ? fieldsResult : (fieldsResult?.list || []);
      const typesFromFields = fieldsList
        .map((f: any) => f.machineType || f.machine_type)
        .filter((t: string) => t && t.trim() !== '' && t.toLowerCase() !== 'tous' && t.toLowerCase() !== 'all');

      // 2. Types de machine enregistrés dans la table machines
      const machinesResult: any = await db.machines.list({ limit: 2000 });
      const machinesList = Array.isArray(machinesResult) ? machinesResult : (machinesResult?.list || []);
      const typesFromMachines = machinesList
        .map((m: any) => m.typeMachine || m.type_machine || m.configType)
        .filter((t: string) => t && t.trim() !== '' && !['MAITRE', 'ESCLAVE'].includes(t));

      // 3. Types de machine dans les kits d'entretien
      const kitsResult: any = await db.maintenanceKits.list();
      const kitsList = Array.isArray(kitsResult) ? kitsResult : (kitsResult?.list || []);
      const typesFromKits = kitsList
        .map((k: any) => k.machineType || k.machine_type)
        .filter((t: string) => t && t.trim() !== '');

      const defaultTypes = ['Pompe à vide', 'V 300', 'VMS 2014', 'Adoucisseur', 'Chauffe-eau'];
      const combined = [...new Set([...typesFromFields, ...typesFromMachines, ...typesFromKits, ...defaultTypes])]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'fr'));

      setAvailableMachineTypes(combined);
    } catch (error) {
      console.error('❌ Erreur chargement types machine:', error);
      setAvailableMachineTypes(['Pompe à vide', 'V 300', 'VMS 2014', 'Adoucisseur', 'Chauffe-eau']);
    }
  };

  // ✅ CHARGEMENT DES CHAMPS DEPUIS LA TABLE machine_fields
  const loadMachineFields = async () => {
    try {
      const result: any = await db.machineFields.list();
      const list = Array.isArray(result) ? result : (result?.list || []);
      const normalized = list.map((f: any) => ({
        ...f,
        id: f.id || f._id,
        _id: f._id || f.id,
        label: f.label || f.name || 'Champ',
        name: f.name || f.label || 'champ',
        fieldType: f.fieldType || f.field_type || f.type || 'text',
        machineType: f.machineType || f.machine_type || 'Tous',
        isActive: f.isActive !== undefined ? Boolean(f.isActive) : (f.is_active !== undefined ? Boolean(f.is_active) : true),
        isRequired: Boolean(f.isRequired ?? f.is_required),
        order: f.order ?? f.ordre ?? 0
      })).filter((f: any) => f.isActive);

      normalized.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setMachineFields(normalized);
    } catch (error) {
      console.error('❌ Erreur chargement champs dynamiques:', error);
      setMachineFields([]);
    }
  };

  // ✅ CHARGEMENT DES OPTIONS DEPUIS LA TABLE machine_field_options
  const loadFieldOptions = async () => {
    try {
      const result: any = await db.machineFieldOptions.list();
      const options = Array.isArray(result) ? result : (result?.list || []);
      const groupedOptions: Record<string, string[]> = {};

      // Récupération des champs pour enrichir le mapping id <-> label <-> name
      const fieldsResult: any = await db.machineFields.list();
      const fieldsList = Array.isArray(fieldsResult) ? fieldsResult : (fieldsResult?.list || []);
      const fieldLookup: Record<string, any> = {};
      fieldsList.forEach((f: any) => {
        const fid = f.id || f._id;
        if (fid) fieldLookup[fid] = f;
        if (f.name) fieldLookup[f.name] = f;
        if (f.label) fieldLookup[f.label] = f;
      });

      options.forEach((opt: any) => {
        const fieldKey = opt.fieldId || opt.field_id;
        const val = opt.value || opt.label;
        if (val) {
          const keysToMap = new Set<string>();
          if (fieldKey) {
            keysToMap.add(fieldKey);
            const matchedField = fieldLookup[fieldKey];
            if (matchedField) {
              if (matchedField.id) keysToMap.add(matchedField.id);
              if (matchedField._id) keysToMap.add(matchedField._id);
              if (matchedField.name) keysToMap.add(matchedField.name);
              if (matchedField.label) keysToMap.add(matchedField.label);
            }
          }

          keysToMap.forEach((k) => {
            if (!groupedOptions[k]) groupedOptions[k] = [];
            if (!groupedOptions[k].includes(val)) {
              groupedOptions[k].push(val);
            }
          });
        }
      });
      setFieldOptions(groupedOptions);
    } catch (error) {
      console.error('❌ Erreur chargement options:', error);
      setFieldOptions({});
    }
  };

  // Helper pour savoir si un champ de la table correspond au type de machine sélectionné
  const isFieldForSelectedMachineType = (field: any) => {
    const fType = (field.machineType || field.machine_type || '').trim().toLowerCase();
    if (!fType || fType === 'tous' || fType === 'all') return true;
    if (!formData.typeMachine) return false;

    const currentType = formData.typeMachine.trim().toLowerCase();
    if (fType === currentType) return true;

    // Comparaison normalisée sans ponctuation/espaces (ex: 'v 300' === 'v300')
    const clean = (s: string) => s.replace(/[\s\-_]/g, '').toLowerCase();
    if (clean(fType) === clean(currentType)) return true;
    if (clean(currentType).includes(clean(fType)) || clean(fType).includes(clean(currentType))) return true;

    return false;
  };

  const shouldDisplayField = (field: any) => {
    if (!field.isActive) return false;
    if (!isFieldForSelectedMachineType(field)) return false;

    // Règles conditionnelles si définies dans la table
    if (field.conditionalRules) {
      const parentField = field.conditionalRules.parentField || field.conditionalRules.parent_field;
      const parentValue = field.conditionalRules.parentValue || field.conditionalRules.parent_value;
      if (parentField) {
        const currentVal = specificConfigValues[parentField] || formData[parentField as keyof typeof formData];
        if (currentVal !== parentValue) return false;
      }
    }
    return true;
  };

  const updateSpecificConfigValue = (key: string, value: any) => {
    setSpecificConfigValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addExtraField = () => {
    setExtraFields(prev => [...prev, { label: '', value: '' }]);
  };

  const removeExtraField = (index: number) => {
    setExtraFields(prev => prev.filter((_, i) => i !== index));
  };

  const updateExtraField = (index: number, key: 'label' | 'value', val: string) => {
    setExtraFields(prev => {
      const next = [...prev];
      next[index][key] = val;
      return next;
    });
  };

  const addCustomField = () => {
    setCustomFields(prev => [...prev, { name: '', value: '', type: 'text' }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const updateCustomFieldName = (index: number, name: string) => {
    setCustomFields(prev => {
      const next = [...prev];
      next[index].name = name;
      return next;
    });
  };

  const updateCustomFieldType = (index: number, type: 'text' | 'textarea' | 'number' | 'date' | 'boolean') => {
    setCustomFields(prev => {
      const next = [...prev];
      next[index].type = type;
      if (type === 'boolean' && next[index].value === '') {
        next[index].value = 'false';
      }
      return next;
    });
  };

  const updateCustomFieldValue = (index: number, value: string) => {
    setCustomFields(prev => {
      const next = [...prev];
      next[index].value = value;
      return next;
    });
  };

  const renderCustomFieldInput = (field: any, index: number) => {
    switch (field.type) {
      case 'text':
        return <Input label="Valeur" value={field.value} onChange={(e) => updateCustomFieldValue(index, e.target.value)} placeholder="Ex: Bleu..." />;
      case 'textarea':
        return <TextArea label="Valeur" value={field.value} onChange={(e) => updateCustomFieldValue(index, e.target.value)} placeholder="Description..." rows={3} />;
      case 'number':
        return <Input label="Valeur" type="number" value={field.value} onChange={(e) => updateCustomFieldValue(index, e.target.value)} placeholder="Ex: 15..." />;
      case 'date':
        return <Input label="Valeur" type="date" value={field.value} onChange={(e) => updateCustomFieldValue(index, e.target.value)} />;
      case 'boolean':
        return (
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
      default:
        return null;
    }
  };

  // ✅ CHARGEMENT DE LA MACHINE EXISTANTE
  const loadMachine = async () => {
    setLoading(true);
    try {
      const machine = await db.machines.get(machineId!);
      if (machine) {
        const machineTypeVal = machine.typeMachine || machine.type_machine || machine.configType || '';
        setFormData({
          nom: machine.modele || machine.nom || '',
          typeMachine: machineTypeVal,
          numeroSerie: machine.numeroSerie || machine.numero_serie || '',
          versionNumero: machine.versionNumero || machine.version_numero || '',
          clientId: machine.clientId || machine.client_id || '',
          typeRelation: machine.typeRelation || machine.type_relation || 'MAITRE',
          dateInstallation: machine.dateInstallation?.split('T')[0] || '',
          compteur: machine.compteur || 0,
          gpsLat: machine.gpsLat?.toString() || machine.latitude?.toString() || '',
          gpsLng: machine.gpsLng?.toString() || machine.longitude?.toString() || '',
          gpsSource: machine.gpsSource || 'ADDRESS',
          notes: machine.notes || ''
        });

        // Rechargement des valeurs de configuration spécifique depuis customFields
        const loadedConfig: Record<string, any> = {};
        if (machine.customFields && typeof machine.customFields === 'object' && !Array.isArray(machine.customFields)) {
          Object.assign(loadedConfig, machine.customFields);
        }
        // Rétrocompatibilité avec les anciennes colonnes spécifiques
        if (machine.pumpType) loadedConfig['Type de pompe'] = machine.pumpType;
        if (machine.pumpVariator) loadedConfig['Variateur'] = machine.pumpVariator;
        if (machine.pumpCabinet) loadedConfig['Armoire'] = machine.pumpCabinet;
        if (machine.v300Option) {
          loadedConfig['Option principale'] = machine.v300Option;
          loadedConfig['Options V300'] = machine.v300Option;
        }

        setSpecificConfigValues(loadedConfig);

        // Rechargement des détails libres
        if (Array.isArray(machine.customFields)) {
          setCustomFields(machine.customFields);
        } else if (machine.customFields?.customFields && Array.isArray(machine.customFields.customFields)) {
          setCustomFields(machine.customFields.customFields);
        }

        if (machine.customFields?.extraFields && Array.isArray(machine.customFields.extraFields)) {
          setExtraFields(machine.customFields.extraFields);
        } else if (machine.extraFields && Array.isArray(machine.extraFields)) {
          setExtraFields(machine.extraFields);
        } else if (machine.pumpExtraFields && Array.isArray(machine.pumpExtraFields)) {
          setExtraFields(machine.pumpExtraFields);
        } else if (machine.v300ExtraFields && Array.isArray(machine.v300ExtraFields)) {
          setExtraFields(machine.v300ExtraFields);
        } else if (machine.otherExtraFields && Array.isArray(machine.otherExtraFields)) {
          setExtraFields(machine.otherExtraFields);
        }
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

  // ✅ RENDU D'UN CHAMP DYNAMIQUE CONFIGURÉ DANS LA TABLE machine_fields
  const renderDynamicField = (field: any) => {
    const fieldKey = field.label || field.name;
    const fieldValue = specificConfigValues[fieldKey] ?? specificConfigValues[field.name] ?? '';
    const rawOptions =
      fieldOptions[field.id] ||
      fieldOptions[field._id] ||
      fieldOptions[field.name] ||
      fieldOptions[field.label] ||
      (Array.isArray(field.options) ? field.options : []) ||
      [];
    const options = Array.from(new Set(rawOptions.filter(Boolean)));

    return (
      <div key={field.id || field._id || field.name} className="space-y-1">
        {field.fieldType === 'select' ? (
          <div>
            <Select
              label={field.label}
              value={fieldValue}
              onChange={(e) => updateSpecificConfigValue(fieldKey, e.target.value)}
              options={options.map((opt: string) => ({ value: opt, label: opt }))}
              required={field.isRequired}
            />
            {field.allowCustomValue && fieldValue === 'Autre' && (
              <div className="mt-2">
                <Input
                  label={`${field.label} — Préciser`}
                  value={specificConfigValues[`${fieldKey}_custom`] || ''}
                  onChange={(e) => updateSpecificConfigValue(`${fieldKey}_custom`, e.target.value)}
                  placeholder="Veuillez préciser la valeur personnalisée..."
                />
              </div>
            )}
          </div>
        ) : field.fieldType === 'number' ? (
          <Input
            label={field.label}
            type="number"
            value={fieldValue}
            onChange={(e) => updateSpecificConfigValue(fieldKey, e.target.value)}
            required={field.isRequired}
            placeholder={`Saisir ${field.label.toLowerCase()}...`}
          />
        ) : field.fieldType === 'date' ? (
          <Input
            label={field.label}
            type="date"
            value={fieldValue}
            onChange={(e) => updateSpecificConfigValue(fieldKey, e.target.value)}
            required={field.isRequired}
          />
        ) : field.fieldType === 'checkbox' ? (
          <div className="flex items-center gap-3 pt-3">
            <input
              type="checkbox"
              id={`chk-${field.id || field.name}`}
              checked={fieldValue === 'true' || fieldValue === true}
              onChange={(e) => updateSpecificConfigValue(fieldKey, e.target.checked ? 'true' : 'false')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor={`chk-${field.id || field.name}`} className="text-sm font-medium text-gray-700 cursor-pointer">
              {field.label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
          </div>
        ) : field.fieldType === 'textarea' ? (
          <TextArea
            label={field.label}
            value={fieldValue}
            onChange={(e) => updateSpecificConfigValue(fieldKey, e.target.value)}
            rows={2}
            placeholder={`Saisir ${field.label.toLowerCase()}...`}
            required={field.isRequired}
          />
        ) : (
          <Input
            label={field.label}
            value={fieldValue}
            onChange={(e) => updateSpecificConfigValue(fieldKey, e.target.value)}
            required={field.isRequired}
            placeholder={`Saisir ${field.label.toLowerCase()}...`}
          />
        )}
      </div>
    );
  };

  // ✅ ENREGISTREMENT UNIFIÉ DE LA MACHINE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.nom || !formData.numeroSerie) {
      alert('Veuillez remplir tous les champs obligatoires (Client, Nom et Numéro de série).');
      return;
    }
    setLoading(true);

    try {
      const finalCustomFields = {
        ...specificConfigValues,
        extraFields,
        customFields,
        gpsSource: formData.gpsSource,
        notes: formData.notes,
        versionNumero: formData.versionNumero
      };

      const machineData: any = {
        modele: formData.nom,
        nom: formData.nom,
        typeMachine: formData.typeMachine || 'Tous',
        type_machine: formData.typeMachine || 'Tous',
        numeroSerie: formData.numeroSerie,
        clientId: formData.clientId,
        typeRelation: formData.typeRelation,
        dateInstallation: formData.dateInstallation ? new Date(formData.dateInstallation).toISOString() : undefined,
        compteur: Number(formData.compteur),
        latitude: formData.gpsLat ? parseFloat(formData.gpsLat) : undefined,
        longitude: formData.gpsLng ? parseFloat(formData.gpsLng) : undefined,
        customFields: finalCustomFields,
        configType: formData.typeMachine || null,
        pumpType: specificConfigValues['Type de pompe'] || specificConfigValues['type_pompe'] || null,
        pumpVariator: specificConfigValues['Variateur'] || specificConfigValues['variateur'] || null,
        pumpCabinet: specificConfigValues['Armoire'] || specificConfigValues['armoire'] || null,
        v300Option: specificConfigValues['Options V300'] || specificConfigValues['options_v300'] || specificConfigValues['Option principale'] || specificConfigValues['Option'] || specificConfigValues['option_principale'] || null,
        updatedAt: new Date().toISOString()
      };

      if (machineId) {
        console.log('🔄 Mise à jour de la machine:', machineId);
        await db.machines.update(machineId, machineData);
        alert('✅ Machine modifiée avec succès !');
      } else {
        console.log('➕ Création nouvelle machine');
        machineData.createdAt = new Date().toISOString();
        await db.machines.create(machineData);
        alert('✅ Machine créée avec succès !');
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
    value: c._id || c.id,
    label: `${c.nom} - ${c.nomFerme || ''} (${c.numeroClient || ''})`
  }));

  // Champs de la table machine_fields à afficher selon le type sélectionné
  const displayedMachineFields = machineFields.filter(field => shouldDisplayField(field));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('machines')} className="flex items-center gap-2">
          <ArrowLeft size={20} /> Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {machineId ? 'Modifier la machine' : 'Nouvelle machine'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Les types et champs de configuration spécifique sont automatiquement récupérés depuis la table dédiée.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION IDENTIFICATION */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-blue-600" />
              Identification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la machine <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="machine-names-datalist"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Tapez ou choisissez un nom..."
                />
                <datalist id="machine-names-datalist">
                  {existingMachineNames.map((name, i) => <option key={i} value={name} />)}
                </datalist>
                <p className="mt-1 text-xs text-gray-500">💡 {existingMachineNames.length} noms existants</p>
              </div>

              {/* ✅ CHAMP TYPE DE MACHINE RÉCUPÉRÉ DANS LA TABLE DÉDIÉE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de machine <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="machine-types-datalist"
                  value={formData.typeMachine}
                  onChange={(e) => setFormData(prev => ({ ...prev, typeMachine: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-blue-300 bg-blue-50/30 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-gray-900"
                  placeholder="Ex: Pompe à vide, V 300, VMS 2014..."
                />
                <datalist id="machine-types-datalist">
                  {availableMachineTypes.map((t, i) => <option key={i} value={t} />)}
                </datalist>
                <p className="mt-1 text-xs text-blue-600">
                  ⚡ Les champs de configuration spécifique ci-dessous s'adaptent automatiquement à ce type.
                </p>
              </div>

              <Input
                label="Numéro de série"
                value={formData.numeroSerie}
                onChange={(e) => setFormData(prev => ({ ...prev, numeroSerie: e.target.value }))}
                required
                placeholder="Numéro unique"
              />

              <Input
                label="Version N°"
                value={formData.versionNumero}
                onChange={(e) => setFormData(prev => ({ ...prev, versionNumero: e.target.value }))}
                placeholder="Ex: 1.0, 2.5..."
              />

              <div>
                <Select
                  label="Client"
                  options={clientOptions}
                  value={formData.clientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                  required
                />
                {!clientId && !machineId && globalSelectedClient && formData.clientId === (globalSelectedClient._id || globalSelectedClient.id) && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    <Info size={16} />
                    <span>Client pré-sélectionné automatiquement : <strong>{globalSelectedClient.nom}</strong></span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de relation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="type-relation-datalist"
                  value={formData.typeRelation}
                  onChange={(e) => setFormData(prev => ({ ...prev, typeRelation: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Tapez ou choisissez..."
                />
                <datalist id="type-relation-datalist">
                  {existingTypeRelations.map((type, i) => <option key={i} value={type} />)}
                </datalist>
              </div>
            </div>
          </div>

          {/* SECTION DONNÉES TECHNIQUES GÉNÉRALES */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Données techniques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date d'installation"
                type="date"
                value={formData.dateInstallation}
                onChange={(e) => setFormData(prev => ({ ...prev, dateInstallation: e.target.value }))}
              />
              <Input
                label="Compteur (heures)"
                type="number"
                value={formData.compteur}
                onChange={(e) => setFormData(prev => ({ ...prev, compteur: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>
          </div>

          {/* ✅ SECTION CONFIGURATION SPÉCIFIQUE (RÉCUPÉRÉE DANS LA TABLE DÉDIÉE machine_fields) */}
          <div className="border-t-2 border-gray-200 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Database size={20} className="text-blue-600" />
                  Configuration spécifique
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Champs récupérés depuis la table <code>machine_fields</code> pour le type « <strong>{formData.typeMachine || 'Tous'}</strong> ».
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onNavigate('database-admin')}
                className="flex items-center gap-1.5 self-start text-xs text-gray-700 hover:text-blue-600 border-gray-300"
                title="Accéder à l'administration pour configurer les champs de cette table"
              >
                <Settings size={15} />
                Gérer les champs dans la table
              </Button>
            </div>

            {displayedMachineFields.length > 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedMachineFields.map(field => renderDynamicField(field))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <Info size={16} className="text-amber-600 flex-shrink-0" />
                  Aucun champ spécifique configuré dans la table pour « {formData.typeMachine || 'Non renseigné'} ».
                </p>
                <p className="text-xs text-amber-700">
                  Vous pouvez ajouter des champs dédiés pour ce type de machine depuis le panneau d'administration (Table « Champs machines »).
                </p>
              </div>
            )}

            {/* DÉTAILS LIBRES SUPPLÉMENTAIRES */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  Caractéristiques & options supplémentaires libres
                </span>
                <Button type="button" variant="secondary" size="sm" onClick={addExtraField} className="text-xs">
                  <Plus size={14} className="mr-1" /> Ajouter un détail
                </Button>
              </div>

              {extraFields.length > 0 && (
                <div className="space-y-2 mt-2">
                  {extraFields.map((field, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Input
                          placeholder="Nom de la caractéristique (ex: Pression, Huile...)"
                          value={field.label}
                          onChange={(e) => updateExtraField(index, 'label', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="Valeur (ex: 50 kPa, 10W40...)"
                          value={field.value}
                          onChange={(e) => updateExtraField(index, 'value', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeExtraField(index)}
                        className="h-10 w-10 flex items-center justify-center flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION CHAMPS PERSONNALISÉS LIBRES */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings size={20} className="text-gray-500" />
                Champs personnalisés avancés
              </span>
              <Button type="button" variant="secondary" size="sm" onClick={addCustomField}>
                <Plus size={16} className="mr-1" /> Ajouter
              </Button>
            </h2>

            {customFields.length === 0 ? (
              <div className="text-center py-5 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500 text-sm">Aucun champ personnalisé avancé.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <Input
                        label="Nom du champ"
                        value={field.name}
                        onChange={(e) => updateCustomFieldName(index, e.target.value)}
                        placeholder="Ex: Couleur..."
                      />
                      <Select
                        label="Type"
                        value={field.type}
                        onChange={(e) => updateCustomFieldType(index, e.target.value as any)}
                        options={[
                          { value: 'text', label: 'Texte' },
                          { value: 'textarea', label: 'Zone de texte' },
                          { value: 'number', label: 'Nombre' },
                          { value: 'date', label: 'Date' },
                          { value: 'boolean', label: 'Oui/Non' }
                        ]}
                      />
                      <div className="flex items-end">
                        <Button type="button" variant="danger" size="sm" onClick={() => removeCustomField(index)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    <div>{renderCustomFieldInput(field, index)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LOCALISATION GPS */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-blue-600" />
              Localisation GPS
            </h2>
            {formData.gpsLat && formData.gpsLng && formData.gpsSource === 'ADDRESS' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                ℹ️ Position GPS approximative calculée d'après l'adresse du client.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={formData.gpsLat}
                onChange={(e) => setFormData(prev => ({ ...prev, gpsLat: e.target.value }))}
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                value={formData.gpsLng}
                onChange={(e) => setFormData(prev => ({ ...prev, gpsLng: e.target.value }))}
              />
            </div>
          </div>

          {/* NOTES */}
          <div>
            <TextArea
              label="Notes & observations"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Notes diverses sur l'installation ou la configuration..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => onNavigate('machines')}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Save size={20} />
              {loading ? 'Enregistrement...' : 'Enregistrer la machine'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
