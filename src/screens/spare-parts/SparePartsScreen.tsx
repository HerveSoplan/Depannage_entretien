//SparePartsScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SearchBar, SearchBarSuggestion } from '../../components/common/SearchBar';
import { Plus, Package, AlertTriangle, Edit2, QrCode } from 'lucide-react';
import { useSpareParts } from '../../hooks/useSpareParts';

interface SparePartsScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export function SparePartsScreen({ onNavigate }: SparePartsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const { spareParts, loading, fetchSpareParts } = useSpareParts();

  useEffect(() => {
    fetchSpareParts({ limit: 100 });
  }, []);

  const partSuggestions = useMemo<SearchBarSuggestion[]>(() => {
    const list: SearchBarSuggestion[] = [];
    const seen = new Set<string>();

    spareParts.forEach(p => {
      if (p.designation && p.designation.trim()) {
        const val = p.designation.trim();
        const key = `des:${val.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: `des-${p._id}`,
            label: val,
            subLabel: [p.reference, `${p.prixUnitaire}€`, `Stock: ${p.stock}`].filter(Boolean).join(' • '),
            category: 'Désignation'
          });
        }
      }

      if (p.reference && p.reference.trim()) {
        const val = p.reference.trim();
        const key = `ref:${val.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: `ref-${p._id}`,
            label: val,
            subLabel: p.designation || 'Référence pièce',
            category: 'Référence'
          });
        }
      }
    });

    return list;
  }, [spareParts]);

  const filteredParts = spareParts.filter((part) => {
    const matchesSearch = 
      part.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.designation?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (filter === 'LOW_STOCK') {
      matchesFilter = part.stock > 0 && part.stock <= part.seuilAlerte;
    } else if (filter === 'OUT_OF_STOCK') {
      matchesFilter = part.stock === 0;
    }
    
    return matchesSearch && matchesFilter;
  });

  const getStockStatus = (stock: number, seuil: number) => {
    if (stock === 0) return { color: 'text-red-600', bg: 'bg-red-50', label: 'Rupture' };
    if (stock <= seuil) return { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Stock faible' };
    return { color: 'text-green-600', bg: 'bg-green-50', label: 'En stock' };
  };

  const totalValue = filteredParts.reduce((sum, part) => sum + (part.stock * part.prixUnitaire), 0);
  const lowStockCount = spareParts.filter(p => p.stock > 0 && p.stock <= p.seuilAlerte).length;
  const outOfStockCount = spareParts.filter(p => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pièces détachées</h1>
          <p className="text-gray-600 mt-1">Gestion du stock et des références</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => onNavigate('spare-part-form')}>
          <Plus size={20} />
          Ajouter une pièce
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <Package className="text-blue-600" size={32} />
            <div>
              <div className="text-2xl font-bold text-gray-900">{spareParts.length}</div>
              <div className="text-sm text-gray-600">Total références</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-green-600">€</span>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalValue.toFixed(0)}€</div>
              <div className="text-sm text-gray-600">Valeur totale stock</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-600" size={32} />
            <div>
              <div className="text-2xl font-bold text-gray-900">{lowStockCount}</div>
              <div className="text-sm text-gray-600">Stock faible</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={32} />
            <div>
              <div className="text-2xl font-bold text-gray-900">{outOfStockCount}</div>
              <div className="text-sm text-gray-600">Rupture</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          suggestions={partSuggestions}
          onSelectSuggestion={(item) => {
            const val = typeof item === 'string' ? item : item.label;
            setSearchQuery(val);
          }}
          placeholder="Rechercher par référence ou désignation..."
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'ALL' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('ALL')}
          >
            Toutes
          </Button>
          <Button
            variant={filter === 'LOW_STOCK' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('LOW_STOCK')}
          >
            Stock faible
          </Button>
          <Button
            variant={filter === 'OUT_OF_STOCK' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('OUT_OF_STOCK')}
          >
            Rupture
          </Button>
        </div>
      </div>

      {/* QR Scanner */}
      {showQRScanner && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <QrCode className="text-blue-600" size={32} />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Scanner QR Code</h3>
              <p className="text-sm text-gray-600">
                Scannez le code-barre d'une pièce pour la rechercher instantanément
              </p>
            </div>
            <input
              type="text"
              placeholder="Entrez ou scannez le code-barre..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => setSearchQuery(e.target.value)}
              value={searchQuery}
              autoFocus
            />
          </div>
        </Card>
      )}

      {/* Parts List */}
      {loading ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">Chargement des pièces...</p>
        </Card>
      ) : filteredParts.length === 0 ? (
        <Card className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">
            {searchQuery ? 'Aucune pièce trouvée' : 'Aucune pièce enregistrée'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParts.map((part) => {
            const status = getStockStatus(part.stock, part.seuilAlerte);
            return (
              <Card 
                key={part._id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onNavigate('spare-part-detail', { partId: part._id })}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{part.designation}</h3>
                      <p className="text-sm text-gray-600">Réf: {part.reference}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Stock info */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <div className="text-sm text-gray-600">Stock</div>
                      <div className="text-lg font-bold text-gray-900">{part.stock}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Seuil</div>
                      <div className="text-lg font-bold text-gray-900">{part.seuilAlerte}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Prix unitaire</span>
                      <span className="text-lg font-bold text-blue-600">{part.prixUnitaire}€</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-600">Valeur stock</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(part.stock * part.prixUnitaire).toFixed(2)}€
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onNavigate('spare-part-form', { sparePartId: part._id })}
                    >
                      <Edit2 size={16} className="mr-1" />
                      Modifier
                    </Button>
                    <Button variant="primary" size="sm" className="flex-1">
                      Commander
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
