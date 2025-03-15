'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { migrateLocalStorageToSupabase } from '../lib/migrateToSupabase';
import supabase from '../lib/supabase';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncDate: Date | null;
  syncError: string | null;
  pendingChanges: number;
}

interface SyncContextType extends SyncState {
  syncNow: () => Promise<void>;
  enableAutoSync: (enable: boolean) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SupabaseSyncProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncDate: null,
    syncError: null,
    pendingChanges: 0
  });
  
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedPref = localStorage.getItem('autoSyncEnabled');
      return savedPref !== null ? savedPref === 'true' : true;
    }
    return true;
  });
  
  // Monitorar status online/offline
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isOnline: true }));
    };
    
    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isOnline: false }));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Sincronizar quando voltar a ficar online
  useEffect(() => {
    if (syncState.isOnline && autoSyncEnabled && user && syncState.pendingChanges > 0) {
      syncNow();
    }
  }, [syncState.isOnline, autoSyncEnabled, user, syncState.pendingChanges]);
  
  // Salvar preferência de sincronização automática
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('autoSyncEnabled', autoSyncEnabled.toString());
    }
  }, [autoSyncEnabled]);
  
  // Verificar se há uma migração inicial necessária
  useEffect(() => {
    if (
      user && 
      syncState.isOnline && 
      localStorage.getItem('migrationCompleted') !== 'true'
    ) {
      const checkInitialMigration = async () => {
        try {
          // Verificar se existe algum dado local
          const hasLocalData = 
            localStorage.getItem('scrumSprints') || 
            localStorage.getItem('scrumUserStories') ||
            localStorage.getItem('scrumBoards');
          
          if (hasLocalData) {
            console.log('Dados locais detectados, sugerindo migração inicial');
            // Atualizar o número de alterações pendentes
            setSyncState(prev => ({ ...prev, pendingChanges: 1 }));
          }
        } catch (error) {
          console.error('Erro ao verificar necessidade de migração inicial:', error);
        }
      };
      
      checkInitialMigration();
    }
  }, [user, syncState.isOnline]);
  
  const syncNow = async () => {
    if (!user || !syncState.isOnline || syncState.isSyncing) {
      return;
    }
    
    setSyncState(prev => ({ ...prev, isSyncing: true, syncError: null }));
    
    try {
      // Verificar se o usuário está autenticado e a sessão é válida
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        throw new Error('Sessão inválida ou expirada');
      }
      
      if (localStorage.getItem('migrationCompleted') !== 'true') {
        console.log('Realizando migração inicial para o Supabase');
        await migrateLocalStorageToSupabase();
        localStorage.setItem('migrationCompleted', 'true');
      } else {
        // Aqui você pode adicionar lógica para sincronizar mudanças incrementais
        // Por enquanto, vamos apenas atualizar o estado de sincronização
        console.log('Sincronizando com o Supabase');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncDate: new Date(),
        pendingChanges: 0
      }));
    } catch (error) {
      console.error('Erro durante a sincronização:', error);
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: 'Falha ao sincronizar com o Supabase.'
      }));
    }
  };
  
  const enableAutoSync = (enable: boolean) => {
    setAutoSyncEnabled(enable);
  };
  
  const value: SyncContextType = {
    ...syncState,
    syncNow,
    enableAutoSync
  };
  
  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSupabaseSync = () => {
  const context = useContext(SyncContext);
  
  if (context === undefined) {
    throw new Error('useSupabaseSync deve ser usado dentro de um SupabaseSyncProvider');
  }
  
  return context;
}; 