// Version active de l'application
export const APP_VERSION = '1.14.2';
export const APP_NAME = 'Dépannage_entretien';
export const PUBLISHER_NAME = 'App à la Carte — Hervé CHAMPAGNE EI';
export const PUBLISHER_SIREN = '132 021 098';
export const CONTACT_EMAIL = 'contact@appalacarte.fr';

// URL officielle de production
export const OFFICIAL_APP_URL = 'https://depannage-entretien.vercel.app';

/**
 * Retourne l'URL de base sécurisée de l'application.
 * Conserve localhost en développement, mais remplace systématiquement
 * tout ancien nom de domaine ou domaine "soplan" par l'URL officielle.
 */
export const getAppBaseUrl = (): string => {
  if (typeof window === 'undefined') return OFFICIAL_APP_URL;
  const origin = window.location.origin;
  if (!origin || origin === 'null') return OFFICIAL_APP_URL;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return origin;
  }
  if (origin.includes('soplan')) {
    return OFFICIAL_APP_URL;
  }
  return origin || OFFICIAL_APP_URL;
};

/**
 * Retourne l'URL publique garantie pour les invitations et liens partagés aux techniciens.
 * Utilise systématiquement l'URL de production accessible sur internet
 * pour éviter que le technicien distant ne reçoive un lien localhost inaccessible.
 */
export const getInviteAppBaseUrl = (): string => {
  return OFFICIAL_APP_URL;
};


