# 🔧 Dépannage_entretien - Application de Gestion de Maintenance et Entretien

Application web professionnelle de gestion des interventions, maintenance préventive, dépannage et suivi des équipements de terrain.

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- pnpm ou npm
- Compte Supabase

### Installation

```bash
# 1. Cloner le projet
git clone <votre-repo>
cd depannage-entretien

# 2. Installer les dépendances
npm install
# ou pnpm install

# 3. Configurer l'environnement
cp .env.example .env
# Renseigner vos clés VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 4. Lancer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:5174` (ou le port indiqué par Vite).

---

## 📦 Structure du projet

```
depannage-entretien/
├── src/
│   ├── components/      # Composants réutilisables (Navigation, Layout, Footer, Auth...)
│   ├── screens/         # Écrans fonctionnels (Clients, Machines, Interventions, Maintenance...)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Clients de données (Supabase)
│   ├── services/        # Services (PDF, Email, etc.)
│   ├── version.ts       # Constantes globales (APP_VERSION, APP_NAME, Éditeur)
│   ├── App.tsx          # Composant racine et routage
│   └── main.tsx         # Point d'entrée de l'application
├── supabase/
│   ├── config.toml      # Configuration Supabase CLI
│   └── migrations/      # Migrations et schémas SQL
├── public/              # Assets statiques
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🛠️ Scripts disponibles

```bash
npm run dev          # Démarrer en développement
npm run build        # Build pour production (Vite)
npm run preview      # Prévisualiser le build localement
npm run lint         # Contrôle ESLint
```

---

## 🗄️ Base de données (Supabase)

### Tables principales

- **utilisateurs** : Comptes utilisateurs, rôles et techniciens
- **clients** : Clients, exploitations et sites
- **machines** : Équipements, machines et configurations techniques
- **interventions** : Interventions curatives et préventives
- **installation_protocols** : Protocoles d'installation
- **commissioning_protocols** : Protocoles de mise en service
- **spare_parts** : Catalogue de pièces détachées
- **maintenance_kits** : Kits d'entretien et périodicités
- **error_codes** : Codes d'erreur et procédures de résolution

---

## 📱 Fonctionnalités

### ✅ Clients & Équipements
- Fiche client complète, localisation et coordonnées
- Inventaire des machines et historique d'interventions
- Gestion des compteurs horaires et caractéristiques techniques

### ✅ Interventions & Protocoles
- Création et affectation des interventions (Dépannage, Entretien, Contrôle, Installation)
- Checklist complète par sections et points de contrôle
- Génération automatisée des rapports d'intervention en PDF
- Signature et validation client

### ✅ Maintenance Préventive
- Kits d'entretien périodiques
- Suivi multi-machines et gestion du temps passé
- Fiches de pièces détachées et consommables associés

---

## 🌍 Déploiement

- **Hébergement recommandé** : Vercel Inc.
- **Base de données** : Supabase PostgreSQL
- **Routage SPA** : Configuré via `vercel.json`

---

## 📄 Informations Éditeur & Mentions Légales

- **Nom commercial :** App à la Carte
- **Entrepreneur :** Hervé CHAMPAGNE (Entrepreneur individuel - EI)
- **SIREN :** 132 021 098
- **SIRET :** 132 021 098 00018
- **Adresse professionnelle :** 173 rue de Courcelles, 75017 Paris, France
- **Email de contact :** contact@appalacarte.fr
- **Régime fiscal :** TVA non applicable, article 293 B du CGI (Micro-BIC)
- **Directeur de la publication :** Hervé CHAMPAGNE (EI)
