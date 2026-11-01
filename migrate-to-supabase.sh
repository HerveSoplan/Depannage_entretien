#!/bin/bash

# Script de migration automatique Lumi → Supabase
# Usage: ./migrate-to-supabase.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Début de la migration Lumi → Supabase"
echo "=========================================="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction de log
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Vérifier les prérequis
echo ""
echo "📋 Vérification des prérequis..."

if ! command -v node &> /dev/null; then
    log_error "Node.js n'est pas installé"
    exit 1
fi
log_success "Node.js installé ($(node --version))"

if ! command -v npm &> /dev/null; then
    log_error "npm n'est pas installé"
    exit 1
fi
log_success "npm installé ($(npm --version))"

# 2. Backup du code existant
echo ""
echo "💾 Création d'un backup..."

if [ -d "backup" ]; then
    log_warning "Le dossier backup existe déjà"
    read -p "Voulez-vous l'écraser? (o/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        rm -rf backup
    else
        log_error "Migration annulée"
        exit 1
    fi
fi

mkdir -p backup
if [ -d "src" ]; then
    cp -r src backup/src-$(date +%Y%m%d-%H%M%S)
    log_success "Backup créé dans backup/"
fi

# 3. Migration des imports
echo ""
echo "📝 Migration des imports Lumi → Supabase..."

# Créer le dossier src s'il n'existe pas
mkdir -p src/lib src/hooks src/components src/screens src/services

# Fonction pour migrer un fichier
migrate_file() {
    local file="$1"
    
    # Backup du fichier
    cp "$file" "$file.bak"
    
    # Remplacer les imports de lumi
    sed -i.tmp "s|from ['\"].*lumi['\"]|from '@/lib/supabase'|g" "$file"
    sed -i.tmp "s|import { lumi }|import { db, supabase }|g" "$file"
    
    # Remplacer lumi.entities par db
    sed -i.tmp 's/lumi\.entities\./db./g' "$file"
    
    # Corrections spécifiques
    sed -i.tmp 's/await lumi\.entities\.clients\.list({})/await db.clients.list()/g' "$file"
    sed -i.tmp 's/\.list({ sort: .* })/\.list()/g' "$file"
    
    # Nettoyer les fichiers temporaires
    rm -f "$file.tmp"
    
    echo "  ✓ Migré: $file"
}

# Trouver et migrer tous les fichiers TypeScript
if [ -d "src" ]; then
    echo "Migration des fichiers dans src/..."
    find src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
        if grep -q "lumi" "$file" 2>/dev/null; then
            migrate_file "$file"
        fi
    done
    log_success "Fichiers migrés"
else
    log_warning "Dossier src/ non trouvé"
fi

# 4. Vérifier la configuration
echo ""
echo "⚙️  Vérification de la configuration..."

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_warning "Fichier .env créé depuis .env.example"
        log_warning "⚠️  IMPORTANT: Éditer .env avec vos clés Supabase!"
    else
        log_error "Fichier .env.example non trouvé"
    fi
else
    log_success "Fichier .env existe"
fi

# 5. Vérifier package.json
echo ""
echo "📦 Vérification des dépendances..."

if [ -f "package.json" ]; then
    # Vérifier si @supabase/supabase-js est présent
    if ! grep -q "@supabase/supabase-js" package.json; then
        log_warning "Ajout de @supabase/supabase-js aux dépendances"
        npm install @supabase/supabase-js
    fi
    log_success "Dépendances Supabase présentes"
else
    log_error "package.json non trouvé"
    exit 1
fi

# 6. Nettoyer les backups de fichiers
echo ""
echo "🧹 Nettoyage..."
find src -name "*.bak" -delete 2>/dev/null || true
log_success "Fichiers de backup nettoyés"

# 7. Résumé
echo ""
echo "=========================================="
echo "✨ Migration terminée!"
echo "=========================================="
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Configurer .env avec vos clés Supabase:"
echo "   VITE_SUPABASE_URL=https://xxxxx.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY=eyJxxx..."
echo ""
echo "2. Installer les dépendances:"
echo "   npm install"
echo ""
echo "3. Tester la connexion:"
echo "   npm run dev"
echo ""
echo "4. En cas de problème:"
echo "   - Vérifier les logs de la console"
echo "   - Restaurer depuis backup/ si nécessaire"
echo "   - Consulter DEPLOYMENT_GUIDE.md"
echo ""
echo "📁 Backup sauvegardé dans: backup/"
echo ""

# Demander si on veut installer les dépendances
read -p "Voulez-vous installer les dépendances maintenant? (O/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    echo "📦 Installation des dépendances..."
    npm install
    log_success "Dépendances installées"
    
    echo ""
    read -p "Voulez-vous démarrer le serveur de dev? (O/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo ""
        log_success "Démarrage du serveur..."
        npm run dev
    fi
fi

echo ""
echo "🎉 Bonne migration!"
