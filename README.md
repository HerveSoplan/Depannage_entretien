# 🔧 Soplan - Application de Gestion de Maintenance

Application web de gestion des interventions, maintenances et installations pour Soplan Élevage.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- Compte Supabase

### Installation

```bash
# 1. Cloner le projet
git clone <votre-repo>
cd soplan-app

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase

# 4. Lancer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 📦 Structure du projet

```
soplan-app/
├── src/
│   ├── components/      # Composants réutilisables
│   ├── screens/         # Écrans de l'application
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Librairies (Supabase client)
│   ├── services/        # Services (PDF, Email, etc.)
│   ├── App.tsx          # Composant racine
│   └── main.tsx         # Point d'entrée
├── supabase/
│   ├── config.toml      # Configuration Supabase
│   └── migrations/      # Migrations SQL
├── public/              # Assets statiques
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🛠️ Scripts disponibles

```bash
npm run dev          # Démarrer en développement
npm run build        # Build pour production
npm run preview      # Prévisualiser le build
npm run lint         # Linter le code
```

## 🗄️ Base de données

### Schema principal

- **utilisateurs** : Comptes utilisateurs et techniciens
- **clients** : Clients et fermes
- **machines** : Machines et équipements
- **interventions** : Interventions de tous types
- **installation_protocols** : Protocoles d'installation
- **commissioning_protocols** : Protocoles de mise en service
- **spare_parts** : Pièces détachées
- **maintenance_kits** : Kits d'entretien
- **error_codes** : Codes d'erreur et solutions

### Migrations

Les migrations se trouvent dans `supabase/migrations/`.

Pour appliquer :
```bash
supabase db push
```

## 🔐 Authentification

L'application utilise Supabase Auth.

**Utilisateur par défaut :**
- Email : `admin@soplanelevage.fr`
- Mot de passe : (défini lors de la création)

## 📱 Fonctionnalités

### ✅ Gestion des clients
- Fiche client complète
- Géolocalisation
- Historique des interventions
- Messagerie client

### ✅ Gestion des machines
- Configuration technique (V300, Pompes, etc.)
- Champs dynamiques personnalisables
- Historique de maintenance
- Compteur horaire

### ✅ Interventions
- Installation
- Mise en service
- Maintenance préventive
- Dépannage
- Contrôle

### ✅ Protocoles
- **Installation** : Checklist complète par sections
- **Mise en service** : Vérifications techniques
- Suivi GPS des interventions
- Photos et observations
- Génération de PDF

### ✅ Maintenance
- Kits d'entretien prédéfinis
- Tâches par section
- Multi-machines
- Suivi du temps passé

### ✅ Administration
- Import/Export CSV
- Gestion des utilisateurs
- Codes d'erreur
- Traductions multilingues

## 🌍 Déploiement

Voir le guide complet : [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Options de déploiement

1. **Vercel** (recommandé) - Gratuit
2. **Netlify** - Gratuit
3. **VPS** (DigitalOcean, OVH, etc.)

## 🔧 Configuration

### Variables d'environnement

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### Supabase

Configuration dans `supabase/config.toml`.

## 📊 Monitoring et logs

- **Supabase Dashboard** : Logs SQL, Auth, Storage
- **Vercel Analytics** : Performance et usage
- **Browser Console** : Logs applicatifs

## 🐛 Debugging

### Mode développement

```bash
npm run dev
```

### Logs Supabase

```bash
supabase logs
```

### Vérifier la connexion

```bash
npx tsx src/test-connection.ts
```

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/ma-feature`
2. Commiter : `git commit -m "Ajout de ma feature"`
3. Push : `git push origin feature/ma-feature`
4. Créer une Pull Request

## 📄 Licence

Propriétaire - Soplan Élevage © 2026

## 💬 Support

- Documentation : `/docs`
- Email : support@soplanelevage.fr
- Issues : GitHub Issues

---

**Version** : 1.0.0  
**Dernière mise à jour** : 07/02/2026
