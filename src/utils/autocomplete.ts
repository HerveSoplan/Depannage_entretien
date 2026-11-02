// src/utils/autocomplete.ts
/**
 * Utilitaires pour l'autocomplétion, le pré-remplissage en direct
 * et l'apprentissage dynamique des valeurs saisies dans l'application.
 */

// Normalisation sans accents et en minuscules pour une recherche tolérante
export function normalizeForSearch(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Vérifie si une chaîne correspond à une requête de recherche
 */
export function matchesQuery(candidate: string, query: string): boolean {
  if (!candidate || !query) return false;
  const normCandidate = normalizeForSearch(candidate);
  const normQuery = normalizeForSearch(query);
  return normCandidate.includes(normQuery);
}

/**
 * Découpe une chaîne en segments pour mettre en surbrillance les lettres tapées
 */
export function getHighlightedSegments(text: string, query: string): { before: string; match: string; after: string } {
  if (!query || !text) {
    return { before: text, match: '', after: '' };
  }

  const normText = normalizeForSearch(text);
  const normQuery = normalizeForSearch(query);
  const index = normText.indexOf(normQuery);

  if (index === -1) {
    return { before: text, match: '', after: '' };
  }

  return {
    before: text.slice(0, index),
    match: text.slice(index, index + query.length),
    after: text.slice(index + query.length)
  };
}

// Clé de stockage localStorage pour l'historique d'autocomplétion
const STORAGE_KEY_PREFIX = 'app_ac_history_';

/**
 * Récupère les valeurs apprises enregistrées pour un champ donné
 */
export function getLearnedValues(fieldKey: string): string[] {
  if (typeof window === 'undefined' || !fieldKey) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${fieldKey.toLowerCase()}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Enregistre une valeur saisie par l'utilisateur pour enrichir les futures suggestions
 */
export function saveLearnedValue(fieldKey: string, value: string): void {
  if (typeof window === 'undefined' || !fieldKey || !value) return;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return;

  try {
    const key = `${STORAGE_KEY_PREFIX}${fieldKey.toLowerCase()}`;
    const current = getLearnedValues(fieldKey);
    // Placer la nouvelle valeur en tête, sans doublon (insensible à la casse)
    const filtered = current.filter(item => normalizeForSearch(item) !== normalizeForSearch(trimmed));
    const updated = [trimmed, ...filtered].slice(0, 30); // Limite à 30 suggestions
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Quota localStorage ou indisponible
  }
}

/**
 * Dictionnaires de suggestions par défaut selon le domaine métier de l'application
 * (élevage laitier, matériel agricole, dépannage, maintenance)
 */
export const FIELD_DICTIONARIES: Record<string, string[]> = {
  // Noms de fermes / exploitations types
  nomFerme: [
    'Ferme du Val',
    'GAEC des Prairies',
    'EARL de la Rivière',
    'GAEC des Chênes',
    'SCEA du Bocage',
    'Ferme des Peupliers',
    'GAEC de la Vallée',
    'EARL des Landes',
    'GAEC de l\'Horizon',
    'Ferme de Bellevue',
    'GAEC des Trois Ruisseaux',
    'EARL de la Métairie',
    'GAEC du Moulin',
    'Exploitation Agricole du Rocher'
  ],

  // Villes et communes fréquentes (bassins laitiers de référence)
  ville: [
    'Rennes',
    'Fougères',
    'Vitré',
    'Redon',
    'Saint-Malo',
    'Brest',
    'Quimper',
    'Morlaix',
    'Landerneau',
    'Saint-Brieuc',
    'Guingamp',
    'Dinan',
    'Loudéac',
    'Lamballe',
    'Vannes',
    'Lorient',
    'Pontivy',
    'Ploërmel',
    'Nantes',
    'Châteaubriant',
    'Ancenis',
    'Laval',
    'Mayenne',
    'Château-Gontier',
    'Saint-Lô',
    'Avranches',
    'Coutances',
    'Caen',
    'Vire',
    'Flers',
    'Alençon'
  ],

  // Codes postaux
  codePostal: [
    '35000', '35133', '35200', '35300', '35400', '35500', '35600',
    '22000', '22100', '22200', '22400', '22600',
    '29000', '29200', '29600', '29800',
    '56000', '56100', '56300', '56800',
    '44000', '44110', '44150',
    '53000', '53100', '53200',
    '50000', '50300', '14000', '14500', '61000'
  ],

  // Marques matériel d'élevage et de traite
  marque: [
    'DeLaval',
    'Lely',
    'GEA Farm Technologies',
    'BouMatic',
    'Fullwood Packo',
    'SAC Christensen',
    'WestfaliaSurge',
    'Mueller',
    'Serap',
    'Japy',
    'Prominox',
    'Manus',
    'Pellenc',
    'Kuhn'
  ],

  // Types de machines & équipements
  typeMachine: [
    'Robot de traite VMS',
    'Robot de traite Astronaut',
    'Salle de traite 2x4',
    'Salle de traite 2x6',
    'Salle de traite 2x8',
    'Salle de traite 2x10',
    'Salle de traite TPA',
    'Roto de traite',
    'Tank à lait 3000L',
    'Tank à lait 4000L',
    'Tank à lait 6000L',
    'Tank à lait 8000L',
    'Tank à lait 10000L',
    'Chauffe-eau thermodynamique',
    'Pompe à vide à palettes',
    'Pompe à vide à lobes',
    'Distributeur Automatique de Concentrés (DAC)',
    'Distributeur Automatique de Lait (DAL)',
    'Repousse-fourrage robotisé',
    'Racleur à lisier hydraulique',
    'Ventilateur de bâtiment',
    'Groupe froid / Condenseur',
    'Pompe de transfert de lait'
  ],

  // Modèles courants
  modele: [
    'VMS V300',
    'VMS V310',
    'Astronaut A4',
    'Astronaut A5',
    'Monobox',
    'DairyMaster',
    'DVP 1400',
    'DVP 2000',
    'Koolway',
    'First TC',
    'OptiDuo',
    'Vector'
  ],

  // Désignations pièces détachées
  designation: [
    'Manchon trayeur silicone',
    'Manchon trayeur caoutchouc',
    'Clapet anti-retour',
    'Joint couvercle de tank',
    'Joint pot trayeur',
    'Joint d\'union laitière DN50',
    'Tuyau à pulsation double 7x13',
    'Tuyau à lait silicone 16x28',
    'Tuyau à lait silicone 19x31',
    'Électrovanne de lavage 24V',
    'Pulsateur électronique EP100',
    'Bobine d\'électrovanne 24V DC',
    'Cartouche filtre à vide',
    'Filtre à lait chaussette 620x78',
    'Sonde de température PT100',
    'Sonde de niveau conductrice',
    'Palette graphite pompe à vide',
    'Bidon huile pour pompe à vide 5L',
    'Détergent alcalin chlore 25kg',
    'Détergent acide détartrant 25kg',
    'Résistance de chauffe-eau 6kW',
    'Contacteur tripolaire 24V AC',
    'Moteur réducteur racleur 0.75kW'
  ],

  // Emplacements stock
  emplacement: [
    'Atelier - Étagère A1',
    'Atelier - Étagère A2',
    'Atelier - Étagère B1',
    'Atelier - Tiroir C3',
    'Camionnette Technicien 1',
    'Camionnette Technicien 2',
    'Réserve Stock Principal',
    'Zone Lavage & Consommables'
  ],

  // Motifs d'intervention
  titreIntervention: [
    'Entretien préventif annuel robot',
    'Entretien semestriel salle de traite',
    'Dépannage d\'urgence - Arrêt traite',
    'Remplacement des manchons trayeurs',
    'Contrôle annuel débit de vide et pulsation',
    'Défaut de lavage eau chaude',
    'Alarme groupe froid tank à lait',
    'Remplacement pompe à vide',
    'Mise en service nouveau robot',
    'Vérification étalonnage compteurs à lait'
  ],

  // Types de pannes & diagnostics
  diagnostic: [
    'Fuite sur tuyau de transfert de lait',
    'Défaut d\'électrovanne de rinçage',
    'Pulsation irrégulière sur stalle',
    'Usure prononcée des palettes de pompe à vide',
    'Sonde de température hors tolérance',
    'Problème de communication bus CAN',
    'Entartrage circuit de chauffe',
    'Bouchage du filtre d\'aspiration',
    'R.A.S. - Contrôle conforme aux spécifications constructeur'
  ]
};

/**
 * Détermine la catégorie d'un champ selon son identifiant, nom ou label
 */
export function detectFieldCategory(fieldKey: string, label?: string): string {
  const combined = `${fieldKey} ${label || ''}`.toLowerCase();

  if (combined.includes('ferme') || combined.includes('exploitation')) return 'nomFerme';
  if (combined.includes('ville') || combined.includes('commune')) return 'ville';
  if (combined.includes('postal') || combined.includes('cp') || combined.includes('zip')) return 'codePostal';
  if (combined.includes('marque') || combined.includes('fabricant')) return 'marque';
  if (combined.includes('modele') || combined.includes('modèle')) return 'modele';
  if (combined.includes('type') && (combined.includes('mach') || combined.includes('equip'))) return 'typeMachine';
  if (combined.includes('designation') || combined.includes('piece') || combined.includes('pièce')) return 'designation';
  if (combined.includes('emplacement') || combined.includes('stock')) return 'emplacement';
  if (combined.includes('titre') || (combined.includes('interv') && combined.includes('motif'))) return 'titreIntervention';
  if (combined.includes('diag') || combined.includes('panne') || combined.includes('constat')) return 'diagnostic';

  return fieldKey;
}

/**
 * Fournit une liste fusionnée et dédoublonnée de suggestions pour un champ donné
 */
export function getSuggestionsForField({
  fieldKey,
  label,
  customSuggestions = [],
  query = '',
  maxResults = 8
}: {
  fieldKey: string;
  label?: string;
  customSuggestions?: string[];
  query?: string;
  maxResults?: number;
}): string[] {
  const category = detectFieldCategory(fieldKey, label);
  const learned = getLearnedValues(fieldKey);
  const learnedCategory = category !== fieldKey ? getLearnedValues(category) : [];
  const defaultDict = FIELD_DICTIONARIES[category] || [];

  // Fusion ordonnée : suggestions personnalisées > valeurs apprises récentes > dictionnaire par défaut
  const allCandidates: string[] = [
    ...customSuggestions,
    ...learned,
    ...learnedCategory,
    ...defaultDict
  ];

  // Dédoublonnage insensible à la casse
  const seen = new Set<string>();
  const uniqueCandidates: string[] = [];
  for (const item of allCandidates) {
    if (!item || typeof item !== 'string') continue;
    const norm = normalizeForSearch(item);
    if (!seen.has(norm)) {
      seen.add(norm);
      uniqueCandidates.push(item.trim());
    }
  }

  // Si pas de requête, retourner les premiers éléments les plus pertinents
  if (!query || query.trim() === '') {
    return uniqueCandidates.slice(0, maxResults);
  }

  const normQuery = normalizeForSearch(query);

  // Trier : ceux qui commencent par la requête en premier, puis ceux qui la contiennent
  const startsWithList: string[] = [];
  const containsList: string[] = [];

  for (const item of uniqueCandidates) {
    const normItem = normalizeForSearch(item);
    if (normItem === normQuery) {
      // Déjà tapé exactement
      continue;
    }
    if (normItem.startsWith(normQuery)) {
      startsWithList.push(item);
    } else if (normItem.includes(normQuery)) {
      containsList.push(item);
    }
  }

  return [...startsWithList, ...containsList].slice(0, maxResults);
}
