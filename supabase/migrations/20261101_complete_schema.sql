-- ==============================================================================
-- APPLICATION MAINTENANCE & DÉPANNAGE (APP À LA CARTE)
-- SCRIPT DE CRÉATION COMPLET DU SCHÉMA SUPABASE POSTGRESQL
-- Version : 1.3.0
-- ==============================================================================
-- INSTRUCTIONS D'EXÉCUTION :
-- 1. Connectez-vous à votre tableau de bord Supabase : https://supabase.com/dashboard
-- 2. Sélectionnez votre projet (ou créez-en un nouveau).
-- 3. Dans le menu de gauche, cliquez sur "SQL Editor" (icône >_).
-- 4. Cliquez sur "New query".
-- 5. Collez l'intégralité de ce fichier et cliquez sur "Run" (ou Ctrl + Entrée).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLES FONDAMENTALES
-- ==============================================================================

-- TABLE: utilisateurs (Techniciens, Responsables, Administrateurs)
CREATE TABLE IF NOT EXISTS public.utilisateurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'technicien' CHECK (role IN ('admin', 'ADMINISTRATEUR', 'technicien', 'manager', 'RESPONSABLE_TECHNIQUE', 'TECHNICIEN_CMS', 'TECHNICIEN_VMS')),
  numero_technicien TEXT,
  telephone TEXT,
  actif BOOLEAN DEFAULT true,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: clients (Exploitations, Clients professionnels)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_client TEXT UNIQUE,
  nom TEXT NOT NULL,
  nom_ferme TEXT,
  adresse TEXT,
  ville TEXT,
  code_postal TEXT,
  pays TEXT DEFAULT 'France',
  telephone TEXT,
  email TEXT,
  contact_principal TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  notes TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_nom ON public.clients(nom);
CREATE INDEX IF NOT EXISTS idx_clients_ville ON public.clients(ville);

-- TABLE: machines (Équipements et machines des clients)
CREATE TABLE IF NOT EXISTS public.machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  numero_serie TEXT UNIQUE,
  modele TEXT NOT NULL,
  type_machine TEXT,
  type_relation TEXT,
  config_type TEXT,
  pump_type TEXT,
  v300_option TEXT,
  custom_fields JSONB DEFAULT '{}',
  date_installation DATE,
  compteur INTEGER DEFAULT 0,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  statut TEXT DEFAULT 'active' CHECK (statut IN ('active', 'maintenance', 'inactive')),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machines_client ON public.machines(client_id);
CREATE INDEX IF NOT EXISTS idx_machines_numero_serie ON public.machines(numero_serie);

-- TABLE: interventions (Bons d'intervention, dépannages, entretiens)
CREATE TABLE IF NOT EXISTS public.interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_intervention TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  type_intervention TEXT NOT NULL CHECK (type_intervention IN ('installation', 'mise_en_service', 'maintenance', 'depannage', 'controle')),
  statut TEXT DEFAULT 'planifiee' CHECK (statut IN ('planifiee', 'en_cours', 'terminee', 'annulee')),
  date_prevue DATE,
  date_debut TIMESTAMPTZ,
  date_fin TIMESTAMPTZ,
  technicien_principal_id UUID REFERENCES public.utilisateurs(id),
  techniciens_ids UUID[] DEFAULT '{}',
  description TEXT,
  observations TEXT,
  pieces_utilisees JSONB DEFAULT '[]',
  temps_passe INTEGER DEFAULT 0, -- en minutes
  gps_logs JSONB DEFAULT '[]',
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interventions_client ON public.interventions(client_id);
CREATE INDEX IF NOT EXISTS idx_interventions_machine ON public.interventions(machine_id);
CREATE INDEX IF NOT EXISTS idx_interventions_statut ON public.interventions(statut);
CREATE INDEX IF NOT EXISTS idx_interventions_date_prevue ON public.interventions(date_prevue);

-- TABLE: installation_protocols (Comptes-rendus et protocoles de montage)
CREATE TABLE IF NOT EXISTS public.installation_protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID UNIQUE REFERENCES public.interventions(id) ON DELETE CASCADE,
  montage_id TEXT,
  client_id UUID REFERENCES public.clients(id),
  numero_intervention TEXT,
  statut TEXT DEFAULT 'BROUILLON' CHECK (statut IN ('BROUILLON', 'EN_COURS', 'TERMINEE')),
  chef_de_chantier_id UUID REFERENCES public.utilisateurs(id),
  machines JSONB DEFAULT '[]',
  sections JSONB DEFAULT '[]',
  temps_total INTEGER DEFAULT 0,
  gps_logs JSONB DEFAULT '[]',
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installation_intervention ON public.installation_protocols(intervention_id);

-- TABLE: commissioning_protocols (Protocoles de mise en service)
CREATE TABLE IF NOT EXISTS public.commissioning_protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID UNIQUE REFERENCES public.interventions(id) ON DELETE CASCADE,
  session JSONB NOT NULL DEFAULT '{}',
  verifications JSONB NOT NULL DEFAULT '{}',
  progress JSONB DEFAULT '{"total": 0, "completed": 0}',
  statut TEXT DEFAULT 'draft' CHECK (statut IN ('draft', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissioning_intervention ON public.commissioning_protocols(intervention_id);

-- TABLE: spare_parts (Catalogue de pièces détachées et gestion de stock)
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL,
  designation TEXT NOT NULL,
  categorie TEXT,
  stock INTEGER DEFAULT 0,
  seuil_alerte INTEGER DEFAULT 5,
  prix_unitaire DECIMAL(10,2) DEFAULT 0.00,
  fournisseur TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spare_parts_reference ON public.spare_parts(reference);
CREATE INDEX IF NOT EXISTS idx_spare_parts_stock ON public.spare_parts(stock);

-- TABLE: maintenance_kits (Kits d'entretien périodiques)
CREATE TABLE IF NOT EXISTS public.maintenance_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  kit_number INTEGER NOT NULL,
  service_number INTEGER NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  pieces JSONB DEFAULT '[]',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kit_id, machine_type, kit_number, service_number)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_kits_machine_type ON public.maintenance_kits(machine_type);

-- TABLE: taches_entretien (Tâches unitaires des interventions d'entretien)
CREATE TABLE IF NOT EXISTS public.taches_entretien (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  kit_number INTEGER NOT NULL,
  service_number INTEGER NOT NULL,
  section_id TEXT NOT NULL,
  section_title TEXT NOT NULL,
  task_id TEXT NOT NULL,
  task_label TEXT NOT NULL,
  task_order INTEGER DEFAULT 0,
  is_critical BOOLEAN DEFAULT false,
  estimated_duration INTEGER DEFAULT 0, -- en minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_taches_kit ON public.taches_entretien(kit_id, machine_type);
CREATE INDEX IF NOT EXISTS idx_taches_section ON public.taches_entretien(section_id);

-- TABLE: error_codes (Base de diagnostics et codes pannes)
CREATE TABLE IF NOT EXISTS public.error_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alarme TEXT UNIQUE NOT NULL,
  type_alarme TEXT,
  chapitre TEXT,
  titre TEXT,
  description TEXT,
  solution TEXT,
  priorite TEXT CHECK (priorite IN ('basse', 'moyenne', 'haute', 'critique')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_codes_alarme ON public.error_codes(alarme);
CREATE INDEX IF NOT EXISTS idx_error_codes_priorite ON public.error_codes(priorite);

-- TABLE: machine_fields (Champs dynamiques configurables pour les machines)
CREATE TABLE IF NOT EXISTS public.machine_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_type TEXT DEFAULT 'Tous',
  label TEXT NOT NULL,
  field_type TEXT DEFAULT 'text' CHECK (field_type IN ('text', 'number', 'date', 'select', 'checkbox')),
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  allow_custom_value BOOLEAN DEFAULT false,
  conditional_rules JSONB,
  creator TEXT,
  creator_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machine_fields_type ON public.machine_fields(machine_type);

-- TABLE: machine_field_options (Options des listes déroulantes des champs personnalisés)
CREATE TABLE IF NOT EXISTS public.machine_field_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID REFERENCES public.machine_fields(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_options_field ON public.machine_field_options(field_id);

-- TABLE: languages (Langues du système)
CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: translations (Dictionnaire multilingue)
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  language_code TEXT NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  value TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, language_code)
);

CREATE INDEX IF NOT EXISTS idx_translations_key ON public.translations(key);
CREATE INDEX IF NOT EXISTS idx_translations_lang ON public.translations(language_code);

-- TABLE: client_messages (Messagerie et alertes transmises)
CREATE TABLE IF NOT EXISTS public.client_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  intervention_id UUID REFERENCES public.interventions(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'urgent')),
  sujet TEXT NOT NULL,
  message TEXT NOT NULL,
  lu BOOLEAN DEFAULT false,
  date_lu TIMESTAMPTZ,
  expediteur_id UUID REFERENCES public.utilisateurs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_messages_client ON public.client_messages(client_id);

-- ==============================================================================
-- 3. TRIGGERS AUTOMATIQUES (HORODATAGE updated_at)
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;', t, t);
    EXECUTE format('
      CREATE TRIGGER update_%I_updated_at 
      BEFORE UPDATE ON %I 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END;
$$;

-- ==============================================================================
-- 4. VUES SQL
-- ==============================================================================

CREATE OR REPLACE VIEW public.v_interventions_details AS
SELECT 
  i.*,
  c.nom as client_nom,
  c.ville as client_ville,
  m.numero_serie as machine_numero_serie,
  m.modele as machine_modele,
  u.nom || ' ' || u.prenom as technicien_nom
FROM public.interventions i
LEFT JOIN public.clients c ON i.client_id = c.id
LEFT JOIN public.machines m ON i.machine_id = m.id
LEFT JOIN public.utilisateurs u ON i.technicien_principal_id = u.id;

CREATE OR REPLACE VIEW public.v_machines_with_client AS
SELECT 
  m.*,
  c.nom as client_nom,
  c.ville as client_ville,
  c.latitude as client_latitude,
  c.longitude as client_longitude
FROM public.machines m
LEFT JOIN public.clients c ON m.client_id = c.id;

-- ==============================================================================
-- 5. SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installation_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissioning_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taches_entretien ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_field_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

-- Politiques ouvertes pour l'application cliente (anon et authenticated)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Accès complet application" ON %I;', t);
    EXECUTE format('
      CREATE POLICY "Accès complet application" ON %I
      FOR ALL
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
    ', t);
  END LOOP;
END;
$$;

-- ==============================================================================
-- 6. DONNÉES INITIALES ESSENTIELLES
-- ==============================================================================

-- Langues par défaut
INSERT INTO public.languages (code, name, native_name, is_active, is_default) VALUES
  ('fr', 'Français', 'Français', true, true),
  ('en', 'English', 'English', true, false)
ON CONFLICT (code) DO NOTHING;

-- Administrateur par défaut
INSERT INTO public.utilisateurs (email, nom, prenom, role, permissions) VALUES
  ('contact@appalacarte.fr', 'CHAMPAGNE', 'Hervé', 'ADMINISTRATEUR', ARRAY['admin_access', 'manage_users', 'view_all_data'])
ON CONFLICT (email) DO NOTHING;

-- Message de fin
DO $$
BEGIN
  RAISE NOTICE '✅ Félicitations ! Toutes les tables de Maintenance & Dépannage ont été créées avec succès.';
END $$;
