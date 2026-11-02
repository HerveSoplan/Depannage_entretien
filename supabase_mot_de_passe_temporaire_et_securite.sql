-- ==============================================================================
-- Migration Supabase : Mot de passe temporaire et gestion multi-appareils (SoPlan)
-- Auteur : App à la Carte — Hervé CHAMPAGNE EI
-- Date : 2026-11-02
-- Version : 1.7.0
-- Description :
--   1. Ajout de la colonne mot_de_passe_temporaire (ex : prenom2027)
--   2. Ajout de la colonne doit_changer_mot_de_passe (BOOLEAN DEFAULT TRUE)
--   3. Ajout de la colonne mot_de_passe (pour persistance / synchronisation)
--   4. Ajout de la colonne derniere_connexion (TIMESTAMPTZ)
--   5. Rechargement du cache PostgREST Supabase
-- ==============================================================================

-- 1. Ajout des colonnes de gestion de mot de passe
ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS mot_de_passe_temporaire TEXT;

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS doit_changer_mot_de_passe BOOLEAN DEFAULT TRUE;

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS mot_de_passe TEXT;

ALTER TABLE IF EXISTS public.utilisateurs
  ADD COLUMN IF NOT EXISTS derniere_connexion TIMESTAMPTZ;

-- 2. Compte administrateur de référence (contact@appalacarte.fr)
-- L'administrateur n'a pas besoin de changer de mot de passe temporaire
UPDATE public.utilisateurs
SET doit_changer_mot_de_passe = false
WHERE email = 'contact@appalacarte.fr';

-- 3. Rechargement immédiat du cache PostgREST de l'API Supabase
NOTIFY pgrst, 'reload schema';
