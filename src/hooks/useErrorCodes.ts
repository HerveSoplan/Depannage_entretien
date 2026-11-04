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

  const fixAccents = (str: string): string => {
    if (!str) return '';
    return str
      .replace(/\u201a/g, 'é')
      .replace(/\u0160/g, 'è')
      .replace(/\u02c6/g, 'ê')
      .replace(/\u2026/g, 'à')
      .replace(/\u0192/g, 'â')
      .replace(/\u201c/g, 'ô')
      .replace(/\u2021/g, 'ç')
      .replace(/\u201d/g, 'î')
      .replace(/\{ms\}/gi, '')
      .trim();
  };

  const normalizeErrorCodes = (items: any[]): ErrorCode[] => {
    return items.map((code: any) => {
      let alarme = String(code.alarme || code.Alarme || '').trim();
      let titre = String(code.titre || code.Titre || '').trim();
      if (titre === 'Code erreur') titre = '';
      const chapitre = String(code.chapitre || code.Chapitre || '').trim();
      let typeAlarme = String(code.typeAlarme || code.Type_alarme || code.type_alarme || code.TypeAlarme || '').trim();
      let cause = String(code.cause || code.Cause || '').trim();
      let action = String(code.action || code.Action || '').trim();

      // Extraction automatique de secours si les données brutes sont dans chapitre ou description
      if ((!alarme || !titre || !cause) && (chapitre || code.description)) {
        const raw = chapitre || code.description || '';
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

      alarme = alarme.replace(/\//g, '').trim();
      titre = fixAccents(titre).replace(/\//g, '').trim();
      typeAlarme = fixAccents(typeAlarme).trim();
      cause = fixAccents(cause).replace(/\//g, '').trim();
      action = fixAccents(action).replace(/\//g, '').trim();

      const id = code.id || code._id || `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      return {
        ...code,
        _id: id,
        id: id,
        alarme,
        Alarme: alarme,
        titre: titre || (alarme ? `Alarme ${alarme}` : 'Code erreur'),
        Titre: titre || (alarme ? `Alarme ${alarme}` : 'Code erreur'),
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
          c.alarme?.toLowerCase().includes(regexStr) ||
          c.Titre?.toLowerCase().includes(regexStr) ||
          c.titre?.toLowerCase().includes(regexStr) ||
          c.Cause?.toLowerCase().includes(regexStr) ||
          c.cause?.toLowerCase().includes(regexStr) ||
          c.typeAlarme?.toLowerCase().includes(regexStr) ||
          c.chapitre?.toLowerCase().includes(regexStr)
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
