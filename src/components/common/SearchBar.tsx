// src/components/common/SearchBar.tsx
import React, { useState, useRef, useEffect, useId } from 'react';
import { Search, X, CornerDownLeft, Sparkles } from 'lucide-react';
import { normalizeForSearch, getHighlightedSegments } from '../../utils/autocomplete';

export interface SearchBarSuggestion {
  id?: string;
  label: string;
  subLabel?: string;
  category?: string;
  badge?: string;
}

export type SuggestionItem = string | SearchBarSuggestion;

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  suggestions?: SuggestionItem[];
  onSelectSuggestion?: (item: SuggestionItem) => void;
  autoFocus?: boolean;
  clearable?: boolean;
  disabled?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Rechercher...',
  className = '',
  suggestions = [],
  onSelectSuggestion,
  autoFocus = false,
  clearable = true,
  disabled = false
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const datalistId = useId();

  const query = value ?? '';

  // Filtrer les suggestions qui correspondent à la saisie au fur et à mesure de l'écriture
  const filteredSuggestions = React.useMemo(() => {
    if (!suggestions || suggestions.length === 0) return [];

    const normQuery = normalizeForSearch(query);
    if (!normQuery) {
      // Afficher un échantillon des premières suggestions au focus
      return suggestions.slice(0, 7);
    }

    const startsWithMatches: SuggestionItem[] = [];
    const containsMatches: SuggestionItem[] = [];

    for (const item of suggestions) {
      const label = typeof item === 'string' ? item : item.label;
      const subLabel = typeof item === 'string' ? '' : (item.subLabel || '');
      const normLabel = normalizeForSearch(label);
      const normSub = normalizeForSearch(subLabel);

      if (normLabel.startsWith(normQuery)) {
        startsWithMatches.push(item);
      } else if (normLabel.includes(normQuery) || normSub.includes(normQuery)) {
        containsMatches.push(item);
      }
    }

    return [...startsWithMatches, ...containsMatches].slice(0, 8);
  }, [suggestions, query]);

  // Calcul du texte fantôme (ghost text inline) pour accélérer la saisie
  const ghostCompletion = React.useMemo(() => {
    if (!query || query.trim() === '' || filteredSuggestions.length === 0) return '';
    const first = filteredSuggestions[0];
    const firstLabel = typeof first === 'string' ? first : first.label;
    const normFirst = normalizeForSearch(firstLabel);
    const normQuery = normalizeForSearch(query);

    if (normFirst.startsWith(normQuery) && normFirst.length > normQuery.length) {
      // Conserver la casse d'origine du suffixe de la suggestion
      return query + firstLabel.slice(query.length);
    }
    return '';
  }, [query, filteredSuggestions]);

  // Fermer les suggestions au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sélectionner une suggestion
  const handleSelect = (item: SuggestionItem) => {
    const label = typeof item === 'string' ? item : item.label;
    onChange(label);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    }
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Gestion des raccourcis clavier pour naviguer à toute vitesse
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && filteredSuggestions.length > 0) {
        setIsOpen(true);
        setSelectedIndex(0);
      } else if (filteredSuggestions.length > 0) {
        setSelectedIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen && filteredSuggestions.length > 0) {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
      }
    } else if (e.key === 'Tab' || (e.key === 'ArrowRight' && inputRef.current?.selectionEnd === query.length)) {
      // Complétion rapide avec Tab ou Flèche Droite
      if (ghostCompletion && ghostCompletion !== query) {
        e.preventDefault();
        onChange(ghostCompletion);
        setIsOpen(false);
      } else if (isOpen && selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        e.preventDefault();
        handleSelect(filteredSuggestions[selectedIndex]);
      }
    } else if (e.key === 'Enter') {
      if (isOpen && selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        e.preventDefault();
        handleSelect(filteredSuggestions[selectedIndex]);
      } else if (isOpen && filteredSuggestions.length > 0 && query.trim() !== '') {
        // Valider la première suggestion si ouverte
        e.preventDefault();
        handleSelect(filteredSuggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Conteneur de saisie avec ghost text en arrière-plan */}
      <div className="relative flex items-center">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors group-focus-within:text-blue-500"
          size={18}
        />

        {/* Texte fantôme inline en filigrane (visible uniquement si l'input a le focus et commence par la suggestion) */}
        {isOpen && ghostCompletion && (
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 w-full h-full pl-10 pr-10 py-2.5 text-sm text-gray-400 pointer-events-none select-none flex items-center overflow-hidden font-normal"
          >
            <span className="invisible">{query}</span>
            <span className="opacity-60">{ghostCompletion.slice(query.length)}</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (filteredSuggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
        />

        {/* Bouton d'effacement rapide */}
        {clearable && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Effacer la recherche"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Menu déroulant des suggestions au fur et à mesure de l'écriture */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 bg-gray-50 flex items-center justify-between text-[11px] font-medium text-gray-500">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-blue-500" />
              Suggestions automatiques
            </span>
            <span className="hidden sm:inline text-gray-400">
              <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[10px]">Tab</kbd> ou <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[10px]">Entrée</kbd> pour valider
            </span>
          </div>

          <ul className="max-h-72 overflow-y-auto py-1">
            {filteredSuggestions.map((item, idx) => {
              const label = typeof item === 'string' ? item : item.label;
              const subLabel = typeof item === 'string' ? undefined : item.subLabel;
              const category = typeof item === 'string' ? undefined : item.category;
              const isSelected = idx === selectedIndex;
              const { before, match, after } = getHighlightedSegments(label, query);

              return (
                <li
                  key={typeof item === 'string' ? `${item}-${idx}` : (item.id || `${item.label}-${idx}`)}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Empêcher la perte du focus avant la sélection
                    handleSelect(item);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2 truncate">
                      <span className="truncate">
                        {match ? (
                          <>
                            {before}
                            <span className="text-blue-600 font-bold underline decoration-blue-300">{match}</span>
                            {after}
                          </>
                        ) : (
                          label
                        )}
                      </span>

                      {category && (
                        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-700 whitespace-nowrap">
                          {category}
                        </span>
                      )}
                    </div>

                    {subLabel && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {subLabel}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <CornerDownLeft size={14} className="text-blue-500 shrink-0" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
