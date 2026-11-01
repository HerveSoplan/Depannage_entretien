//UsersScreen.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import {Plus, Users, Edit, Trash2, Save, X, Shield, Mail, ChevronDown, ChevronUp} from 'lucide-react';
import { db } from '../../lib/supabase';


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
      const result = await db.utilisateurs.list({ limit: 100 });
      setUsers(result.list || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };


  const filteredUsers = users.filter(user => 
    user.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.numeroTechnicien?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleSendInvitation = async (user: any) => {
    if (!user.email) {
      alert('Cet utilisateur n\'a pas d\'adresse email !');
      return;
    }

    const appUrl = window.location.origin;
    const invitationLink = `${appUrl}/login?email=${encodeURIComponent(user.email)}`;
    
    const invitationMessage = `
Bonjour ${user.prenom} ${user.nom},

Vous avez été invité(e) à rejoindre l'application de dépannage et maintenance Maintenance & Dépannage en tant que ${roles.find(r => r.value === user.role)?.label || user.role}.

Lien pour se connecter à l'application de dépannage Maintenance & Dépannage :
${invitationLink}

Copiez et collez ce lien dans votre navigateur pour vous connecter.

---
Maintenance & Dépannage - Application de maintenance industrielle
© ${new Date().getFullYear()} - Tous droits réservés
    `.trim();

    try {
      await navigator.clipboard.writeText(invitationMessage);
      alert(`✅ Invitation copiée dans le presse-papiers !\n\nVous pouvez maintenant l'envoyer à ${user.prenom} ${user.nom} (${user.email}) par email.`);
    } catch (error) {
      alert(`📋 Copiez ce message d'invitation pour ${user.prenom} ${user.nom} :\n\n${invitationMessage}`);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = {
        ...formData,
        role: formData.roles.length > 0 ? formData.roles[0] : formData.role,
        roles: formData.roles.length > 0 ? formData.roles : (formData.role ? [formData.role] : []),
        creator: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('💾 Sauvegarde utilisateur — role:', userData.role, '| roles:', userData.roles);

      if (editingUser) {
        await db.utilisateurs.update(editingUser._id, userData);
      } else {
        await db.utilisateurs.create(userData);
      }

      await fetchUsers();
      resetForm();
      alert(editingUser ? 'Utilisateur modifié !' : 'Utilisateur créé !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
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
      actif: user.actif !== false,
      permissions: user.permissions || []
    });

    // On récupère les rôles personnalisés déjà sauvegardés
    const rolesParDefaut = roles.map(r => r.value);
    const personnalises = (user.roles || []).filter((r: string) => !rolesParDefaut.includes(r));
    setRolesPersonnalises(prev => {
      const tous = [...prev, ...personnalises];
      return [...new Set(tous)];
    });

    setShowSaisieRole(false);
    setSaisieRole('');
    setShowForm(true);
  };


  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    setLoading(true);
    try {
      await db.utilisateurs.delete(userId);
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
      const user = users.find(u => u._id === userId);
      if (!user) return;

      const currentPermissions = user.permissions || [];
      const hasPermission = currentPermissions.includes(permissionId);
      
      const updatedPermissions = hasPermission
        ? currentPermissions.filter((p: string) => p !== permissionId)
        : [...currentPermissions, permissionId];

      await db.utilisateurs.update(userId, {
        permissions: updatedPermissions,
        updatedAt: new Date().toISOString()
      });

      setUsers(prevUsers => 
        prevUsers.map(u => 
          u._id === userId 
            ? { ...u, permissions: updatedPermissions }
            : u
        )
      );
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour des permissions');
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


  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-600 mt-1">Gérez les utilisateurs et leurs rôles</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus size={20} />
            Nouvel utilisateur
          </Button>
        )}
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                <X size={20} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                required
              />
              <Input
                label="Prénom"
                value={formData.prenom}
                onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <Input
                label="Téléphone"
                value={formData.telephone}
                onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
              />
              <Input
                label="N° Technicien"
                value={formData.numeroTechnicien}
                onChange={(e) => setFormData(prev => ({ ...prev, numeroTechnicien: e.target.value }))}
                placeholder="Ex: TECH001"
              />
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôles</label>

                {/* Badges des rôles déjà ajoutés */}
                {formData.roles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {formData.roles.map((r) => (
                      <span key={r} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        {[...roles, ...rolesPersonnalises.map(rp => ({ value: rp, label: rp.replace(/_/g, ' ') }))].find(ro => ro.value === r)?.label || r}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            roles: prev.roles.filter(ro => ro !== r),
                            role: prev.roles.filter(ro => ro !== r)[0] || ''
                          }))}
                          className="text-blue-400 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Select pour ajouter un rôle existant ou personnalisé */}
                {!showSaisieRole && (
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__nouveau__') {
                        setShowSaisieRole(true);
                      } else if (val && !formData.roles.includes(val)) {
                        setFormData(prev => ({
                          ...prev,
                          roles: [...prev.roles, val],
                          role: prev.roles.length === 0 ? val : prev.role
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">+ Ajouter un rôle...</option>
                    {/* Rôles par défaut non encore ajoutés */}
                    {roles
                      .filter(r => !formData.roles.includes(r.value))
                      .map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))
                    }
                    {/* Rôles personnalisés déjà créés non encore ajoutés */}
                    {rolesPersonnalises
                      .filter(r => !formData.roles.includes(r) && !roles.find(ro => ro.value === r))
                      .map(r => (
                        <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                      ))
                    }
                    <option value="__nouveau__">✏️ Créer un nouveau rôle...</option>
                  </select>
                )}

                {/* Champ saisie nouveau rôle — reste ouvert jusqu'à fermeture manuelle */}
                {showSaisieRole && (
                  <div className="p-3 border border-blue-300 rounded-lg bg-blue-50 space-y-2">
                    <p className="text-xs text-blue-700 font-semibold">Tapez un nom et appuyez Entrée. Vous pouvez en créer plusieurs avant de fermer.</p>
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={saisieRole}
                        onChange={(e) => setSaisieRole(e.target.value)}
                        placeholder="Ex: Électricien général..."
                        className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const texte = saisieRole.trim();
                            console.log('⌨️ Enter pressé, texte:', texte);
                            if (!texte) return;

                            const valeur = texte
                              .toUpperCase()
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '')
                              .replace(/\s+/g, '_');

                            console.log('📝 valeur transformée:', valeur);
                            console.log('📝 roles actuels:', formData.roles);

                            if (valeur && !formData.roles.includes(valeur)) {
                              setRolesPersonnalises(prev => [...new Set([...prev, valeur])]);
                              setFormData(prev => ({
                                ...prev,
                                roles: [...prev.roles, valeur],
                                role: prev.roles.length === 0 ? valeur : prev.role
                              }));
                              console.log('✅ Rôle ajouté:', valeur);
                            }
                            setSaisieRole('');
                          }
                        }}
                      />
                    </div>
                    {/* Bouton Ajouter — alternative à Entrée */}
                    <button
                      type="button"
                      onClick={() => {
                        const texte = saisieRole.trim();
                        if (!texte) return;
                        const valeur = texte
                          .toUpperCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/\s+/g, '_');
                        if (valeur && !formData.roles.includes(valeur)) {
                          setRolesPersonnalises(prev => [...new Set([...prev, valeur])]);
                          setFormData(prev => ({
                            ...prev,
                            roles: [...prev.roles, valeur],
                            role: prev.roles.length === 0 ? valeur : prev.role
                          }));
                        }
                        setSaisieRole('');
                      }}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-semibold"
                    >
                      + Ajouter ce rôle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSaisieRole(false);
                        setSaisieRole('');
                      }}
                      className="w-full text-xs text-blue-600 hover:text-blue-800 py-1 border border-blue-200 rounded bg-white"
                    >
                      ✓ Fermer la saisie
                    </button>
                  </div>
                )}

                {formData.roles.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">⚠️ Au moins un rôle est requis</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="actif"
                checked={formData.actif}
                onChange={(e) => setFormData(prev => ({ ...prev, actif: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="actif" className="text-sm font-medium text-gray-700">
                Compte actif
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Save size={20} />
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Recherche */}
      {!showForm && (
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher un utilisateur..."
          className="max-w-md"
        />
      )}

      {/* Liste des utilisateurs */}
      {!showForm && (
        <>
          {loading ? (
            <Card className="text-center py-12">
              <p className="text-gray-500">Chargement...</p>
            </Card>
          ) : filteredUsers.length === 0 ? (
            <Card className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur enregistré'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <Card key={user._id} className="p-3">
                  {/* ✅ AMÉLIORATION : Nom + Email + Badges + Actions sur une ligne */}
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
                      </span>
                    </div>

                    {/* Infos principale */}
                    <div className="flex-1 min-w-0">
                      {/* ✅ Nom complet (UNE SEULE FOIS) */}
                      <h3 className="font-bold text-gray-900 text-sm truncate">
                        {user.prenom} {user.nom}
                      </h3>
                      
                      {/* ✅ Email plus visible */}
                      <button
  onClick={() => handleSendInvitation(user)}
  disabled={!user.email}
  className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate text-left disabled:text-gray-400 disabled:cursor-not-allowed"
  title={user.email ? "Cliquer pour envoyer l'invitation" : "Pas d'email"}
>
  {user.email || 'Pas d\'email'}
</button>
                      
                      {/* ✅ Badges : Rôle + N° Technicien côte à côte */}
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {(user.roles && user.roles.length > 0 ? user.roles : (user.role ? [user.role] : [])).map((r: string) => (
                          <span key={r} className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                            {roles.find(ro => ro.value === r)?.label || r}
                          </span>
                        ))}
                        {user.numeroTechnicien && (
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                            {user.numeroTechnicien}
                          </span>
                        )}
                      </div>
                    </div>

               {/* ✅ Actions compactes à droite */}
<div className="flex gap-2">
  <button
    onClick={() => handleEdit(user)}
    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
    title="Modifier"
  >
    <Edit size={18} />
  </button>
  <button
    onClick={() => handleDelete(user._id)}
    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
    title="Supprimer"
  >
    <Trash2 size={18} />
  </button>
</div>


                  </div>

                  {/* ✅ Bouton permissions (accordéon) */}
                  <button
                    onClick={() => setExpandedUserId(expandedUserId === user._id ? null : user._id)}
                    className="w-full flex items-center justify-between px-2 py-1.5 mt-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                  >
                    <span className="font-medium text-gray-700">
                      {(user.permissions || []).length} permission(s) active(s)
                    </span>
                    {expandedUserId === user._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {/* ✅ Permissions (accordéon) */}
                  {expandedUserId === user._id && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg space-y-1.5">
                      {PERMISSIONS.map((permission) => {
                        const hasPermission = (user.permissions || []).includes(permission.id);
                        return (
                          <label
                            key={permission.id}
                            className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white p-1.5 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={hasPermission}
                              onChange={() => handlePermissionToggle(user._id, permission.id)}
                              className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">{permission.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
