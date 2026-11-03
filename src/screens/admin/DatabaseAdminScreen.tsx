import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { TextArea } from '../../components/common/TextArea';
import { DataTable } from '../../components/admin/DataTable';
import { CSVImporter } from '../../components/admin/CSVImporter';
import { MaintenanceKitImporter } from '../../components/admin/MaintenanceKitImporter';
import { Database, Upload, Plus, X, Save, BarChart3, Wifi, AlertTriangle, CheckCircle2, Mail, KeyRound } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useUsers } from '../../hooks/useUsers';
import { useMachines } from '../../hooks/useMachines';
import { useSpareParts } from '../../hooks/useSpareParts';
import { useMaintenanceKits } from '../../hooks/useMaintenanceKits';
import { useErrorCodes } from '../../hooks/useErrorCodes';
import { useTachesEntretien } from '../../hooks/useTachesEntretien';
import { useMachineFields } from '../../hooks/useMachineFields';
import { useMachineFieldOptions } from '../../hooks/useMachineFieldOptions';
import {
  db,
  checkSupabaseConnection,
  isLiveSupabaseActive,
  getPasswordRequestEmail,
  setPasswordRequestEmail,
  DEFAULT_PASSWORD_REQUEST_EMAIL
} from '../../lib/supabase';
import { SUPABASE_REPAIR_SQL } from '../../lib/sql/repairScript';


interface DatabaseAdminScreenProps {
  onNavigate?: (screen: string, params?: any) => void;
}


// Ajout de 'languages' et 'translations' qui étaient utilisés mais non typés
type TableType = 'clients' | 'users' | 'maintenance_kits' | 'spare_parts' | 'error_codes' | 'taches_entretien' | 'machine_fields' | 'machine_field_options' | 'languages' | 'translations';


export function DatabaseAdminScreen({ onNavigate }: DatabaseAdminScreenProps) {
  const [activeTable, setActiveTable] = useState<TableType>('clients');
  const [showImporter, setShowImporter] = useState(false);
  const [showKitImporter, setShowKitImporter] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [supabaseHealth, setSupabaseHealth] = useState<{ connected: boolean; error?: string; url: string } | null>(null);
  const [passwordRequestEmail, setPasswordRequestEmailState] = useState<string>(() => getPasswordRequestEmail());
  const [emailSaveSuccess, setEmailSaveSuccess] = useState(false);

  const handleSavePasswordRequestEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const saved = setPasswordRequestEmail(passwordRequestEmail);
    setPasswordRequestEmailState(saved);
    setEmailSaveSuccess(true);
    setTimeout(() => setEmailSaveSuccess(false), 3000);
  };

  const handleResetPasswordRequestEmail = () => {
    const reset = setPasswordRequestEmail(DEFAULT_PASSWORD_REQUEST_EMAIL);
    setPasswordRequestEmailState(reset);
    setEmailSaveSuccess(true);
    setTimeout(() => setEmailSaveSuccess(false), 3000);
  };


  const { machines, fetchMachines } = useMachines();
  const { clients, fetchClients, deleteClient } = useClients();
  const { users, fetchUsers, deleteUser } = useUsers();
  const { spareParts, fetchSpareParts, deleteSparePart } = useSpareParts();
  const { maintenanceKits, fetchMaintenanceKits, deleteMaintenanceKit } = useMaintenanceKits();
  const { errorCodes, fetchErrorCodes, deleteErrorCode } = useErrorCodes();
  const { tachesEntretien, fetchTachesEntretien, deleteTacheEntretien } = useTachesEntretien();
  const { machineFields, fetchMachineFields, deleteMachineField } = useMachineFields();
  const { machineFieldOptions, fetchMachineFieldOptions, deleteMachineFieldOption } = useMachineFieldOptions();


  useEffect(() => {
    checkSupabaseConnection().then(setSupabaseHealth);
    fetchClients();
    fetchUsers();
    fetchSpareParts();
    fetchMaintenanceKits();
    fetchErrorCodes();
    fetchTachesEntretien();
    fetchMachines();
    fetchMachineFields();
    fetchMachineFieldOptions();
  }, [
    fetchClients, fetchUsers, fetchSpareParts, fetchMaintenanceKits,
    fetchErrorCodes, fetchTachesEntretien, fetchMachines,
    fetchMachineFields, fetchMachineFieldOptions
  ]);


  // ✅ NOUVEAU : Formulaires d'ajout selon la table
  const getAddForm = () => {
    switch (activeTable) {
      case 'clients':
        return (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Ajouter un client</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="N° Client"
                value={formData.numeroClient || ''}
                onChange={(e) => setFormData({ ...formData, numeroClient: e.target.value })}
                required
              />
              <Input
                label="Nom"
                value={formData.nom || ''}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
              <Input
                label="Nom de ferme"
                value={formData.nomFerme || ''}
                onChange={(e) => setFormData({ ...formData, nomFerme: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Téléphone"
                value={formData.telephone || ''}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
              <Input
                label="Ville"
                value={formData.ville || ''}
                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>Annuler</Button>
              <Button onClick={handleAdd} disabled={loading}>
                <Save size={18} className="mr-2" />
                Enregistrer
              </Button>
            </div>
          </Card>
        );

      case 'maintenance_kits':
        return (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Ajouter un kit d'entretien</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Type de machine"
                value={formData.machineType || ''}
                onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
                required
                placeholder="Ex: V 300, AMS, VMS2014"
              />
              <Input
                label="N° Kit"
                value={formData.kitNumber || ''}
                onChange={(e) => setFormData({ ...formData, kitNumber: e.target.value })}
                required
                placeholder="Ex: 2150025306"
              />
              <Input
                label="Numéro de service"
                type="number"
                value={formData.serviceNumber ?? 1}
                onChange={(e) => setFormData({ ...formData, serviceNumber: parseInt(e.target.value) || 1 })}
                required
                placeholder="Ex: 1"
              />
              <Input
                label="Nom du kit"
                value={formData.nom || ''}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Kit Entretien V300 (généré auto si vide)"
              />
            </div>
            <div className="mt-4">
              <TextArea
                label="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Description optionnelle du kit..."
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>Annuler</Button>
              <Button onClick={handleAdd} disabled={loading}>
                <Save size={18} className="mr-2" />
                Enregistrer
              </Button>
            </div>
          </Card>
        );

      case 'spare_parts':
        return (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Ajouter une pièce détachée</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Référence"
                value={formData.reference || ''}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                required
              />
              <Input
                label="Désignation"
                value={formData.designation || ''}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                required
              />
              <Input
                label="Stock"
                type="number"
                value={formData.stock || 0}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Seuil d'alerte"
                type="number"
                value={formData.seuilAlerte || 5}
                onChange={(e) => setFormData({ ...formData, seuilAlerte: parseInt(e.target.value) || 5 })}
              />
              <Input
                label="Prix unitaire"
                type="number"
                step="0.01"
                value={formData.prixUnitaire || 0}
                onChange={(e) => setFormData({ ...formData, prixUnitaire: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>Annuler</Button>
              <Button onClick={handleAdd} disabled={loading}>
                <Save size={18} className="mr-2" />
                Enregistrer
              </Button>
            </div>
          </Card>
        );

      case 'error_codes':
        return (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Ajouter un code erreur</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Alarme"
                value={formData.alarme || ''}
                onChange={(e) => setFormData({ ...formData, alarme: e.target.value })}
                required
                placeholder="Ex: 8.16.7.25"
              />
              <Input
                label="Type d'alarme"
                value={formData.typeAlarme || ''}
                onChange={(e) => setFormData({ ...formData, typeAlarme: e.target.value })}
              />
              <Input
                label="Chapitre"
                value={formData.chapitre || ''}
                onChange={(e) => setFormData({ ...formData, chapitre: e.target.value })}
              />
              <Input
                label="Titre"
                value={formData.titre || ''}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              />
            </div>
            <div className="mt-4">
              <TextArea
                label="Cause"
                value={formData.cause || ''}
                onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                rows={3}
              />
            </div>
            <div className="mt-4">
              <TextArea
                label="Action"
                value={formData.action || ''}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>Annuler</Button>
              <Button onClick={handleAdd} disabled={loading}>
                <Save size={18} className="mr-2" />
                Enregistrer
              </Button>
            </div>
          </Card>
        );

      case 'taches_entretien':
        return (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Ajouter une tâche d'entretien</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Kit ID"
                value={formData.kitId || ''}
                onChange={(e) => setFormData({ ...formData, kitId: e.target.value })}
                required
                placeholder="Ex: kit_v300_2150025306_1"
              />
              <Input
                label="Type de machine"
                value={formData.machineType || ''}
                onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
                placeholder="Ex: V 300"
              />
              <Input
                label="ID Tâche"
                value={formData.idTache || ''}
                onChange={(e) => setFormData({ ...formData, idTache: e.target.value })}
                required
                placeholder="Ex: DET_01"
              />
              <Input
                label="Section"
                value={formData.section || ''}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                required
                placeholder="Ex: Station de détection"
              />
              <Input
                label="Ordre d'exécution"
                type="number"
                value={formData.ordre ?? 1}
                onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
            <div className="mt-4">
              <TextArea
                label="Description / Instructions de la tâche"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
                placeholder="Ex: Vérifier le bon état du capteur de détection et nettoyer la lentille..."
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>Annuler</Button>
              <Button onClick={handleAdd} disabled={loading}>
                <Save size={18} className="mr-2" />
                Enregistrer
              </Button>
            </div>
          </Card>
        );

      case 'machine_fields':
        return (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Ajouter un champ machine</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de machine <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="admin-machine-types-datalist"
                  value={formData.machineType || ''}
                  onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
                  required
                  placeholder="Ex: Pompe à vide, V 300, VMS 2014, Tous..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="admin-machine-types-datalist">
                  <option value="Tous" />
                  <option value="Pompe à vide" />
                  <option value="V 300" />
                  <option value="VMS 2014" />
                  <option value="Adoucisseur" />
                  <option value="Chauffe-eau" />
                  {Array.from(new Set(machineFields.map((f: any) => f.machineType || f.machine_type).filter(Boolean))).map((t: any) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <Input
                label="Libellé du champ"
                value={formData.label || ''}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                required
              />
              <Select
                label="Type de champ"
                value={formData.fieldType || 'text'}
                onChange={(e: any) => setFormData({ ...formData, fieldType: e.target.value })}
                options={[
                  { value: 'select', label: 'Menu déroulant' },
                  { value: 'text', label: 'Texte libre' },
                  { value: 'number', label: 'Nombre' },
                  { value: 'date', label: 'Date' },
                  { value: 'checkbox', label: 'Case à cocher' },
                  { value: 'tag', label: 'Étiquette' }
                ]}
                required
              />
              <Input
                label="Ordre"
                type="number"
                value={formData.order || 0}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isRequired || false}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Obligatoire</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Actif</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.allowCustomValue || false}
                  onChange={(e) => setFormData({ ...formData, allowCustomValue: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Autoriser valeur personnalisée</span>
              </label>
            </div>
            <div className="mt-4 p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold mb-3">Afficher uniquement si...</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Champ parent"
                  value={formData.parentField || ''}
                  onChange={(e) => setFormData({ ...formData, parentField: e.target.value })}
                  placeholder="Ex: compressor_type"
                />
                <Input
                  label="Valeur déclencheur"
                  value={formData.parentValue || ''}
                  onChange={(e) => setFormData({ ...formData, parentValue: e.target.value })}
                  placeholder="Ex: Atlas Copco"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>Annuler</Button>
              <Button onClick={handleAdd} disabled={loading}>
                <Save size={18} className="mr-2" />
                Enregistrer
              </Button>
            </div>
          </Card>
        );

      case 'machine_field_options':
        return (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Ajouter une option de champ</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Champ parent"
                value={formData.fieldId || ''}
                onChange={(e: any) => setFormData({ ...formData, fieldId: e.target.value })}
                options={[
                  { value: '', label: 'Sélectionner un champ' },
                  ...(machineFields || []).map((field: any) => ({
                    value: field._id,
                    label: `${field.machineType} - ${field.label}`
                  }))
                ]}
                required
              />
              <Input
                label="Valeur de l'option"
                value={formData.value || ''}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
                placeholder="Ex: Atlas Copco"
              />
              <Input
                label="Ordre"
                type="number"
                value={formData.order || 0}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>Annuler</Button>
              <Button onClick={handleAdd} disabled={loading}>
                <Save size={18} className="mr-2" />
                Enregistrer
              </Button>
            </div>
          </Card>
        );

      case 'users':
        return (
          <Card className="mb-6 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Ajouter un utilisateur</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom"
                value={formData.nom || ''}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
              <Input
                label="Prénom"
                value={formData.prenom || ''}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Téléphone"
                value={formData.telephone || ''}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
              <Input
                label="N° Technicien"
                value={formData.numeroTechnicien || ''}
                onChange={(e) => setFormData({ ...formData, numeroTechnicien: e.target.value })}
                placeholder="Ex: 002"
              />
              <Select
                label="Rôle"
                value={formData.role || 'TECHNICIEN_CMS'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={[
                  { value: 'TECHNICIEN_CMS', label: 'Technicien CMS' },
                  { value: 'TECHNICIEN_ROBOT', label: 'Technicien Robot' },
                  { value: 'TECHNICIEN_FROID', label: 'Technicien Froid' },
                  { value: 'TECHNICIEN_TRAITE', label: 'Technicien Traite' },
                  { value: 'RESPONSABLE_TECHNIQUE', label: 'Responsable Technique' },
                  { value: 'ADMINISTRATEUR', label: 'Administrateur' },
                  { value: 'MAGASINIER', label: 'Magasinier' },
                  { value: 'CLIENT', label: 'Client' }
                ]}
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>Annuler</Button>
              <Button onClick={handleAdd} disabled={loading}>
                <Save size={18} className="mr-2" />
                Enregistrer
              </Button>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  // ✅ NOUVEAU : Formulaire d'édition
  const getEditForm = () => {
    if (activeTable === 'users') {
      return (
        <Card className="mb-6 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Modifier l'utilisateur</h2>
            <Button variant="ghost" size="sm" onClick={() => {
              setShowEditForm(false);
              setEditingItem(null);
              setFormData({});
            }}>
              <X size={20} />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom"
              value={formData.nom || ''}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
            />
            <Input
              label="Prénom"
              value={formData.prenom || ''}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Téléphone"
              value={formData.telephone || ''}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
            <Input
              label="N° Technicien"
              value={formData.numeroTechnicien || ''}
              onChange={(e) => setFormData({ ...formData, numeroTechnicien: e.target.value })}
            />
            <Select
              label="Rôle"
              value={formData.role || 'TECHNICIEN_CMS'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'TECHNICIEN_CMS', label: 'Technicien CMS' },
                { value: 'TECHNICIEN_ROBOT', label: 'Technicien Robot' },
                { value: 'TECHNICIEN_FROID', label: 'Technicien Froid' },
                { value: 'TECHNICIEN_TRAITE', label: 'Technicien Traite' },
                { value: 'RESPONSABLE_TECHNIQUE', label: 'Responsable Technique' },
                { value: 'ADMINISTRATEUR', label: 'Administrateur' },
                { value: 'MAGASINIER', label: 'Magasinier' },
                { value: 'CLIENT', label: 'Client' }
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => {
              setShowEditForm(false);
              setEditingItem(null);
              setFormData({});
            }}>Annuler</Button>
            <Button onClick={handleUpdate} disabled={loading}>
              <Save size={18} className="mr-2" />
              Mettre à jour
            </Button>
          </div>
        </Card>
      );
    }

    if (activeTable === 'error_codes') {
      return (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Modifier le code erreur</h2>
            <Button variant="ghost" size="sm" onClick={() => {
              setShowEditForm(false);
              setEditingItem(null);
              setFormData({});
            }}>
              <X size={20} />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Alarme"
              value={formData.alarme || ''}
              onChange={(e) => setFormData({ ...formData, alarme: e.target.value })}
              required
            />
            <Input
              label="Type d'alarme"
              value={formData.typeAlarme || ''}
              onChange={(e) => setFormData({ ...formData, typeAlarme: e.target.value })}
            />
            <Input
              label="Chapitre"
              value={formData.chapitre || ''}
              onChange={(e) => setFormData({ ...formData, chapitre: e.target.value })}
            />
            <Input
              label="Titre"
              value={formData.titre || ''}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
            />
          </div>
          <div className="mt-4">
            <TextArea
              label="Cause"
              value={formData.cause || ''}
              onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
              rows={3}
            />
          </div>
          <div className="mt-4">
            <TextArea
              label="Action"
              value={formData.action || ''}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => {
              setShowEditForm(false);
              setEditingItem(null);
              setFormData({});
            }}>Annuler</Button>
            <Button onClick={handleUpdate} disabled={loading}>
              <Save size={18} className="mr-2" />
              Mettre à jour
            </Button>
          </div>
        </Card>
      );
    }

    if (activeTable === 'taches_entretien') {
      return (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Modifier la tâche d'entretien</h2>
            <Button variant="ghost" size="sm" onClick={() => {
              setShowEditForm(false);
              setEditingItem(null);
              setFormData({});
            }}>
              <X size={20} />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kit ID"
              value={formData.kitId || ''}
              onChange={(e) => setFormData({ ...formData, kitId: e.target.value })}
              required
            />
            <Input
              label="Type de machine"
              value={formData.machineType || ''}
              onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
            />
            <Input
              label="ID Tâche"
              value={formData.idTache || ''}
              onChange={(e) => setFormData({ ...formData, idTache: e.target.value })}
              required
            />
            <Input
              label="Section"
              value={formData.section || ''}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              required
            />
            <Input
              label="Ordre d'exécution"
              type="number"
              value={formData.ordre ?? 1}
              onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value, 10) || 1 })}
            />
          </div>
          <div className="mt-4">
            <TextArea
              label="Description / Instructions"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => {
              setShowEditForm(false);
              setEditingItem(null);
              setFormData({});
            }}>Annuler</Button>
            <Button onClick={handleUpdate} disabled={loading}>
              <Save size={18} className="mr-2" />
              Mettre à jour
            </Button>
          </div>
        </Card>
      );
    }

    if (activeTable === 'machine_field_options') {
      return (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Modifier l'option de champ</h2>
            <Button variant="ghost" size="sm" onClick={() => {
              setShowEditForm(false);
              setEditingItem(null);
              setFormData({});
            }}>
              <X size={20} />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Champ parent"
              value={formData.fieldId || ''}
              onChange={(e: any) => setFormData({ ...formData, fieldId: e.target.value })}
              options={[
                { value: '', label: 'Sélectionner un champ' },
                ...(machineFields || []).map((field: any) => ({
                  value: field._id || field.id,
                  label: `${field.machineType} - ${field.label}`
                }))
              ]}
              required
            />
            <Input
              label="Valeur de l'option"
              value={formData.value || ''}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
            />
            <Input
              label="Ordre"
              type="number"
              value={formData.order || 0}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => {
              setShowEditForm(false);
              setEditingItem(null);
              setFormData({});
            }}>Annuler</Button>
            <Button onClick={handleUpdate} disabled={loading}>
              <Save size={18} className="mr-2" />
              Mettre à jour
            </Button>
          </div>
        </Card>
      );
    }

    if (activeTable !== 'machine_fields') return null;

    return (
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Modifier le champ machine</h2>
          <Button variant="ghost" size="sm" onClick={() => {
            setShowEditForm(false);
            setEditingItem(null);
            setFormData({});
          }}>
            <X size={20} />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Type de machine"
            value={formData.machineType || ''}
            onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
            required
            placeholder="Ex: VMS2014, V300"
          />
          <Input
            label="Libellé du champ"
            value={formData.label || ''}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            required
          />
          <Select
            label="Type de champ"
            value={formData.fieldType || 'text'}
            onChange={(e: any) => setFormData({ ...formData, fieldType: e.target.value })}
            options={[
              { value: 'select', label: 'Menu déroulant' },
              { value: 'text', label: 'Texte libre' },
              { value: 'number', label: 'Nombre' },
              { value: 'date', label: 'Date' },
              { value: 'checkbox', label: 'Case à cocher' },
              { value: 'tag', label: 'Étiquette' }
            ]}
            required
          />
          <Input
            label="Ordre"
            type="number"
            value={formData.order || 0}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isRequired || false}
              onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Obligatoire</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive !== false}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Actif</span>
          </label>
        </div>

        {/* Section Affichage conditionnel */}
        <div className="mt-4 p-4 border border-gray-200 rounded-lg">
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={formData.hasConditionalRules || false}
              onChange={(e) => setFormData({ ...formData, hasConditionalRules: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="font-semibold">Ce champ dépend d'un autre champ</span>
          </label>
          {formData.hasConditionalRules && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Champ parent"
                value={formData.parentField || ''}
                onChange={(e) => setFormData({ ...formData, parentField: e.target.value })}
                placeholder="Ex: compressor_type"
              />
              <Input
                label="Valeur déclencheur"
                value={formData.parentValue || ''}
                onChange={(e) => setFormData({ ...formData, parentValue: e.target.value })}
                placeholder="Ex: Atlas Copco"
              />
            </div>
          )}
        </div>

        {/* Section Options */}
        <div className="mt-4 p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-3">Options</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.allowCustomValue || false}
              onChange={(e) => setFormData({ ...formData, allowCustomValue: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Autoriser valeur personnalisée "Autre"</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => {
            setShowEditForm(false);
            setEditingItem(null);
            setFormData({});
          }}>Annuler</Button>
          <Button onClick={handleUpdate} disabled={loading}>
            <Save size={18} className="mr-2" />
            Enregistrer
          </Button>
        </div>
      </Card>
    );
  };

  // ✅ NOUVEAU : Fonction pour mettre à jour un élément
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const itemId = editingItem._id || editingItem.id;
      const data = {
        ...formData,
        updatedAt: now
      };

      if (activeTable === 'users') {
        const userNom = (formData.nom || '').trim();
        const userPrenom = (formData.prenom || '').trim();
        const userEmail = (formData.email || '').trim().toLowerCase();
        await db.users.update(itemId, {
          nom: userNom,
          prenom: userPrenom,
          email: userEmail,
          telephone: (formData.telephone || '').trim(),
          numeroTechnicien: (formData.numeroTechnicien || '').trim(),
          role: formData.role || 'TECHNICIEN_CMS',
          roles: [formData.role || 'TECHNICIEN_CMS']
        });
        await fetchUsers();
      }

      if (activeTable === 'error_codes') {
        await (db as any).errorCodes.update(itemId, {
          alarme: formData.alarme,
          typeAlarme: formData.typeAlarme,
          chapitre: formData.chapitre,
          titre: formData.titre,
          cause: formData.cause,
          action: formData.action,
          updatedAt: now
        });
        await fetchErrorCodes();
      }

      if (activeTable === 'taches_entretien') {
        const section = formData.section || formData.sectionTitle || 'Section générale';
        const description = formData.description || formData.taskLabel || '';
        await (db as any).taches_entretien.update(itemId, {
          kit_id: formData.kitId || formData.kit_id,
          kitId: formData.kitId || formData.kit_id,
          machine_type: formData.machineType || formData.machine_type,
          machineType: formData.machineType || formData.machine_type,
          task_id: formData.idTache || formData.taskId || formData.task_id,
          idTache: formData.idTache || formData.taskId || formData.task_id,
          section_title: section,
          section: section,
          section_id: section.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          task_label: description,
          description: description,
          task_order: parseInt(formData.ordre || formData.taskOrder, 10) || 1,
          ordre: parseInt(formData.ordre || formData.taskOrder, 10) || 1,
          updatedAt: now
        });
        await fetchTachesEntretien();
      }

      if (activeTable === 'machine_fields') {
        const fieldData = {
          ...data,
          conditionalRules: formData.hasConditionalRules && formData.parentField ? {
            parentField: formData.parentField,
            parentValue: formData.parentValue
          } : null
        };
        delete fieldData.hasConditionalRules;
        await (db as any).machine_fields.update(itemId, fieldData);
        await fetchMachineFields();
      }

      if (activeTable === 'machine_field_options') {
        await (db as any).machine_field_options.update(itemId, {
          fieldId: formData.fieldId,
          value: formData.value,
          order: parseInt(formData.order, 10) || 0,
          updatedAt: now
        });
        await fetchMachineFieldOptions();
      }

      alert('✅ Élément modifié avec succès !');
      setShowEditForm(false);
      setEditingItem(null);
      setFormData({});
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVEAU : Fonction pour ajouter un élément
  const handleAdd = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const data = {
        ...formData,
        actif: true,
        creator: 'admin',
        createdAt: now,
        updatedAt: now
      };

      switch (activeTable) {
        case 'users': {
          const userNom = (formData.nom || '').trim();
          const userPrenom = (formData.prenom || '').trim();
          const userEmail = (formData.email || '').trim().toLowerCase();
          if (!userEmail) {
            alert("L'adresse email est obligatoire.");
            setLoading(false);
            return;
          }
          await db.users.create({
            nom: userNom,
            prenom: userPrenom,
            email: userEmail,
            telephone: (formData.telephone || '').trim(),
            numeroTechnicien: (formData.numeroTechnicien || '').trim(),
            role: formData.role || 'TECHNICIEN_CMS',
            roles: [formData.role || 'TECHNICIEN_CMS'],
            actif: true,
            statut: 'VALIDE'
          });
          await fetchUsers();
          alert('✅ Utilisateur créé et enregistré avec succès dans la base de données !');
          setShowAddForm(false);
          setFormData({});
          break;
        }
        case 'clients':
          await (db as any).clients.create(data);
          await fetchClients();
          break;
        case 'maintenance_kits': {
          const kitNumber = typeof formData.kitNumber === 'string' && /^\d+$/.test(formData.kitNumber)
            ? parseInt(formData.kitNumber, 10)
            : (formData.kitNumber || 0);
          const serviceNumber = parseInt(formData.serviceNumber, 10) || 1;
          const machineType = (formData.machineType || '').trim();
          const autoNom = formData.nom?.trim() || `Kit Entretien ${machineType}-${kitNumber}-Service (${serviceNumber})`;
          const autoKitId = formData.kitId || `kit_${machineType.toLowerCase().replace(/\s+/g, '')}_${kitNumber}_${serviceNumber}`;

          const kitPayload = {
            ...data,
            kitId: autoKitId,
            machineType,
            kitNumber,
            serviceNumber,
            nom: autoNom,
            description: formData.description || '',
            pieces: formData.pieces || []
          };
          await (db as any).maintenance_kits.create(kitPayload);
          await fetchMaintenanceKits();
          break;
        }
        case 'spare_parts':
          await (db as any).spare_parts.create(data);
          await fetchSpareParts();
          break;
        case 'error_codes':
          await (db as any).error_codes.create(data);
          await fetchErrorCodes();
          break;
        case 'taches_entretien': {
          const taskPayload = {
            ...data,
            kit_id: formData.kitId || formData.kit_id || '',
            kitId: formData.kitId || formData.kit_id || '',
            machine_type: formData.machineType || formData.machine_type || '',
            machineType: formData.machineType || formData.machine_type || '',
            task_id: formData.idTache || formData.taskId || formData.task_id || `task_${Date.now()}`,
            idTache: formData.idTache || formData.taskId || formData.task_id || `task_${Date.now()}`,
            section_title: formData.section || formData.sectionTitle || 'Section générale',
            section: formData.section || formData.sectionTitle || 'Section générale',
            section_id: (formData.section || formData.sectionTitle || 'section_generale').toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            task_label: formData.description || formData.taskLabel || '',
            description: formData.description || formData.taskLabel || '',
            task_order: parseInt(formData.ordre || formData.taskOrder, 10) || 1,
            ordre: parseInt(formData.ordre || formData.taskOrder, 10) || 1,
          };
          await (db as any).taches_entretien.create(taskPayload);
          await fetchTachesEntretien();
          break;
        }
        case 'machine_fields': {
          const label = String(formData.label || '').trim();
          const name = String(formData.name || label.toLowerCase().replace(/[^a-z0-9]+/g, '_') || `champ_${Date.now()}`).trim();
          const fieldData = {
            ...data,
            label,
            name,
            machineType: formData.machineType || 'Tous',
            fieldType: formData.fieldType || 'text',
            conditionalRules: formData.parentField ? {
              parentField: formData.parentField,
              parentValue: formData.parentValue
            } : null
          };
          await (db as any).machine_fields.create(fieldData);
          await fetchMachineFields();
          break;
        }
        case 'machine_field_options': {
          const val = String(formData.value || formData.label || '').trim();
          const label = String(formData.label || val || 'Option').trim();
          await (db as any).machine_field_options.create({
            ...data,
            fieldId: formData.fieldId,
            value: val,
            label: label,
            order: parseInt(formData.order, 10) || 0
          });
          await fetchMachineFieldOptions();
          break;
        }
      }

      alert('✅ Élément ajouté avec succès !');
      setShowAddForm(false);
      setFormData({});
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFeedback = async (entityName: string, successCount: number, errorCount: number, errors: string[]) => {
    if (successCount > 0 && errorCount === 0) {
      alert(`✅ ${successCount} ${entityName} importé(s) avec succès dans la base de données !`);
      return;
    }
    if (successCount > 0 && errorCount > 0) {
      alert(`⚠️ ${successCount} ${entityName} importé(s), mais ${errorCount} ligne(s) ont échoué.`);
    }
    if (errorCount > 0) {
      const isRlsBlocked = errors.some(e => e.includes('42501') || e.toLowerCase().includes('rls') || e.toLowerCase().includes('row-level security'));
      if (isRlsBlocked) {
        const copyNow = confirm(`⚠️ Supabase a bloqué l'enregistrement de ${errorCount} ligne(s) en raison des politiques de sécurité (RLS).\n\nPour autoriser l'écriture sur cette table, vous devez exécuter le script SQL officiel dans la console Supabase.\n\nVoulez-vous COPIER le script SQL Déblocage RLS maintenant ?`);
        if (copyNow) {
          await navigator.clipboard.writeText(SUPABASE_REPAIR_SQL);
          alert("✅ Script SQL copié dans le presse-papier !\n\nOuvrez Supabase (SQL Editor), collez le script et cliquez sur 'Run' pour débloquer définitivement toutes les tables.");
        }
      } else {
        const detail = errors.slice(0, 3).join('\n');
        alert(`⚠️ ${errorCount} erreur(s) lors de l'import :\n\n${detail}\n\n(Consultez la console F12 pour les détails complets)`);
      }
    }
  };

  const tableConfigs: any = { // Typé comme 'any' pour éviter les erreurs de structure complexes
    clients: {
      name: 'Clients',
      data: clients || [],
      columns: [
        { key: 'numeroClient', label: 'N° Client', aliases: ['no client', 'num client', 'code client', 'nø client', 'n° client'] },
        { key: 'nom', label: 'Nom', aliases: ['name', 'raison sociale'] },
        { key: 'nomFerme', label: 'Ferme', aliases: ['farm', 'nom exploitation'] },
        { key: 'email', label: 'Email', aliases: ['mail', 'courriel', 'e-mail'] },
        { key: 'telephone', label: 'Téléphone', aliases: ['tel', 'mobile', 'portable', 'phone', 'téléphone', 'telephone'] },
        { key: 'ville', label: 'Ville', aliases: ['city', 'commune'] }
      ],
      csvColumns: ['numeroClient', 'nom', 'nomFerme', 'email', 'telephone', 'ville'],
      onImport: async (data: any[]) => {
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const row of data) {
          try {
            // Nettoyage des données
            const cleanRow = {
              numeroClient: row.numeroClient || row.numero_client,
              nom: row.nom || row.name,
              nomFerme: row.nomFerme || row.nom_ferme,
              email: row.email,
              telephone: row.telephone,
              ville: row.ville,
              adresse: row.adresse,
              codePostal: row.codePostal || row.code_postal,
              pays: row.pays || 'France',
              creator: 'admin',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            await (db as any).clients.create(cleanRow);
            successCount++;
          } catch (e: any) {
            console.error('Erreur import client:', row, e);
            errors.push(e?.message || 'Erreur inconnue');
            errorCount++;
          }
        }

        await handleImportFeedback('clients', successCount, errorCount, errors);
        await fetchClients();
      },
      onDelete: async (itemOrId: any) => {
        const id = typeof itemOrId === 'string' ? itemOrId : (itemOrId?._id || itemOrId?.id);
        if (id) await deleteClient(id);
      }
    },
    users: {
      name: 'Utilisateurs',
      data: users || [],
      columns: [
        { key: 'nom', label: 'Nom', aliases: ['name', 'last name'] },
        { key: 'prenom', label: 'Prénom', aliases: ['first name', 'given name', 'prÃ©nom', 'prénom'] },
        { key: 'email', label: 'Email', aliases: ['mail', 'courriel', 'e-mail', 'courrier'] },
        { key: 'telephone', label: 'Téléphone', aliases: ['tel', 'mobile', 'portable', 'phone', 'téléphone', 'telephone'] }, // ADDED
        { key: 'role', label: 'Rôle', aliases: ['function', 'fonction', 'r"le', 'rôle', 'role', 'rÃ´le', 'r_le'] },
        { key: 'numeroTechnicien', label: 'N° Tech', aliases: ['tech id', 'no tech', 'nø technicien', 'n° technicien', 'numero technicien', 'n_technicien', 'n technicien', 'n° tech', 'n tech'] }
      ],
      csvColumns: ['nom', 'prenom', 'email', 'telephone', 'role', 'numeroTechnicien'],
      onImport: async (data: any[]) => {
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const row of data) {
          try {
            // Gestion intelligente du nom/prénom
            let nom = row.nom;
            let prenom = row.prenom || '';

            // Si pas de prénom mais nom contient un espace, on essaie de séparer
            if (!prenom && nom && nom.includes(' ')) {
              const parts = nom.split(' ');
              if (parts.length >= 2) {
                prenom = parts[0]; // Hypothèse: Prénom Nom (ex: Laurent Chan)
                nom = parts.slice(1).join(' ');
              }
            }

            // Validation: au moins un nom ou email
            if (!nom && !row.email) {
              console.warn('Ligne ignorée (pas de nom ni email):', row);
              continue;
            }

            // Rôle par défaut si vide
            let role = row.role?.trim();
            if (!role || role === '') {
              role = 'technicien'; // Rôle par défaut
              console.log(`Rôle vide pour ${nom || row.email}, utilisation de 'technicien'`);
            } else {
              role = role.toLowerCase();

              // Mapping automatique des rôles vers les valeurs autorisées par la DB
              // Valeurs autorisées: 'admin', 'technicien', 'manager'
              const roleMapping: Record<string, string> = {
                'technicien': 'technicien',
                'technicien_vms': 'technicien',
                'chef_technicien': 'manager',
                'chef_technicien_vms': 'manager',
                'monteur': 'technicien',
                'chef_monteur': 'manager',
                'admin': 'admin',
                'administrateur': 'admin',
                'responsable': 'manager',
                'manager': 'manager'
              };

              if (roleMapping[role]) {
                console.log(`Mapping rôle: ${role} → ${roleMapping[role]}`);
                role = roleMapping[role];
              } else {
                console.warn(`Rôle inconnu "${role}", utilisation de "technicien" par défaut`);
                role = 'technicien';
              }
            }

            const userData = {
              nom: nom || 'Inconnu',
              prenom: prenom || '',
              email: row.email,
              telephone: row.telephone || '',
              role: role,
              numeroTechnicien: row.numeroTechnicien || '',
              actif: true
            };

            console.log('Tentative de création utilisateur:', userData);
            await db.users.create(userData);
            successCount++;
          } catch (e: any) {
            const errorMsg = `Erreur ligne ${successCount + errorCount + 1}: ${e instanceof Error ? e.message : 'Erreur inconnue'}`;
            console.error('Erreur import utilisateur:', row, e);
            errors.push(e?.message || errorMsg);
            errorCount++;
          }
        }

        await handleImportFeedback('utilisateurs', successCount, errorCount, errors);
        await fetchUsers();
      },
      onDelete: async (id: string) => {
        const target = users.find((u: any) => u.id === id || u._id === id);
        if (target?.email?.toLowerCase() === 'contact@appalacarte.fr') {
          alert("L'administrateur maître contact@appalacarte.fr ne peut pas être supprimé.");
          return;
        }
        if (!confirm("Supprimer définitivement cet utilisateur ?")) return;
        setLoading(true);
        try {
          await deleteUser(id);
          await fetchUsers();
          alert('✅ Utilisateur supprimé avec succès.');
        } catch (e: any) {
          alert('Erreur lors de la suppression : ' + (e.message || 'Erreur inconnue'));
        } finally {
          setLoading(false);
        }
      }
    },
    maintenance_kits: {
      name: 'Kits d\'entretien',
      data: maintenanceKits || [],
      columns: [
        { key: 'kitId', label: 'Kit ID' },
        { key: 'machineType', label: 'Type machine' },
        { key: 'kitNumber', label: 'N° Kit' },
        { key: 'serviceNumber', label: 'Service' },
        { key: 'nom', label: 'Nom' }
      ],
      csvColumns: [],
      useCustomImporter: true,
      onImport: async () => { },
      onDelete: undefined
    },
    spare_parts: {
      name: 'Pièces détachées',
      data: spareParts || [],
      columns: [
        { key: 'reference', label: 'Référence' },
        { key: 'designation', label: 'Désignation' },
        { key: 'stock', label: 'Stock' },
        { key: 'seuilAlerte', label: 'Seuil' },
        { key: 'prixUnitaire', label: 'Prix' }
      ],
      csvColumns: ['reference', 'designation', 'stock', 'seuilAlerte', 'prixUnitaire'],
      onImport: async (data: any[]) => {
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const row of data) {
          try {
            await (db as any).spare_parts.create({
              reference: row.reference,
              designation: row.designation,
              stock: parseInt(row.stock) || 0,
              seuilAlerte: parseInt(row.seuilAlerte) || 5,
              prixUnitaire: parseFloat(row.prixUnitaire) || 0,
              actif: true,
              creator: 'admin',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            successCount++;
          } catch (e: any) {
            console.error('Erreur import pièce:', row, e);
            errors.push(e?.message || 'Erreur inconnue');
            errorCount++;
          }
        }

        await handleImportFeedback('pièces détachées', successCount, errorCount, errors);
        await fetchSpareParts();
      },
      onDelete: async (itemOrId: any) => {
        const id = typeof itemOrId === 'string' ? itemOrId : (itemOrId?._id || itemOrId?.id);
        if (id) await deleteSparePart(id);
      }
    },
    error_codes: {
      name: 'Codes erreur',
      data: errorCodes || [],
      columns: [
        { key: 'alarme', label: 'Alarme', render: (val: any, item: any) => item?.alarme || item?.Alarme || val || '-' },
        { key: 'typeAlarme', label: 'Type', render: (val: any, item: any) => item?.typeAlarme || item?.Type_alarme || item?.type_alarme || val || '-' },
        { key: 'chapitre', label: 'Chapitre', render: (val: any, item: any) => item?.chapitre || item?.Chapitre || val || '-' },
        { key: 'titre', label: 'Titre', render: (val: any, item: any) => item?.titre || item?.Titre || val || '-' },
        {
          key: 'cause',
          label: 'Cause',
          render: (val: any, item: any) => {
            const text = item?.cause || item?.Cause || val || '-';
            return text.length > 55 ? `${text.substring(0, 55)}...` : text;
          }
        },
        {
          key: 'action',
          label: 'Action',
          render: (val: any, item: any) => {
            const text = item?.action || item?.Action || val || '-';
            return text.length > 55 ? `${text.substring(0, 55)}...` : text;
          }
        }
      ],
      csvColumns: ['alarme', 'typeAlarme', 'chapitre', 'titre', 'cause', 'action'],
      onImport: async (data: any[]) => {
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const row of data) {
          try {
            await (db as any).error_codes.create({
              alarme: row.alarme || row.Alarme || '',
              typeAlarme: row.typeAlarme || row.Type_alarme || row.type_alarme || '',
              chapitre: row.chapitre || row.Chapitre || '',
              titre: row.titre || row.Titre || '',
              cause: row.cause || row.Cause || '',
              action: row.action || row.Action || '',
              actif: true,
              creator: 'admin',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            successCount++;
          } catch (e: any) {
            console.error('Erreur import code erreur:', row, e);
            errors.push(e?.message || 'Erreur inconnue');
            errorCount++;
          }
        }

        await handleImportFeedback('codes erreur', successCount, errorCount, errors);
        await fetchErrorCodes();
        return { success: successCount, errors, duplicates: 0 };
      },
      onDelete: async (itemOrId: any) => {
        const id = typeof itemOrId === 'string' ? itemOrId : (itemOrId?._id || itemOrId?.id);
        if (!id) return;
        if (!confirm('Supprimer ce code erreur ?')) return;
        setLoading(true);
        try {
          await deleteErrorCode(id);
          await fetchErrorCodes();
          alert('✅ Code erreur supprimé avec succès.');
        } catch (e: any) {
          alert('Erreur lors de la suppression : ' + (e.message || 'Erreur inconnue'));
        } finally {
          setLoading(false);
        }
      }
    },
    taches_entretien: {
      name: 'Tâches d\'entretien',
      data: tachesEntretien || [],
      columns: [
        { key: 'idTache', label: 'ID Tâche', render: (val: any, item: any) => item?.taskId || item?.task_id || item?.idTache || val || '-' },
        { key: 'kitId', label: 'Kit ID', render: (val: any, item: any) => item?.kitId || item?.kit_id || val || '-' },
        { key: 'section', label: 'Section', render: (val: any, item: any) => item?.sectionTitle || item?.section_title || item?.section || val || '-' },
        {
          key: 'description',
          label: 'Description',
          render: (val: any, item: any) => {
            const text = item?.taskLabel || item?.task_label || item?.description || val || '-';
            return text.length > 60 ? `${text.substring(0, 60)}...` : text;
          }
        },
        { key: 'ordre', label: 'Ordre', render: (val: any, item: any) => item?.taskOrder ?? item?.task_order ?? item?.ordre ?? val ?? 0 }
      ],
      csvColumns: ['idTache', 'kitId', 'section', 'description', 'ordre', 'machineType'],
      onImport: async (data: any[]) => {
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const row of data) {
          try {
            const taskId = row.idTache || row.taskId || row.task_id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const section = row.section || row.sectionTitle || row.section_title || 'Section générale';
            const description = row.description || row.taskLabel || row.task_label || '';
            const kitId = row.kitId || row.kit_id || '';
            const order = parseInt(row.ordre || row.taskOrder || row.task_order, 10) || 0;

            await (db as any).taches_entretien.create({
              task_id: taskId,
              taskId: taskId,
              idTache: taskId,
              kit_id: kitId,
              kitId: kitId,
              machine_type: row.machineType || row.machine_type || '',
              machineType: row.machineType || row.machine_type || '',
              section_title: section,
              section: section,
              section_id: section.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
              task_label: description,
              description: description,
              task_order: order,
              ordre: order,
              is_critical: false,
              creator: 'admin',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            successCount++;
          } catch (e: any) {
            console.error('Erreur import tâche:', row, e);
            errors.push(e?.message || 'Erreur inconnue');
            errorCount++;
          }
        }

        await handleImportFeedback('tâches d\'entretien', successCount, errorCount, errors);
        await fetchTachesEntretien();
        return { success: successCount, errors, duplicates: 0 };
      },
      onDelete: async (itemOrId: any) => {
        const id = typeof itemOrId === 'string' ? itemOrId : (itemOrId?._id || itemOrId?.id);
        if (!id) return;
        if (!confirm('Supprimer cette tâche d\'entretien ?')) return;
        setLoading(true);
        try {
          await deleteTacheEntretien(id);
          await fetchTachesEntretien();
          alert('✅ Tâche supprimée avec succès.');
        } catch (e: any) {
          alert('Erreur lors de la suppression : ' + (e.message || 'Erreur inconnue'));
        } finally {
          setLoading(false);
        }
      }
    },
    machine_fields: {
      name: 'Champs machines',
      data: machineFields || [],
      columns: [
        { key: 'machineType', label: 'Type machine' },
        { key: 'label', label: 'Libellé' },
        { key: 'fieldType', label: 'Type de champ' },
        {
          key: 'isRequired',
          label: 'Obligatoire',
          render: (value: any) => value ? '✓' : ''
        },
        {
          key: 'isActive',
          label: 'Actif',
          render: (value: any) => value !== false ? '✓' : ''
        },
        { key: 'order', label: 'Ordre' },
        {
          key: 'conditionalRules',
          label: 'Règles conditionnelles',
          render: (value: any) => value ? `Champ: ${value.parentField || value.parent_field} = ${value.parentValue || value.parent_value}` : 'Aucune'
        },
        {
          key: 'allowCustomValue',
          label: 'Valeur perso',
          render: (value: any) => value ? '✓' : '✗'
        }
      ],
      csvColumns: ['machineType', 'label', 'fieldType', 'isRequired', 'isActive', 'order', 'allowCustomValue'],
      onImport: async (data: any[]) => {
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const row of data) {
          const label = String(row.label || row.name || 'Champ').trim();
          const name = String(row.name || label.toLowerCase().replace(/[^a-z0-9]+/g, '_') || `champ_${Date.now()}`).trim();
          const fieldData: any = {
            name: name,
            label: label,
            machineType: row.machineType || 'Tous',
            fieldType: row.fieldType || 'text',
            isRequired: row.isRequired === 'true' || row.isRequired === true,
            isActive: row.isActive === 'true' || row.isActive === true || row.isActive !== 'false',
            order: parseInt(row.order) || 0,
            allowCustomValue: row.allowCustomValue === 'true' || row.allowCustomValue === true,
            creator: row.creator || 'admin',
            createdAt: row.createdAt || new Date().toISOString(),
            updatedAt: row.updatedAt || new Date().toISOString()
          };

          if (row.conditionalRules_parentField && row.conditionalRules_parentValue) {
            fieldData.conditionalRules = {
              parentField: row.conditionalRules_parentField.trim(),
              parentValue: row.conditionalRules_parentValue.trim()
            };
          }

          try {
            await (db as any).machine_fields.create(fieldData);
            successCount++;
          } catch (e: any) {
            console.error('❌ Erreur création champ machine:', e);
            errors.push(e?.message || 'Erreur inconnue');
            errorCount++;
          }
        }

        await handleImportFeedback('champs machines', successCount, errorCount, errors);
        await fetchMachineFields();
        return { success: successCount, errors, duplicates: 0 };
      },
      onDelete: async (itemOrId: any) => {
        const id = typeof itemOrId === 'string' ? itemOrId : (itemOrId?._id || itemOrId?.id);
        if (!id) return;
        if (!confirm('Supprimer ce champ machine ?')) return;
        setLoading(true);
        try {
          await deleteMachineField(id);
          await fetchMachineFields();
          alert('✅ Champ machine supprimé avec succès.');
        } catch (e: any) {
          alert('Erreur lors de la suppression : ' + (e.message || 'Erreur inconnue'));
        } finally {
          setLoading(false);
        }
      }
    },
    machine_field_options: {
      name: 'Options de champs',
      data: machineFieldOptions || [],
      columns: [
        {
          key: 'fieldId',
          label: 'Champ parent',
          render: (value: any, item: any) => {
            const targetId = value || item?.field_id;
            const field = (machineFields || []).find((f: any) => f._id === targetId || f.id === targetId);
            return field ? `${field.machineType} - ${field.label}` : (targetId || '-');
          }
        },
        { key: 'value', label: 'Valeur' },
        { key: 'order', label: 'Ordre' }
      ],
      csvColumns: ['fieldId', 'value', 'order'],
      onImport: async (data: any[]) => {
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const row of data) {
          const val = String(row.value || row.label || '').trim();
          const label = String(row.label || val || 'Option').trim();
          try {
            await (db as any).machine_field_options.create({
              fieldId: row.fieldId || row.field_id,
              value: val,
              label: label,
              order: parseInt(row.order, 10) || 0,
              createdAt: new Date().toISOString()
            });
            successCount++;
          } catch (e: any) {
            console.error('Erreur import option:', row, e);
            errors.push(e?.message || 'Erreur inconnue');
            errorCount++;
          }
        }

        await handleImportFeedback('options de champs', successCount, errorCount, errors);
        await fetchMachineFieldOptions();
        return { success: successCount, errors, duplicates: 0 };
      },
      onDelete: async (itemOrId: any) => {
        const id = typeof itemOrId === 'string' ? itemOrId : (itemOrId?._id || itemOrId?.id);
        if (!id) return;
        if (!confirm('Supprimer cette option de champ ?')) return;
        setLoading(true);
        try {
          await deleteMachineFieldOption(id);
          await fetchMachineFieldOptions();
          alert('✅ Option supprimée avec succès.');
        } catch (e: any) {
          alert('Erreur lors de la suppression : ' + (e.message || 'Erreur inconnue'));
        } finally {
          setLoading(false);
        }
      }
    },
    languages: {
      name: 'Langues',
      data: [],
      columns: [],
      csvColumns: [],
      onImport: async () => { },
      onDelete: undefined
    },
    translations: {
      name: 'Traductions',
      data: [],
      columns: [],
      csvColumns: [],
      onImport: async () => { },
      onDelete: undefined
    }
  };

  // Calculer le nombre de clients ayant au moins une machine
  const clientsAvecMachines = (clients || []).filter((client: any) =>
    (machines || []).some((machine: any) => machine.clientId === client._id)
  ).length;

  const config = tableConfigs[activeTable as keyof typeof tableConfigs];


  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database className="text-blue-600" size={32} />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Administration des bases</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">Gestion et import des données</p>
            </div>
          </div>
        </div>

                {/* Statut de connexion Supabase */}
        {supabaseHealth && !supabaseHealth.connected && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
              <div className="text-sm">
                <p className="font-semibold text-amber-900">
                  Supabase non joignable — Les données ne montent pas dans Supabase
                </p>
                <p className="text-amber-700 mt-1">
                  Détail : <span className="font-mono text-xs">{supabaseHealth.error}</span>
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Vérifiez sur <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-medium">supabase.com/dashboard</a> si le projet est en pause (Paused) ou si l'URL configurée (<span className="font-mono">{supabaseHealth.url}</span>) est correcte.
                </p>
              </div>
            </div>
          </Card>
        )}
        {supabaseHealth && supabaseHealth.connected && (
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 shadow-xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">Supabase connecté en direct — Projet : <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">{supabaseHealth.url}</code></span>
              </div>
              <p className="text-emerald-700 text-[11px] ml-6">
                💡 Si certaines tables ne se remplissent pas lors d'un import CSV (sécurité RLS active), cliquez sur le bouton ci-contre puis exécutez le script dans votre console Supabase (<span className="font-medium">SQL Editor</span>).
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(SUPABASE_REPAIR_SQL);
                alert("Script SQL officiel de déblocage Supabase copié !\n\nCollez-le dans votre console Supabase (SQL Editor) et cliquez sur 'Run' pour débloquer les enregistrements de toutes les tables.");
              }}
              className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Copier le script SQL pour débloquer RLS et aligner les colonnes de Supabase"
            >
              <Database size={14} className="text-emerald-600" />
              <span>Copier script SQL Déblocage RLS</span>
            </button>
          </div>
        )}

        {/* ✅ NOUVEAU : Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="text-2xl font-bold text-blue-600">
              {clientsAvecMachines}/{clients?.length || 0}
            </div>
            <div className="text-xs text-gray-600">Clients avec machines</div>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100">
            <div className="text-2xl font-bold text-green-600">{users?.length || 0}</div>
            <div className="text-xs text-gray-600">Utilisateurs</div>
          </Card>
          <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="text-2xl font-bold text-purple-600">{spareParts?.length || 0}</div>
            <div className="text-xs text-gray-600">Pièces</div>
          </Card>
          <Card className="p-3 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="text-2xl font-bold text-orange-600">{maintenanceKits?.length || 0}</div>
            <div className="text-xs text-gray-600">Kits</div>
          </Card>
          <Card className="p-3 bg-gradient-to-br from-red-50 to-red-100">
            <div className="text-2xl font-bold text-red-600">{errorCodes?.length || 0}</div>
            <div className="text-xs text-gray-600">Codes erreur</div>
          </Card>
          <Card className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100">
            <div className="text-2xl font-bold text-indigo-600">{tachesEntretien?.length || 0}</div>
            <div className="text-xs text-gray-600">Tâches</div>
          </Card>
        </div>
      </div>

      {/* 🚀 INITIALISATION DES CHAMPS ET OPTIONS DE CONFIGURATION SPÉCIFIQUE */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Database size={16} className="text-blue-600" />
              Initialisation des champs machines & options par défaut
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              Réinitialise proprement les champs de configuration spécifique et leurs listes déroulantes pour chaque type de machine (Pompe à vide, V 300, VMS 2014, etc.).
            </p>
          </div>
          <Button
            size="sm"
            onClick={async () => {
              if (!confirm('Voulez-vous initialiser les champs de configuration et leurs options par défaut ?')) return;
              setLoading(true);
              try {
                // Champs standards
                const defaultFields = [
                  { name: 'type_de_pompe', label: 'Type de pompe', type: 'select', machineType: 'Pompe à vide', isRequired: true, isActive: true, order: 1, allowCustomValue: true },
                  { name: 'variateur', label: 'Variateur', type: 'select', machineType: 'Pompe à vide', isRequired: false, isActive: true, order: 2, allowCustomValue: true },
                  { name: 'armoire', label: 'Armoire', type: 'select', machineType: 'Pompe à vide', isRequired: false, isActive: true, order: 3, allowCustomValue: true },
                  { name: 'pression_service', label: 'Pression de service', type: 'text', machineType: 'Pompe à vide', isRequired: false, isActive: true, order: 4, allowCustomValue: false },
                  { name: 'options_v300', label: 'Options V300', type: 'select', machineType: 'V 300', isRequired: false, isActive: true, order: 1, allowCustomValue: true },
                  { name: 'type_stalle', label: 'Type de stalle', type: 'select', machineType: 'V 300', isRequired: false, isActive: true, order: 2, allowCustomValue: false },
                  { name: 'version_logiciel', label: 'Version logiciel', type: 'text', machineType: 'V 300', isRequired: false, isActive: true, order: 3, allowCustomValue: false },
                  { name: 'bras_robot', label: 'Type de bras robot', type: 'text', machineType: 'VMS 2014', isRequired: false, isActive: true, order: 1, allowCustomValue: false },
                  { name: 'camera', label: 'Version caméra 3D', type: 'text', machineType: 'VMS 2014', isRequired: false, isActive: true, order: 2, allowCustomValue: false },
                  { name: 'batiment', label: 'Bâtiment / Emplacement', type: 'text', machineType: 'Tous', isRequired: false, isActive: true, order: 10, allowCustomValue: false }
                ];

                for (const f of defaultFields) {
                  const existing = (machineFields || []).find((ef: any) => (ef.name === f.name || ef.label === f.label) && ef.machineType === f.machineType);
                  if (!existing) {
                    await (db as any).machine_fields.create(f);
                  }
                }

                alert('✅ Champs et options vérifiés et initialisés avec succès !');
                await fetchMachineFields();
                await fetchMachineFieldOptions();
              } catch (e: any) {
                alert('Erreur: ' + (e.message || 'Erreur inconnue'));
              } finally {
                setLoading(false);
              }
            }}
          >
            🚀 Initialiser les champs par défaut
          </Button>
        </div>
      </Card>

      {/* 🔐 PARAMÉTRAGE EMAIL DEMANDE DE NOUVEAU MOT DE PASSE (PAGE DE CONNEXION) */}
      <Card className="p-4 sm:p-5 border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs mt-0.5 flex-shrink-0">
              <KeyRound size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Email de demande de nouveau mot de passe (Page de connexion)
                </h3>
                <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Page de connexion
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Cette adresse email est affichée publiquement sur la page de connexion et dans la rubrique « Mot de passe oublié » pour permettre aux techniciens d'adresser leurs demandes.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-full sm:min-w-[340px] lg:min-w-[380px]">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={passwordRequestEmail}
                onChange={(e) => setPasswordRequestEmailState(e.target.value)}
                placeholder="contact@appalacarte.fr"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-800"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                onClick={() => handleSavePasswordRequestEmail()}
                disabled={!passwordRequestEmail.trim()}
                className="py-2 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                <Save size={15} />
                <span>Enregistrer</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleResetPasswordRequestEmail}
                className="py-2 px-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-200"
                title="Rétablir l'adresse par défaut (contact@appalacarte.fr)"
              >
                Rétablir défaut
              </Button>
            </div>
          </div>
        </div>

        {emailSaveSuccess && (
          <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <span>
              Adresse enregistrée avec succès ! Elle est immédiatement affichée sur la page de connexion :{' '}
              <strong className="font-semibold underline">{passwordRequestEmail}</strong>.
            </span>
          </div>
        )}
      </Card>

      {/* Table Tabs */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(tableConfigs) as TableType[]).map((table) => (
            <button
              key={table}
              onClick={() => {
                if (table === 'languages') {
                  onNavigate?.('language-config');
                } else if (table === 'translations') {
                  onNavigate?.('translation-editor');
                } else {
                  setActiveTable(table);
                  setShowImporter(false);
                  setShowAddForm(false);
                }
              }}
              className={`px-3 py-2 text-sm md:text-base rounded-lg font-medium transition-colors ${activeTable === table
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {tableConfigs[table].name}
            </button>
          ))}
        </div>
        {/* ✅ Boutons Actions */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="secondary"
            onClick={() => {
              if (activeTable === 'maintenance_kits') {
                setShowKitImporter(!showKitImporter);
                setShowImporter(false);
              } else {
                setShowImporter(!showImporter);
                setShowKitImporter(false);
              }
              setShowAddForm(false);
            }}
            className="flex items-center gap-2 flex-1 sm:flex-none"
          >
            <Upload size={18} />
            Import CSV
          </Button>

          <Button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowImporter(false);
              setShowKitImporter(false);
              setFormData({});
            }}
            className="flex items-center gap-2 flex-1 sm:flex-none"
          >
            <Plus size={18} />
            Ajouter
          </Button>
        </div>

      </Card>

      {/* ✅ Formulaire d'ajout */}
      {showAddForm && getAddForm()}

      {/* ✅ Formulaire d'édition */}
      {showEditForm && getEditForm()}

      {/* CSV Importer */}
      {showImporter && !config?.useCustomImporter && (
        <CSVImporter
          tableName={config.name}
          columns={config.columns}
          onImport={config.onImport}
        />
      )}

      {/* Maintenance Kit Importer */}
      {showKitImporter && activeTable === 'maintenance_kits' && (
        <MaintenanceKitImporter
          onImport={async (kitData: any, tasksData: any[]) => {
            setLoading(true);
            let successCount = 0;
            const errors: string[] = [];

            try {
              console.log('📦 Import du kit :', kitData);
              console.log('📝 Import des tâches :', tasksData);

              // 1. Créer le Kit d'entretien
              const kitPayload = {
                ...kitData,
                actif: true
              };

              // On crée le kit
              const createdKit = await (db as any).maintenance_kits.create(kitPayload);
              console.log('✅ Kit créé avec ID:', createdKit._id || createdKit.id);
              successCount++;

              // 2. Créer les tâches associées
              if (tasksData && Array.isArray(tasksData) && tasksData.length > 0) {
                // Grouper les tâches par section pour calculer l'ordre
                const sectionCounters = new Map<string, number>();

                const tasksToCreate = tasksData.map((task) => {
                  // Générer section_id à partir du nom de section
                  const sectionId = task.Section
                    ? task.Section.toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '') // Enlever accents
                      .replace(/[^a-z0-9]+/g, '_')      // Remplacer espaces/chars spéciaux par _
                      .replace(/^_|_$/g, '')            // Enlever _ au début/fin
                    : 'section_inconnue';

                  // Calculer l'ordre dans la section
                  const currentOrder = (sectionCounters.get(sectionId) || 0) + 1;
                  sectionCounters.set(sectionId, currentOrder);

                  return {
                    kit_id: kitData.kitId,                    // Ex: kit_v300_2150025306_1
                    machine_type: kitData.machineType,        // Ex: V 300
                    kit_number: parseInt(kitData.kitNumber),  // Ex: 2150025306
                    service_number: kitData.serviceNumber,    // Ex: 1
                    section_id: sectionId,                    // Ex: station_de_detection
                    section_title: task.Section || 'Section inconnue',  // Ex: Station de détection
                    task_id: task.ID || `task_${Date.now()}_${Math.random()}`,  // Ex: DET_01
                    task_label: task.Description || '',       // Ex: Vérifier capteur
                    task_order: currentOrder,                 // Ex: 1, 2, 3...
                    is_critical: false,
                    estimated_duration: 5
                  };
                });

                // Création des tâches
                for (const taskPayload of tasksToCreate) {
                  try {
                    await (db as any).taches_entretien.create(taskPayload);
                    successCount++;
                  } catch (error: any) {
                    console.error('❌ Erreur création tâche:', error);
                    errors.push(`Erreur tâche ${taskPayload.task_id}: ${error.message}`);
                  }
                }

                console.log(`✅ ${tasksToCreate.length} tâches créées`);

                // Calculer les sections pour le résultat
                const sections = Array.from(sectionCounters.entries()).map(([section, count]) => ({
                  section,
                  count
                }));

                alert('✅ Import du Kit et des Tâches réussi !');
                setShowKitImporter(false);

                // 3. Rafraîchir les données
                await fetchMaintenanceKits();
                await fetchTachesEntretien();

                return { success: successCount, errors, duplicates: 0, sections };
              }

              // Retour par défaut si pas de tâches
              alert('✅ Kit créé sans tâches');
              setShowKitImporter(false);
              await fetchMaintenanceKits();
              return { success: successCount, errors, duplicates: 0 };

            } catch (error: any) {
              console.error('❌ Erreur lors de l\'import:', error);
              alert('Erreur lors de l\'import : ' + (error.message || 'Erreur inconnue'));
              errors.push(error.message || 'Erreur inconnue');
              return { success: successCount, errors, duplicates: 0 };
            } finally {
              setLoading(false);
            }
          }}
          onClose={() => {
            setShowKitImporter(false);
            fetchMaintenanceKits();
          }}
        />
      )}
      {/* Data Table */}
      <Card>
        <DataTable
          data={config.data}
          columns={config.columns}
          onEdit={(item: any) => {
            console.log('Edit:', item);
            if (activeTable === 'clients') {
              onNavigate?.('client-form', { clientId: item._id });
            } else if (activeTable === 'users') {
              setEditingItem(item);
              setFormData({
                ...item,
                nom: item.nom || '',
                prenom: item.prenom || '',
                email: item.email || '',
                telephone: item.telephone || '',
                numeroTechnicien: item.numeroTechnicien || item.numero_technicien || '',
                role: item.role || 'TECHNICIEN_CMS'
              });
              setShowEditForm(true);
              setShowAddForm(false);
              setShowImporter(false);
              setShowKitImporter(false);
            } else if (activeTable === 'error_codes') {
              setEditingItem(item);
              setFormData({
                ...item,
                alarme: item.alarme || item.Alarme || '',
                typeAlarme: item.typeAlarme || item.Type_alarme || item.type_alarme || '',
                chapitre: item.chapitre || item.Chapitre || '',
                titre: item.titre || item.Titre || '',
                cause: item.cause || item.Cause || '',
                action: item.action || item.Action || ''
              });
              setShowEditForm(true);
              setShowAddForm(false);
              setShowImporter(false);
              setShowKitImporter(false);
            } else if (activeTable === 'taches_entretien') {
              setEditingItem(item);
              setFormData({
                ...item,
                kitId: item.kitId || item.kit_id || '',
                machineType: item.machineType || item.machine_type || '',
                idTache: item.idTache || item.taskId || item.task_id || '',
                section: item.section || item.sectionTitle || item.section_title || '',
                description: item.description || item.taskLabel || item.task_label || '',
                ordre: item.ordre ?? item.taskOrder ?? item.task_order ?? 1
              });
              setShowEditForm(true);
              setShowAddForm(false);
              setShowImporter(false);
              setShowKitImporter(false);
            } else if (activeTable === 'machine_fields') {
              setEditingItem(item);
              setFormData({
                ...item,
                hasConditionalRules: !!item.conditionalRules,
                parentField: item.conditionalRules?.parentField || '',
                parentValue: item.conditionalRules?.parentValue || ''
              });
              setShowEditForm(true);
              setShowAddForm(false);
              setShowImporter(false);
              setShowKitImporter(false);
            } else if (activeTable === 'machine_field_options') {
              setEditingItem(item);
              setFormData({
                ...item,
                fieldId: item.fieldId || item.field_id || '',
                value: item.value || '',
                order: item.order ?? 0
              });
              setShowEditForm(true);
              setShowAddForm(false);
              setShowImporter(false);
              setShowKitImporter(false);
            }
          }}
          onDelete={config.onDelete}
        />
      </Card>
    </div>
  );
}