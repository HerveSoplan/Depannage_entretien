-- Migration initiale - Schéma de base de données Dépannage_entretien
-- Créé le: 2026-02-07

-- Activation des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- TABLE: utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS utilisateurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'technicien', 'manager')),
  numero_technicien TEXT,
  telephone TEXT,
  actif BOOLEAN DEFAULT true,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: clients
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
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

-- Index géospatial pour les clients
CREATE INDEX IF NOT EXISTS idx_clients_location ON clients USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- ============================================
-- TABLE: machines
-- ============================================
CREATE TABLE IF NOT EXISTS machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  numero_serie TEXT UNIQUE,
  modele TEXT NOT NULL,
  type_machine TEXT,
  type_relation TEXT,
  config_type TEXT CHECK (config_type IN ('pump', 'v300', 'other', '')),
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

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_machines_client ON machines(client_id);
CREATE INDEX IF NOT EXISTS idx_machines_location ON machines USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- ============================================
-- TABLE: interventions
-- ============================================
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_intervention TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  type_intervention TEXT NOT NULL CHECK (type_intervention IN ('installation', 'mise_en_service', 'maintenance', 'depannage', 'controle')),
  statut TEXT DEFAULT 'planifiee' CHECK (statut IN ('planifiee', 'en_cours', 'terminee', 'annulee')),
  date_prevue DATE,
  date_debut TIMESTAMPTZ,
  date_fin TIMESTAMPTZ,
  technicien_principal_id UUID REFERENCES utilisateurs(id),
  techniciens_ids UUID[] DEFAULT '{}',
  description TEXT,
  observations TEXT,
  pieces_utilisees JSONB DEFAULT '[]',
  temps_passe INTEGER DEFAULT 0, -- minutes
  gps_logs JSONB DEFAULT '[]',
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interventions_client ON interventions(client_id);
CREATE INDEX IF NOT EXISTS idx_interventions_machine ON interventions(machine_id);
CREATE INDEX IF NOT EXISTS idx_interventions_statut ON interventions(statut);
CREATE INDEX IF NOT EXISTS idx_interventions_date ON interventions(date_prevue);

-- ============================================
-- TABLE: installation_protocols
-- ============================================
CREATE TABLE IF NOT EXISTS installation_protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID UNIQUE REFERENCES interventions(id) ON DELETE CASCADE,
  montage_id TEXT,
  client_id UUID REFERENCES clients(id),
  numero_intervention TEXT,
  statut TEXT DEFAULT 'BROUILLON' CHECK (statut IN ('BROUILLON', 'EN_COURS', 'TERMINEE')),
  chef_de_chantier_id UUID REFERENCES utilisateurs(id),
  machines JSONB DEFAULT '[]',
  sections JSONB DEFAULT '[]',
  temps_total INTEGER DEFAULT 0,
  gps_logs JSONB DEFAULT '[]',
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installation_intervention ON installation_protocols(intervention_id);

-- ============================================
-- TABLE: commissioning_protocols
-- ============================================
CREATE TABLE IF NOT EXISTS commissioning_protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID UNIQUE REFERENCES interventions(id) ON DELETE CASCADE,
  session JSONB NOT NULL,
  verifications JSONB NOT NULL,
  progress JSONB DEFAULT '{"total": 0, "completed": 0}',
  statut TEXT DEFAULT 'draft' CHECK (statut IN ('draft', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissioning_intervention ON commissioning_protocols(intervention_id);

-- ============================================
-- TABLE: spare_parts (pièces détachées)
-- ============================================
CREATE TABLE IF NOT EXISTS spare_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL,
  designation TEXT NOT NULL,
  categorie TEXT,
  stock INTEGER DEFAULT 0,
  seuil_alerte INTEGER DEFAULT 5,
  prix_unitaire DECIMAL(10,2),
  fournisseur TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spare_parts_reference ON spare_parts(reference);
CREATE INDEX IF NOT EXISTS idx_spare_parts_stock ON spare_parts(stock);

-- ============================================
-- TABLE: maintenance_kits
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_kits (
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

CREATE INDEX IF NOT EXISTS idx_maintenance_kits_machine_type ON maintenance_kits(machine_type);

-- ============================================
-- TABLE: taches_entretien
-- ============================================
CREATE TABLE IF NOT EXISTS taches_entretien (
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
  estimated_duration INTEGER, -- minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_taches_kit ON taches_entretien(kit_id, machine_type);
CREATE INDEX IF NOT EXISTS idx_taches_section ON taches_entretien(section_id);

-- ============================================
-- TABLE: error_codes
-- ============================================
CREATE TABLE IF NOT EXISTS error_codes (
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

CREATE INDEX IF NOT EXISTS idx_error_codes_alarme ON error_codes(alarme);
CREATE INDEX IF NOT EXISTS idx_error_codes_priorite ON error_codes(priorite);

-- ============================================
-- TABLE: machine_fields (champs dynamiques)
-- ============================================
CREATE TABLE IF NOT EXISTS machine_fields (
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

CREATE INDEX IF NOT EXISTS idx_machine_fields_type ON machine_fields(machine_type);
CREATE INDEX IF NOT EXISTS idx_machine_fields_active ON machine_fields(is_active);

-- ============================================
-- TABLE: machine_field_options
-- ============================================
CREATE TABLE IF NOT EXISTS machine_field_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID REFERENCES machine_fields(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_options_field ON machine_field_options(field_id);

-- ============================================
-- TABLE: languages
-- ============================================
CREATE TABLE IF NOT EXISTS languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- ex: 'fr', 'en', 'es'
  name TEXT NOT NULL, -- ex: 'Français'
  native_name TEXT NOT NULL, -- ex: 'Français'
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les langues par défaut
INSERT INTO languages (code, name, native_name, is_active, is_default) VALUES
  ('fr', 'Français', 'Français', true, true),
  ('en', 'English', 'English', true, false)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- TABLE: translations
-- ============================================
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  value TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, language_code)
);

CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key);
CREATE INDEX IF NOT EXISTS idx_translations_lang ON translations(language_code);

-- ============================================
-- TABLE: client_messages
-- ============================================
CREATE TABLE IF NOT EXISTS client_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  intervention_id UUID REFERENCES interventions(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'urgent')),
  sujet TEXT NOT NULL,
  message TEXT NOT NULL,
  lu BOOLEAN DEFAULT false,
  date_lu TIMESTAMPTZ,
  expediteur_id UUID REFERENCES utilisateurs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_messages_client ON client_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_lu ON client_messages(lu);

-- ============================================
-- FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger sur toutes les tables avec updated_at
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
    EXECUTE format('
      CREATE TRIGGER update_%I_updated_at 
      BEFORE UPDATE ON %I 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissioning_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE taches_entretien ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_field_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;

-- Politique par défaut : accès complet pour utilisateurs authentifiés
-- (À affiner selon vos besoins de sécurité)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('
      CREATE POLICY "Allow all for authenticated users" ON %I
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
    ', t);
  END LOOP;
END;
$$;

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue des interventions avec détails
CREATE OR REPLACE VIEW v_interventions_details AS
SELECT 
  i.*,
  c.nom as client_nom,
  c.ville as client_ville,
  m.numero_serie as machine_numero_serie,
  m.modele as machine_modele,
  u.nom || ' ' || u.prenom as technicien_nom
FROM interventions i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN machines m ON i.machine_id = m.id
LEFT JOIN utilisateurs u ON i.technicien_principal_id = u.id;

-- Vue des machines avec localisation client
CREATE OR REPLACE VIEW v_machines_with_client AS
SELECT 
  m.*,
  c.nom as client_nom,
  c.ville as client_ville,
  c.latitude as client_latitude,
  c.longitude as client_longitude
FROM machines m
LEFT JOIN clients c ON m.client_id = c.id;

-- ============================================
-- DONNÉES DE TEST (optionnel)
-- ============================================

-- Créer un utilisateur admin par défaut
INSERT INTO utilisateurs (email, nom, prenom, role, permissions) VALUES
  ('contact@appalacarte.fr', 'CHAMPAGNE', 'Hervé', 'admin', ARRAY['admin_access', 'manage_users', 'view_all_data'])
ON CONFLICT (email) DO NOTHING;

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE 'Migration initiale terminée avec succès!';
  RAISE NOTICE 'Base de données Dépannage_entretien prête à l''emploi.';
END $$;
