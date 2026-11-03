// MachineTasksView.tsx
// Vue de saisie des tâches pour UNE machine
// Le technicien voit TOUTES les tâches de tous les techniciens
// Et toutes les heures s'additionnent par catégorie et par technicien avec le total machine

import React, { useState, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle,
  Edit2,
  Trash2,
  Users,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TÂCHES / CATÉGORIES OBLIGATOIRES
// ═══════════════════════════════════════════════════════════════
const TACHES_OBLIGATOIRES = [
  { id: 'oblig_electricite_generale', description: 'Électricité générale', obligatoire: true },
  { id: 'oblig_plomberie_generale', description: 'Plomberie générale', obligatoire: true },
  { id: 'oblig_electricite_machine', description: 'Électricité machine', obligatoire: true },
  { id: 'oblig_plomberie_machine', description: 'Plomberie machine', obligatoire: true },
  { id: 'oblig_frigoriste', description: 'Frigoriste', obligatoire: true },
  { id: 'oblig_monteur_machine', description: 'Monteur machine', obligatoire: true },
  { id: 'oblig_tuyauterie_inox', description: 'Tuyauterie inox', obligatoire: true },
  { id: 'oblig_prt', description: 'PRT', obligatoire: true },
  { id: 'oblig_vis', description: 'Vis', obligatoire: true },
  { id: 'oblig_circulation', description: 'Circulation', obligatoire: true },
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const genId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2);

const formatHeures = (heures: number) => {
  const safe = typeof heures === 'number' && !isNaN(heures) ? Math.max(0, heures) : 0;
  const h = Math.floor(safe);
  const m = Math.round((safe - h) * 60);
  return m > 0 ? `${h}h ${m.toString().padStart(2, '0')}min` : `${h}h 00min`;
};

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════
interface MachineTasksViewProps {
  machine: any; // Machine avec heuresParTechnicien
  currentUser: any;
  installationData: any;
  onBack: () => void;
  onSave: (updatedMachine: any) => void;
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export function MachineTasksView({
  machine,
  currentUser,
  installationData,
  onBack,
  onSave
}: MachineTasksViewProps) {
  const [localMachine, setLocalMachine] = useState(machine);
  const [editingTacheId, setEditingTacheId] = useState<string | null>(null);
  const [heuresValue, setHeuresValue] = useState<string>('');
  const [showAddTache, setShowAddTache] = useState(false);
  const [nouvelleTacheDesc, setNouvelleTacheDesc] = useState('');
  const [showSyntheseCategories, setShowSyntheseCategories] = useState(true);

  const isTerminee = installationData.statut === 'TERMINEE';
  const currentUserId = currentUser?._id || currentUser?.id || 'usr-tech';
  const currentUserName =
    (currentUser ? `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() : '') ||
    currentUser?.email ||
    'Technicien';
  const currentUserRole = currentUser?.role || 'Technicien';

  // ═══════════════════════════════════════════════════════════════
  // OBTENIR OU CRÉER LE TECHNICIEN ACTUEL SUR CETTE MACHINE
  // ═══════════════════════════════════════════════════════════════
  const getTechnicienActuel = () => {
    let heuresParTech = localMachine.heuresParTechnicien || [];
    let tech = heuresParTech.find((t: any) => t.technicienId === currentUserId);

    if (!tech) {
      // Créer le technicien avec les tâches obligatoires
      tech = {
        technicienId: currentUserId,
        technicienNom: currentUserName,
        specialite: currentUserRole,
        taches: TACHES_OBLIGATOIRES.map((t) => ({
          id: t.id,
          description: t.description,
          heures: 0,
          obligatoire: true,
          dateCreation: new Date().toISOString(),
          dateDerniereModification: new Date().toISOString()
        }))
      };
      heuresParTech = [...heuresParTech, tech];

      const updated = { ...localMachine, heuresParTechnicien: heuresParTech };
      setLocalMachine(updated);
      onSave(updated);
    }

    return tech;
  };

  const techActuel = getTechnicienActuel();

  // ═══════════════════════════════════════════════════════════════
  // CALCULS CUMULÉS PAR CATÉGORIE POUR CETTE MACHINE
  // ═══════════════════════════════════════════════════════════════
  const categoriesMachine = useMemo(() => {
    const map = new Map<
      string,
      {
        description: string;
        totalHeures: number;
        contributeurs: Array<{ nom: string; heures: number; isMe: boolean }>;
      }
    >();

    (localMachine.heuresParTechnicien || []).forEach((tech: any) => {
      const isMe = tech.technicienId === currentUserId;
      const techNom = tech.technicienNom || (isMe ? 'Vous' : 'Technicien');

      (tech.taches || []).forEach((tach: any) => {
        const desc = (tach.description || 'Tâche').trim();
        const rawH = parseFloat(tach.heures);
        const h = !isNaN(rawH) && rawH > 0 ? Math.round(rawH * 10) / 10 : 0;

        if (!map.has(desc)) {
          map.set(desc, {
            description: desc,
            totalHeures: 0,
            contributeurs: []
          });
        }

        if (h > 0) {
          const catObj = map.get(desc)!;
          catObj.totalHeures = Math.round((catObj.totalHeures + h) * 10) / 10;
          catObj.contributeurs.push({
            nom: techNom,
            heures: h,
            isMe
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalHeures - a.totalHeures);
  }, [localMachine.heuresParTechnicien, currentUserId]);

  const categoriesMachineMap = useMemo(() => {
    const m = new Map<
      string,
      { totalHeures: number; contributeurs: Array<{ nom: string; heures: number; isMe: boolean }> }
    >();
    categoriesMachine.forEach((c) => {
      m.set(c.description, { totalHeures: c.totalHeures, contributeurs: c.contributeurs });
    });
    return m;
  }, [categoriesMachine]);

  // ═══════════════════════════════════════════════════════════════
  // MODIFIER LES HEURES D'UNE TÂCHE
  // ═══════════════════════════════════════════════════════════════
  const handleEditHeures = (tacheId: string, currentHeures: number) => {
    setEditingTacheId(tacheId);
    setHeuresValue(currentHeures.toString());
  };

  const handleQuickAddHeures = (tacheId: string, delta: number) => {
    const heuresParTech = (localMachine.heuresParTechnicien || []).map((t: any) => {
      if (t.technicienId === currentUserId) {
        return {
          ...t,
          taches: (t.taches || []).map((tache: any) => {
            if (tache.id === tacheId) {
              const current = parseFloat(tache.heures || 0);
              const next = Math.max(0, Math.round((current + delta) * 10) / 10);
              return { ...tache, heures: next, dateDerniereModification: new Date().toISOString() };
            }
            return tache;
          })
        };
      }
      return t;
    });

    const updated = { ...localMachine, heuresParTechnicien: heuresParTech };
    setLocalMachine(updated);
    onSave(updated);
  };

  const handleSaveHeures = (tacheId: string) => {
    const heures = parseFloat(heuresValue);
    if (isNaN(heures) || heures < 0) {
      alert('❌ Valeur invalide');
      return;
    }

    const heuresParTech = (localMachine.heuresParTechnicien || []).map((t: any) => {
      if (t.technicienId === currentUserId) {
        return {
          ...t,
          taches: (t.taches || []).map((tache: any) =>
            tache.id === tacheId
              ? { ...tache, heures: Math.round(heures * 10) / 10, dateDerniereModification: new Date().toISOString() }
              : tache
          )
        };
      }
      return t;
    });

    const updated = { ...localMachine, heuresParTechnicien: heuresParTech };
    setLocalMachine(updated);
    onSave(updated);
    setEditingTacheId(null);
    setHeuresValue('');
  };

  // ═══════════════════════════════════════════════════════════════
  // AJOUTER UNE TÂCHE PERSONNALISÉE
  // ═══════════════════════════════════════════════════════════════
  const handleAjouterTache = () => {
    if (!nouvelleTacheDesc.trim()) {
      alert('❌ Veuillez entrer une description');
      return;
    }

    const nouvelleTache = {
      id: genId(),
      description: nouvelleTacheDesc.trim(),
      heures: 0,
      obligatoire: false,
      dateCreation: new Date().toISOString(),
      dateDerniereModification: new Date().toISOString()
    };

    const heuresParTech = (localMachine.heuresParTechnicien || []).map((t: any) => {
      if (t.technicienId === currentUserId) {
        return {
          ...t,
          taches: [...(t.taches || []), nouvelleTache]
        };
      }
      return t;
    });

    const updated = { ...localMachine, heuresParTechnicien: heuresParTech };
    setLocalMachine(updated);
    onSave(updated);
    setNouvelleTacheDesc('');
    setShowAddTache(false);
  };

  // ═══════════════════════════════════════════════════════════════
  // SUPPRIMER UNE TÂCHE (seulement non obligatoires)
  // ═══════════════════════════════════════════════════════════════
  const handleSupprimerTache = (tacheId: string) => {
    if (!confirm('Supprimer cette tâche ?')) return;

    const heuresParTech = (localMachine.heuresParTechnicien || []).map((t: any) => {
      if (t.technicienId === currentUserId) {
        return {
          ...t,
          taches: (t.taches || []).filter((tache: any) => tache.id !== tacheId)
        };
      }
      return t;
    });

    const updated = { ...localMachine, heuresParTechnicien: heuresParTech };
    setLocalMachine(updated);
    onSave(updated);
  };

  // ═══════════════════════════════════════════════════════════════
  // VALIDER (RETOUR)
  // ═══════════════════════════════════════════════════════════════
  const handleValider = () => {
    onBack();
  };

  // ═══════════════════════════════════════════════════════════════
  // CALCULER TOTAUX
  // ═══════════════════════════════════════════════════════════════
  const calculerTotalTechnicien = (tech: any) => {
    return (tech.taches || []).reduce((sum: number, t: any) => sum + (parseFloat(t.heures) || 0), 0);
  };

  const totalMachine = (localMachine.heuresParTechnicien || []).reduce((sum: number, tech: any) => {
    return sum + calculerTotalTechnicien(tech);
  }, 0);

  const totalTechActuel = calculerTotalTechnicien(techActuel);
  const nbTechniciensActifs = (localMachine.heuresParTechnicien || []).filter(
    (t: any) => calculerTotalTechnicien(t) > 0
  ).length;

  // ═══════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header Sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-2 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Retour aux machines du montage</span>
          </button>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">🏭 {localMachine.nom}</h1>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded ${
                    localMachine.relationType === 'MAITRE'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {localMachine.relationType}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {localMachine.typeMachineNom} {localMachine.serie && `• N° Série: ${localMachine.serie}`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-gray-500 uppercase block">Total Machine</span>
              <span className="text-xl font-extrabold text-green-700 tabular-nums">
                {formatHeures(totalMachine)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Info Technicien Connecté */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 uppercase font-semibold mb-0.5">Saisie pour</p>
              <p className="text-lg font-bold text-blue-950">{techActuel.technicienNom}</p>
              <p className="text-xs text-blue-700">{techActuel.specialite}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-600 uppercase font-semibold mb-0.5">Vos heures sur cette machine</p>
              <p className="text-2xl font-black text-blue-900 tabular-nums">{formatHeures(totalTechActuel)}</p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-blue-200/70 text-xs text-blue-900 flex items-center gap-2">
            <span className="text-base">👥</span>
            <span>
              <strong>Collaboration multi-techniciens sur cette machine</strong> : plusieurs intervenants peuvent saisir leurs heures simultanément sur cette stalle. Chaque catégorie additionne les temps de tous les techniciens et sera collationnée sur le PDF final.
            </span>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════
            SYNTHÈSE CUMULÉE DE LA MACHINE PAR CATÉGORIE (TOUS TECHNICIENS)
        ═══════════════════════════════════════════════════════════════ */}
        <Card className="border-gray-200">
          <div
            onClick={() => setShowSyntheseCategories(!showSyntheseCategories)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Cumul de la machine par catégorie ({categoriesMachine.filter((c) => c.totalHeures > 0).length} active(s))
                </h2>
                <p className="text-xs text-gray-500">
                  Somme de toutes les heures enregistrées sur cette machine ({nbTechniciensActifs} technicien(s) actif(s))
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base font-extrabold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                Total : {formatHeures(totalMachine)}
              </span>
              <button type="button" className="text-gray-400 hover:text-gray-600 p-1">
                {showSyntheseCategories ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>

          {showSyntheseCategories && (
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
              {categoriesMachine.filter((c) => c.totalHeures > 0).length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">
                  Aucune heure enregistrée sur cette machine pour l'instant. Saisissez vos heures ci-dessous.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {categoriesMachine
                    .filter((c) => c.totalHeures > 0)
                    .map((cat) => (
                      <div
                        key={cat.description}
                        className="p-2.5 bg-gray-50/90 rounded-lg border border-gray-200 text-xs flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-bold text-gray-900">{cat.description}</span>
                          <span className="font-extrabold text-green-800 text-sm tabular-nums">
                            {formatHeures(cat.totalHeures)}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-600 flex flex-wrap gap-x-2 gap-y-0.5">
                          <span className="font-semibold text-gray-500">Détail :</span>
                          {cat.contributeurs.map((contrib, cIdx) => (
                            <span
                              key={cIdx}
                              className={contrib.isMe ? 'font-bold text-blue-700' : 'text-gray-700'}
                            >
                              {contrib.nom}: {formatHeures(contrib.heures)}
                              {cIdx < cat.contributeurs.length - 1 && ' •'}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ═══════════════════════════════════════════════════════════════
            VOS TÂCHES & SAISIE DES HEURES
        ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
                ✏️ Vos heures par catégorie
              </h2>
              <p className="text-xs text-gray-500">
                Renseignez vos heures pour chaque catégorie de travaux. Les cumuls avec vos collègues se mettent à jour automatiquement.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {techActuel.taches.map((tache: any) => {
              const catInfo = categoriesMachineMap.get(tache.description);
              const autresContributeurs = (catInfo?.contributeurs || []).filter(
                (c) => !c.isMe && c.heures > 0
              );
              const hasMultiTech = autresContributeurs.length > 0;

              return (
                <div
                  key={tache.id}
                  className={`p-3 rounded-lg border transition ${
                    tache.heures > 0
                      ? 'bg-green-50/70 border-green-200'
                      : hasMultiTech
                      ? 'bg-blue-50/40 border-blue-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {tache.heures > 0 ? (
                          <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                        ) : (
                          <Clock size={16} className="text-gray-400 flex-shrink-0" />
                        )}
                        <span
                          className={`font-semibold ${
                            tache.heures > 0 ? 'text-green-950 font-bold' : 'text-gray-800'
                          }`}
                        >
                          {tache.description}
                        </span>
                        {tache.obligatoire && (
                          <span className="text-[10px] uppercase font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            Standard
                          </span>
                        )}
                      </div>

                      {/* Saisie d'heures ou boutons rapides */}
                      {editingTacheId === tache.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={heuresValue}
                            onChange={(e) => setHeuresValue(e.target.value)}
                            autoFocus
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                            placeholder="Heures"
                          />
                          <span className="text-xs text-gray-600">heures</span>
                          <Button
                            onClick={() => handleSaveHeures(tache.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                          >
                            ✓ OK
                          </Button>
                          <Button
                            onClick={() => setEditingTacheId(null)}
                            variant="secondary"
                            className="px-3 py-1 text-xs"
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span
                            className={`text-lg font-extrabold tabular-nums ${
                              tache.heures > 0 ? 'text-green-700' : 'text-gray-400'
                            }`}
                          >
                            {formatHeures(tache.heures || 0)}
                          </span>
                          {!isTerminee && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleQuickAddHeures(tache.id, 0.5)}
                                className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                                title="Ajouter 30 minutes"
                              >
                                +0.5h
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAddHeures(tache.id, 1)}
                                className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                                title="Ajouter 1 heure"
                              >
                                +1h
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAddHeures(tache.id, 2)}
                                className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                                title="Ajouter 2 heures"
                              >
                                +2h
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditHeures(tache.id, tache.heures || 0)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 ml-1"
                              >
                                <Edit2 size={13} /> Saisir
                              </button>
                            </div>
                          )}
                          {!isTerminee && !tache.obligatoire && (
                            <button
                              type="button"
                              onClick={() => handleSupprimerTache(tache.id)}
                              className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 ml-auto"
                            >
                              <Trash2 size={13} /> Supprimer
                            </button>
                          )}
                        </div>
                      )}

                      {/* Info Cumul Machine si d'autres techniciens ont participé sur cette tâche */}
                      {hasMultiTech && (
                        <div className="mt-2 p-2 bg-indigo-50/80 border border-indigo-100 rounded text-xs text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-indigo-800">👥 Cumul machine sur cette catégorie :</span>
                            <span className="font-black text-indigo-950 tabular-nums">
                              {formatHeures(catInfo?.totalHeures || 0)}
                            </span>
                          </div>
                          <span className="text-[11px] text-indigo-700">
                            (Vous : {formatHeures(tache.heures || 0)} •{' '}
                            {autresContributeurs
                              .map((c) => `${c.nom} : ${formatHeures(c.heures)}`)
                              .join(' • ')}
                            )
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ajouter tâche personnalisée */}
          {!isTerminee && (
            <div className="mt-4">
              {showAddTache ? (
                <div className="p-3 border border-blue-300 rounded-lg bg-blue-50">
                  <input
                    type="text"
                    value={nouvelleTacheDesc}
                    onChange={(e) => setNouvelleTacheDesc(e.target.value)}
                    placeholder="Nom de la nouvelle catégorie ou tâche spécifique..."
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2 text-sm bg-white"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAjouterTache()}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAjouterTache}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1 text-xs"
                    >
                      Ajouter
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddTache(false);
                        setNouvelleTacheDesc('');
                      }}
                      variant="secondary"
                      className="text-xs"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowAddTache(true)}
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2 text-xs"
                >
                  <Plus size={15} /> Ajouter une catégorie ou tâche personnalisée
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* ═══════════════════════════════════════════════════════════════
            AUTRES TECHNICIENS SUR CETTE MACHINE
        ═══════════════════════════════════════════════════════════════ */}
        {(localMachine.heuresParTechnicien || [])
          .filter((t: any) => t.technicienId !== currentUserId)
          .map((tech: any) => {
            const totalTech = calculerTotalTechnicien(tech);
            if (totalTech === 0) return null;

            return (
              <Card key={tech.technicienId} className="bg-gray-50 border-gray-200">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{tech.technicienNom}</p>
                      <p className="text-[11px] text-gray-500">{tech.specialite}</p>
                    </div>
                  </div>
                  <span className="text-base font-bold text-gray-800 tabular-nums">
                    {formatHeures(totalTech)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {(tech.taches || [])
                    .filter((t: any) => parseFloat(t.heures) > 0)
                    .map((tache: any) => (
                      <div
                        key={tache.id}
                        className="flex items-center justify-between text-xs p-1.5 bg-white rounded border border-gray-100"
                      >
                        <span className="text-gray-700">{tache.description}</span>
                        <span className="font-bold text-gray-900 tabular-nums">
                          {formatHeures(tache.heures)}
                        </span>
                      </div>
                    ))}
                </div>
              </Card>
            );
          })}
      </div>

      {/* Barre d'action fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg z-30">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[11px] text-gray-500 block">Total machine calculé</span>
            <span className="text-base font-black text-green-700 tabular-nums">
              {formatHeures(totalMachine)}
            </span>
          </div>
          <Button
            onClick={handleValider}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold shadow-sm"
          >
            <CheckCircle size={17} /> Valider et retour aux machines
          </Button>
        </div>
      </div>
    </div>
  );
}
