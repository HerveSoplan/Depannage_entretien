// src/components/common/Input.tsx
import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { CornerDownLeft, Sparkles, X } from 'lucide-react';
import {
  getSuggestionsForField,
  saveLearnedValue,
  getHighlightedSegments,
  normalizeForSearch
} from '../../utils/autocomplete';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  suggestions?: string[];
  enableAutoSuggest?: boolean;
  suggestCategory?: string;
  onSelectSuggestion?: (value: string) => void;
}

export function Input({
  label,
  error,
  helperText,
  className = '',
  suggestions: customSuggestions,
  enableAutoSuggest = true,
  suggestCategory,
  onSelectSuggestion,
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  type = 'text',
  name,
  id,
  placeholder,
  ...props
}: InputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const datalistId = useId();

  // Ne pas activer l'auto-suggestion sur les mots de passe, fichiers, checkboxes, radios, dates
  const isSuggestableType = !['password', 'file', 'checkbox', 'radio', 'hidden', 'date', 'datetime-local', 'time'].includes(type);
  const shouldSuggest = enableAutoSuggest && isSuggestableType && !props.readOnly && !props.disabled;

  // Clé d'identification du champ pour l'apprentissage et le dictionnaire
  const fieldKey = suggestCategory || name || id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '') : '') || placeholder || 'general';

  const currentValue = typeof value === 'string' ? value : (typeof value === 'number' ? String(value) : '');

  // Calcul dynamique des suggestions correspondantes en temps réel
  const activeSuggestions = useMemo(() => {
    if (!shouldSuggest) return [];
    return getSuggestionsForField({
      fieldKey,
      label,
      customSuggestions,
      query: currentValue,
      maxResults: 6
    });
  }, [shouldSuggest, fieldKey, label, customSuggestions, currentValue]);

  // Ghost completion pour pré-remplissage rapide en un appui sur Tab / Flèche droite
  const ghostCompletion = useMemo(() => {
    if (!shouldSuggest || !currentValue || currentValue.trim() === '' || activeSuggestions.length === 0) {
      return '';
    }
    const first = activeSuggestions[0];
    const normFirst = normalizeForSearch(first);
    const normCurrent = normalizeForSearch(currentValue);

    if (normFirst.startsWith(normCurrent) && normFirst.length > normCurrent.length) {
      return currentValue + first.slice(currentValue.length);
    }
    return '';
  }, [shouldSuggest, currentValue, activeSuggestions]);

  // Fermer le menu lors d'un clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Application d'une suggestion avec émission d'un événement Change synthétique conforme
  const applySuggestion = (suggestedValue: string) => {
    if (inputRef.current) {
      // Déclencher le setter natif pour React
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(inputRef.current, suggestedValue);
      } else {
        inputRef.current.value = suggestedValue;
      }

      // Émettre l'événement input / change pour propager au state React
      const event = new Event('input', { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }

    if (onChange) {
      // Créer un événement synthétique pour compatibilité avec onChange={(e) => ...}
      const syntheticEvent = {
        target: { value: suggestedValue, name: name || '' },
        currentTarget: { value: suggestedValue, name: name || '' }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }

    if (onSelectSuggestion) {
      onSelectSuggestion(suggestedValue);
    }

    // Mémoriser la valeur pour enrichir l'apprentissage
    if (shouldSuggest && suggestedValue) {
      saveLearnedValue(fieldKey, suggestedValue);
    }

    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (shouldSuggest && activeSuggestions.length > 0) {
      setIsOpen(true);
    }
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Mémoriser la valeur saisie si non vide
    if (shouldSuggest && currentValue && currentValue.trim().length >= 2) {
      saveLearnedValue(fieldKey, currentValue.trim());
    }
    if (onBlur) onBlur(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (shouldSuggest && isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < activeSuggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : activeSuggestions.length - 1));
        return;
      }
      if (e.key === 'Tab' || (e.key === 'ArrowRight' && inputRef.current?.selectionEnd === currentValue.length)) {
        if (ghostCompletion && ghostCompletion !== currentValue) {
          e.preventDefault();
          applySuggestion(ghostCompletion);
          return;
        }
        if (selectedIndex >= 0 && selectedIndex < activeSuggestions.length) {
          e.preventDefault();
          applySuggestion(activeSuggestions[selectedIndex]);
          return;
        }
      }
      if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < activeSuggestions.length) {
          e.preventDefault();
          applySuggestion(activeSuggestions[selectedIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSelectedIndex(-1);
        return;
      }
    } else if (shouldSuggest && e.key === 'ArrowDown' && activeSuggestions.length > 0) {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex(0);
      return;
    }

    if (onKeyDown) onKeyDown(e);
  };

  return (
    <div ref={containerRef} className="w-full relative">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Texte fantôme en arrière-plan pour autocomplétion rapide */}
        {isOpen && ghostCompletion && (
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 w-full h-full px-4 py-2 text-sm text-gray-400 pointer-events-none select-none flex items-center overflow-hidden font-normal"
          >
            <span className="invisible">{currentValue}</span>
            <span className="opacity-60">{ghostCompletion.slice(currentValue.length)}</span>
          </div>
        )}

        <input
          ref={inputRef}
          id={id}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          list={shouldSuggest ? datalistId : undefined}
          autoComplete={shouldSuggest ? 'on' : props.autoComplete}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            if (onChange) onChange(e);
            if (shouldSuggest) {
              setIsOpen(true);
              setSelectedIndex(-1);
            }
          }}
          className={`
            w-full px-4 py-2 border rounded-lg text-sm text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed transition-all
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
      </div>

      {/* Datalist HTML5 native pour claviers virtuels mobiles et tablettes */}
      {shouldSuggest && activeSuggestions.length > 0 && (
        <datalist id={datalistId}>
          {activeSuggestions.map((item, idx) => (
            <option key={`${item}-${idx}`} value={item} />
          ))}
        </datalist>
      )}

      {/* Menu déroulant élégant d'autocomplétion en direct */}
      {shouldSuggest && isOpen && activeSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-100 max-h-56 overflow-y-auto">
          <div className="px-3 py-1 bg-gray-50 flex items-center justify-between text-[11px] font-medium text-gray-500">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-blue-500" />
              Suggestions au fur et à mesure
            </span>
            <span className="text-[10px] text-gray-400 hidden sm:inline">
              <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded">Tab</kbd> pour valider
            </span>
          </div>

          <ul className="py-0.5">
            {activeSuggestions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const { before, match, after } = getHighlightedSegments(item, currentValue);

              return (
                <li
                  key={`${item}-${idx}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySuggestion(item);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                    isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <span className="truncate">
                    {match ? (
                      <>
                        {before}
                        <span className="text-blue-600 font-bold underline decoration-blue-200">{match}</span>
                        {after}
                      </>
                    ) : (
                      item
                    )}
                  </span>
                  {isSelected && (
                    <CornerDownLeft size={13} className="text-blue-500 shrink-0" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
