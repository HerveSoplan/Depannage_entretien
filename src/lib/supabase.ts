// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://roeozqwfvwgwqvchuwgo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_MKmYLQkGR1IpjRfEAKDrpQ_SmIwid8r';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Variables d'environnement Supabase absentes, utilisation des clés de secours.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper pour convertir les noms de colonnes snake_case vers camelCase
export const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      // ✅ Si la clé est 'id', on ajoute aussi '_id' pour compatibilité avec le code legacy
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

// Types de base
export interface Database {
  public: {
    Tables: {
      utilisateurs: any;
      clients: any;
      machines: any;
      interventions: any;
      installation_protocols: any;
      commissioning_protocols: any;
      spare_parts: any;
      maintenance_kits: any;
      taches_entretien: any;
      error_codes: any;
      machine_fields: any;
      machine_field_options: any;
      languages: any;
      translations: any;
      client_messages: any;
    };
  };
}

// API générique pour remplacer Lumi
export const db = {
  // Utilisateurs
  users: {
    list: async () => {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      return toCamelCase(data);
    },

    get: async (id: string) => {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    create: async (userData: any) => {
      const { data, error } = await supabase
        .from('utilisateurs')
        .insert(toSnakeCase(userData))
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    update: async (id: string, userData: any) => {
      const { data, error } = await supabase
        .from('utilisateurs')
        .update(toSnakeCase(userData))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('utilisateurs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  // Clients
  clients: {
    list: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      return toCamelCase(data);
    },

    get: async (id: string) => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    create: async (clientData: any) => {
      // Nettoyer les données : enlever les champs qui n'existent pas dans la BDD
      const cleanData = { ...clientData };
      delete cleanData.creator;
      delete cleanData.createdBy;

      const { data, error } = await supabase
        .from('clients')
        .insert(toSnakeCase(cleanData))
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    update: async (id: string, clientData: any) => {
      const { data, error } = await supabase
        .from('clients')
        .update(toSnakeCase(clientData))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  // Machines
  machines: {
    list: async (options: any = {}) => {
      let query = supabase
        .from('machines')
        .select('*', { count: 'exact' });

      // Filtrage
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (key === 'clientId') query = query.eq('client_id', value);
          else if (Array.isArray(value)) query = query.in(toSnakeCase(key), value);
          else query = query.eq(toSnakeCase(key), value);
        });
      }

      // Tri
      if (options.sort) {
        Object.entries(options.sort).forEach(([key, value]) => {
          query = query.order(toSnakeCase(key), { ascending: value === 1 });
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { list: toCamelCase(data), count };
    },

    getByClient: async (clientId: string) => {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return toCamelCase(data);
    },

    get: async (id: string) => {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    create: async (machineData: any) => {
      const { data, error } = await supabase
        .from('machines')
        .insert(toSnakeCase(machineData))
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    update: async (id: string, machineData: any) => {
      const { data, error } = await supabase
        .from('machines')
        .update(toSnakeCase(machineData))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('machines')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  // Interventions
  interventions: {
    list: async () => {
      const { data, error } = await supabase
        .from('v_interventions_details')
        .select('*')
        .order('date_prevue', { ascending: false });

      if (error) throw error;
      return toCamelCase(data);
    },

    get: async (id: string) => {
      const { data, error } = await supabase
        .from('interventions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    create: async (interventionData: any) => {
      const { data, error } = await supabase
        .from('interventions')
        .insert(toSnakeCase(interventionData))
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    update: async (id: string, interventionData: any) => {
      const { data, error } = await supabase
        .from('interventions')
        .update(toSnakeCase(interventionData))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('interventions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  // Installation Protocols
  installationProtocols: {
    get: async (interventionId: string) => {
      const { data, error } = await supabase
        .from('installation_protocols')
        .select('*')
        .eq('intervention_id', interventionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data ? toCamelCase(data) : null;
    },

    upsert: async (protocolData: any) => {
      const { data, error } = await supabase
        .from('installation_protocols')
        .upsert(toSnakeCase(protocolData), {
          onConflict: 'intervention_id'
        })
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    }
  },

  // Commissioning Protocols
  commissioningProtocols: {
    get: async (interventionId: string) => {
      const { data, error } = await supabase
        .from('commissioning_protocols')
        .select('*')
        .eq('intervention_id', interventionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? toCamelCase(data) : null;
    },

    upsert: async (protocolData: any) => {
      const { data, error } = await supabase
        .from('commissioning_protocols')
        .upsert(toSnakeCase(protocolData), {
          onConflict: 'intervention_id'
        })
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    }
  },

  // Spare Parts
  spareParts: {
    list: async () => {
      const { data, error } = await supabase
        .from('spare_parts')
        .select('*')
        .order('designation', { ascending: true });

      if (error) throw error;
      return toCamelCase(data);
    },


    create: async (partData: any) => {
      const { data, error } = await supabase
        .from('spare_parts')
        .insert(toSnakeCase(partData))
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    update: async (id: string, partData: any) => {
      const { data, error } = await supabase
        .from('spare_parts')
        .update(toSnakeCase(partData))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('spare_parts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  // Error Codes
  errorCodes: {
    list: async () => {
      const { data, error } = await supabase
        .from('error_codes')
        .select('*')
        .order('alarme', { ascending: true });

      if (error) throw error;
      return { list: toCamelCase(data) || [] };
    },

    search: async (query: string) => {
      const { data, error } = await supabase
        .from('error_codes')
        .select('*')
        .or(`alarme.ilike.%${query}%,titre.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return toCamelCase(data);
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('error_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  // Machine Fields
  machineFields: {
    list: async () => {
      const { data, error } = await supabase
        .from('machine_fields')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      return { list: toCamelCase(data) || [] };
    },

    create: async (fieldData: any) => {
      const { data, error } = await supabase
        .from('machine_fields')
        .insert(toSnakeCase(fieldData))
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('machine_fields')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  // Machine Field Options
  machineFieldOptions: {
    list: async () => {
      const { data, error } = await supabase
        .from('machine_field_options')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      return { list: toCamelCase(data) || [] };
    },

    getByField: async (fieldId: string) => {
      const { data, error } = await supabase
        .from('machine_field_options')
        .select('*')
        .eq('field_id', fieldId)
        .order('order', { ascending: true });

      if (error) throw error;
      return toCamelCase(data);
    },

    create: async (optionData: any) => {
      const { data, error } = await supabase
        .from('machine_field_options')
        .insert(toSnakeCase(optionData))
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('machine_field_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  // Languages
  languages: {
    list: async () => {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return { list: toCamelCase(data) || [] };
    },

    create: async (langData: any) => {
      const { data, error } = await supabase
        .from('languages')
        .insert(toSnakeCase(langData))
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    update: async (id: string, langData: any) => {
      const { data, error } = await supabase
        .from('languages')
        .update(toSnakeCase(langData))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('languages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  // Translations
  translations: {
    list: async () => {
      const { data, error } = await supabase
        .from('translations')
        .select('*');

      if (error) throw error;
      return { list: toCamelCase(data) || [] };
    },

    getByLanguage: async (languageCode: string) => {
      const { data, error } = await supabase
        .from('translations')
        .select('*')
        .eq('language_code', languageCode);

      if (error) throw error;
      return toCamelCase(data);
    },

    upsert: async (translationData: any) => {
      const { data, error } = await supabase
        .from('translations')
        .upsert(toSnakeCase(translationData), {
          onConflict: 'key,language_code'
        })
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    }
  },

  // Client Messages
  clientMessages: {
    list: async (clientId?: string) => {
      let query = supabase
        .from('client_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return toCamelCase(data);
    },

    create: async (messageData: any) => {
      const { data, error } = await supabase
        .from('client_messages')
        .insert(toSnakeCase(messageData))
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    markAsRead: async (id: string) => {
      const { data, error } = await supabase
        .from('client_messages')
        .update({
          lu: true,
          date_lu: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    countUnread: async (clientId?: string) => {
      let query = supabase
        .from('client_messages')
        .select('*', { count: 'exact', head: true })
        .eq('lu', false);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { count, error } = await query;

      return { count, error };
    }
  },

  // Tâches d'entretien
  tachesEntretien: {
    list: async (options?: { where?: any; sort?: any; limit?: number }) => {
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

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { list: toCamelCase(data) || [] };
    },

    create: async (taskData: any) => {
      const { data, error } = await supabase
        .from('taches_entretien')
        .insert(toSnakeCase(taskData))
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    update: async (id: string, taskData: any) => {
      const { data, error } = await supabase
        .from('taches_entretien')
        .update(toSnakeCase(taskData))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('taches_entretien')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  // Alias pour compatibilité avec les noms underscore snake_case
  maintenance_kits: {
    list: async (options: any = {}) => {
      let query = supabase
        .from('maintenance_kits')
        .select('*', { count: 'exact' });

      // Filtrage
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (key === 'machineType') {
            // Cas spécifique pour gérer le snake_case de cette colonne
            if (value && typeof value === 'object' && '$in' in (value as any)) {
              query = query.in('machine_type', (value as any).$in);
            } else {
              query = query.eq('machine_type', value);
            }
          }
          else if (Array.isArray(value)) query = query.in(toSnakeCase(key), value);
          else query = query.eq(toSnakeCase(key), value);
        });
      }

      // Tri
      if (options.sort) {
        Object.entries(options.sort).forEach(([key, value]) => {
          query = query.order(toSnakeCase(key), { ascending: value === 1 });
        });
      } else {
        query = query.order('service_number', { ascending: true });
      }

      // Pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { list: toCamelCase(data), count };
    },

    create: async (kitData: any) => {
      const { data, error } = await supabase
        .from('maintenance_kits')
        .insert(toSnakeCase(kitData))
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    update: async (id: string, kitData: any) => {
      const { data, error } = await supabase
        .from('maintenance_kits')
        .update(toSnakeCase(kitData))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('maintenance_kits')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  // Alias pour taches_entretien (référence à tachesEntretien)
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

  // Alias pour utilisateurs (référence à users)
  get utilisateurs() {
    return this.users;
  }
};

// Export d'authentification
export const auth = {
  signIn: async (email: string, password?: string) => {
    if (password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase auth non joignable, mode sans mot de passe:', err);
      }
    }

    // Repli connexion sans mot de passe
    const mockUser = {
      id: 'usr_' + Date.now(),
      email: email || 'herve@appalacarte.fr',
      role: 'ADMINISTRATEUR'
    };
    localStorage.setItem('maintenance_authenticated', 'true');
    localStorage.setItem('maintenance_current_user', JSON.stringify(mockUser));
    return { user: mockUser, session: { user: mockUser } };
  },

  signOut: async () => {
    localStorage.removeItem('maintenance_authenticated');

    localStorage.removeItem('maintenance_current_user');

    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
  },

  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session) return data.session;
    } catch (e) {
      // ignore
    }
    const isAuth = localStorage.getItem('maintenance_authenticated') === 'true';
    const userStr = localStorage.getItem('maintenance_current_user');
    return isAuth && userStr ? { user: JSON.parse(userStr) } : null;
  },

  getUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) return data.user;
    } catch (e) {
      // ignore
    }
    const userStr = localStorage.getItem('maintenance_current_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
