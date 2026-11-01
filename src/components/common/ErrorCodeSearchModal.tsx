// src/components/common/ErrorCodeSearchModal.tsx
import React, { useState, useEffect } from 'react';
import { useErrorCodes } from '../../hooks/useErrorCodes';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { X, Search, AlertCircle } from 'lucide-react';

interface ErrorCodeSearchModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (errorCodeData: any) => void;
  initialSearchTerm?: string;
}

export function ErrorCodeSearchModal({ isVisible, onClose, onSelect, initialSearchTerm = '' }: ErrorCodeSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState(''); 
  const { errorCodes, loading, fetchErrorCodes } = useErrorCodes();
  
  const renderTextWithLineBreaks = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  useEffect(() => {
    if (isVisible) {
      setSearchTerm(initialSearchTerm);
      if (initialSearchTerm) {
        fetchErrorCodes({ filter: { Alarme: { $regex: initialSearchTerm, $options: 'i' } } });
      }
    }
  }, [isVisible, initialSearchTerm, fetchErrorCodes]);

  useEffect(() => {
    if (isVisible && searchTerm && searchTerm !== initialSearchTerm) {
      fetchErrorCodes({ filter: { Alarme: { $regex: searchTerm, $options: 'i' } } });
    }
  }, [searchTerm, isVisible, fetchErrorCodes, initialSearchTerm]);

  if (!isVisible) {
    return null;
  }

  const hasInitialSearch = initialSearchTerm.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {hasInitialSearch ? `Résultats pour "${initialSearchTerm}"` : 'Rechercher un Code Erreur'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {!hasInitialSearch && (
          <div className="p-4">
            <Input
              placeholder="Ex: 8.16.7.25"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={20} />}
              autoFocus
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && <p className="text-center text-gray-500">Recherche en cours...</p>}
          
          {!loading && errorCodes.length === 0 && (initialSearchTerm || searchTerm) && (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle size={20} />
              <p>Aucun code erreur trouvé pour "{initialSearchTerm || searchTerm}"</p>
            </div>
          )}

          {errorCodes.map((code) => (
            <Card
              key={code._id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white"
              onClick={() => {
                onSelect(code);
                onClose();
              }}
            >
              <div className="p-4">
                {/* CODE ALARME (bleu foncé #1e40af) */}
                <h3 className="font-bold text-blue-900 text-lg mb-3">
                  {code.Alarme}
                </h3>

                {/* TITRE */}
                {code.Titre && (
                  <p className="font-medium text-gray-800 mb-2">{code.Titre}</p>
                )}
                
                {/* TYPE D'ALARME - UTILISE Type_alarme AVEC UNDERSCORE */}
                {code.Type_alarme && (
                  <div className="mb-3">
                    <span className="font-bold text-gray-700">Type d'alarme : </span>
                    <span className="text-gray-600 font-normal">{code.Type_alarme}</span>
                  </div>
                )}
                
                {/* CAUSE */}
                {code.Cause && (
                  <div className="mb-3">
                    <span className="font-bold text-gray-700">Cause : </span>
                    <span className="text-gray-600 font-normal">
                      {renderTextWithLineBreaks(code.Cause)}
                    </span>
                  </div>
                )}
                
                {/* ACTION */}
                {code.Action && (
                  <div>
                    <span className="font-bold text-gray-700">Action : </span>
                    <span className="text-gray-600 font-normal">
                      {renderTextWithLineBreaks(code.Action)}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
