//useUsers.ts
import { useState, useCallback } from 'react'
import { db } from '../lib/supabase'

export function useUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchUsers = useCallback(async (options?: {
    filter?: Record<string, any>
    sort?: Record<string, 1 | -1>
    limit?: number
    skip?: number
  }) => {
    setLoading(true)
    try {
      // Correction: db.users au lieu de db.utilisateurs et réponse directe (tableau)
      const data = await db.users.list()

      // Filtrage manuel si nécessaire car l'API mockée ne le fait pas
      let filteredData = data || []

      if (options?.filter && options.filter.actif !== undefined) {
        filteredData = filteredData.filter((u: any) => u.actif === options.filter?.actif)
      }

      setUsers(filteredData)
      setTotal(filteredData.length)
      console.log('Utilisateurs chargés:', filteredData)
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
      setUsers([]) // État de repli sûr
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const createUser = async (userData: any) => {
    try {
      const newUser = await db.users.create(userData)
      console.log('Utilisateur créé:', newUser)
      await fetchUsers()
      return newUser
    } catch (error) {
      console.error('Erreur création utilisateur:', error)
      throw error
    }
  }

  const updateUser = async (id: string, updates: any) => {
    if (typeof id !== 'string') {
      throw new Error('ID doit être une chaîne')
    }
    try {
      const updated = await db.users.update(id, updates)
      console.log('Utilisateur mis à jour:', updated)
      await fetchUsers()
      return updated
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error)
      throw error
    }
  }

  const deleteUser = async (id: string) => {
    if (typeof id !== 'string') {
      throw new Error('ID invalide')
    }
    try {
      await db.users.delete(id)
      console.log('Utilisateur supprimé:', id)
      await fetchUsers()
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error)
      throw error
    }
  }

  return {
    users,
    total,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  }
}
