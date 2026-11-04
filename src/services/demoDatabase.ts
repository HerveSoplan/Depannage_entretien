// src/services/demoDatabase.ts
// Gestionnaire de stockage local autonome (aucun faux client ni fausse machine en dur)

import defaultTachesData from '../data/defaultTachesEntretien.json';
import defaultErrorCodesData from '../data/defaultErrorCodes.json';

export interface DemoDatabaseState {
  utilisateurs: any[];
  clients: any[];
  machines: any[];
  interventions: any[];
  installationProtocols: any[];
  commissioningProtocols: any[];
  spareParts: any[];
  errorCodes: any[];
  maintenanceKits: any[];
  tachesEntretien: any[];
  machineFields: any[];
  machineFieldOptions: any[];
  languages: any[];
  translations: any[];
  clientMessages: any[];
  montages: any[];
}

export const DEFAULT_MAINTENANCE_KITS = [
  {
    id: '380b4d47-9d0d-4c82-9ea5-b3b276788f01',
    _id: '380b4d47-9d0d-4c82-9ea5-b3b276788f01',
    kitId: 'kit_v300_2150025306_1',
    kit_id: 'kit_v300_2150025306_1',
    machineType: 'V 300',
    machine_type: 'V 300',
    kitNumber: 2150025306,
    kit_number: 2150025306,
    serviceNumber: 1,
    service_number: 1,
    nom: 'Kit Entretien V 300-2150025306-Service (1)',
    actif: true
  },
  {
    id: '859e7fd6-df32-467f-860e-ae66d63b21c7',
    _id: '859e7fd6-df32-467f-860e-ae66d63b21c7',
    kitId: 'kit_v300_2150025307_2',
    kit_id: 'kit_v300_2150025307_2',
    machineType: 'V 300',
    machine_type: 'V 300',
    kitNumber: 2150025307,
    kit_number: 2150025307,
    serviceNumber: 2,
    service_number: 2,
    nom: 'Kit Entretien V 300-2150025307-Service (2)',
    actif: true
  },
  {
    id: 'b3237bf7-fa69-479a-b495-7552b59f2811',
    _id: 'b3237bf7-fa69-479a-b495-7552b59f2811',
    kitId: 'kit_v300_2150025308_3',
    kit_id: 'kit_v300_2150025308_3',
    machineType: 'V 300',
    machine_type: 'V 300',
    kitNumber: 2150025308,
    kit_number: 2150025308,
    serviceNumber: 3,
    service_number: 3,
    nom: 'Kit Entretien V 300-2150025308-Service (3)',
    actif: true
  },
  {
    id: '8cbd2966-005f-4684-8e0c-1fca19e595b2',
    _id: '8cbd2966-005f-4684-8e0c-1fca19e595b2',
    kitId: 'kit_v300_2150025309_4',
    kit_id: 'kit_v300_2150025309_4',
    machineType: 'V 300',
    machine_type: 'V 300',
    kitNumber: 2150025309,
    kit_number: 2150025309,
    serviceNumber: 4,
    service_number: 4,
    nom: 'Kit Entretien V 300-2150025309-Service (4)',
    actif: true
  },
  {
    id: 'd58b96d7-0d2b-4fdc-980d-99306ca0af4b',
    _id: 'd58b96d7-0d2b-4fdc-980d-99306ca0af4b',
    kitId: 'kit_vms_2014_88835631_1',
    kit_id: 'kit_vms_2014_88835631_1',
    machineType: 'VMS_2014',
    machine_type: 'VMS_2014',
    kitNumber: 88835631,
    kit_number: 88835631,
    serviceNumber: 1,
    service_number: 1,
    nom: 'Kit Entretien VMS_2014-88835631-Service (1)',
    actif: true
  },
  {
    id: '9ecaffc7-bbbb-4589-9910-19bdd62567eb',
    _id: '9ecaffc7-bbbb-4589-9910-19bdd62567eb',
    kitId: 'kit_vms_2014_88835632_2',
    kit_id: 'kit_vms_2014_88835632_2',
    machineType: 'VMS_2014',
    machine_type: 'VMS_2014',
    kitNumber: 88835632,
    kit_number: 88835632,
    serviceNumber: 2,
    service_number: 2,
    nom: 'Kit Entretien VMS_2014-88835632-Service (2)',
    actif: true
  },
  {
    id: '9996a1c4-c23f-4ad3-822b-b6624779e409',
    _id: '9996a1c4-c23f-4ad3-822b-b6624779e409',
    kitId: 'kit_vms_2014_88835633_3',
    kit_id: 'kit_vms_2014_88835633_3',
    machineType: 'VMS_2014',
    machine_type: 'VMS_2014',
    kitNumber: 88835633,
    kit_number: 88835633,
    serviceNumber: 3,
    service_number: 3,
    nom: 'Kit Entretien VMS_2014-88835633-Service (2)',
    actif: true
  },
  {
    id: '038d6fbe-ef49-4b97-ae85-44009e495083',
    _id: '038d6fbe-ef49-4b97-ae85-44009e495083',
    kitId: 'kit_vms_2014_88835634_4',
    kit_id: 'kit_vms_2014_88835634_4',
    machineType: 'VMS_2014',
    machine_type: 'VMS_2014',
    kitNumber: 88835634,
    kit_number: 88835634,
    serviceNumber: 4,
    service_number: 4,
    nom: 'Kit Entretien VMS_2014-88835634-Service (4)',
    actif: true
  }
];

const STORAGE_KEY = 'maintenance_database_v2';

const INITIAL_CLEAN_DATA: DemoDatabaseState = {
  utilisateurs: [
    {
      id: 'usr-admin',
      _id: 'usr-admin',
      nom: 'CHAMPAGNE',
      prenom: 'Hervé',
      email: 'contact@appalacarte.fr',
      role: 'ADMINISTRATEUR',
      numeroTechnicien: '001',
      actif: true,
      statut: 'VALIDE',
      permissions: [
        'admin_access',
        'manage_users',
        'view_all_data',
        'view_clients',
        'edit_clients',
        'view_machines',
        'edit_machines',
        'view_interventions',
        'edit_interventions',
        'view_spare_parts',
        'edit_spare_parts'
      ]
    }
  ],
  clients: [],
  machines: [],
  interventions: [],
  installationProtocols: [],
  commissioningProtocols: [],
  spareParts: [],
  errorCodes: defaultErrorCodesData as any[],
  maintenanceKits: DEFAULT_MAINTENANCE_KITS,
  tachesEntretien: defaultTachesData as any[],
  machineFields: [
    {
      id: 'mf-pump-type',
      _id: 'mf-pump-type',
      name: 'type_pompe',
      label: 'Type de pompe',
      fieldType: 'select',
      type: 'select',
      machineType: 'Pompe à vide',
      isRequired: true,
      isActive: true,
      order: 1,
      allowCustomValue: true
    },
    {
      id: 'mf-pump-variator',
      _id: 'mf-pump-variator',
      name: 'variateur',
      label: 'Variateur',
      fieldType: 'select',
      type: 'select',
      machineType: 'Pompe à vide',
      isRequired: false,
      isActive: true,
      order: 2,
      allowCustomValue: true
    },
    {
      id: 'mf-pump-cabinet',
      _id: 'mf-pump-cabinet',
      name: 'armoire',
      label: 'Armoire',
      fieldType: 'select',
      type: 'select',
      machineType: 'Pompe à vide',
      isRequired: false,
      isActive: true,
      order: 3,
      allowCustomValue: true
    },
    {
      id: 'mf-pump-pressure',
      _id: 'mf-pump-pressure',
      name: 'pression_service',
      label: 'Pression de service',
      fieldType: 'text',
      type: 'text',
      machineType: 'Pompe à vide',
      isRequired: false,
      isActive: true,
      order: 4,
      allowCustomValue: false
    },
    {
      id: 'mf-v300-option',
      _id: 'mf-v300-option',
      name: 'option_principale',
      label: 'Option principale',
      fieldType: 'select',
      type: 'select',
      machineType: 'V 300',
      isRequired: false,
      isActive: true,
      order: 1,
      allowCustomValue: true
    },
    {
      id: 'mf-v300-stall',
      _id: 'mf-v300-stall',
      name: 'type_stalle',
      label: 'Type de stalle',
      fieldType: 'select',
      type: 'select',
      machineType: 'V 300',
      isRequired: false,
      isActive: true,
      order: 2,
      allowCustomValue: false
    },
    {
      id: 'mf-v300-version',
      _id: 'mf-v300-version',
      name: 'version_logiciel',
      label: 'Version logiciel',
      fieldType: 'text',
      type: 'text',
      machineType: 'V 300',
      isRequired: false,
      isActive: true,
      order: 3,
      allowCustomValue: false
    },
    {
      id: 'mf-vms-arm',
      _id: 'mf-vms-arm',
      name: 'bras_robot',
      label: 'Type de bras robot',
      fieldType: 'text',
      type: 'text',
      machineType: 'VMS 2014',
      isRequired: false,
      isActive: true,
      order: 1,
      allowCustomValue: false
    },
    {
      id: 'mf-vms-camera',
      _id: 'mf-vms-camera',
      name: 'camera',
      label: 'Version caméra 3D',
      fieldType: 'text',
      type: 'text',
      machineType: 'VMS 2014',
      isRequired: false,
      isActive: true,
      order: 2,
      allowCustomValue: false
    },
    {
      id: 'mf-all-building',
      _id: 'mf-all-building',
      name: 'batiment',
      label: 'Bâtiment / Emplacement',
      fieldType: 'text',
      type: 'text',
      machineType: 'Tous',
      isRequired: false,
      isActive: true,
      order: 10,
      allowCustomValue: false
    }
  ],
  machineFieldOptions: [
    { id: 'mfo-pump-1', _id: 'mfo-pump-1', fieldId: 'mf-pump-type', value: 'DVP', label: 'DVP', order: 1 },
    { id: 'mfo-pump-2', _id: 'mfo-pump-2', fieldId: 'mf-pump-type', value: 'DVPF', label: 'DVPF', order: 2 },
    { id: 'mfo-pump-3', _id: 'mfo-pump-3', fieldId: 'mf-pump-type', value: 'VP', label: 'VP', order: 3 },
    { id: 'mfo-pump-4', _id: 'mfo-pump-4', fieldId: 'mf-pump-type', value: 'Autre', label: 'Autre...', order: 4 },
    { id: 'mfo-var-1', _id: 'mfo-var-1', fieldId: 'mf-pump-variator', value: 'NFO22', label: 'Variateur NFO 2.2', order: 1 },
    { id: 'mfo-var-2', _id: 'mfo-var-2', fieldId: 'mf-pump-variator', value: 'Ext', label: 'Variateur Ext', order: 2 },
    { id: 'mfo-var-3', _id: 'mfo-var-3', fieldId: 'mf-pump-variator', value: 'Socidix', label: 'Socidix', order: 3 },
    { id: 'mfo-var-4', _id: 'mfo-var-4', fieldId: 'mf-pump-variator', value: 'Autre', label: 'Autre...', order: 4 },
    { id: 'mfo-cab-1', _id: 'mfo-cab-1', fieldId: 'mf-pump-cabinet', value: 'Commutateur', label: 'Armoire Commutateur à came', order: 1 },
    { id: 'mfo-cab-2', _id: 'mfo-cab-2', fieldId: 'mf-pump-cabinet', value: '3Contacteur', label: 'Armoire 3 contacteurs', order: 2 },
    { id: 'mfo-cab-3', _id: 'mfo-cab-3', fieldId: 'mf-pump-cabinet', value: 'Socidix', label: 'Armoire Socidix', order: 3 },
    { id: 'mfo-cab-4', _id: 'mfo-cab-4', fieldId: 'mf-pump-cabinet', value: 'Autre', label: 'Autre...', order: 4 },
    { id: 'mfo-v300-1', _id: 'mfo-v300-1', fieldId: 'mf-v300-option', value: 'HN100', label: 'HN100', order: 1 },
    { id: 'mfo-v300-2', _id: 'mfo-v300-2', fieldId: 'mf-v300-option', value: 'Compteur', label: 'Compteur', order: 2 },
    { id: 'mfo-v300-3', _id: 'mfo-v300-3', fieldId: 'mf-v300-option', value: 'MCA', label: 'MCA', order: 3 },
    { id: 'mfo-v300-4', _id: 'mfo-v300-4', fieldId: 'mf-v300-option', value: 'Autre', label: 'Autre...', order: 4 },
    { id: 'mfo-stall-1', _id: 'mfo-stall-1', fieldId: 'mf-v300-stall', value: 'Stalle simple', label: 'Stalle simple', order: 1 },
    { id: 'mfo-stall-2', _id: 'mfo-stall-2', fieldId: 'mf-v300-stall', value: 'Stalle double', label: 'Stalle double', order: 2 }
  ],
  languages: [
    { id: 'lang-fr', code: 'fr', name: 'Français', nativeName: 'Français', isActive: true, isDefault: true },
    { id: 'lang-en', code: 'en', name: 'English', nativeName: 'English', isActive: true, isDefault: false }
  ],
  translations: [],
  clientMessages: [],
  montages: []
};

class DemoDatabaseManager {
  private state: DemoDatabaseState;

  constructor() {
    this.cleanLegacyStorage();
    this.state = this.loadState();
  }

  private cleanLegacyStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('maintenance_demo_database_v1');
      }
    } catch (e) {
      // ignore
    }
  }

  private loadState(): DemoDatabaseState {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.utilisateurs) parsed.utilisateurs = [];
        if (!parsed.montages) parsed.montages = [];
        
        // S'assurer que contact@appalacarte.fr est toujours présent et administrateur actif
        const adminIndex = parsed.utilisateurs.findIndex((u: any) => u.email?.toLowerCase() === 'contact@appalacarte.fr');
        if (adminIndex === -1) {
          parsed.utilisateurs.unshift(INITIAL_CLEAN_DATA.utilisateurs[0]);
        } else {
          parsed.utilisateurs[adminIndex] = {
            ...parsed.utilisateurs[adminIndex],
            nom: 'CHAMPAGNE',
            prenom: 'Hervé',
            email: 'contact@appalacarte.fr',
            role: 'ADMINISTRATEUR',
            actif: true,
            statut: 'VALIDE'
          };
        }

        // Harmonisation des statuts pour tous les utilisateurs
        parsed.utilisateurs = parsed.utilisateurs.map((u: any) => ({
          ...u,
          statut: u.statut || (u.actif !== false ? 'VALIDE' : 'EN_ATTENTE')
        }));

        // Garantir les kits et tâches d'entretien par défaut si vides
        if (!parsed.maintenanceKits || parsed.maintenanceKits.length === 0) {
          parsed.maintenanceKits = DEFAULT_MAINTENANCE_KITS;
        }
        if (!parsed.tachesEntretien || parsed.tachesEntretien.length === 0) {
          parsed.tachesEntretien = defaultTachesData;
        }

        this.saveState(parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('Impossible de lire la base locale:', e);
    }
    const clean = JSON.parse(JSON.stringify(INITIAL_CLEAN_DATA));
    this.saveState(clean);
    return clean;
  }

  private saveState(newState: DemoDatabaseState) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      }
      this.state = newState;
    } catch (e) {
      console.error('Erreur écriture dans localStorage:', e);
    }
  }

  public resetToDefault(): DemoDatabaseState {
    const copy = JSON.parse(JSON.stringify(INITIAL_CLEAN_DATA));
    this.saveState(copy);
    return copy;
  }

  public getTable(tableName: keyof DemoDatabaseState): any[] {
    return this.state[tableName] || [];
  }

  public setTable(tableName: keyof DemoDatabaseState, list: any[]) {
    const newState = { ...this.state, [tableName]: list };
    this.saveState(newState);
  }

  public findById(tableName: keyof DemoDatabaseState, id: string): any | null {
    const list = this.getTable(tableName);
    return list.find((item: any) => item.id === id || item._id === id) || null;
  }

  public insert(tableName: keyof DemoDatabaseState, data: any): any {
    const newId = data.id || data._id || 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const item = {
      ...data,
      id: newId,
      _id: newId,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const list = [...this.getTable(tableName), item];
    const newState = { ...this.state, [tableName]: list };
    this.saveState(newState);
    return item;
  }

  public update(tableName: keyof DemoDatabaseState, id: string, updates: any): any {
    const list = this.getTable(tableName).map((item: any) => {
      if (item.id === id || item._id === id) {
        return {
          ...item,
          ...updates,
          id: item.id || id,
          _id: item._id || id,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    const newState = { ...this.state, [tableName]: list };
    this.saveState(newState);
    return this.findById(tableName, id);
  }

  public delete(tableName: keyof DemoDatabaseState, id: string): boolean {
    const list = this.getTable(tableName).filter((item: any) => item.id !== id && item._id !== id);
    const newState = { ...this.state, [tableName]: list };
    this.saveState(newState);
    return true;
  }
}

export const demoDb = new DemoDatabaseManager();
