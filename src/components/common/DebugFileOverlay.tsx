// src/components/common/DebugFileOverlay.tsx
// ⚠️ DÉVELOPPEMENT UNIQUEMENT — SUPPRIMER AVANT PRODUCTION ⚠️

import React from 'react';

interface DebugFileOverlayProps {
  currentScreen: string;
}

const SCREEN_TO_FILE: Record<string, string> = {
  'dashboard': 'screens/Dashboard.tsx',
  'clients': 'screens/clients/ClientsScreen.tsx',
  'client-detail': 'screens/clients/ClientDetailScreen.tsx',
  'client-form': 'screens/clients/ClientFormScreen.tsx',
  'machines': 'screens/machines/MachinesScreen.tsx',
  'machine-detail': 'screens/machines/MachineDetailScreen.tsx',
  'client-machine-detail': 'screens/machines/MachineDetailScreen.tsx',
  'machine-form': 'screens/machines/MachineFormScreen.tsx',
  'interventions': 'screens/interventions/InterventionsScreen.tsx',
  'intervention-detail': 'screens/interventions/InterventionDetailScreen.tsx',
  'intervention-form': 'screens/interventions/InterventionFormScreen.tsx',
  'commissioning-protocol': 'screens/interventions/CommissioningProtocolScreen.tsx',
  'installation-protocol': 'screens/interventions/InstallationProtocolScreen.tsx',
  'maintenance-history-view': 'screens/interventions/MaintenanceHistoryView.tsx',
  'maintenance-intervention': 'screens/interventions/MaintenanceInterventionScreen.tsx',
  'maintenance-section-selection': 'screens/interventions/MaintenanceSectionSelectionScreen.tsx',
  'maintenance-execution': 'screens/interventions/MaintenanceExecutionScreen.tsx',
  'multi-machine-kit-selection': 'screens/interventions/MultiMachineKitSelectionScreen.tsx',
  'multi-machine-section-selection': 'screens/interventions/MultiMachineSectionSelectionScreen.tsx',
  'task-execution': 'screens/interventions/TaskExecutionScreen.tsx',
  'maintenance': 'screens/maintenance/MaintenanceScreen.tsx',
  'maintenance-kit-selection': 'screens/maintenance/MaintenanceKitSelectionScreen.tsx',
  'spare-parts': 'screens/spare-parts/SparePartsScreen.tsx',
  'spare-part-detail': 'screens/spare-parts/SparePartDetailScreen.tsx',
  'spare-part-form': 'screens/spare-parts/SparePartFormScreen.tsx',
  'users': 'screens/users/UsersScreen.tsx',
  'troubleshooting': 'screens/help/TroubleshootingScreen.tsx',
  'database-admin': 'screens/admin/DatabaseAdminScreen.tsx',
  'language-config': 'screens/admin/LanguageConfigScreen.tsx',
  'translation-editor': 'screens/admin/TranslationEditorScreen.tsx',
};

export function DebugFileOverlay({ currentScreen }: DebugFileOverlayProps) {
  const fileName = SCREEN_TO_FILE[currentScreen] || `❓ "${currentScreen}" — non mappé`;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(15, 15, 30, 0.82)',
      color: '#00e676',
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      padding: '5px 14px',
      zIndex: 99999,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      pointerEvents: 'none',
      borderTop: '1px solid rgba(0, 230, 118, 0.25)',
    }}>
      <span>📄 <strong>{fileName}</strong></span>
      <span style={{ color: '#555', fontSize: '11px' }}>⚠️ DEBUG — À SUPPRIMER</span>
    </div>
  );
}
