// src/components/common/DebugFileOverlay.tsx
// ⚠️ BARRE D'AIDE AU DÉBOGAGE & REMONTÉE D'ERREURS ⚠️

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Copy, Check, FileCode } from 'lucide-react';

interface DebugFileOverlayProps {
  currentScreen?: string;
}

const SCREEN_TO_FILE: Record<string, string> = {
  'dashboard': 'src/screens/Dashboard.tsx',
  'clients': 'src/screens/clients/ClientsScreen.tsx',
  'client-detail': 'src/screens/clients/ClientDetailScreen.tsx',
  'client-form': 'src/screens/clients/ClientFormScreen.tsx',
  'machines': 'src/screens/machines/MachinesScreen.tsx',
  'machine-detail': 'src/screens/machines/MachineDetailScreen.tsx',
  'client-machine-detail': 'src/screens/machines/MachineDetailScreen.tsx',
  'machine-form': 'src/screens/machines/MachineFormScreen.tsx',
  'interventions': 'src/screens/interventions/InterventionsScreen.tsx',
  'intervention-detail': 'src/screens/interventions/InterventionDetailScreen.tsx',
  'intervention-form': 'src/screens/interventions/InterventionFormScreen.tsx',
  'commissioning-protocol': 'src/screens/interventions/CommissioningProtocolScreen.tsx',
  'installation-protocol': 'src/screens/interventions/InstallationProtocolScreen.tsx',
  'maintenance-history-view': 'src/screens/interventions/MaintenanceHistoryView.tsx',
  'maintenance-intervention': 'src/screens/interventions/MaintenanceInterventionScreen.tsx',
  'maintenance-section-selection': 'src/screens/interventions/MaintenanceSectionSelectionScreen.tsx',
  'maintenance-execution': 'src/screens/interventions/MaintenanceExecutionScreen.tsx',
  'multi-machine-kit-selection': 'src/screens/interventions/MultiMachineKitSelectionScreen.tsx',
  'multi-machine-section-selection': 'src/screens/interventions/MultiMachineSectionSelectionScreen.tsx',
  'task-execution': 'src/screens/interventions/TaskExecutionScreen.tsx',
  'maintenance': 'src/screens/maintenance/MaintenanceScreen.tsx',
  'maintenance-kit-selection': 'src/screens/maintenance/MaintenanceKitSelectionScreen.tsx',
  'spare-parts': 'src/screens/spare-parts/SparePartsScreen.tsx',
  'spare-part-detail': 'src/screens/spare-parts/SparePartDetailScreen.tsx',
  'spare-part-form': 'src/screens/spare-parts/SparePartFormScreen.tsx',
  'users': 'src/screens/users/UsersScreen.tsx',
  'troubleshooting': 'src/screens/help/TroubleshootingScreen.tsx',
  'database-admin': 'src/screens/admin/DatabaseAdminScreen.tsx',
  'language-config': 'src/screens/admin/LanguageConfigScreen.tsx',
  'translation-editor': 'src/screens/admin/TranslationEditorScreen.tsx',
  'mentions-legales': 'src/screens/legal/MentionsLegalesScreen.tsx',
  'login': 'src/components/auth/LoginScreen.tsx',
};

function resolveFilePath(pathname: string, currentScreen?: string): string {
  // Routes spécifiques directes
  if (pathname === '/' || pathname === '') return 'src/screens/Dashboard.tsx';
  if (pathname === '/mentions-legales') return 'src/screens/legal/MentionsLegalesScreen.tsx';

  // Protocoles
  if (pathname === '/protocols/commissioning') return 'src/screens/interventions/CommissioningProtocolScreen.tsx';
  if (pathname === '/protocols/installation') return 'src/screens/interventions/InstallationProtocolScreen.tsx';

  // Administration
  if (pathname === '/admin/database') return 'src/screens/admin/DatabaseAdminScreen.tsx';
  if (pathname === '/admin/languages') return 'src/screens/admin/LanguageConfigScreen.tsx';
  if (pathname === '/admin/translations') return 'src/screens/admin/TranslationEditorScreen.tsx';

  // Interventions
  if (pathname === '/interventions/new') return 'src/screens/interventions/InterventionFormScreen.tsx';
  if (pathname === '/interventions/history') return 'src/screens/interventions/MaintenanceHistoryView.tsx';
  if (pathname === '/interventions/maintenance/select-client') return 'src/screens/interventions/MaintenanceInterventionScreen.tsx';
  if (pathname === '/interventions/maintenance/select-section') return 'src/screens/interventions/MaintenanceSectionSelectionScreen.tsx';
  if (pathname === '/interventions/multi-machine/select-kit') return 'src/screens/interventions/MultiMachineKitSelectionScreen.tsx';
  if (pathname === '/interventions/multi-machine/select-section') return 'src/screens/interventions/MultiMachineSectionSelectionScreen.tsx';
  if (pathname === '/interventions/execute-task') return 'src/screens/interventions/TaskExecutionScreen.tsx';
  if (pathname.startsWith('/interventions/') && pathname.endsWith('/edit')) return 'src/screens/interventions/InterventionFormScreen.tsx';
  if (pathname.startsWith('/interventions/') && pathname.endsWith('/execute')) return 'src/screens/interventions/MaintenanceExecutionScreen.tsx';
  if (pathname.startsWith('/interventions/') && pathname !== '/interventions') return 'src/screens/interventions/InterventionDetailScreen.tsx';
  if (pathname === '/interventions') return 'src/screens/interventions/InterventionsScreen.tsx';

  // Clients & machines liées
  if (pathname === '/clients/new') return 'src/screens/clients/ClientFormScreen.tsx';
  if (pathname.includes('/machines/')) return 'src/screens/machines/MachineDetailScreen.tsx';
  if (pathname.startsWith('/clients/') && pathname.endsWith('/edit')) return 'src/screens/clients/ClientFormScreen.tsx';
  if (pathname.startsWith('/clients/') && pathname !== '/clients') return 'src/screens/clients/ClientDetailScreen.tsx';
  if (pathname === '/clients') return 'src/screens/clients/ClientsScreen.tsx';

  // Machines
  if (pathname === '/machines/new') return 'src/screens/machines/MachineFormScreen.tsx';
  if (pathname.startsWith('/machines/') && pathname.endsWith('/edit')) return 'src/screens/machines/MachineFormScreen.tsx';
  if (pathname.startsWith('/machines/') && pathname !== '/machines') return 'src/screens/machines/MachineDetailScreen.tsx';
  if (pathname === '/machines') return 'src/screens/machines/MachinesScreen.tsx';

  // Pièces détachées
  if (pathname === '/spare-parts/new') return 'src/screens/spare-parts/SparePartFormScreen.tsx';
  if (pathname.startsWith('/spare-parts/') && pathname.endsWith('/edit')) return 'src/screens/spare-parts/SparePartFormScreen.tsx';
  if (pathname.startsWith('/spare-parts/') && pathname !== '/spare-parts') return 'src/screens/spare-parts/SparePartDetailScreen.tsx';
  if (pathname === '/spare-parts') return 'src/screens/spare-parts/SparePartsScreen.tsx';

  // Maintenance
  if (pathname === '/maintenance/select-kit') return 'src/screens/maintenance/MaintenanceKitSelectionScreen.tsx';
  if (pathname === '/maintenance') return 'src/screens/maintenance/MaintenanceScreen.tsx';

  // Dépannage et Utilisateurs
  if (pathname === '/troubleshooting') return 'src/screens/help/TroubleshootingScreen.tsx';
  if (pathname === '/users') return 'src/screens/users/UsersScreen.tsx';

  // Repli sur le mapping d'écran si fourni
  if (currentScreen && SCREEN_TO_FILE[currentScreen]) {
    return SCREEN_TO_FILE[currentScreen];
  }

  return 'src/App.tsx';
}

export function DebugFileOverlay({ currentScreen }: DebugFileOverlayProps) {
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  const filePath = resolveFilePath(location.pathname, currentScreen);

  const copyToClipboard = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(filePath);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = filePath;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Erreur lors de la copie presse-papier:', err);
      try {
        const textarea = document.createElement('textarea');
        textarea.value = filePath;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (e) {
        console.error('Erreur fallback de copie:', e);
      }
    }
  };

  return (
    <div
      role="region"
      aria-label="Barre de débogage et copie du chemin de fichier"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(11, 19, 32, 0.94)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: '#00e676',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
        fontSize: '12px',
        padding: '5px 12px',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid rgba(0, 230, 118, 0.35)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.4)',
        userSelect: 'text',
      }}
    >
      {/* Zone cliquable avec bouton Copier et chemin complet */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexWrap: 'nowrap' }}>
        <button
          type="button"
          onClick={copyToClipboard}
          title="Cliquer pour copier le chemin du fichier pour remonter l'erreur"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: copied ? 'rgba(0, 230, 118, 0.25)' : 'rgba(0, 230, 118, 0.12)',
            border: copied ? '1px solid #00e676' : '1px solid rgba(0, 230, 118, 0.4)',
            borderRadius: '5px',
            color: '#00e676',
            padding: '3px 9px',
            cursor: 'pointer',
            transition: 'all 0.15s ease-in-out',
            fontFamily: 'inherit',
            fontSize: '12px',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {copied ? (
            <>
              <Check size={14} style={{ color: '#00e676', strokeWidth: 3 }} />
              <span>Copié !</span>
            </>
          ) : (
            <>
              <Copy size={13} style={{ strokeWidth: 2 }} />
              <span>Copier le chemin</span>
            </>
          )}
        </button>

        <span
          onClick={copyToClipboard}
          title="Cliquer pour copier ce chemin de fichier"
          style={{
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#00e676',
          }}
        >
          <FileCode size={14} style={{ opacity: 0.8, flexShrink: 0 }} />
          <strong
            style={{
              textDecoration: 'underline dotted',
              textUnderlineOffset: '3px',
              letterSpacing: '0.01em',
            }}
          >
            {filePath}
          </strong>
        </span>
      </div>

      {/* Message de confirmation ou rappel de mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {copied ? (
          <span
            style={{
              color: '#a7f3d0',
              fontSize: '11px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ✓ Chemin copié dans le presse-papier !
          </span>
        ) : (
          <span style={{ color: '#64748b', fontSize: '11px' }}>
            Cliquez pour remonter l'erreur
          </span>
        )}
      </div>
    </div>
  );
}
