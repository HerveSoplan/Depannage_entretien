import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase'

export function useMachineFields() {
  const [machineFields, setMachineFields] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMachineFields = useCallback(async () => {
    setLoading(true)
    try {
      const data = await db.machineFields.list()
      setMachineFields(data || [])
      console.log('Champs machines chargés:', data)
    } catch (error) {
      console.error('Erreur chargement champs machines:', error)
      setMachineFields([])
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
    deleteMachineField
  }
}