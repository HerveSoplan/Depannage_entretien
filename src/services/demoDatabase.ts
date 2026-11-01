// src/services/demoDatabase.ts
// Gestionnaire de stockage local autonome (aucun faux client ni fausse machine en dur)

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
}

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
  errorCodes: [],
  maintenanceKits: [],
  tachesEntretien: [],
  machineFields: [],
  machineFieldOptions: [],
  languages: [
    { id: 'lang-fr', code: 'fr', name: 'Français', nativeName: 'Français', isActive: true, isDefault: true },
    { id: 'lang-en', code: 'en', name: 'English', nativeName: 'English', isActive: true, isDefault: false }
  ],
  translations: [],
  clientMessages: []
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
