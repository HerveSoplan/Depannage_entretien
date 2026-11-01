//useErrorCodes.ts
import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';

export interface ErrorCode {
  _id: string;
  Chapitre: string;
  Titre: string;
  Alarme: string;
  Type_alarme: string;
  Cause: string;
  Action: string;
  actif?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function useErrorCodes() {
  const [errorCodes, setErrorCodes] = useState<ErrorCode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchErrorCodes = useCallback(async () => {
    try {
      setLoading(true);
      // Correction: db.errorCodes au lieu de db.error_codes et réponse directe (tableau)
      const data = await db.errorCodes.list();

      // Ajout: tri manuel si nécessaire ou si l'API ne le fait pas comme attendu (bien que sort soit passé dans l'original, list() sans argument ne trie pas forcément dans l'adaptateur actuel sauf si codé en dur)
      // L'adaptateur actuel pour errorCodes.list() a un .order('alarme') en dur, donc c'est bon.

      setErrorCodes(data || []);
    } catch (error) {
      console.error('Erreur chargement codes erreur:', error);
      setErrorCodes([]);
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
