import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { LanguageSelector } from './LanguageSelector';
import { Footer } from './Footer';
import { LogOut, UserCheck, RotateCcw, Sparkles } from 'lucide-react';
import { demoDb } from '../../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate?: (screen: string, params?: any) => void;
  onLogout?: () => void;
  currentScreen?: string;
}

export function Layout({ children, onNavigate, onLogout, currentScreen }: LayoutProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('maintenance_current_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Impossible de lire maintenance_current_user:', e);
    }
  }, []);

  const handleResetDemo = () => {
    if (window.confirm('Voulez-vous réinitialiser toutes les données de test à leurs valeurs d\'origine ?')) {
      demoDb.resetToDefault();
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col justify-between">
      <div className="flex min-h-screen bg-gray-50">
        {/* Navigation (gère tout : mobile + desktop) */}
        <Navigation onNavigate={onNavigate} currentScreen={currentScreen} />

        {/* Main Content */}
        <div className="flex-1 lg:ml-64 pt-16 lg:pt-0 flex flex-col justify-between min-h-screen">
          <div>
            {/* Header avec Utilisateur connecté & Sélecteur de langue & Réinitialisation Démo */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                {currentUser ? (
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-medium truncate max-w-[150px] sm:max-w-none">
                      {currentUser.prenom} {currentUser.nom} ({currentUser.role || 'Connecté'})
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">Mode démo actif</span>
                )}

                <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-medium rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Base autonome active</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleResetDemo}
                  title="Réinitialiser toutes les données d'exemple"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Réinitialiser démo</span>
                </button>

                <LanguageSelector />

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Se déconnecter"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Déconnexion</span>
                  </button>
                )}
              </div>
            </header>
            
            <main className="p-4 md:p-6 lg:p-8 pb-12 overflow-y-auto mx-auto max-w-screen-2xl">
              {children}
            </main>
          </div>

          <Footer onNavigateLegal={() => onNavigate?.('mentions-legales')} />
        </div>
      </div>
    </div>
  );
}
