import React, { useState } from 'react';
import { FiWifi, FiWifiOff, FiClock, FiRefreshCw } from 'react-icons/fi';
import { useOffline } from '../hooks/useOffline';

export const NetworkStatus: React.FC = () => {
  const isOffline = useOffline();
  const isOnline = !isOffline;
  const reconnecting = false;
  const timeSinceOnline = 0;
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          isOnline
            ? reconnecting
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
        }`}
        title={isOnline ? 'Conectado' : 'Desconectado'}
      >
        {isOnline ? (
          reconnecting ? (
            <FiRefreshCw className="animate-spin" />
          ) : (
            <FiWifi />
          )
        ) : (
          <FiWifiOff />
        )}
        <span className="hidden sm:inline">
          {isOnline
            ? reconnecting
              ? 'Sincronizando...'
              : 'Online'
            : 'Offline'}
        </span>
      </button>
      
      {showDetails && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-10">
          <div className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-800 dark:text-white">Status da conexão</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isOnline
                ? reconnecting
                  ? 'Sincronizando dados com o servidor...'
                  : 'Conectado e sincronizado'
                : 'Trabalhando no modo offline'}
            </p>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`font-medium ${
                isOnline
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {!isOnline && timeSinceOnline && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <FiClock size={14} /> Offline há:
                </span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {timeSinceOnline}
                </span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Modo:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {isOnline ? 'Sincronização em tempo real' : 'Mudanças salvas localmente'}
              </span>
            </div>
            
            {!isOnline && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Suas alterações estão sendo salvas localmente e serão sincronizadas automaticamente quando você voltar a ficar online.
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-3 text-center">
            <button
              onClick={() => {
                setShowDetails(false);
                window.location.reload();
              }}
              className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 dark:text-blue-300 rounded-lg transition-colors"
            >
              <span className="flex items-center justify-center gap-1">
                <FiRefreshCw size={12} /> Atualizar conexão
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 