import react from '@vitejs/plugin-react-swc';
import { defineConfig, Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// Plugin personnalisé assurant la synchronisation automatique de version à chaque build
function versionSyncPlugin(): Plugin {
  return {
    name: 'version-sync-plugin',
    buildStart() {
      try {
        const pkgPath = path.resolve(__dirname, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const version = pkg.version || '1.12.1';
        const buildInfo = {
          version,
          name: 'Dépannage_entretien',
          updatedAt: new Date().toISOString(),
          timestamp: Date.now(),
        };

        const publicVersionPath = path.resolve(__dirname, 'public', 'version.json');
        fs.writeFileSync(publicVersionPath, JSON.stringify(buildInfo, null, 2), 'utf-8');
      } catch (err) {
        console.warn('Erreur mise à jour automatique version.json:', err);
      }
    },
    transformIndexHtml(html) {
      try {
        const pkgPath = path.resolve(__dirname, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const version = pkg.version || '1.12.1';
        const now = Date.now();
        return html
          .replace(/__APP_VERSION__/g, version)
          .replace(/__BUILD_TIMESTAMP__/g, String(now));
      } catch {
        return html;
      }
    },
    generateBundle() {
      try {
        const pkgPath = path.resolve(__dirname, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const version = pkg.version || '1.12.1';
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({
            version,
            name: 'Dépannage_entretien',
            updatedAt: new Date().toISOString(),
            timestamp: Date.now(),
          }, null, 2)
        });
      } catch (err) {
        console.warn('Erreur émission version.json dans dist:', err);
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), versionSyncPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5174,
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'lucide': ['lucide-react'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable'],
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities']
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
