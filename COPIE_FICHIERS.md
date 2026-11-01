# 📂 Instructions de copie des fichiers

## 🎯 Objectif
Copier vos fichiers existants depuis votre projet Lumi dans cette nouvelle structure Supabase.

---

## 📋 Fichiers à copier depuis votre projet actuel

### ✅ Composants (src/components/)

Copier TOUS vos composants depuis votre projet Lumi :

```
DEPUIS votre projet Lumi          VERS ce projet
────────────────────────          ─────────────
src/components/common/            → src/components/common/
src/components/admin/             → src/components/admin/
src/components/forms/             → src/components/forms/
src/components/layout/            → src/components/layout/
(tous les autres composants)      → src/components/
```

**Fichiers concernés :**
- Card.tsx
- Button.tsx
- Input.tsx
- Select.tsx
- TextArea.tsx
- Modal.tsx
- Layout.tsx
- Navigation.tsx
- DataTable.tsx
- CSVImporter.tsx
- MaintenanceKitImporter.tsx
- GPSTrackingAlert.tsx
- etc.


### ✅ Écrans (src/screens/)

Copier TOUS vos écrans :

```
DEPUIS votre projet Lumi          VERS ce projet
────────────────────────          ─────────────
src/screens/                      → src/screens/
```

**Fichiers déjà identifiés dans votre projet :**
- App.tsx
- ClientsScreen.tsx
- ClientDetailScreen.tsx
- ClientFormScreen.tsx
- ClientMessagesScreen.tsx
- MachinesScreen.tsx
- MachineDetailScreen.tsx
- MachineFormScreen.tsx
- InterventionsScreen.tsx
- InterventionDetailScreen.tsx
- MaintenanceScreen.tsx
- MaintenanceExecutionScreen.tsx
- MaintenanceInterventionScreen.tsx
- MaintenanceKitSelectionScreen.tsx
- MaintenanceSectionSelectionScreen.tsx
- MaintenanceHistoryView.tsx
- MultiMachineKitSelectionScreen.tsx
- MultiMachineSectionSelectionScreen.tsx
- TaskExecutionScreen.tsx
- CommissioningProtocolScreen.tsx
- InstallationProtocolScreen.tsx
- DatabaseAdminScreen.tsx
- LanguageConfigScreen.tsx
- TranslationEditorScreen.tsx
- UsersScreen.tsx


### ✅ Hooks (src/hooks/)

Copier TOUS vos hooks :

```
DEPUIS votre projet Lumi          VERS ce projet
────────────────────────          ─────────────
src/hooks/                        → src/hooks/
```

**Fichiers déjà identifiés :**
- useAuth.ts
- useClients.ts
- useClientMessages.ts
- useMachines.ts
- useMachineFields.ts
- useMachineFieldOptions.ts
- useInterventions.ts
- useInterventionGPS.ts
- useUsers.ts
- useInstallationProtocol.ts
- useCommissioningProtocol.ts
- useSpareParts.ts
- useMaintenanceKits.ts
- useTachesEntretien.ts
- useErrorCodes.ts
- useLanguages.ts
- useTranslation.ts

⚠️ **IMPORTANT:** Ces fichiers seront automatiquement migrés par le script
`migrate-to-supabase.sh` pour utiliser Supabase au lieu de Lumi.


### ✅ Services (src/services/)

Copier TOUS vos services :

```
DEPUIS votre projet Lumi          VERS ce projet
────────────────────────          ─────────────
src/services/                     → src/services/
```

**Fichiers déjà identifiés :**
- pdfGenerator.ts
- emailService.ts
- notificationService.ts
- installationReportService.ts
- installationReportPDF.ts
- geoUtils.ts


### ✅ Autres fichiers

**Composants spéciaux :**
```
AddMachineModal.tsx               → src/components/
ClientDetailCard.tsx              → src/components/
ClientMessageCard.tsx             → src/components/
ClientMessageModal.tsx            → src/components/
CloseInterventionModal.tsx        → src/components/
InterventionCard.tsx              → src/components/
InterventionHistoryCard.tsx       → src/components/
MachineCard.tsx                   → src/components/
```

**Fichier App.tsx :**
```
App.tsx                           → src/App.tsx
```

⚠️ Attention : App.tsx sera aussi migré automatiquement.


### ⚠️ Fichiers à NE PAS copier

**NE PAS copier ces fichiers (déjà créés dans la nouvelle structure) :**
- ❌ src/lib/lumi.ts (remplacé par src/lib/supabase.ts)
- ❌ src/main.tsx (déjà créé)
- ❌ src/index.css (déjà créé)
- ❌ package.json (déjà créé avec les bonnes dépendances)
- ❌ vite.config.ts (déjà créé)
- ❌ tsconfig.json (déjà créé)

---

## 🚀 Procédure de copie

### Option 1 : Copie manuelle (Windows/Mac/Linux)

#### Sous Windows :
```batch
REM Ouvrir deux explorateurs de fichiers
REM 1. Votre ancien projet Lumi
REM 2. Ce nouveau projet soplan-app

REM Copier-coller les dossiers :
REM - src/components → soplan-app/src/components
REM - src/screens → soplan-app/src/screens
REM - src/hooks → soplan-app/src/hooks
REM - src/services → soplan-app/src/services
```

#### Sous Mac/Linux :
```bash
# Depuis votre terminal
cd /chemin/vers/votre-ancien-projet-lumi

# Copier les composants
cp -r src/components/* /chemin/vers/soplan-app/src/components/

# Copier les écrans
cp -r src/screens/* /chemin/vers/soplan-app/src/screens/

# Copier les hooks
cp -r src/hooks/* /chemin/vers/soplan-app/src/hooks/

# Copier les services
cp -r src/services/* /chemin/vers/soplan-app/src/services/

# Copier App.tsx
cp src/App.tsx /chemin/vers/soplan-app/src/
```

### Option 2 : Depuis Lumi (si vous avez un export)

Si vous avez téléchargé une archive depuis Lumi :

1. Décompresser l'archive
2. Ouvrir les deux dossiers côte à côte
3. Copier les dossiers listés ci-dessus

---

## ✅ Vérification après copie

Vérifier que vous avez bien ces dossiers :

```
soplan-app/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Card.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   ├── admin/
│   │   ├── forms/
│   │   └── ...
│   ├── screens/
│   │   ├── ClientsScreen.tsx
│   │   ├── MachinesScreen.tsx
│   │   ├── InterventionsScreen.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useClients.ts
│   │   ├── useMachines.ts
│   │   └── ...
│   ├── services/
│   │   ├── pdfGenerator.ts
│   │   ├── emailService.ts
│   │   └── ...
│   ├── lib/
│   │   └── supabase.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
```

---

## 🔄 Après la copie

Une fois tous les fichiers copiés :

1. **Lancer le script de migration :**
   ```bash
   ./migrate-to-supabase.sh
   ```
   
   Ce script va :
   - Créer un backup
   - Remplacer tous les imports `lumi` par `supabase`
   - Adapter les appels d'API

2. **Vérifier les modifications :**
   ```bash
   # Voir les fichiers modifiés
   git status
   
   # Voir les changements dans un fichier
   git diff src/hooks/useClients.ts
   ```

3. **Installer les dépendances :**
   ```bash
   npm install
   ```

4. **Lancer l'application :**
   ```bash
   npm run dev
   ```

---

## 🐛 En cas de problème

### Fichiers manquants

Si après la copie il manque des fichiers :

```bash
# Lister tous les fichiers .tsx et .ts dans votre ancien projet
find /chemin/ancien-projet/src -name "*.tsx" -o -name "*.ts"

# Comparer avec le nouveau projet
find ./src -name "*.tsx" -o -name "*.ts"
```

### Erreurs d'import

Si vous avez des erreurs d'import après migration :

1. Vérifier que le fichier importé existe
2. Vérifier le chemin d'import (relatif vs absolu)
3. Consulter TROUBLESHOOTING.md

### Doutes sur la structure

En cas de doute, la structure de référence est :

```
src/
├── components/    → Tous les composants réutilisables
├── screens/       → Tous les écrans/pages
├── hooks/         → Tous les hooks personnalisés
├── services/      → Services (PDF, email, etc.)
├── lib/           → Librairies (Supabase, utils)
├── App.tsx        → Composant racine
└── main.tsx       → Point d'entrée
```

---

## 💡 Conseils

1. **Copier par étapes** : Ne copiez pas tout d'un coup, procédez dossier par dossier
2. **Vérifier après chaque copie** : Assurez-vous que les fichiers sont bien là
3. **Faire des commits Git** : Committez après chaque grande étape
4. **Tester régulièrement** : Lancez `npm run dev` pour vérifier que ça fonctionne

---

**Prêt ?** → Commencez par copier `src/components/`, puis testez !

---

*Dernière mise à jour : 07/02/2026*
