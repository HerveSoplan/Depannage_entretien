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
  const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
  const potentialId = userData.id || userData._id;
  if (potentialId && isUuid(potentialId) && !options.isUpdate) {
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
    list: async () => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('nom', { ascending: true });
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.getTable('clients');
    },

    get: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.findById('clients', id);
    },

    create: async (clientData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const cleanData = { ...clientData };
          delete cleanData.creator;
          delete cleanData.createdBy;
          const { data, error } = await supabase
            .from('clients')
            .insert(toSnakeCase(cleanData))
            .select()
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.insert('clients', clientData);
    },

    update: async (id: string, clientData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('clients')
            .update(toSnakeCase(clientData))
            .eq('id', id)
            .select()
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.update('clients', id, clientData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          await supabase.from('clients').delete().eq('id', id);
        } catch (e) {
          // Fallback démo
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
              if (key === 'clientId') query = query.eq('client_id', value);
              else if (Array.isArray(value)) query = query.in(toSnakeCase(key), value);
              else query = query.eq(toSnakeCase(key), value);
            });
          }
          if (options.sort) {
            Object.entries(options.sort).forEach(([key, value]) => {
              query = query.order(toSnakeCase(key), { ascending: value === 1 });
            });
          } else {
            query = query.order('created_at', { ascending: false });
          }
          if (options.limit) query = query.limit(options.limit);
          const { data, error, count } = await query;
          if (!error && data) return { list: toCamelCase(data), count: count ?? data.length };
        } catch (e) {
          // Fallback démo
        }
      }
      let list = demoDb.getTable('machines');
      if (options.filter?.clientId) {
        list = list.filter((m: any) => m.clientId === options.filter.clientId);
      }
      return { list, count: list.length };
    },

    getByClient: async (clientId: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('machines')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.getTable('machines').filter((m: any) => m.clientId === clientId);
    },

    get: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('machines')
            .select('*')
            .eq('id', id)
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.findById('machines', id);
    },

    create: async (machineData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('machines')
            .insert(toSnakeCase(machineData))
            .select()
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.insert('machines', machineData);
    },

    update: async (id: string, machineData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('machines')
            .update(toSnakeCase(machineData))
            .eq('id', id)
            .select()
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.update('machines', id, machineData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          await supabase.from('machines').delete().eq('id', id);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.delete('machines', id);
    }
  },

  // Interventions
  interventions: {
    list: async () => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('v_interventions_details')
            .select('*')
            .order('date_prevue', { ascending: false });
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      const raw = demoDb.getTable('interventions');
      return raw.map((i: any) => {
        const client = demoDb.findById('clients', i.clientId);
        const machine = demoDb.findById('machines', i.machineId);
        const tech = demoDb.findById('utilisateurs', i.technicienPrincipalId);
        return {
          ...i,
          clientNom: client?.nom || 'Client démo',
          clientVille: client?.ville || 'Reims',
          machineNumeroSerie: machine?.numeroSerie || 'N/A',
          machineModele: machine?.modele || 'Équipement démo',
          technicienNom: tech ? `${tech.prenom} ${tech.nom}` : 'Technicien Démo'
        };
      });
    },

    get: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('interventions')
            .select('*')
            .eq('id', id)
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      const item = demoDb.findById('interventions', id);
      if (item) {
        const client = demoDb.findById('clients', item.clientId);
        const machine = demoDb.findById('machines', item.machineId);
        return {
          ...item,
          clientNom: client?.nom || 'Client démo',
          machineModele: machine?.modele || 'Équipement démo'
        };
      }
      return null;
    },

    create: async (interventionData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('interventions')
            .insert(toSnakeCase(interventionData))
            .select()
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.insert('interventions', interventionData);
    },

    update: async (id: string, interventionData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('interventions')
            .update(toSnakeCase(interventionData))
            .eq('id', id)
            .select()
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.update('interventions', id, interventionData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          await supabase.from('interventions').delete().eq('id', id);
        } catch (e) {
          // Fallback démo
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
          const { data, error } = await supabase
            .from('installation_protocols')
            .select('*')
            .eq('intervention_id', interventionId)
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      const all = demoDb.getTable('installationProtocols');
      return all.find((p: any) => p.interventionId === interventionId) || null;
    },

    upsert: async (protocolData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('installation_protocols')
            .upsert(toSnakeCase(protocolData), { onConflict: 'intervention_id' })
            .select()
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      const existing = (demoDb.getTable('installationProtocols') || []).find((p: any) => p.interventionId === protocolData.interventionId);
      if (existing) {
        return demoDb.update('installationProtocols', existing.id, protocolData);
      }
      return demoDb.insert('installationProtocols', protocolData);
    }
  },

  // Commissioning Protocols
  commissioningProtocols: {
    get: async (interventionId: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('commissioning_protocols')
            .select('*')
            .eq('intervention_id', interventionId)
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      const all = demoDb.getTable('commissioningProtocols');
      return all.find((p: any) => p.interventionId === interventionId) || null;
    },

    upsert: async (protocolData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase
            .from('commissioning_protocols')
            .upsert(toSnakeCase(protocolData), { onConflict: 'intervention_id' })
            .select()
            .single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
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
          if (!error && data) return toCamelCase(data);
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
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.findById('spareParts', id);
    },

    create: async (partData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('spare_parts').insert(toSnakeCase(partData)).select().single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.insert('spareParts', partData);
    },

    update: async (id: string, partData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('spare_parts').update(toSnakeCase(partData)).eq('id', id).select().single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.update('spareParts', id, partData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          await supabase.from('spare_parts').delete().eq('id', id);
        } catch (e) {
          // Fallback démo
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
          if (!error && data) return { list: toCamelCase(data) };
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

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          await supabase.from('error_codes').delete().eq('id', id);
        } catch (e) {
          // Fallback démo
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
          if (!error && data) return { list: toCamelCase(data) };
        } catch (e) {
          // Fallback démo
        }
      }
      return { list: demoDb.getTable('machineFields') };
    },

    create: async (fieldData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('machine_fields').insert(toSnakeCase(fieldData)).select().single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.insert('machineFields', fieldData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          await supabase.from('machine_fields').delete().eq('id', id);
        } catch (e) {
          // Fallback démo
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
          if (!error && data) return { list: toCamelCase(data) };
        } catch (e) {
          // Fallback démo
        }
      }
      return { list: demoDb.getTable('machineFieldOptions') };
    },

    getByField: async (fieldId: string) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('machine_field_options').select('*').eq('field_id', fieldId).order('order', { ascending: true });
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.getTable('machineFieldOptions').filter((o: any) => o.fieldId === fieldId);
    },

    create: async (optionData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('machine_field_options').insert(toSnakeCase(optionData)).select().single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.insert('machineFieldOptions', optionData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          await supabase.from('machine_field_options').delete().eq('id', id);
        } catch (e) {
          // Fallback démo
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
            Object.entries(options.where).forEach(([key, value]) => {
              const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
              query = query.eq(snakeKey, value);
            });
          }
          if (options?.sort) {
            const sortKey = Object.keys(options.sort)[0];
            const snakeSort = sortKey.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            query = query.order(snakeSort, { ascending: options.sort[sortKey] === 1 });
          }
          if (options?.limit) query = query.limit(options.limit);
          const { data, error } = await query;
          if (!error && data) return { list: toCamelCase(data) };
        } catch (e) {
          // Fallback démo
        }
      }
      return { list: demoDb.getTable('tachesEntretien') };
    },

    create: async (taskData: any) => {
      if (isLiveSupabaseActive()) {
        const payload = toSnakeCase(taskData);
        if (payload.kit_number !== undefined && typeof payload.kit_number === 'string' && /^\d+$/.test(payload.kit_number)) {
          payload.kit_number = parseInt(payload.kit_number, 10);
        }
        if (payload.service_number !== undefined && typeof payload.service_number === 'string') {
          payload.service_number = parseInt(payload.service_number, 10) || 1;
        }
        try {
          const { data, error } = await supabase.from('taches_entretien').insert(payload).select().single();
          if (error) {
            console.error('❌ Erreur Supabase taches_entretien.create:', error);
            throw new Error(`Supabase: ${error.message} (${error.code || 'code'})`);
          }
          if (data) return toCamelCase(data);
        } catch (e: any) {
          console.error('Échec insertion Supabase taches_entretien:', e);
          throw e;
        }
      }
      return demoDb.insert('tachesEntretien', taskData);
    },

    update: async (id: string, taskData: any) => {
      if (isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.from('taches_entretien').update(toSnakeCase(taskData)).eq('id', id).select().single();
          if (!error && data) return toCamelCase(data);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.update('tachesEntretien', id, taskData);
    },

    delete: async (id: string) => {
      if (isLiveSupabaseActive()) {
        try {
          await supabase.from('taches_entretien').delete().eq('id', id);
        } catch (e) {
          // Fallback démo
        }
      }
      return demoDb.delete('tachesEntretien', id);
    }
  },

  // Kits de maintenance
  maintenance_kits: {
    list: async (options: any = {}) => {
      if (isLiveSupabaseActive()) {
        try {
          let query = supabase.from('maintenance_kits').select('*', { count: 'exact' });
          if (options.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              if (key === 'machineType') {
                if (value && typeof value === 'object' && '$in' in (value as any)) {
                  query = query.in('machine_type', (value as any).$in);
                } else {
                  query = query.eq('machine_type', value);
                }
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
      const list = demoDb.getTable('maintenanceKits');
      return { list, count: list.length };
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
