-- ==============================================================================
-- Migration Supabase : Authentification et Validation des Utilisateurs (Dépannage_entretien)
-- Auteur : App à la Carte — Hervé CHAMPAGNE EI
-- Date : 2026-11-01
-- Description :
--   1. Alignement de la table public.utilisateurs pour le workflow de demande d'accès
--   2. Ajout des colonnes de statut (EN_ATTENTE, VALIDE, REFUSE), date de demande, validateur
--   3. Assouplissement de la contrainte CHECK sur le rôle pour tous les rôles métier
--   4. Insertion / Mise à jour de contact@appalacarte.fr comme ADMINISTRATEUR maître
--   5. Politiques RLS adaptées (permettant la soumission de demandes sans être déjà connecté)
--   6. Rechargement du cache de schéma PostgREST
-- ==============================================================================

-- 1. Ajout des colonnes pour le système de validation d'utilisateurs
ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'VALIDE';

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS motif_demande TEXT;

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS date_demande TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS valide_par TEXT;

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS valide_le TIMESTAMPTZ;

-- 2. Supprimer ou mettre à jour la contrainte CHECK trop restrictive sur le rôle
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'utilisateurs_role_check'
  ) THEN
    ALTER TABLE public.utilisateurs DROP CONSTRAINT utilisateurs_role_check;
  END IF;
END $$;

-- 3. Compte administrateur de référence (App à la Carte - contact@appalacarte.fr)
-- Toujours présent, validé et avec les permissions complètes
INSERT INTO public.utilisateurs (
  email,
  nom,
  prenom,
  role,
  numero_technicien,
  telephone,
  actif,
  statut,
  permissions,
  created_at,
  updated_at
)
VALUES (
  'contact@appalacarte.fr',
  'CHAMPAGNE',
  'Hervé',
  'ADMINISTRATEUR',
  '001',
  NULL,
  true,
  'VALIDE',
  ARRAY['admin_access', 'manage_users', 'view_all_data', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines', 'view_interventions', 'edit_interventions', 'view_spare_parts', 'edit_spare_parts'],
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  nom = 'CHAMPAGNE',
  prenom = 'Hervé',
  role = 'ADMINISTRATEUR',
  actif = true,
  statut = 'VALIDE',
  permissions = ARRAY['admin_access', 'manage_users', 'view_all_data', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines', 'view_interventions', 'edit_interventions', 'view_spare_parts', 'edit_spare_parts'],
  updated_at = NOW();

-- 4. Politiques RLS pour public.utilisateurs
-- Autoriser les utilisateurs non connectés (anon) à insérer leur demande de connexion (EN_ATTENTE)
DROP POLICY IF EXISTS "Demandes acces anonymes" ON public.utilisateurs;
CREATE POLICY "Demandes acces anonymes" ON public.utilisateurs
  FOR INSERT TO anon
  WITH CHECK (statut = 'EN_ATTENTE' OR actif = false);

-- Autoriser la lecture publique pour vérifier si un email est déjà enregistré / en attente
DROP POLICY IF EXISTS "Lecture statut utilisateurs anon" ON public.utilisateurs;
CREATE POLICY "Lecture statut utilisateurs anon" ON public.utilisateurs
  FOR SELECT TO anon
  USING (true);

-- Autoriser les utilisateurs connectés à lire et modifier les profils et valider les demandes
DROP POLICY IF EXISTS "Gestion utilisateurs authentifiés" ON public.utilisateurs;
CREATE POLICY "Gestion utilisateurs authentifiés" ON public.utilisateurs
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Actualiser immédiatement le cache de l'API PostgREST de Supabase
NOTIFY pgrst, 'reload schema';
