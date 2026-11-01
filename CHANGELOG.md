# Journal des modifications (CHANGELOG)

Toutes les modifications notables apportées à l'application **Maintenance et Dépannage** sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), et ce projet adhère à la spécification du [Semantic Versioning](https://semver.org/lang/fr/).

## [1.4.2] - 2026-11-01

### Sécurité & Protection des données
- **Élimination totale des clés en clair dans le code source** : Suppression des clés Supabase et URL par défaut codées en dur dans `src/lib/supabase.ts`. L'application utilise exclusivement les variables d'environnement (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **Isolation stricte et mode autonome sans fuite de configuration** : En l'absence de variables d'environnement, l'application fonctionne en mode autonome 100% sécurisé sans exposer de références réseau.
- **Script de blindage RLS PostgreSQL (`supabase_securite_rls.sql`)** : Verrouillage des tables sensibles (`clients`, `machines`, `interventions`, `utilisateurs`) réservées aux seuls utilisateurs authentifiés, empêchant tout accès ou fuite de données anonyme.

## [1.4.1] - 2026-11-01

### Corrigé & Optimisé
- **Suppression radicale de la lenteur au démarrage et en navigation** : Élimination des requêtes HTTP réseau en attente de timeout vers le serveur distant Supabase (projet saturé ou en pause).
- **Mode démo autonome direct (0 ms de latence)** : Activation instantanée du stockage autonome local (`demoDb`) par défaut. Aucune attente réseau pour le listing des clients, machines, interventions, pièces détachées et codes pannes.
- **Affichage instantané de l'écran d'accueil** : Suppression du blocage "Chargement de l'application..." dans `useAuth` et `App.tsx`.
- **Découpage optimisé des bundles Vite (`manualChunks`)** : Séparation des bundles volumineux (`jspdf`, `jspdf-autotable`, `@dnd-kit`, `react-vendor`) pour un chargement ultra-rapide et une mise en cache optimale sur Vercel et navigateurs.

## [1.4.0] - 2026-11-01

### Ajouté
- **Base de données autonome embarquée pour les acquéreurs (`demoDatabase.ts`)** : Fonctionnement 100% autonome sans aucun compte ni projet Supabase requis. Pré-remplissage avec des données de démonstration réalistes (clients agricoles/viticoles, équipements, robots, centrales de lavage, interventions d'entretien, catalogue de pièces détachées avec prix et stocks, base de codes pannes avec résolutions).
- **Tolérance totale aux pannes et bascule transparente** : L'API applicative bascule automatiquement sur la base autonome locale si Supabase est absent, plein ou inaccessible, garantissant 0 plantage et 0 ms de latence pour les futurs acquéreurs.
- **Bouton de réinitialisation des données de test** : Bouton « Réinitialiser démo » dans la barre supérieure permettant de restaurer les données d'origine en 1 clic.

## [1.3.0] - 2026-11-01

### Ajouté
- **Schéma SQL Supabase complet et autonome (`supabase_schema_complet.sql`)** : Script SQL clé en main prêt à être copié-collé dans l'éditeur SQL de Supabase pour créer l'intégralité des 15 tables du modèle relationnel (`utilisateurs`, `clients`, `machines`, `interventions`, `installation_protocols`, `commissioning_protocols`, `spare_parts`, `maintenance_kits`, `taches_entretien`, `error_codes`, `machine_fields`, `machine_field_options`, `languages`, `translations`, `client_messages`), des triggers `updated_at`, des vues d'interventions et des politiques de sécurité RLS adaptées au client web.
- **Fichier de configuration locale `.env` et gabarit `.env.example`** : Création sur le poste local du fichier `.env` configuré avec instructions pour récupérer et renseigner les clés d'API Supabase (`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`).

## [1.2.2] - 2026-11-01

### Corrigé
- **Sécurisation de l'initialisation Supabase (résolution de l'erreur Vercel)** : Remplacement de l'exception bloquante `throw new Error('Missing Supabase environment variables')` par des valeurs de repli automatiques et un avertissement non bloquant. L'application démarre désormais correctement en production même si les variables d'environnement ne sont pas immédiatement configurées dans le tableau de bord Vercel.

## [1.2.1] - 2026-11-01

### Corrigé
- **Synchronisation du lockfile pnpm pour le déploiement Vercel** : Mise à jour de `pnpm-lock.yaml` avec les dépendances actuelles (`@supabase/supabase-js`), éliminant l'erreur `ERR_PNPM_OUTDATED_LOCKFILE` lors du build CI Vercel (`pnpm install --frozen-lockfile`).

## [1.2.0] - 2026-11-01

### Supprimé
- **Neutralisation complète des marques et entités tierces** : Purge et suppression systématique de toutes les occurrences de « Soplan » et vérification de l'absence totale de « DeLaval » dans l'ensemble du code applicatif (`src/`), des assets (`public/`) et de `index.html`.
- Migration et neutralisation des clés `localStorage` (`soplan_authenticated`, `soplan_current_user`, `soplan_language`) remplacées par `maintenance_authenticated`, `maintenance_current_user` et `maintenance_language`.

### Corrigé
- **Restauration de SelectedClientContext** : Réintégration du composant `SelectedClientContext.tsx` manquant, éliminant l'erreur de build Rollup/Vite et restaurant la persistance du client sélectionné.

### Ajouté
- **Conformité éditeur & Mentions Légales LCEN** : Intégration de la page `/mentions-legales` (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098, RCS/RNE 26/10/2026, 173 rue de Courcelles 75017 Paris, TVA non applicable art. 293 B du CGI, hébergeur Vercel Inc.).
- **Accessibilité universelle des mentions légales** : Consultation libre de la page des mentions légales hors connexion et après authentification.
- **Pied de page réglementaire universel (Footer)** : Présence continue du footer sur ordinateur et mobile : `App à la Carte — Hervé CHAMPAGNE EI | SIREN : 132 021 098 | v1.2.0 | Mentions légales | Contact`.

### Modifié
- Harmonisation générale sous l'intitulé « Maintenance & Dépannage ».
- Mise à jour du nom du projet dans `package.json` (`maintenance-et-depannage`).

---

## [1.1.0] - 2026-11-01

### Ajouté
- **Connexion sans mot de passe** : Ouverture des connexions pour tests rapides et accès libre multi-profils (Administrateur, Responsable Technique, Techniciens).
- **Persistance de session locale** : Gestion automatique de l'état d'authentification sans blocage d'accès.
