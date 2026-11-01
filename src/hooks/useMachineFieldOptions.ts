import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase'

export function useMachineFieldOptions() {
  const [machineFieldOptions, setMachineFieldOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMachineFieldOptions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await db.machineFieldOptions.list()
      setMachineFieldOptions(data || [])
      console.log('Options de champs chargées:', data)
    } catch (error) {
      console.error('Erreur chargement options de champs:', error)
      setMachineFieldOptions([])
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
    deleteMachineFieldOption
  }
}