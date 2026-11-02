/**
 * Validation et gestion des mots de passe (Supabase Auth & SoPlan)
 * Conforme aux règles de sécurité de l'éditeur App à la Carte
 */

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;
export const SYMBOL_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~`]/;

/**
 * Génère le mot de passe temporaire officiel selon la règle :
 * "Le prénom en minuscule suivi de 2027" (ex : thomas -> thomas2027, alexandre -> alexandre2027)
 */
export function generateTemporaryPassword(prenom: string): string {
  const cleanPrenom = (prenom || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  return (cleanPrenom || 'technicien') + '2027';
}

/**
 * Vérifie si le mot de passe saisi correspond au mot de passe temporaire
 */
export function isTemporaryPassword(
  enteredPassword?: string,
  prenom?: string,
  storedTempPassword?: string
): boolean {
  if (!enteredPassword) return false;
  const cleanEntered = enteredPassword.trim().toLowerCase();

  if (storedTempPassword && cleanEntered === storedTempPassword.trim().toLowerCase()) {
    return true;
  }

  if (prenom) {
    const generated = generateTemporaryPassword(prenom);
    if (cleanEntered === generated.toLowerCase()) return true;

    const rawEntered = prenom.trim().toLowerCase() + '2027';
    if (cleanEntered === rawEntered) return true;
  }

  return false;
}

/**
 * Règles visuelles pour checklist en direct dans les formulaires
 */
export const passwordRules = [
  { id: 'length', label: '8 caractères minimum', test: (v: string) => v.length >= PASSWORD_MIN },
  { id: 'lowercase', label: 'Une lettre minuscule (a-z)', test: (v: string) => /[a-z]/.test(v) },
  { id: 'uppercase', label: 'Une lettre majuscule (A-Z)', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'number', label: 'Un chiffre (0-9)', test: (v: string) => /[0-9]/.test(v) },
  { id: 'symbol', label: 'Un caractère spécial (!@#$...)', test: (v: string) => SYMBOL_REGEX.test(v) },
];

/**
 * Valide un mot de passe et retourne les messages d'erreur éventuels
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password || password.length < PASSWORD_MIN) {
    errors.push(`Le mot de passe doit comporter au moins ${PASSWORD_MIN} caractères.`);
  }
  if (new TextEncoder().encode(password || '').length > PASSWORD_MAX) {
    errors.push('Le mot de passe est trop long (72 octets maximum).');
  }
  if (!/[a-z]/.test(password || '')) {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule.');
  }
  if (!/[A-Z]/.test(password || '')) {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule.');
  }
  if (!/[0-9]/.test(password || '')) {
    errors.push('Le mot de passe doit contenir au moins un chiffre.');
  }
  if (!SYMBOL_REGEX.test(password || '')) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Messages d'erreur explicites pour les réponses d'authentification Supabase
 */
export function passwordErrorMessage(error: any): string {
  if (!error) return 'Une erreur inconnue est survenue.';

  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';

  if (code === 'weak_password' || msg.includes('weak') || msg.includes('pwned')) {
    if (msg.includes('pwned')) {
      return 'Ce mot de passe apparaît dans des fuites de données connues. Choisissez-en un autre.';
    }
    return 'Mot de passe trop faible. Respectez les critères de sécurité ci-dessous.';
  }

  if (code === 'same_password' || msg.includes('same_password') || msg.includes('different')) {
    return 'Le nouveau mot de passe doit être différent de l’ancien.';
  }

  if (code === 'over_email_send_rate_limit' || msg.includes('rate limit')) {
    return 'Trop de tentatives rapprochées. Veuillez patienter quelques minutes avant de réessayer.';
  }

  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }

  return error.message || 'Une erreur est survenue lors de la mise à jour du mot de passe.';
}
