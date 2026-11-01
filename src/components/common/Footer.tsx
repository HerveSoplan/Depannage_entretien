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

  return (
    <footer className={`py-4 px-4 text-center text-xs text-gray-500 border-t border-gray-200 bg-white ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span className="font-medium text-gray-700">App à la Carte — Hervé CHAMPAGNE EI</span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <span>SIREN : 132 021 098</span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <span className="font-semibold text-blue-600">v{APP_VERSION}</span>
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
