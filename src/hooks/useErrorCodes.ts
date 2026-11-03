//useErrorCodes.ts
import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';

export interface ErrorCode {
  _id: string;
  id?: string;
  Chapitre?: string;
  chapitre?: string;
  Titre?: string;
  titre?: string;
  Alarme?: string;
  alarme?: string;
  Type_alarme?: string;
  typeAlarme?: string;
  type_alarme?: string;
  Cause?: string;
  cause?: string;
  Action?: string;
  action?: string;
  actif?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function useErrorCodes() {
  const [errorCodes, setErrorCodes] = useState<ErrorCode[]>([]);
  const [loading, setLoading] = useState(false);

  const normalizeErrorCodes = (items: any[]): ErrorCode[] => {
    return items.map((code: any) => {
      const alarme = code.alarme || code.Alarme || '';
      const titre = code.titre || code.Titre || '';
      const chapitre = code.chapitre || code.Chapitre || '';
      const typeAlarme = code.typeAlarme || code.Type_alarme || code.type_alarme || code.TypeAlarme || '';
      const cause = code.cause || code.Cause || '';
      const action = code.action || code.Action || '';
      const id = code.id || code._id || `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      return {
        ...code,
        _id: id,
        id: id,
        alarme,
        Alarme: alarme,
        titre,
        Titre: titre,
        chapitre,
        Chapitre: chapitre,
        typeAlarme,
        type_alarme: typeAlarme,
        Type_alarme: typeAlarme,
        cause,
        Cause: cause,
        action,
        Action: action,
        actif: code.actif !== false
      };
    });
  };

  const fetchErrorCodes = useCallback(async (options?: any) => {
    try {
      setLoading(true);
      const res = await db.errorCodes.list();
      const rawList = Array.isArray(res) ? res : (res?.list || []);
      let normalized = normalizeErrorCodes(rawList);

      if (options?.filter?.Alarme?.$regex) {
        const regexStr = options.filter.Alarme.$regex.toLowerCase();
        normalized = normalized.filter(c =>
          c.Alarme?.toLowerCase().includes(regexStr) ||
          c.Titre?.toLowerCase().includes(regexStr) ||
          c.Cause?.toLowerCase().includes(regexStr)
        );
      }

      setErrorCodes(normalized);
      return normalized;
    } catch (error) {
      console.error('Erreur chargement codes erreur:', error);
      setErrorCodes([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchErrorCodes = async (searchTerm: string): Promise<ErrorCode[]> => {
    if (!searchTerm || searchTerm.trim() === '') {
      return errorCodes;
    }

    try {
      const term = searchTerm.toLowerCase();
      const filtered = errorCodes.filter(code =>
        code.Alarme?.toLowerCase().includes(term) ||
        code.Titre?.toLowerCase().includes(term) ||
        code.Cause?.toLowerCase().includes(term) ||
        code.Action?.toLowerCase().includes(term)
      );
      return filtered;
    } catch (error) {
      console.error('Erreur recherche codes erreur:', error);
      return [];
    }
  };

  const deleteErrorCode = async (id: string) => {
    try {
      // @ts-ignore - Temporary fix until delete is added to supabase.ts
      await db.errorCodes.delete(id);
      await fetchErrorCodes();
    } catch (error) {
      console.error('Erreur suppression code erreur:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchErrorCodes();
  }, []);

  return {
    errorCodes,
    loading,
    fetchErrorCodes,
    searchErrorCodes,
    deleteErrorCode
  };
}
