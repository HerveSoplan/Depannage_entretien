import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase'

export function useMachineFields() {
  const [machineFields, setMachineFields] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMachineFields = useCallback(async () => {
    setLoading(true)
    try {
      const data = await db.machineFields.list()
      const list = Array.isArray(data) ? data : (data?.list || [])
      const normalized = list.map((f: any) => ({
        ...f,
        _id: f._id || f.id,
        id: f.id || f._id
      }))
      setMachineFields(normalized)
      console.log('Champs machines chargés:', normalized)
      return normalized
    } catch (error) {
      console.error('Erreur chargement champs machines:', error)
      setMachineFields([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createMachineField = async (fieldData: any) => {
    try {
      const newField = await db.machineFields.create(fieldData)
      console.log('Champ machine créé:', newField)
      await fetchMachineFields()
      return newField
    } catch (error) {
      console.error('Erreur création champ machine:', error)
      throw error
    }
  }

  const updateMachineField = async (id: string, fieldData: any) => {
    try {
      const updated = await (db as any).machineFields.update(id, fieldData)
      await fetchMachineFields()
      return updated
    } catch (error) {
      console.error('Erreur mise à jour champ machine:', error)
      throw error
    }
  }

  const deleteMachineField = async (id: string) => {
    try {
      await db.machineFields.delete(id)
      console.log('Champ machine supprimé:', id)
      await fetchMachineFields()
    } catch (error) {
      console.error('Erreur suppression champ machine:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchMachineFields()
  }, [fetchMachineFields])

  return {
    machineFields,
    loading,
    fetchMachineFields,
    createMachineField,
    updateMachineField,
    deleteMachineField
  }
}