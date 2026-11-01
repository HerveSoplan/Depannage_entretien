# Journal des modifications (CHANGELOG)

Toutes les modifications notables apportées à l'application **Maintenance et Dépannage** sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), et ce projet adhère à la spécification du [Semantic Versioning](https://semver.org/lang/fr/).

## [1.6.0] - 2026-11-01

### Ajouté & Amélioré
- **Système d'authentification complet et compte administrateur maître (`contact@appalacarte.fr`)** :
  - `contact@appalacarte.fr` (App à la Carte — Hervé CHAMPAGNE EI) est configuré comme administrateur maître avec le rôle `ADMINISTRATEUR`, accès complet et privilèges de validation.
  - Bouton d'accès direct administrateur sécurisé et résilient sur l'écran de connexion.
- **Workflow de validation des nouveaux utilisateurs par l'administrateur ou le responsable technique** :
  - Les utilisateurs autorisés formulent leur demande unique de connexion avec leur adresse email, nom, prénom, rôle souhaité et motif.
  - Le compte est enregistré avec le statut `EN_ATTENTE` et inactif tant qu'il n'a pas été validé.
  - Si un utilisateur tente de se connecter avant validation, un message explicatif lui indique que sa demande est en attente d'approbation.
  - Espace de validation dans la gestion des utilisateurs (`UsersScreen.tsx`) : liste des demandes en attente, bouton « Valider l'accès » avec choix du rôle et du numéro de technicien, bouton « Refuser ».
  - Badge d'alerte visuel en temps réel dans la navigation et l'en-tête indiquant le nombre de demandes en attente.
- **Générateur et partage de liens d'accès** :
  - Modale dédiée « Donner un lien d'accès » avec 3 types de liens :
    1. Lien public de demande d'accès (`?action=demande`) avec message type prêt à envoyer.
    2. Lien personnalisé pré-rempli pour un collaborateur (`?action=demande&email=...&nom=...&prenom=...`).
    3. Lien direct de connexion pour utilisateur validé (`?action=login&email=...`).
  - Prise en charge automatique des paramètres d'URL pour pré-remplir les formulaires et basculer sur l'onglet adéquat.
- **Script SQL de migration Supabase (`supabase_auth_et_validation_utilisateurs.sql`)** :
  - Ajout des colonnes `statut`, `motif_demande`, `date_demande`, `valide_par`, `valide_le` sur `public.utilisateurs`.
  - Politiques RLS permettant la soumission de demandes anonymes et la gestion par les utilisateurs connectés.
  - Insertion / mise à jour de `contact@appalacarte.fr` comme administrateur maître avec notification de rechargement du schéma.
- **Mentions légales & Conformité éditeur** :
  - Mentions légales accessibles sans authentification préalable depuis le footer réglementaire et la page de connexion.
  - Données certifiées conformes : App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098, 173 rue de Courcelles 75017 Paris, sans aucun numéro de téléphone public.

## [1.5.3] - 2026-11-01

### Corrigé & Amélioré
- **Script de réparation et d'alignement Supabase (`supabase_reparation_kits_et_taches.sql`)** :
  - Résolution de l'erreur `Could not find the 'kit_id' column of 'maintenance_kits' in the schema cache (PGRST204)`.
  - Ajout systématique via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` de l'ensemble des colonnes attendues (`kit_id`, `machine_type`, `kit_number`, `service_number`, `pieces`, `task_id`, `section_id`, etc.).
  - Notification `NOTIFY pgrst, 'reload schema'` pour actualiser immédiatement le cache PostgREST de Supabase.
  - Politiques RLS permissives pour les rôles `anon` et `authenticated` pour les référentiels de kits et tâches d'entretien.
- **Suppression des alertes de traductions manquantes (`useTranslation.ts`)** :
  - Intégration d'un dictionnaire français par défaut (`DEFAULT_FR_TRANSLATIONS`) pour les libellés de navigation et boutons standards (`dashboard.title`, `clients.title`, `button.add`, etc.).
  - Élimination des warnings parasites en console lorsque la traduction ou le libellé de repli est disponible.

## [1.5.2] - 2026-11-01

### Corrigé & Amélioré
- **Formulaire d'ajout direct de kits d'entretien (`DatabaseAdminScreen.tsx`)** : Ajout du formulaire complet d'ajout unitaire de kits d'entretien (`getAddForm` et `handleAdd`) qui était absent, permettant la création manuelle (machine, N° de kit, service, nom et description).
- **Suppression des kits d'entretien** : Intégration de l'action `onDelete` avec `deleteMaintenanceKit` sur la table des kits d'entretien.
- **Fin du masquage silencieux des erreurs Supabase (`src/lib/supabase.ts`)** :
  - `db.maintenance_kits.create` et `db.taches_entretien.create` remontent désormais l'erreur exacte renvoyée par Supabase au lieu de basculer silencieusement en base locale sans prévenir.
  - Normalisation et typage sécurisé des champs numériques (`kit_number` et `service_number`).
- **Détection et indicateur en temps réel de l'état de connexion Supabase** :
  - Ajout de la fonction `checkSupabaseConnection()` interrogeant la disponibilité réelle de l'instance Supabase.
  - Affichage d'un bandeau explicite dans l'interface d'administration en cas de projet Supabase injoignable, en pause (*paused*) ou d'URL inexistante.
- **Schéma SQL et politiques RLS (`supabase_schema_complet.sql`, `supabase_securite_rls.sql`)** :
  - Élargissement de la colonne `kit_number` de `INTEGER` à `BIGINT` pour accepter les numéros de kit à 10 chiffres (ex: 2150025306) sans erreur de dépassement de capacité (*out of range integer*).
  - Autorisation d'accès aux kits d'entretien et tâches d'entretien pour le rôle `anon` en plus de `authenticated`.

## [1.5.1] - 2026-11-01

### Ajouté & Amélioré
- **Activation de la copie du chemin de fichier pour la remontée d'erreurs (`DebugFileOverlay.tsx`)** :
  - Suppression du blocage `pointerEvents: 'none'` qui empêchait tout clic ou sélection sur la barre de débogage verte en bas d'écran.
  - Ajout d'un bouton d'action dédié « Copier le chemin » avec icône et retour visuel immédiat (« Copié ! » et message de confirmation).
  - Rendu cliquable de l'ensemble du chemin de fichier affiché pour une copie instantanée en un seul clic.
  - Résolution dynamique et ultra-précise des fichiers sources selon les routes et sous-routes actives (`location.pathname`).
  - Système de copie résilient avec API `navigator.clipboard` et mécanisme de repli compatible tous navigateurs.
  - Disponibilité de la barre d'aide au débogage sur l'ensemble des écrans (y compris authentification et mentions légales).

## [1.5.0] - 2026-11-01

### Modifié & Nettoyé
- **Suppression intégrale des données de démonstration en dur** : Élimination des 600 lignes de fausses données (clients fictifs, machines de test, interventions et profils simulés) dans `src/services/demoDatabase.ts`.
- **Respect absolu des retours Supabase** : Si une table Supabase connectée est vide, l'application affiche désormais fidèlement une liste vide (`[]`) sans injecter de données factices.
- **Détection automatique transparente de Supabase** : Dès que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont configurées (sur Vercel ou localement), le mode direct Supabase est activé automatiquement sans variable supplémentaire.
- **Refonte et épuration de l'écran de connexion (`LoginScreen.tsx`)** : Retrait des faux profils fictifs, formulaire d'authentification professionnel et accès rapide propre pour l'administrateur.
- **Épuration de la barre de navigation (`Layout.tsx`)** : Retrait du bouton de réinitialisation démo et du badge de test.

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
