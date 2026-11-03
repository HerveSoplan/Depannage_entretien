// src/utils/permissions.ts
/**
 * Système centralisé de gestion des permissions et du contrôle d'accès (RBAC)
 * Conforme aux règles d'habilitations :
 * - Les techniciens (ex: TECHNICIEN_CMS, CHEF_TECHNICIEN_CMS, etc.) ne peuvent pas voir
 *   les utilisateurs, la gestion des accès ni l'administration du système.
 * - L'administrateur maître et les administrateurs ont un accès total.
 * - Les responsables et directeurs peuvent superviser leur équipe selon leurs prérogatives.
 */

export type PermissionId =
  | 'view_dashboard'
  | 'view_clients'
  | 'edit_clients'
  | 'view_machines'
  | 'edit_machines'
  | 'view_interventions'
  | 'create_interventions'
  | 'edit_interventions'
  | 'view_spare_parts'
  | 'edit_spare_parts'
  | 'view_maintenance'
  | 'edit_maintenance'
  | 'view_troubleshooting'
  | 'view_users'
  | 'edit_users'
  | 'manage_users'
  | 'admin_access'
  | 'view_all_data';

export interface PermissionDefinition {
  id: PermissionId;
  label: string;
  category: 'core' | 'clients' | 'machines' | 'interventions' | 'stock' | 'maintenance' | 'admin';
  sensitive?: boolean;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  { id: 'view_dashboard', label: 'Voir le tableau de bord', category: 'core' },
  { id: 'view_clients', label: 'Voir les clients', category: 'clients' },
  { id: 'edit_clients', label: 'Créer et modifier des clients', category: 'clients' },
  { id: 'view_machines', label: 'Voir les machines', category: 'machines' },
  { id: 'edit_machines', label: 'Créer et modifier des machines', category: 'machines' },
  { id: 'view_interventions', label: 'Voir les interventions', category: 'interventions' },
  { id: 'create_interventions', label: 'Créer des interventions', category: 'interventions' },
  { id: 'edit_interventions', label: 'Modifier les interventions', category: 'interventions' },
  { id: 'view_spare_parts', label: 'Voir les pièces détachées', category: 'stock' },
  { id: 'edit_spare_parts', label: 'Modifier le stock de pièces', category: 'stock' },
  { id: 'view_maintenance', label: 'Voir la maintenance et kits', category: 'maintenance' },
  { id: 'edit_maintenance', label: 'Gérer les kits et protocoles', category: 'maintenance' },
  { id: 'view_troubleshooting', label: 'Accéder aux guides de dépannage', category: 'core' },
  { id: 'view_users', label: 'Voir la liste des utilisateurs', category: 'admin', sensitive: true },
  { id: 'edit_users', label: 'Créer et modifier des utilisateurs', category: 'admin', sensitive: true },
  { id: 'manage_users', label: 'Valider et approuver les accès', category: 'admin', sensitive: true },
  { id: 'admin_access', label: 'Accès administration base et système', category: 'admin', sensitive: true },
  { id: 'view_all_data', label: 'Supervision globale de toutes les données', category: 'admin', sensitive: true }
];

/**
 * Permissions par défaut associées à chaque rôle métier.
 * Les rôles terrain (CMS, VMS, Monteurs, Magasiniers, Clients) sont STRICTEMENT
 * exclus des permissions d'administration et de visualisation des utilisateurs.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<string, PermissionId[]> = {
  // Administrateur (accès absolu)
  ADMINISTRATEUR: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'edit_spare_parts', 'view_maintenance', 'edit_maintenance',
    'view_troubleshooting', 'view_users', 'edit_users', 'manage_users', 'admin_access', 'view_all_data'
  ],
  ADMIN: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'edit_spare_parts', 'view_maintenance', 'edit_maintenance',
    'view_troubleshooting', 'view_users', 'edit_users', 'manage_users', 'admin_access', 'view_all_data'
  ],

  // Directeur
  DIRECTEUR: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'edit_spare_parts', 'view_maintenance', 'edit_maintenance',
    'view_troubleshooting', 'view_users', 'view_all_data'
  ],
  DIRECTOR: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'edit_spare_parts', 'view_maintenance', 'edit_maintenance',
    'view_troubleshooting', 'view_users', 'view_all_data'
  ],

  // Responsable Technique (encadrement opérationnel)
  RESPONSABLE_TECHNIQUE: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'edit_spare_parts', 'view_maintenance', 'edit_maintenance',
    'view_troubleshooting', 'view_users', 'edit_users', 'manage_users'
  ],
  TECH_MANAGER: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'edit_spare_parts', 'view_maintenance', 'edit_maintenance',
    'view_troubleshooting', 'view_users', 'edit_users', 'manage_users'
  ],

  // Responsable / Supérieur
  RESPONSABLE: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'edit_spare_parts', 'view_maintenance', 'edit_maintenance',
    'view_troubleshooting', 'view_users'
  ],
  MANAGER: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'edit_spare_parts', 'view_maintenance', 'edit_maintenance',
    'view_troubleshooting', 'view_users'
  ],

  // Chef Technicien CMS -> AUCUN accès Utilisateur ni Admin
  CHEF_TECHNICIEN_CMS: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'edit_spare_parts', 'view_maintenance', 'edit_maintenance',
    'view_troubleshooting'
  ],
  CHIEF_TECH_CMS: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'edit_spare_parts', 'view_maintenance', 'edit_maintenance',
    'view_troubleshooting'
  ],

  // Chef Technicien VMS -> AUCUN accès Utilisateur ni Admin
  CHEF_TECHNICIEN_VMS: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'edit_spare_parts', 'view_maintenance', 'edit_maintenance',
    'view_troubleshooting'
  ],
  CHIEF_TECH_VMS: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'edit_spare_parts', 'view_maintenance', 'edit_maintenance',
    'view_troubleshooting'
  ],

  // Chef Monteur -> AUCUN accès Utilisateur ni Admin
  CHEF_MONTEUR: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'view_maintenance', 'view_troubleshooting'
  ],
  CHIEF_INSTALLER: [
    'view_dashboard', 'view_clients', 'edit_clients', 'view_machines', 'edit_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'view_maintenance', 'view_troubleshooting'
  ],

  // Technicien CMS -> AUCUN accès Utilisateur ni Admin
  TECHNICIEN_CMS: [
    'view_dashboard', 'view_clients', 'view_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'view_maintenance', 'view_troubleshooting'
  ],
  TECH_CMS: [
    'view_dashboard', 'view_clients', 'view_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'view_maintenance', 'view_troubleshooting'
  ],

  // Technicien VMS -> AUCUN accès Utilisateur ni Admin
  TECHNICIEN_VMS: [
    'view_dashboard', 'view_clients', 'view_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'view_maintenance', 'view_troubleshooting'
  ],
  TECH_VMS: [
    'view_dashboard', 'view_clients', 'view_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'view_maintenance', 'view_troubleshooting'
  ],

  // Monteur
  MONTEUR: [
    'view_dashboard', 'view_clients', 'view_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'view_maintenance', 'view_troubleshooting'
  ],
  INSTALLER: [
    'view_dashboard', 'view_clients', 'view_machines',
    'view_interventions', 'create_interventions', 'edit_interventions',
    'view_spare_parts', 'view_maintenance', 'view_troubleshooting'
  ],

  // Magasinier (Logistique & Pièces)
  MAGASINIER: [
    'view_dashboard', 'view_spare_parts', 'edit_spare_parts',
    'view_maintenance', 'view_interventions'
  ],
  WAREHOUSE: [
    'view_dashboard', 'view_spare_parts', 'edit_spare_parts',
    'view_maintenance', 'view_interventions'
  ],

  // Client (Consultation limitée)
  CLIENT: [
    'view_dashboard', 'view_machines', 'view_interventions', 'view_troubleshooting'
  ]
};

/**
 * Vérifie si l'utilisateur est l'administrateur maître ou possède le rôle Administrateur
 */
export function isMasterAdmin(user: any): boolean {
  if (!user) return false;
  if (user.email?.toLowerCase() === 'contact@appalacarte.fr') return true;
  if (user.role === 'ADMINISTRATEUR' || user.role === 'ADMIN') return true;
  if (Array.isArray(user.roles) && (user.roles.includes('ADMINISTRATEUR') || user.roles.includes('ADMIN'))) {
    return true;
  }
  return false;
}

/**
 * Vérifie si l'utilisateur a un rôle lié au CMS (Chef Technicien CMS ou Technicien CMS)
 */
export function isCmsUser(user: any): boolean {
  if (!user) return false;
  const roles = [user.role, ...(Array.isArray(user.roles) ? user.roles : [])].filter(Boolean);
  return roles.some((r) =>
    r === 'CHEF_TECHNICIEN_CMS' ||
    r === 'CHIEF_TECH_CMS' ||
    r === 'TECHNICIEN_CMS' ||
    r === 'TECH_CMS'
  );
}

// Clé de stockage local pour les personnalisations des permissions par défaut des rôles
const CUSTOM_ROLE_PERMS_KEY = 'maintenance_role_default_permissions';

/**
 * Récupère les permissions personnalisées configurées pour un ou tous les rôles
 */
export function getCustomConfiguredRolePermissions(): Record<string, PermissionId[]> {
  try {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(CUSTOM_ROLE_PERMS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Erreur lecture permissions rôles personnalisées:', err);
    return {};
  }
}

/**
 * Enregistre les permissions pré-définies pour un rôle donné
 */
export function setRoleDefaultPermissions(role: string, permissions: PermissionId[]): void {
  try {
    if (typeof window === 'undefined') return;
    const cleanRole = role.toUpperCase();
    const current = getCustomConfiguredRolePermissions();
    current[cleanRole] = permissions;
    localStorage.setItem(CUSTOM_ROLE_PERMS_KEY, JSON.stringify(current));
    // Déclencher un événement global pour avertir les composants abonnés
    window.dispatchEvent(new CustomEvent('maintenance_role_permissions_updated', {
      detail: { role: cleanRole, permissions }
    }));
  } catch (err) {
    console.error('Erreur enregistrement permissions rôle:', err);
  }
}

/**
 * Réinitialise les permissions pré-définies d'un rôle ou de tous les rôles
 */
export function resetRoleDefaultPermissions(role?: string): void {
  try {
    if (typeof window === 'undefined') return;
    if (role) {
      const cleanRole = role.toUpperCase();
      const current = getCustomConfiguredRolePermissions();
      delete current[cleanRole];
      localStorage.setItem(CUSTOM_ROLE_PERMS_KEY, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('maintenance_role_permissions_updated', {
        detail: { role: cleanRole, permissions: ROLE_DEFAULT_PERMISSIONS[cleanRole] || [] }
      }));
    } else {
      localStorage.removeItem(CUSTOM_ROLE_PERMS_KEY);
      window.dispatchEvent(new CustomEvent('maintenance_role_permissions_updated', {
        detail: { all: true }
      }));
    }
  } catch (err) {
    console.error('Erreur reset permissions rôle:', err);
  }
}

/**
 * Vérifie si un rôle possède des permissions modifiées par rapport aux valeurs par défaut d'usine
 */
export function isRoleDefaultPermissionsModified(role: string): boolean {
  const cleanRole = role.toUpperCase();
  const custom = getCustomConfiguredRolePermissions();
  if (!custom[cleanRole]) return false;
  const original = ROLE_DEFAULT_PERMISSIONS[cleanRole] || [];
  const configured = custom[cleanRole];
  if (original.length !== configured.length) return true;
  return !original.every((p) => configured.includes(p));
}

/**
 * Retourne les permissions pré-définies effectives d'un rôle (personnalisées ou usine)
 */
export function getDefaultPermissionsForRole(role?: string): PermissionId[] {
  if (!role) {
    return ROLE_DEFAULT_PERMISSIONS.TECHNICIEN_CMS;
  }
  const clean = role.toUpperCase();
  const custom = getCustomConfiguredRolePermissions();
  if (Array.isArray(custom[clean])) {
    return custom[clean];
  }
  return ROLE_DEFAULT_PERMISSIONS[clean] || ROLE_DEFAULT_PERMISSIONS.TECHNICIEN_CMS;
}

/**
 * Alias explicite pour getDefaultPermissionsForRole
 */
export const getRoleDefaultPermissions = getDefaultPermissionsForRole;

/**
 * Résout la liste complète et effective des permissions d'un utilisateur
 */
export function getEffectivePermissions(user: any): PermissionId[] {
  if (!user) return [];
  if (isMasterAdmin(user)) {
    return ALL_PERMISSIONS.map((p) => p.id);
  }

  // 1. Si des permissions explicites sont définies pour l'utilisateur
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    // Si l'utilisateur a 'admin_access', il hérite de toutes les permissions
    if (user.permissions.includes('admin_access')) {
      return ALL_PERMISSIONS.map((p) => p.id);
    }
    return user.permissions as PermissionId[];
  }

  // 2. Sinon, on dérive les permissions de son rôle (ou ses rôles)
  const userRoles: string[] = [];
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    userRoles.push(...user.roles);
  } else if (user.role) {
    userRoles.push(user.role);
  } else {
    userRoles.push('TECHNICIEN_CMS');
  }

  const set = new Set<PermissionId>();
  userRoles.forEach((r) => {
    const defaultPerms = getDefaultPermissionsForRole(r);
    defaultPerms.forEach((p) => set.add(p));
  });

  return Array.from(set);
}

/**
 * Contrôle si l'utilisateur possède une permission spécifique
 */
export function hasPermission(user: any, permission: PermissionId): boolean {
  if (!user) return false;

  // L'administrateur maître a toujours toutes les permissions
  if (isMasterAdmin(user)) return true;

  // Règle de protection renforcée :
  // Les permissions sensibles (admin_access, view_users, edit_users, manage_users)
  // ne peuvent JAMAIS être attribuées implicitement à un profil terrain (CMS, VMS, Monteur, Magasinier, Client).
  const isSensitive = ['admin_access', 'view_users', 'edit_users', 'manage_users'].includes(permission);

  // Si des permissions explicites sont stockées
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    if (user.permissions.includes('admin_access')) return true;
    return user.permissions.includes(permission);
  }

  // Sinon dérivation par rôle
  const effective = getEffectivePermissions(user);
  if (isSensitive) {
    // Vérification supplémentaire : si le rôle est CMS ou terrain, refuser systématiquement l'accès sensible
    if (isCmsUser(user) && !user.permissions?.includes(permission)) {
      return false;
    }
  }

  return effective.includes(permission);
}

/**
 * Contrôle si un élément du menu de navigation est accessible pour l'utilisateur
 */
export function canAccessMenuItem(menuId: string, user: any): boolean {
  if (!user) return false;
  if (isMasterAdmin(user)) return true;

  switch (menuId) {
    case 'dashboard':
      return hasPermission(user, 'view_dashboard');
    case 'clients':
      return hasPermission(user, 'view_clients');
    case 'machines':
      return hasPermission(user, 'view_machines');
    case 'interventions':
      return hasPermission(user, 'view_interventions');
    case 'montage':
      return hasPermission(user, 'view_interventions') || hasPermission(user, 'view_maintenance');
    case 'spare-parts':
      return hasPermission(user, 'view_spare_parts');
    case 'maintenance':
      return hasPermission(user, 'view_maintenance');
    case 'troubleshooting':
      return hasPermission(user, 'view_troubleshooting');
    case 'users':
      // Les CMS et techniciens ne doivent pas voir "Utilisateurs"
      return hasPermission(user, 'view_users') || hasPermission(user, 'manage_users');
    case 'database-admin':
      // Les CMS et techniciens ne doivent pas voir "Administration"
      return hasPermission(user, 'admin_access');
    default:
      return true;
  }
}

/**
 * Récupère l'utilisateur connecté actuellement depuis le localStorage de manière sécurisée
 */
export function getStoredCurrentUser(): any | null {
  try {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('maintenance_current_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
