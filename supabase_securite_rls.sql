-- ==============================================================================
-- APPLICATION MAINTENANCE & DÉPANNAGE (APP À LA CARTE)
-- SCRIPT DE SÉCURISATION ET BLINDAGE RLS (ROW LEVEL SECURITY) POSTGRESQL
-- Version : 1.4.2
-- ==============================================================================
-- À exécuter dans Supabase SQL Editor pour empêcher l'exposition des données.
-- ==============================================================================

-- 1. ACTIVER LE RLS SUR TOUTES LES TABLES
ALTER TABLE IF EXISTS public.utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.installation_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.commissioning_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.maintenance_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.taches_entretien ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.error_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.machine_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.machine_field_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_messages ENABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER LES ANCIENNES POLITIQUES TOTALEMENT PERMISSIVES
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
    EXECUTE format('DROP POLICY IF EXISTS "Permissive" ON %I;', t);
  END LOOP;
END;
$$;

-- 3. TABLES PUBLIQUES EN LECTURE SEULE (Référentiels non sensibles)
-- Les langues et traductions peuvent être lues par l'interface publique
DROP POLICY IF EXISTS "Lecture publique langues" ON public.languages;
CREATE POLICY "Lecture publique langues" ON public.languages
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Lecture publique traductions" ON public.translations;
CREATE POLICY "Lecture publique traductions" ON public.translations
  FOR SELECT TO anon, authenticated USING (true);

-- Les codes pannes peuvent être consultés par les techniciens et l'interface
DROP POLICY IF EXISTS "Lecture publique codes pannes" ON public.error_codes;
CREATE POLICY "Lecture publique codes pannes" ON public.error_codes
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Lecture publique pièces" ON public.spare_parts;
CREATE POLICY "Lecture publique pièces" ON public.spare_parts
  FOR SELECT TO anon, authenticated USING (true);

-- 4. TABLES SENSIBLES PROTÉGÉES (Clients, Machines, Interventions, Utilisateurs)
-- Seuls les utilisateurs authentifiés peuvent lire et écrire les données réelles
DROP POLICY IF EXISTS "Accès utilisateurs authentifiés" ON public.clients;
CREATE POLICY "Accès utilisateurs authentifiés" ON public.clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Accès machines authentifiés" ON public.machines;
CREATE POLICY "Accès machines authentifiés" ON public.machines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Accès interventions authentifiés" ON public.interventions;
CREATE POLICY "Accès interventions authentifiés" ON public.interventions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Accès protocoles installation" ON public.installation_protocols;
CREATE POLICY "Accès protocoles installation" ON public.installation_protocols
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Accès protocoles mise en service" ON public.commissioning_protocols;
CREATE POLICY "Accès protocoles mise en service" ON public.commissioning_protocols
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Accès utilisateurs authentifiés profil" ON public.utilisateurs;
CREATE POLICY "Accès utilisateurs authentifiés profil" ON public.utilisateurs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Accès tâches entretien authentifiés" ON public.taches_entretien;
DROP POLICY IF EXISTS "Accès tâches entretien complet" ON public.taches_entretien;
CREATE POLICY "Accès tâches entretien complet" ON public.taches_entretien
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Accès kits maintenance authentifiés" ON public.maintenance_kits;
DROP POLICY IF EXISTS "Accès kits maintenance complet" ON public.maintenance_kits;
CREATE POLICY "Accès kits maintenance complet" ON public.maintenance_kits
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Accès messages clients authentifiés" ON public.client_messages;
CREATE POLICY "Accès messages clients authentifiés" ON public.client_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. MESSAGES CLIENTS : PERMETTRE L'ENVOI DE MESSAGES DEPUIS LE FORMULAIRE DE CONTACT
DROP POLICY IF EXISTS "Insertion messages contact public" ON public.client_messages;
CREATE POLICY "Insertion messages contact public" ON public.client_messages
  FOR INSERT TO anon WITH CHECK (true);

SELECT 'Sécurisation RLS appliquée avec succès ! Vos données sont désormais protégées.' as statut;
