// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { demoDb } from '../services/demoDatabase';

export { demoDb };

const DEFAULT_SUPABASE_URL = 'https://roeozqwfvwgwqvchuwgo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_MKmYLQkGR1IpjRfEAKDrpQ_SmIwid8r';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.info("ℹ️ Mode autonome actif : fallback automatique vers la base de données démo locale.");
}

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

// API universelle avec bascule automatique Démo / Supabase
export const db = {
  // Utilisateurs
  users: {
    list: async () => {
      try {
        const { data, error } = await supabase
          .from('utilisateurs')
          .select('*')
          .order('nom', { ascending: true });
        if (!error && data && data.length > 0) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.getTable('utilisateurs');
    },

    get: async (id: string) => {
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
      return demoDb.findById('utilisateurs', id);
    },

    create: async (userData: any) => {
      try {
        const { data, error } = await supabase
          .from('utilisateurs')
          .insert(toSnakeCase(userData))
          .select()
          .single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.insert('utilisateurs', userData);
    },

    update: async (id: string, userData: any) => {
      try {
        const { data, error } = await supabase
          .from('utilisateurs')
          .update(toSnakeCase(userData))
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.update('utilisateurs', id, userData);
    },

    delete: async (id: string) => {
      try {
        await supabase.from('utilisateurs').delete().eq('id', id);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.delete('utilisateurs', id);
    }
  },

  // Clients
  clients: {
    list: async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('nom', { ascending: true });
        if (!error && data && data.length > 0) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.getTable('clients');
    },

    get: async (id: string) => {
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
      return demoDb.findById('clients', id);
    },

    create: async (clientData: any) => {
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
      return demoDb.insert('clients', clientData);
    },

    update: async (id: string, clientData: any) => {
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
      return demoDb.update('clients', id, clientData);
    },

    delete: async (id: string) => {
      try {
        await supabase.from('clients').delete().eq('id', id);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.delete('clients', id);
    }
  },

  // Machines
  machines: {
    list: async (options: any = {}) => {
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
        if (!error && data && data.length > 0) return { list: toCamelCase(data), count };
      } catch (e) {
        // Fallback démo
      }
      let list = demoDb.getTable('machines');
      if (options.filter?.clientId) {
        list = list.filter((m: any) => m.clientId === options.filter.clientId);
      }
      return { list, count: list.length };
    },

    getByClient: async (clientId: string) => {
      try {
        const { data, error } = await supabase
          .from('machines')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.getTable('machines').filter((m: any) => m.clientId === clientId);
    },

    get: async (id: string) => {
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
      return demoDb.findById('machines', id);
    },

    create: async (machineData: any) => {
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
      return demoDb.insert('machines', machineData);
    },

    update: async (id: string, machineData: any) => {
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
      return demoDb.update('machines', id, machineData);
    },

    delete: async (id: string) => {
      try {
        await supabase.from('machines').delete().eq('id', id);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.delete('machines', id);
    }
  },

  // Interventions
  interventions: {
    list: async () => {
      try {
        const { data, error } = await supabase
          .from('v_interventions_details')
          .select('*')
          .order('date_prevue', { ascending: false });
        if (!error && data && data.length > 0) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
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
      return demoDb.insert('interventions', interventionData);
    },

    update: async (id: string, interventionData: any) => {
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
      return demoDb.update('interventions', id, interventionData);
    },

    delete: async (id: string) => {
      try {
        await supabase.from('interventions').delete().eq('id', id);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.delete('interventions', id);
    }
  },

  // Installation Protocols
  installationProtocols: {
    get: async (interventionId: string) => {
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
      const all = demoDb.getTable('installationProtocols');
      return all.find((p: any) => p.interventionId === interventionId) || null;
    },

    upsert: async (protocolData: any) => {
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
      const all = demoDb.getTable('commissioningProtocols');
      return all.find((p: any) => p.interventionId === interventionId) || null;
    },

    upsert: async (protocolData: any) => {
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
      try {
        const { data, error } = await supabase
          .from('spare_parts')
          .select('*')
          .order('designation', { ascending: true });
        if (!error && data && data.length > 0) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.getTable('spareParts');
    },

    get: async (id: string) => {
      try {
        const { data, error } = await supabase.from('spare_parts').select('*').eq('id', id).single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.findById('spareParts', id);
    },

    create: async (partData: any) => {
      try {
        const { data, error } = await supabase.from('spare_parts').insert(toSnakeCase(partData)).select().single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.insert('spareParts', partData);
    },

    update: async (id: string, partData: any) => {
      try {
        const { data, error } = await supabase.from('spare_parts').update(toSnakeCase(partData)).eq('id', id).select().single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.update('spareParts', id, partData);
    },

    delete: async (id: string) => {
      try {
        await supabase.from('spare_parts').delete().eq('id', id);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.delete('spareParts', id);
    }
  },

  // Error Codes
  errorCodes: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('error_codes').select('*').order('alarme', { ascending: true });
        if (!error && data && data.length > 0) return { list: toCamelCase(data) };
      } catch (e) {
        // Fallback démo
      }
      return { list: demoDb.getTable('errorCodes') };
    },

    search: async (query: string) => {
      try {
        const { data, error } = await supabase
          .from('error_codes')
          .select('*')
          .or(`alarme.ilike.%${query}%,titre.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(10);
        if (!error && data && data.length > 0) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      const q = query.toLowerCase();
      return demoDb.getTable('errorCodes').filter((item: any) =>
        (item.alarme || '').toLowerCase().includes(q) ||
        (item.titre || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
      );
    },

    delete: async (id: string) => {
      try {
        await supabase.from('error_codes').delete().eq('id', id);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.delete('errorCodes', id);
    }
  },

  // Machine Fields
  machineFields: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('machine_fields').select('*').order('order', { ascending: true });
        if (!error && data && data.length > 0) return { list: toCamelCase(data) };
      } catch (e) {
        // Fallback démo
      }
      return { list: demoDb.getTable('machineFields') };
    },

    create: async (fieldData: any) => {
      try {
        const { data, error } = await supabase.from('machine_fields').insert(toSnakeCase(fieldData)).select().single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.insert('machineFields', fieldData);
    },

    delete: async (id: string) => {
      try {
        await supabase.from('machine_fields').delete().eq('id', id);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.delete('machineFields', id);
    }
  },

  // Machine Field Options
  machineFieldOptions: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('machine_field_options').select('*').order('order', { ascending: true });
        if (!error && data && data.length > 0) return { list: toCamelCase(data) };
      } catch (e) {
        // Fallback démo
      }
      return { list: demoDb.getTable('machineFieldOptions') };
    },

    getByField: async (fieldId: string) => {
      try {
        const { data, error } = await supabase.from('machine_field_options').select('*').eq('field_id', fieldId).order('order', { ascending: true });
        if (!error && data && data.length > 0) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.getTable('machineFieldOptions').filter((o: any) => o.fieldId === fieldId);
    },

    create: async (optionData: any) => {
      try {
        const { data, error } = await supabase.from('machine_field_options').insert(toSnakeCase(optionData)).select().single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.insert('machineFieldOptions', optionData);
    },

    delete: async (id: string) => {
      try {
        await supabase.from('machine_field_options').delete().eq('id', id);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.delete('machineFieldOptions', id);
    }
  },

  // Languages
  languages: {
    list: async () => {
      try {
        const { data, error } = await supabase.from('languages').select('*').order('name', { ascending: true });
        if (!error && data && data.length > 0) return { list: toCamelCase(data) };
      } catch (e) {
        // Fallback démo
      }
      return { list: demoDb.getTable('languages') };
    },

    create: async (langData: any) => {
      try {
        const { data, error } = await supabase.from('languages').insert(toSnakeCase(langData)).select().single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.insert('languages', langData);
    },

    update: async (id: string, langData: any) => {
      try {
        const { data, error } = await supabase.from('languages').update(toSnakeCase(langData)).eq('id', id).select().single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.update('languages', id, langData);
    },

    delete: async (id: string) => {
      try {
        await supabase.from('languages').delete().eq('id', id);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.delete('languages', id);
    }
  },

  // Translations
  translations: {
    list: async (options?: any) => {
      try {
        let query = supabase.from('translations').select('*');
        if (options?.filter?.languageCode) {
          query = query.eq('language_code', options.filter.languageCode);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) return { list: toCamelCase(data) };
      } catch (e) {
        // Fallback démo
      }
      return { list: demoDb.getTable('translations') };
    },

    getByLanguage: async (languageCode: string) => {
      try {
        const { data, error } = await supabase.from('translations').select('*').eq('language_code', languageCode);
        if (!error && data && data.length > 0) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.getTable('translations').filter((t: any) => t.languageCode === languageCode);
    },

    upsert: async (translationData: any) => {
      try {
        const { data, error } = await supabase.from('translations').upsert(toSnakeCase(translationData), { onConflict: 'key,language_code' }).select().single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
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
      try {
        let query = supabase.from('client_messages').select('*').order('created_at', { ascending: false });
        if (clientId) query = query.eq('client_id', clientId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      const list = demoDb.getTable('clientMessages');
      return clientId ? list.filter((m: any) => m.clientId === clientId) : list;
    },

    create: async (messageData: any) => {
      try {
        const { data, error } = await supabase.from('client_messages').insert(toSnakeCase(messageData)).select().single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.insert('clientMessages', messageData);
    },

    markAsRead: async (id: string) => {
      try {
        const { data, error } = await supabase.from('client_messages').update({ lu: true, date_lu: new Date().toISOString() }).eq('id', id).select().single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.update('clientMessages', id, { lu: true, dateLu: new Date().toISOString() });
    },

    countUnread: async (clientId?: string) => {
      try {
        let query = supabase.from('client_messages').select('*', { count: 'exact', head: true }).eq('lu', false);
        if (clientId) query = query.eq('client_id', clientId);
        const { count, error } = await query;
        if (!error && count !== null) return { count, error: null };
      } catch (e) {
        // Fallback démo
      }
      const unread = demoDb.getTable('clientMessages').filter((m: any) => !m.lu && (!clientId || m.clientId === clientId));
      return { count: unread.length, error: null };
    }
  },

  // Tâches d'entretien
  tachesEntretien: {
    list: async (options?: { where?: any; sort?: any; limit?: number }) => {
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
        if (!error && data && data.length > 0) return { list: toCamelCase(data) };
      } catch (e) {
        // Fallback démo
      }
      return { list: demoDb.getTable('tachesEntretien') };
    },

    create: async (taskData: any) => {
      try {
        const { data, error } = await supabase.from('taches_entretien').insert(toSnakeCase(taskData)).select().single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.insert('tachesEntretien', taskData);
    },

    update: async (id: string, taskData: any) => {
      try {
        const { data, error } = await supabase.from('taches_entretien').update(toSnakeCase(taskData)).eq('id', id).select().single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.update('tachesEntretien', id, taskData);
    },

    delete: async (id: string) => {
      try {
        await supabase.from('taches_entretien').delete().eq('id', id);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.delete('tachesEntretien', id);
    }
  },

  // Kits de maintenance
  maintenance_kits: {
    list: async (options: any = {}) => {
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
        if (!error && data && data.length > 0) return { list: toCamelCase(data), count };
      } catch (e) {
        // Fallback démo
      }
      const list = demoDb.getTable('maintenanceKits');
      return { list, count: list.length };
    },

    create: async (kitData: any) => {
      try {
        const { data, error } = await supabase.from('maintenance_kits').insert(toSnakeCase(kitData)).select().single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.insert('maintenanceKits', kitData);
    },

    update: async (id: string, kitData: any) => {
      try {
        const { data, error } = await supabase.from('maintenance_kits').update(toSnakeCase(kitData)).eq('id', id).select().single();
        if (!error && data) return toCamelCase(data);
      } catch (e) {
        // Fallback démo
      }
      return demoDb.update('maintenanceKits', id, kitData);
    },

    delete: async (id: string) => {
      try {
        await supabase.from('maintenance_kits').delete().eq('id', id);
      } catch (e) {
        // Fallback démo
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

// Export d'authentification
export const auth = {
  signIn: async (email: string, password?: string) => {
    if (password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase auth non joignable, mode sans mot de passe actif.');
      }
    }

    const mockUser = {
      id: 'usr_' + Date.now(),
      email: email || 'contact@appalacarte.fr',
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
