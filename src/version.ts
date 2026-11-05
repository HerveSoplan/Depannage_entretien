// Version active de l'application
export const APP_VERSION = '1.14.6';
export const APP_NAME = 'Dépannage_entretien';
export const PUBLISHER_NAME = 'App à la Carte — Hervé CHAMPAGNE EI';
export const PUBLISHER_SIREN = '132 021 098';
export const CONTACT_EMAIL = 'contact@appalacarte.fr';

// URL officielle active de production Vercel
export const OFFICIAL_APP_URL = 'https://depannage-entretien.vercel.app';

/**
 * Retourne l'URL de base sécurisée de l'application.
 * Conserve localhost en développement, ou window.location.origin en production.
 */
export const getAppBaseUrl = (): string => {
  if (typeof window === 'undefined') return OFFICIAL_APP_URL;
  const origin = window.location.origin;
  if (!origin || origin === 'null') return OFFICIAL_APP_URL;
  return origin;
};

/**
 * Retourne l'URL publique garantie pour les invitations et liens partagés aux techniciens.
 * Utilise systématiquement l'URL de production accessible sur internet
 * pour éviter que le technicien distant ne reçoive un lien localhost inaccessible.
 */
export const getInviteAppBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1') && origin !== 'null') {
      return origin;
    }
  }
  return OFFICIAL_APP_URL;
};


