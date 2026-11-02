//ClientsScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { SearchBar, SearchBarSuggestion } from '../../components/common/SearchBar';
import { Button } from '../../components/common/Button';
import { Plus, Users, Loader2 } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useMachines } from '../../hooks/useMachines';
import { useClientMessages } from '../../hooks/useClientMessages';
import { useSelectedClient } from '../../contexts/SelectedClientContext';
import { ClientDetailCard } from '../../components/domain/ClientDetailCard';

interface ClientsScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export function ClientsScreen({ onNavigate }: ClientsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [messagesEnabled, setMessagesEnabled] = useState(false); // ✅ NOUVEAU - Flag pour savoir si les messages fonctionnent
  const { clients, loading: loadingClients, fetchClients } = useClients();
  const { machines, fetchMachines } = useMachines();
  const { fetchMessages } = useClientMessages();
  const { setSelectedClient, clearSelectedClient } = useSelectedClient();

  // ✅ Chargement initial
  useEffect(() => {
    console.log('🔄 Chargement initial des données...');
    // ✅ NE PLUS effacer le client sélectionné pour permettre le pré-remplissage
    fetchClients({ filter: {}, limit: 100 });
    fetchMachines({ limit: 200 });

    // ✅ Test de connexion aux messages avec gestion d'erreur
    fetchMessages()
      .then(() => {
        console.log('✅ Messages activés');
        setMessagesEnabled(true);
      })
      .catch((err) => {
        console.warn('⚠️ Messages désactivés (permissions manquantes):', err);
        setMessagesEnabled(false);
      });
  }, []);

  useEffect(() => {
    if (machines.length > 0 && clients.length > 0) {
      console.log('📊 ÉTAT ACTUEL:');
      console.log('Total machines chargées:', machines.length);
      console.log('Total clients chargés:', clients.length);

      clients.forEach(client => {
        const count = machines.filter(m => m.clientId === client._id).length;
        console.log(`Client "${client.nom}" (${client._id}): ${count} machines`);
      });
    }
  }, [machines, clients]);

  // ✅ Rechargement au focus de la fenêtre
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Rechargement au focus...');
      fetchClients({ filter: {}, limit: 100 });
      fetchMachines({ limit: 200 });

      // ✅ Rafraîchir les messages seulement si activés
      if (messagesEnabled) {
        fetchMessages({}).catch(() => {
          console.warn('⚠️ Erreur rafraîchissement messages');
        });
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
  }, [messagesEnabled]);

  // ✅ Rafraîchissement automatique des messages toutes les 30 secondes
  useEffect(() => {
    // ✅ Ne lancer l'intervalle que si les messages sont activés
    if (!messagesEnabled) return;

    const interval = setInterval(() => {
      console.log('🔄 Rafraîchissement automatique des messages...');
      fetchMessages({}).catch(() => {
        console.warn('⚠️ Erreur rafraîchissement auto messages');
      });
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [messagesEnabled]);

  const getMachineCount = (clientId: string) => {
    return machines.filter(m => m.clientId === clientId).length;
  };

  // ✅ Suggestions dynamiques pour autocomplétion et pré-remplissage en direct
  const clientSuggestions = useMemo<SearchBarSuggestion[]>(() => {
    const list: SearchBarSuggestion[] = [];
    const seen = new Set<string>();

    clients.forEach(client => {
      // 1. Nom de la ferme
      if (client.nomFerme && client.nomFerme.trim()) {
        const val = client.nomFerme.trim();
        const key = `ferme:${val.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: `ferme-${client._id}`,
            label: val,
            subLabel: [client.numeroClient, client.ville].filter(Boolean).join(' • '),
            category: 'Ferme'
          });
        }
      }

      // 2. Nom du client / contact (s'il diffère du nom de ferme)
      if (client.nom && client.nom.trim() && client.nom.trim() !== client.nomFerme?.trim()) {
        const val = client.nom.trim();
        const key = `nom:${val.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: `client-${client._id}`,
            label: val,
            subLabel: [client.nomFerme, client.numeroClient, client.ville].filter(Boolean).join(' • '),
            category: 'Client'
          });
        }
      }

      // 3. Numéro de client
      if (client.numeroClient && client.numeroClient.trim()) {
        const val = client.numeroClient.trim();
        const key = `num:${val.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: `num-${client._id}`,
            label: val,
            subLabel: client.nomFerme || client.nom || 'Client',
            category: 'N° Client'
          });
        }
      }

      // 4. Ville de l'exploitation
      if (client.ville && client.ville.trim()) {
        const val = client.ville.trim();
        const key = `ville:${val.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: `ville-${client.ville}`,
            label: val,
            subLabel: 'Commune / Secteur',
            category: 'Ville'
          });
        }
      }
    });

    return list;
  }, [clients]);

  const filteredClients = searchQuery
    ? clients.filter(client =>
      client.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.nomFerme?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.numeroClient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.ville?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.adresse?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : clients.filter(client => getMachineCount(client._id) > 0);

  // ✅ Fonction de navigation avec feedback visuel et enregistrement du client
  const handleNavigateToClient = (screen: string, params: any) => {
    // ✅ Enregistrer le client dans le contexte global avant de naviguer
    if (params?.clientId) {
      const client = clients.find(c => c._id === params.clientId);
      if (client) {
        setSelectedClient(client);
      }
    }

    setIsNavigating(true);
    onNavigate(screen, params);
    setTimeout(() => setIsNavigating(false), 500);
  };

  return (
    <div className="space-y-6 relative">
      {/* Overlay de chargement */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <p className="text-xl font-bold text-gray-900">Chargement du client...</p>
          </div>
        </div>
      )}

      {/* ✅ NOUVEAU - Alerte si messages désactivés */}
      {!messagesEnabled && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-800">
            <span className="text-xl">⚠️</span>
            <p className="text-sm">
              <strong>Messages désactivés:</strong> Les permissions de la collection "clientmessages"
              doivent être configurées dans Lumi (NO_RESTRICTIONS pour read/insert/edit/delete)
            </p>
          </div>
        </Card>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Gérez vos clients et leurs machines</p>
        </div>
        <Button
          onClick={() => onNavigate('client-form')}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nouveau client
        </Button>
      </div>

      {/* Barre de recherche avec autocomplétion dynamique en direct */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        suggestions={clientSuggestions}
        onSelectSuggestion={(item) => {
          const val = typeof item === 'string' ? item : item.label;
          setSearchQuery(val);
        }}
        placeholder="Rechercher par nom, ferme, n° client, ville..."
        className="max-w-md"
      />

      {loadingClients ? (
        <Card className="text-center py-12">
          <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={48} />
          <p className="text-gray-500">Chargement des clients...</p>
        </Card>
      ) : filteredClients.length === 0 ? (
        <Card className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">
            {searchQuery ? 'Aucun client trouvé pour cette recherche' : 'Aucun client enregistré'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientDetailCard
              key={client._id}
              client={client}
              machinesCount={getMachineCount(client._id)}
              onViewDetails={() => handleNavigateToClient('client-detail', { clientId: client._id })}
              onViewMachines={() => handleNavigateToClient('machines', { clientId: client._id })}
              onCreateIntervention={() => handleNavigateToClient('intervention-form', { clientId: client._id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
