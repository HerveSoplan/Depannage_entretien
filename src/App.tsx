//App.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase, isLiveSupabaseActive } from './lib/supabase';
import { SelectedClientProvider } from './contexts/SelectedClientContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Layout } from './components/common/Layout';
import { Dashboard } from './screens/Dashboard';
import { ClientsScreen } from './screens/clients/ClientsScreen';
import { MachinesScreen } from './screens/machines/MachinesScreen';
import { MachineDetailScreen } from './screens/machines/MachineDetailScreen';
import { InterventionsScreen } from './screens/interventions/InterventionsScreen';
import { InterventionFormScreen } from './screens/interventions/InterventionFormScreen';
import { InterventionDetailScreen } from './screens/interventions/InterventionDetailScreen';
import { MaintenanceSectionSelectionScreen } from './screens/interventions/MaintenanceSectionSelectionScreen';
import { MaintenanceExecutionScreen } from './screens/interventions/MaintenanceExecutionScreen';
import { MaintenanceInterventionScreen } from './screens/interventions/MaintenanceInterventionScreen';
import { MaintenanceHistoryView } from './screens/interventions/MaintenanceHistoryView';
import { SparePartsScreen } from './screens/spare-parts/SparePartsScreen';
import { TroubleshootingScreen } from './screens/help/TroubleshootingScreen';
import { ClientDetailScreen } from './screens/clients/ClientDetailScreen';
import { UsersScreen } from './screens/users/UsersScreen';
import { ClientFormScreen } from './screens/clients/ClientFormScreen';
import { MachineFormScreen } from './screens/machines/MachineFormScreen';
import { SparePartFormScreen } from './screens/spare-parts/SparePartFormScreen';
import { SparePartDetailScreen } from './screens/spare-parts/SparePartDetailScreen';
import { MaintenanceScreen } from './screens/maintenance/MaintenanceScreen';
import { MaintenanceKitSelectionScreen } from './screens/maintenance/MaintenanceKitSelectionScreen';
import { MultiMachineKitSelectionScreen } from './screens/interventions/MultiMachineKitSelectionScreen';
import { MultiMachineSectionSelectionScreen } from './screens/interventions/MultiMachineSectionSelectionScreen';
import { TaskExecutionScreen } from './screens/interventions/TaskExecutionScreen';
import { DatabaseAdminScreen } from './screens/admin/DatabaseAdminScreen';
import { LanguageConfigScreen } from './screens/admin/LanguageConfigScreen';
import { TranslationEditorScreen } from './screens/admin/TranslationEditorScreen';
import { CommissioningProtocolScreen } from './screens/interventions/CommissioningProtocolScreen';
import { InstallationProtocolScreen } from './screens/interventions/InstallationProtocolScreen';
import { MentionsLegalesScreen } from './screens/legal/MentionsLegalesScreen';
import { DebugFileOverlay } from './components/common/DebugFileOverlay';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { hasPermission, PermissionId } from './utils/permissions';
import { APP_VERSION } from './version';

// Déclenche une purge absolue et définitive de tout cache, Service Worker et session
export const forceAppUpdate = async (targetVersion?: string) => {
  try {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) {
          await caches.delete(name);
        }
      }
      sessionStorage.clear();
      const url = new URL(window.location.href);
      url.searchParams.set('_v', Date.now().toString());
      if (targetVersion) {
        url.searchParams.set('_ver', targetVersion);
      }
      window.location.replace(url.toString());
    }
  } catch {
    window.location.reload();
  }
};

// Bandeau persistant d'actualisation de version
const VersionBanner = ({
  newVersion,
  onUpdate
}: {
  newVersion: string | null;
  onUpdate: () => void;
}) => {
  if (!newVersion) return null;
  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xl sticky top-0 z-[9999] border-b border-amber-400">
      <div className="flex items-center gap-2">
        <RefreshCw size={16} className="animate-spin text-white flex-shrink-0" />
        <span>
          Mise à jour disponible : <strong>v{newVersion}</strong> (actuellement en mémoire : v{APP_VERSION}).
        </span>
      </div>
      <button
        type="button"
        onClick={onUpdate}
        className="ml-3 px-3.5 py-1.5 bg-white text-amber-900 hover:bg-amber-50 font-bold rounded-lg shadow-sm text-xs flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
      >
        <span>Actualiser maintenant</span>
      </button>
    </div>
  );
};

// Wrapper pour injecter la fonction de navigation compatible et les paramètres
const RouteWrapper = ({
  Component,
  onNavigate
}: {
  Component: any,
  onNavigate: (screen: string, params?: any) => void
}) => {
  const location = useLocation();
  const stateParams = location.state || {};

  console.log('📦 RouteWrapper - path:', location.pathname, 'state:', location.state, 'stateParams:', stateParams);

  return <Component onNavigate={onNavigate} {...stateParams} />;
};

// Contrôle d'accès par permission pour sécuriser les routes directes
const ProtectedRoute = ({
  permission,
  children,
  onNavigate
}: {
  permission: PermissionId;
  children: React.ReactNode;
  onNavigate: (screen: string) => void;
}) => {
  const currentUser = (() => {
    try {
      const stored = localStorage.getItem('maintenance_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const allowed = hasPermission(currentUser, permission);

  if (!allowed) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-red-100 max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4 border border-red-100">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Accès restreint</h2>
        <p className="text-sm text-gray-600 mb-6">
          Votre profil ({currentUser?.role || 'Utilisateur'}) ne dispose pas des droits nécessaires pour accéder à cette rubrique.
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [newVersionAvailable, setNewVersionAvailable] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    // 1. Écoute dynamique des événements d'authentification Supabase (OAuth Google, OTP, Session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Événement Auth Supabase:', event, session?.user?.email);

      if (session?.user) {
        const userEmail = session.user.email?.toLowerCase();

        // Si l'utilisateur connecté est contact@appalacarte.fr -> Administrateur maître validé d'office
        if (userEmail === 'contact@appalacarte.fr') {
          const masterAdmin = {
            id: session.user.id || 'usr-admin',
            _id: session.user.id || 'usr-admin',
            nom: 'CHAMPAGNE',
            prenom: 'Hervé',
            email: 'contact@appalacarte.fr',
            role: 'ADMINISTRATEUR',
            roles: ['ADMINISTRATEUR'],
            numeroTechnicien: '001',
            actif: true,
            statut: 'VALIDE',
            permissions: [
              'admin_access',
              'manage_users',
              'view_all_data',
              'view_clients',
              'edit_clients',
              'view_machines',
              'edit_machines',
              'view_interventions',
              'edit_interventions',
              'view_spare_parts',
              'edit_spare_parts'
            ]
          };
          localStorage.setItem('maintenance_authenticated', 'true');
          localStorage.setItem('maintenance_current_user', JSON.stringify(masterAdmin));
          sessionStorage.removeItem('pending_auth_email');
          if (mounted) setIsAuthenticated(true);
          return;
        }

        // Pour tout autre compte : vérifier si validé dans la table des utilisateurs
        try {
          const existing = await db.users.findByEmail(userEmail || '');
          if (existing && (existing.statut === 'VALIDE' || (existing.actif && existing.statut !== 'REFUSE'))) {
            const merged = { ...existing, ...session.user };
            localStorage.setItem('maintenance_authenticated', 'true');
            localStorage.setItem('maintenance_current_user', JSON.stringify(merged));
            sessionStorage.removeItem('pending_auth_email');
            if (mounted) setIsAuthenticated(true);
          } else {
            // Utilisateur Google ou Email authentifié mais en attente d'approbation
            if (!existing) {
              const meta = session.user.user_metadata || {};
              await db.users.requestAccess({
                email: userEmail || '',
                nom: meta.family_name || meta.full_name || meta.name || 'Utilisateur',
                prenom: meta.given_name || 'Nouveau',
                role: 'TECHNICIEN_CMS',
                motifDemande: 'Connexion Google OAuth en attente de validation'
              });
            }
            sessionStorage.setItem('pending_auth_email', userEmail || '');
            localStorage.removeItem('maintenance_authenticated');
            localStorage.removeItem('maintenance_current_user');
            if (mounted) setIsAuthenticated(false);
          }
        } catch (e) {
          console.warn('Erreur vérification profil après auth:', e);
          if (mounted) setIsAuthenticated(false);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('maintenance_authenticated');
        localStorage.removeItem('maintenance_current_user');
        if (mounted) setIsAuthenticated(false);
      }
    });

    // 2. Vérification initiale du stockage local et de la session active
    const checkAuth = async () => {
      const storedAuth = localStorage.getItem('maintenance_authenticated');
      const storedUser = localStorage.getItem('maintenance_current_user');
      if (storedAuth === 'true' && storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.doitChangerMotDePasse === true) {
            localStorage.removeItem('maintenance_authenticated');
            if (mounted) setIsAuthenticated(false);
            return;
          }
        } catch {
          // ignore
        }
        if (mounted) setIsAuthenticated(true);
        return;
      }

      if (isLiveSupabaseActive()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Sera capté par onAuthStateChange
            return;
          }
        } catch (error) {
          console.warn("Vérification session Supabase indisponible:", error);
        }
      }

      if (mounted) setIsAuthenticated(false);
    };

    checkAuth();

    // 3. Détection automatique des mises à jour de version et purge automatique du cache
    const checkServerVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.version && data.version !== APP_VERSION) {
            console.log('🔄 Nouvelle version disponible sur le serveur:', data.version, '(active:', APP_VERSION, ')');
            if (mounted) setNewVersionAvailable(data.version);

            const lastReload = sessionStorage.getItem('last_version_reload');
            if (lastReload !== data.version) {
              sessionStorage.setItem('last_version_reload', data.version);
              const path = window.location.pathname;
              if (path === '/' || path === '/login') {
                setTimeout(() => {
                  forceAppUpdate(data.version);
                }, 1000);
              }
            }
          }
        }
      } catch {
        // Mode hors ligne
      }
    };

    checkServerVersion();
    const versionInterval = setInterval(checkServerVersion, 30000);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearInterval(versionInterval);
    };
  }, []);

  // Fonction de compatibilité pour l'ancien système de navigation
  const handleNavigate = (screen: string, params?: any) => {
    let path = '/';

    switch (screen) {
      case 'dashboard': path = '/'; break;
      case 'clients': path = '/clients'; break;
      case 'client-detail': path = `/clients/${params?.clientId || ''}`; break;
      case 'client-form': path = params?.clientId ? `/clients/${params.clientId}/edit` : '/clients/new'; break;
      case 'machines': path = '/machines'; break;
      case 'machine-detail': path = `/machines/${params?.machineId || ''}`; break;
      case 'client-machine-detail': path = `/clients/${params?.clientId}/machines/${params?.machineId}`; break;
      case 'machine-form': path = params?.machineId ? `/machines/${params.machineId}/edit` : '/machines/new'; break;
      case 'interventions': path = '/interventions'; break;
      case 'intervention-detail': path = `/interventions/${params?.interventionId || ''}`; break;
      case 'intervention-form': path = params?.interventionId ? `/interventions/${params.interventionId}/edit` : '/interventions/new'; break;
      case 'maintenance-history-view': path = `/interventions/history`; break;
      case 'maintenance-intervention': path = '/interventions/maintenance/select-client'; break;
      case 'maintenance-section-selection': path = '/interventions/maintenance/select-section'; break;
      case 'multi-machine-kit-selection': path = '/interventions/multi-machine/select-kit'; break;
      case 'multi-machine-section-selection': path = '/interventions/multi-machine/select-section'; break;
      case 'task-execution': path = '/interventions/execute-task'; break;
      case 'maintenance-execution': path = `/interventions/${params?.interventionId}/execute`; break;
      case 'spare-parts': path = '/spare-parts'; break;
      case 'spare-part-detail': path = `/spare-parts/${params?.partId || ''}`; break;
      case 'spare-part-form': path = params?.sparePartId ? `/spare-parts/${params.sparePartId}/edit` : '/spare-parts/new'; break;
      case 'maintenance': path = '/maintenance'; break;
      case 'maintenance-kit-selection': path = '/maintenance/select-kit'; break;
      case 'troubleshooting': path = '/troubleshooting'; break;
      case 'users': path = '/users'; break;
      case 'database-admin': path = '/admin/database'; break;
      case 'language-config': path = '/admin/languages'; break;
      case 'translation-editor': path = '/admin/translations'; break;
      case 'montage': path = '/montage'; break;
      case 'commissioning-protocol': path = '/protocols/commissioning'; break;
      case 'installation-protocol': path = '/protocols/installation'; break;
      case 'mentions-legales': path = '/mentions-legales'; break;
      default: path = '/'; break;
    }

    navigate(path, { state: params });
  };

  // Détection des requêtes explicites d'accès ou d'invitation dans les paramètres d'URL
  const searchParams = new URLSearchParams(location.search);
  const hasLoginActionInQuery =
    searchParams.get('action') === 'login' ||
    searchParams.has('invite') ||
    searchParams.has('temp') ||
    searchParams.has('pwd') ||
    (searchParams.has('email') && searchParams.get('action') === 'demande');

  // Détection des routes explicites de connexion pour n'importe quel device / compte
  const isExplicitLoginRoute =
    location.pathname === '/login' ||
    location.pathname === '/connexion' ||
    location.pathname === '/auth' ||
    hasLoginActionInQuery;

  // Si l'URL demande une réinitialisation de session (?reset=1 ou ?logout=1)
  useEffect(() => {
    if (location.search.includes('reset=1') || location.search.includes('logout=1')) {
      handleLogout();
    }
  }, [location.search]);

  const getCurrentUser = () => {
    try {
      const stored = localStorage.getItem('maintenance_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const handleLoginSuccess = (userData?: any) => {
    localStorage.setItem('maintenance_authenticated', 'true');
    if (userData) {
      localStorage.setItem('maintenance_current_user', JSON.stringify(userData));
    }
    setIsAuthenticated(true);
    if (isExplicitLoginRoute) {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('maintenance_authenticated');
    localStorage.removeItem('maintenance_current_user');
    sessionStorage.removeItem('pending_auth_email');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    setIsAuthenticated(false);
  };

  // La page mentions légales est toujours accessible sans authentification
  if (location.pathname === '/mentions-legales') {
    return (
      <>
        <MentionsLegalesScreen onBack={() => navigate('/')} />
        <DebugFileOverlay currentScreen="mentions-legales" />
      </>
    );
  }

  // Si l'utilisateur consulte explicitement /login ou /connexion sur n'importe quel device
  if (isExplicitLoginRoute) {
    return (
      <>
        <VersionBanner newVersion={newVersionAvailable} onUpdate={() => forceAppUpdate(newVersionAvailable || undefined)} />
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateLegal={() => navigate('/mentions-legales')}
          onContinueToApp={() => navigate('/')}
          currentUser={isAuthenticated ? getCurrentUser() : null}
        />
        <DebugFileOverlay currentScreen="login" />
      </>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Chargement de l'application...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <VersionBanner newVersion={newVersionAvailable} onUpdate={() => forceAppUpdate(newVersionAvailable || undefined)} />
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateLegal={() => navigate('/mentions-legales')}
        />
        <DebugFileOverlay currentScreen="login" />
      </>
    );
  }

  // Détermine le currentScreen pour Layout basé sur le pathname
  const getCurrentScreenForLayout = () => {
    const path = location.pathname;
    if (path === '/' || path === '') return 'dashboard';
    if (path.startsWith('/clients')) return 'clients';
    if (path.startsWith('/machines')) return 'machines';
    if (path.startsWith('/montage') || path.startsWith('/protocols/installation')) return 'montage';
    if (path.startsWith('/interventions')) return 'interventions';
    if (path.startsWith('/spare-parts')) return 'spare-parts';
    if (path.startsWith('/troubleshooting')) return 'troubleshooting';
    if (path.startsWith('/users')) return 'users';
    if (path.startsWith('/admin')) return 'database-admin';
    if (path.startsWith('/mentions-legales')) return 'mentions-legales';
    return 'dashboard';
  };

  return (
    <SelectedClientProvider>
      <VersionBanner newVersion={newVersionAvailable} onUpdate={() => forceAppUpdate(newVersionAvailable || undefined)} />
      <Layout onNavigate={handleNavigate} onLogout={handleLogout} currentScreen={getCurrentScreenForLayout()}>
        <Routes>
          <Route path="/" element={<RouteWrapper Component={Dashboard} onNavigate={handleNavigate} />} />

          <Route path="/clients" element={<ProtectedRoute permission="view_clients" onNavigate={handleNavigate}><RouteWrapper Component={ClientsScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/clients/new" element={<ProtectedRoute permission="edit_clients" onNavigate={handleNavigate}><RouteWrapper Component={ClientFormScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/clients/:clientId" element={<ProtectedRoute permission="view_clients" onNavigate={handleNavigate}><RouteWrapper Component={ClientDetailScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/clients/:clientId/edit" element={<ProtectedRoute permission="edit_clients" onNavigate={handleNavigate}><RouteWrapper Component={ClientFormScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />

          <Route path="/machines" element={<ProtectedRoute permission="view_machines" onNavigate={handleNavigate}><RouteWrapper Component={MachinesScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/machines/new" element={<ProtectedRoute permission="edit_machines" onNavigate={handleNavigate}><RouteWrapper Component={MachineFormScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/machines/:machineId" element={<ProtectedRoute permission="view_machines" onNavigate={handleNavigate}><RouteWrapper Component={MachineDetailScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/machines/:machineId/edit" element={<ProtectedRoute permission="edit_machines" onNavigate={handleNavigate}><RouteWrapper Component={MachineFormScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/clients/:clientId/machines/:machineId" element={<ProtectedRoute permission="view_machines" onNavigate={handleNavigate}><RouteWrapper Component={MachineDetailScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />

          <Route path="/interventions" element={<ProtectedRoute permission="view_interventions" onNavigate={handleNavigate}><RouteWrapper Component={InterventionsScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/interventions/new" element={<ProtectedRoute permission="create_interventions" onNavigate={handleNavigate}><RouteWrapper Component={InterventionFormScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/interventions/history" element={<ProtectedRoute permission="view_interventions" onNavigate={handleNavigate}><RouteWrapper Component={MaintenanceHistoryView} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/interventions/maintenance/select-client" element={<ProtectedRoute permission="view_interventions" onNavigate={handleNavigate}><RouteWrapper Component={MaintenanceInterventionScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/interventions/maintenance/select-section" element={<ProtectedRoute permission="view_interventions" onNavigate={handleNavigate}><RouteWrapper Component={MaintenanceSectionSelectionScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/interventions/multi-machine/select-kit" element={<ProtectedRoute permission="view_interventions" onNavigate={handleNavigate}><RouteWrapper Component={MultiMachineKitSelectionScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/interventions/multi-machine/select-section" element={<ProtectedRoute permission="view_interventions" onNavigate={handleNavigate}><RouteWrapper Component={MultiMachineSectionSelectionScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/interventions/execute-task" element={<ProtectedRoute permission="view_interventions" onNavigate={handleNavigate}><RouteWrapper Component={TaskExecutionScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/interventions/:interventionId" element={<ProtectedRoute permission="view_interventions" onNavigate={handleNavigate}><RouteWrapper Component={InterventionDetailScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/interventions/:interventionId/edit" element={<ProtectedRoute permission="edit_interventions" onNavigate={handleNavigate}><RouteWrapper Component={InterventionFormScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/interventions/:interventionId/execute" element={<ProtectedRoute permission="edit_interventions" onNavigate={handleNavigate}><RouteWrapper Component={MaintenanceExecutionScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />

          <Route path="/spare-parts" element={<ProtectedRoute permission="view_spare_parts" onNavigate={handleNavigate}><RouteWrapper Component={SparePartsScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/spare-parts/new" element={<ProtectedRoute permission="edit_spare_parts" onNavigate={handleNavigate}><RouteWrapper Component={SparePartFormScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/spare-parts/:partId" element={<ProtectedRoute permission="view_spare_parts" onNavigate={handleNavigate}><RouteWrapper Component={SparePartDetailScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/spare-parts/:sparePartId/edit" element={<ProtectedRoute permission="edit_spare_parts" onNavigate={handleNavigate}><RouteWrapper Component={SparePartFormScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />

          <Route path="/maintenance" element={<ProtectedRoute permission="view_maintenance" onNavigate={handleNavigate}><RouteWrapper Component={MaintenanceScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/maintenance/select-kit" element={<ProtectedRoute permission="view_maintenance" onNavigate={handleNavigate}><RouteWrapper Component={MaintenanceKitSelectionScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />

          <Route path="/troubleshooting" element={<RouteWrapper Component={TroubleshootingScreen} onNavigate={handleNavigate} />} />
          <Route path="/users" element={<ProtectedRoute permission="view_users" onNavigate={handleNavigate}><RouteWrapper Component={UsersScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />

          <Route path="/admin/database" element={<ProtectedRoute permission="admin_access" onNavigate={handleNavigate}><RouteWrapper Component={DatabaseAdminScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/admin/languages" element={<ProtectedRoute permission="admin_access" onNavigate={handleNavigate}><RouteWrapper Component={LanguageConfigScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/admin/translations" element={<ProtectedRoute permission="admin_access" onNavigate={handleNavigate}><RouteWrapper Component={TranslationEditorScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />

          <Route path="/montage" element={<ProtectedRoute permission="view_interventions" onNavigate={handleNavigate}><RouteWrapper Component={InstallationProtocolScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/protocols/commissioning" element={<RouteWrapper Component={CommissioningProtocolScreen} onNavigate={handleNavigate} />} />
          <Route path="/protocols/installation" element={<ProtectedRoute permission="view_interventions" onNavigate={handleNavigate}><RouteWrapper Component={InstallationProtocolScreen} onNavigate={handleNavigate} /></ProtectedRoute>} />

          <Route path="/mentions-legales" element={<MentionsLegalesScreen onBack={() => navigate(-1)} />} />

          <Route path="*" element={<RouteWrapper Component={Dashboard} onNavigate={handleNavigate} />} />
        </Routes>
        <DebugFileOverlay currentScreen={getCurrentScreenForLayout()} />
      </Layout>
    </SelectedClientProvider>
  );
}
