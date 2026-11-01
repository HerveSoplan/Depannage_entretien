// useAuth.ts
import { useState, useEffect } from 'react';
import { supabase, isLiveSupabaseActive } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('maintenance_current_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            setUser(null);
          }
          setLoading(false);
          return;
        }

        // Si le mode en ligne Supabase n'est pas activé, on évite tout timeout réseau
        if (!isLiveSupabaseActive()) {
          setUser(null);
          setLoading(false);
          return;
        }

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.warn('Erreur vérification auth (mode local actif):', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const signIn = async (email: string, password?: string) => {
    try {
      // Si mot de passe fourni et mode en ligne activé, tenter Supabase Auth
      if (password && isLiveSupabaseActive()) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (!error && data?.user) {
            setUser(data.user);
            localStorage.setItem('maintenance_authenticated', 'true');
            localStorage.setItem('maintenance_current_user', JSON.stringify(data.user));
            return { user: data.user };
          }
        } catch (supabaseErr) {
          console.warn('Supabase auth non disponible, repli sur connexion locale sans mot de passe:', supabaseErr);
        }
      }

      // Connexion instantanée (mode autonome / démonstration acquéreurs)
      const cleanEmail = email?.trim() || 'contact@appalacarte.fr';
      const mockUser = {
        id: 'usr_' + Date.now(),
        _id: 'usr_' + Date.now(),
        email: cleanEmail,
        nom: cleanEmail.includes('@') ? cleanEmail.split('@')[0].toUpperCase() : 'UTILISATEUR',
        prenom: 'Démo',
        role: 'ADMINISTRATEUR',
        numeroTechnicien: '001',
        actif: true
      };

      setUser(mockUser);
      localStorage.setItem('maintenance_authenticated', 'true');
      localStorage.setItem('maintenance_current_user', JSON.stringify(mockUser));
      return { user: mockUser };
    } catch (error) {
      console.error('Erreur connexion:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('maintenance_authenticated');
      localStorage.removeItem('maintenance_current_user');
      if (isLiveSupabaseActive()) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          // ignore
        }
      }
      setUser(null);
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const stored = localStorage.getItem('maintenance_current_user');
      if (stored) {
        setUser(JSON.parse(stored));
        return;
      }
      if (isLiveSupabaseActive()) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Erreur rafraîchissement user:', error);
    }
  };

  return { 
    user, 
    loading, 
    signIn, 
    signOut, 
    refreshUser 
  };
}
