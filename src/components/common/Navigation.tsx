import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Wrench, FileText, Hammer, Package, HelpCircle, Settings, Database, Menu, X, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { db } from '../../lib/supabase';
import { APP_NAME, APP_VERSION } from '../../version';
import { useCurrentUser } from '../../hooks/useCurrentUser';

interface NavigationProps {
  onNavigate?: (screen: string) => void;
  currentScreen?: string;
}

export function Navigation({ onNavigate, currentScreen }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { t } = useTranslation();
  const { canAccess, can } = useCurrentUser();

  useEffect(() => {
    // Si l'utilisateur n'a pas la permission de voir les utilisateurs, ne pas interroger la liste des demandes
    if (!can('view_users')) {
      setPendingCount(0);
      return;
    }

    const checkPending = async () => {
      try {
        const res: any = await db.users.list();
        const list = Array.isArray(res) ? res : (res?.list || []);
        const count = list.filter(
          (u: any) =>
            u.statut === 'EN_ATTENTE' ||
            (u.actif === false && u.statut !== 'REFUSE' && u.email !== 'contact@appalacarte.fr')
        ).length;
        setPendingCount(count);
      } catch {
        // ignore
      }
    };
    checkPending();
    const interval = setInterval(checkPending, 20000);
    return () => clearInterval(interval);
  }, [can]);

  const rawMenuItems = [
    { id: 'dashboard', labelKey: 'dashboard.title', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'clients', labelKey: 'clients.title', label: 'Clients', icon: Users },
    { id: 'machines', labelKey: 'machines.title', label: 'Machines', icon: Wrench },
    { id: 'interventions', labelKey: 'interventions.title', label: 'Interventions', icon: FileText },
    { id: 'montage', labelKey: 'montage.title', label: 'Montage', icon: Hammer },
    { id: 'spare-parts', labelKey: 'spare_parts.title', label: 'Pièces détachées', icon: Package },
    { id: 'maintenance', labelKey: 'maintenance.title', label: 'Maintenance', icon: Settings },
    { id: 'troubleshooting', labelKey: 'troubleshooting.title', label: 'Dépannage', icon: HelpCircle },
    { id: 'users', labelKey: 'users.title', label: 'Utilisateurs', icon: Users },
    { id: 'database-admin', labelKey: 'administration.title', label: 'Administration', icon: Database },
  ];

  // Filtrage strict selon les habilitations du profil connecté (ex: un technicien CMS ne voit pas Utilisateurs ni Administration)
  const menuItems = rawMenuItems.filter((item) => canAccess(item.id));

  const getLabel = (item: typeof rawMenuItems[0]) => {
    return t(item.labelKey, item.label);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-white border-r border-gray-200 z-50">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div 
            onClick={() => onNavigate?.('dashboard')}
            className="flex items-center flex-shrink-0 px-4 mb-6 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white mr-2.5 shadow-sm flex-shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">{APP_NAME}</h1>
              <span className="text-[11px] text-gray-500 font-medium leading-none mt-1">v{APP_VERSION}</span>
            </div>
          </div>

          <nav className="flex-1 px-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`
                    group flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span className="flex-1 text-left">{getLabel(item)}</span>
                  {item.id === 'users' && pendingCount > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Top Bar avec Menu Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 h-16 flex items-center justify-between px-4">
        <div 
          onClick={() => onNavigate?.('dashboard')}
          className="flex items-center cursor-pointer"
        >
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white mr-2 flex-shrink-0">
            <Wrench className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base font-bold text-blue-600 leading-tight">{APP_NAME}</h1>
            <span className="text-[10px] text-gray-500 font-medium leading-none">v{APP_VERSION}</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>
      </div>

      {/* Mobile Full Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-base font-bold text-gray-900">Menu Principal</h2>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              <nav className="p-2 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate?.(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg
                        transition-colors duration-150
                        ${isActive
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="flex-1 text-left">{getLabel(item)}</span>
                      {item.id === 'users' && pendingCount > 0 && (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
