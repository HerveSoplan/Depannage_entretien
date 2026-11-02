-- ==============================================================================
-- APPLICATION MAINTENANCE & DÉPANNAGE (APP À LA CARTE)
-- SCRIPT DE RÉPARATION & DÉBLOCAGE COMPLET SUPABASE
-- Tables : utilisateurs, clients, machines, interventions
-- Auteur : App à la Carte — Hervé CHAMPAGNE EI
-- Date : 2026-11-02
-- Version : 1.7.7
-- ==============================================================================
-- INSTRUCTIONS D'EXÉCUTION (1 MINUTE) :
-- 1. Connectez-vous sur votre tableau de bord Supabase : https://supabase.com/dashboard
-- 2. Ouvrez votre projet (syrznjjxyvbbkahaavdf)
-- 3. Dans le menu de gauche, cliquez sur "SQL Editor" (icône >_)
-- 4. Cliquez sur "New query"
-- 5. Collez l'intégralité de ce script et cliquez sur "Run" (ou Ctrl + Entrée)
-- ==============================================================================

-- 1. EXTENSIONS NÉCESSAIRES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. ALIGNEMENT DE LA TABLE public.utilisateurs (COLONNES & TYPES)
-- ==============================================================================

-- Ajout des colonnes de gestion de mot de passe et de sécurité
ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS mot_de_passe_temporaire TEXT;

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS doit_changer_mot_de_passe BOOLEAN DEFAULT TRUE;

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS mot_de_passe TEXT;

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS derniere_connexion TIMESTAMPTZ;

-- Ajout des colonnes de validation et de statut
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

-- Assouplissement de la contrainte CHECK sur le rôle (pour autoriser tous les rôles métiers)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'utilisateurs_role_check'
  ) THEN
    ALTER TABLE public.utilisateurs DROP CONSTRAINT utilisateurs_role_check;
  END IF;
END $$;

-- ==============================================================================
-- 3. DÉBLOCAGE DES POLITIQUES RLS SUR public.utilisateurs
-- ==============================================================================
-- L'application web cliente accède à Supabase via la clé anon (publique).
-- Les politiques ci-dessous autorisent l'application à lire, créer, valider,
-- modifier et supprimer des utilisateurs en direct dans Supabase.

ALTER TABLE IF EXISTS public.utilisateurs ENABLE ROW LEVEL SECURITY;

-- Suppression des anciennes politiques restrictives
DROP POLICY IF EXISTS "Accès utilisateurs authentifiés profil" ON public.utilisateurs;
DROP POLICY IF EXISTS "Demandes acces anonymes" ON public.utilisateurs;
DROP POLICY IF EXISTS "Lecture statut utilisateurs anon" ON public.utilisateurs;
DROP POLICY IF EXISTS "Gestion utilisateurs authentifiés" ON public.utilisateurs;
DROP POLICY IF EXISTS "Accès complet utilisateurs app" ON public.utilisateurs;

-- Création des politiques complètes pour anon et authenticated
CREATE POLICY "Accès complet utilisateurs app" ON public.utilisateurs
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 4. DÉBLOCAGE RLS DES AUTRES TABLES APPLICATIVES
-- ==============================================================================
-- Permet aux écrans de créer et modifier les clients, machines, interventions
-- même sans être connecté via Supabase Auth GoTrue.

DO $$
BEGIN
  -- Clients
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
    ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Accès utilisateurs authentifiés" ON public.clients;
    DROP POLICY IF EXISTS "Accès complet clients app" ON public.clients;
    CREATE POLICY "Accès complet clients app" ON public.clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Machines
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'machines') THEN
    ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Accès machines authentifiés" ON public.machines;
    DROP POLICY IF EXISTS "Accès complet machines app" ON public.machines;
    CREATE POLICY "Accès complet machines app" ON public.machines FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Interventions
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'interventions') THEN
    ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Accès interventions authentifiés" ON public.interventions;
    DROP POLICY IF EXISTS "Accès complet interventions app" ON public.interventions;
    CREATE POLICY "Accès complet interventions app" ON public.interventions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Protocoles installation
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'installation_protocols') THEN
    ALTER TABLE public.installation_protocols ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Accès protocoles installation" ON public.installation_protocols;
    DROP POLICY IF EXISTS "Accès complet protocoles installation app" ON public.installation_protocols;
    CREATE POLICY "Accès complet protocoles installation app" ON public.installation_protocols FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Protocoles mise en service
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'commissioning_protocols') THEN
    ALTER TABLE public.commissioning_protocols ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Accès protocoles mise en service" ON public.commissioning_protocols;
    DROP POLICY IF EXISTS "Accès complet protocoles mise en service app" ON public.commissioning_protocols;
    CREATE POLICY "Accès complet protocoles mise en service app" ON public.commissioning_protocols FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Pièces détachées
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'spare_parts') THEN
    ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Lecture publique pièces" ON public.spare_parts;
    DROP POLICY IF EXISTS "Accès complet pieces app" ON public.spare_parts;
    CREATE POLICY "Accès complet pieces app" ON public.spare_parts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Messages clients
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_messages') THEN
    ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Accès messages clients authentifiés" ON public.client_messages;
    DROP POLICY IF EXISTS "Accès complet client_messages app" ON public.client_messages;
    CREATE POLICY "Accès complet client_messages app" ON public.client_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- 5. COMPTE ADMINISTRATEUR MAÎTRE DE RÉFÉRENCE (App à la Carte)
-- ==============================================================================
INSERT INTO public.utilisateurs (
  email,
  nom,
  prenom,
  role,
  numero_technicien,
  telephone,
  actif,
  statut,
  doit_changer_mot_de_passe,
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
  false,
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
  doit_changer_mot_de_passe = false,
  permissions = ARRAY['admin_access', 'manage_users', 'view_all_data', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines', 'view_interventions', 'edit_interventions', 'view_spare_parts', 'edit_spare_parts'],
  updated_at = NOW();

-- Nettoyage éventuel des utilisateurs tests temporaires
DELETE FROM public.utilisateurs WHERE email = 'jean.test@example.com';

-- ==============================================================================
-- 6. RECHARGEMENT IMMÉDIAT DU CACHE POSTGREST SUPABASE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
