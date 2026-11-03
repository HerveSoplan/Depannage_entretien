// src/lib/sql/repairScript.ts
// Script officiel de réparation et déblocage RLS pour Supabase (App à la Carte — Version 1.7.7)

export const SUPABASE_REPAIR_SQL = `-- ==============================================================================
-- APPLICATION MAINTENANCE & DÉPANNAGE (APP À LA CARTE)
-- SCRIPT DE RÉPARATION & DÉBLOCAGE COMPLET SUPABASE (RLS & TABLES)
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

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS mot_de_passe_temporaire TEXT;

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS doit_changer_mot_de_passe BOOLEAN DEFAULT TRUE;

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS mot_de_passe TEXT;

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS derniere_connexion TIMESTAMPTZ;

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

-- Assouplissement de la contrainte CHECK sur le rôle
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
ALTER TABLE IF EXISTS public.utilisateurs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accès utilisateurs authentifiés profil" ON public.utilisateurs;
DROP POLICY IF EXISTS "Demandes acces anonymes" ON public.utilisateurs;
DROP POLICY IF EXISTS "Lecture statut utilisateurs anon" ON public.utilisateurs;
DROP POLICY IF EXISTS "Gestion utilisateurs authentifiés" ON public.utilisateurs;
DROP POLICY IF EXISTS "Accès complet utilisateurs app" ON public.utilisateurs;

CREATE POLICY "Accès complet utilisateurs app" ON public.utilisateurs
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 4. ALIGNEMENT DES COLONNES & TYPES DES AUTRES TABLES
-- ==============================================================================

-- Pièces détachées
ALTER TABLE IF EXISTS public.spare_parts
  ADD COLUMN IF NOT EXISTS stock NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_actuel NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seuil_alerte NUMERIC DEFAULT 5,
  ADD COLUMN IF NOT EXISTS stock_minimum NUMERIC DEFAULT 5,
  ADD COLUMN IF NOT EXISTS creator TEXT;

-- Codes erreur
ALTER TABLE IF EXISTS public.error_codes
  ADD COLUMN IF NOT EXISTS cause TEXT,
  ADD COLUMN IF NOT EXISTS action TEXT,
  ADD COLUMN IF NOT EXISTS chapitre TEXT,
  ADD COLUMN IF NOT EXISTS type_alarme TEXT,
  ADD COLUMN IF NOT EXISTS machine_type TEXT DEFAULT 'Tous',
  ADD COLUMN IF NOT EXISTS creator TEXT;

-- Tâches d'entretien
ALTER TABLE IF EXISTS public.taches_entretien
  ADD COLUMN IF NOT EXISTS titre TEXT,
  ADD COLUMN IF NOT EXISTS machine_type TEXT DEFAULT 'Tous',
  ADD COLUMN IF NOT EXISTS kit_number NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS service_number NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS section_id TEXT,
  ADD COLUMN IF NOT EXISTS section_title TEXT,
  ADD COLUMN IF NOT EXISTS task_id TEXT,
  ADD COLUMN IF NOT EXISTS task_label TEXT,
  ADD COLUMN IF NOT EXISTS task_order NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS estimated_duration NUMERIC DEFAULT 5,
  ADD COLUMN IF NOT EXISTS creator TEXT;

ALTER TABLE IF EXISTS public.taches_entretien ALTER COLUMN section_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.taches_entretien ALTER COLUMN titre DROP NOT NULL;

-- Champs machines personnalisés (Création défensive et déblocage complet)
CREATE TABLE IF NOT EXISTS public.machine_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  label TEXT,
  type TEXT DEFAULT 'text',
  field_type TEXT DEFAULT 'text',
  section TEXT DEFAULT 'general',
  machine_type TEXT DEFAULT 'Tous',
  is_required BOOLEAN DEFAULT false,
  "order" NUMERIC DEFAULT 0,
  ordre NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  allow_custom_value BOOLEAN DEFAULT false,
  conditional_rules JSONB,
  creator TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.machine_fields
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS machine_type TEXT DEFAULT 'Tous',
  ADD COLUMN IF NOT EXISTS field_type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "order" NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ordre NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_custom_value BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS conditional_rules JSONB,
  ADD COLUMN IF NOT EXISTS creator TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Suppression des contraintes NOT NULL bloquantes sur machine_fields
ALTER TABLE IF EXISTS public.machine_fields ALTER COLUMN name DROP NOT NULL;
ALTER TABLE IF EXISTS public.machine_fields ALTER COLUMN label DROP NOT NULL;
ALTER TABLE IF EXISTS public.machine_fields ALTER COLUMN type DROP NOT NULL;
ALTER TABLE IF EXISTS public.machine_fields ALTER COLUMN section DROP NOT NULL;

-- Options de champs machines (Création défensive et assouplissement)
CREATE TABLE IF NOT EXISTS public.machine_field_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id TEXT,
  label TEXT,
  value TEXT,
  "order" NUMERIC DEFAULT 0,
  ordre NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  machine_type TEXT,
  creator TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.machine_field_options
  ADD COLUMN IF NOT EXISTS field_id TEXT,
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS value TEXT,
  ADD COLUMN IF NOT EXISTS "order" NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ordre NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS machine_type TEXT,
  ADD COLUMN IF NOT EXISTS creator TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS public.machine_field_options ALTER COLUMN label DROP NOT NULL;
ALTER TABLE IF EXISTS public.machine_field_options ALTER COLUMN value DROP NOT NULL;
ALTER TABLE IF EXISTS public.machine_field_options ALTER COLUMN field_id DROP NOT NULL;

-- Clients
ALTER TABLE IF EXISTS public.clients
  ADD COLUMN IF NOT EXISTS creator TEXT;

-- Kits d'entretien
ALTER TABLE IF EXISTS public.maintenance_kits
  ADD COLUMN IF NOT EXISTS kit_id TEXT,
  ADD COLUMN IF NOT EXISTS kit_number NUMERIC,
  ADD COLUMN IF NOT EXISTS service_number NUMERIC,
  ADD COLUMN IF NOT EXISTS machine_type TEXT,
  ADD COLUMN IF NOT EXISTS pieces JSONB,
  ADD COLUMN IF NOT EXISTS creator TEXT;

-- ==============================================================================
-- 5. DÉBLOCAGE INCONDITIONNEL DES POLITIQUES RLS SUR TOUTES LES TABLES
-- ==============================================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Accès complet %I app" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Accès complet app %I" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Accès complet %I app" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
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

-- Nettoyage des tests éventuels
DELETE FROM public.utilisateurs WHERE email = 'jean.test@example.com';

-- 6. RECHARGEMENT IMMÉDIAT DU CACHE POSTGREST
NOTIFY pgrst, 'reload schema';
`;
