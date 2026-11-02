// src/screens/Dashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/common/Card';
import { SearchBar, SearchBarSuggestion } from '../components/common/SearchBar';
import { Button } from '../components/common/Button';
import { Calendar, Clock, MapPin, Plus, Users, Package, Wrench } from 'lucide-react';
import { INTERVENTION_TYPES } from '../constants';
import { useClients } from '../hooks/useClients';
import { useUsers } from '../hooks/useUsers';
import { useSpareParts } from '../hooks/useSpareParts';
import { useMaintenanceKits } from '../hooks/useMaintenanceKits';
import { useInterventions } from '../hooks/useInterventions';
import { useMachines } from '../hooks/useMachines';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrentUser } from '../hooks/useCurrentUser';

interface DashboardProps {
  onNavigate?: (screen: string, params?: any) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const { can } = useCurrentUser();

  const { clients, loading: loadingClients, fetchClients } = useClients();
  const { users, fetchUsers } = useUsers();
  const { spareParts, fetchSpareParts } = useSpareParts();
  const { maintenanceKits, fetchMaintenanceKits } = useMaintenanceKits();
  const { interventions, fetchInterventions } = useInterventions();
  const { machines, fetchMachines } = useMachines();

  // Contrôle strict des permissions : un profil CMS/technicien ne voit pas Utilisateurs ni Administration
  const canViewClients = can('view_clients');
  const canViewMachines = can('view_machines');
  const canViewInterventions = can('view_interventions');
  const canCreateInterventions = can('create_interventions');
  const canViewSpareParts = can('view_spare_parts');
  const canViewMaintenance = can('view_maintenance');
  const canViewUsers = can('view_users');

  useEffect(() => {
    const loadData = async () => {
      try {
        const promises: Promise<any>[] = [];
        if (canViewClients) promises.push(fetchClients({ limit: 100 }));
        // Chargement conditionnel strict : les utilisateurs ne sont chargés que si la permission est détenue
        if (canViewUsers) promises.push(fetchUsers());
        if (canViewSpareParts) promises.push(fetchSpareParts());
        if (canViewMaintenance) promises.push(fetchMaintenanceKits());
        if (canViewInterventions) promises.push(fetchInterventions({ limit: 100 }));
        if (canViewMachines) promises.push(fetchMachines({ limit: 100 }));

        await Promise.all(promises);
      } catch (error) {
        console.error('Erreur chargement données dashboard:', error);
      }
    };

    loadData();
  }, [canViewClients, canViewUsers, canViewSpareParts, canViewMaintenance, canViewInterventions, canViewMachines]);

  // Interventions du jour
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayInterventions = (interventions || []).filter((intervention) => {
    const interventionDate = new Date(intervention.dateDebut);
    interventionDate.setHours(0, 0, 0, 0);
    return interventionDate.getTime() === today.getTime();
  });

  // Suggestions dynamiques pour le tableau de bord
  const dashboardSuggestions = useMemo<SearchBarSuggestion[]>(() => {
    const list: SearchBarSuggestion[] = [];
    const seen = new Set<string>();

    (clients || []).forEach(c => {
      if (c.nomFerme && !seen.has(`f:${c.nomFerme.toLowerCase()}`)) {
        seen.add(`f:${c.nomFerme.toLowerCase()}`);
        list.push({
          id: `f-${c._id}`,
          label: c.nomFerme,
          subLabel: [c.numeroClient, c.ville].filter(Boolean).join(' • '),
          category: 'Client'
        });
      }
    });

    (spareParts || []).forEach(p => {
      if (p.designation && !seen.has(`p:${p.designation.toLowerCase()}`)) {
        seen.add(`p:${p.designation.toLowerCase()}`);
        list.push({
          id: `p-${p._id}`,
          label: p.designation,
          subLabel: `Réf: ${p.reference}`,
          category: 'Pièce'
        });
      }
    });

    return list.slice(0, 15);
  }, [clients, spareParts]);

  // Interventions en cours
  const activeInterventions = (interventions || []).filter((i) => i.statut === 'EN_COURS');

  // Fonction pour obtenir les infos d'une intervention
  const getInterventionDetails = (intervention: any) => {
    const client = clients.find((c) => c._id === intervention.clientId);
    const interventionMachines = machines.filter((m) =>
      intervention.machineIds?.includes(m._id)
    );
    return { client, machines: interventionMachines };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANIFIEE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'EN_COURS':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'TERMINEE':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'ANNULEE':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PLANIFIEE: t('intervention.planned', 'Planifiée'),
      EN_COURS: t('intervention.in_progress', 'En cours'),
      TERMINEE: t('intervention.completed', 'Terminée'),
      ANNULEE: t('intervention.cancelled', 'Annulée')
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title', 'Tableau de bord')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.overview', "Vue d'ensemble de vos interventions")}</p>
        </div>
        {canCreateInterventions && (
          <Button
            className="flex items-center gap-2 touch-manipulation"
            onClick={() => onNavigate?.('intervention-form')}
          >
            <Plus size={20} />
            {t('button.add', 'Ajouter')}
          </Button>
        )}
      </div>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        suggestions={dashboardSuggestions}
        onSelectSuggestion={(item) => {
          const val = typeof item === 'string' ? item : item.label;
          setSearchQuery(val);
        }}
        placeholder={t('button.search', 'Rechercher') || 'Rechercher'}
        className="max-w-md"
      />

      {/* Stats Cards - Filtrées selon les permissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {canViewInterventions && (
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
            onClick={() => onNavigate?.('interventions')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Interventions du jour</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{todayInterventions.length}</p>
              </div>
              <Calendar className="text-blue-600" size={40} />
            </div>
          </Card>
        )}

        {canViewInterventions && (
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
            onClick={() => onNavigate?.('interventions')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{activeInterventions.length}</p>
              </div>
              <Clock className="text-green-600" size={40} />
            </div>
          </Card>
        )}

        {canViewClients && (
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
            onClick={() => onNavigate?.('clients')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clients actifs</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{clients.length}</p>
              </div>
              <MapPin className="text-purple-600" size={40} />
            </div>
          </Card>
        )}

        {/* Visible uniquement si l'utilisateur possède l'habilitation sur la gestion des utilisateurs */}
        {canViewUsers && (
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
            onClick={() => onNavigate?.('users')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilisateurs</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{users.length}</p>
              </div>
              <Users className="text-orange-600" size={40} />
            </div>
          </Card>
        )}
      </div>

      {/* Database Stats - Pièces et Maintenance */}
      {(canViewSpareParts || canViewMaintenance) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {canViewSpareParts && (
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
              onClick={() => onNavigate?.('spare-parts')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pièces détachées</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{spareParts.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Stock total: {spareParts.reduce((sum, p) => sum + (p.stock || 0), 0)} unités
                  </p>
                </div>
                <Package className="text-indigo-600" size={36} />
              </div>
            </Card>
          )}

          {canViewMaintenance && (
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
              onClick={() => onNavigate?.('maintenance')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Kits d'entretien</p>
                  <p className="text-2xl font-bold text-teal-600 mt-1">{maintenanceKits.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Disponibles pour maintenance</p>
                </div>
                <Wrench className="text-teal-600" size={36} />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Interventions et historique */}
      {canViewInterventions && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Interventions et historique</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate?.('interventions')}
            >
              Voir toutes
            </Button>
          </div>

          {interventions.length === 0 ? (
            <Card><p className="text-gray-500">Aucune intervention enregistrée</p></Card>
          ) : (
            <div className="space-y-3">
              {interventions.slice(0, 10).map((intervention) => {
                const { client, machines: interventionMachines } = getInterventionDetails(intervention);

                return (
                  <Card
                    key={intervention._id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      if (!intervention._id) {
                        console.error('❌ Intervention sans ID détectée');
                        return;
                      }

                      if (intervention.statut === 'TERMINEE') {
                        onNavigate?.('intervention-detail', {
                          interventionId: intervention._id,
                          interventionData: intervention,
                          returnTo: 'dashboard'
                        });
                      } else {
                        onNavigate?.('intervention-form', {
                          interventionId: intervention._id
                        });
                      }
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      {/* En-tête avec statut et type */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{INTERVENTION_TYPES[intervention.type]?.icon || '🔧'}</span>
                          <div>
                            <p className="font-bold text-gray-900">
                              N° {intervention.numeroIntervention}
                            </p>
                            <p className="text-sm text-gray-600">
                              {INTERVENTION_TYPES[intervention.type]?.label || intervention.type}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${getStatusColor(intervention.statut)}`}>
                          {getStatusLabel(intervention.statut)}
                        </span>
                      </div>

                      {/* Informations client */}
                      {client && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Users size={16} className="text-gray-400" />
                          <span className="font-medium">{client.nom}</span>
                          <span className="text-sm text-gray-500">- {client.nomFerme}</span>
                        </div>
                      )}

                      {/* Machines */}
                      {interventionMachines.length > 0 && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Wrench size={16} className="text-gray-400" />
                          <span className="text-sm">
                            {interventionMachines.map((m) => m.nom).join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Date et durée */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{new Date(intervention.dateDebut).toLocaleDateString('fr-FR')}</span>
                        </div>
                        {intervention.duree && (
                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>{intervention.duree} min</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Liste des clients récents */}
      {canViewClients && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Clients récents</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate?.('clients')}
            >
              Voir tous
            </Button>
          </div>

          {loadingClients ? (
            <p className="text-gray-500">Chargement...</p>
          ) : clients.length === 0 ? (
            <Card><p className="text-gray-500">Aucun client enregistré</p></Card>
          ) : (
            <div className="space-y-3">
              {clients.slice(0, 5).map((client) => (
                <Card
                  key={client._id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onNavigate?.('client-detail', { clientId: client._id })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-lg">
                            {client.nom?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{client.nom}</p>
                          <p className="text-sm text-gray-600">{client.nomFerme}</p>
                          <p className="text-xs text-gray-500">
                            N° {client.numeroClient}
                          </p>
                        </div>
                      </div>
                    </div>
                    {canCreateInterventions && (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate?.('intervention-form', { clientId: client._id });
                          }}
                        >
                          Intervention
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
