// src/services/demoDatabase.ts
// Base de données autonome embarquée pour les démonstrations acquéreurs
// Fonctionne à 100% sans aucun serveur ni compte Supabase externe requis.

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

const STORAGE_KEY = 'maintenance_demo_database_v1';

const INITIAL_DEMO_DATA: DemoDatabaseState = {
  utilisateurs: [
    {
      id: 'usr-001',
      _id: 'usr-001',
      nom: 'CHAMPAGNE',
      prenom: 'Hervé',
      email: 'contact@appalacarte.fr',
      role: 'ADMINISTRATEUR',
      numeroTechnicien: '001',
      telephone: '',
      actif: true,
      permissions: ['admin_access', 'manage_users', 'view_all_data']
    },
    {
      id: 'usr-002',
      _id: 'usr-002',
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'resp.technique@appalacarte.fr',
      role: 'RESPONSABLE_TECHNIQUE',
      numeroTechnicien: '002',
      telephone: '',
      actif: true,
      permissions: ['technical_validation', 'view_all_data']
    },
    {
      id: 'usr-003',
      _id: 'usr-003',
      nom: 'Martin',
      prenom: 'Marc',
      email: 'tech.cms@appalacarte.fr',
      role: 'TECHNICIEN_CMS',
      numeroTechnicien: '010',
      telephone: '',
      actif: true,
      permissions: ['field_intervention']
    },
    {
      id: 'usr-004',
      _id: 'usr-004',
      nom: 'Durand',
      prenom: 'Pierre',
      email: 'tech.vms@appalacarte.fr',
      role: 'TECHNICIEN_VMS',
      numeroTechnicien: '020',
      telephone: '',
      actif: true,
      permissions: ['field_intervention']
    }
  ],

  clients: [
    {
      id: 'cl-001',
      _id: 'cl-001',
      numeroClient: 'CLI-2026-001',
      nom: 'GAEC des Trois Vallées',
      nomFerme: 'Ferme des Prairies',
      adresse: '12 route des Collines',
      ville: 'Reims',
      codePostal: '51100',
      pays: 'France',
      telephone: '',
      email: 'contact@trois-vallees.fr',
      contactPrincipal: 'Michel Lefebvre',
      latitude: 49.2583,
      longitude: 4.0317,
      notes: 'Installation de 2 robots de traite. Accès par la cour arrière.',
      actif: true,
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
    },
    {
      id: 'cl-002',
      _id: 'cl-002',
      numeroClient: 'CLI-2026-002',
      nom: 'EARL du Domaine Vert',
      nomFerme: 'Domaine de la Source',
      adresse: '45 chemin du Moulin',
      ville: 'Épernay',
      codePostal: '51200',
      pays: 'France',
      telephone: '',
      email: 'contact@domainevert.fr',
      contactPrincipal: 'Sophie Bernard',
      latitude: 49.0436,
      longitude: 3.9555,
      notes: 'Contrat de maintenance préventive semestrielle.',
      actif: true,
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString()
    },
    {
      id: 'cl-003',
      _id: 'cl-003',
      numeroClient: 'CLI-2026-003',
      nom: 'Ferme Lemoine & Fils',
      nomFerme: 'Les Grands Champs',
      adresse: '8 rue de la Gare',
      ville: 'Châlons-en-Champagne',
      codePostal: '51000',
      pays: 'France',
      telephone: '',
      email: 'lemoine.ferme@orange.fr',
      contactPrincipal: 'Antoine Lemoine',
      latitude: 48.9567,
      longitude: 4.3644,
      notes: 'Pompe à vide remplacée en 2025. Révision planifiée.',
      actif: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'cl-004',
      _id: 'cl-004',
      numeroClient: 'CLI-2026-004',
      nom: 'GAEC de l\'Avenir',
      nomFerme: 'Ferme Neuve',
      adresse: '17 route de Vitry',
      ville: 'Sainte-Menehould',
      codePostal: '51800',
      pays: 'France',
      telephone: '',
      email: 'avenir.gaec@wanadoo.fr',
      contactPrincipal: 'Didier Moreau',
      latitude: 49.0911,
      longitude: 4.8989,
      notes: 'Vérification annuelle du refroidisseur de lait.',
      actif: true,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
    }
  ],

  machines: [
    {
      id: 'mch-001',
      _id: 'mch-001',
      clientId: 'cl-001',
      numeroSerie: 'ROB-2024-991',
      modele: 'Robot Traite V-Pro 300',
      typeMachine: 'Robot de traite',
      configType: 'v300',
      dateInstallation: '2024-03-15',
      compteur: 3420,
      statut: 'active',
      actif: true,
      createdAt: new Date(Date.now() - 50 * 86400000).toISOString()
    },
    {
      id: 'mch-002',
      _id: 'mch-002',
      clientId: 'cl-001',
      numeroSerie: 'PMP-2024-118',
      modele: 'Pompe à vide PV-80',
      typeMachine: 'Pompe à vide',
      configType: 'pump',
      dateInstallation: '2024-03-15',
      compteur: 3420,
      statut: 'active',
      actif: true,
      createdAt: new Date(Date.now() - 50 * 86400000).toISOString()
    },
    {
      id: 'mch-003',
      _id: 'mch-003',
      clientId: 'cl-002',
      numeroSerie: 'DAC-2023-402',
      modele: 'Distributeur Aliment Automatique DAC-8',
      typeMachine: 'Alimentation',
      configType: 'other',
      dateInstallation: '2023-09-10',
      compteur: 5800,
      statut: 'active',
      actif: true,
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString()
    },
    {
      id: 'mch-004',
      _id: 'mch-004',
      clientId: 'cl-003',
      numeroSerie: 'CLN-2025-055',
      modele: 'Centrale de Lavage MasterClean 4',
      typeMachine: 'Lavage',
      configType: 'other',
      dateInstallation: '2025-01-20',
      compteur: 1250,
      statut: 'active',
      actif: true,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 'mch-005',
      _id: 'mch-005',
      clientId: 'cl-004',
      numeroSerie: 'TNK-2023-789',
      modele: 'Refroidisseur Cuve TankExpert 4000L',
      typeMachine: 'Froid',
      configType: 'other',
      dateInstallation: '2023-06-12',
      compteur: 7100,
      statut: 'active',
      actif: true,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
    }
  ],

  interventions: [
    {
      id: 'int-001',
      _id: 'int-001',
      numeroIntervention: 'INT-2026-001',
      clientId: 'cl-001',
      machineId: 'mch-001',
      typeIntervention: 'maintenance',
      statut: 'terminee',
      datePrevue: '2026-02-15',
      dateDebut: '2026-02-15T08:30:00Z',
      dateFin: '2026-02-15T12:00:00Z',
      technicienPrincipalId: 'usr-004',
      description: 'Maintenance préventive complète du robot : remplacement manchons et joints.',
      observations: 'Bon état général. Pression de pulsation ajustée à 42 kPa.',
      tempsPasse: 210,
      piecesUtilisees: [
        { reference: 'MNC-1020', designation: 'Manchon trayeur silicone', quantite: 4, prixUnitaire: 22.0 },
        { reference: 'JNT-4402', designation: 'Joint torique 65mm', quantite: 2, prixUnitaire: 8.5 }
      ],
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 'int-002',
      _id: 'int-002',
      numeroIntervention: 'INT-2026-002',
      clientId: 'cl-003',
      machineId: 'mch-004',
      typeIntervention: 'depannage',
      statut: 'en_cours',
      datePrevue: '2026-03-01',
      dateDebut: '2026-03-01T09:00:00Z',
      technicienPrincipalId: 'usr-003',
      description: 'Défaut de chauffage eau de rinçage sur centrale de lavage.',
      observations: 'Contrôle en cours de la résistance thermique et de la vanne d\'arrivée.',
      tempsPasse: 90,
      piecesUtilisees: [
        { reference: 'ELV-9901', designation: 'Électrovanne 24V DC', quantite: 1, prixUnitaire: 135.0 }
      ],
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 'int-003',
      _id: 'int-003',
      numeroIntervention: 'INT-2026-003',
      clientId: 'cl-002',
      machineId: 'mch-003',
      typeIntervention: 'controle',
      statut: 'planifiee',
      datePrevue: '2026-03-10',
      technicienPrincipalId: 'usr-002',
      description: 'Contrôle périodique de dosage et calibration des pesons.',
      observations: 'Prévoir kit d\'étalonnage 25kg.',
      tempsPasse: 0,
      piecesUtilisees: [],
      createdAt: new Date().toISOString()
    }
  ],

  spareParts: [
    {
      id: 'sp-001',
      _id: 'sp-001',
      reference: 'FLT-8801',
      designation: 'Filtre à vide haute performance',
      categorie: 'Filtration',
      stock: 28,
      seuilAlerte: 5,
      prixUnitaire: 45.0,
      fournisseur: 'AgriTech Pièces',
      actif: true
    },
    {
      id: 'sp-002',
      _id: 'sp-002',
      reference: 'JNT-4402',
      designation: 'Joint torique d\'étanchéité 65mm',
      categorie: 'Étanchéité',
      stock: 142,
      seuilAlerte: 20,
      prixUnitaire: 8.5,
      fournisseur: 'Joints & Élastomères Pro',
      actif: true
    },
    {
      id: 'sp-003',
      _id: 'sp-003',
      reference: 'MNC-1020',
      designation: 'Manchon trayeur silicone renforcé',
      categorie: 'Trayeur',
      stock: 46,
      seuilAlerte: 12,
      prixUnitaire: 22.0,
      fournisseur: 'Silicone Traite France',
      actif: true
    },
    {
      id: 'sp-004',
      _id: 'sp-004',
      reference: 'CLP-3301',
      designation: 'Clapet anti-retour inox alimentaire',
      categorie: 'Vannerie',
      stock: 11,
      seuilAlerte: 3,
      prixUnitaire: 89.0,
      fournisseur: 'Inox Agro',
      actif: true
    },
    {
      id: 'sp-005',
      _id: 'sp-005',
      reference: 'ELV-9901',
      designation: 'Électrovanne d\'admission eau 24V DC',
      categorie: 'Électronique & Fluides',
      stock: 7,
      seuilAlerte: 2,
      prixUnitaire: 135.0,
      fournisseur: 'ElectroAgri',
      actif: true
    },
    {
      id: 'sp-006',
      _id: 'sp-006',
      reference: 'HLE-5000',
      designation: 'Bidon huile spéciale pompe à vide (5L)',
      categorie: 'Consommable',
      stock: 18,
      seuilAlerte: 4,
      prixUnitaire: 64.0,
      fournisseur: 'Lubrifiants Industriels',
      actif: true
    },
    {
      id: 'sp-007',
      _id: 'sp-007',
      reference: 'CAP-2210',
      designation: 'Capteur de pulsation optique',
      categorie: 'Capteurs',
      stock: 14,
      seuilAlerte: 3,
      prixUnitaire: 112.0,
      fournisseur: 'SensorTech',
      actif: true
    }
  ],

  errorCodes: [
    {
      id: 'err-001',
      _id: 'err-001',
      alarme: 'ALM-101',
      typeAlarme: 'Vide',
      chapitre: 'Circuit de vide',
      titre: 'Défaut dépression : vide insuffisant',
      description: 'La dépression mesurée au capteur principal est inférieure à 38 kPa pendant plus de 15 secondes.',
      solution: '1. Contrôler le serrage des raccords tuyaux. 2. Vérifier le filtre à vide. 3. Contrôler le niveau d\'huile de la pompe à vide.',
      priorite: 'haute'
    },
    {
      id: 'err-002',
      _id: 'err-002',
      alarme: 'ALM-204',
      typeAlarme: 'Communication',
      chapitre: 'Bus électronique',
      titre: 'Perte de communication bus CAN',
      description: 'Le contrôleur principal ne reçoit plus de trames du boîtier distributeur.',
      solution: '1. Vérifier la tension d\'alimentation 24V. 2. Inspecter les terminaisons 120 ohms du bus CAN. 3. Remplacer le câble de liaison.',
      priorite: 'critique'
    },
    {
      id: 'err-003',
      _id: 'err-003',
      alarme: 'ALM-310',
      typeAlarme: 'Lavage',
      chapitre: 'Cycle thermique',
      titre: 'Température de lavage non atteinte',
      description: 'L\'eau du cycle de lavage n\'a pas atteint le seuil requis de 65°C.',
      solution: '1. Contrôler la résistance du chauffe-eau. 2. Vérifier la sonde thermique CTN. 3. Détartrer le réservoir d\'eau chaude.',
      priorite: 'moyenne'
    },
    {
      id: 'err-004',
      _id: 'err-004',
      alarme: 'ALM-405',
      typeAlarme: 'Laiterie',
      chapitre: 'Transfert lait',
      titre: 'Débit de transfert anormalement bas',
      description: 'Le temps de vidange de la cuve tampon excède le seuil de sécurité.',
      solution: '1. Inspecter le clapet anti-retour. 2. Contrôler la roue de pompe à lait. 3. Vérifier l\'absence d\'engorgement.',
      priorite: 'moyenne'
    }
  ],

  maintenanceKits: [
    {
      id: 'kit-001',
      _id: 'kit-001',
      kitId: 'KIT-500H',
      machineType: 'Robot de traite',
      kitNumber: 1,
      serviceNumber: 500,
      nom: 'Kit Entretien 500 Heures - Standard',
      description: 'Remplacement des manchons, joints de cuve et filtres primaires.',
      pieces: [
        { reference: 'MNC-1020', quantite: 4 },
        { reference: 'JNT-4402', quantite: 2 },
        { reference: 'FLT-8801', quantite: 1 }
      ],
      actif: true
    },
    {
      id: 'kit-002',
      _id: 'kit-002',
      kitId: 'KIT-2500H',
      machineType: 'Robot de traite',
      kitNumber: 2,
      serviceNumber: 2500,
      nom: 'Kit Révision Annuelle 2500 Heures',
      description: 'Révision majeure : clapets, huile de pompe, joints vannes et membranes.',
      pieces: [
        { reference: 'MNC-1020', quantite: 8 },
        { reference: 'JNT-4402', quantite: 6 },
        { reference: 'FLT-8801', quantite: 2 },
        { reference: 'HLE-5000', quantite: 1 },
        { reference: 'CLP-3301', quantite: 2 }
      ],
      actif: true
    }
  ],

  tachesEntretien: [
    {
      id: 'tsk-001',
      _id: 'tsk-001',
      kitId: 'KIT-500H',
      machineType: 'Robot de traite',
      kitNumber: 1,
      serviceNumber: 500,
      sectionId: 'sec-bras',
      sectionTitle: 'Bras de traite & faisceau',
      taskId: 't-1',
      taskLabel: 'Remplacer les 4 manchons trayeurs silicone',
      taskOrder: 1,
      isCritical: true,
      estimatedDuration: 25
    },
    {
      id: 'tsk-002',
      _id: 'tsk-002',
      kitId: 'KIT-500H',
      machineType: 'Robot de traite',
      kitNumber: 1,
      serviceNumber: 500,
      sectionId: 'sec-vide',
      sectionTitle: 'Circuit de vide',
      taskId: 't-2',
      taskLabel: 'Nettoyer et remplacer la cartouche du filtre à vide',
      taskOrder: 2,
      isCritical: false,
      estimatedDuration: 15
    },
    {
      id: 'tsk-003',
      _id: 'tsk-003',
      kitId: 'KIT-500H',
      machineType: 'Robot de traite',
      kitNumber: 1,
      serviceNumber: 500,
      sectionId: 'sec-lavage',
      sectionTitle: 'Système de lavage',
      taskId: 't-3',
      taskLabel: 'Vérifier l\'aspiration des détergents acide et alcalin',
      taskOrder: 3,
      isCritical: true,
      estimatedDuration: 20
    }
  ],

  machineFields: [
    {
      id: 'fld-001',
      _id: 'fld-001',
      machineType: 'Tous',
      label: 'Marque constructeur',
      fieldType: 'text',
      isRequired: true,
      isActive: true,
      order: 1
    },
    {
      id: 'fld-002',
      _id: 'fld-002',
      machineType: 'Tous',
      label: 'Type de pulsation',
      fieldType: 'select',
      isRequired: false,
      isActive: true,
      order: 2
    }
  ],

  machineFieldOptions: [
    {
      id: 'opt-001',
      fieldId: 'fld-002',
      value: 'Pulsation électronique 60/40',
      order: 1
    },
    {
      id: 'opt-002',
      fieldId: 'fld-002',
      value: 'Pulsation alternée 50/50',
      order: 2
    }
  ],

  languages: [
    { id: 'lng-fr', code: 'fr', name: 'Français', nativeName: 'Français', isActive: true, isDefault: true },
    { id: 'lng-en', code: 'en', name: 'English', nativeName: 'English', isActive: true, isDefault: false }
  ],

  translations: [],
  installationProtocols: [],
  commissioningProtocols: [],
  clientMessages: []
};

class DemoDatabaseManager {
  private state: DemoDatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DemoDatabaseState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Impossible de lire la base démo locale, réinitialisation:', e);
    }
    this.saveState(INITIAL_DEMO_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
  }

  private saveState(newState: DemoDatabaseState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      this.state = newState;
    } catch (e) {
      console.error('Erreur écriture dans localStorage:', e);
    }
  }

  public resetToDefault(): DemoDatabaseState {
    const copy = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
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
    const newId = data.id || data._id || 'gen_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
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
