-- ==============================================================================
-- APPLICATION MAINTENANCE & DÉPANNAGE (APP À LA CARTE)
-- SCRIPT DE RÉPARATION & ALIGNEMENT DES TABLES KITS ET TÂCHES D'ENTRETIEN
-- ==============================================================================
-- À copier-coller et exécuter dans Supabase SQL Editor (icône >_)
-- Résout l'erreur : "Could not find the 'kit_id' column of 'maintenance_kits' in the schema cache (PGRST204)"
-- ==============================================================================

-- 1. ACTIVER EXTENSION UUID SI NÉCESSAIRE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. AJOUTER LES COLONNES MANQUANTES DANS maintenance_kits
ALTER TABLE IF EXISTS public.maintenance_kits ADD COLUMN IF NOT EXISTS kit_id TEXT;
ALTER TABLE IF EXISTS public.maintenance_kits ADD COLUMN IF NOT EXISTS machine_type TEXT;
ALTER TABLE IF EXISTS public.maintenance_kits ADD COLUMN IF NOT EXISTS kit_number BIGINT;
ALTER TABLE IF EXISTS public.maintenance_kits ADD COLUMN IF NOT EXISTS service_number INTEGER DEFAULT 1;
ALTER TABLE IF EXISTS public.maintenance_kits ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE IF EXISTS public.maintenance_kits ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS public.maintenance_kits ADD COLUMN IF NOT EXISTS pieces JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS public.maintenance_kits ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.maintenance_kits ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.maintenance_kits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Créer la table si elle n'existait pas du tout
CREATE TABLE IF NOT EXISTS public.maintenance_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id TEXT,
  machine_type TEXT,
  kit_number BIGINT,
  service_number INTEGER DEFAULT 1,
  nom TEXT,
  description TEXT,
  pieces JSONB DEFAULT '[]',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour accélérer les recherches de kits
CREATE INDEX IF NOT EXISTS idx_maintenance_kits_machine_type ON public.maintenance_kits(machine_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_kits_kit_id ON public.maintenance_kits(kit_id);

-- 3. AJOUTER LES COLONNES MANQUANTES DANS taches_entretien
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS kit_id TEXT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS machine_type TEXT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS kit_number BIGINT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS service_number INTEGER DEFAULT 1;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS section_id TEXT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS section_title TEXT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS task_id TEXT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS task_label TEXT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS task_order INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 5;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS id_tache TEXT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS module TEXT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS etat TEXT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS ref_piece TEXT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS quantite TEXT;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS ordre INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.taches_entretien ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.taches_entretien (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id TEXT,
  machine_type TEXT,
  kit_number BIGINT,
  service_number INTEGER DEFAULT 1,
  section_id TEXT,
  section_title TEXT,
  task_id TEXT,
  task_label TEXT,
  task_order INTEGER DEFAULT 0,
  is_critical BOOLEAN DEFAULT false,
  estimated_duration INTEGER DEFAULT 5,
  id_tache TEXT,
  section TEXT,
  description TEXT,
  module TEXT,
  etat TEXT,
  ref_piece TEXT,
  quantite TEXT,
  ordre INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_taches_entretien_kit_id ON public.taches_entretien(kit_id);
CREATE INDEX IF NOT EXISTS idx_taches_entretien_machine_type ON public.taches_entretien(machine_type);

-- 4. AUTORISATIONS RLS (ROW LEVEL SECURITY)
ALTER TABLE public.maintenance_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taches_entretien ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accès kits maintenance authentifiés" ON public.maintenance_kits;
DROP POLICY IF EXISTS "Accès kits maintenance complet" ON public.maintenance_kits;
CREATE POLICY "Accès kits maintenance complet" ON public.maintenance_kits
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Accès tâches entretien authentifiés" ON public.taches_entretien;
DROP POLICY IF EXISTS "Accès tâches entretien complet" ON public.taches_entretien;
CREATE POLICY "Accès tâches entretien complet" ON public.taches_entretien
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. FORCER LE RECHARGEMENT DU CACHE POSTGREST DANS SUPABASE
NOTIFY pgrst, 'reload schema';

SELECT '✅ Réparation terminée avec succès ! Le cache Supabase est rechargé et les colonnes kit_id sont actives.' AS statut;
