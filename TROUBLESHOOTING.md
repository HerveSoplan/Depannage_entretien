# 🔧 Guide de Dépannage Rapide

## 🚨 Problèmes fréquents et solutions

### ❌ Erreur : "Missing Supabase environment variables"

**Symptôme :** L'application crash au démarrage avec ce message

**Solutions :**
```bash
# 1. Vérifier que le fichier .env existe
ls -la .env

# 2. Vérifier le contenu
cat .env

# 3. S'assurer que les variables sont définies
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# 4. Redémarrer le serveur
npm run dev
```

---

### ❌ Erreur : "Failed to fetch" ou "Network error"

**Symptôme :** Impossible de se connecter à Supabase

**Diagnostic :**
```bash
# Tester la connexion à Supabase
curl https://votre-projet.supabase.co/rest/v1/

# Devrait retourner quelque chose, même une erreur 401
```

**Solutions :**
1. Vérifier que l'URL Supabase est correcte
2. Vérifier la connexion internet
3. Vérifier que le projet Supabase est actif
4. Dans Supabase Dashboard > Settings > API, vérifier que l'API est activée

---

### ❌ Erreur : "JWT expired" ou "Invalid JWT"

**Symptôme :** Déconnexion automatique ou erreurs d'authentification

**Solutions :**
```bash
# 1. Se déconnecter complètement
# Cliquer sur "Déconnexion"

# 2. Vider le localStorage
# Dans la console du navigateur :
localStorage.clear()

# 3. Se reconnecter
```

---

### ❌ Erreur : "Row level security policy violation"

**Symptôme :** Impossible de lire/écrire des données, erreurs 403

**Diagnostic :**
```sql
-- Dans Supabase SQL Editor, vérifier les politiques
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

**Solution temporaire (DEV SEULEMENT) :**
```sql
-- Désactiver RLS temporairement pour debug
ALTER TABLE nom_table DISABLE ROW LEVEL SECURITY;
```

**Solution permanente :**
```sql
-- Créer une politique permissive
CREATE POLICY "Allow all for authenticated" ON nom_table
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Puis réactiver RLS
ALTER TABLE nom_table ENABLE ROW LEVEL SECURITY;
```

---

### ❌ Build échoue : "TypeScript errors"

**Symptôme :** `npm run build` échoue avec des erreurs TypeScript

**Solutions :**
```bash
# 1. Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install

# 2. Vérifier les types
npm run build -- --mode development

# 3. Si erreurs persistent, mode strict
# Dans tsconfig.json, temporairement :
{
  "compilerOptions": {
    "strict": false,  // Mettre à false temporairement
    "skipLibCheck": true
  }
}
```

---

### ❌ Erreur : "Module not found"

**Symptôme :** Erreur d'import de module

**Solutions :**
```bash
# 1. Réinstaller les dépendances
npm install

# 2. Vérifier les chemins d'import
# Remplacer les imports absolus par relatifs
# Au lieu de : import { db } from '@/lib/supabase'
# Utiliser : import { db } from '../lib/supabase'

# 3. Vérifier tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### ❌ CSV Import ne fonctionne pas

**Symptôme :** Erreur lors de l'import de fichiers CSV

**Vérifications :**
1. Format UTF-8 (sans BOM)
2. Séparateur : virgule `,`
3. Noms de colonnes correspondent exactement au schéma
4. Pas de guillemets étranges

**Exemple de CSV valide pour clients :**
```csv
numeroClient,nom,nomFerme,email,telephone,ville
C001,Dupont,Ferme du Soleil,dupont@email.fr,0601020304,Paris
C002,Martin,Ferme des Prés,martin@email.fr,0605060708,Lyon
```

**Script de nettoyage CSV (Linux/Mac) :**
```bash
# Convertir en UTF-8
iconv -f ISO-8859-1 -t UTF-8 fichier.csv > fichier_clean.csv

# Supprimer les BOM
sed -i '1s/^\xEF\xBB\xBF//' fichier_clean.csv
```

---

### ❌ Photos ne s'uploadent pas

**Symptôme :** Erreur lors de l'upload de photos

**Solutions :**

**1. Configurer Storage dans Supabase :**
```sql
-- Créer un bucket public
INSERT INTO storage.buckets (id, name, public)
VALUES ('interventions-photos', 'interventions-photos', true);

-- Créer une politique
CREATE POLICY "Public Access"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'interventions-photos');
```

**2. Vérifier le code :**
```typescript
// src/services/uploadService.ts
import { supabase } from '../lib/supabase';

export async function uploadPhoto(file: File, interventionId: string) {
  const filename = `${interventionId}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('interventions-photos')
    .upload(filename, file);
  
  if (error) throw error;
  
  // Obtenir l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from('interventions-photos')
    .getPublicUrl(filename);
  
  return publicUrl;
}
```

---

### ❌ PDF ne se génère pas

**Symptôme :** Erreur lors de la génération de PDF

**Solutions :**
```bash
# 1. Vérifier que jspdf est installé
npm list jspdf

# 2. Réinstaller si nécessaire
npm install jspdf

# 3. Vérifier les imports
import jsPDF from 'jspdf';

# 4. Tester en debug
console.log('jsPDF version:', jsPDF.version);
```

---

### ❌ Données ne se sauvegardent pas

**Symptôme :** Formulaires se vident, données non persistées

**Diagnostic :**
```typescript
// Ajouter des logs pour debugger
try {
  console.log('Données à sauvegarder:', data);
  const result = await db.clients.create(data);
  console.log('Résultat:', result);
} catch (error) {
  console.error('Erreur détaillée:', error);
  // Regarder error.message, error.code, error.details
}
```

**Solutions :**
1. Vérifier que les champs requis sont remplis
2. Vérifier les contraintes de la base (UNIQUE, NOT NULL)
3. Vérifier les politiques RLS
4. Vérifier les logs dans Supabase Dashboard > Logs

---

### ❌ Application lente

**Symptôme :** Chargements lents, UI qui lag

**Optimisations :**

**1. Limiter les requêtes :**
```typescript
// Avant
const allData = await db.clients.list(); // Récupère tout

// Après
const recentData = await supabase
  .from('clients')
  .select('*')
  .limit(50)
  .order('created_at', { ascending: false });
```

**2. Utiliser la pagination :**
```typescript
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .range(0, 19); // Page 1 (0-19)
```

**3. Créer des index :**
```sql
-- Dans Supabase SQL Editor
CREATE INDEX idx_machines_client ON machines(client_id);
CREATE INDEX idx_interventions_statut ON interventions(statut);
```

---

### ❌ Déploiement Vercel échoue

**Symptôme :** Build échoue sur Vercel

**Solutions :**

**1. Vérifier les variables d'environnement :**
- Settings > Environment Variables
- Ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`

**2. Vérifier le build command :**
```json
// vercel.json ou dans les settings
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

**3. Forcer le redéploiement :**
```bash
vercel --prod --force
```

---

### ❌ CORS errors

**Symptôme :** Erreurs CORS dans la console

**Solutions :**

**1. Vérifier l'URL autorisée dans Supabase :**
- Settings > API > URL Configuration
- Ajouter l'URL de production

**2. Pour Vercel, ajouter :**
```
https://votre-app.vercel.app
```

**3. Pour localhost :**
```
http://localhost:3000
```

---

## 🛠️ Outils de diagnostic

### Console du navigateur
```javascript
// Tester la connexion Supabase
import { supabase } from './lib/supabase';

// Vérifier la session
const session = await supabase.auth.getSession();
console.log('Session:', session);

// Tester une requête
const { data, error } = await supabase.from('clients').select('count');
console.log('Count:', data, error);
```

### Logs Supabase
1. Dashboard > Logs
2. Filtrer par type (API, Auth, Realtime)
3. Chercher les erreurs 4xx, 5xx

### Network tab (DevTools)
- Ouvrir F12 > Network
- Filtrer "Fetch/XHR"
- Regarder les requêtes qui échouent
- Examiner les headers et payloads

---

## 📞 Besoin d'aide ?

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev/)
- `DEPLOYMENT_GUIDE.md` dans le projet

### Support
- Email : contact@appalacarte.fr
- Issues : GitHub (si configuré)

### Avant de contacter le support

Préparez :
1. Message d'erreur exact
2. Étapes pour reproduire
3. Console logs
4. Captures d'écran
5. Fichiers de configuration (sans les clés secrètes!)

---

**Dernière mise à jour :** 07/02/2026
