'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../components/Toast';

// Tipos
export interface SyncQueueItem {
  id?: string;
  type: string;
  data: any;
  timestamp?: number;
  onSuccess?: (data?: any) => void;
  onError?: (error: any) => void;
}

export interface BackgroundSyncStatus {
  queueLength: number;
  isProcessing: boolean;
  lastSync: number | null;
  totalSynced: number;
  failedSync: number;
}

/**
 * Hook personalizado para sincronização em segundo plano usando Web Workers.
 * Melhora a performance descarregando operações pesadas para uma thread separada.
 */
export function useBackgroundSync() {
  const [status, setStatus] = useState<BackgroundSyncStatus>({
    queueLength: 0,
    isProcessing: false,
    lastSync: null,
    totalSynced: 0,
    failedSync: 0
  });
  
  const { showToast } = useToast();
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, { onSuccess?: Function, onError?: Function }>>(new Map());
  const statusRef = useRef(status); // Referência para o status atual
  
  // Atualizar a referência quando o status mudar
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  
  // Inicializa o worker
  useEffect(() => {
    // Verifica se Web Workers são suportados
    if (typeof Worker === 'undefined') {
      console.error('Web Workers não são suportados neste navegador');
      return;
    }
    
    try {
      // Cria o worker
      const worker = new Worker(new URL('../workers/syncWorker.ts', import.meta.url));
      
      // Configura o listener de mensagens
      worker.addEventListener('message', handleWorkerMessage);
      
      // Inicializa o worker com configurações
      worker.postMessage({
        command: 'INIT',
        data: {
          apiBaseUrl: '/api',
          syncInterval: 30000, // 30 segundos
          maxRetries: 3,
          retryDelay: 2000
        }
      });
      
      // Armazena a referência do worker
      workerRef.current = worker;
      
      // Limpa o worker quando o componente for desmontado
      return () => {
        worker.removeEventListener('message', handleWorkerMessage);
        worker.terminate();
        workerRef.current = null;
      };
    } catch (error) {
      console.error('Erro ao inicializar o worker:', error);
    }
  }, []);
  
  // Manipula mensagens do worker
  const handleWorkerMessage = useCallback((event: MessageEvent) => {
    const { type, itemId, error, status: workerStatus, data } = event.data;
    
    switch (type) {
      case 'STATUS_UPDATE':
        // Comparar com o status anterior para evitar atualizações desnecessárias
        if (JSON.stringify(workerStatus) !== JSON.stringify(statusRef.current)) {
          setStatus(workerStatus);
        }
        break;
        
      case 'SYNC_COMPLETED':
        // Executa o callback de sucesso, se existir
        if (itemId && callbacksRef.current.has(itemId)) {
          const callbacks = callbacksRef.current.get(itemId);
          if (callbacks?.onSuccess) {
            callbacks.onSuccess(data);
          }
          callbacksRef.current.delete(itemId);
        }
        break;
        
      case 'SYNC_FAILED':
        // Executa o callback de erro, se existir
        if (itemId && callbacksRef.current.has(itemId)) {
          const callbacks = callbacksRef.current.get(itemId);
          if (callbacks?.onError) {
            callbacks.onError(error);
          }
          
          // Se o erro for permanente, remove o callback
          if (event.data.permanent) {
            callbacksRef.current.delete(itemId);
            showToast(`Falha na sincronização: ${error}`, 'error');
          }
        }
        break;
        
      default:
        break;
    }
  }, [showToast]);
  
  // Adiciona um item à fila de sincronização
  const addToQueue = useCallback((item: SyncQueueItem) => {
    if (!workerRef.current) {
      console.error('Worker não inicializado');
      if (item.onError) {
        item.onError('Worker não inicializado');
      }
      return;
    }
    
    // Gera um ID se não foi fornecido
    const id = item.id || generateUUID();
    const itemWithId = { ...item, id };
    
    // Armazena os callbacks
    if (item.onSuccess || item.onError) {
      callbacksRef.current.set(id, {
        onSuccess: item.onSuccess,
        onError: item.onError
      });
      
      // Remove os callbacks do objeto antes de enviar para o worker
      const { onSuccess, onError, ...itemToSend } = itemWithId;
      
      // Envia para o worker
      workerRef.current.postMessage({
        command: 'ADD_TO_QUEUE',
        data: itemToSend
      });
    } else {
      // Envia para o worker
      workerRef.current.postMessage({
        command: 'ADD_TO_QUEUE',
        data: itemWithId
      });
    }
    
    return id;
  }, []);
  
  // Força a sincronização imediata
  const forceSync = useCallback(() => {
    if (!workerRef.current) {
      console.error('Worker não inicializado');
      return;
    }
    
    workerRef.current.postMessage({
      command: 'FORCE_SYNC'
    });
    
    showToast('Sincronização iniciada', 'info');
  }, [showToast]);
  
  // Limpa a fila de sincronização
  const clearQueue = useCallback(() => {
    if (!workerRef.current) {
      console.error('Worker não inicializado');
      return;
    }
    
    workerRef.current.postMessage({
      command: 'CLEAR_QUEUE'
    });
    
    // Limpa todos os callbacks
    callbacksRef.current.clear();
    
    showToast('Fila de sincronização limpa', 'info');
  }, [showToast]);
  
  // Atualiza as configurações do worker
  const updateConfig = useCallback((config: any) => {
    if (!workerRef.current) {
      console.error('Worker não inicializado');
      return;
    }
    
    workerRef.current.postMessage({
      command: 'SET_CONFIG',
      data: config
    });
  }, []);
  
  return {
    ...status,
    addToQueue,
    forceSync,
    clearQueue,
    updateConfig
  };
}

// Utilitário para gerar UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
} 