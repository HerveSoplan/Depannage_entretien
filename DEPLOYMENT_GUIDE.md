# 🚀 Guide de Déploiement Dépannage_entretien - Supabase & Vercel

## 📋 Table des matières

1. [Préparation de l'environnement](#1-préparation-de-lenvironnement)
2. [Configuration Supabase](#2-configuration-supabase)
3. [Migration du code](#3-migration-du-code)
4. [Configuration locale](#4-configuration-locale)
5. [Déploiement en production](#5-déploiement-en-production)
6. [Vérifications et tests](#6-vérifications-et-tests)

---

## 1. Préparation de l'environnement

### Prérequis
- Node.js >= 18.x
- npm ou yarn
- Git
- VSCode (recommandé)
- Compte Supabase

### Installation des outils

```bash
# Installer Node.js si nécessaire
# Télécharger depuis https://nodejs.org/

# Vérifier l'installation
node --version
npm --version

# Installer Supabase CLI globalement
npm install -g supabase

# Vérifier l'installation
supabase --version
```

---

## 2. Configuration Supabase

### A. Créer un projet Supabase

1. **Aller sur https://supabase.com**
2. **Se connecter / Créer un compte**
3. **Créer un nouveau projet** :
   - Nom du projet : `depannage-entretien`
   - Database Password : (choisir un mot de passe fort)
   - Région : Europe (Paris ou Frankfurt recommandé)
   - Plan : Free tier pour commencer

4. **Attendre la création** (2-3 minutes)

### B. Récupérer les clés API

Une fois le projet créé :

1. Aller dans **Settings** > **API**
2. Copier les informations suivantes :
   - `Project URL` → VITE_SUPABASE_URL
   - `anon public` key → VITE_SUPABASE_ANON_KEY

### C. Appliquer le schéma de base de données

**Option 1 : Via l'interface Supabase (recommandé)**

1. Aller dans **SQL Editor**
2. Cliquer sur **New Query**
3. Copier-coller le contenu de `supabase/migrations/20260207_initial_schema.sql`
4. Cliquer sur **Run**
5. Vérifier qu'il n'y a pas d'erreurs

**Option 2 : Via Supabase CLI**

```bash
# Se connecter à Supabase
supabase login

# Lier le projet local au projet distant
supabase link --project-ref YOUR_PROJECT_REF

# Appliquer les migrations
supabase db push
```

### D. Créer un utilisateur admin

Dans le **SQL Editor**, exécuter :

```sql
-- Créer un utilisateur dans Auth
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  role
) VALUES (
  gen_random_uuid(),
  'contact@appalacarte.fr',
  crypt('VotreMotDePasse123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated'
);

-- Lier l'utilisateur à la table utilisateurs
INSERT INTO public.utilisateurs (
  email,
  nom,
  prenom,
  role,
  permissions,
  actif
) VALUES (
  'contact@appalacarte.fr',
  'CHAMPAGNE',
  'Hervé',
  'admin',
  ARRAY['admin_access', 'manage_users', 'view_all_data'],
  true
);
```

---

## 3. Migration du code

### A. Sur votre PC - Cloner le projet

```bash
# Créer un dossier pour le projet
mkdir depannage-entretien
cd depannage-entretien

# Copier tous les fichiers depuis Lumi
# (Utiliser FTP, copier-coller, ou récupérer l'archive zip)

# Initialiser Git
git init
git add .
git commit -m "Initial commit - Migration from Lumi"
```

### B. Installer les dépendances

```bash
npm install
```

Si vous rencontrez des erreurs, essayez :

```bash
npm install --legacy-peer-deps
```

### C. Configuration des variables d'environnement

1. Copier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

2. Éditer `.env` avec vos clés Supabase :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-anon-key
```

### D. Adaptation du code existant

**Remplacer toutes les références à `lumi` par `db` (Supabase)**

**Exemple de conversion :**

**Avant (Lumi) :**
```typescript
import { lumi } from '../lib/lumi';

const { list } = await lumi.entities.clients.list();
```

**Après (Supabase) :**
```typescript
import { db } from '../lib/supabase';

const clients = await db.clients.list();
```

**Script de remplacement automatique (optionnel) :**

Créer un fichier `migrate-imports.sh` :

```bash
#!/bin/bash

# Remplacer les imports
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/from.*lumi.*$/from "@\/lib\/supabase";/g'

# Remplacer lumi.entities par db
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/lumi\.entities\./db./g'

echo "Migration des imports terminée!"
```

Exécuter :
```bash
chmod +x migrate-imports.sh
./migrate-imports.sh
```

---

## 4. Configuration locale

### A. Démarrer le serveur de développement

```bash
npm run dev
```

Votre application devrait être accessible sur `http://localhost:3000`

### B. Configuration VSCode (recommandé)

**Créer `.vscode/settings.json` :**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

**Créer `.vscode/extensions.json` :**

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase-vscode"
  ]
}
```

### C. Tests de connexion

**Créer `src/test-connection.ts` :**

```typescript
import { db, supabase } from './lib/supabase';

async function testConnection() {
  try {
    console.log('🔄 Test de connexion à Supabase...');
    
    // Test 1: Connexion basique
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('count');
    
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    
    console.log('✅ Connexion réussie!');
    console.log('📊 Nombre d\'utilisateurs:', data);
    
    // Test 2: API wrapper
    const users = await db.users.list();
    console.log('👥 Utilisateurs:', users);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testConnection();
```

Lancer le test :
```bash
npx tsx src/test-connection.ts
```

---

## 5. Déploiement en production

### Option 1 : Vercel (Recommandé - Gratuit)

#### A. Préparation

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login
```

#### B. Configuration

**Créer `vercel.json` :**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

#### C. Déploiement

```bash
# Premier déploiement
vercel

# Suivre les instructions
# Choisir un nom de projet
# Configurer les variables d'environnement quand demandé

# Pour déployer en production
vercel --prod
```

#### D. Ajouter les variables d'environnement

1. Aller sur https://vercel.com/dashboard
2. Sélectionner votre projet
3. Aller dans **Settings** > **Environment Variables**
4. Ajouter :
   - `VITE_SUPABASE_URL` = votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = votre clé anon

5. Redéployer :
```bash
vercel --prod
```

---

### Option 2 : Netlify

#### A. Installation

```bash
npm install -g netlify-cli
netlify login
```

#### B. Configuration

**Créer `netlify.toml` :**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

#### C. Déploiement

```bash
# Initialiser
netlify init

# Déployer
netlify deploy --prod
```

---

### Option 3 : VPS (DigitalOcean, OVH, etc.)

#### A. Prérequis

- Serveur Ubuntu 22.04+
- Accès SSH
- Nom de domaine (optionnel)

#### B. Installation sur le serveur

```bash
# Se connecter au serveur
ssh user@your-server-ip

# Mettre à jour
sudo apt update && sudo apt upgrade -y

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installer Nginx
sudo apt install -y nginx

# Installer PM2 (gestionnaire de processus)
sudo npm install -g pm2
```

#### C. Déployer l'application

```bash
# Cloner le repo (depuis GitHub/GitLab)
git clone https://github.com/votre-compte/depannage-entretien.git
cd depannage-entretien

# Installer les dépendances
npm install

# Créer le fichier .env
nano .env
# Ajouter vos variables

# Builder l'application
npm run build

# Servir avec PM2
pm2 serve dist 3000 --name depannage-entretien --spa

# Sauvegarder la config PM2
pm2 save
pm2 startup
```

#### D. Configurer Nginx

```bash
# Créer la configuration
sudo nano /etc/nginx/sites-available/depannage-entretien

# Coller cette configuration :
```

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    root /home/user/depannage-entretien/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Optimisations
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # Cache des assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/depannage-entretien /etc/nginx/sites-enabled/

# Tester la config
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

#### E. SSL avec Let's Encrypt (HTTPS)

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d votre-domaine.com

# Le renouvellement est automatique!
```

---

## 6. Vérifications et tests

### Checklist de déploiement

- [ ] ✅ Base de données Supabase créée et migrée
- [ ] ✅ Utilisateur admin créé et testé
- [ ] ✅ Application buildée sans erreurs (`npm run build`)
- [ ] ✅ Variables d'environnement configurées
- [ ] ✅ Connexion à Supabase fonctionnelle
- [ ] ✅ Login / Logout fonctionne
- [ ] ✅ Création de client fonctionne
- [ ] ✅ Création de machine fonctionne
- [ ] ✅ Création d'intervention fonctionne
- [ ] ✅ Protocoles d'installation fonctionnent
- [ ] ✅ Upload de photos fonctionne (si applicable)
- [ ] ✅ Génération de PDF fonctionne
- [ ] ✅ Application accessible en HTTPS
- [ ] ✅ Responsive design vérifié (mobile/tablet)

### Tests à effectuer

**1. Test de connexion :**
```
- Se connecter avec un compte administrateur validé (ex: contact@appalacarte.fr)
- Vérifier l'accès au dashboard
- Se déconnecter
```

**2. Test CRUD Client :**
```
- Créer un nouveau client
- Modifier le client
- Voir la fiche client
- (Ne pas supprimer en prod!)
```

**3. Test CRUD Machine :**
```
- Ajouter une machine à un client
- Modifier les infos techniques
- Tester les configurations (V300, Pompe)
```

**4. Test Intervention :**
```
- Créer une intervention
- Démarrer le protocole d'installation
- Ajouter des sections
- Générer un PDF
```

---

## 🔧 Troubleshooting

### Problème : Erreur de connexion à Supabase

**Solution :**
```bash
# Vérifier les variables d'environnement
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Recréer le fichier .env
cp .env.example .env
# Éditer avec les bonnes valeurs
```

### Problème : Build échoue

**Solution :**
```bash
# Nettoyer le cache
rm -rf node_modules package-lock.json
npm install

# Rebuilder
npm run build
```

### Problème : RLS bloque les requêtes

**Solution (dans Supabase SQL Editor) :**
```sql
-- Temporairement désactiver RLS pour debug
ALTER TABLE nom_table DISABLE ROW LEVEL SECURITY;

-- Ou créer une politique plus permissive
CREATE POLICY "Allow all for authenticated" ON nom_table
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
```

### Problème : Import CSV ne fonctionne pas

**Vérifier :**
- Format du CSV (UTF-8, séparateur virgule)
- Noms des colonnes correspondent au schéma
- Pas de caractères spéciaux problématiques

---

## 📚 Ressources utiles

- **Documentation Supabase** : https://supabase.com/docs
- **Supabase CLI** : https://supabase.com/docs/guides/cli
- **React + Vite** : https://vitejs.dev/guide/
- **TypeScript** : https://www.typescriptlang.org/docs/

---

## 🎉 Félicitations !

Votre application Dépannage_entretien est maintenant déployée sur Supabase !

**Prochaines étapes :**
1. Importer vos données existantes
2. Former vos utilisateurs
3. Configurer les sauvegardes automatiques
4. Mettre en place le monitoring

**Support :**
- Documentation interne
- Issues : Créer un ticket sur GitHub
- Email : contact@appalacarte.fr

---

*Dernière mise à jour : 07/02/2026*
