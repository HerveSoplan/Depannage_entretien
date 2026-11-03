import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { SearchBar, SearchBarSuggestion } from '../../components/common/SearchBar';
import { Button } from '../../components/common/Button';
import { Plus, Settings } from 'lucide-react';
import { useMachines } from '../../hooks/useMachines';
import { useClients } from '../../hooks/useClients';
import { MachineCard } from '../../components/domain/MachineCard';

interface MachinesScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  clientId?: string;
}

export function MachinesScreen({ onNavigate, clientId }: MachinesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const { machines, loading, fetchMachines } = useMachines();
  const { clients, fetchClients } = useClients();

  useEffect(() => {
    fetchMachines({ limit: 100 });
    fetchClients({ limit: 100 });
  }, []);

  const machineSuggestions = useMemo<SearchBarSuggestion[]>(() => {
    const list: SearchBarSuggestion[] = [];
    const seen = new Set<string>();

    machines.forEach(m => {
      if (m.nom && m.nom.trim()) {
        const val = m.nom.trim();
        const key = `nom:${val.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: `nom-${m._id}`,
            label: val,
            subLabel: [m.numeroSerie, m.marque, m.modele].filter(Boolean).join(' • '),
            category: 'Machine'
          });
        }
      }

      if (m.numeroSerie && m.numeroSerie.trim()) {
        const val = m.numeroSerie.trim();
        const key = `serie:${val.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: `serie-${m._id}`,
            label: val,
            subLabel: m.nom || 'Numéro de série',
            category: 'N° Série'
          });
        }
      }

      if (m.marque && m.marque.trim()) {
        const val = m.marque.trim();
        const key = `marque:${val.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: `marque-${val}`,
            label: val,
            subLabel: 'Marque',
            category: 'Marque'
          });
        }
      }
    });

    return list;
  }, [machines]);

  const dynamicMachineTypes = useMemo(() => {
    const types = new Set<string>();
    machines.forEach(m => {
      const t = m.typeMachine || m.type_machine || m.configType;
      if (t && t.trim() !== '') types.add(t.trim());
    });
    return Array.from(types).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [machines]);

  const filteredMachines = machines.filter(machine => {
    const matchesSearch =
      machine.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.numeroSerie?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.marque?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.modele?.toLowerCase().includes(searchQuery.toLowerCase());

    const machineType = (machine.typeMachine || machine.type_machine || machine.configType || '').toLowerCase();
    const machineRelation = (machine.typeRelation || '').toUpperCase();

    const matchesType = selectedType === 'all'
      || machineRelation === selectedType.toUpperCase()
      || machineType === selectedType.toLowerCase();

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Machines</h1>
          <p className="text-gray-600 mt-1">Gérez toutes les machines installées</p>
        </div>
        <Button
          onClick={() => onNavigate('machine-form', clientId ? { clientId } : undefined)}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nouvelle machine
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          suggestions={machineSuggestions}
          onSelectSuggestion={(item) => {
            const val = typeof item === 'string' ? item : item.label;
            setSearchQuery(val);
          }}
          placeholder="Rechercher par nom, n° série, marque..."
          className="flex-1"
        />
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="all">Tous les types & relations</option>
          <optgroup label="Types de machine">
            {dynamicMachineTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </optgroup>
          <optgroup label="Types de relation">
            <option value="MAITRE">Maître</option>
            <option value="ESCLAVE">Esclave</option>
            <option value="PARENT">Parent</option>
            <option value="ENFANT">Enfant</option>
          </optgroup>
        </select>
      </div>

      {loading ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">Chargement des machines...</p>
        </Card>
      ) : filteredMachines.length === 0 ? (
        <Card className="text-center py-12">
          <Settings size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">
            {searchQuery || selectedType !== 'all'
              ? 'Aucune machine trouvée pour ces critères'
              : 'Aucune machine enregistrée'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMachines.map((machine) => (
            <MachineCard
              key={machine._id}
              machine={machine}
              onSelect={() => onNavigate('machine-detail', { machineId: machine._id })}
              onEdit={() => onNavigate('machine-form', { machineId: machine._id })}
              onIntervention={() => onNavigate('intervention-form', { machineId: machine._id, clientId: machine.clientId })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
