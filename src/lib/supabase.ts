// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { demoDb } from '../services/demoDatabase';
import {
  generateTemporaryPassword,
  isTemporaryPassword,
  validatePassword,
  passwordErrorMessage,
  passwordRules
} from './validation/password';
import { getAppBaseUrl } from '../version';
import { getDefaultPermissionsForRole } from '../utils/permissions';

export {
  demoDb,
  generateTemporaryPassword,
  isTemporaryPassword,
  validatePassword,
  passwordErrorMessage,
  passwordRules
};

// Configuration Supabase officielle (variables d'environnement avec repli de production garanti)
const DEFAULT_SUPABASE_URL = 'https://syrznjjxyvbbkahaavdf.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_HNpoA0yU4CoUW1UrgrOekA_koP9dD4O';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Détection intelligente du mode live Supabase
// Supabase est actif par défaut car les clés de production officielles sont configurées
export const isLiveSupabaseActive = (): boolean => {
  if (typeof window !== 'undefined') {
    const forced = localStorage.getItem('depannage_use_live_supabase');
    if (forced === 'true') return true;
    if (forced === 'false') return false;
  }
  const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  const hasValidUrl = !!url && !url.includes('placeholder');
  const hasValidKey = !!key && !key.includes('placeholder');
  return hasValidUrl && hasValidKey;
};

export const setLiveSupabaseActive = (active: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('depannage_use_live_supabase', active ? 'true' : 'false');
  }
};

// Configuration de l'email officiel pour les demandes de nouveau mot de passe (paramétrable depuis DatabaseAdminScreen)
export const DEFAULT_PASSWORD_REQUEST_EMAIL = 'contact@appalacarte.fr';

export const getPasswordRequestEmail = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('depannage_password_request_email');
    if (stored && stored.trim() && !stored.toLowerCase().includes('soplan')) {
      return stored.trim();
    }
    // Purge automatique de tout résidu "soplan" en mémoire locale
    if (stored && stored.toLowerCase().includes('soplan')) {
      localStorage.setItem('depannage_password_request_email', DEFAULT_PASSWORD_REQUEST_EMAIL);
    }
  }
  return DEFAULT_PASSWORD_REQUEST_EMAIL;
};

export const setPasswordRequestEmail = (newEmail: string): string => {
  const clean = (newEmail || '').trim().toLowerCase();
  const valueToStore = clean || DEFAULT_PASSWORD_REQUEST_EMAIL;
  if (typeof window !== 'undefined') {
    localStorage.setItem('depannage_password_request_email', valueToStore);
  }
  return valueToStore;
};

// Vérification de l'état de la connexion Supabase en temps réel
export const checkSupabaseConnection = async (): Promise<{ connected: boolean; error?: string; url: string }> => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  if (!isLiveSupabaseActive()) {
    return { connected: false, error: 'Supabase n\'est pas configuré (clés manquantes ou mode démo forcé)', url };
  }
  try {
    const { error } = await supabase.from('maintenance_kits').select('count', { count: 'exact', head: true });
    if (error) {
      return { connected: false, error: `${error.message} (${error.code || 'code'})`, url };
    }
    return { connected: true, url };
  } catch (err: any) {
    return { connected: false, error: err?.message || 'Projet Supabase injoignable ou en pause (paused)', url };
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper pour convertir les noms de colonnes snake_case vers camelCase
export const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      if (key === 'id') {
        acc['_id'] = obj[key];
        acc['id'] = obj[key];
        return acc;
      }

      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
};

// Helper pour convertir camelCase vers snake_case
export const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
};

// Assainissement strict pour la table public.utilisateurs de Supabase (exclut les champs locaux et gère les schémas)
export const sanitizeUserDataForSupabase = (
  userData: any,
  options: { excludePasswordFields?: boolean; isUpdate?: boolean } = {}
) => {
  if (!userData || typeof userData !== 'object') return {};

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (!options.isUpdate) {
    // Mode CRÉATION : valeurs par défaut obligatoires
    const cleanRole = userData.role || (Array.isArray(userData.roles) && userData.roles[0]) || 'TECHNICIEN_CMS';
    const cleanEmail = (userData.email || '').trim().toLowerCase();

    payload.nom = (userData.nom || '').trim();
    payload.prenom = (userData.prenom || '').trim();
    payload.email = cleanEmail;
    payload.role = cleanRole;
    payload.numero_technicien = userData.numeroTechnicien || userData.numero_technicien || null;
    payload.telephone = userData.telephone || null;
    payload.actif = userData.actif !== undefined ? Boolean(userData.actif) : true;
    payload.permissions = Array.isArray(userData.permissions) ? userData.permissions : [];
    payload.statut = userData.statut || (userData.actif !== false ? 'VALIDE' : 'EN_ATTENTE');
  } else {
    // Mode MISE À JOUR (PATCH) : ne mettre à jour STRICTEMENT QUE les champs fournis pour éviter d'écraser nom/email !
    if (userData.nom !== undefined) {
      payload.nom = String(userData.nom).trim();
    }
    if (userData.prenom !== undefined) {
      payload.prenom = String(userData.prenom).trim();
    }
    if (userData.email !== undefined) {
      payload.email = String(userData.email).trim().toLowerCase();
    }
    if (userData.role !== undefined || (Array.isArray(userData.roles) && userData.roles.length > 0)) {
      payload.role = userData.role || (Array.isArray(userData.roles) && userData.roles[0]) || 'TECHNICIEN_CMS';
    }
    if (userData.numeroTechnicien !== undefined || userData.numero_technicien !== undefined) {
      payload.numero_technicien = userData.numeroTechnicien !== undefined ? userData.numeroTechnicien : userData.numero_technicien;
    }
    if (userData.telephone !== undefined) {
      payload.telephone = userData.telephone;
    }
    if (userData.actif !== undefined) {
      payload.actif = Boolean(userData.actif);
    }
    if (userData.permissions !== undefined) {
      payload.permissions = Array.isArray(userData.permissions) ? userData.permissions : [];
    }
    if (userData.statut !== undefined) {
      payload.statut = userData.statut;
    }
  }

  if (userData.motifDemande !== undefined || userData.motif_demande !== undefined) {
    payload.motif_demande = userData.motifDemande !== undefined ? userData.motifDemande : userData.motif_demande;
  }
  if (userData.dateDemande !== undefined || userData.date_demande !== undefined) {
    payload.date_demande = userData.dateDemande !== undefined ? userData.dateDemande : userData.date_demande;
  }
  if (userData.validePar !== undefined || userData.valide_par !== undefined) {
    payload.valide_par = userData.validePar !== undefined ? userData.validePar : userData.valide_par;
  }
  if (userData.valideLe !== undefined || userData.valide_le !== undefined) {
    payload.valide_le = userData.valideLe !== undefined ? userData.valideLe : userData.valide_le;
  }
  if (userData.createdAt !== undefined || userData.created_at !== undefined) {
    payload.created_at = userData.createdAt !== undefined ? userData.createdAt : userData.created_at;
  }

  // Ne transmettre l'UUID que si c'est un format UUID valide (en création)
  const isUuidCheck = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
  const potentialId = userData.id || userData._id;
  if (potentialId && isUuidCheck(potentialId) && !options.isUpdate) {
    payload.id = potentialId;
  }

  // Champs de gestion de mot de passe (si non exclus pour compatibilité avec schémas existants)
  if (!options.excludePasswordFields) {
    if (userData.motDePasseTemporaire !== undefined || userData.mot_de_passe_temporaire !== undefined) {
      payload.mot_de_passe_temporaire = userData.motDePasseTemporaire !== undefined ? userData.motDePasseTemporaire : userData.mot_de_passe_temporaire;
    }
    if (userData.doitChangerMotDePasse !== undefined) {
      payload.doit_changer_mot_de_passe = Boolean(userData.doitChangerMotDePasse);
    }
    if (userData.motDePasse !== undefined || userData.mot_de_passe !== undefined) {
      payload.mot_de_passe = userData.motDePasse !== undefined ? userData.motDePasse : userData.mot_de_passe;
    }
    if (userData.derniereConnexion !== undefined || userData.derniere_connexion !== undefined) {
      payload.derniere_connexion = userData.derniereConnexion !== undefined ? userData.derniereConnexion : userData.derniere_connexion;
    }
  }

  return payload;
};

// Helper universel de validation de format UUID PostgreSQL
export const isUuid = (val: any): boolean => {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
};

// ==============================================================================
// SANITISATION ET NORMALISATION STRICTES CLIENTS SUPABASE
// ==============================================================================
export const VALID_CLIENT_COLUMNS = new Set([
  'id',
  'numero_client',
  'nom',
  'nom_ferme',
  'adresse',
  'ville',
  'code_postal',
  'pays',
  'telephone',
  'email',
  'contact_principal',
  'latitude',
  'longitude',
  'notes',
  'actif',
  'created_at',
  'updated_at',
  'creator'
]);

export const sanitizeClientDataForSupabase = (
  clientData: any,
  options: { isUpdate?: boolean } = {}
): Record<string, any> => {
  if (!clientData || typeof clientData !== 'object') return {};

  const payload: Record<string, any> = {};

  if (clientData.nom !== undefined || clientData.name !== undefined) {
    payload.nom = String(clientData.nom || clientData.name || 'Client').trim();
  } else if (!options.isUpdate) {
    payload.nom = 'Client';
  }

  const numClient = clientData.numeroClient || clientData.numero_client;
  if (numClient !== undefined) {
    payload.numero_client = String(numClient).trim() || `CL-${Date.now().toString().slice(-4)}`;
  } else if (!options.isUpdate) {
    payload.numero_client = `CL-${Date.now().toString().slice(-4)}`;
  }

  if (clientData.nomFerme !== undefined || clientData.nom_ferme !== undefined) {
    payload.nom_ferme = String(clientData.nomFerme ?? clientData.nom_ferme ?? '').trim();
  }

  if (clientData.adresse !== undefined) {
    payload.adresse = String(clientData.adresse ?? '').trim();
  }

  if (clientData.ville !== undefined) {
    payload.ville = String(clientData.ville ?? '').trim();
  }

  if (clientData.codePostal !== undefined || clientData.code_postal !== undefined) {
    payload.code_postal = String(clientData.codePostal ?? clientData.code_postal ?? '').trim();
  }

  if (clientData.pays !== undefined) {
    payload.pays = String(clientData.pays ?? 'France').trim();
  } else if (!options.isUpdate) {
    payload.pays = 'France';
  }

  if (clientData.telephone !== undefined) {
    payload.telephone = String(clientData.telephone ?? '').trim();
  }

  if (clientData.email !== undefined) {
    payload.email = String(clientData.email ?? '').trim().toLowerCase();
  }

  if (clientData.contactPrincipal !== undefined || clientData.contact_principal !== undefined) {
    payload.contact_principal = clientData.contactPrincipal ?? clientData.contact_principal ?? null;
  }

  const lat = clientData.latitude ?? clientData.gpsLat;
  if (lat !== undefined) {
    payload.latitude = lat !== null && lat !== '' && !isNaN(Number(lat)) ? Number(lat) : null;
  }

  const lng = clientData.longitude ?? clientData.gpsLng;
  if (lng !== undefined) {
    payload.longitude = lng !== null && lng !== '' && !isNaN(Number(lng)) ? Number(lng) : null;
  }

  if (clientData.notes !== undefined) {
    payload.notes = String(clientData.notes ?? '').trim();
  }

  if (clientData.actif !== undefined) {
    payload.actif = Boolean(clientData.actif);
  } else if (!options.isUpdate) {
    payload.actif = true;
  }

  const potentialId = clientData.id || clientData._id;
  if (potentialId && isUuid(potentialId) && !options.isUpdate) {
    payload.id = potentialId;
  }

  if (!options.isUpdate) {
    payload.created_at = clientData.createdAt || clientData.created_at || new Date().toISOString();
  }
  payload.updated_at = new Date().toISOString();

  // Filtrer STRICTEMENT pour ne garder que les colonnes valides
  const cleanPayload: Record<string, any> = {};
  for (const [key, val] of Object.entries(payload)) {
    if (VALID_CLIENT_COLUMNS.has(key)) {
      cleanPayload[key] = val;
    }
  }

  return cleanPayload;
};

export const normalizeClient = (c: any): any => {
  if (!c) return null;
  const obj = toCamelCase(c);
  const id = obj.id || obj._id || c.id || c._id;
  return {
    ...obj,
    id,
    _id: id,
    numeroClient: obj.numeroClient || obj.numero_client || c.numero_client || '',
    nomFerme: obj.nomFerme || obj.nom_ferme || c.nom_ferme || '',
    codePostal: obj.codePostal || obj.code_postal || c.code_postal || '',
    contactPrincipal: obj.contactPrincipal || obj.contact_principal || c.contact_principal || null,
    latitude: obj.latitude ?? c.latitude ?? null,
    longitude: obj.longitude ?? c.longitude ?? null,
    actif: obj.actif !== undefined ? Boolean(obj.actif) : true
  };
};

// ==============================================================================
// SANITISATION ET NORMALISATION STRICTES MACHINES SUPABASE
// ==============================================================================
export const VALID_MACHINE_COLUMNS = new Set([
  'client_id',
  'numero_serie',
  'modele',
  'type_machine',
  'type_relation',
  'config_type',
  'pump_type',
  'v300_option',
  'custom_fields',
  'date_installation',
  'compteur',
  'latitude',
  'longitude',
  'statut',
  'actif',
  'created_at',
  'updated_at'
]);

export const sanitizeMachineDataForSupabase = (
  machineData: any,
  options: { isUpdate?: boolean } = {}
): Record<string, any> => {
  if (!machineData || typeof machineData !== 'object') return {};

  const payload: Record<string, any> = {};

  // Modèle / Nom
  const modele = machineData.modele || machineData.nom;
  if (modele !== undefined) {
    payload.modele = String(modele).trim();
  }

  // Client ID (UUID)
  const clientId = machineData.clientId || machineData.client_id;
  if (clientId !== undefined) {
    payload.client_id = clientId ? String(clientId).trim() : null;
  }

  // Numéro de série
  const numeroSerie = machineData.numeroSerie || machineData.numero_serie || machineData.serie;
  if (numeroSerie !== undefined) {
    payload.numero_serie = String(numeroSerie).trim();
  } else if (!options.isUpdate) {
    payload.numero_serie = `SN-${Date.now().toString().slice(-6)}`;
  }

  // Type de machine
  const typeMachine = machineData.typeMachine || machineData.type_machine || machineData.configType;
  if (typeMachine !== undefined) {
    payload.type_machine = typeMachine ? String(typeMachine).trim() : null;
  }

  // Type de relation
  const typeRelation = machineData.typeRelation || machineData.type_relation || machineData.relationType || machineData.relation_type;
  if (typeRelation !== undefined) {
    payload.type_relation = String(typeRelation).trim();
  } else if (!options.isUpdate) {
    payload.type_relation = 'MAITRE';
  }

  // Config Type
  const configType = machineData.configType || machineData.config_type;
  if (configType !== undefined) {
    payload.config_type = configType ? String(configType).trim() : null;
  }

  // Pump type
  const pumpType = machineData.pumpType || machineData.pump_type;
  if (pumpType !== undefined) {
    payload.pump_type = pumpType ? String(pumpType).trim() : null;
  }

  // V300 option
  const v300Option = machineData.v300Option || machineData.v300_option;
  if (v300Option !== undefined) {
    payload.v300_option = v300Option ? String(v300Option).trim() : null;
  }

  // Date installation
  const dateInst = machineData.dateInstallation || machineData.date_installation;
  if (dateInst !== undefined) {
    if (dateInst) {
      try {
        const dateObj = new Date(dateInst);
        if (!isNaN(dateObj.getTime())) {
          payload.date_installation = dateObj.toISOString().split('T')[0];
        } else {
          payload.date_installation = null;
        }
      } catch {
        payload.date_installation = null;
      }
    } else {
      payload.date_installation = null;
    }
  }

  // Compteur
  if (machineData.compteur !== undefined) {
    payload.compteur = Number(machineData.compteur) || 0;
  }

  // Latitude / Longitude
  const lat = machineData.latitude ?? machineData.gpsLat;
  if (lat !== undefined) {
    payload.latitude = lat !== null && lat !== '' && !isNaN(Number(lat)) ? Number(lat) : null;
  }

  const lng = machineData.longitude ?? machineData.gpsLng;
  if (lng !== undefined) {
    payload.longitude = lng !== null && lng !== '' && !isNaN(Number(lng)) ? Number(lng) : null;
  }

  // Statut
  if (machineData.statut !== undefined) {
    const s = String(machineData.statut).toLowerCase();
    payload.statut = ['active', 'maintenance', 'inactive'].includes(s) ? s : 'active';
  } else if (!options.isUpdate) {
    payload.statut = 'active';
  }

  // Actif
  if (machineData.actif !== undefined) {
    payload.actif = Boolean(machineData.actif);
  } else if (!options.isUpdate) {
    payload.actif = true;
  }

  // Custom fields: regrouper toutes les données additionnelles
  const existingCustom = (typeof machineData.customFields === 'object' && machineData.customFields !== null && !Array.isArray(machineData.customFields))
    ? { ...machineData.customFields }
    : {};

  if (machineData.notes !== undefined) existingCustom.notes = machineData.notes;
  if (machineData.versionNumero !== undefined || machineData.version_numero !== undefined) {
    existingCustom.versionNumero = machineData.versionNumero || machineData.version_numero;
  }
  if (machineData.relationFields !== undefined || machineData.relation_fields !== undefined) {
    existingCustom.relationFields = machineData.relationFields || machineData.relation_fields;
  }
  if (machineData.relatedMachines !== undefined || machineData.related_machines !== undefined) {
    existingCustom.relatedMachines = machineData.relatedMachines || machineData.related_machines;
  }
  if (machineData.gpsSource !== undefined || machineData.gps_source !== undefined) {
    existingCustom.gpsSource = machineData.gpsSource || machineData.gps_source;
  }
  if (machineData.extraFields !== undefined) existingCustom.extraFields = machineData.extraFields;
  if (machineData.pumpVariator !== undefined) existingCustom.pumpVariator = machineData.pumpVariator;
  if (machineData.pumpCabinet !== undefined) existingCustom.pumpCabinet = machineData.pumpCabinet;

  if (Object.keys(existingCustom).length > 0 || !options.isUpdate) {
    payload.custom_fields = existingCustom;
  }

  if (!options.isUpdate) {
    payload.created_at = machineData.createdAt || machineData.created_at || new Date().toISOString();
  }
  payload.updated_at = new Date().toISOString();

  // Filtrer STRICTEMENT pour ne garder que les colonnes valides
  const cleanPayload: Record<string, any> = {};
  for (const [key, val] of Object.entries(payload)) {
    if (VALID_MACHINE_COLUMNS.has(key)) {
      cleanPayload[key] = val;
    }
  }

  return cleanPayload;
};

export const normalizeMachine = (m: any): any => {
  if (!m) return null;
  const obj = toCamelCase(m);
  const id = obj.id || obj._id || m.id || m._id;
  const clientId = obj.clientId || obj.client_id || m.client_id || m.clientId || '';
  const nom = obj.nom || obj.modele || m.modele || m.nom || '';
  const serie = obj.numeroSerie || obj.numero_serie || obj.serie || m.numero_serie || m.serie || '';
  const typeMachine = obj.typeMachine || obj.type_machine || obj.configType || m.type_machine || m.config_type || '';
  const typeRelation = obj.typeRelation || obj.type_relation || obj.relationType || m.type_relation || 'MAITRE';
  const customFields = obj.customFields || obj.custom_fields || m.custom_fields || {};
  const notes = customFields.notes || obj.notes || m.notes || '';

  return {
    ...obj,
    id,
    _id: id,
    clientId,
    client_id: clientId,
    nom,
    modele: nom,
    serie,
    numeroSerie: serie,
    typeMachine,
    type_machine: typeMachine,
    configType: obj.configType || obj.config_type || typeMachine,
    typeRelation,
    type_relation: typeRelation,
    relationType: typeRelation,
    notes,
    customFields,
    latitude: obj.latitude ?? m.latitude ?? null,
    longitude: obj.longitude ?? m.longitude ?? null,
    statut: obj.statut || m.statut || 'active',
    actif: obj.actif !== undefined ? Boolean(obj.actif) : true
  };
};

// Mappeur de type d'intervention vers la contrainte CHECK PostgreSQL ('installation', 'mise_en_service', 'maintenance', 'depannage', 'controle')
export const mapInterventionTypeToDb = (type?: string): 'installation' | 'mise_en_service' | 'maintenance' | 'depannage' | 'controle' => {
  const t = (type || '').toLowerCase();
  if (t === 'repair' || t === 'depannage') return 'depannage';
  if (t === 'installation' || t === 'montage') return 'installation';
  if (t === 'commissioning' || t.includes('service')) return 'mise_en_service';
  if (t === 'controle') return 'controle';
  return 'maintenance';
};

// Mappeur de type d'intervention depuis PostgreSQL vers la nomenclature applicative
export const mapInterventionTypeFromDb = (type?: string): string => {
  const t = (type || '').toLowerCase();
  if (t === 'depannage') return 'REPAIR';
  if (t === 'installation') return 'INSTALLATION';
  if (t === 'mise_en_service') return 'COMMISSIONING';
  if (t === 'controle') return 'CONTROLE';
  return 'MAINTENANCE';
};

// Mappeur de statut vers la contrainte CHECK PostgreSQL ('planifiee', 'en_cours', 'terminee', 'annulee')
export const mapInterventionStatutToDb = (statut?: string): 'planifiee' | 'en_cours' | 'terminee' | 'annulee' => {
  const s = (statut || '').toLowerCase();
  if (s === 'en_cours' || s === 'in_progress') return 'en_cours';
  if (s === 'terminee' || s === 'completed' || s === 'cloturee') return 'terminee';
  if (s === 'annulee' || s === 'cancelled') return 'annulee';
  return 'planifiee';
};

// Mappeur de statut depuis PostgreSQL vers la nomenclature applicative
export const mapInterventionStatutFromDb = (statut?: string): string => {
  const s = (statut || '').toLowerCase();
  if (s === 'en_cours') return 'EN_COURS';
  if (s === 'terminee') return 'TERMINEE';
  if (s === 'annulee') return 'ANNULEE';
  return 'PLANIFIEE';
};

// Sérialiseur strict pour la table interventions de Supabase
export const sanitizeInterventionForSupabase = (
  interventionData: any,
  options: { existingRapport?: any; isUpdate?: boolean } = {}
) => {
  if (!interventionData || typeof interventionData !== 'object') return {};

  const existingRapport = options.existingRapport || {};
  const currentRapport = typeof interventionData.rapport === 'object' && interventionData.rapport !== null ? interventionData.rapport : {};

  // Vérification stricte des identifiants UUID pour éviter l'erreur Postgres "invalid input syntax for type uuid"
  const rawClientId = interventionData.clientId || interventionData.client_id;
  const clientId = isUuid(rawClientId) ? rawClientId : null;

  const rawFirstMachineId = Array.isArray(interventionData.machineIds) && interventionData.machineIds.length > 0
    ? interventionData.machineIds[0]
    : (interventionData.machineId || interventionData.machine_id);
  const machineId = isUuid(rawFirstMachineId) ? rawFirstMachineId : null;

  const rawTechId = interventionData.technicienPrincipalId || interventionData.technicienId || interventionData.technicien_principal_id;
  const technicienPrincipalId = isUuid(rawTechId) ? rawTechId : null;

  // Préservation intégrale des données riches (protocolData, kits, sections, montage, etc.) dans la colonne JSONB rapport
  const rapport = {
    ...existingRapport,
    ...currentRapport,
    protocolData: interventionData.protocolData ?? currentRapport.protocolData ?? existingRapport.protocolData ?? null,
    machines: interventionData.machines ?? currentRapport.machines ?? existingRapport.machines ?? null,
    machineIds: interventionData.machineIds ?? currentRapport.machineIds ?? existingRapport.machineIds ?? (machineId ? [machineId] : []),
    kits: interventionData.kits ?? currentRapport.kits ?? existingRapport.kits ?? null,
    selectedSections: interventionData.selectedSections ?? currentRapport.selectedSections ?? existingRapport.selectedSections ?? null,
    tachesCompletees: interventionData.tachesCompletees ?? currentRapport.tachesCompletees ?? existingRapport.tachesCompletees ?? null,
    progressionGlobale: interventionData.progressionGlobale ?? interventionData.progress ?? currentRapport.progressionGlobale ?? existingRapport.progressionGlobale ?? null,
    totalTasks: interventionData.totalTasks ?? interventionData.totalTaches ?? currentRapport.totalTasks ?? existingRapport.totalTasks ?? null,
    completedTasks: interventionData.completedTasks ?? interventionData.tachesCompleteesCount ?? currentRapport.completedTasks ?? existingRapport.completedTasks ?? null,
    montageId: interventionData.montageId ?? currentRapport.montageId ?? existingRapport.montageId ?? null,
    technicienIdOriginal: rawTechId ?? currentRapport.technicienIdOriginal ?? existingRapport.technicienIdOriginal ?? null,
    technicienNom: interventionData.technicianName ?? interventionData.technicienNom ?? currentRapport.technicienNom ?? existingRapport.technicienNom ?? null,
    clientNom: interventionData.clientNom ?? currentRapport.clientNom ?? existingRapport.clientNom ?? null,
    geolocalisation: interventionData.geolocalisation ?? currentRapport.geolocalisation ?? existingRapport.geolocalisation ?? null,
    creator: interventionData.creator ?? currentRapport.creator ?? existingRapport.creator ?? null
  };

  const payload: Record<string, any> = {
    rapport,
    updated_at: new Date().toISOString()
  };

  if (interventionData.type || interventionData.type_intervention) {
    payload.type_intervention = mapInterventionTypeToDb(interventionData.type || interventionData.type_intervention);
  } else if (!options.isUpdate) {
    payload.type_intervention = 'maintenance';
  }

  if (interventionData.statut || interventionData.status) {
    payload.statut = mapInterventionStatutToDb(interventionData.statut || interventionData.status);
  } else if (!options.isUpdate) {
    payload.statut = 'planifiee';
  }

  if (clientId !== undefined) payload.client_id = clientId;
  if (machineId !== undefined) payload.machine_id = machineId;
  if (technicienPrincipalId !== undefined) payload.technicien_principal_id = technicienPrincipalId;

  if (interventionData.numeroIntervention || interventionData.numero_intervention) {
    payload.numero_intervention = interventionData.numeroIntervention || interventionData.numero_intervention;
  }

  if (interventionData.description !== undefined || interventionData.diagnostic !== undefined) {
    payload.description = interventionData.description || interventionData.diagnostic || null;
  }

  if (interventionData.observations !== undefined || interventionData.actionsRealisees !== undefined) {
    payload.observations = interventionData.observations || interventionData.actionsRealisees || null;
  }

  if (interventionData.piecesUtilisees !== undefined || interventionData.pieces !== undefined || interventionData.pieces_utilisees !== undefined) {
    payload.pieces_utilisees = interventionData.piecesUtilisees || interventionData.pieces || interventionData.pieces_utilisees || [];
  }

  if (interventionData.dateDebut || interventionData.date_debut) {
    payload.date_debut = interventionData.dateDebut || interventionData.date_debut;
  }

  if (interventionData.dateFin || interventionData.date_fin) {
    payload.date_fin = interventionData.dateFin || interventionData.date_fin;
  }

  if (interventionData.datePrevue || interventionData.date_prevue) {
    payload.date_prevue = interventionData.datePrevue || interventionData.date_prevue;
  }

  if (interventionData.signatureClient || interventionData.signature_client) {
    payload.signature_client = interventionData.signatureClient || interventionData.signature_client;
  }

  if (interventionData.nomSignataire || interventionData.nom_signataire) {
    payload.nom_signataire = interventionData.nomSignataire || interventionData.nom_signataire;
  }

  if (interventionData.dateSignature || interventionData.date_signature) {
    payload.date_signature = interventionData.dateSignature || interventionData.date_signature;
  }

  if (interventionData.dureeMinutes !== undefined || interventionData.duree_minutes !== undefined || interventionData.tempsPasse !== undefined) {
    payload.duree_minutes = interventionData.dureeMinutes ?? interventionData.duree_minutes ?? interventionData.tempsPasse ?? null;
  }

  return payload;
};

// Désérialiseur d'intervention depuis Supabase vers les composants React
export const formatInterventionFromSupabase = (raw: any): any => {
  if (!raw) return null;
  const rapport = typeof raw.rapport === 'object' && raw.rapport !== null ? raw.rapport : {};
  const typeUpper = mapInterventionTypeFromDb(raw.type_intervention || raw.type);
  const statutUpper = mapInterventionStatutFromDb(raw.statut || raw.status);

  return {
    ...raw,
    ...rapport,
    _id: raw.id,
    id: raw.id,
    numeroIntervention: raw.numero_intervention || raw.numeroIntervention,
    type: typeUpper,
    typeIntervention: raw.type_intervention || raw.typeIntervention,
    statut: statutUpper,
    status: raw.statut || raw.status,
    clientId: raw.client_id || raw.clientId,
    clientNom: raw.client_nom || raw.clientNom || rapport.clientNom || 'Client',
    clientVille: raw.client_ville || raw.clientVille || '',
    machineId: raw.machine_id || raw.machineId,
    machineIds: rapport.machineIds || (raw.machine_id ? [raw.machine_id] : (raw.machineIds || [])),
    machineNumeroSerie: raw.machine_numero_serie || raw.machineNumeroSerie || 'N/A',
    machineModele: raw.machine_modele || raw.machineModele || 'Équipement',
    technicienPrincipalId: raw.technicien_principal_id || raw.technicienPrincipalId,
    technicienId: raw.technicien_principal_id || rapport.technicienIdOriginal || raw.technicienId || 'TECH001',
    technicienNom: raw.technicien_nom || raw.technicienNom || (rapport.technicienNom || 'Technicien'),
    technicianName: raw.technicien_nom || raw.technicienNom || (rapport.technicienNom || 'Technicien'),
    dateDebut: raw.date_debut || raw.dateDebut,
    dateFin: raw.date_fin || raw.dateFin,
    datePrevue: raw.date_prevue || raw.datePrevue,
    piecesUtilisees: raw.pieces_utilisees || raw.piecesUtilisees || [],
    protocolData: rapport.protocolData ?? raw.protocolData,
    machines: rapport.machines ?? raw.machines,
    kits: rapport.kits ?? raw.kits,
    selectedSections: rapport.selectedSections ?? raw.selectedSections,
    montageId: rapport.montageId ?? raw.montageId,
    progressionGlobale: rapport.progressionGlobale ?? raw.progressionGlobale ?? raw.progress,
    totalTasks: rapport.totalTasks ?? raw.totalTasks ?? raw.totalTaches,
    completedTasks: rapport.completedTasks ?? raw.completedTasks ?? raw.tachesCompleteesCount
  };
};

// API universelle avec bascule automatique Démo instantanée / Supabase en ligne
export const db = {
  // Utilisateurs & Gestion des accès
  users: {
    list: async (options?: any) => {
      let rawList: any[] = [];
      let supabaseSuccess = false;
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('utilisateurs')
            .select('*')
            .order('nom', { ascending: true });
          if (!error && data) {
            rawList = toCamelCase(data);
            supabaseSuccess = true;
          } else if (error) {
            console.warn('Supabase users.list a échoué:', error);
          }
        } catch (e) {
          console.warn('Exception Supabase users.list:', e);
        }
      }

      // Nettoyer toute entrée corrompue sans email valide
      rawList = rawList.filter((u: any) => u && typeof u.email === 'string' && u.email.trim().length > 0);

      if (!rawList || rawList.length === 0) {
        rawList = (demoDb.getTable('utilisateurs') || []).filter(
          (u: any) => u && typeof u.email === 'string' && u.email.trim().length > 0
        );
      } else {
        // Fusion de sécurité : intégrer les éventuels utilisateurs locaux non encore synchronisés
        try {
          const localList = demoDb.getTable('utilisateurs') || [];
          localList.forEach((localU: any) => {
            const localEmail = localU.email?.toLowerCase().trim();
            if (localEmail && !rawList.some((u: any) => u.email?.toLowerCase().trim() === localEmail)) {
              rawList.push(localU);
            }
          });
        } catch {
          // ignore
        }
      }

      // Harmonisation des utilisateurs
      const harmonized = rawList.map((u: any) => {
        const cleanRole = u.role || (Array.isArray(u.roles) && u.roles[0]) || 'TECHNICIEN_CMS';
        const cleanRoles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [cleanRole];
        return {
          ...u,
          role: cleanRole,
          roles: cleanRoles,
          numeroTechnicien: u.numeroTechnicien || u.numero_technicien || '',
          statut: u.statut || (u.actif !== false ? 'VALIDE' : 'EN_ATTENTE'),
          actif: u.statut === 'EN_ATTENTE' ? false : (u.actif !== false)
        };
      });

      // Assurer la présence constante de contact@appalacarte.fr en tant qu'administrateur de référence
      const hasAdmin = harmonized.some((u: any) => u.email?.toLowerCase() === 'contact@appalacarte.fr');
      if (!hasAdmin) {
        harmonized.unshift({
          id: 'usr-admin',
          _id: 'usr-admin',
          nom: 'CHAMPAGNE',
          prenom: 'Hervé',
          email: 'contact@appalacarte.fr',
          role: 'ADMINISTRATEUR',
          roles: ['ADMINISTRATEUR'],
          numeroTechnicien: '001',
          actif: true,
          statut: 'VALIDE',
          permissions: ['admin_access', 'manage_users', 'view_all_data']
        });
      }

      // Synchronisation du cache local pour persistance hors ligne
      if (supabaseSuccess && harmonized.length > 0) {
        try {
          demoDb.setTable('utilisateurs', harmonized);
        } catch {
          // ignore
        }
      }

      let resultList = harmonized;
      if (options?.filter && typeof options.filter === 'object') {
        resultList = resultList.filter((u: any) => {
          for (const [k, v] of Object.entries(options.filter)) {
            if (u[k] !== v) return false;
          }
          return true;
        });
      }

      // Double compatibilité : direct array et propriété .list
      const finalArray: any = [...resultList];
      finalArray.list = finalArray;
      finalArray.total = finalArray.length;
      return finalArray;
    },

    get: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('utilisateurs')
            .select('*')
            .eq('id', id)
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.findById('utilisateurs', id);
    },

    findByEmail: async (email: string) => {
      const clean = email.trim().toLowerCase();
      if (!clean) return null;
      if (clean === 'contact@appalacarte.fr') {
        const localList = demoDb.getTable('utilisateurs');
        const found = localList.find((u: any) => u.email?.toLowerCase() === clean);
        return {
          id: 'usr-admin',
          _id: 'usr-admin',
          nom: 'CHAMPAGNE',
          prenom: 'Hervé',
          email: 'contact@appalacarte.fr',
          role: 'ADMINISTRATEUR',
          roles: ['ADMINISTRATEUR'],
          numeroTechnicien: '001',
          actif: true,
          statut: 'VALIDE',
          permissions: ['admin_access', 'manage_users', 'view_all_data', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines', 'view_interventions', 'edit_interventions', 'view_spare_parts', 'edit_spare_parts'],
          ...(found || {})
        };
      }

      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('utilisateurs')
            .select('*')
            .ilike('email', clean)
            .maybeSingle();
          if (!error && data) {
            const u = toCamelCase(data);
            return {
              ...u,
              statut: u.statut || (u.actif !== false ? 'VALIDE' : 'EN_ATTENTE')
            };
          }
        } catch (e) {
          // Fallback
        }
      }

      const localList = demoDb.getTable('utilisateurs');
      const found = localList.find((u: any) => u.email?.toLowerCase() === clean);
      if (found) {
        return {
          ...found,
          statut: found.statut || (found.actif !== false ? 'VALIDE' : 'EN_ATTENTE')
        };
      }
      return null;
    },

    requestAccess: async (data: { email: string; nom: string; prenom: string; telephone?: string; role?: string; motifDemande?: string }) => {
      const cleanEmail = data.email.trim().toLowerCase();
      if (!cleanEmail) throw new Error('Adresse email obligatoire.');
      if (cleanEmail === 'contact@appalacarte.fr') {
        throw new Error('Cette adresse email correspond au compte administrateur maître.');
      }

      // Vérifier si l'utilisateur existe déjà
      const existing = await db.users.findByEmail(cleanEmail);
      if (existing) {
        if (existing.statut === 'VALIDE' || (existing.actif && existing.statut !== 'REFUSE')) {
          return {
            status: 'ALREADY_VALIDATED',
            message: 'Votre compte est déjà validé ! Vous pouvez vous connecter directement.',
            user: existing
          };
        }
        if (existing.statut === 'EN_ATTENTE') {
          return {
            status: 'PENDING',
            message: 'Une demande de connexion pour cette adresse est déjà en cours d\'examen par l\'administrateur ou le responsable technique.',
            user: existing
          };
        }
        if (existing.statut === 'REFUSE') {
          throw new Error('Une demande précédente pour cette adresse a été refusée. Veuillez contacter contact@appalacarte.fr.');
        }
      }

      const chosenRole = data.role || 'TECHNICIEN_CMS';
      const userPayload = sanitizeUserDataForSupabase({
        email: cleanEmail,
        nom: data.nom.trim(),
        prenom: data.prenom.trim(),
        telephone: data.telephone?.trim() || null,
        role: chosenRole,
        statut: 'EN_ATTENTE',
        actif: false,
        motifDemande: data.motifDemande?.trim() || null,
        dateDemande: new Date().toISOString(),
        permissions: getDefaultPermissionsForRole(chosenRole),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { excludePasswordFields: true });

      let createdSupabase: any = null;
      if (isLiveSupabaseActive()) {
        try {
          const { data: inserted, error } = await supabase
            .from('utilisateurs')
            .insert(userPayload)
            .select()
            .single();

          if (error) {
            console.warn('Erreur insertion Supabase demande accès, repli local:', error);
          } else if (inserted) {
            createdSupabase = toCamelCase(inserted);
          }
        } catch (e) {
          console.warn('Exception insertion Supabase demande accès:', e);
        }
      }

      const newId = createdSupabase?.id || 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const userRecord = {
        ...userPayload,
        id: newId,
        _id: newId,
        roles: [chosenRole],
        ...createdSupabase
      };

      demoDb.insert('utilisateurs', userRecord);

      return {
        status: 'CREATED',
        message: 'Votre demande de connexion a bien été enregistrée. Elle sera validée par l\'administrateur ou le responsable technique.',
        user: userRecord
      };
    },

    approve: async (id: string, updates?: { role?: string; numeroTechnicien?: string; permissions?: string[]; approvedBy?: string }) => {
      const payload: any = {
        statut: 'VALIDE',
        actif: true,
        validePar: updates?.approvedBy || 'Administrateur',
        valideLe: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (updates?.role) {
        payload.role = updates.role;
        payload.roles = [updates.role];
      }
      if (updates?.numeroTechnicien) {
        payload.numeroTechnicien = updates.numeroTechnicien;
      }
      if (updates?.permissions) {
        payload.permissions = updates.permissions;
      } else if (updates?.role) {
        payload.permissions = getDefaultPermissionsForRole(updates.role);
      }

      return await db.users.update(id, payload);
    },

    reject: async (id: string, reason?: string) => {
      const payload = {
        statut: 'REFUSE',
        actif: false,
        motifDemande: reason || 'Refusé par la direction technique',
        updatedAt: new Date().toISOString()
      };
      return await db.users.update(id, payload);
    },

    create: async (userData: any) => {
      // Nettoyage strict et préparation des données
      const cleanEmail = (userData.email || '').trim().toLowerCase();
      const tempPassword = userData.motDePasseTemporaire || generateTemporaryPassword(userData.prenom || 'technicien');
      const enrichedData = {
        ...userData,
        email: cleanEmail,
        motDePasseTemporaire: tempPassword,
        doitChangerMotDePasse: userData.doitChangerMotDePasse !== undefined ? userData.doitChangerMotDePasse : true,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Sauvegarde automatique et immédiate dans le stockage local (0 ms de latence, persistance garantie)
      const localResult = demoDb.insert('utilisateurs', {
        ...enrichedData,
        id: enrichedData.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      });

      let supabaseCreatedUser: any = null;

      // 2. Synchronisation automatique directe dans Supabase
      if (isLiveSupabaseActive() && cleanEmail) {
        const payloadFull = sanitizeUserDataForSupabase(enrichedData);
        try {
          const { data, error } = await supabase
            .from('utilisateurs')
            .insert(payloadFull)
            .select()
            .single();

          if (!error && data) {
            supabaseCreatedUser = toCamelCase(data);
            if (supabaseCreatedUser?.id) {
              demoDb.update('utilisateurs', localResult.id, { id: supabaseCreatedUser.id, _id: supabaseCreatedUser.id });
            }
          } else if (error) {
            console.warn('Tentative d insertion Supabase avec champs réduits:', error);
            const payloadClean = sanitizeUserDataForSupabase(enrichedData, { excludePasswordFields: true });
            const retryRes = await supabase
              .from('utilisateurs')
              .insert(payloadClean)
              .select()
              .single();

            if (!retryRes.error && retryRes.data) {
              supabaseCreatedUser = toCamelCase(retryRes.data);
              if (supabaseCreatedUser?.id) {
                demoDb.update('utilisateurs', localResult.id, { id: supabaseCreatedUser.id, _id: supabaseCreatedUser.id });
              }
            }
          }
        } catch (e: any) {
          console.warn('Exception enregistrement Supabase (données sécurisées en local):', e);
        }
      }

      return supabaseCreatedUser || localResult;
    },

    resetTemporaryPassword: async (id: string) => {
      const user = await db.users.get(id);
      if (!user) throw new Error('Utilisateur non trouvé');
      const tempPassword = generateTemporaryPassword(user.prenom || 'technicien');
      const updated = await db.users.update(id, {
        motDePasseTemporaire: tempPassword,
        doitChangerMotDePasse: true,
        updatedAt: new Date().toISOString()
      });
      return { user: updated, tempPassword };
    },

    update: async (id: string, userData: any) => {
      // 1. Sauvegarde automatique immédiate en local
      const localResult = demoDb.update('utilisateurs', id, userData);
      let supabaseUpdated: any = null;

      // 2. Synchronisation automatique dans Supabase
      if (isLiveSupabaseActive()) {
        const payloadFull = sanitizeUserDataForSupabase(userData, { isUpdate: true });
        delete payloadFull.id;

        try {
          const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
          let query = supabase.from('utilisateurs').update(payloadFull);
          if (isUuid) {
            query = query.eq('id', id);
          } else if (userData.email) {
            query = query.eq('email', String(userData.email).trim().toLowerCase());
          } else if (localResult?.email) {
            query = query.eq('email', String(localResult.email).trim().toLowerCase());
          }

          const { data, error } = await query.select().single();

          if (!error && data) {
            supabaseUpdated = toCamelCase(data);
          } else if (error) {
            const payloadClean = sanitizeUserDataForSupabase(userData, { excludePasswordFields: true, isUpdate: true });
            delete payloadClean.id;
            let retryQuery = supabase.from('utilisateurs').update(payloadClean);
            if (isUuid) retryQuery = retryQuery.eq('id', id);
            else if (localResult?.email) retryQuery = retryQuery.eq('email', String(localResult.email).trim().toLowerCase());

            const retryRes = await retryQuery.select().single();
            if (!retryRes.error && retryRes.data) {
              supabaseUpdated = toCamelCase(retryRes.data);
            }
          }
        } catch (e: any) {
          console.warn('Exception mise à jour Supabase (sauvegarde locale assurée):', e);
        }
      }

      return supabaseUpdated || localResult;
    },

    delete: async (id: string) => {
      let supabaseError: any = null;
      const targetUser = demoDb.findById('utilisateurs', id);
      if (isLiveSupabaseActive()) {
        try {
          const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
          if (isUuid) {
            const { error } = await supabase.from('utilisateurs').delete().eq('id', id);
            if (error) supabaseError = error;
          } else if (targetUser?.email) {
            const { error } = await supabase.from('utilisateurs').delete().eq('email', targetUser.email.toLowerCase().trim());
            if (error) supabaseError = error;
          }
        } catch (e: any) {
          console.error('Exception Supabase utilisateurs.delete:', e);
          supabaseError = e;
        }
      }

      const localResult = demoDb.delete('utilisateurs', id);

      if (isLiveSupabaseActive() && supabaseError) {
        const err: any = new Error(
          supabaseError.code === '42501'
            ? "La suppression dans Supabase a été bloquée par les politiques RLS (erreur 42501). Veuillez exécuter le script SQL de déblocage Supabase."
            : `Erreur suppression Supabase : ${supabaseError.message || supabaseError.code}`
        );
        err.code = supabaseError.code;
        err.supabaseError = supabaseError;
        throw err;
      }

      return localResult;
    }
  },

  // Clients
  clients: {
    list: async (options: any = {}) => {
      if (isLiveSupabaseActive()) {
        try {
          let query = supabase
            .from('clients')
            .select('*', { count: 'exact' });

          if (options.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              if (value === undefined || value === null || value === '') return;
              if (key === '_id' || key === 'id') {
                query = query.eq('id', value);
              } else if (key === 'numeroClient' || key === 'numero_client') {
                query = query.eq('numero_client', value);
              } else if (key === 'nom') {
                query = query.ilike('nom', `%${value}%`);
              } else if (Array.isArray(value)) {
                query = query.in(toSnakeCase(key), value);
              } else {
                query = query.eq(toSnakeCase(key), value);
              }
            });
          }

          if (options.sort) {
            Object.entries(options.sort).forEach(([key, value]) => {
              const col = key === '_id' ? 'id' : toSnakeCase(key);
              query = query.order(col, { ascending: value === 1 });
            });
          } else {
            query = query.order('nom', { ascending: true });
          }

          if (options.limit) {
            query = query.limit(options.limit);
          }

          const { data, error, count } = await query;
          if (!error && data) {
            const list = data.map(normalizeClient);
            Object.defineProperty(list, 'list', { value: list, enumerable: false });
            Object.defineProperty(list, 'count', { value: count ?? list.length, enumerable: false });
            return list;
          }
          if (error) {
            console.error('❌ Erreur Supabase clients.list:', error);
          }
        } catch (e) {
          console.error('❌ Exception Supabase clients.list:', e);
        }
      }
      let rawList = demoDb.getTable('clients').map(normalizeClient);
      if (options.filter?._id || options.filter?.id) {
        const targetId = options.filter._id || options.filter.id;
        rawList = rawList.filter((c: any) => c.id === targetId || c._id === targetId);
      }
      Object.defineProperty(rawList, 'list', { value: rawList, enumerable: false });
      Object.defineProperty(rawList, 'count', { value: rawList.length, enumerable: false });
      return rawList;
    },

    get: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();
          if (!error && data) {
            return normalizeClient(data);
          }
          if (error && error.code !== 'PGRST116') {
            console.error('❌ Erreur Supabase clients.get:', error);
          }
        } catch (e) {
          console.error('❌ Exception Supabase clients.get:', e);
        }
      }
      const raw = demoDb.findById('clients', id) || demoDb.getTable('clients').find((c: any) => c.id === id || c._id === id);
      return normalizeClient(raw);
    },

    create: async (clientData: any) => {
      if (isLiveSupabaseActive()) {
        const payload = sanitizeClientDataForSupabase(clientData, { isUpdate: false });
        let { data, error } = await supabase.from('clients').insert(payload).select().single();

        // Gestion de conflit d'unicité sur numero_client
        if (error && error.code === '23505') {
          payload.numero_client = `${payload.numero_client}-${Date.now().toString().slice(-4)}`;
          const retry = await supabase.from('clients').insert(payload).select().single();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          console.error('❌ Erreur Supabase clients.create:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur clients : exécutez le script SQL de déblocage via le bouton 'Copier script SQL Déblocage RLS'.`);
          }
          throw new Error(`Supabase (clients): ${error.message} (${error.code || 'code'})`);
        }
        if (data) {
          const normalized = normalizeClient(data);
          try { demoDb.insert('clients', normalized); } catch {}
          return normalized;
        }
      }
      return normalizeClient(demoDb.insert('clients', clientData));
    },

    update: async (id: string, clientData: any) => {
      if (isLiveSupabaseActive()) {
        const payload = sanitizeClientDataForSupabase(clientData, { isUpdate: true });
        const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select().single();
        if (error) {
          console.error('❌ Erreur Supabase clients.update:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur clients : exécutez le script SQL de déblocage via le bouton 'Copier script SQL Déblocage RLS'.`);
          }
          throw new Error(`Supabase (clients): ${error.message} (${error.code || 'code'})`);
        }
        if (data) {
          const normalized = normalizeClient(data);
          try { demoDb.update('clients', id, normalized); } catch {}
          return normalized;
        }
      }
      return normalizeClient(demoDb.update('clients', id, clientData));
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) {
          console.error('❌ Erreur Supabase clients.delete:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur clients : exécutez le script SQL de déblocage.`);
          }
          throw new Error(`Supabase (clients): ${error.message}`);
        }
      }
      return demoDb.delete('clients', id);
    }
  },

  // Machines
  machines: {
    list: async (options: any = {}) => {
      if (isLiveSupabaseActive()) {
        try {
          let query = supabase.from('machines').select('*', { count: 'exact' });
          if (options.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              if (value === undefined || value === null || value === '') return;
              if (key === 'clientId' || key === 'client_id') {
                query = query.eq('client_id', value);
              } else if (key === '_id' || key === 'id') {
                query = query.eq('id', value);
              } else if (Array.isArray(value)) {
                query = query.in(toSnakeCase(key), value);
              } else {
                query = query.eq(toSnakeCase(key), value);
              }
            });
          }
          if (options.sort) {
            Object.entries(options.sort).forEach(([key, value]) => {
              const col = key === '_id' ? 'id' : (key === 'clientId' ? 'client_id' : toSnakeCase(key));
              query = query.order(col, { ascending: value === 1 });
            });
          } else {
            query = query.order('created_at', { ascending: false });
          }
          if (options.limit) query = query.limit(options.limit);
          const { data, error, count } = await query;
          if (!error && data) {
            const list = data.map(normalizeMachine);
            Object.defineProperty(list, 'list', { value: list, enumerable: false });
            Object.defineProperty(list, 'count', { value: count ?? list.length, enumerable: false });
            return list;
          }
          if (error) {
            console.error('❌ Erreur Supabase machines.list:', error);
          }
        } catch (e) {
          console.error('❌ Exception Supabase machines.list:', e);
        }
      }
      let list = demoDb.getTable('machines').map(normalizeMachine);
      if (options.filter?.clientId || options.filter?.client_id) {
        const cId = options.filter.clientId || options.filter.client_id;
        list = list.filter((m: any) => m.clientId === cId || m.client_id === cId);
      }
      Object.defineProperty(list, 'list', { value: list, enumerable: false });
      Object.defineProperty(list, 'count', { value: list.length, enumerable: false });
      return list;
    },

    getByClient: async (clientId: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('machines')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
          if (!error && data) {
            return data.map(normalizeMachine);
          }
          if (error) {
            console.error('❌ Erreur Supabase machines.getByClient:', error);
          }
        } catch (e) {
          console.error('❌ Exception Supabase machines.getByClient:', e);
        }
      }
      return demoDb.getTable('machines')
        .filter((m: any) => m.clientId === clientId || m.client_id === clientId)
        .map(normalizeMachine);
    },

    get: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('machines')
            .select('*')
            .eq('id', id)
            .single();
          if (!error && data) {
            return normalizeMachine(data);
          }
          if (error && error.code !== 'PGRST116') {
            console.error('❌ Erreur Supabase machines.get:', error);
          }
        } catch (e) {
          console.error('❌ Exception Supabase machines.get:', e);
        }
      }
      const raw = demoDb.findById('machines', id) || demoDb.getTable('machines').find((m: any) => m.id === id || m._id === id);
      return normalizeMachine(raw);
    },

    create: async (machineData: any) => {
      if (isLiveSupabaseActive()) {
        const payload = sanitizeMachineDataForSupabase(machineData, { isUpdate: false });
        let { data, error } = await supabase.from('machines').insert(payload).select().single();

        // Gestion de conflit d'unicité sur numero_serie
        if (error && error.code === '23505') {
          payload.numero_serie = `${payload.numero_serie}-${Date.now().toString().slice(-4)}`;
          const retry = await supabase.from('machines').insert(payload).select().single();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          console.error('❌ Erreur Supabase machines.create:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur machines : exécutez le script SQL de déblocage via le bouton 'Copier script SQL Déblocage RLS'.`);
          }
          throw new Error(`Supabase (machines): ${error.message} (${error.code || 'code'})`);
        }
        if (data) {
          const normalized = normalizeMachine(data);
          try { demoDb.insert('machines', normalized); } catch {}
          return normalized;
        }
      }
      return normalizeMachine(demoDb.insert('machines', machineData));
    },

    update: async (id: string, machineData: any) => {
      if (isLiveSupabaseActive()) {
        const payload = sanitizeMachineDataForSupabase(machineData, { isUpdate: true });
        const { data, error } = await supabase.from('machines').update(payload).eq('id', id).select().single();
        if (error) {
          console.error('❌ Erreur Supabase machines.update:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur machines : exécutez le script SQL de déblocage.`);
          }
          throw new Error(`Supabase (machines): ${error.message} (${error.code || 'code'})`);
        }
        if (data) {
          const normalized = normalizeMachine(data);
          try { demoDb.update('machines', id, normalized); } catch {}
          return normalized;
        }
      }
      return normalizeMachine(demoDb.update('machines', id, machineData));
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        const { error } = await supabase.from('machines').delete().eq('id', id);
        if (error) {
          console.error('❌ Erreur Supabase machines.delete:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur machines : exécutez le script SQL de déblocage.`);
          }
          throw new Error(`Supabase (machines): ${error.message}`);
        }
      }
      return demoDb.delete('machines', id);
    }
  },

  // Interventions (Dépannages, Entretiens, Montages, Mises en service)
  interventions: {
    list: async (options?: any) => {
      let list: any[] = [];
      let loadedFromSupabase = false;

      if (isLiveSupabaseActive()) {
        try {
          // Utilise en priorité la vue détaillée SQL si disponible, sinon la table interventions
          let query = supabase.from('v_interventions_details').select('*');
          if (options?.limit) query = query.limit(options.limit);
          const { data, error } = await query.order('created_at', { ascending: false });

          if (!error && Array.isArray(data)) {
            list = data.map(formatInterventionFromSupabase);
            loadedFromSupabase = true;
          } else if (error) {
            console.warn('Requête v_interventions_details en erreur, tentative directe sur table interventions:', error.message);
            const { data: directData, error: directErr } = await supabase
              .from('interventions')
              .select('*')
              .order('created_at', { ascending: false });
            if (!directErr && Array.isArray(directData)) {
              list = directData.map(formatInterventionFromSupabase);
              loadedFromSupabase = true;
            }
          }
        } catch (e) {
          console.warn('Exception interventions.list Supabase:', e);
        }
      }

      // Si Supabase a répondu avec des données, synchroniser demoDb
      if (loadedFromSupabase && list.length > 0) {
        try {
          list.forEach((item: any) => {
            const existing = demoDb.findById('interventions', item.id);
            if (!existing) {
              demoDb.insert('interventions', item);
            }
          });
        } catch {
          // ignore
        }
        return list;
      }

      // Repli sur le stockage local (demoDb) si Supabase vide ou hors ligne
      const raw = demoDb.getTable('interventions') || [];
      return raw.map((i: any) => {
        const client = demoDb.findById('clients', i.clientId);
        const machine = demoDb.findById('machines', i.machineId);
        const tech = demoDb.findById('utilisateurs', i.technicienPrincipalId || i.technicienId);
        return {
          ...i,
          _id: i.id || i._id,
          id: i.id || i._id,
          type: i.type || mapInterventionTypeFromDb(i.type_intervention || i.typeIntervention),
          statut: i.statut || mapInterventionStatutFromDb(i.statut || i.status),
          clientNom: i.clientNom || client?.nom || 'Client',
          clientVille: i.clientVille || client?.ville || '',
          machineNumeroSerie: i.machineNumeroSerie || machine?.numeroSerie || 'N/A',
          machineModele: i.machineModele || machine?.modele || 'Équipement',
          technicienNom: i.technicienNom || (tech ? `${tech.prenom || ''} ${tech.nom || ''}`.trim() : 'Technicien')
        };
      });
    },

    get: async (id: string) => {
      if (!id) return null;

      if (isLiveSupabaseActive()) {
        try {
          if (isUuid(id)) {
            const { data, error } = await supabase
              .from('v_interventions_details')
              .select('*')
              .eq('id', id)
              .maybeSingle();
            if (!error && data) return formatInterventionFromSupabase(data);

            const { data: directData, error: directErr } = await supabase
              .from('interventions')
              .select('*')
              .eq('id', id)
              .maybeSingle();
            if (!directErr && directData) return formatInterventionFromSupabase(directData);
          } else {
            // Recherche par numero_intervention ou id texte
            const { data, error } = await supabase
              .from('v_interventions_details')
              .select('*')
              .eq('numero_intervention', id)
              .limit(1)
              .maybeSingle();
            if (!error && data) return formatInterventionFromSupabase(data);
          }
        } catch (e) {
          console.warn('Exception interventions.get Supabase:', e);
        }
      }

      const item = demoDb.findById('interventions', id) || (demoDb.getTable('interventions') || []).find((i: any) => i.numeroIntervention === id || i.numero_intervention === id);
      if (item) {
        const client = demoDb.findById('clients', item.clientId);
        const machine = demoDb.findById('machines', item.machineId);
        return {
          ...item,
          _id: item.id || item._id,
          id: item.id || item._id,
          type: item.type || mapInterventionTypeFromDb(item.type_intervention || item.typeIntervention),
          statut: item.statut || mapInterventionStatutFromDb(item.statut || item.status),
          clientNom: item.clientNom || client?.nom || 'Client',
          machineModele: item.machineModele || machine?.modele || 'Équipement'
        };
      }
      return null;
    },

    create: async (interventionData: any) => {
      console.log('🚀 [SUPABASE] Création intervention:', interventionData?.numeroIntervention, interventionData?.type);
      let createdItem: any = null;

      if (isLiveSupabaseActive()) {
        try {
          const payload = sanitizeInterventionForSupabase(interventionData);
          const { data, error } = await supabase
            .from('interventions')
            .insert(payload)
            .select()
            .single();

          if (error) {
            console.error('❌ Erreur Supabase interventions.create:', error);
          } else if (data) {
            createdItem = formatInterventionFromSupabase(data);
            console.log('✅ Intervention enregistrée avec succès dans Supabase ID:', createdItem.id);
          }
        } catch (e: any) {
          console.error('❌ Exception Supabase interventions.create:', e);
        }
      }

      // Enregistrement miroir dans le stockage local pour assurer l'accès immédiat et hors-connexion
      const localToSave = createdItem || {
        ...interventionData,
        _id: interventionData._id || interventionData.id || ('int_' + Date.now().toString(36)),
        id: interventionData._id || interventionData.id || ('int_' + Date.now().toString(36)),
        createdAt: interventionData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      demoDb.insert('interventions', localToSave);

      return createdItem || localToSave;
    },

    update: async (id: string, interventionData: any) => {
      console.log('🔄 [SUPABASE] Mise à jour intervention ID:', id);
      let updatedItem: any = null;

      if (isLiveSupabaseActive()) {
        try {
          let targetUuid: string | null = isUuid(id) ? id : null;
          let existingRapport: any = {};
          let existingType: string | undefined = undefined;

          if (targetUuid) {
            const { data: existing } = await supabase
              .from('interventions')
              .select('id, rapport, type_intervention')
              .eq('id', targetUuid)
              .maybeSingle();
            if (existing) {
              existingRapport = existing.rapport || {};
              existingType = existing.type_intervention;
            }
          } else {
            // Chercher par numero_intervention si l'id n'est pas un UUID
            const num = interventionData.numeroIntervention || interventionData.numero_intervention || id;
            const { data: existing } = await supabase
              .from('interventions')
              .select('id, rapport, type_intervention')
              .eq('numero_intervention', num)
              .maybeSingle();
            if (existing) {
              targetUuid = existing.id;
              existingRapport = existing.rapport || {};
              existingType = existing.type_intervention;
            }
          }

          if (targetUuid) {
            const payload = sanitizeInterventionForSupabase(interventionData, {
              existingRapport,
              isUpdate: true
            });
            if (!payload.type_intervention && existingType) {
              payload.type_intervention = existingType;
            }

            const { data, error } = await supabase
              .from('interventions')
              .update(payload)
              .eq('id', targetUuid)
              .select()
              .single();

            if (error) {
              console.error('❌ Erreur Supabase interventions.update:', error);
            } else if (data) {
              updatedItem = formatInterventionFromSupabase(data);
              console.log('✅ Intervention mise à jour dans Supabase ID:', targetUuid);
            }
          }
        } catch (e) {
          console.error('❌ Exception Supabase interventions.update:', e);
        }
      }

      // Mise à jour miroir dans le stockage local
      const localResult = demoDb.update('interventions', id, updatedItem || interventionData);
      return updatedItem || localResult;
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          if (isUuid(id)) {
            await supabase.from('interventions').delete().eq('id', id);
          } else {
            await supabase.from('interventions').delete().eq('numero_intervention', id);
          }
        } catch (e) {
          console.warn('Exception Supabase interventions.delete:', e);
        }
      }
      return demoDb.delete('interventions', id);
    }
  },

  // Installation Protocols
  installationProtocols: {
    get: async (interventionId: string) => {
      if (isLiveSupabaseActive()) {
        try {
          if (isUuid(interventionId)) {
            const { data, error } = await supabase
              .from('installation_protocols')
              .select('*')
              .eq('intervention_id', interventionId)
              .limit(1)
              .maybeSingle();
            if (!error && data) {
              const camel = toCamelCase(data);
              const points = (data.points_controle && typeof data.points_controle === 'object') ? data.points_controle : {};
              return {
                ...camel,
                ...points,
                id: data.id,
                _id: data.id,
                interventionId: data.intervention_id || interventionId
              };
            }
          }
        } catch (e) {
          console.warn('Exception installationProtocols.get:', e);
        }
      }
      const all = demoDb.getTable('installationProtocols') || [];
      return all.find((p: any) => p.interventionId === interventionId || p.id === interventionId) || null;
    },

    upsert: async (protocolData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const interId = isUuid(protocolData.interventionId) ? protocolData.interventionId : null;
          const machId = isUuid(protocolData.machineId || protocolData.machineReferenceId)
            ? (protocolData.machineId || protocolData.machineReferenceId)
            : null;

          const payload: any = {
            statut: protocolData.statut?.toLowerCase() === 'terminee' ? 'terminee' : 'en_cours',
            commentaires: protocolData.commentaires || protocolData.numeroIntervention || null,
            etapes: Array.isArray(protocolData.machines) ? protocolData.machines : (protocolData.etapes || []),
            points_controle: protocolData,
            updated_at: new Date().toISOString()
          };
          if (interId) payload.intervention_id = interId;
          if (machId) payload.machine_id = machId;

          let resData: any = null;
          if (interId) {
            const { data: existing } = await supabase
              .from('installation_protocols')
              .select('id')
              .eq('intervention_id', interId)
              .limit(1)
              .maybeSingle();
            if (existing) {
              const { data, error } = await supabase
                .from('installation_protocols')
                .update(payload)
                .eq('id', existing.id)
                .select()
                .single();
              if (!error && data) resData = data;
            }
          }

          if (!resData) {
            const { data, error } = await supabase
              .from('installation_protocols')
              .insert(payload)
              .select()
              .single();
            if (!error && data) resData = data;
          }

          if (resData) {
            const camel = toCamelCase(resData);
            return { ...camel, ...protocolData, id: resData.id, _id: resData.id };
          }
        } catch (e) {
          console.warn('Exception installationProtocols.upsert:', e);
        }
      }
      const existing = (demoDb.getTable('installationProtocols') || []).find((p: any) => p.interventionId === protocolData.interventionId);
      if (existing) {
        return demoDb.update('installationProtocols', existing.id, protocolData);
      }
      return demoDb.insert('installationProtocols', protocolData);
    }
  },

  // Montages & Protocoles de montage avec calcul des heures
  montages: {
    list: async (options?: any) => {
      let supabaseMontages: any[] = [];
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('installation_protocols')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data) && data.length > 0) {
            supabaseMontages = data.map((item: any) => {
              const pts = (item.points_controle && typeof item.points_controle === 'object') ? item.points_controle : {};
              const generatedId = pts.montageId || pts.id || pts._id || item.id;
              return {
                ...toCamelCase(item),
                ...pts,
                _id: generatedId,
                id: generatedId,
                protocolDbId: item.id,
                interventionId: item.intervention_id || pts.interventionId
              };
            });
          }
        } catch (e) {
          console.warn('Erreur Supabase montages.list:', e);
        }
      }

      // Fusion avec demoDb
      const local = demoDb.getTable('montages') || [];
      if (supabaseMontages.length > 0) {
        const ids = new Set(supabaseMontages.map(m => m.id || m._id));
        const merged = [...supabaseMontages];
        local.forEach((loc: any) => {
          if (!ids.has(loc.id) && !ids.has(loc._id)) {
            merged.push(loc);
          }
        });
        return merged;
      }
      return local;
    },

    get: async (id: string) => {
      if (!id) return null;
      if (isLiveSupabaseActive()) {
        try {
          // 1. Chercher dans installation_protocols
          if (isUuid(id)) {
            const { data, error } = await supabase
              .from('installation_protocols')
              .select('*')
              .or(`id.eq.${id},intervention_id.eq.${id}`)
              .limit(1)
              .maybeSingle();
            if (!error && data) {
              const pts = (data.points_controle && typeof data.points_controle === 'object') ? data.points_controle : {};
              const genId = pts.montageId || pts.id || pts._id || data.id;
              return {
                ...toCamelCase(data),
                ...pts,
                _id: genId,
                id: genId,
                protocolDbId: data.id,
                interventionId: data.intervention_id || pts.interventionId
              };
            }
          }

          // 2. Chercher dans installation_protocols par liste globale (points_controle->montageId)
          const { data: allProtocols } = await supabase
            .from('installation_protocols')
            .select('*')
            .order('created_at', { ascending: false });

          if (Array.isArray(allProtocols)) {
            const match = allProtocols.find((r: any) => {
              const pts = r.points_controle || {};
              return r.id === id || r.intervention_id === id || pts.montageId === id || pts.id === id || pts._id === id;
            });
            if (match) {
              const pts = match.points_controle || {};
              const genId = pts.montageId || pts.id || pts._id || match.id;
              return {
                ...toCamelCase(match),
                ...pts,
                _id: genId,
                id: genId,
                protocolDbId: match.id,
                interventionId: match.intervention_id || pts.interventionId
              };
            }
          }

          // 3. Chercher dans interventions si le montage y est rattaché
          if (isUuid(id)) {
            const inter = await db.interventions.get(id);
            if (inter?.montageId) {
              return db.montages.get(inter.montageId);
            }
            if (inter?.machines && Array.isArray(inter.machines)) {
              return {
                _id: inter.id,
                id: inter.id,
                interventionId: inter.id,
                numeroIntervention: inter.numeroIntervention,
                clientId: inter.clientId,
                machines: inter.machines,
                statut: inter.statut,
                totalHeures: inter.totalHeures || 0
              };
            }
          }
        } catch (e) {
          console.warn('Erreur Supabase montages.get:', e);
        }
      }

      const all = demoDb.getTable('montages') || [];
      return all.find((m: any) => m.id === id || m._id === id || m.interventionId === id || m.montageId === id) || null;
    },

    create: async (montageData: any) => {
      const generatedId = montageData._id || montageData.id || ('mnt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7));
      const fullMontage = {
        ...montageData,
        _id: generatedId,
        id: generatedId,
        montageId: generatedId,
        createdAt: montageData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isLiveSupabaseActive()) {
        try {
          const interId = isUuid(fullMontage.interventionId) ? fullMontage.interventionId : null;
          const machId = isUuid(fullMontage.machineReferenceId || fullMontage.machineId)
            ? (fullMontage.machineReferenceId || fullMontage.machineId)
            : null;

          const supabasePayload: any = {
            statut: fullMontage.statut === 'TERMINEE' ? 'terminee' : 'en_cours',
            commentaires: fullMontage.numeroIntervention || 'Protocole de montage',
            etapes: Array.isArray(fullMontage.machines) ? fullMontage.machines : [],
            points_controle: fullMontage,
            updated_at: new Date().toISOString()
          };
          if (interId) supabasePayload.intervention_id = interId;
          if (machId) supabasePayload.machine_id = machId;

          const { data, error } = await supabase
            .from('installation_protocols')
            .insert(supabasePayload)
            .select()
            .single();

          if (!error && data) {
            console.log('✅ Montage enregistré avec succès dans Supabase (installation_protocols)');
          } else if (error) {
            console.error('❌ Erreur Supabase montages.create:', error);
          }

          // Si une intervention est liée, mettre à jour son rapport avec le montageId et les machines
          if (interId) {
            await db.interventions.update(interId, {
              montageId: generatedId,
              machines: fullMontage.machines,
              statut: fullMontage.statut || 'EN_COURS'
            });
          }
        } catch (e) {
          console.warn('Exception Supabase montages.create:', e);
        }
      }

      demoDb.insert('montages', fullMontage);
      return fullMontage;
    },

    update: async (id: string, updates: any) => {
      const all = demoDb.getTable('montages') || [];
      const existing = demoDb.findById('montages', id) || all.find((m: any) => m.id === id || m._id === id || m.interventionId === id || m.montageId === id);
      const updatedMontage = {
        ...(existing || {}),
        ...updates,
        _id: existing?._id || id,
        id: existing?.id || id,
        montageId: existing?.montageId || id,
        updatedAt: new Date().toISOString()
      };

      if (isLiveSupabaseActive()) {
        try {
          const updatePayload: any = {
            statut: updatedMontage.statut === 'TERMINEE' ? 'terminee' : 'en_cours',
            commentaires: updatedMontage.numeroIntervention || null,
            etapes: Array.isArray(updatedMontage.machines) ? updatedMontage.machines : [],
            points_controle: updatedMontage,
            updated_at: new Date().toISOString()
          };

          if (isUuid(id)) {
            await supabase
              .from('installation_protocols')
              .update(updatePayload)
              .or(`id.eq.${id},intervention_id.eq.${id}`);
          } else {
            // Trouver la ligne correspondante
            const { data: rows } = await supabase.from('installation_protocols').select('id, points_controle');
            if (Array.isArray(rows)) {
              const matchedRow = rows.find(r => r.points_controle?.montageId === id || r.points_controle?.id === id || r.id === id);
              if (matchedRow) {
                await supabase.from('installation_protocols').update(updatePayload).eq('id', matchedRow.id);
              }
            }
          }

          // Mise à jour de l'intervention liée si présente
          const targetInterId = updatedMontage.interventionId;
          if (targetInterId && isUuid(targetInterId)) {
            await db.interventions.update(targetInterId, {
              montageId: updatedMontage.montageId || id,
              machines: updatedMontage.machines,
              statut: updatedMontage.statut,
              totalHeures: updatedMontage.totalHeures
            });
          }
        } catch (e) {
          console.warn('Erreur Supabase montages.update:', e);
        }
      }

      if (existing) {
        return demoDb.update('montages', existing.id || existing._id, updatedMontage);
      } else {
        return demoDb.insert('montages', updatedMontage);
      }
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          if (isUuid(id)) {
            await supabase.from('installation_protocols').delete().or(`id.eq.${id},intervention_id.eq.${id}`);
          } else {
            const { data: rows } = await supabase.from('installation_protocols').select('id, points_controle');
            if (Array.isArray(rows)) {
              const matched = rows.find(r => r.points_controle?.montageId === id || r.points_controle?.id === id);
              if (matched) {
                await supabase.from('installation_protocols').delete().eq('id', matched.id);
              }
            }
          }
        } catch (e) {
          console.warn('Erreur Supabase montages.delete:', e);
        }
      }
      return demoDb.delete('montages', id);
    }
  },

  // Commissioning Protocols (Protocoles de mise en service)
  commissioningProtocols: {
    get: async (interventionId: string) => {
      if (isLiveSupabaseActive()) {
        try {
          if (isUuid(interventionId)) {
            const { data, error } = await supabase
              .from('commissioning_protocols')
              .select('*')
              .eq('intervention_id', interventionId)
              .limit(1)
              .maybeSingle();

            if (!error && data) {
              const mesures = (data.mesures && typeof data.mesures === 'object') ? data.mesures : {};
              return {
                ...toCamelCase(data),
                ...mesures,
                id: data.id,
                _id: data.id,
                interventionId: data.intervention_id || interventionId,
                session: mesures.session || {},
                verifications: mesures.verifications || {},
                progress: mesures.progress || { total: 0, completed: 0 },
                status: data.statut === 'terminee' ? 'completed' : 'in_progress',
                statut: data.statut === 'terminee' ? 'TERMINEE' : 'EN_COURS'
              };
            }
          }
        } catch (e) {
          console.warn('Exception commissioningProtocols.get:', e);
        }
      }
      const all = demoDb.getTable('commissioningProtocols') || [];
      return all.find((p: any) => p.interventionId === interventionId || p.id === interventionId) || null;
    },

    upsert: async (protocolData: any) => {
      console.log('🚀 [SUPABASE] Enregistrement protocole mise en service:', protocolData?.interventionId);
      const isCompleted = protocolData.status === 'completed' || protocolData.statut === 'TERMINEE' || protocolData.statut === 'terminee';

      if (isLiveSupabaseActive()) {
        try {
          const interId = isUuid(protocolData.interventionId) ? protocolData.interventionId : null;
          const machId = isUuid(protocolData.machineId) ? protocolData.machineId : null;

          const verifs = protocolData.verifications || {};
          const testsEffectues = protocolData.testsEffectues || Object.values(verifs).flat();

          const payload: any = {
            statut: isCompleted ? 'terminee' : 'en_cours',
            conforme: protocolData.conforme !== undefined ? Boolean(protocolData.conforme) : true,
            tests_effectues: Array.isArray(testsEffectues) ? testsEffectues : [],
            mesures: {
              session: protocolData.session || {},
              verifications: protocolData.verifications || {},
              progress: protocolData.progress || {}
            },
            reserves: protocolData.reserves || null,
            updated_at: new Date().toISOString()
          };
          if (interId) payload.intervention_id = interId;
          if (machId) payload.machine_id = machId;

          let resData: any = null;
          if (interId) {
            const { data: existing } = await supabase
              .from('commissioning_protocols')
              .select('id')
              .eq('intervention_id', interId)
              .limit(1)
              .maybeSingle();

            if (existing) {
              const { data, error } = await supabase
                .from('commissioning_protocols')
                .update(payload)
                .eq('id', existing.id)
                .select()
                .single();
              if (!error && data) resData = data;
              else if (error) console.error('❌ Erreur Supabase commissioning update:', error);
            }
          }

          if (!resData) {
            const { data, error } = await supabase
              .from('commissioning_protocols')
              .insert(payload)
              .select()
              .single();
            if (!error && data) resData = data;
            else if (error) console.error('❌ Erreur Supabase commissioning insert:', error);
          }

          if (resData) {
            console.log('✅ Protocole mise en service enregistré avec succès dans Supabase ID:', resData.id);
          }

          // Mise à jour de l'intervention liée pour préserver son protocolData dans rapport
          if (interId) {
            await db.interventions.update(interId, {
              protocolData,
              statut: isCompleted ? 'TERMINEE' : 'EN_COURS',
              dateFin: isCompleted ? new Date().toISOString() : undefined
            });
          }
        } catch (e) {
          console.error('❌ Exception Supabase commissioningProtocols.upsert:', e);
        }
      }

      const existing = (demoDb.getTable('commissioningProtocols') || []).find((p: any) => p.interventionId === protocolData.interventionId);
      if (existing) {
        return demoDb.update('commissioningProtocols', existing.id, protocolData);
      }
      return demoDb.insert('commissioningProtocols', protocolData);
    }
  },

  // Spare Parts
  spareParts: {
    list: async () => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('spare_parts')
            .select('*')
            .order('designation', { ascending: true });
          if (!error && data) {
            return toCamelCase(data).map((p: any) => ({
              ...p,
              stock: p.stockActuel ?? p.stock ?? 0,
              stockActuel: p.stockActuel ?? p.stock ?? 0,
              seuilAlerte: p.stockMinimum ?? p.seuilAlerte ?? 5,
              stockMinimum: p.stockMinimum ?? p.seuilAlerte ?? 5,
              prixUnitaire: p.prixUnitaire ?? p.prix_unitaire ?? 0
            }));
          }
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.getTable('spareParts');
    },

    get: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('spare_parts').select('*').eq('id', id).single();
          if (!error && data) {
            const p = toCamelCase(data);
            return {
              ...p,
              stock: p.stockActuel ?? p.stock ?? 0,
              stockActuel: p.stockActuel ?? p.stock ?? 0,
              seuilAlerte: p.stockMinimum ?? p.seuilAlerte ?? 5,
              stockMinimum: p.stockMinimum ?? p.seuilAlerte ?? 5,
              prixUnitaire: p.prixUnitaire ?? p.prix_unitaire ?? 0
            };
          }
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.findById('spareParts', id);
    },

    create: async (partData: any) => {
      if (isLiveSupabaseActive()) {
        const payload: any = {
          reference: String(partData.reference || '').trim(),
          designation: String(partData.designation || '').trim(),
          prix_unitaire: parseFloat(partData.prixUnitaire ?? partData.prix_unitaire ?? 0) || 0,
          stock_actuel: parseInt(partData.stockActuel ?? partData.stock ?? partData.stock_actuel ?? 0, 10) || 0,
          stock_minimum: parseInt(partData.stockMinimum ?? partData.seuilAlerte ?? partData.stock_minimum ?? 5, 10) || 5,
          categorie: partData.categorie || null,
          famille: partData.famille || null,
          emplacement: partData.emplacement || null,
          fournisseur: partData.fournisseur || null,
          actif: partData.actif !== undefined ? Boolean(partData.actif) : true,
          created_at: partData.createdAt || partData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase.from('spare_parts').insert(payload).select().single();
        if (error) {
          console.error('❌ Erreur Supabase spare_parts.create:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur spare_parts : exécutez le script SQL de déblocage via le bouton 'Copier script SQL Déblocage RLS'.`);
          }
          throw new Error(`Supabase (spare_parts): ${error.message} (${error.code || 'code'})`);
        }
        if (data) {
          const res = toCamelCase(data);
          return {
            ...res,
            stock: res.stockActuel ?? res.stock ?? 0,
            stockActuel: res.stockActuel ?? res.stock ?? 0,
            seuilAlerte: res.stockMinimum ?? res.seuilAlerte ?? 5,
            stockMinimum: res.stockMinimum ?? res.seuilAlerte ?? 5
          };
        }
      }
      return demoDb.insert('spareParts', partData);
    },

    update: async (id: string, partData: any) => {
      if (isLiveSupabaseActive()) {
        const payload: any = {};
        if (partData.reference !== undefined) payload.reference = String(partData.reference).trim();
        if (partData.designation !== undefined) payload.designation = String(partData.designation).trim();
        if (partData.prixUnitaire !== undefined || partData.prix_unitaire !== undefined) {
          payload.prix_unitaire = parseFloat(partData.prixUnitaire ?? partData.prix_unitaire ?? 0) || 0;
        }
        if (partData.stockActuel !== undefined || partData.stock !== undefined || partData.stock_actuel !== undefined) {
          payload.stock_actuel = parseInt(partData.stockActuel ?? partData.stock ?? partData.stock_actuel ?? 0, 10) || 0;
        }
        if (partData.stockMinimum !== undefined || partData.seuilAlerte !== undefined || partData.stock_minimum !== undefined) {
          payload.stock_minimum = parseInt(partData.stockMinimum ?? partData.seuilAlerte ?? partData.stock_minimum ?? 5, 10) || 5;
        }
        if (partData.categorie !== undefined) payload.categorie = partData.categorie;
        if (partData.famille !== undefined) payload.famille = partData.famille;
        if (partData.emplacement !== undefined) payload.emplacement = partData.emplacement;
        if (partData.fournisseur !== undefined) payload.fournisseur = partData.fournisseur;
        if (partData.actif !== undefined) payload.actif = Boolean(partData.actif);
        payload.updated_at = new Date().toISOString();

        const { data, error } = await supabase.from('spare_parts').update(payload).eq('id', id).select().single();
        if (error) {
          console.error('❌ Erreur Supabase spare_parts.update:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur spare_parts : exécutez le script SQL de déblocage.`);
          }
          throw new Error(`Supabase (spare_parts): ${error.message} (${error.code || 'code'})`);
        }
        if (data) {
          const res = toCamelCase(data);
          return {
            ...res,
            stock: res.stockActuel ?? res.stock ?? 0,
            stockActuel: res.stockActuel ?? res.stock ?? 0,
            seuilAlerte: res.stockMinimum ?? res.seuilAlerte ?? 5,
            stockMinimum: res.stockMinimum ?? res.seuilAlerte ?? 5
          };
        }
      }
      return demoDb.update('spareParts', id, partData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        const { error } = await supabase.from('spare_parts').delete().eq('id', id);
        if (error) {
          console.error('❌ Erreur Supabase spare_parts.delete:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur spare_parts : exécutez le script SQL de déblocage.`);
          }
          throw new Error(`Supabase (spare_parts): ${error.message}`);
        }
      }
      return demoDb.delete('spareParts', id);
    }
  },

  // Error Codes
  errorCodes: {
    list: async () => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('error_codes').select('*').order('alarme', { ascending: true });
          if (!error && data) {
            const list = toCamelCase(data).map((item: any) => {
              let alarme = item.alarme || item.code || '';
              let titre = item.titre || item.title || '';
              if (titre === 'Code erreur') titre = '';
              let cause = item.cause || '';
              let action = item.action || '';
              let typeAlarme = item.typeAlarme || item.type_alarme || '';
              const raw = item.chapitre || item.description || '';

              if ((!alarme || !titre || !cause) && raw) {
                const clean = raw.replace(/^\[Chapitre:\s*/, '').replace(/\]$/, '');
                const parts = clean.split(',');
                if (parts.length >= 2) {
                  const p1 = parts[1].trim();
                  if (p1.includes('|')) {
                    const sub = p1.split('|');
                    if (!alarme) alarme = sub[0].trim();
                    if (!titre) titre = sub.slice(1).join('|').trim();
                  } else if (!alarme) {
                    alarme = p1;
                  }
                }
                if (!typeAlarme && parts.length >= 4) typeAlarme = parts[3].trim();
                if (!cause && parts.length >= 5) cause = parts[4].trim();
                if (!action && parts.length >= 6) action = parts.slice(5).join(',').trim();
              }

              return {
                ...item,
                alarme: alarme.replace(/\//g, '').trim(),
                titre: (titre || (alarme ? `Alarme ${alarme}` : 'Code erreur')).replace(/\//g, '').trim(),
                description: item.description || '',
                gravite: item.gravite || item.severity || 'mineure',
                machineType: item.machineType || item.machine_type || '',
                cause: cause.replace(/\//g, '').trim(),
                action: action.replace(/\//g, '').trim(),
                chapitre: item.chapitre || '',
                typeAlarme: typeAlarme.trim()
              };
            });
            return { list };
          }
        } catch (e) {
          // Fallback démo
        }
      }
      return { list: demoDb.getTable('errorCodes') };
    },

    search: async (query: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('error_codes')
            .select('*')
            .or(`alarme.ilike.%${query}%,titre.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(10);
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      const q = query.toLowerCase();
      return demoDb.getTable('errorCodes').filter((item: any) =>
        (item.alarme || '').toLowerCase().includes(q) ||
        (item.titre || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
      );
    },

    create: async (errorCodeData: any) => {
      if (isLiveSupabaseActive()) {
        const alarme = String(errorCodeData.alarme || errorCodeData.code || '').trim();
        const titre = String(errorCodeData.titre || errorCodeData.title || alarme || 'Code erreur').trim();
        const cause = String(errorCodeData.cause || '').trim();
        const action = String(errorCodeData.action || '').trim();
        const chapitre = String(errorCodeData.chapitre || '').trim();
        const typeAlarme = String(errorCodeData.typeAlarme || errorCodeData.type_alarme || '').trim();
        const gravite = String(errorCodeData.gravite || errorCodeData.severity || 'mineure').trim();
        const machineType = String(errorCodeData.machineType || errorCodeData.machine_type || '').trim();

        const extraDetails: string[] = [];
        if (chapitre) extraDetails.push(`[Chapitre: ${chapitre}]`);
        if (typeAlarme) extraDetails.push(`[Type: ${typeAlarme}]`);
        if (cause) extraDetails.push(`Cause: ${cause}`);
        if (action) extraDetails.push(`Action: ${action}`);
        const baseDescription = String(errorCodeData.description || '').trim();
        const richDescription = baseDescription
          ? (extraDetails.length > 0 ? `${baseDescription}\n\n${extraDetails.join('\n')}` : baseDescription)
          : (extraDetails.length > 0 ? extraDetails.join('\n') : titre);

        const fullPayload: any = {
          alarme,
          titre,
          description: richDescription || titre,
          gravite,
          machine_type: machineType,
          type_alarme: typeAlarme,
          chapitre: chapitre,
          cause: cause,
          action: action,
          actif: errorCodeData.actif !== undefined ? Boolean(errorCodeData.actif) : true,
          created_at: errorCodeData.createdAt || errorCodeData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        let { data, error } = await supabase.from('error_codes').insert(fullPayload).select().single();

        if (error && error.code === 'PGRST204') {
          const basicPayload = {
            alarme,
            titre,
            description: richDescription || titre,
            gravite,
            machine_type: machineType,
            actif: fullPayload.actif,
            created_at: fullPayload.created_at,
            updated_at: fullPayload.updated_at
          };
          const retry = await supabase.from('error_codes').insert(basicPayload).select().single();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          console.error('❌ Erreur Supabase error_codes.create:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur error_codes : exécutez le script SQL de déblocage via le bouton 'Copier script SQL Déblocage RLS'.`);
          }
          throw new Error(`Supabase (error_codes): ${error.message} (${error.code || 'code'})`);
        }
        if (data) return toCamelCase(data);
      }
      return demoDb.insert('errorCodes', errorCodeData);
    },

    update: async (id: string, errorCodeData: any) => {
      if (isLiveSupabaseActive()) {
        const payload: any = { ...toSnakeCase(errorCodeData), updated_at: new Date().toISOString() };
        delete payload.id;
        delete payload._id;

        let { data, error } = await supabase.from('error_codes').update(payload).eq('id', id).select().single();
        if (error && error.code === 'PGRST204') {
          const basicPayload: any = {};
          if (errorCodeData.alarme !== undefined) basicPayload.alarme = errorCodeData.alarme;
          if (errorCodeData.titre !== undefined) basicPayload.titre = errorCodeData.titre;
          if (errorCodeData.description !== undefined) basicPayload.description = errorCodeData.description;
          if (errorCodeData.gravite !== undefined) basicPayload.gravite = errorCodeData.gravite;
          if (errorCodeData.machineType !== undefined || errorCodeData.machine_type !== undefined) {
            basicPayload.machine_type = errorCodeData.machineType || errorCodeData.machine_type;
          }
          if (errorCodeData.actif !== undefined) basicPayload.actif = Boolean(errorCodeData.actif);
          basicPayload.updated_at = new Date().toISOString();
          const retry = await supabase.from('error_codes').update(basicPayload).eq('id', id).select().single();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          console.error('❌ Erreur Supabase error_codes.update:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur error_codes : exécutez le script SQL de déblocage.`);
          }
          throw new Error(`Supabase (error_codes): ${error.message} (${error.code || 'code'})`);
        }
        if (data) return toCamelCase(data);
      }
      return demoDb.update('errorCodes', id, errorCodeData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        const { error } = await supabase.from('error_codes').delete().eq('id', id);
        if (error) {
          console.error('❌ Erreur Supabase error_codes.delete:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur error_codes : exécutez le script SQL de déblocage.`);
          }
          throw new Error(`Supabase (error_codes): ${error.message}`);
        }
      }
      return demoDb.delete('errorCodes', id);
    }
  },

  // Machine Fields
  machineFields: {
    list: async () => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('machine_fields').select('*').order('order', { ascending: true });
          if (!error && data && data.length > 0) {
            const list = toCamelCase(data).map((f: any) => ({
              ...f,
              id: f.id || f._id,
              _id: f._id || f.id,
              label: f.label || f.name || 'Champ',
              name: f.name || f.label || 'champ',
              fieldType: f.fieldType || f.field_type || f.type || 'text',
              type: f.fieldType || f.field_type || f.type || 'text',
              machineType: f.machineType || f.machine_type || 'Tous',
              isRequired: Boolean(f.isRequired ?? f.is_required),
              isActive: f.isActive !== undefined ? Boolean(f.isActive) : (f.is_active !== undefined ? Boolean(f.is_active) : true),
              order: f.order ?? f.ordre ?? 0
            }));
            return { list };
          }
        } catch (e) {
          // Fallback démo
        }
      }
      const demoList = demoDb.getTable('machineFields').map((f: any) => ({
        ...f,
        id: f.id || f._id,
        _id: f._id || f.id,
        label: f.label || f.name || 'Champ',
        name: f.name || f.label || 'champ',
        fieldType: f.fieldType || f.field_type || f.type || 'text',
        type: f.fieldType || f.field_type || f.type || 'text',
        machineType: f.machineType || f.machine_type || 'Tous',
        isRequired: Boolean(f.isRequired ?? f.is_required),
        isActive: f.isActive !== undefined ? Boolean(f.isActive) : (f.is_active !== undefined ? Boolean(f.is_active) : true),
        order: f.order ?? f.ordre ?? 0
      }));
      return { list: demoList };
    },

    create: async (fieldData: any) => {
      if (isLiveSupabaseActive()) {
        const label = String(fieldData.label || fieldData.name || 'Nouveau champ').trim();
        const name = String(fieldData.name || label.toLowerCase().replace(/[^a-z0-9]+/g, '_') || `champ_${Date.now()}`).trim();
        const fieldType = String(fieldData.type || fieldData.fieldType || fieldData.field_type || 'text').trim();
        const machineType = String(fieldData.machineType || fieldData.machine_type || 'Tous').trim();
        const order = parseInt(fieldData.order ?? fieldData.ordre ?? 0, 10) || 0;

        const payload: any = {
          name: name,
          label: label,
          type: fieldType,
          field_type: fieldType,
          section: fieldData.section || 'general',
          machine_type: machineType,
          is_required: Boolean(fieldData.isRequired ?? fieldData.is_required),
          is_active: fieldData.isActive !== undefined ? Boolean(fieldData.isActive) : (fieldData.is_active !== undefined ? Boolean(fieldData.is_active) : true),
          order: order,
          allow_custom_value: Boolean(fieldData.allowCustomValue ?? fieldData.allow_custom_value),
          created_at: fieldData.createdAt || fieldData.created_at || new Date().toISOString()
        };
        if (fieldData.conditionalRules || fieldData.conditional_rules) {
          payload.conditional_rules = fieldData.conditionalRules || fieldData.conditional_rules;
        }

        let { data, error } = await supabase.from('machine_fields').insert(payload).select().single();
        if (error && error.code === 'PGRST204') {
          const basicPayload = {
            name: payload.name,
            label: payload.label,
            type: payload.type,
            is_required: payload.is_required,
            is_active: payload.is_active,
            order: payload.order,
            created_at: payload.created_at
          };
          const retry = await supabase.from('machine_fields').insert(basicPayload).select().single();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          console.error('❌ Erreur Supabase machine_fields.create:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur machine_fields : exécutez le script SQL de déblocage via le bouton 'Copier script SQL Déblocage RLS'.`);
          }
          throw new Error(`Supabase (machine_fields): ${error.message} (${error.code || 'code'})`);
        }
        if (data) {
          const res = toCamelCase(data);
          return {
            ...res,
            fieldType: res.type || res.fieldType || 'text',
            machineType: res.machineType || res.machine_type || 'Tous'
          };
        }
      }
      return demoDb.insert('machineFields', fieldData);
    },

    update: async (id: string, fieldData: any) => {
      if (isLiveSupabaseActive()) {
        const payload: any = {};
        if (fieldData.label !== undefined) {
          payload.label = String(fieldData.label).trim();
          if (fieldData.name === undefined) {
            payload.name = payload.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
          }
        }
        if (fieldData.name !== undefined) payload.name = String(fieldData.name).trim();
        if (fieldData.type !== undefined || fieldData.fieldType !== undefined || fieldData.field_type !== undefined) {
          payload.type = fieldData.type || fieldData.fieldType || fieldData.field_type || 'text';
          payload.field_type = payload.type;
        }
        if (fieldData.isRequired !== undefined || fieldData.is_required !== undefined) {
          payload.is_required = Boolean(fieldData.isRequired ?? fieldData.is_required);
        }
        if (fieldData.isActive !== undefined || fieldData.is_active !== undefined) {
          payload.is_active = Boolean(fieldData.isActive ?? fieldData.is_active);
        }
        if (fieldData.order !== undefined || fieldData.ordre !== undefined) {
          payload.order = parseInt(fieldData.order ?? fieldData.ordre ?? 0, 10) || 0;
        }
        if (fieldData.machineType !== undefined || fieldData.machine_type !== undefined) {
          payload.machine_type = fieldData.machineType || fieldData.machine_type;
        }
        if (fieldData.conditionalRules !== undefined || fieldData.conditional_rules !== undefined) {
          payload.conditional_rules = fieldData.conditionalRules ?? fieldData.conditional_rules;
        }
        if (fieldData.allowCustomValue !== undefined || fieldData.allow_custom_value !== undefined) {
          payload.allow_custom_value = Boolean(fieldData.allowCustomValue ?? fieldData.allow_custom_value);
        }

        let { data, error } = await supabase.from('machine_fields').update(payload).eq('id', id).select().single();
        if (error && error.code === 'PGRST204') {
          delete payload.machine_type;
          delete payload.conditional_rules;
          delete payload.allow_custom_value;
          delete payload.field_type;
          const retry = await supabase.from('machine_fields').update(payload).eq('id', id).select().single();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          console.error('❌ Erreur Supabase machine_fields.update:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur machine_fields : exécutez le script SQL de déblocage.`);
          }
          throw new Error(`Supabase (machine_fields): ${error.message} (${error.code || 'code'})`);
        }
        if (data) return toCamelCase(data);
      }
      return demoDb.update('machineFields', id, fieldData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        const { error } = await supabase.from('machine_fields').delete().eq('id', id);
        if (error) {
          console.error('❌ Erreur Supabase machine_fields.delete:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur machine_fields : exécutez le script SQL de déblocage.`);
          }
          throw new Error(`Supabase (machine_fields): ${error.message}`);
        }
      }
      return demoDb.delete('machineFields', id);
    }
  },

  // Machine Field Options
  machineFieldOptions: {
    list: async () => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('machine_field_options').select('*').order('order', { ascending: true });
          if (!error && data && data.length > 0) {
            const list = toCamelCase(data).map((o: any) => ({
              ...o,
              id: o.id || o._id,
              _id: o._id || o.id,
              fieldId: o.fieldId || o.field_id,
              value: o.value,
              label: o.label || o.value,
              order: o.order ?? 0
            }));
            return { list };
          }
        } catch (e) {
          // Fallback démo
        }
      }
      const demoList = demoDb.getTable('machineFieldOptions').map((o: any) => ({
        ...o,
        id: o.id || o._id,
        _id: o._id || o.id,
        fieldId: o.fieldId || o.field_id,
        value: o.value,
        label: o.label || o.value,
        order: o.order ?? 0
      }));
      return { list: demoList };
    },

    getByField: async (fieldId: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('machine_field_options').select('*').eq('field_id', fieldId).order('order', { ascending: true });
          if (!error && data && data.length > 0) {
            return toCamelCase(data).map((o: any) => ({
              ...o,
              id: o.id || o._id,
              _id: o._id || o.id,
              fieldId: o.fieldId || o.field_id,
              value: o.value,
              label: o.label || o.value,
              order: o.order ?? 0
            }));
          }
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.getTable('machineFieldOptions')
        .filter((o: any) => (o.fieldId === fieldId || o.field_id === fieldId))
        .map((o: any) => ({
          ...o,
          id: o.id || o._id,
          _id: o._id || o.id,
          fieldId: o.fieldId || o.field_id,
          value: o.value,
          label: o.label || o.value,
          order: o.order ?? 0
        }));
    },

    create: async (optionData: any) => {
      if (isLiveSupabaseActive()) {
        const val = String(optionData.value || optionData.label || '').trim();
        const label = String(optionData.label || val || 'Option').trim();
        const order = parseInt(optionData.order ?? optionData.ordre ?? 0, 10) || 0;
        const payload: any = {
          value: val,
          label: label,
          order: order,
          is_active: true,
          created_at: optionData.createdAt || optionData.created_at || new Date().toISOString()
        };
        const rawFieldId = optionData.fieldId || optionData.field_id;
        if (rawFieldId && typeof rawFieldId === 'string' && rawFieldId.trim() !== '') {
          payload.field_id = rawFieldId.trim();
        }

        const { data, error } = await supabase.from('machine_field_options').insert(payload).select().single();
        if (error) {
          console.error('❌ Erreur Supabase machine_field_options.create:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur machine_field_options : exécutez le script SQL de déblocage via le bouton 'Copier script SQL Déblocage RLS'.`);
          }
          if (error.code === '23503') {
            throw new Error(`Champ parent inexistant dans Supabase (clé étrangère). Veuillez d'abord créer le champ machine parent.`);
          }
          throw new Error(`Supabase (machine_field_options): ${error.message} (${error.code || 'code'})`);
        }
        if (data) return toCamelCase(data);
      }
      return demoDb.insert('machineFieldOptions', optionData);
    },

    update: async (id: string, optionData: any) => {
      if (isLiveSupabaseActive()) {
        const payload: any = {};
        if (optionData.fieldId !== undefined || optionData.field_id !== undefined) {
          payload.field_id = optionData.fieldId || optionData.field_id;
        }
        if (optionData.value !== undefined) payload.value = optionData.value;
        if (optionData.label !== undefined) payload.label = optionData.label;
        if (optionData.order !== undefined || optionData.ordre !== undefined) {
          payload.order = parseInt(optionData.order ?? optionData.ordre ?? 0, 10) || 0;
        }
        const { data, error } = await supabase.from('machine_field_options').update(payload).eq('id', id).select().single();
        if (error) {
          console.error('❌ Erreur Supabase machine_field_options.update:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur machine_field_options : exécutez le script SQL de déblocage.`);
          }
          throw new Error(`Supabase (machine_field_options): ${error.message} (${error.code || 'code'})`);
        }
        if (data) return toCamelCase(data);
      }
      return demoDb.update('machineFieldOptions', id, optionData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        const { error } = await supabase.from('machine_field_options').delete().eq('id', id);
        if (error) {
          console.error('❌ Erreur Supabase machine_field_options.delete:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur machine_field_options : exécutez le script SQL de déblocage.`);
          }
          throw new Error(`Supabase (machine_field_options): ${error.message}`);
        }
      }
      return demoDb.delete('machineFieldOptions', id);
    }
  },

  // Languages
  languages: {
    list: async () => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('languages').select('*').order('name', { ascending: true });
          if (!error && data) return { list: toCamelCase(data) };
        } catch (e) {
          // Fallback démo
        }
      }
      return { list: demoDb.getTable('languages') };
    },

    create: async (langData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('languages').insert(toSnakeCase(langData)).select().single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.insert('languages', langData);
    },

    update: async (id: string, langData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('languages').update(toSnakeCase(langData)).eq('id', id).select().single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.update('languages', id, langData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          await supabase.from('languages').delete().eq('id', id);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.delete('languages', id);
    }
  },

  // Translations
  translations: {
    list: async (options?: any) => {
      if (isLiveSupabaseActive()) {
        try {
          let query = supabase.from('translations').select('*');
          if (options?.filter?.languageCode) {
            query = query.eq('language_code', options.filter.languageCode);
          }
          const { data, error } = await query;
          if (!error && data) return { list: toCamelCase(data) };
        } catch (e) {
          // Fallback démo
        }
      }
      return { list: demoDb.getTable('translations') };
    },

    getByLanguage: async (languageCode: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('translations').select('*').eq('language_code', languageCode);
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.getTable('translations').filter((t: any) => t.languageCode === languageCode);
    },

    upsert: async (translationData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('translations').upsert(toSnakeCase(translationData), { onConflict: 'key,language_code' }).select().single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.insert('translations', translationData);
    },

    create: async (data: any) => {
      return demoDb.insert('translations', data);
    },

    update: async (id: string, data: any) => {
      return demoDb.update('translations', id, data);
    }
  },

  // Client Messages
  clientMessages: {
    list: async (clientId?: string) => {
      if (isLiveSupabaseActive()) {
        try {
          let query = supabase.from('client_messages').select('*').order('created_at', { ascending: false });
          if (clientId) query = query.eq('client_id', clientId);
          const { data, error } = await query;
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      const list = demoDb.getTable('clientMessages');
      return clientId ? list.filter((m: any) => m.clientId === clientId) : list;
    },

    create: async (messageData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('client_messages').insert(toSnakeCase(messageData)).select().single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.insert('clientMessages', messageData);
    },

    markAsRead: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('client_messages').update({ lu: true, date_lu: new Date().toISOString() }).eq('id', id).select().single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.update('clientMessages', id, { lu: true, dateLu: new Date().toISOString() });
    },

    countUnread: async (clientId?: string) => {
      if (isLiveSupabaseActive()) {
        try {
          let query = supabase.from('client_messages').select('*', { count: 'exact', head: true }).eq('lu', false);
          if (clientId) query = query.eq('client_id', clientId);
          const { count, error } = await query;
          if (!error && count !== null) return { count, error: null };
        } catch (e) {
          // Fallback démo
        }
      }
      const unread = demoDb.getTable('clientMessages').filter((m: any) => !m.lu && (!clientId || m.clientId === clientId));
      return { count: unread.length, error: null };
    }
  },

  // Tâches d'entretien
  tachesEntretien: {
    list: async (options?: { where?: any; sort?: any; limit?: number }) => {
      if (isLiveSupabaseActive()) {
        try {
          let query = supabase.from('taches_entretien').select('*');
          if (options?.where) {
            for (const [key, value] of Object.entries(options.where)) {
              const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
              if ((snakeKey === 'kit_id' || snakeKey === 'kitId') && typeof value === 'string') {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
                if (isUuid) {
                  const kitRes = await supabase.from('maintenance_kits').select('kit_id').eq('id', value).maybeSingle();
                  if (kitRes?.data?.kit_id) {
                    query = query.or(`kit_id.eq.${value},kit_id.eq.${kitRes.data.kit_id}`);
                    continue;
                  }
                }
              }
              query = query.eq(snakeKey, value);
            }
          }
          if (options?.sort) {
            const sortKey = Object.keys(options.sort)[0];
            const snakeSort = sortKey.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            query = query.order(snakeSort, { ascending: options.sort[sortKey] === 1 });
          }
          if (options?.limit) query = query.limit(options.limit);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            const list = toCamelCase(data).map((t: any) => ({
              ...t,
              idTache: t.taskId || t.task_id || t.idTache || t.id,
              taskId: t.taskId || t.task_id || t.idTache || t.id,
              kitId: t.kitId || t.kit_id || '',
              section: t.sectionTitle || t.section_title || t.section || 'Général',
              sectionTitle: t.sectionTitle || t.section_title || t.section || 'Général',
              description: t.taskLabel || t.task_label || t.description || t.titre || '',
              taskLabel: t.taskLabel || t.task_label || t.description || t.titre || '',
              ordre: t.taskOrder ?? t.task_order ?? t.ordre ?? 1,
              taskOrder: t.taskOrder ?? t.task_order ?? t.ordre ?? 1,
              machineType: t.machineType || t.machine_type || ''
            }));
            return { list };
          }
        } catch (e) {
          // Fallback démo
        }
      }
      let list = demoDb.getTable('tachesEntretien');
      if (options?.where) {
        list = list.filter((t: any) => {
          return Object.entries(options.where).every(([key, value]) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            if (snakeKey === 'kit_id' || snakeKey === 'kitId') {
              return t.kitId === value || t.kit_id === value;
            }
            if (snakeKey === 'machine_type' || snakeKey === 'machineType') {
              return (t.machineType || t.machine_type) === value;
            }
            if (snakeKey === 'service_number' || snakeKey === 'serviceNumber') {
              return Number(t.serviceNumber || t.service_number) === Number(value);
            }
            if (snakeKey === 'section') {
              return t.section === value || t.sectionTitle === value || t.section_title === value;
            }
            return t[key] === value || t[snakeKey] === value;
          });
        });
      }
      return { list };
    },

    create: async (taskData: any) => {
      if (isLiveSupabaseActive()) {
        const taskId = String(taskData.taskId || taskData.idTache || taskData.task_id || `task_${Date.now()}`).trim();
        const section = String(taskData.section || taskData.sectionTitle || taskData.section_title || 'Section générale').trim();
        const sectionId = String(taskData.sectionId || taskData.section_id || section.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'sec_defaut').trim();
        const description = String(taskData.description || taskData.taskLabel || taskData.task_label || 'Entretien').trim();
        const titre = String(taskData.titre || taskData.taskLabel || taskData.task_label || description.slice(0, 100) || 'Tâche d entretien').trim();
        const kitId = String(taskData.kitId || taskData.kit_id || '').trim();
        const order = parseInt(taskData.ordre ?? taskData.taskOrder ?? taskData.task_order ?? 1, 10) || 1;

        const payload: any = {
          task_id: taskId,
          section_id: sectionId,
          titre: titre,
          section_title: section,
          section: section,
          task_label: description,
          description: description,
          kit_id: kitId,
          machine_type: taskData.machineType || taskData.machine_type || null,
          kit_number: parseInt(taskData.kitNumber ?? taskData.kit_number ?? 0, 10) || null,
          service_number: parseInt(taskData.serviceNumber ?? taskData.service_number ?? 1, 10) || 1,
          task_order: order,
          ordre: order,
          is_critical: Boolean(taskData.isCritical ?? taskData.is_critical),
          estimated_duration: parseInt(taskData.estimatedDuration ?? taskData.estimated_duration ?? 5, 10) || 5,
          actif: taskData.actif !== undefined ? Boolean(taskData.actif) : true,
          created_at: taskData.createdAt || taskData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('taches_entretien').insert(payload).select().single();
        if (error) {
          console.error('❌ Erreur Supabase taches_entretien.create:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur taches_entretien : exécutez le script SQL de déblocage via le bouton 'Copier script SQL Déblocage RLS'.`);
          }
          throw new Error(`Supabase (taches_entretien): ${error.message} (${error.code || 'code'})`);
        }
        if (data) return toCamelCase(data);
      }
      return demoDb.insert('tachesEntretien', taskData);
    },

    update: async (id: string, taskData: any) => {
      if (isLiveSupabaseActive()) {
        const payload: any = { ...toSnakeCase(taskData), updated_at: new Date().toISOString() };
        delete payload.id;
        delete payload._id;

        const { data, error } = await supabase.from('taches_entretien').update(payload).eq('id', id).select().single();
        if (error) {
          console.error('❌ Erreur Supabase taches_entretien.update:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur taches_entretien : exécutez le script SQL de déblocage.`);
          }
          throw new Error(`Supabase (taches_entretien): ${error.message} (${error.code || 'code'})`);
        }
        if (data) return toCamelCase(data);
      }
      return demoDb.update('tachesEntretien', id, taskData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        const { error } = await supabase.from('taches_entretien').delete().eq('id', id);
        if (error) {
          console.error('❌ Erreur Supabase taches_entretien.delete:', error);
          if (error.code === '42501') {
            throw new Error(`Supabase RLS bloqué (42501) sur taches_entretien : exécutez le script SQL de déblocage.`);
          }
          throw new Error(`Supabase (taches_entretien): ${error.message}`);
        }
      }
      return demoDb.delete('tachesEntretien', id);
    }
  },

  // Kits de maintenance
  maintenance_kits: {
    list: async (options: any = {}) => {
      const filter = options.filter || options.where || {};
      if (isLiveSupabaseActive()) {
        try {
          let query = supabase.from('maintenance_kits').select('*', { count: 'exact' });
          if (filter && Object.keys(filter).length > 0) {
            Object.entries(filter).forEach(([key, value]) => {
              if (key === 'machineType' || key === 'machine_type') {
                if (value && typeof value === 'object' && '$in' in (value as any)) {
                  query = query.in('machine_type', (value as any).$in);
                } else {
                  query = query.eq('machine_type', value);
                }
              } else if (key === '_id' || key === 'id') {
                query = query.eq('id', value);
              } else if (key === 'kitId' || key === 'kit_id') {
                query = query.eq('kit_id', value);
              } else if (Array.isArray(value)) query = query.in(toSnakeCase(key), value);
              else query = query.eq(toSnakeCase(key), value);
            });
          }
          if (options.sort) {
            Object.entries(options.sort).forEach(([key, value]) => {
              query = query.order(toSnakeCase(key), { ascending: value === 1 });
            });
          } else {
            query = query.order('service_number', { ascending: true });
          }
          if (options.limit) query = query.limit(options.limit);
          const { data, error, count } = await query;
          if (!error && data) return { list: toCamelCase(data), count: count ?? data.length };
        } catch (e) {
          // Fallback démo
        }
      }
      let list = demoDb.getTable('maintenanceKits');
      if (filter && Object.keys(filter).length > 0) {
        list = list.filter((item: any) => {
          return Object.entries(filter).every(([k, v]) => {
            if (k === 'id' || k === '_id') return item.id === v || item._id === v;
            if (k === 'kitId' || k === 'kit_id') return item.kitId === v || item.kit_id === v;
            if (k === 'machineType' || k === 'machine_type') return item.machineType === v || item.machine_type === v;
            return item[k] === v || item[toSnakeCase(k)] === v;
          });
        });
      }
      return { list, count: list.length };
    },

    get: async (id: string) => {
      if (!id) return null;
      if (isLiveSupabaseActive()) {
        try {
          const byId = await supabase.from('maintenance_kits').select('*').eq('id', id).maybeSingle();
          if (byId.data) return toCamelCase(byId.data);
          const byKitId = await supabase.from('maintenance_kits').select('*').eq('kit_id', id).maybeSingle();
          if (byKitId.data) return toCamelCase(byKitId.data);
        } catch (e) {
          // Fallback démo
        }
      }
      const list = demoDb.getTable('maintenanceKits');
      return list.find((k: any) => k.id === id || k._id === id || k.kitId === id || k.kit_id === id) || null;
    },

    create: async (kitData: any) => {
      if (isLiveSupabaseActive()) {
        const payload = toSnakeCase(kitData);
        if (payload.kit_number !== undefined && typeof payload.kit_number === 'string' && /^\d+$/.test(payload.kit_number)) {
          payload.kit_number = parseInt(payload.kit_number, 10);
        }
        if (payload.service_number !== undefined && typeof payload.service_number === 'string') {
          payload.service_number = parseInt(payload.service_number, 10) || 1;
        }
        try {
          const { data, error } = await supabase.from('maintenance_kits').insert(payload).select().single();
          if (error) {
            console.error('❌ Erreur Supabase maintenance_kits.create:', error);
            throw new Error(`Supabase: ${error.message} (${error.code || 'code'})`);
          }
          if (data) return toCamelCase(data);
        } catch (e: any) {
          console.error('Échec insertion Supabase maintenance_kits:', e);
          throw e;
        }
      }
      return demoDb.insert('maintenanceKits', kitData);
    },

    update: async (id: string, kitData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('maintenance_kits').update(toSnakeCase(kitData)).eq('id', id).select().single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.update('maintenanceKits', id, kitData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          await supabase.from('maintenance_kits').delete().eq('id', id);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.delete('maintenanceKits', id);
    }
  },

  get maintenanceKits() {
    return this.maintenance_kits;
  },

  get taches_entretien() {
    return this.tachesEntretien;
  },

  get machine_fields() {
    return this.machineFields;
  },

  get machine_field_options() {
    return this.machineFieldOptions;
  },

  get error_codes() {
    return this.errorCodes;
  },

  get spare_parts() {
    return this.spareParts;
  },

  get intervention_parts() {
    return {
      list: async (options?: any) => {
        const all = demoDb.getTable('intervention_parts') || [];
        if (options?.filter?.interventionId) {
          const filtered = all.filter((p: any) => p.interventionId === options.filter.interventionId);
          return { list: filtered, count: filtered.length };
        }
        return { list: all, count: all.length };
      },
      get: async (id: string) => demoDb.findById('intervention_parts', id),
      create: async (data: any) => demoDb.insert('intervention_parts', data),
      update: async (id: string, data: any) => demoDb.update('intervention_parts', id, data),
      delete: async (id: string) => demoDb.delete('intervention_parts', id)
    };
  },

  get utilisateurs() {
    return this.users;
  }
};

// Export d'authentification complet avec workflow de validation, Google OAuth et administrateur de référence
export const auth = {
  // Connexion via Google OAuth (Supabase)
  signInWithGoogle: async () => {
    if (!isLiveSupabaseActive()) {
      // Repli immédiat mode local : connexion administrateur
      const masterAdmin = {
        id: 'usr-admin',
        _id: 'usr-admin',
        nom: 'CHAMPAGNE',
        prenom: 'Hervé',
        email: 'contact@appalacarte.fr',
        role: 'ADMINISTRATEUR',
        roles: ['ADMINISTRATEUR'],
        numeroTechnicien: '001',
        actif: true,
        statut: 'VALIDE',
        permissions: ['admin_access', 'manage_users', 'view_all_data', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines', 'view_interventions', 'edit_interventions', 'view_spare_parts', 'edit_spare_parts']
      };
      localStorage.setItem('maintenance_authenticated', 'true');
      localStorage.setItem('maintenance_current_user', JSON.stringify(masterAdmin));
      return { user: masterAdmin, session: { user: masterAdmin } };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAppBaseUrl()
      }
    });
    if (error) throw error;
    return data;
  },

  // Connexion via lien magique OTP envoyé sur adresse email validée
  signInWithOtp: async (email: string) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Veuillez renseigner votre adresse email.');
    }

    if (cleanEmail !== 'contact@appalacarte.fr') {
      const registered = await db.users.findByEmail(cleanEmail);
      if (!registered) {
        const err: any = new Error("Cette adresse email n'est pas encore enregistrée. Veuillez faire une demande d'accès ci-dessous.");
        err.code = 'USER_NOT_FOUND';
        throw err;
      }
      if (registered.statut === 'EN_ATTENTE' || (registered.actif === false && registered.statut !== 'VALIDE')) {
        const err: any = new Error("Votre demande de connexion est actuellement en attente de validation par l'administrateur ou le responsable technique.");
        err.code = 'USER_PENDING';
        throw err;
      }
      if (registered.statut === 'REFUSE') {
        const err: any = new Error("Votre demande de connexion a été refusée ou votre compte est inactif.");
        err.code = 'USER_REJECTED';
        throw err;
      }
    }

    if (isLiveSupabaseActive()) {
      try {
        const { data, error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: getAppBaseUrl()
          }
        });
        if (error) {
          console.warn('Supabase signInWithOtp retour:', error);
          throw new Error(error.message || "Impossible d'envoyer le lien de connexion.");
        }
        return { ok: true, message: `Un lien magique de connexion a été envoyé à ${cleanEmail}. Cliquez dessus pour vous connecter.` };
      } catch (e: any) {
        throw new Error(e?.message || "Service d'envoi d'email indisponible. Connectez-vous avec votre mot de passe.");
      }
    }

    throw new Error("La connexion par lien email requiert une connexion active. Veuillez utiliser votre mot de passe.");
  },

  signIn: async (email: string, password?: string) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail) {
      throw new Error('Veuillez renseigner votre adresse email.');
    }

    // Règle stricte : Aucun accès sans mot de passe
    if (!cleanPassword) {
      const err: any = new Error("Mot de passe obligatoire. Aucun accès n'est autorisé sans mot de passe.");
      err.code = 'PASSWORD_REQUIRED';
      throw err;
    }

    // Récupération de l'utilisateur
    const user = await db.users.findByEmail(cleanEmail);

    if (!user) {
      const err: any = new Error("Aucun compte actif trouvé pour cette adresse email. Veuillez vérifier votre saisie ou faire une demande d'accès.");
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (user.statut === 'EN_ATTENTE' || (user.actif === false && user.statut !== 'VALIDE')) {
      const err: any = new Error("Votre demande de connexion est actuellement en attente de validation par l'administrateur ou le responsable technique. Vous recevrez l'accès dès son approbation.");
      err.code = 'USER_PENDING';
      throw err;
    }

    if (user.statut === 'REFUSE') {
      const err: any = new Error("Votre compte a été désactivé ou votre demande refusée. Veuillez contacter contact@appalacarte.fr.");
      err.code = 'USER_REJECTED';
      throw err;
    }

    // 1. Vérification du mot de passe temporaire : prenom2027
    const tempPassGenerated = generateTemporaryPassword(user.prenom || 'technicien');
    const isTemp = isTemporaryPassword(cleanPassword, user.prenom, user.motDePasseTemporaire);

    if (isTemp) {
      // Si l'utilisateur a déjà configuré un mot de passe personnel et que le changement n'est pas requis
      if (user.motDePasse && user.doitChangerMotDePasse === false && user.motDePasse !== cleanPassword) {
        const err: any = new Error("Ce mot de passe temporaire n'est plus actif car vous avez déjà configuré votre mot de passe personnel. En cas d'oubli, cliquez sur 'Mot de passe oublié ?'.");
        err.code = 'TEMP_PASSWORD_EXPIRED';
        throw err;
      }

      // Mot de passe temporaire accepté -> CHANGEMENT OBLIGATOIRE DU MOT DE PASSE REQUIS
      return {
        user,
        session: { user },
        requirePasswordChange: true,
        tempPasswordUsed: true
      };
    }

    // 2. Si un changement obligatoire de mot de passe est en attente
    if (user.doitChangerMotDePasse === true) {
      if (user.motDePasse && cleanPassword === user.motDePasse) {
        return {
          user,
          session: { user },
          requirePasswordChange: true
        };
      }
      const err: any = new Error(`Pour votre première connexion, utilisez votre mot de passe temporaire : votre prénom en minuscule suivi de 2027 (ex : ${tempPassGenerated}).`);
      err.code = 'REQUIRE_TEMP_PASSWORD';
      throw err;
    }

    // 3. Vérification du mot de passe personnel local
    if (user.motDePasse && cleanPassword === user.motDePasse) {
      localStorage.setItem('maintenance_authenticated', 'true');
      localStorage.setItem('maintenance_current_user', JSON.stringify(user));
      return { user, session: { user }, requirePasswordChange: false };
    }

    // 4. Vérification avec Supabase Auth si en direct
    if (isLiveSupabaseActive()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
        if (!error && data?.user) {
          const merged = { ...user, ...data.user, doitChangerMotDePasse: false };
          localStorage.setItem('maintenance_authenticated', 'true');
          localStorage.setItem('maintenance_current_user', JSON.stringify(merged));
          return { user: merged, session: data.session, requirePasswordChange: false };
        }
      } catch (err) {
        console.warn('Supabase auth distant a échoué:', err);
      }
    }

    // Si administrateur maître sans mot de passe personnalisé encore enregistré
    if (cleanEmail === 'contact@appalacarte.fr' && !user.motDePasse) {
      const err: any = new Error("Mot de passe incorrect. Pour initialiser votre compte administrateur, utilisez le mot de passe temporaire : herve2027.");
      err.code = 'INVALID_PASSWORD';
      throw err;
    }

    // Mot de passe invalide
    const err: any = new Error("Mot de passe incorrect. Pour une première connexion, utilisez votre mot de passe temporaire (votre prénom suivi de 2027). En cas d'oubli, cliquez sur 'Mot de passe oublié ?'.");
    err.code = 'INVALID_PASSWORD';
    throw err;
  },

  // Changement / Mise à jour obligatoire ou volontaire du mot de passe
  updatePassword: async (newPassword: string, userOrEmail?: any) => {
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      throw new Error(validation.errors[0] || 'Mot de passe non conforme.');
    }

    let targetUser: any = null;
    if (typeof userOrEmail === 'string') {
      targetUser = await db.users.findByEmail(userOrEmail);
    } else if (userOrEmail && (userOrEmail.email || userOrEmail.id)) {
      targetUser = userOrEmail;
    } else {
      const stored = localStorage.getItem('maintenance_current_user');
      targetUser = stored ? JSON.parse(stored) : null;
    }

    if (!targetUser) {
      throw new Error('Utilisateur non identifié pour le changement de mot de passe.');
    }

    // 1. Supabase Auth en direct si disponible
    if (isLiveSupabaseActive()) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          console.warn('Supabase auth.updateUser note:', error.message);
          try {
            await supabase.auth.signUp({ email: targetUser.email, password: newPassword });
          } catch {}
        }
      } catch (e) {
        console.warn('Exception Supabase updateUser:', e);
      }
    }

    // 2. Mise à jour de la fiche utilisateur
    const updated = await db.users.update(targetUser._id || targetUser.id, {
      motDePasse: newPassword,
      motDePasseTemporaire: null,
      doitChangerMotDePasse: false,
      derniereConnexion: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const finalUser = {
      ...targetUser,
      ...updated,
      doitChangerMotDePasse: false,
      motDePasseTemporaire: null
    };

    localStorage.setItem('maintenance_authenticated', 'true');
    localStorage.setItem('maintenance_current_user', JSON.stringify(finalUser));
    sessionStorage.removeItem('pending_auth_email');

    return { ok: true, user: finalUser };
  },

  // Procédure Mot de passe oublié
  resetPasswordForEmail: async (email: string) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Veuillez renseigner votre adresse email.');
    }

    const user = await db.users.findByEmail(cleanEmail);

    if (isLiveSupabaseActive()) {
      try {
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${getAppBaseUrl()}/login?type=recovery&email=${encodeURIComponent(cleanEmail)}`
        });
      } catch (e) {
        console.warn('Supabase resetPasswordForEmail warning:', e);
      }
    }

    if (user) {
      const tempPass = generateTemporaryPassword(user.prenom || 'technicien');
      await db.users.update(user._id || user.id, {
        motDePasseTemporaire: tempPass,
        doitChangerMotDePasse: true,
        updatedAt: new Date().toISOString()
      });

      return {
        ok: true,
        userFound: true,
        prenom: user.prenom,
        email: cleanEmail,
        tempPassword: tempPass,
        message: `Votre mot de passe temporaire (${tempPass}) a été réactivé. Reconnectez-vous dès maintenant avec ce mot de passe temporaire pour définir votre nouveau mot de passe personnel.`
      };
    }

    return {
      ok: true,
      userFound: false,
      email: cleanEmail,
      message: `Si cette adresse email est enregistrée, les instructions de réinitialisation y ont été envoyées.`
    };
  },

  // Réinitialisation du mot de passe temporaire par l'administrateur ou responsable technique
  adminResetTemporaryPassword: async (userId: string) => {
    return await db.users.resetTemporaryPassword(userId);
  },

  requestAccess: async (data: { email: string; nom: string; prenom: string; telephone?: string; role?: string; motifDemande?: string }) => {
    return await db.users.requestAccess(data);
  },

  signOut: async () => {
    localStorage.removeItem('maintenance_authenticated');
    localStorage.removeItem('maintenance_current_user');
    if (isLiveSupabaseActive()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
  },

  getSession: async () => {
    if (isLiveSupabaseActive()) {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session) return data.session;
      } catch (e) {
        // ignore
      }
    }
    const isAuth = localStorage.getItem('maintenance_authenticated') === 'true';
    const userStr = localStorage.getItem('maintenance_current_user');
    return isAuth && userStr ? { user: JSON.parse(userStr) } : null;
  },

  getUser: async () => {
    if (isLiveSupabaseActive()) {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) return data.user;
      } catch (e) {
        // ignore
      }
    }
    const userStr = localStorage.getItem('maintenance_current_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
