import React from 'react';
import { APP_VERSION } from '../../version';

interface FooterProps {
  onNavigateLegal?: () => void;
  className?: string;
}

export function Footer({ onNavigateLegal, className = '' }: FooterProps) {
  const handleLegalClick = (e: React.MouseEvent) => {
    if (onNavigateLegal) {
      e.preventDefault();
      onNavigateLegal();
    }
  };

  const handleForceUpdate = async () => {
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
        window.location.replace(url.toString());
      }
    } catch {
      window.location.reload();
    }
  };

  return (
    <footer className={`py-4 px-4 text-center text-xs text-gray-500 border-t border-gray-200 bg-white ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span className="font-medium text-gray-700">App à la Carte — Hervé CHAMPAGNE EI</span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <span>SIREN : 132 021 098</span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <button
          onClick={handleForceUpdate}
          title="Version active - Cliquer pour forcer l'actualisation sans cache"
          className="font-semibold text-blue-600 hover:text-blue-800 underline decoration-dotted transition-colors"
        >
          v{APP_VERSION}
        </button>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <a
          href="/mentions-legales"
          onClick={handleLegalClick}
          className="text-gray-600 hover:text-blue-600 underline transition-colors"
        >
          Mentions légales
        </a>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <a
          href="mailto:contact@appalacarte.fr"
          className="text-gray-600 hover:text-blue-600 underline transition-colors"
        >
          Contact
        </a>
      </div>
    </footer>
  );
}
