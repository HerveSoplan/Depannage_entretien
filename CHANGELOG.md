# Journal des modifications (CHANGELOG)

Toutes les modifications notables apportées à l'application **Dépannage_entretien** sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), et ce projet adhère à la spécification du [Semantic Versioning](https://semver.org/lang/fr/).

## [1.8.2] - 2026-11-02

### Ajouté (Affichage de la version sous le nom de l'application)
- **Affichage de la version en petit sous « Dépannage_entretien » ([Navigation.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/common/Navigation.tsx), [LoginScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/auth/LoginScreen.tsx))** :
  - **Menu latéral Desktop (`Navigation.tsx`)** : Ajout discret de la version active `v1.8.2` sous le titre `Dépannage_entretien` dans la barre latérale.
  - **Barre supérieure Mobile (`Navigation.tsx`)** : Ajout de la version `v1.8.2` sous le titre pour les vues smartphones et tablettes.
  - **Écran de connexion (`LoginScreen.tsx`)** : Affichage d'un badge élégant `v1.8.2` sous le titre officiel de l'application.
- **Conformité & Versioning** :
  - Passage à la version `v1.8.2` synchronisée dans `package.json` et `src/version.ts`.
  - Contrôle et maintien de l'exactitude des mentions légales (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098).

## [1.8.1] - 2026-11-02

### Corrigé (Persistance des Utilisateurs dans Supabase & Mises à Jour Partielles)
- **Correction critique de l'écrasement des données dans `public.utilisateurs` ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
  - **Support du mode `isUpdate` dans `sanitizeUserDataForSupabase`** : Lors d'une mise à jour partielle (approbation d'accès, changement de rôle dans le logigramme, configuration du mot de passe temporaire ou bascule de permissions), les champs non spécifiés (`nom`, `prenom`, `email`, etc.) ne sont plus écrasés avec des chaînes vides `""`.
  - **Préservation de l'identité des techniciens** : Les fiches utilisateurs restent 100% complètes et pérennes dans Supabase après toute modification ou validation.
  - **Fusion de résilience locale dans `db.users.list()`** : Les utilisateurs locaux créés récemment sont automatiquement fusionnés et conservés en cas de latence réseau pour garantir qu'aucun technicien n'échappe à la vue.
  - **Bascule automatique d'onglet après création ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx))** : Si un technicien est créé avec le statut actif, l'onglet se positionne automatiquement sur *Validés* pour afficher immédiatement la nouvelle fiche.
  - **Nettoyage des entrées corrompues** : Suppression dans Supabase des lignes fantômes ayant subi un écrasement antérieur.

## [1.8.0] - 2026-11-02

### Ajouté (Logigramme Interactif d'Affectation des Rôles Techniciens)
- **Nouvel onglet « Logigramme des Rôles » dans la gestion des Utilisateurs ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx), [RoleLogigramTab.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/RoleLogigramTab.tsx))** :
  - **Réservé aux profils autorisés** : Accessible exclusivement aux Administrateurs, Responsables Techniques et comptes dotés des droits d'administration (`canValidate`).
  - **Arborescence visuelle par niveaux hiérarchiques** :
    - *Niveau 1* : Direction & Administration Maître (`ADMINISTRATEUR`, `DIRECTEUR`).
    - *Niveau 2* : Encadrement Technique & Coordination (`RESPONSABLE_TECHNIQUE`, `RESPONSABLE`).
    - *Niveau 3* : Responsables de Pôles Métiers (`CHEF_TECHNICIEN_CMS`, `CHEF_TECHNICIEN_VMS`, `CHEF_MONTEUR`).
    - *Niveau 4* : Équipes Opérationnelles de Terrain (`TECHNICIEN_CMS`, `TECHNICIEN_VMS`, `MONTEUR`).
    - *Niveau 5* : Support Logistique & Magasin (`MAGASINIER`).
    - *Niveau 6* : Espace Usagers & Éleveurs (`CLIENT`).
    - Prise en charge automatique des rôles personnalisés.
  - **Liaison et changement de rôle en 1 clic** :
    - Bouton `+ Lier un technicien` sur chaque bloc de rôle ouvrant une modale de sélection rapide.
    - Menu déroulant instantané directement sur chaque fiche technicien pour transférer un utilisateur vers un autre rôle.
    - Bouton de désaffectation/retrait rapide d'un rôle.
    - Bac interactif des techniciens sans rôle ou en attente d'affectation pour les lier rapidement à une fonction.
  - **Synchronisation temps réel** : Mise à jour immédiate dans la base de données Supabase (`db.users.update`) et actualisation de l'état local avec notifications visuelles.
- **Conformité & Versioning** :
  - Passage à la version `v1.8.0`.
  - Vérification des mentions légales et de l'identité officielle d'App à la Carte — Hervé CHAMPAGNE EI (SIREN 132 021 098).

## [1.7.8] - 2026-11-02

### Sécurisé & Redirection Automatique (Élimination totale de soplan-app)
- **Redirection automatique et instantanée dans `index.html`** :
  - Tout accès direct ou ancien lien contenant `soplan` (ex: `soplan-app-alpha.vercel.app`) est désormais automatiquement et instantanément redirigé par le navigateur vers `https://depannage-entretien.vercel.app` avec préservation intégrale des paramètres (`login?email=...`).
- **Génération centralisée et sécurisée de l'URL de base (`getAppBaseUrl`)** :
  - Centralisation dans `src/version.ts` de `getAppBaseUrl()` et `OFFICIAL_APP_URL` (`https://depannage-entretien.vercel.app`).
  - Remplacement de `window.location.origin` dans `UsersScreen.tsx` et `src/lib/supabase.ts` : aucun lien d'invitation, mot de passe ou email OTP ne pourra désormais comporter l'ancien nom `soplan`.
  - Maintien du support local de test (`localhost`).

## [1.7.7] - 2026-11-02

### Corrigé & Sécurisé (Synchronisation Supabase & Gestion Utilisateurs)
- **Résolution du blocage d'enregistrement des utilisateurs dans Supabase ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx), [supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
  - **Correction de l'erreur `PGRST204` (Colonnes inconnues)** : Suppression des champs parasites (`creator`, `roles`, `_id`) transmis par erreur à la table PostgreSQL `public.utilisateurs` lors de la création et modification d'utilisateurs.
  - **Assainissement strict des payloads (`sanitizeUserDataForSupabase`)** : Filtrage préalable des données envoyées à Supabase pour ne transmettre que les colonnes existantes et valides.
  - **Mécanisme de rétro-compatibilité automatique** : En cas de tentative d'insertion avec des colonnes de mot de passe (`mot_de_passe_temporaire`, `doit_changer_mot_de_passe`) sur un schéma distant qui ne les possède pas encore, une seconde tentative sans ces champs est exécutée automatiquement pour garantir l'enregistrement réussi dans Supabase.
  - **Fin du masquage silencieux des erreurs** : Supression du catch silencieux qui masquait les erreurs Supabase et faisait croire à un enregistrement distant réussi alors qu'il n'était que local.
  - **Détection des erreurs de sécurité RLS (`42501`)** : Notification claire à l'administrateur avec affichage d'un bandeau explicatif et modale guidée pas-à-pas pour débloquer l'accès.
- **Script SQL officiel de réparation et déblocage RLS ([supabase_correction_complete_utilisateurs_et_rls.sql](file:///d:/Aplli/D%C3%A9pannage_entretien/supabase_correction_complete_utilisateurs_et_rls.sql), [repairScript.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/sql/repairScript.ts))** :
  - Création du script SQL exhaustif permettant en 1 clic d'aligner la table `public.utilisateurs`, de lever la contrainte de rôle restrictive et d'autoriser les opérations `INSERT`, `UPDATE`, `DELETE`, `SELECT` via la clé anon.
  - Boutons de copie rapide du script SQL intégrés dans [UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx) et [DatabaseAdminScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/admin/DatabaseAdminScreen.tsx).
- **Conformité & Versioning** :
  - Incrémentation de version vers `v1.7.7` dans `package.json`, `src/version.ts`, CHANGELOG et footer.
  - Vérification des mentions légales et de l'identité officielle d'App à la Carte — Hervé CHAMPAGNE EI (SIREN 132 021 098).

## [1.7.6] - 2026-11-02

### Modifié & Déployé (Domaine Vercel & Liens d'accès)
- **Remplacement du domaine `soplan-app-alpha.vercel.app` par `depannage-entretien.vercel.app`** :
  - Configuration et assignation du nouveau domaine officiel `depannage-entretien.vercel.app` sur le projet Vercel de production.
  - Déploiement en production de l'application avec prise en charge des règles de réécriture SPA (`vercel.json`) pour garantir la validité de toutes les routes de connexion directes.
  - Les liens de connexion et d'invitation générés dynamiquement par l'application (`window.location.origin`) pointent désormais sur `https://depannage-entretien.vercel.app/login?email=...&action=login`.
  - Nettoyage des reliquats de désignation dans la configuration locale `.env`.

## [1.7.5] - 2026-11-02

### Corrigé & Amélioré (Gestion des utilisateurs & Envoi d'invitations)
- **Envoi automatique des identifiants et invitations depuis `soplanapp1@gmail.com` ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx))** :
  - Remplacement du simple lien `mailto:` système (qui ouvrait par défaut la boîte personnelle `hchampag1@hotmail.fr`) par un bouton d'envoi direct **Gmail** pré-authentifié avec le compte `soplanapp1@gmail.com` (`authuser=soplanapp1@gmail.com`).
  - Intégration de l'adresse de support et de demande de mot de passe (`soplanapp1@gmail.com`) directement dans le corps du message d'invitation généré.
  - Affichage d'un badge confirmant le compte d'envoi automatique configuré dans la modale de transmission d'identifiants.
  - Synchronisation dynamique avec la configuration globale de l'email paramétrable depuis `DatabaseAdminScreen.tsx`.

## [1.7.4] - 2026-11-02

### Ajouté & Amélioré (Administration & Page de Connexion)
- **Email de demande de nouveau mot de passe paramétrable depuis l'administration (`DatabaseAdminScreen.tsx`)** :
  - Ajout d'une section dédiée dans l'écran d'administration des bases permettant de modifier et enregistrer l'adresse email de contact pour les demandes de mot de passe (valeur par défaut : `soplanapp1@gmail.com`).
  - Boutons d'enregistrement et de rétablissement de la valeur par défaut avec confirmation visuelle immédiate.
- **Affichage sur l'écran de connexion (`LoginScreen.tsx`)** :
  - Affichage direct et dynamique de l'email paramétré sur la page de connexion principale avec lien `mailto:` prérempli et bouton de copie en un clic.
  - Intégration de l'adresse de contact dans le volet « Mot de passe oublié » pour orienter immédiatement les techniciens ayant besoin d'une assistance ou d'un nouveau mot de passe.
- **Conformité Mentions Légales & Versioning** :
  - Maintien rigoureux des données de l'éditeur officiel App à la Carte — Hervé CHAMPAGNE EI (SIREN 132 021 098, `contact@appalacarte.fr`).
  - Synchronisation de la version `v1.7.4` dans `package.json`, `src/version.ts`, le pied de page et les mentions légales.

## [1.7.3] - 2026-11-02

### Sécurité & Simplification (Authentification & Mentions Légales)
- **Simplification radicale de l'écran de connexion (`LoginScreen.tsx`)** :
  - Interface recentrée sur un flux simple et direct : adresse email et mot de passe.
  - Suppression de tout bouton superflu ou déroutant (suppression du bouton d'accès direct administrateur sans mot de passe et du bouton lien par email OTP).
  - Deux onglets limpides : « Se connecter » et « Demande d'accès ».
- **Règle stricte : Aucun accès sans mot de passe** :
  - Interdiction absolue d'accéder à l'application sans saisir un mot de passe valide (champ requis côté client et validation stricte côté service).
  - Blocage de toute session locale si un changement de mot de passe obligatoire est en attente.
- **Mot de passe temporaire technicien (`prenom2027`) & Changement obligatoire** :
  - Application stricte de la règle : prénom du technicien en minuscules (sans accent, sans espace) suivi de 2027 (ex : `thomas2027`, `herve2027`).
  - Détection automatique et redirection immédiate vers l'écran de changement obligatoire de mot de passe lors de l'utilisation du mot de passe temporaire.
  - Impossibilité formelle d'accéder aux fonctionnalités de l'application tant que le nouveau mot de passe personnel conforme aux critères de sécurité n'a pas été défini et confirmé.
- **Procédure « Mot de passe oublié » optimisée** :
  - Réinitialisation simplifiée avec réactivation du mot de passe temporaire officiel (`prenom2027`) et indicateur de changement obligatoire.
  - Bouton direct permettant de se reconnecter immédiatement avec le mot de passe temporaire réactivé pour définir son nouveau mot de passe personnel.
- **Vérification et conformité Mentions Légales (Skill `mentions-legales`)** :
  - Contrôle et maintien de la page `/mentions-legales` accessible publiquement hors connexion.
  - Conformité certifiée des mentions légales de référence de l'éditeur App à la Carte — Hervé CHAMPAGNE EI (SIREN 132 021 098, 173 rue de Courcelles 75017 Paris, contact@appalacarte.fr, hébergement Vercel Inc., aucun numéro de téléphone).
  - Présence et bon fonctionnement du lien légal dans le pied de page (footer) sur l'ensemble des écrans et sur tous les appareils (mobile, tablette, desktop).

## [1.7.2] - 2026-11-02

### Modifié
- **Incrémentation de version & synchronisation système** :
  - Passage officiel à la version `v1.7.2` (SemVer Patch).
  - Synchronisation de la version applicative dans `package.json` et `src/version.ts`.
  - Contrôle et maintien de l'affichage dynamique de la version dans le footer de l'application et sur la page des mentions légales.
  - Vérification de la stricte conformité éditeur (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098) et accessibilité hors connexion de la page légale.

## [1.7.1] - 2026-11-02

### Modifié & Nettoyé (Rebranding)
- **Nouveau nom officiel de l'application : « Dépannage_entretien »** :
  - Remplacement de l'ancien nom et purge intégrale de la désignation « soplan-app » de l'ensemble de l'application et de ses métadonnées.
  - Mise à jour du nom du package dans `package.json` (`depannage-entretien`).
  - Titre de la page web dans `index.html` mis à jour en `Dépannage_entretien - Gestion de Maintenance et Entretien`.
  - Centralisation de `APP_NAME = 'Dépannage_entretien'` dans `src/version.ts`.
  - Affichage dynamique du nom dans la barre latérale de navigation (`Navigation.tsx`), la barre mobile et l'écran de connexion (`LoginScreen.tsx`).
- **Harmonisation et conformité documentaire** :
  - Nettoyage et mise à jour complète de `README.md`, `DEPLOYMENT_GUIDE.md`, `COPIE_FICHIERS.md`, `INDEX.txt`, `LISEZMOI.txt`, `MIGRATION_CHECKLIST.md` et `TROUBLESHOOTING.md`.
  - Remplacement des adresses de contact par l'adresse officielle de l'éditeur `contact@appalacarte.fr`.
  - Migration de la clé de stockage local vers `depannage_use_live_supabase` avec rétrocompatibilité.

## [1.7.0] - 2026-11-02

### Ajouté & Amélioré (Authentification & Mots de Passe)
- **Gestion des mots de passe temporaires techniciens (`prenom2027`)** :
  - Génération automatique du mot de passe temporaire dès la création d'un utilisateur par l'administrateur ou le responsable technique selon la règle officielle : prénom en minuscules suivi de `2027` (ex : `thomas2027`).
  - Affichage direct et bouton de copie du mot de passe temporaire dans la fiche utilisateur (`UsersScreen.tsx`).
  - Modale dédiée après création et validation d'un technicien permettant l'envoi immédiat par email prérempli (`mailto:`) ou la copie du message d'invitation avec le lien direct d'accès et les identifiants.
  - Bouton de réinitialisation rapide du mot de passe temporaire disponible pour chaque collaborateur dans la liste des utilisateurs.
- **Changement obligatoire du mot de passe à la première connexion** :
  - Détection automatique lors de la saisie du mot de passe temporaire ou de l'indicateur `doitChangerMotDePasse`.
  - Écran dédié de définition du nouveau mot de passe personnel avec bascule d'affichage œil (`Eye`/`EyeOff`).
  - Checklist dynamique en temps réel des règles de sécurité (au moins 8 caractères, minuscule, majuscule, chiffre, caractère spécial).
  - Mise à jour et synchronisation immédiate sur l'ensemble des appareils (smartphones, tablettes, PC).
- **Fonctionnalité « Mot de passe oublié » multi-appareils** :
  - Ajout du lien et de l'écran « Mot de passe oublié » sur l'interface de connexion.
  - Envoi des instructions de réinitialisation et réactivation du mot de passe temporaire pour permettre la reconnexion d'urgence sur le terrain.
  - Détection automatique des liens de récupération Supabase Auth (`type=recovery`) redirigeant directement vers le formulaire de choix du nouveau mot de passe.
- **Sécurité et validation Supabase Auth (`src/lib/validation/password.ts`)** :
  - Module centralisé de validation et normalisation des mots de passe respectant les règles strictes d'authentification.
  - Script de migration SQL Supabase fourni (`supabase_mot_de_passe_temporaire_et_securite.sql`).

## [1.6.2] - 2026-11-01

### Ajouté & Amélioré
- **Routes universelles de connexion multi-appareils (`/login`, `/connexion`, `/auth`)** :
  - Accès direct garanti à l'écran de connexion depuis n'importe quel smartphone, tablette ou ordinateur.
  - Prise en charge du paramètre de réinitialisation `?reset=1` ou `?logout=1` pour forcer l'affichage de l'écran vierge de connexion même si une session locale précédente existait.
  - Détection et affichage d'un bandeau de session active permettant de basculer de compte ou de continuer vers le tableau de bord.
- **Configuration Vercel SPA (`vercel.json`)** :
  - Ajout des règles de réécriture (*rewrites*) redirigeant toutes les requêtes vers `/index.html` pour éliminer toute erreur 404 lors de l'accès direct aux liens de connexion depuis un appareil mobile ou externe.

## [1.6.1] - 2026-11-01

### Ajouté & Corrigé
- **Authentification par compte Google OAuth (`signInWithOAuth`)** :
  - Intégration du bouton officiel « Continuer avec le compte Google » sur l'écran de connexion.
  - Redirection et retour sécurisé vers l'application (`window.location.origin`).
- **Authentification par adresse email validée & Lien magique (OTP)** :
  - Bouton « Lien par email (OTP) » pour se connecter directement sans mot de passe via un lien de connexion envoyé sur l'email validé.
  - Reconnaissance immédiate de l'administrateur maître `contact@appalacarte.fr` (App à la Carte — Hervé CHAMPAGNE EI).
- **Écoute dynamique des sessions Supabase Auth (`onAuthStateChange` dans `App.tsx`)** :
  - Détection automatique et instantanée du retour de connexion Google OAuth (`#access_token=...` ou tokens de session).
  - Validation automatique du compte `contact@appalacarte.fr` en tant qu'administrateur maître avec tous les privilèges.
  - Détection des comptes Google autorisés validés ou mise en attente sécurisée avec notification explicite.

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
