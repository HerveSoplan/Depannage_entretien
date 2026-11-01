ClientFormScreen.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { TextArea } from '../../components/common/TextArea';
import {Save, ArrowLeft} from 'lucide-react';
import { db } from '../../lib/supabase';

interface ClientFormScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  clientId?: string;
}

export function ClientFormScreen({ onNavigate, clientId }: ClientFormScreenProps) {
  console.log('🔴🔴🔴 ÉCRAN CLIENT FORM CHARGÉ 🔴🔴🔴', { clientId, onNavigate });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    nomFerme: '',
    numeroClient: '',
    adresse: '',
    codePostal: '',
    ville: '',
    telephone: '',
    email: '',
    notes: ''
  });

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    setLoading(true);
    try {
      const { list } = await db.clients.list({
        filter: { _id: clientId }
      });
      
      if (list && list.length > 0) {
        const client = list[0];
        setFormData({
          nom: client.nom || '',
          prenom: client.prenom || '',
          nomFerme: client.nomFerme || '',
          numeroClient: client.numeroClient || '',
          adresse: client.adresse || '',
          codePostal: client.codePostal || '',
          ville: client.ville || '',
          telephone: client.telephone || '',
          email: client.email || '',
          notes: client.notes || ''
        });
        console.log('✅ Client chargé:', client);
      } else {
        throw new Error('Client non trouvé');
      }
    } catch (error) {
      console.error('❌ Erreur chargement client:', error);
      alert('Erreur lors du chargement du client');
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log('🟢🟢🟢 SOUMISSION FORMULAIRE 🟢🟢🟢', formData);
  setLoading(true);

  try {
    // Combiner nom et prénom en un seul champ
    const nomComplet = formData.prenom 
      ? `${formData.nom} ${formData.prenom}`.trim() 
      : formData.nom;

    const clientData = {
      nom: nomComplet,
      nomFerme: formData.nomFerme,
      numeroClient: formData.numeroClient,
      adresse: formData.adresse,
      codePostal: formData.codePostal,
      ville: formData.ville,
      telephone: formData.telephone,
      email: formData.email,
      notes: formData.notes,
      actif: true
    };

    if (clientId) {
      const updated = await db.clients.update(clientId, clientData);
      console.log('✅ Client mis à jour dans la base:', updated);
      alert('Client modifié avec succès !');
    } else {
      const created = await db.clients.create(clientData);
      console.log('✅ Client créé dans la base:', created);
      alert('Client créé avec succès !');
    }

    // Petit délai pour garantir la propagation en base
    await new Promise(resolve => setTimeout(resolve, 500));
    onNavigate('clients');
  } catch (error) {
    console.error('❌ Erreur enregistrement client:', error);
    console.error('Message:', error?.message);
    console.error('Details:', error?.details);
    alert('Erreur lors de l\'enregistrement');
  } finally {
    setLoading(false);
  }
};

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('clients')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {clientId ? 'Modifier le client' : 'Nouveau client'}
          </h1>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informations personnelles</h2>
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
                  label="Nom de la ferme"
                  value={formData.nomFerme}
                  onChange={(e) => setFormData(prev => ({ ...prev, nomFerme: e.target.value }))}
                  required
                />
                <Input
                  label="Numéro client"
                  value={formData.numeroClient}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroClient: e.target.value }))}
                  required
                  placeholder="Ex: CLI001"
                />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Adresse</h2>
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Code postal"
                    value={formData.codePostal}
                    onChange={(e) => setFormData(prev => ({ ...prev, codePostal: e.target.value }))}
                    required
                  />
                  <Input
                    label="Ville"
                    value={formData.ville}
                    onChange={(e) => setFormData(prev => ({ ...prev, ville: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Téléphone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <TextArea
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                placeholder="Informations complémentaires..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onNavigate('clients')}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save size={20} />
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
  );
}
