//useSpareParts.ts
import { useState, useCallback } from 'react'
import { db } from '../lib/supabase'

export function useSpareParts() {
  const [spareParts, setSpareParts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchSpareParts = useCallback(async (options?: {
    filter?: Record<string, any>
    sort?: Record<string, 1 | -1>
    limit?: number
    skip?: number
  }) => {
    setLoading(true)
    try {
      // Correction: db.spareParts au lieu de db.spare_parts et réponse directe (tableau)
      const data = await db.spareParts.list()

      // Filtrage manuel si nécessaire (API mockée)
      let filteredData = data || []

      if (options?.filter && options.filter.actif !== undefined) {
        filteredData = filteredData.filter((p: any) => p.actif === options.filter?.actif)
      }

      setSpareParts(filteredData)
      setTotal(filteredData.length)
      console.log('Pièces détachées chargées:', filteredData)
    } catch (error) {
      console.error('Erreur chargement pièces:', error)
      setSpareParts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStock = async (id: string, quantity: number) => {
    if (typeof id !== 'string') {
      throw new Error('ID doit être une chaîne')
    }
    if (typeof quantity !== 'number') {
      throw new Error('Quantité doit être un nombre')
    }
    try {
      // Note: db.spareParts.update needs to exist in supabase.ts
      // @ts-ignore - Temporary fix until update is added to supabase.ts
      const updated = await db.spareParts.update(id, { stock: quantity })
      console.log('Stock mis à jour:', updated)
      await fetchSpareParts()
      return updated
    } catch (error) {
      console.error('Erreur mise à jour stock:', error)
      throw error
    }
  }

  const deleteSparePart = async (id: string) => {
    if (typeof id !== 'string' || id === '[object Object]') {
      throw new Error('ID invalide: doit être une chaîne')
    }
    try {
      await db.spareParts.delete(id)
      console.log('Pièce supprimée:', id)
      await fetchSpareParts()
    } catch (error) {
      console.error('Erreur suppression pièce:', error)
      throw error
    }
  }

  return {
    spareParts,
    total,
    loading,
    fetchSpareParts,
    updateStock,
    deleteSparePart
  }
}
