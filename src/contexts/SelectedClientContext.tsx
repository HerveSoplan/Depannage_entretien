//SelectedClientContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SelectedClientContextType {
    selectedClient: any | null;
    setSelectedClient: (client: any | null) => void;
    clearSelectedClient: () => void;
}

const SelectedClientContext = createContext<SelectedClientContextType | undefined>(undefined);

interface SelectedClientProviderProps {
    children: ReactNode;
}

export function SelectedClientProvider({ children }: SelectedClientProviderProps) {
    const [selectedClient, setSelectedClientState] = useState<any | null>(() => {
        // Charger depuis localStorage au démarrage
        try {
            const stored = localStorage.getItem('selectedClient');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Erreur chargement client depuis localStorage:', error);
            return null;
        }
    });

    // Sauvegarder dans localStorage à chaque changement
    useEffect(() => {
        try {
            if (selectedClient) {
                localStorage.setItem('selectedClient', JSON.stringify(selectedClient));
                console.log('✅ Client sélectionné sauvegardé:', selectedClient.nom);
            } else {
                localStorage.removeItem('selectedClient');
                console.log('🔄 Client sélectionné effacé');
            }
        } catch (error) {
            console.error('Erreur sauvegarde client dans localStorage:', error);
        }
    }, [selectedClient]);

    const setSelectedClient = (client: any | null) => {
        setSelectedClientState(client);
    };

    const clearSelectedClient = () => {
        setSelectedClientState(null);
    };

    const value: SelectedClientContextType = {
        selectedClient,
        setSelectedClient,
        clearSelectedClient
    };

    return (
        <SelectedClientContext.Provider value={value}>
            {children}
        </SelectedClientContext.Provider>
    );
}

export function useSelectedClient(): SelectedClientContextType {
    const context = useContext(SelectedClientContext);
    if (context === undefined) {
        throw new Error('useSelectedClient doit être utilisé dans un SelectedClientProvider');
    }
    return context;
}
