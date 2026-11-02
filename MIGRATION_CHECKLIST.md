# ✅ Checklist de Migration - Vers Supabase & Vercel

## 🎯 Objectif
Déployer l'application Dépannage_entretien sur Supabase et héberger en production.

---

## Phase 1 : Préparation (30 min)

### Environnement local
- [ ] Node.js 18+ installé et vérifié (`node --version`)
- [ ] npm installé et vérifié (`npm --version`)
- [ ] Git installé (`git --version`)
- [ ] VSCode installé (ou autre éditeur)
- [ ] Compte Supabase créé (https://supabase.com)

### Récupération du code
- [ ] Code téléchargé depuis Lumi
- [ ] Projet ouvert dans VSCode
- [ ] Structure du projet vérifiée

---

## Phase 2 : Configuration Supabase (45 min)

### Création du projet
- [ ] Projet Supabase créé
  - Nom : `depannage-entretien`
  - Région : Europe (Paris/Frankfurt)
  - Mot de passe de base de données sauvegardé
- [ ] Projet actif et accessible

### Récupération des clés
- [ ] Project URL copié depuis Settings > API
- [ ] Anon key copié depuis Settings > API
- [ ] Clés sauvegardées dans un endroit sûr

### Création de la base de données
- [ ] SQL Editor ouvert
- [ ] Fichier `supabase/migrations/20260207_initial_schema.sql` copié
- [ ] Migration exécutée avec succès (Run)
- [ ] Aucune erreur dans les logs
- [ ] Tables visibles dans Table Editor

### Vérification des tables
- [ ] Table `utilisateurs` créée
- [ ] Table `clients` créée
- [ ] Table `machines` créée
- [ ] Table `interventions` créée
- [ ] Table `installation_protocols` créée
- [ ] Table `commissioning_protocols` créée
- [ ] Table `spare_parts` créée
- [ ] Table `maintenance_kits` créée
- [ ] Table `taches_entretien` créée
- [ ] Table `error_codes` créée
- [ ] Table `machine_fields` créée
- [ ] Table `machine_field_options` créée
- [ ] Table `languages` créée
- [ ] Table `translations` créée
- [ ] Table `client_messages` créée

### Création utilisateur admin
- [ ] Script SQL de création d'utilisateur exécuté
- [ ] Email administrateur créé (`contact@appalacarte.fr`)
- [ ] Mot de passe défini et sauvegardé
- [ ] Utilisateur visible dans Auth > Users

---

## Phase 3 : Configuration du projet local (30 min)

### Fichiers de configuration
- [ ] `package.json` présent
- [ ] `vite.config.ts` présent
- [ ] `tsconfig.json` présent
- [ ] `.env.example` présent
- [ ] `.gitignore` présent

### Variables d'environnement
- [ ] Fichier `.env` créé (copié depuis `.env.example`)
- [ ] `VITE_SUPABASE_URL` renseigné
- [ ] `VITE_SUPABASE_ANON_KEY` renseigné
- [ ] Fichier `.env` ajouté à `.gitignore`

### Installation des dépendances
- [ ] `npm install` exécuté
- [ ] Installation réussie sans erreurs
- [ ] `node_modules/` créé

---

## Phase 4 : Migration du code (1-2h)

### Option A : Migration automatique (recommandé)
- [ ] Script `migrate-to-supabase.sh` rendu exécutable
- [ ] Script exécuté : `./migrate-to-supabase.sh`
- [ ] Backup créé dans `backup/`
- [ ] Migrations d'imports réussies
- [ ] Aucune erreur rapportée

### Option B : Migration manuelle
- [ ] Fichier `src/lib/supabase.ts` créé
- [ ] Tous les fichiers utilisant `lumi` identifiés
- [ ] Imports mis à jour : `import { db } from '@/lib/supabase'`
- [ ] `lumi.entities.` remplacé par `db.`
- [ ] Méthodes adaptées (`.list({})` → `.list()`)

### Vérification des fichiers migrés
- [ ] `src/hooks/useClients.ts`
- [ ] `src/hooks/useMachines.ts`
- [ ] `src/hooks/useInterventions.ts`
- [ ] `src/hooks/useUsers.ts`
- [ ] `src/hooks/useAuth.ts`
- [ ] Tous les autres hooks
- [ ] Tous les screens

---

## Phase 5 : Tests locaux (1h)

### Démarrage de l'application
- [ ] `npm run dev` exécuté
- [ ] Application accessible sur `http://localhost:3000`
- [ ] Aucune erreur dans la console navigateur
- [ ] Aucune erreur dans le terminal

### Test de connexion
- [ ] Page de login affichée
- [ ] Connexion administrateur réussie (`contact@appalacarte.fr`)
- [ ] Redirection vers le dashboard
- [ ] Déconnexion fonctionne

### Tests CRUD Clients
- [ ] Liste des clients s'affiche (vide au début)
- [ ] Formulaire de création accessible
- [ ] Création d'un client de test réussie
- [ ] Client visible dans la liste
- [ ] Modification du client fonctionne
- [ ] Détails du client affichés correctement

### Tests CRUD Machines
- [ ] Ajout d'une machine à un client
- [ ] Configuration V300 fonctionne
- [ ] Configuration Pompe fonctionne
- [ ] Champs personnalisés fonctionnent
- [ ] Machine visible dans la liste

### Tests Interventions
- [ ] Création d'une intervention
- [ ] Sélection du client fonctionne
- [ ] Sélection de la machine fonctionne
- [ ] Types d'intervention disponibles
- [ ] Statuts fonctionnent

### Tests Protocoles
- [ ] Protocole d'installation accessible
- [ ] Sections affichées
- [ ] Checklist fonctionnelle
- [ ] Sauvegarde fonctionne
- [ ] Protocole de mise en service accessible
- [ ] Vérifications affichées

### Tests Administration
- [ ] Page admin accessible (compte admin)
- [ ] Statistiques affichées
- [ ] Import CSV fonctionne
- [ ] Gestion des utilisateurs fonctionne

---

## Phase 6 : Build de production (15 min)

### Création du build
- [ ] `npm run build` exécuté
- [ ] Build réussi sans erreurs
- [ ] Dossier `dist/` créé
- [ ] Taille du build vérifiée

### Test du build
- [ ] `npm run preview` exécuté
- [ ] Application accessible
- [ ] Fonctionnalités testées dans le build

---

## Phase 7 : Déploiement (30-60 min)

### Choix de la plateforme
- [ ] Plateforme choisie : _________________
  - Vercel (recommandé)
  - Netlify
  - VPS

### Vercel (si choisi)
- [ ] Vercel CLI installé (`npm install -g vercel`)
- [ ] Connexion à Vercel (`vercel login`)
- [ ] Premier déploiement (`vercel`)
- [ ] Variables d'environnement ajoutées
- [ ] Déploiement en production (`vercel --prod`)
- [ ] URL de production notée : _________________

### Netlify (si choisi)
- [ ] Netlify CLI installé
- [ ] Connexion à Netlify
- [ ] `netlify.toml` créé
- [ ] Initialisation (`netlify init`)
- [ ] Déploiement (`netlify deploy --prod`)
- [ ] URL de production notée : _________________

### VPS (si choisi)
- [ ] Serveur provisionné
- [ ] Node.js installé sur le serveur
- [ ] Nginx installé
- [ ] Code déployé
- [ ] PM2 configuré
- [ ] Nginx configuré
- [ ] SSL Let's Encrypt configuré
- [ ] Domaine pointant vers le serveur

---

## Phase 8 : Vérifications en production (30 min)

### Tests de base
- [ ] Application accessible via l'URL de production
- [ ] HTTPS actif (cadenas vert)
- [ ] Page de login s'affiche
- [ ] Connexion admin fonctionne
- [ ] Navigation fluide

### Tests fonctionnels
- [ ] Création de client en production
- [ ] Création de machine en production
- [ ] Création d'intervention en production
- [ ] Génération de PDF fonctionne
- [ ] Upload de photos fonctionne (si applicable)

### Tests de performance
- [ ] Temps de chargement < 3s
- [ ] Navigation réactive
- [ ] Pas d'erreurs dans la console

### Tests responsive
- [ ] Affichage correct sur desktop
- [ ] Affichage correct sur tablette
- [ ] Affichage correct sur mobile

---

## Phase 9 : Migration des données (variable)

### Préparation
- [ ] Export des données depuis Lumi
  - Clients
  - Machines
  - Utilisateurs
  - Interventions
  - etc.
- [ ] Données nettoyées et formatées

### Import
- [ ] Import clients via CSV/admin
- [ ] Import machines via CSV/admin
- [ ] Import utilisateurs via CSV/admin
- [ ] Import pièces détachées
- [ ] Import kits de maintenance
- [ ] Import codes d'erreur

### Vérification
- [ ] Toutes les données visibles
- [ ] Associations correctes (client-machine)
- [ ] Aucune donnée manquante

---

## Phase 10 : Formation et mise en production (1-2h)

### Documentation
- [ ] README.md à jour
- [ ] DEPLOYMENT_GUIDE.md partagé avec l'équipe
- [ ] Compte Supabase partagé (si nécessaire)
- [ ] Mots de passe stockés de manière sécurisée

### Formation utilisateurs
- [ ] Créer comptes pour les techniciens
- [ ] Session de formation planifiée
- [ ] Démonstration des fonctionnalités
- [ ] Questions/réponses

### Mise en production
- [ ] Ancienne application mise hors ligne
- [ ] Nouvelle application en production
- [ ] URL communiquée à tous les utilisateurs
- [ ] Support disponible pour les premiers jours

---

## Phase 11 : Suivi post-déploiement (ongoing)

### Monitoring (J+1 à J+7)
- [ ] Vérifier les logs quotidiennement
- [ ] Surveiller les erreurs Supabase
- [ ] Monitorer l'utilisation
- [ ] Recueillir les retours utilisateurs

### Optimisations (J+7 à J+30)
- [ ] Corriger les bugs rapportés
- [ ] Optimiser les requêtes lentes
- [ ] Améliorer l'UX selon les retours
- [ ] Documenter les problèmes récurrents

### Backup et sécurité
- [ ] Configurer les backups automatiques Supabase
- [ ] Tester la restauration
- [ ] Vérifier les politiques RLS
- [ ] Audit de sécurité

---

## 🎉 Félicitations !

Si toutes les cases sont cochées, votre migration est complète !

---

## 📞 En cas de problème

### Problèmes techniques
1. Consulter `DEPLOYMENT_GUIDE.md` section Troubleshooting
2. Vérifier les logs Supabase
3. Vérifier la console navigateur
4. Restaurer depuis le backup si nécessaire

### Support
- Documentation interne
- Email : contact@appalacarte.fr
- GitHub Issues : (si configuré)

---

**Date de début** : ___/___/______
**Date de fin** : ___/___/______
**Responsable** : _________________
**Statut final** : ☐ Succès ☐ Problèmes rencontrés

**Notes :**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
