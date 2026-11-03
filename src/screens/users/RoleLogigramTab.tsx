// src/screens/users/RoleLogigramTab.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  Package,
  UserCheck,
  UserPlus,
  ArrowDown,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Settings,
  Workflow,
  Sliders,
  RotateCcw,
  Eye,
  CheckSquare,
  Square,
  Grid,
  GitBranch,
  Info
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  ALL_PERMISSIONS,
  PermissionId,
  PermissionDefinition,
  getDefaultPermissionsForRole,
  setRoleDefaultPermissions,
  resetRoleDefaultPermissions,
  isRoleDefaultPermissionsModified,
  ROLE_DEFAULT_PERMISSIONS
} from '../../utils/permissions';

export interface RoleDefinition {
  value: string;
  label: string;
  description: string;
  category: 'direction' | 'encadrement' | 'chefs' | 'terrain' | 'logistique' | 'client' | 'personnalise';
  color: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    headerBg: string;
  };
  icon: any;
}

// Les 12 Rôles Officiels de l'Application
export const DEFAULT_ROLE_DEFINITIONS: RoleDefinition[] = [
  // Niveau 1 : Direction & Administration Maître
  {
    value: 'ADMINISTRATEUR',
    label: 'Administrateur',
    description: 'Accès maître total, supervision globale, gestion des utilisateurs et sécurité du système',
    category: 'direction',
    color: {
      bg: 'bg-purple-50',
      border: 'border-purple-300',
      text: 'text-purple-900',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      headerBg: 'bg-purple-600'
    },
    icon: ShieldCheck
  },
  {
    value: 'DIRECTEUR',
    label: 'Directeur',
    description: 'Supervision générale, vue stratégique du parc, des plannings et des chantiers',
    category: 'direction',
    color: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-300',
      text: 'text-indigo-900',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      headerBg: 'bg-indigo-600'
    },
    icon: Shield
  },

  // Niveau 2 : Encadrement Technique
  {
    value: 'RESPONSABLE_TECHNIQUE',
    label: 'Responsable Technique',
    description: 'Gestion globale du parc, planification, affectation des interventions et protocoles de maintenance',
    category: 'encadrement',
    color: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      headerBg: 'bg-blue-600'
    },
    icon: Settings
  },
  {
    value: 'RESPONSABLE',
    label: 'Responsable / Supérieur',
    description: 'Coordination d’équipe, suivi opérationnel et validation des dossiers',
    category: 'encadrement',
    color: {
      bg: 'bg-sky-50',
      border: 'border-sky-300',
      text: 'text-sky-900',
      badge: 'bg-sky-100 text-sky-800 border-sky-200',
      headerBg: 'bg-sky-600'
    },
    icon: UserCheck
  },

  // Niveau 3 : Chefs de Pôles Métiers
  {
    value: 'CHEF_TECHNICIEN_CMS',
    label: 'Chef Technicien CMS',
    description: 'Chef de file traite conventionnelle CMS et encadrement technique des techniciens terrain',
    category: 'chefs',
    color: {
      bg: 'bg-teal-50',
      border: 'border-teal-300',
      text: 'text-teal-900',
      badge: 'bg-teal-100 text-teal-800 border-teal-200',
      headerBg: 'bg-teal-600'
    },
    icon: Wrench
  },
  {
    value: 'CHEF_TECHNICIEN_VMS',
    label: 'Chef Technicien VMS',
    description: 'Chef de file robotique de traite VMS, diagnostics complexes, calibrages et réglages robots',
    category: 'chefs',
    color: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-300',
      text: 'text-cyan-900',
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      headerBg: 'bg-cyan-600'
    },
    icon: Wrench
  },
  {
    value: 'CHEF_MONTEUR',
    label: 'Chef Monteur',
    description: 'Responsable des installations neuves, mises en service et réceptions de chantier',
    category: 'chefs',
    color: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      text: 'text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      headerBg: 'bg-emerald-600'
    },
    icon: Wrench
  },

  // Niveau 4 : Équipes Terrain Opérationnelles
  {
    value: 'TECHNICIEN_CMS',
    label: 'Technicien CMS',
    description: 'Interventions, entretiens réguliers et dépannages sur installations de traite conventionnelle',
    category: 'terrain',
    color: {
      bg: 'bg-emerald-50/60',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      headerBg: 'bg-emerald-600'
    },
    icon: Wrench
  },
  {
    value: 'TECHNICIEN_VMS',
    label: 'Technicien VMS',
    description: 'Maintenance préventive, dépannages d’urgence et réglages fins sur robots VMS',
    category: 'terrain',
    color: {
      bg: 'bg-cyan-50/60',
      border: 'border-cyan-200',
      text: 'text-cyan-900',
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      headerBg: 'bg-cyan-600'
    },
    icon: Wrench
  },
  {
    value: 'MONTEUR',
    label: 'Monteur',
    description: 'Travaux de montage, tuyauteries, installations mécaniques et électriques sur chantiers',
    category: 'terrain',
    color: {
      bg: 'bg-amber-50/70',
      border: 'border-amber-200',
      text: 'text-amber-900',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      headerBg: 'bg-amber-600'
    },
    icon: Wrench
  },

  // Niveau 5 : Logistique & Stock
  {
    value: 'MAGASINIER',
    label: 'Magasinier',
    description: 'Gestion du stock de pièces de rechange, préparation des kits et logistique matérielle',
    category: 'logistique',
    color: {
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      text: 'text-orange-900',
      badge: 'bg-orange-100 text-orange-800 border-orange-200',
      headerBg: 'bg-orange-600'
    },
    icon: Package
  },

  // Niveau 6 : Clients & Éleveurs
  {
    value: 'CLIENT',
    label: 'Client / Éleveur',
    description: 'Consultation du parc machines, suivi des interventions réalisées et demandes d’assistance',
    category: 'client',
    color: {
      bg: 'bg-slate-50',
      border: 'border-slate-300',
      text: 'text-slate-800',
      badge: 'bg-slate-100 text-slate-800 border-slate-200',
      headerBg: 'bg-slate-600'
    },
    icon: Users
  }
];

// Catégories de permissions pour un affichage clair et structuré
export const PERMISSION_CATEGORIES: { id: string; label: string; icon: string; ids: PermissionId[] }[] = [
  {
    id: 'core',
    label: 'Tableau de bord & Guides',
    icon: '📊',
    ids: ['view_dashboard', 'view_troubleshooting']
  },
  {
    id: 'clients',
    label: 'Gestion des Clients',
    icon: '👥',
    ids: ['view_clients', 'edit_clients']
  },
  {
    id: 'machines',
    label: 'Parc Machines & Équipements',
    icon: '🚜',
    ids: ['view_machines', 'edit_machines']
  },
  {
    id: 'interventions',
    label: 'Interventions & Dépannages',
    icon: '🛠️',
    ids: ['view_interventions', 'create_interventions', 'edit_interventions']
  },
  {
    id: 'stock',
    label: 'Pièces détachées & Stock',
    icon: '📦',
    ids: ['view_spare_parts', 'edit_spare_parts']
  },
  {
    id: 'maintenance',
    label: 'Maintenance & Protocoles',
    icon: '📋',
    ids: ['view_maintenance', 'edit_maintenance']
  },
  {
    id: 'admin',
    label: 'Administration & Sécurité',
    icon: '🔒',
    ids: ['view_users', 'edit_users', 'manage_users', 'admin_access', 'view_all_data']
  }
];

interface RoleLogigramTabProps {
  users: any[];
  rolesPersonnalises?: string[];
  onUpdateUserRole: (userId: string, newRole: string, allRoles?: string[], customPermissions?: string[]) => Promise<void>;
  onBatchUpdateRolePermissions?: (role: string, permissions: string[]) => Promise<void>;
  onRefreshUsers: () => Promise<void>;
  canValidate: boolean;
  currentUserEmail?: string;
}

export function RoleLogigramTab({
  users,
  rolesPersonnalises = [],
  onUpdateUserRole,
  onBatchUpdateRolePermissions,
  onRefreshUsers,
  canValidate,
  currentUserEmail
}: RoleLogigramTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [assignModalRole, setAssignModalRole] = useState<RoleDefinition | null>(null);
  const [assignSelectedUserId, setAssignSelectedUserId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [unassignedDrawerOpen, setUnassignedDrawerOpen] = useState(true);
  const [expandedPermsRole, setExpandedPermsRole] = useState<string | null>(null);

  // État de la modale de configuration des permissions pré-définies d'un rôle
  const [configRole, setConfigRole] = useState<RoleDefinition | null>(null);
  const [tempRolePerms, setTempRolePerms] = useState<PermissionId[]>([]);
  const [applyToExistingUsers, setApplyToExistingUsers] = useState<boolean>(true);
  const [permsVersion, setPermsVersion] = useState<number>(0);

  // Écouter les mises à jour des permissions pour forcer le rafraîchissement
  useEffect(() => {
    const handleUpdate = () => setPermsVersion((v) => v + 1);
    window.addEventListener('maintenance_role_permissions_updated', handleUpdate);
    return () => window.removeEventListener('maintenance_role_permissions_updated', handleUpdate);
  }, []);

  // Fusionner les 12 rôles de référence avec les rôles personnalisés éventuels
  const allRoles: RoleDefinition[] = useMemo(() => {
    const list = [...DEFAULT_ROLE_DEFINITIONS];
    rolesPersonnalises.forEach((customRole) => {
      if (!list.some((r) => r.value === customRole)) {
        list.push({
          value: customRole,
          label: customRole.replace(/_/g, ' '),
          description: 'Rôle métier personnalisé sur mesure',
          category: 'personnalise',
          color: {
            bg: 'bg-violet-50',
            border: 'border-violet-300',
            text: 'text-violet-900',
            badge: 'bg-violet-100 text-violet-800 border-violet-200',
            headerBg: 'bg-violet-600'
          },
          icon: UserCheck
        });
      }
    });
    return list;
  }, [rolesPersonnalises]);

  // Regroupement des utilisateurs par rôle
  const usersByRole = useMemo(() => {
    const map = new Map<string, any[]>();
    allRoles.forEach((role) => map.set(role.value, []));

    users.forEach((u) => {
      const assignedRoles: string[] = [];
      if (Array.isArray(u.roles) && u.roles.length > 0) {
        assignedRoles.push(...u.roles);
      } else if (u.role) {
        assignedRoles.push(u.role);
      }

      assignedRoles.forEach((roleKey) => {
        if (!map.has(roleKey)) {
          map.set(roleKey, []);
        }
        map.get(roleKey)?.push(u);
      });
    });

    return map;
  }, [users, allRoles]);

  // Utilisateurs sans aucun rôle ou rôle non reconnu
  const unassignedUsers = useMemo(() => {
    return users.filter((u) => {
      const hasRole = (u.role && u.role.trim() !== '') || (Array.isArray(u.roles) && u.roles.length > 0);
      return !hasRole;
    });
  }, [users]);

  // Utilisateurs en attente de validation
  const pendingUsers = useMemo(() => {
    return users.filter((u) => u.statut === 'EN_ATTENTE' || (u.actif === false && u.statut !== 'REFUSE'));
  }, [users]);

  const showFeedback = (text: string, isError = false) => {
    setFeedbackMessage({ text, isError });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Traitement d'assignation ou changement de rôle
  const handleAssignRole = async (userId: string, newRole: string) => {
    if (!userId || !newRole) return;
    setActionLoading(true);
    try {
      const targetUser = users.find((u) => (u._id || u.id) === userId);
      const userLabel = targetUser ? `${targetUser.prenom} ${targetUser.nom}` : 'Utilisateur';

      // On applique automatiquement les permissions pré-définies de ce rôle
      const defaultPerms = getDefaultPermissionsForRole(newRole);
      await onUpdateUserRole(userId, newRole, [newRole], defaultPerms);
      showFeedback(`✅ ${userLabel} est désormais associé au rôle ${newRole.replace(/_/g, ' ')} avec ses ${defaultPerms.length} permissions pré-définies !`);
      setAssignModalRole(null);
      setAssignSelectedUserId('');
    } catch (err: any) {
      console.error('Erreur affectation rôle:', err);
      showFeedback(err?.message || 'Erreur lors de l’affectation du rôle', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Traitement de retrait d'un rôle
  const handleRemoveRole = async (user: any, roleToRemove: string) => {
    if (user.email === 'contact@appalacarte.fr' && roleToRemove === 'ADMINISTRATEUR') {
      alert("Le compte maître contact@appalacarte.fr doit impérativement conserver le rôle ADMINISTRATEUR.");
      return;
    }

    if (!confirm(`Confirmez-vous le retrait du rôle "${roleToRemove}" pour ${user.prenom} ${user.nom} ?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const currentRoles: string[] = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
      const updatedRoles = currentRoles.filter((r) => r !== roleToRemove);
      const fallbackRole = updatedRoles[0] || '';
      const fallbackPerms = fallbackRole ? getDefaultPermissionsForRole(fallbackRole) : [];

      await onUpdateUserRole(user._id || user.id, fallbackRole, updatedRoles, fallbackPerms);
      showFeedback(`Rôle "${roleToRemove}" retiré pour ${user.prenom} ${user.nom}`);
    } catch (err: any) {
      console.error('Erreur retrait rôle:', err);
      showFeedback('Erreur lors du retrait du rôle', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Ouverture de la modale de configuration des permissions pré-définies d'un rôle
  const handleOpenConfigRole = (role: RoleDefinition) => {
    setConfigRole(role);
    const currentPredefined = getDefaultPermissionsForRole(role.value);
    setTempRolePerms([...currentPredefined]);
    setApplyToExistingUsers(true);
  };

  // Sauvegarde des permissions pré-définies configurées pour un rôle
  const handleSaveRolePermissions = async () => {
    if (!configRole) return;
    setActionLoading(true);
    try {
      setRoleDefaultPermissions(configRole.value, tempRolePerms);
      setPermsVersion((v) => v + 1);

      // Si l'option d'application aux utilisateurs existants est cochée
      const assigned = usersByRole.get(configRole.value) || [];
      if (applyToExistingUsers && assigned.length > 0 && onBatchUpdateRolePermissions) {
        await onBatchUpdateRolePermissions(configRole.value, tempRolePerms);
      } else if (applyToExistingUsers && assigned.length > 0) {
        for (const u of assigned) {
          const uId = u._id || u.id;
          const userRoles = Array.isArray(u.roles) ? u.roles : [configRole.value];
          await onUpdateUserRole(uId, configRole.value, userRoles, tempRolePerms);
        }
      }

      showFeedback(`✅ Permissions pré-définies mises à jour pour le rôle ${configRole.label} (${tempRolePerms.length} permissions actives)`);
      setConfigRole(null);
    } catch (err: any) {
      console.error('Erreur sauvegarde permissions rôle:', err);
      showFeedback('Erreur lors de la mise à jour des permissions du rôle', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Rétablir les permissions par défaut d'origine pour le rôle en cours de configuration
  const handleResetCurrentRolePermissions = () => {
    if (!configRole) return;
    const original = ROLE_DEFAULT_PERMISSIONS[configRole.value.toUpperCase()] || [];
    setTempRolePerms([...original]);
  };

  // Rétablir un rôle aux réglages d'usine directement
  const handleDirectResetRole = (roleValue: string) => {
    if (!confirm(`Rétablir les permissions pré-définies d'origine pour ce rôle ?`)) return;
    resetRoleDefaultPermissions(roleValue);
    setPermsVersion((v) => v + 1);
    showFeedback(`Permissions par défaut d'origine rétablies pour ce rôle`);
  };

  // Bascule d'une permission individuelle dans la modale
  const handleToggleTempPermission = (pId: PermissionId) => {
    setTempRolePerms((prev) =>
      prev.includes(pId) ? prev.filter((p) => p !== pId) : [...prev, pId]
    );
  };

  // Filtrage des rôles affichés
  const filteredRoles = useMemo(() => {
    return allRoles.filter((role) => {
      if (selectedCategory !== 'all' && role.category !== selectedCategory) {
        return false;
      }
      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      const matchRole = role.label.toLowerCase().includes(q) || role.value.toLowerCase().includes(q);
      const assigned = usersByRole.get(role.value) || [];
      const matchUser = assigned.some(
        (u) =>
          u.nom?.toLowerCase().includes(q) ||
          u.prenom?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.numeroTechnicien?.toLowerCase().includes(q)
      );

      return matchRole || matchUser;
    });
  }, [allRoles, selectedCategory, searchTerm, usersByRole, permsVersion]);

  // Niveaux hiérarchiques du logigramme (les 12 rôles répartis)
  const levels = [
    {
      id: 'direction',
      title: 'Niveau 1 — Direction & Administration Maître (2 rôles)',
      subtitle: 'Contrôle total, gouvernance, sécurité et administration des accès',
      roles: filteredRoles.filter((r) => r.category === 'direction'),
      connectorText: 'Délégation technique et supervision opérationnelle'
    },
    {
      id: 'encadrement',
      title: 'Niveau 2 — Encadrement Technique & Coordination (2 rôles)',
      subtitle: 'Planification des chantiers, validation des interventions et protocoles de maintenance',
      roles: filteredRoles.filter((r) => r.category === 'encadrement'),
      connectorText: 'Coordination et pilotage des pôles métiers'
    },
    {
      id: 'chefs',
      title: 'Niveau 3 — Responsables de Pôles Métiers (3 rôles)',
      subtitle: 'Encadrement direct des équipes terrain, expertise CMS, VMS et montage de chantiers',
      roles: filteredRoles.filter((r) => r.category === 'chefs'),
      connectorText: 'Encadrement et assistance directe sur le terrain'
    },
    {
      id: 'terrain',
      title: 'Niveau 4 — Équipes Opérationnelles de Terrain (3 rôles)',
      subtitle: 'Dépannages d’urgence, entretiens réguliers, montages et réglages machines',
      roles: filteredRoles.filter((r) => r.category === 'terrain'),
      connectorText: 'Support logistique & approvisionnement en pièces'
    },
    {
      id: 'logistique',
      title: 'Niveau 5 — Support Logistique & Magasin (1 rôle)',
      subtitle: 'Gestion des kits de maintenance, stock de pièces détachées et expéditions',
      roles: filteredRoles.filter((r) => r.category === 'logistique'),
      connectorText: 'Interface usagers et relation éleveurs'
    },
    {
      id: 'client',
      title: 'Niveau 6 — Espace Usagers & Éleveurs (1 rôle)',
      subtitle: 'Consultation du parc matériel, historiques d’interventions et guides',
      roles: filteredRoles.filter((r) => r.category === 'client'),
      connectorText: null
    }
  ];

  // Rôles personnalisés
  const customCategoryRoles = filteredRoles.filter((r) => r.category === 'personnalise');

  // Composant Carte d'un Rôle (réutilisable entre vue arborescente et vue grille)
  const renderRoleCard = (role: RoleDefinition) => {
    const assignedList = usersByRole.get(role.value) || [];
    const RoleIcon = role.icon;
    const defaultPerms = getDefaultPermissionsForRole(role.value);
    const isModified = isRoleDefaultPermissionsModified(role.value);
    const isPermsOpen = expandedPermsRole === role.value;

    return (
      <div
        key={role.value}
        className={`rounded-2xl border-2 transition-all duration-200 shadow-xs flex flex-col bg-white overflow-hidden ${role.color.border}`}
      >
        {/* En-tête du rôle */}
        <div className={`${role.color.headerBg} text-white p-3.5 flex items-start justify-between gap-2`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 bg-white/20 rounded-xl flex-shrink-0">
              <RoleIcon className="w-4 h-4 text-white" />
            </span>
            <div className="min-w-0">
              <h4 className="font-bold text-sm tracking-tight truncate">{role.label}</h4>
              <span className="text-[10px] text-white/80 font-mono block">
                {role.value}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="bg-white/20 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
              {assignedList.length} {assignedList.length > 1 ? 'personnes' : 'personne'}
            </span>
          </div>
        </div>

        {/* Description du rôle */}
        <div className="px-3.5 py-2 bg-slate-50 border-b border-gray-100 text-[11px] text-gray-600 leading-snug">
          {role.description}
        </div>

        {/* Bloc Permissions Pré-définies du Rôle */}
        <div className="px-3.5 py-2.5 bg-blue-50/50 border-b border-blue-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                <Sliders className="w-3 h-3 text-blue-700" />
                <span>{defaultPerms.length} / {ALL_PERMISSIONS.length} permissions pré-définies</span>
              </span>
              {isModified && (
                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                  Personnalisé
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpandedPermsRole(isPermsOpen ? null : role.value)}
                title={isPermsOpen ? "Masquer les permissions" : "Voir les permissions"}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-blue-100/60"
              >
                <span>{isPermsOpen ? 'Masquer' : 'Aperçu'}</span>
                {isPermsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {canValidate && (
                <button
                  type="button"
                  onClick={() => handleOpenConfigRole(role)}
                  title="Modifier les permissions pré-définies de ce rôle"
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2 py-1 rounded-md flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  <span>Pré-définir</span>
                </button>
              )}
            </div>
          </div>

          {/* Volet dépliable des permissions pré-définies */}
          {isPermsOpen && (
            <div className="mt-2.5 pt-2 border-t border-blue-100/80 space-y-1.5">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                Attribuées par défaut lors de la création d'un utilisateur :
              </p>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                {ALL_PERMISSIONS.map((perm) => {
                  const isActive = defaultPerms.includes(perm.id);
                  return (
                    <span
                      key={perm.id}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium border flex items-center gap-1 ${
                        isActive
                          ? 'bg-white text-blue-900 border-blue-300 shadow-xs'
                          : 'bg-gray-100 text-gray-400 border-gray-200 line-through opacity-60'
                      }`}
                    >
                      {isActive ? <Check className="w-2.5 h-2.5 text-blue-600" /> : <X className="w-2.5 h-2.5 text-gray-400" />}
                      <span>{perm.label}</span>
                    </span>
                  );
                })}
              </div>

              {isModified && canValidate && (
                <div className="pt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDirectResetRole(role.value)}
                    className="text-[10px] text-gray-500 hover:text-red-600 flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Rétablir les valeurs système</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Liste des personnes assignées à ce rôle */}
        <div className="p-3.5 flex-1 space-y-2 min-h-[90px] max-h-[260px] overflow-y-auto">
          {assignedList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-4 text-center text-gray-400">
              <Users className="w-6 h-6 stroke-[1.5] mb-1 text-gray-300" />
              <p className="text-xs italic">Aucun utilisateur dans ce rôle</p>
            </div>
          ) : (
            assignedList.map((user) => {
              const uId = user._id || user.id;
              const isMe = user.email === currentUserEmail;
              const userPermsCount = Array.isArray(user.permissions) ? user.permissions.length : defaultPerms.length;

              return (
                <div
                  key={uId}
                  className="group p-2 rounded-xl bg-gray-50 hover:bg-blue-50/60 border border-gray-200 hover:border-blue-300 transition-all flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900 truncate">
                        {user.prenom} {user.nom}
                      </span>
                      {user.numeroTechnicien && (
                        <span className="text-[10px] font-mono font-semibold bg-gray-200 text-gray-700 px-1 py-0.2 rounded">
                          #{user.numeroTechnicien}
                        </span>
                      )}
                      {isMe && (
                        <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1 rounded">
                          Moi
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate flex items-center gap-1.5">
                      <span>{user.email}</span>
                      <span className="text-blue-700 font-semibold">• {userPermsCount} perm.</span>
                    </div>
                  </div>

                  {/* Menu d'action rapide sur l'utilisateur */}
                  <div className="flex items-center gap-1">
                    {canValidate && (
                      <>
                        <select
                          title="Changer de rôle"
                          value={role.value}
                          onChange={(e) => {
                            if (e.target.value !== role.value) {
                              handleAssignRole(uId, e.target.value);
                            }
                          }}
                          className="text-[11px] bg-white border border-gray-300 hover:border-blue-400 text-gray-700 rounded-md px-1.5 py-0.5 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option disabled value={role.value}>
                            Changer...
                          </option>
                          {allRoles
                            .filter((r) => r.value !== role.value)
                            .map((r) => (
                              <option key={r.value} value={r.value}>
                                ➔ {r.label}
                              </option>
                            ))}
                        </select>

                        <button
                          type="button"
                          title="Retirer de ce rôle"
                          onClick={() => handleRemoveRole(user, role.value)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bouton d'ajout rapide au rôle */}
        {canValidate && (
          <div className="p-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAssignModalRole(role);
                setAssignSelectedUserId('');
              }}
              className="flex-1 py-1.5 px-3 rounded-lg border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Lier un utilisateur</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast de confirmation / notification */}
      {feedbackMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
            feedbackMessage.isError
              ? 'bg-red-50 text-red-900 border-red-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          {feedbackMessage.isError ? <AlertCircle className="w-5 h-5 text-red-600" /> : <Check className="w-5 h-5 text-emerald-600" />}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* En-tête explicatif du Logigramme des 12 Rôles */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
                <Workflow className="w-6 h-6 text-blue-300" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Logigramme des 12 Rôles & Permissions Pré-définies
              </h2>
            </div>
            <p className="text-blue-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Les <strong>12 rôles métiers</strong> sont configurés avec leurs permissions pré-définies.
              Chaque utilisateur reçoit automatiquement les permissions de son rôle lors de sa création, et peut être
              ajusté sur-mesure (+ / - permissions) dans sa gestion personnelle.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bascule de vue Organigramme vs Grille */}
            <div className="bg-white/10 p-1 rounded-xl border border-white/20 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'tree'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Organigramme</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grille des 12 rôles</span>
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefreshUsers}
              disabled={actionLoading}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
            <span className="text-xs bg-blue-500/30 text-blue-100 px-3 py-1.5 rounded-lg border border-blue-400/20 font-medium">
              👥 {users.length} utilisateur(s) • {allRoles.length} rôles
            </span>
          </div>
        </div>

        {/* Barre de recherche et filtres de catégorie */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-blue-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un technicien, email, n° technicien ou rôle..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-blue-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: `Tous les ${allRoles.length} rôles` },
              { id: 'direction', label: 'Direction (2)' },
              { id: 'encadrement', label: 'Encadrement (2)' },
              { id: 'chefs', label: 'Chefs d’équipe (3)' },
              { id: 'terrain', label: 'Terrain (3)' },
              { id: 'logistique', label: 'Magasin (1)' },
              { id: 'client', label: 'Clients (1)' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedCategory(f.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === f.id
                    ? 'bg-white text-blue-900 font-bold shadow-sm'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bac des utilisateurs sans rôle ou en attente */}
      {(unassignedUsers.length > 0 || pendingUsers.length > 0) && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500 text-white rounded-lg">
                <AlertCircle className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Techniciens à affecter ou en attente de rôle ({unassignedUsers.length + pendingUsers.length})
                </h3>
                <p className="text-xs text-amber-800">
                  Ces personnes n'ont pas encore de rôle défini dans le logigramme. Affectez-leur un des 12 rôles en 1 clic.
                </p>
              </div>
            </div>
            <button
              onClick={() => setUnassignedDrawerOpen(!unassignedDrawerOpen)}
              className="text-amber-800 hover:text-amber-950 p-1 rounded-md"
            >
              {unassignedDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {unassignedDrawerOpen && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {[...new Set([...unassignedUsers, ...pendingUsers])].map((user) => {
                const uId = user._id || user.id;
                return (
                  <div
                    key={uId}
                    className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between gap-2 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-gray-900 truncate">
                        {user.prenom} {user.nom}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
                      {user.statut === 'EN_ATTENTE' && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                          En attente de validation
                        </span>
                      )}
                    </div>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignRole(uId, e.target.value);
                        }
                      }}
                      className="text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-2 py-1 font-semibold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Lier à un rôle...</option>
                      {allRoles.map((r) => (
                        <option key={r.value} value={r.value}>
                          👉 {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* VUE 1 : ORGANIGRAMME HIÉRARCHIQUE (LOGIGRAMME AVEC FLÈCHES) */}
      {viewMode === 'tree' ? (
        <div className="space-y-8 relative">
          {levels
            .filter((lvl) => lvl.roles.length > 0)
            .map((level, lvlIdx, arr) => (
              <div key={level.id} className="relative">
                {/* En-tête de niveau */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-bold shadow-xs">
                    {lvlIdx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">{level.title}</h3>
                    <p className="text-xs text-gray-500">{level.subtitle}</p>
                  </div>
                </div>

                {/* Grille des boîtes de rôles de ce niveau */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {level.roles.map(renderRoleCard)}
                </div>

                {/* Connecteur visuel hiérarchique du logigramme vers le niveau suivant */}
                {level.connectorText && lvlIdx < arr.length - 1 && (
                  <div className="flex flex-col items-center my-4">
                    <div className="w-0.5 h-4 bg-slate-300"></div>
                    <div className="px-3 py-1 bg-slate-100 border border-slate-300 rounded-full text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 shadow-xs">
                      <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      <span>{level.connectorText}</span>
                    </div>
                    <div className="w-0.5 h-4 bg-slate-300"></div>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        /* VUE 2 : GRILLE MATRICIELLE COMPLÈTE DES 12 RÔLES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map(renderRoleCard)}
        </div>
      )}

      {/* Section des rôles personnalisés si présents */}
      {customCategoryRoles.length > 0 && selectedCategory === 'all' && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-violet-600 inline-block"></span>
            Rôles Personnalisés Spécifiques ({customCategoryRoles.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customCategoryRoles.map(renderRoleCard)}
          </div>
        </div>
      )}

      {/* ================= MODALE DE CONFIGURATION DES PERMISSIONS PRÉ-DÉFINIES D'UN RÔLE ================= */}
      {configRole && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* En-tête de la modale */}
            <div className={`${configRole.color.headerBg} text-white p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-base">
                    Pré-définir les Permissions du Rôle : {configRole.label}
                  </h3>
                  <span className="text-xs text-white/80 font-mono">
                    Code rôle : {configRole.value}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfigRole(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps de la modale */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Explication pédagogique */}
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-700 flex-shrink-0" />
                  <span>Modèle de permissions pour les utilisateurs de ce rôle :</span>
                </p>
                <p className="text-blue-800 leading-relaxed">
                  À chaque fois que vous créerez ou assignerez un utilisateur au rôle <strong>{configRole.label}</strong>,
                  ces permissions lui seront pré-attribuées automatiquement. Vous pourrez ensuite enrichir (+) ou restreindre (-)
                  ses permissions au cas par cas dans sa gestion personnelle.
                </p>
              </div>

              {/* Raccourcis de sélection */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-xs font-bold text-gray-700">
                  <span className="text-blue-600 font-extrabold">{tempRolePerms.length}</span> / {ALL_PERMISSIONS.length} permissions sélectionnées
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setTempRolePerms(ALL_PERMISSIONS.map((p) => p.id))}
                    className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200"
                  >
                    Tout cocher
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempRolePerms([])}
                    className="text-[11px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200"
                  >
                    Tout décocher
                  </button>
                  <button
                    type="button"
                    onClick={handleResetCurrentRolePermissions}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Réinitialiser aux valeurs système</span>
                  </button>
                </div>
              </div>

              {/* Grille des permissions catégorisées */}
              <div className="space-y-3 pt-2">
                {PERMISSION_CATEGORIES.map((category) => {
                  const categoryPerms = ALL_PERMISSIONS.filter((p) => category.ids.includes(p.id));
                  if (categoryPerms.length === 0) return null;

                  return (
                    <div key={category.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                          <span>{category.icon}</span>
                          <span>{category.label}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-semibold">
                          {categoryPerms.filter((p) => tempRolePerms.includes(p.id)).length} / {categoryPerms.length}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {categoryPerms.map((perm) => {
                          const isChecked = tempRolePerms.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-blue-50/80 border-blue-300 text-blue-950 font-medium'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleTempPermission(perm.id)}
                                className="w-4 h-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <div>{perm.label}</div>
                                <span className="text-[10px] font-mono text-gray-400 block">
                                  {perm.id}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Option d'application rétroactive aux utilisateurs existants */}
              {usersByRole.get(configRole.value)?.length ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="applyToExistingUsers"
                    checked={applyToExistingUsers}
                    onChange={(e) => setApplyToExistingUsers(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="applyToExistingUsers" className="text-xs text-amber-950 font-medium cursor-pointer">
                    <strong>Mettre à jour immédiatement les {(usersByRole.get(configRole.value) || []).length} utilisateur(s)</strong> ayant actuellement ce rôle avec ces nouvelles permissions.
                  </label>
                </div>
              ) : null}
            </div>

            {/* Pied de la modale */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfigRole(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={actionLoading}
                onClick={handleSaveRolePermissions}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 font-bold shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>{actionLoading ? 'Enregistrement...' : 'Enregistrer les permissions du rôle'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALE D'AFFECTATION RAPIDE D'UN TECHNICIEN A UN RÔLE ================= */}
      {assignModalRole && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className={`${assignModalRole.color.headerBg} text-white p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-base">Lier un technicien au rôle</h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalRole(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Rôle cible dans le logigramme
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{assignModalRole.label}</span>
                  <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border">
                    {assignModalRole.value}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-snug">
                  {assignModalRole.description}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Sélectionnez le technicien / utilisateur à lier :
                </label>
                <select
                  value={assignSelectedUserId}
                  onChange={(e) => setAssignSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="">-- Choisir un utilisateur --</option>
                  {users.map((u) => {
                    const uId = u._id || u.id;
                    const curRole = u.role || (Array.isArray(u.roles) && u.roles[0]) || 'Aucun';
                    const isAlreadyIn = curRole === assignModalRole.value;
                    return (
                      <option key={uId} value={uId} disabled={isAlreadyIn}>
                        {u.prenom} {u.nom} ({u.email}) — Actuel : {curRole} {isAlreadyIn ? '(Déjà dans ce rôle)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
                ℹ️ <strong>Synchronisation automatique :</strong> Le technicien recevra immédiatement les{' '}
                <strong>{getDefaultPermissionsForRole(assignModalRole.value).length} permissions pré-définies</strong> de ce rôle.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAssignModalRole(null)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!assignSelectedUserId || actionLoading}
                  onClick={() => handleAssignRole(assignSelectedUserId, assignModalRole.value)}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{actionLoading ? 'Liaison en cours...' : 'Confirmer la liaison'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
