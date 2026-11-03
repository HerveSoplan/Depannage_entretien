import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase'

export function useMachineFieldOptions() {
  const [machineFieldOptions, setMachineFieldOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMachineFieldOptions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await db.machineFieldOptions.list()
      const list = Array.isArray(data) ? data : (data?.list || [])
      const normalized = list.map((o: any) => ({
        ...o,
        _id: o._id || o.id,
        id: o.id || o._id,
        fieldId: o.fieldId || o.field_id
      }))
      setMachineFieldOptions(normalized)
      console.log('Options de champs chargées:', normalized)
      return normalized
    } catch (error) {
      console.error('Erreur chargement options de champs:', error)
      setMachineFieldOptions([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createMachineFieldOption = async (optionData: any) => {
    try {
      const newOption = await db.machineFieldOptions.create(optionData)
      console.log('Option de champ créée:', newOption)
      await fetchMachineFieldOptions()
      return newOption
    } catch (error) {
      console.error('Erreur création option de champ:', error)
      throw error
    }
  }

  const updateMachineFieldOption = async (id: string, optionData: any) => {
    try {
      const updated = await (db as any).machineFieldOptions.update(id, optionData)
      await fetchMachineFieldOptions()
      return updated
    } catch (error) {
      console.error('Erreur modification option de champ:', error)
      throw error
    }
  }

  const deleteMachineFieldOption = async (id: string) => {
    try {
      await db.machineFieldOptions.delete(id)
      console.log('Option de champ supprimée:', id)
      await fetchMachineFieldOptions()
    } catch (error) {
      console.error('Erreur suppression option de champ:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchMachineFieldOptions()
  }, [fetchMachineFieldOptions])

  return {
    machineFieldOptions,
    loading,
    fetchMachineFieldOptions,
    createMachineFieldOption,
    updateMachineFieldOption,
    deleteMachineFieldOption
  }
}