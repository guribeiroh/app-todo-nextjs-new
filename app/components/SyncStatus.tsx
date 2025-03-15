'use client';

import React from 'react';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { CloudSyncIcon, CloudOffIcon, CloudDoneIcon, RefreshIcon } from '../components/Icons';

export default function SyncStatus() {
  const { isAuthenticated } = useAuth();
  const { isOffline, isSyncing, lastSyncTime, pendingChanges, manualSync } = useTaskContext();
  
  // Se o usuário não estiver autenticado, não exibir o componente
  if (!isAuthenticated) {
    return null;
  }
  
  // Formatar a data da última sincronização
  const formattedLastSync = lastSyncTime 
    ? new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(lastSyncTime)
    : 'Nunca';
  
  const handleManualSync = async () => {
    if (!isOffline && !isSyncing) {
      await manualSync();
    }
  };
  
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      {isOffline ? (
        <>
          <CloudOffIcon className="w-4 h-4 text-red-500" />
          <span>Offline</span>
        </>
      ) : isSyncing ? (
        <>
          <CloudSyncIcon className="w-4 h-4 text-blue-500 animate-spin" />
          <span>Sincronizando...</span>
        </>
      ) : pendingChanges > 0 ? (
        <>
          <CloudSyncIcon className="w-4 h-4 text-amber-500" />
          <span>{pendingChanges} {pendingChanges === 1 ? 'alteração pendente' : 'alterações pendentes'}</span>
        </>
      ) : (
        <>
          <CloudDoneIcon className="w-4 h-4 text-green-500" />
          <span>Sincronizado</span>
        </>
      )}
      
      <span className="text-xs ml-2">
        Última sinc: {formattedLastSync}
      </span>
      
      <button 
        onClick={handleManualSync}
        disabled={isOffline || isSyncing}
        className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
        title="Sincronizar manualmente"
      >
        <RefreshIcon className="w-4 h-4" />
      </button>
    </div>
  );
} 