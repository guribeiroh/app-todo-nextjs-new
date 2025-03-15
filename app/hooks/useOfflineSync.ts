import { useState, useEffect, useCallback } from 'react';
import OfflineService from '../services/OfflineService';

// Hook personalizado para gerenciar sincronização offline
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  useEffect(() => {
    // Obter a instância do serviço
    const offlineService = OfflineService.getInstance();
    
    // Registrar callbacks para atualizações de status
    const unsubscribeOnline = offlineService.onOnlineStatusChange((online) => {
      setIsOnline(online);
    });
    
    const unsubscribePending = offlineService.onPendingChangesUpdate((count) => {
      setPendingChanges(count);
    });
    
    // Inicializar estado
    setIsOnline(offlineService.isOnline());
    setPendingChanges(offlineService.getPendingChangesCount());
    
    // Limpar callbacks ao desmontar
    return () => {
      unsubscribeOnline();
      unsubscribePending();
    };
  }, []);
  
  // Função para sincronizar manualmente
  const synchronize = useCallback(async () => {
    const offlineService = OfflineService.getInstance();
    
    if (!offlineService.isOnline() || syncInProgress) {
      return false;
    }
    
    setSyncInProgress(true);
    
    try {
      const success = await offlineService.synchronize();
      setLastSyncTime(new Date());
      setPendingChanges(offlineService.getPendingChangesCount());
      return success;
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      return false;
    } finally {
      setSyncInProgress(false);
    }
  }, [syncInProgress]);
  
  // Rastrear alterações em tarefas
  const trackTaskChange = useCallback((type: 'add' | 'update' | 'delete' | 'complete', task: any) => {
    const offlineService = OfflineService.getInstance();
    offlineService.trackTaskChange(type, task);
    setPendingChanges(offlineService.getPendingChangesCount());
  }, []);
  
  // Rastrear alterações em listas
  const trackListChange = useCallback((type: 'add' | 'update' | 'delete', list: any) => {
    const offlineService = OfflineService.getInstance();
    offlineService.trackListChange(type, list);
    setPendingChanges(offlineService.getPendingChangesCount());
  }, []);
  
  // Rastrear alterações em tags
  const trackTagChange = useCallback((type: 'add' | 'delete', tag: string) => {
    const offlineService = OfflineService.getInstance();
    offlineService.trackTagChange(type, tag);
    setPendingChanges(offlineService.getPendingChangesCount());
  }, []);
  
  // Verificar conexão com o servidor
  const testConnection = useCallback(async () => {
    const offlineService = OfflineService.getInstance();
    return await offlineService.testConnection();
  }, []);
  
  // Exportar dados para backup offline
  const exportOfflineData = useCallback(() => {
    const offlineService = OfflineService.getInstance();
    return offlineService.exportData();
  }, []);
  
  // Importar dados offline
  const importOfflineData = useCallback((jsonData: string) => {
    const offlineService = OfflineService.getInstance();
    return offlineService.importData(jsonData);
  }, []);
  
  // Limpar alterações pendentes
  const clearPendingChanges = useCallback(() => {
    const offlineService = OfflineService.getInstance();
    offlineService.clearPendingChanges();
    setPendingChanges(0);
  }, []);
  
  return {
    isOnline,
    pendingChanges,
    syncInProgress,
    lastSyncTime,
    synchronize,
    trackTaskChange,
    trackListChange,
    trackTagChange,
    testConnection,
    exportOfflineData,
    importOfflineData,
    clearPendingChanges
  };
} 