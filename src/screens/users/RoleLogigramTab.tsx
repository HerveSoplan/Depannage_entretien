// src/screens/users/RoleLogigramTab.tsx
import React, { useState, useMemo } from 'react';
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
  Workflow
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

interface RoleDefinition {
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

const DEFAULT_ROLE_DEFINITIONS: RoleDefinition[] = [
  // Niveau 1 : Direction
  {
    value: 'ADMINISTRATEUR',
    label: 'Administrateur',
    description: 'Accès maître total, gestion des utilisateurs, bases de données et sécurité',
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
    description: 'Supervision générale, vue stratégique des plannings et des chantiers',
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
    description: 'Gestion globale du parc, planification, affectation des interventions et protocoles',
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
    description: 'Coordination générale d’équipe et validation opérationnelle',
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

  // Niveau 3 : Chefs d'équipe & Chefs Techniciens
  {
    value: 'CHEF_TECHNICIEN_CMS',
    label: 'Chef Technicien CMS',
    description: 'Chef de file pôle traite conventionnelle CMS et encadrement des monteurs CMS',
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
    description: 'Chef de file robotique de traite VMS, diagnostics avancés et calibrages',
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

  // Niveau 4 : Techniciens Opérationnels Terrain
  {
    value: 'TECHNICIEN_CMS',
    label: 'Technicien CMS',
    description: 'Interventions, entretiens périodiques et dépannages sur installations CMS',
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
    description: 'Maintenance préventive, dépannages d’urgence et réglages robots VMS',
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
    description: 'Travaux de montage, tuyauteries, installations mécaniques et électriques',
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

  // Niveau 5 : Logistique & Pièces
  {
    value: 'MAGASINIER',
    label: 'Magasinier',
    description: 'Gestion du stock de pièces de rechange, préparation des kits et livraisons',
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

  // Niveau 6 : Clients
  {
    value: 'CLIENT',
    label: 'Client / Éleveur',
    description: 'Consultation du parc matériel, suivi des interventions et demandes d’assistance',
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

interface RoleLogigramTabProps {
  users: any[];
  rolesPersonnalises?: string[];
  onUpdateUserRole: (userId: string, newRole: string, allRoles?: string[]) => Promise<void>;
  onRefreshUsers: () => Promise<void>;
  canValidate: boolean;
  currentUserEmail?: string;
}

export function RoleLogigramTab({
  users,
  rolesPersonnalises = [],
  onUpdateUserRole,
  onRefreshUsers,
  canValidate,
  currentUserEmail
}: RoleLogigramTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [assignModalRole, setAssignModalRole] = useState<RoleDefinition | null>(null);
  const [assignSelectedUserId, setAssignSelectedUserId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [unassignedDrawerOpen, setUnassignedDrawerOpen] = useState(true);

  // Fusionner les rôles par défaut avec les rôles personnalisés existants
  const allRoles: RoleDefinition[] = useMemo(() => {
    const list = [...DEFAULT_ROLE_DEFINITIONS];
    rolesPersonnalises.forEach((customRole) => {
      if (!list.some((r) => r.value === customRole)) {
        list.push({
          value: customRole,
          label: customRole.replace(/_/g, ' '),
          description: 'Rôle métier personnalisé créé sur mesure',
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
      // Un utilisateur peut avoir un rôle unique `role` ou une liste `roles`
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

      await onUpdateUserRole(userId, newRole, [newRole]);
      showFeedback(`✅ ${userLabel} a été lié au rôle : ${newRole.replace(/_/g, ' ')}`);
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

      await onUpdateUserRole(user._id || user.id, fallbackRole, updatedRoles);
      showFeedback(`Rôle "${roleToRemove}" retiré pour ${user.prenom} ${user.nom}`);
    } catch (err: any) {
      console.error('Erreur retrait rôle:', err);
      showFeedback('Erreur lors du retrait du rôle', true);
    } finally {
      setActionLoading(false);
    }
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
  }, [allRoles, selectedCategory, searchTerm, usersByRole]);

  // Niveaux hiérarchiques du logigramme
  const levels = [
    {
      id: 'direction',
      title: 'Niveau 1 — Direction & Administration Maître',
      subtitle: 'Contrôle global, gouvernance, sécurité et administration des accès',
      roles: filteredRoles.filter((r) => r.category === 'direction'),
      connectorText: 'Délégation technique et supervision'
    },
    {
      id: 'encadrement',
      title: 'Niveau 2 — Encadrement Technique & Coordination',
      subtitle: 'Planification des chantiers, validation des interventions et des protocoles',
      roles: filteredRoles.filter((r) => r.category === 'encadrement'),
      connectorText: 'Coordination des pôles métiers'
    },
    {
      id: 'chefs',
      title: 'Niveau 3 — Responsables de Pôles Métiers (Chefs Techniciens & Monteurs)',
      subtitle: 'Encadrement direct des équipes terrain et expertise technique avancée',
      roles: filteredRoles.filter((r) => r.category === 'chefs'),
      connectorText: 'Encadrement opérationnel sur le terrain'
    },
    {
      id: 'terrain',
      title: 'Niveau 4 — Équipes Opérationnelles de Terrain',
      subtitle: 'Dépannages d’urgence, entretiens réguliers, montages et mises en service',
      roles: filteredRoles.filter((r) => r.category === 'terrain'),
      connectorText: 'Support logistique & pièces détachées'
    },
    {
      id: 'logistique',
      title: 'Niveau 5 — Support Logistique & Magasin',
      subtitle: 'Gestion des kits de maintenance, stock et expédition des pièces',
      roles: filteredRoles.filter((r) => r.category === 'logistique'),
      connectorText: 'Interface usagers et éleveurs'
    },
    {
      id: 'client',
      title: 'Niveau 6 — Espace Usagers & Éleveurs (Clients)',
      subtitle: 'Consultation du parc de machines et des historiques d’interventions',
      roles: filteredRoles.filter((r) => r.category === 'client'),
      connectorText: null
    }
  ];

  // Rôles personnalisés s'il y en a
  const customCategoryRoles = filteredRoles.filter((r) => r.category === 'personnalise');

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

      {/* En-tête explicatif du Logigramme */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
                <Workflow className="w-6 h-6 text-blue-300" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Logigramme Interactif d'Affectation des Rôles
              </h2>
            </div>
            <p className="text-blue-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Visualisez l'organigramme complet de l'équipe et <strong>liez chaque technicien à ses rôles en un clic</strong>.
              Toute modification est répercutée immédiatement et synchronisée.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
              { id: 'all', label: 'Tout le logigramme' },
              { id: 'direction', label: 'Direction' },
              { id: 'encadrement', label: 'Encadrement' },
              { id: 'chefs', label: 'Chefs d’équipe' },
              { id: 'terrain', label: 'Terrain' },
              { id: 'logistique', label: 'Magasin' }
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
                  Ces personnes n'ont pas encore de rôle défini dans le logigramme. Affectez-leur un rôle en 1 clic.
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
                      className="text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-2 py-1 font-semibold focus:ring-2 focus:ring-blue-500"
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

      {/* ARBORESCENCE DU LOGIGRAMME PAR NIVEAUX */}
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
                {level.roles.map((role) => {
                  const assignedList = usersByRole.get(role.value) || [];
                  const RoleIcon = role.icon;

                  return (
                    <div
                      key={role.value}
                      className={`rounded-2xl border-2 transition-all duration-200 shadow-xs flex flex-col bg-white overflow-hidden ${role.color.border}`}
                    >
                      {/* En-tête du rôle */}
                      <div className={`${role.color.headerBg} text-white p-3.5 flex items-start justify-between gap-2`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1.5 bg-white/20 rounded-lg flex-shrink-0">
                            <RoleIcon className="w-4 h-4 text-white" />
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm tracking-tight truncate">{role.label}</h4>
                            <span className="text-[10px] text-white/80 font-mono block">
                              {role.value}
                            </span>
                          </div>
                        </div>

                        <span className="bg-white/20 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0">
                          {assignedList.length} {assignedList.length > 1 ? 'personnes' : 'personne'}
                        </span>
                      </div>

                      {/* Description du rôle */}
                      <div className="px-3.5 py-2 bg-slate-50 border-b border-gray-100 text-[11px] text-gray-600 leading-snug">
                        {role.description}
                      </div>

                      {/* Liste des personnes assignées à ce rôle */}
                      <div className="p-3.5 flex-1 space-y-2 min-h-[90px] max-h-[260px] overflow-y-auto">
                        {assignedList.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center py-4 text-center text-gray-400">
                            <Users className="w-6 h-6 stroke-[1.5] mb-1 text-gray-300" />
                            <p className="text-xs italic">Aucun technicien dans ce rôle</p>
                          </div>
                        ) : (
                          assignedList.map((user) => {
                            const uId = user._id || user.id;
                            const isMe = user.email === currentUserEmail;

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
                                  <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
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
                        <div className="p-2.5 bg-gray-50/80 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => {
                              setAssignModalRole(role);
                              setAssignSelectedUserId('');
                            }}
                            className="w-full py-1.5 px-3 rounded-lg border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Lier un technicien</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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

        {/* Section des rôles personnalisés si présents */}
        {customCategoryRoles.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-violet-600 inline-block"></span>
              Rôles Personnalisés Spécifiques ({customCategoryRoles.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customCategoryRoles.map((role) => {
                const assignedList = usersByRole.get(role.value) || [];
                return (
                  <div
                    key={role.value}
                    className="rounded-2xl border-2 border-violet-200 shadow-xs flex flex-col bg-white overflow-hidden"
                  >
                    <div className="bg-violet-600 text-white p-3 flex items-center justify-between">
                      <h4 className="font-bold text-sm">{role.label}</h4>
                      <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {assignedList.length}
                      </span>
                    </div>
                    <div className="p-3 flex-1 space-y-2">
                      {assignedList.map((user) => (
                        <div
                          key={user._id || user.id}
                          className="p-2 rounded-lg bg-violet-50 text-xs flex items-center justify-between"
                        >
                          <span className="font-semibold text-violet-950">
                            {user.prenom} {user.nom}
                          </span>
                          <button
                            onClick={() => handleRemoveRole(user, role.value)}
                            className="text-violet-400 hover:text-red-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODALE D'AFFECTATION RAPIDE D'UN TECHNICIEN A UN RÔLE */}
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
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
                ℹ️ <strong>Synchronisation automatique :</strong> Le profil du technicien sera instantanément mis à jour avec ce rôle dans la base de données.
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
