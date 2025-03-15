import React, { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiWifi, FiWifiOff, FiAlertCircle, FiCloud, FiRefreshCw, FiCheck } from 'react-icons/fi';

interface OfflineStatusBarProps {
  pendingSyncCount?: number;
  onManualSync?: () => Promise<void>;
  lastSyncTime?: Date | null;
}

const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({ 
  pendingSyncCount = 0, 
  onManualSync,
  lastSyncTime
}) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Handler para mudança de estado online/offline
  const handleOnlineStatusChange = useCallback(() => {
    setIsOnline(navigator.onLine);
  }, []);

  // Registrar event listeners para detectar mudanças na conexão
  useEffect(() => {
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [handleOnlineStatusChange]);

  // Função para disparar sincronização manual
  const handleManualSync = useCallback(async () => {
    if (!onManualSync || isSyncing || !isOnline) return;

    try {
      setIsSyncing(true);
      setSyncError(null);
      await onManualSync();
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Erro ao sincronizar');
      console.error('Erro na sincronização manual:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [onManualSync, isSyncing, isOnline]);

  // Formatar a data da última sincronização
  const formattedLastSync = lastSyncTime 
    ? new Intl.DateTimeFormat('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }).format(lastSyncTime)
    : 'Nunca';

  // Se estiver online e não há itens pendentes, não mostrar barra
  if (isOnline && pendingSyncCount === 0 && !syncError) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <AnimatePresence>
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`${
            isOnline ? 'bg-indigo-600' : 'bg-amber-600'
          } text-white px-4 py-2 shadow-lg`}
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              {isOnline ? (
                <FiWifi className="mr-2" size={18} />
              ) : (
                <FiWifiOff className="mr-2 animate-pulse" size={18} />
              )}
              
              <span className="font-medium mr-2">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              
              {pendingSyncCount > 0 && (
                <div className="flex items-center ml-2">
                  <FiCloud className="mr-1" />
                  <span>
                    {pendingSyncCount} {pendingSyncCount === 1 ? 'alteração' : 'alterações'} pendente{pendingSyncCount === 1 ? '' : 's'}
                  </span>
                </div>
              )}
              
              {syncError && (
                <div className="flex items-center ml-3 text-amber-200">
                  <FiAlertCircle className="mr-1" />
                  <span className="text-sm">Erro: {syncError}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              {isOnline && pendingSyncCount > 0 && (
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className={`flex items-center px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors ${
                    isSyncing ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  aria-label="Sincronizar manualmente"
                >
                  {isSyncing ? (
                    <FiRefreshCw className="mr-1 animate-spin" />
                  ) : (
                    <FiRefreshCw className="mr-1" />
                  )}
                  <span>Sincronizar</span>
                </button>
              )}
              
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="ml-3 flex items-center text-sm underline"
                aria-expanded={showDetails}
                aria-controls="offline-details"
              >
                {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {showDetails && (
              <motion.div
                id="offline-details"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="container mx-auto mt-2 overflow-hidden"
              >
                <div className="bg-white/10 rounded-md p-3">
                  <h4 className="font-medium mb-2">Informações de sincronização</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="flex items-center">
                        <span className="mr-2">Status:</span>
                        {isOnline ? (
                          <span className="flex items-center text-green-200">
                            <FiCheck className="mr-1" /> Conectado
                          </span>
                        ) : (
                          <span className="flex items-center text-amber-200">
                            <FiWifiOff className="mr-1" /> Desconectado
                          </span>
                        )}
                      </p>
                      
                      <p className="mt-1">
                        <span className="mr-2">Última sincronização:</span>
                        {formattedLastSync}
                      </p>
                    </div>
                    
                    <div>
                      <p>
                        <span className="mr-2">Alterações pendentes:</span>
                        {pendingSyncCount}
                      </p>
                      
                      <p className="mt-1">
                        <span className="mr-2">Armazenamento local:</span>
                        {typeof window !== 'undefined' && 'localStorage' in window
                          ? 'Disponível'
                          : 'Não disponível'}
                      </p>
                    </div>
                  </div>
                  
                  {!isOnline && (
                    <div className="mt-3 text-sm bg-amber-500/20 p-2 rounded-md">
                      <p className="flex items-center">
                        <FiAlertCircle className="mr-2 flex-shrink-0" />
                        Você está trabalhando offline. Suas alterações serão armazenadas localmente e
                        sincronizadas quando a conexão for restabelecida.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default memo(OfflineStatusBar); 