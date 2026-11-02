// src/screens/users/UsersScreen.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { Input } from '../../components/common/Input';
import {
  Plus,
  Users,
  Edit,
  Trash2,
  Save,
  X,
  Shield,
  Mail,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  Share2,
  Copy,
  Check,
  Link,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Send,
  KeyRound,
  RefreshCw,
  Lock,
  Database,
  ExternalLink,
  FileCode2,
  Workflow
} from 'lucide-react';
import { db, generateTemporaryPassword, getPasswordRequestEmail, isLiveSupabaseActive } from '../../lib/supabase';
import { SUPABASE_REPAIR_SQL } from '../../lib/sql/repairScript';
import { APP_NAME, getAppBaseUrl } from '../../version';
import { RoleLogigramTab } from './RoleLogigramTab';

interface UsersScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const PERMISSIONS = [
  { id: 'view_clients', label: 'Voir clients' },
  { id: 'edit_clients', label: 'Modifier clients' },
  { id: 'view_machines', label: 'Voir machines' },
  { id: 'edit_machines', label: 'Modifier machines' },
  { id: 'view_interventions', label: 'Voir interventions' },
  { id: 'create_interventions', label: 'Créer interventions' },
  { id: 'edit_interventions', label: 'Modifier interventions' },
  { id: 'view_spare_parts', label: 'Voir pièces détachées' },
  { id: 'edit_spare_parts', label: 'Modifier pièces détachées' },
  { id: 'view_users', label: 'Voir utilisateurs' },
  { id: 'edit_users', label: 'Modifier utilisateurs' },
  { id: 'admin_access', label: 'Accès administration' }
];

export function UsersScreen({ onNavigate }: UsersScreenProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [rolesPersonnalises, setRolesPersonnalises] = useState<string[]>([]);
  const [saisieRole, setSaisieRole] = useState('');
  const [showSaisieRole, setShowSaisieRole] = useState(false);
  
  // Onglet de filtrage principal : 'tous' | 'en_attente' | 'valides' | 'logigramme'
  const [activeTab, setActiveTab] = useState<'tous' | 'en_attente' | 'valides' | 'logigramme'>('tous');

  // Modale de validation d'une demande d'accès
  const [approvingUser, setApprovingUser] = useState<any>(null);
  const [approvalRole, setApprovalRole] = useState('TECHNICIEN_CMS');
  const [approvalNumeroTechnicien, setApprovalNumeroTechnicien] = useState('');

  // Modale de partage / génération de liens
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkModalTab, setLinkModalTab] = useState<'public' | 'custom' | 'direct'>('public');
  const [customInviteNom, setCustomInviteNom] = useState('');
  const [customInvitePrenom, setCustomInvitePrenom] = useState('');
  const [customInviteEmail, setCustomInviteEmail] = useState('');
  const [selectedDirectUserEmail, setSelectedDirectUserEmail] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState<any>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [supabaseAlert, setSupabaseAlert] = useState<{ message: string; isError: boolean } | null>(null);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    numeroTechnicien: '',
    role: 'TECHNICIEN_CMS',
    roles: [] as string[],
    actif: true,
    permissions: [] as string[]
  });

  // Détection de l'utilisateur connecté
  const currentUser = (() => {
    try {
      const stored = localStorage.getItem('maintenance_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const isMasterAdmin =
    currentUser?.email === 'contact@appalacarte.fr' ||
    currentUser?.role === 'ADMINISTRATEUR' ||
    currentUser?.role === 'ADMIN';

  const isTechManager =
    currentUser?.role === 'RESPONSABLE_TECHNIQUE' ||
    currentUser?.role === 'RESPONSABLE';

  const canValidate =
    isMasterAdmin ||
    isTechManager ||
    (currentUser?.permissions || []).includes('admin_access') ||
    (currentUser?.permissions || []).includes('manage_users');

  const roles = [
    { value: 'ADMINISTRATEUR', label: 'Administrateur' },
    { value: 'DIRECTEUR', label: 'Directeur' },
    { value: 'RESPONSABLE_TECHNIQUE', label: 'Responsable Technique' },
    { value: 'RESPONSABLE', label: 'Responsable / Supérieur' },
    { value: 'CHEF_TECHNICIEN_CMS', label: 'Chef Technicien CMS' },
    { value: 'CHEF_TECHNICIEN_VMS', label: 'Chef Technicien VMS' },
    { value: 'TECHNICIEN_CMS', label: 'Technicien CMS' },
    { value: 'TECHNICIEN_VMS', label: 'Technicien VMS' },
    { value: 'CHEF_MONTEUR', label: 'Chef Monteur' },
    { value: 'MONTEUR', label: 'Monteur' },
    { value: 'MAGASINIER', label: 'Magasinier' },
    { value: 'CLIENT', label: 'Client' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result: any = await db.users.list();
      const list = Array.isArray(result) ? result : (result?.list || []);
      setUsers(list);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Groupes d'utilisateurs selon statut
  const pendingUsers = users.filter(
    (u) => u.statut === 'EN_ATTENTE' || (u.actif === false && u.statut !== 'REFUSE' && u.email !== 'contact@appalacarte.fr')
  );

  const activeUsers = users.filter(
    (u) => u.statut === 'VALIDE' || (u.actif !== false && u.statut !== 'EN_ATTENTE' && u.statut !== 'REFUSE')
  );

  // Filtrage selon l'onglet actif et la recherche
  const getTabUsers = () => {
    if (activeTab === 'en_attente') return pendingUsers;
    if (activeTab === 'valides') return activeUsers;
    return users;
  };

  const filteredUsers = getTabUsers().filter((user) =>
    user.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.numeroTechnicien?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Validation d'une demande d'accès
  const handleOpenApproveModal = (user: any) => {
    setApprovingUser(user);
    setApprovalRole(user.role || 'TECHNICIEN_CMS');
    setApprovalNumeroTechnicien(user.numeroTechnicien || '');
  };

  // Formatage officiel du message d'invitation avec mot de passe temporaire
  const formatInvitationMessage = (u: any) => {
    const appUrl = getAppBaseUrl();
    const loginLink = `${appUrl}/login?email=${encodeURIComponent(u.email || '')}&action=login`;
    const tempMdp = u.tempPassword || u.motDePasseTemporaire || generateTemporaryPassword(u.prenom || 'technicien');
    const roleLabel = roles.find((r) => r.value === u.role)?.label || u.role || 'Technicien';
    const senderEmail = getPasswordRequestEmail();

    return `Bonjour ${u.prenom} ${u.nom},

Votre compte d'accès à l'application ${APP_NAME} a été configuré avec le rôle : ${roleLabel}.

📱 Vos identifiants pour vous connecter depuis votre téléphone, tablette ou PC :
- Lien de connexion direct : ${loginLink}
- Identifiant (Email) : ${u.email}
- Mot de passe temporaire : ${tempMdp}

⚠️ Première connexion : Dès votre connexion avec ce mot de passe temporaire, l'application vous demandera immédiatement de définir votre mot de passe personnel définitif.

En cas de question ou pour toute demande d'assistance : ${senderEmail}

Bien cordialement,
App à la Carte — Hervé CHAMPAGNE EI
contact@appalacarte.fr`.trim();
  };

  const handleConfirmApproval = async () => {
    if (!approvingUser) return;
    setLoading(true);
    try {
      const tempPassword = generateTemporaryPassword(approvingUser.prenom || 'technicien');
      await db.users.approve(approvingUser._id || approvingUser.id, {
        role: approvalRole,
        numeroTechnicien: approvalNumeroTechnicien.trim(),
        approvedBy: currentUser?.email || 'contact@appalacarte.fr'
      });

      await db.users.update(approvingUser._id || approvingUser.id, {
        motDePasseTemporaire: tempPassword,
        doitChangerMotDePasse: true
      });

      await fetchUsers();

      const userWithCreds = {
        ...approvingUser,
        role: approvalRole,
        numeroTechnicien: approvalNumeroTechnicien.trim(),
        tempPassword
      };

      setApprovingUser(null);
      setCreatedCredentialsModal(userWithCreds);
    } catch (error) {
      console.error('Erreur validation utilisateur:', error);
      alert('Erreur lors de la validation.');
    } finally {
      setLoading(false);
    }
  };

  // Refus d'une demande d'accès
  const handleReject = async (user: any) => {
    if (!confirm(`Confirmez-vous le refus de la demande d'accès pour ${user.prenom} ${user.nom} (${user.email}) ?`)) {
      return;
    }
    setLoading(true);
    try {
      await db.users.reject(user._id || user.id);
      await fetchUsers();
      alert('Demande refusée.');
    } catch (error) {
      console.error('Erreur refus:', error);
      alert('Erreur lors du refus de la demande.');
    } finally {
      setLoading(false);
    }
  };

  // Copie d'un texte dans le presse-papier avec confirmation visuelle
  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (err) {
      alert(`Veuillez copier le texte ci-dessous :\n\n${text}`);
    }
  };

  // Transmettre les accès au technicien (ouverture de la modale de transmission avec mot de passe temporaire)
  const handleSendInvitation = async (user: any) => {
    if (!user.email) {
      alert("Cet utilisateur n'a pas d'adresse email !");
      return;
    }
    const tempPassword = user.motDePasseTemporaire || generateTemporaryPassword(user.prenom || 'technicien');
    setCreatedCredentialsModal({
      ...user,
      tempPassword
    });
  };

  // Réinitialisation du mot de passe temporaire par l'administrateur ou responsable technique
  const handleResetUserTempPassword = async (user: any) => {
    const tempMdp = generateTemporaryPassword(user.prenom || 'technicien');
    if (!confirm(`Confirmez-vous la réinitialisation du mot de passe temporaire pour ${user.prenom} ${user.nom} ?\n\nNouveau mot de passe temporaire : ${tempMdp}\n(L'utilisateur devra obligatoirement le changer à sa prochaine connexion)`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await db.users.resetTemporaryPassword(user._id || user.id);
      await fetchUsers();
      setCreatedCredentialsModal({
        ...user,
        tempPassword: res.tempPassword
      });
    } catch (e) {
      alert("Erreur lors de la réinitialisation du mot de passe temporaire.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSupabaseAlert(null);

    try {
      const tempPass = generateTemporaryPassword(formData.prenom || 'technicien');
      const chosenRole = formData.roles.length > 0 ? formData.roles[0] : formData.role;
      const chosenRoles = formData.roles.length > 0 ? formData.roles : formData.role ? [formData.role] : [];

      const userData = {
        ...formData,
        role: chosenRole,
        roles: chosenRoles,
        statut: formData.actif ? 'VALIDE' : 'EN_ATTENTE',
        motDePasseTemporaire: tempPass,
        doitChangerMotDePasse: true,
        creator: currentUser?.email || 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingUser) {
        try {
          await db.users.update(editingUser._id || editingUser.id, userData);
          resetForm();
          alert('Utilisateur modifié avec succès !');
        } catch (updateErr: any) {
          if (updateErr.supabaseError || updateErr.code === '42501') {
            resetForm();
            setSupabaseAlert({
              message: "L'utilisateur a été modifié en local, mais Supabase a bloqué la mise à jour (Sécurité RLS active). Cliquez sur 'Script SQL Supabase' ci-dessus pour débloquer l'accès.",
              isError: true
            });
          } else {
            throw updateErr;
          }
        }
      } else {
        try {
          const created = await db.users.create(userData);
          resetForm();
          setCreatedCredentialsModal({
            ...userData,
            id: created?.id || created?._id,
            tempPassword: tempPass
          });
        } catch (createErr: any) {
          // Si Supabase a levé une exception de sécurité RLS ou PGRST204
          if (createErr.supabaseError || createErr.code === '42501') {
            resetForm();
            setSupabaseAlert({
              message: "L'utilisateur a été enregistré en mémoire locale, mais Supabase a bloqué l'insertion (Sécurité RLS active). Cliquez sur 'Script SQL Supabase' ci-dessus pour débloquer l'enregistrement en ligne.",
              isError: true
            });
            // Ouvrir quand même la modale des identifiants avec les données locales
            setCreatedCredentialsModal({
              ...userData,
              id: createErr.localUser?.id || `usr_${Date.now()}`,
              tempPassword: tempPass
            });
          } else {
            throw createErr;
          }
        }
      }

      await fetchUsers();
    } catch (error: any) {
      console.error('Erreur handleSubmit:', error);
      alert(error?.message || "Erreur lors de l'enregistrement de l'utilisateur");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      telephone: user.telephone || '',
      numeroTechnicien: user.numeroTechnicien || '',
      role: user.role || 'TECHNICIEN_CMS',
      roles: user.roles || (user.role ? [user.role] : []),
      actif: user.actif !== false && user.statut !== 'EN_ATTENTE',
      permissions: user.permissions || []
    });

    const rolesParDefaut = roles.map((r) => r.value);
    const personnalises = (user.roles || []).filter((r: string) => !rolesParDefaut.includes(r));
    setRolesPersonnalises((prev) => [...new Set([...prev, ...personnalises])]);

    setShowSaisieRole(false);
    setSaisieRole('');
    setShowForm(true);
  };

  const handleDelete = async (userId: string, userEmail?: string) => {
    if (userEmail?.toLowerCase() === 'contact@appalacarte.fr') {
      alert("Le compte administrateur maître (contact@appalacarte.fr) ne peut pas être supprimé.");
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    setLoading(true);
    try {
      await db.users.delete(userId);
      await fetchUsers();
      alert('Utilisateur supprimé !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = async (userId: string, permissionId: string) => {
    try {
      const user = users.find((u) => u._id === userId || u.id === userId);
      if (!user) return;

      const currentPermissions = user.permissions || [];
      const hasPermission = currentPermissions.includes(permissionId);

      const updatedPermissions = hasPermission
        ? currentPermissions.filter((p: string) => p !== permissionId)
        : [...currentPermissions, permissionId];

      await db.users.update(userId, {
        permissions: updatedPermissions,
        updatedAt: new Date().toISOString()
      });

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === userId || u.id === userId
            ? { ...u, permissions: updatedPermissions }
            : u
        )
      );
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour des permissions');
    }
  };

  // Mise à jour rapide du rôle d'un technicien depuis le Logigramme
  const handleUpdateUserRole = async (userId: string, newRole: string, allRoles?: string[]) => {
    try {
      const rolesArray = allRoles && allRoles.length > 0 ? allRoles : (newRole ? [newRole] : []);
      await db.users.update(userId, {
        role: newRole,
        roles: rolesArray,
        updatedAt: new Date().toISOString()
      });

      // Synchronisation immédiate de l'état local
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if ((u._id || u.id) === userId) {
            return {
              ...u,
              role: newRole,
              roles: rolesArray
            };
          }
          return u;
        })
      );
    } catch (error: any) {
      console.error('Erreur mise à jour rôle technicien:', error);
      throw error;
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      numeroTechnicien: '',
      role: 'TECHNICIEN_CMS',
      roles: [],
      actif: true,
      permissions: []
    });
    setEditingUser(null);
    setShowForm(false);
  };

  const appOrigin = getAppBaseUrl();

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* En-tête avec titre et actions principales */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Gestion des Utilisateurs
            </h1>
            {isMasterAdmin && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Admin Maître
              </span>
            )}
          </div>
          <p className="text-gray-600 text-xs sm:text-sm mt-1">
            Validation des demandes de connexion, attribution des rôles et partage de liens d'accès
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bouton Script SQL de déblocage Supabase */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-1.5 border border-emerald-300 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 shadow-xs text-xs font-semibold"
            title="Afficher le script SQL de synchronisation et déblocage RLS Supabase"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Script SQL Supabase</span>
          </Button>

          {/* Bouton Partager / Générer un lien d'accès */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 border border-blue-300 text-blue-700 bg-blue-50/60 hover:bg-blue-100 shadow-sm text-xs font-semibold"
          >
            <Share2 className="w-4 h-4 text-blue-600" />
            <span>Donner un lien d'accès</span>
          </Button>

          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
              <Plus size={18} />
              <span>Ajouter un utilisateur</span>
            </Button>
          )}
        </div>
      </div>

      {/* Alerte si blocage Supabase (RLS ou colonnes) */}
      {supabaseAlert && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm">
                Synchronisation Supabase en ligne requise
              </p>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {supabaseAlert.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
            <Button
              size="sm"
              onClick={() => setShowSqlModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <FileCode2 size={14} />
              <span>Voir le script SQL</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSupabaseAlert(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Fermer
            </Button>
          </div>
        </div>
      )}

      {/* Bandeau d'alerte si des demandes sont en attente */}
      {pendingUsers.length > 0 && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm">
                {pendingUsers.length} demande{pendingUsers.length > 1 ? 's' : ''} de connexion en attente de validation
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Chaque nouvel utilisateur autorisé doit être validé par l'administrateur ou le responsable technique pour accéder à l'application.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setActiveTab('en_attente')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs whitespace-nowrap self-start sm:self-auto"
          >
            Voir les demandes ({pendingUsers.length})
          </Button>
        </div>
      )}

      {/* Barre d'onglets de filtrage */}
      {!showForm && (
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-200 pb-3">
          <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('tous')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'tous'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tous ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('en_attente')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'en_attente'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>En attente</span>
              {pendingUsers.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingUsers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('valides')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'valides'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Validés / Actifs ({activeUsers.length})
            </button>

            {canValidate && (
              <button
                onClick={() => setActiveTab('logigramme')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'logigramme'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-blue-700 hover:bg-blue-50 hover:text-blue-900'
                }`}
                title="Logigramme visuel et affectation des rôles par technicien"
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>Logigramme des Rôles</span>
              </button>
            )}
          </div>

          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher nom, email, n° technicien..."
            className="w-full sm:max-w-xs"
          />
        </div>
      )}

      {/* Formulaire de création / modification manuelle */}
      {showForm && (
        <Card className="border-blue-100 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">
                {editingUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
              </h2>
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                <X size={18} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom"
                value={formData.nom}
                onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))}
                required
              />
              <Input
                label="Prénom"
                value={formData.prenom}
                onChange={(e) => setFormData((prev) => ({ ...prev, prenom: e.target.value }))}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <Input
                label="Téléphone"
                value={formData.telephone}
                onChange={(e) => setFormData((prev) => ({ ...prev, telephone: e.target.value }))}
              />
              <Input
                label="N° Technicien (optionnel)"
                value={formData.numeroTechnicien}
                onChange={(e) => setFormData((prev) => ({ ...prev, numeroTechnicien: e.target.value }))}
                placeholder="Ex : 001, TECH002..."
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôles attribués</label>
                {formData.roles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {formData.roles.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200"
                      >
                        {[...roles, ...rolesPersonnalises.map((rp) => ({ value: rp, label: rp.replace(/_/g, ' ') }))].find((ro) => ro.value === r)?.label || r}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              roles: prev.roles.filter((ro) => ro !== r),
                              role: prev.roles.filter((ro) => ro !== r)[0] || ''
                            }))
                          }
                          className="text-blue-400 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {!showSaisieRole && (
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__nouveau__') {
                        setShowSaisieRole(true);
                      } else if (val && !formData.roles.includes(val)) {
                        setFormData((prev) => ({
                          ...prev,
                          roles: [...prev.roles, val],
                          role: prev.roles.length === 0 ? val : prev.role
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="">+ Ajouter un rôle...</option>
                    {roles
                      .filter((r) => !formData.roles.includes(r.value))
                      .map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    <option value="__nouveau__">✏️ Créer un nouveau rôle personnalisé...</option>
                  </select>
                )}

                {showSaisieRole && (
                  <div className="p-3 border border-blue-300 rounded-lg bg-blue-50 space-y-2 mt-2">
                    <p className="text-xs text-blue-700 font-semibold">
                      Nom du rôle personnalisé (appuyez sur Entrée) :
                    </p>
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={saisieRole}
                        onChange={(e) => setSaisieRole(e.target.value)}
                        placeholder="Ex : Électricien général..."
                        className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const texte = saisieRole.trim();
                            if (!texte) return;
                            const valeur = texte
                              .toUpperCase()
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '')
                              .replace(/\s+/g, '_');
                            if (valeur && !formData.roles.includes(valeur)) {
                              setRolesPersonnalises((prev) => [...new Set([...prev, valeur])]);
                              setFormData((prev) => ({
                                ...prev,
                                roles: [...prev.roles, valeur],
                                role: prev.roles.length === 0 ? valeur : prev.role
                              }));
                            }
                            setSaisieRole('');
                            setShowSaisieRole(false);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Encadré mot de passe temporaire automatique */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-lg flex-shrink-0 mt-0.5 shadow-sm">
                <KeyRound size={18} />
              </div>
              <div className="flex-1 text-xs text-blue-950 space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-bold text-sm text-blue-900 flex items-center gap-2">
                    <span>Mot de passe temporaire :</span>
                    <span className="font-mono bg-white px-2.5 py-0.5 rounded-md border border-blue-300 text-blue-700 font-extrabold text-sm tracking-wide shadow-xs">
                      {generateTemporaryPassword(formData.prenom || 'prenom')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generateTemporaryPassword(formData.prenom || 'prenom'), 'temp-pass-form')}
                    className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-white px-2 py-1 rounded border border-blue-200 hover:bg-blue-100/50 flex items-center gap-1 transition-colors"
                  >
                    {copiedKey === 'temp-pass-form' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    <span>{copiedKey === 'temp-pass-form' ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Règle automatique : <strong>prénom en minuscule suivi de 2027</strong>. Le technicien l'utilise pour sa 1ère connexion depuis son téléphone, sa tablette ou son PC. Le changement de mot de passe sera exigé immédiatement après sa connexion.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="actif"
                checked={formData.actif}
                onChange={(e) => setFormData((prev) => ({ ...prev, actif: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="actif" className="text-sm font-medium text-gray-700 cursor-pointer">
                Compte actif et validé
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Save size={18} />
                <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Contenu principal selon onglet : Logigramme vs Liste standard des utilisateurs */}
      {!showForm && (
        <>
          {activeTab === 'logigramme' ? (
            <RoleLogigramTab
              users={users}
              rolesPersonnalises={rolesPersonnalises}
              onUpdateUserRole={handleUpdateUserRole}
              onRefreshUsers={fetchUsers}
              canValidate={canValidate}
              currentUserEmail={currentUser?.email}
            />
          ) : (
            <>
              {loading ? (
                <Card className="text-center py-12">
                  <p className="text-gray-500 text-sm">Chargement des utilisateurs...</p>
                </Card>
              ) : filteredUsers.length === 0 ? (
                <Card className="text-center py-12 border-dashed">
                  <Users size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600 font-medium">
                    {searchQuery
                      ? 'Aucun utilisateur ne correspond à votre recherche'
                      : activeTab === 'en_attente'
                      ? 'Aucune demande en attente de validation'
                      : 'Aucun utilisateur enregistré'}
                  </p>
                  {activeTab === 'en_attente' && (
                    <p className="text-xs text-gray-400 mt-1">
                      Les nouvelles demandes formulées via le lien d'accès apparaîtront ici.
                    </p>
                  )}
                </Card>
              ) : (
                <div className="space-y-3">
              {filteredUsers.map((user) => {
                const isPending = user.statut === 'EN_ATTENTE' || (user.actif === false && user.statut !== 'REFUSE' && user.email !== 'contact@appalacarte.fr');
                const isMaster = user.email?.toLowerCase() === 'contact@appalacarte.fr';

                return (
                  <Card
                    key={user._id || user.id}
                    className={`p-4 transition-all ${
                      isPending
                        ? 'border-amber-300 bg-amber-50/30 shadow-sm'
                        : isMaster
                        ? 'border-blue-200 bg-blue-50/20 shadow-sm'
                        : 'hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Avatar et informations de profil */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white shadow-sm ${
                            isMaster
                              ? 'bg-blue-600'
                              : isPending
                              ? 'bg-amber-500'
                              : 'bg-indigo-600'
                          }`}
                        >
                          {user.prenom?.charAt(0)}
                          {user.nom?.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-sm truncate">
                              {user.prenom} {user.nom}
                            </h3>

                            {isMaster && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                                <ShieldCheck className="w-3 h-3 text-blue-600" />
                                Admin Maître
                              </span>
                            )}

                            {isPending ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Demande en attente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                Actif
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-gray-600">{user.email}</span>
                            {user.telephone && <span>• {user.telephone}</span>}
                            {user.dateDemande && isPending && (
                              <span className="text-amber-700 italic">
                                • Demandé le {new Date(user.dateDemande).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>

                          {/* Motif si présent */}
                          {user.motifDemande && (
                            <p className="text-xs text-gray-600 mt-1 italic bg-white/70 px-2 py-1 rounded border border-gray-100">
                              « {user.motifDemande} »
                            </p>
                          )}

                          {/* Badges rôles */}
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {(user.roles && user.roles.length > 0 ? user.roles : user.role ? [user.role] : []).map(
                              (r: string) => (
                                <span
                                  key={r}
                                  className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                                    isPending
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {roles.find((ro) => ro.value === r)?.label || r}
                                </span>
                              )
                            )}
                            {user.numeroTechnicien && (
                              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-medium">
                                N° {user.numeroTechnicien}
                              </span>
                            )}
                            {user.email !== 'contact@appalacarte.fr' && (user.doitChangerMotDePasse || user.motDePasseTemporaire) && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                                <KeyRound className="w-3 h-3 text-amber-600" />
                                <span>MDP temp : <strong className="font-mono">{user.motDePasseTemporaire || generateTemporaryPassword(user.prenom)}</strong></span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions contextuelles */}
                      <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                        {/* Bouton de validation rapide pour demande en attente */}
                        {isPending && canValidate && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenApproveModal(user)}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Valider l'accès</span>
                          </Button>
                        )}

                        {isPending && canValidate && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReject(user)}
                            className="text-red-600 hover:bg-red-50 text-xs flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Refuser</span>
                          </Button>
                        )}

                        {/* Copier le lien d'invitation personnalisé */}
                        {!isPending && (
                          <button
                            onClick={() => handleSendInvitation(user)}
                            disabled={!user.email}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Copier le message et le lien de connexion directe"
                          >
                            {copiedKey === `invite-${user._id || user.id}` ? (
                              <Check size={18} className="text-green-600" />
                            ) : (
                              <Share2 size={18} />
                            )}
                          </button>
                        )}

                        {/* Réinitialiser le mot de passe temporaire et transmettre */}
                        {!isPending && user.email !== 'contact@appalacarte.fr' && canValidate && (
                          <button
                            onClick={() => handleResetUserTempPassword(user)}
                            className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Réinitialiser le mot de passe temporaire (prénom2027) et transmettre les accès"
                          >
                            <RefreshCw size={18} />
                          </button>
                        )}

                        {/* Édition */}
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </button>

                        {/* Suppression protégée */}
                        {!isMaster && (
                          <button
                            onClick={() => handleDelete(user._id || user.id, user.email)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Permissions détaillées (accordéon) */}
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <button
                        onClick={() =>
                          setExpandedUserId(
                            expandedUserId === (user._id || user.id) ? null : user._id || user.id
                          )
                        }
                        className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <span className="font-medium">
                          {(user.permissions || []).length} permission(s) configurée(s)
                        </span>
                        {expandedUserId === (user._id || user.id) ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>

                      {expandedUserId === (user._id || user.id) && (
                        <div className="mt-2.5 p-3 bg-gray-50 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {PERMISSIONS.map((permission) => {
                            const hasPermission = (user.permissions || []).includes(permission.id);
                            return (
                              <label
                                key={permission.id}
                                className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white p-1 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={hasPermission}
                                  onChange={() =>
                                    handlePermissionToggle(user._id || user.id, permission.id)
                                  }
                                  className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">{permission.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
            </>
          )}
        </>
      )}

      {/* ================= MODALE DE VALIDATION DE DEMANDE ================= */}
      {approvingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-green-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  Valider l'accès de l'utilisateur
                </h3>
              </div>
              <button
                onClick={() => setApprovingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-700">
              <p>
                <strong>Demandeur :</strong> {approvingUser.prenom} {approvingUser.nom}
              </p>
              <p>
                <strong>Email :</strong> {approvingUser.email}
              </p>
              {approvingUser.telephone && (
                <p>
                  <strong>Téléphone :</strong> {approvingUser.telephone}
                </p>
              )}
              {approvingUser.motifDemande && (
                <p>
                  <strong>Motif :</strong> {approvingUser.motifDemande}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Rôle attribué à la validation *
              </label>
              <select
                value={approvalRole}
                onChange={(e) => setApprovalRole(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-300 py-2 px-3 bg-white text-gray-800 focus:ring-2 focus:ring-green-500"
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Numéro de technicien (optionnel)
              </label>
              <Input
                value={approvalNumeroTechnicien}
                onChange={(e) => setApprovalNumeroTechnicien(e.target.value)}
                placeholder="Ex : 002, TECH003..."
                className="text-sm"
              />
            </div>

            <div className="pt-3 border-t border-gray-100 flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setApprovingUser(null)}
                className="text-xs"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleConfirmApproval}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>{loading ? 'Validation...' : 'Confirmer et activer'}</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ================= MODALE GÉNÉRATION & PARTAGE DE LIENS D'ACCÈS ================= */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-blue-200 bg-white p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  Donner un lien d'accès à l'application
                </h3>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Onglets de la modale */}
            <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setLinkModalTab('public')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  linkModalTab === 'public'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lien général
              </button>
              <button
                onClick={() => setLinkModalTab('custom')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  linkModalTab === 'custom'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lien pré-rempli
              </button>
              <button
                onClick={() => setLinkModalTab('direct')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  linkModalTab === 'direct'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lien direct validé
              </button>
            </div>

            {/* Onglet 1 : Lien général public de demande d'accès */}
            {linkModalTab === 'public' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Partagez ce lien à vos collaborateurs ou techniciens. Ils pourront faire leur demande unique de connexion avec leur adresse email. Elle vous sera ensuite soumise pour validation.
                </p>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Lien officiel de demande d'accès
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={`${appOrigin}/?action=demande`}
                      className="flex-1 bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono text-gray-800 select-all"
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        copyToClipboard(`${appOrigin}/?action=demande`, 'link-public')
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-xs flex items-center gap-1"
                    >
                      {copiedKey === 'link-public' ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKey === 'link-public' ? 'Copié !' : 'Copier'}</span>
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">
                      Message type prêt à envoyer :
                    </span>
                    <button
                      onClick={() => {
                        const msg = `Bonjour,\n\nPour vous connecter à l'application Maintenance & Dépannage, veuillez formuler votre demande d'accès officielle via ce lien :\n${appOrigin}/?action=demande\n\nVotre compte sera validé par l'administrateur (contact@appalacarte.fr) ou le responsable technique.\n\nCordialement,\nÉquipe Technique`;
                        copyToClipboard(msg, 'msg-public');
                      }}
                      className="text-xs text-blue-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      {copiedKey === 'msg-public' ? (
                        <Check size={12} className="text-green-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>Copier le message</span>
                    </button>
                  </div>
                  <pre className="text-[11px] text-gray-700 bg-white p-2.5 rounded border border-blue-100 whitespace-pre-wrap font-sans">
{`Bonjour,

Pour vous connecter à l'application Maintenance & Dépannage, veuillez formuler votre demande d'accès officielle via ce lien :
${appOrigin}/?action=demande

Votre compte sera validé par l'administrateur (contact@appalacarte.fr) ou le responsable technique.

Cordialement,
Équipe Technique`}
                  </pre>
                </div>
              </div>
            )}

            {/* Onglet 2 : Lien pré-rempli pour un utilisateur particulier */}
            {linkModalTab === 'custom' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-600">
                  Générez un lien où le nom et l'email sont déjà complétés pour faciliter la saisie du collaborateur.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Prénom"
                    value={customInvitePrenom}
                    onChange={(e) => setCustomInvitePrenom(e.target.value)}
                    placeholder="Jean"
                  />
                  <Input
                    label="Nom"
                    value={customInviteNom}
                    onChange={(e) => setCustomInviteNom(e.target.value)}
                    placeholder="DUPONT"
                  />
                </div>

                <Input
                  label="Email professionnel"
                  type="email"
                  value={customInviteEmail}
                  onChange={(e) => setCustomInviteEmail(e.target.value)}
                  placeholder="jean.dupont@entreprise.fr"
                />

                {customInviteEmail && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Lien pré-rempli généré
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={`${appOrigin}/?action=demande&email=${encodeURIComponent(
                          customInviteEmail.trim()
                        )}&nom=${encodeURIComponent(customInviteNom.trim())}&prenom=${encodeURIComponent(
                          customInvitePrenom.trim()
                        )}`}
                        className="flex-1 bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono text-gray-800 select-all"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const url = `${appOrigin}/?action=demande&email=${encodeURIComponent(
                            customInviteEmail.trim()
                          )}&nom=${encodeURIComponent(
                            customInviteNom.trim()
                          )}&prenom=${encodeURIComponent(customInvitePrenom.trim())}`;
                          copyToClipboard(url, 'link-custom');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-xs flex items-center gap-1"
                      >
                        {copiedKey === 'link-custom' ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedKey === 'link-custom' ? 'Copié !' : 'Copier'}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Onglet 3 : Lien direct de connexion pour utilisateur déjà validé */}
            {linkModalTab === 'direct' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-600">
                  Sélectionnez un utilisateur déjà validé pour lui fournir son lien de connexion direct pré-rempli.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Choisir l'utilisateur validé
                  </label>
                  <select
                    value={selectedDirectUserEmail}
                    onChange={(e) => setSelectedDirectUserEmail(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-lg border border-gray-300 py-2 px-2.5 bg-white text-gray-800"
                  >
                    <option value="">-- Sélectionnez un utilisateur --</option>
                    {activeUsers.map((u) => (
                      <option key={u._id || u.id} value={u.email}>
                        {u.prenom} {u.nom} ({u.email}) — {roles.find((r) => r.value === u.role)?.label || u.role}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDirectUserEmail && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Lien direct de connexion
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={`${appOrigin}/?action=login&email=${encodeURIComponent(
                          selectedDirectUserEmail
                        )}`}
                        className="flex-1 bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono text-gray-800 select-all"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const url = `${appOrigin}/?action=login&email=${encodeURIComponent(
                            selectedDirectUserEmail
                          )}`;
                          copyToClipboard(url, 'link-direct');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-xs flex items-center gap-1"
                      >
                        {copiedKey === 'link-direct' ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedKey === 'link-direct' ? 'Copié !' : 'Copier'}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowLinkModal(false)}
                className="text-xs"
              >
                Fermer
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ================= MODALE TRANSMISSION IDENTIFIANTS TECHNICIEN ================= */}
      {createdCredentialsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-blue-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Identifiants d'accès du technicien
                  </h3>
                  <p className="text-xs text-gray-500">
                    Compte prêt pour smartphone, tablette ou ordinateur
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreatedCredentialsModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Récapitulatif visuel */}
            <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-200 rounded-xl space-y-2.5 text-xs text-slate-800">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-blue-100">
                <div>
                  <span className="text-gray-500 block text-[11px]">Technicien / Utilisateur :</span>
                  <strong className="text-sm text-gray-900">{createdCredentialsModal.prenom} {createdCredentialsModal.nom}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Rôle attribué :</span>
                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded text-[11px]">
                    {roles.find(r => r.value === createdCredentialsModal.role)?.label || createdCredentialsModal.role}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-100">
                  <span className="text-gray-600">Email (identifiant) :</span>
                  <span className="font-mono font-semibold text-gray-900">{createdCredentialsModal.email}</span>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-200 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-900 font-semibold">Mot de passe temporaire :</span>
                  </div>
                  <span className="font-mono font-bold text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    {createdCredentialsModal.tempPassword || generateTemporaryPassword(createdCredentialsModal.prenom)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-blue-900/80 italic pt-1">
                ℹ️ Dès la 1ère connexion avec ce mot de passe temporaire, l'application demandera immédiatement au technicien de saisir son mot de passe personnel définitif.
              </p>
            </div>

            {/* Message type à copier ou envoyer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">Message complet prêt à envoyer :</label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(formatInvitationMessage(createdCredentialsModal), 'creds-msg')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  {copiedKey === 'creds-msg' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  <span>{copiedKey === 'creds-msg' ? 'Message copié !' : 'Copier le message'}</span>
                </button>
              </div>

              <pre className="text-[11px] text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap font-sans max-h-36 overflow-y-auto leading-relaxed">
                {formatInvitationMessage(createdCredentialsModal)}
              </pre>
            </div>

            {/* Compte d'envoi automatique configuré */}
            <div className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900">
              <span className="flex items-center gap-1.5 font-medium">
                <Mail size={14} className="text-blue-600" />
                <span>Compte d'envoi automatique :</span>
              </span>
              <strong className="font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                {getPasswordRequestEmail()}
              </strong>
            </div>

            {/* Boutons d'actions */}
            <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
              {/* Envoi direct via Gmail avec le compte automatique soplanapp1@gmail.com */}
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(createdCredentialsModal.email)}&su=${encodeURIComponent(`Vos accès à l'application ${APP_NAME}`)}&body=${encodeURIComponent(formatInvitationMessage(createdCredentialsModal))}&authuser=${encodeURIComponent(getPasswordRequestEmail())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                title={`Envoyer automatiquement depuis ${getPasswordRequestEmail()}`}
              >
                <Mail size={15} />
                <span>Envoyer via Gmail ({getPasswordRequestEmail()})</span>
              </a>

              {/* Option alternative mailto */}
              <a
                href={`mailto:${encodeURIComponent(createdCredentialsModal.email)}?subject=${encodeURIComponent(`Vos accès à l'application ${APP_NAME}`)}&body=${encodeURIComponent(formatInvitationMessage(createdCredentialsModal))}`}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                title="Ouvrir dans votre client de messagerie par défaut"
              >
                <span>Autre messagerie</span>
              </a>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const appUrl = getAppBaseUrl();
                  const link = `${appUrl}/login?email=${encodeURIComponent(createdCredentialsModal.email)}&action=login`;
                  copyToClipboard(link, 'creds-link');
                }}
                className="text-xs flex items-center justify-center gap-1.5"
              >
                {copiedKey === 'creds-link' ? <Check size={14} className="text-green-600" /> : <Link size={14} />}
                <span>{copiedKey === 'creds-link' ? 'Lien copié !' : 'Copier lien d\'accès'}</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreatedCredentialsModal(null)}
                className="text-xs"
              >
                Fermer
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modale d'aide et script SQL Supabase pour débloquer l'enregistrement */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <Card className="w-full max-w-2xl bg-white shadow-2xl border-blue-100 max-h-[90vh] flex flex-col p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Déblocage Supabase — Script SQL à exécuter
                  </h3>
                  <p className="text-xs text-gray-500">
                    Ajoute les colonnes manquantes et débloque les politiques RLS pour autoriser l'enregistrement
                  </p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowSqlModal(false)}>
                <X size={18} />
              </Button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <p className="font-bold text-blue-900 text-xs">
                  👉 Instructions pas-à-pas (moins d'1 minute) :
                </p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800 leading-relaxed pl-1">
                  <li>
                    Ouvrez votre console Supabase :{' '}
                    <a
                      href="https://supabase.com/dashboard/project/syrznjjxyvbbkahaavdf/sql/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold underline text-blue-700 hover:text-blue-900"
                    >
                      <span>Supabase SQL Editor</span>
                      <ExternalLink size={12} />
                    </a>
                  </li>
                  <li>Cliquez sur le bouton ci-dessous <strong>« Copier le script SQL »</strong>.</li>
                  <li>Collez le texte dans l'éditeur SQL de Supabase et cliquez sur <strong>« Run »</strong> (Ctrl + Entrée).</li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Contenu du script SQL :</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(SUPABASE_REPAIR_SQL, 'repair-sql')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                  >
                    {copiedKey === 'repair-sql' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedKey === 'repair-sql' ? 'Script copié !' : 'Copier le script SQL'}</span>
                  </button>
                </div>

                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-60 border border-slate-800 whitespace-pre leading-relaxed select-all">
                  {SUPABASE_REPAIR_SQL}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Fichier source : <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">supabase_correction_complete_utilisateurs_et_rls.sql</code>
              </span>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowSqlModal(false)}>
                Fermer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
