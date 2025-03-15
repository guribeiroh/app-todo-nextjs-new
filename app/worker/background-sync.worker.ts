// Este é um Web Worker que executa processamento em segundo plano
// para sincronização de dados com o servidor sem bloquear a UI

interface SyncItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'task' | 'list' | 'tag';
  data: any;
  timestamp: number;
  attempts: number;
  lastAttempt?: number;
}

interface SyncQueue {
  items: SyncItem[];
  lastSync: number | null;
  processing: boolean;
}

// Estado da fila de sincronização
let syncQueue: SyncQueue = {
  items: [],
  lastSync: null,
  processing: false
};

// API endpoints
const API_ENDPOINTS = {
  task: '/api/tasks',
  list: '/api/lists',
  tag: '/api/tags',
};

// Configurações
const CONFIG = {
  syncInterval: 30000, // 30 segundos
  maxRetries: 5,
  backoffMultiplier: 1.5, // Multiplicador para backoff exponencial
  initialBackoff: 5000, // 5 segundos
};

// Inicializar worker
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT':
      // Configurar parâmetros iniciais
      if (payload.apiBase) {
        Object.keys(API_ENDPOINTS).forEach(key => {
          API_ENDPOINTS[key as keyof typeof API_ENDPOINTS] = 
            `${payload.apiBase}${API_ENDPOINTS[key as keyof typeof API_ENDPOINTS]}`;
        });
      }
      
      if (payload.config) {
        Object.assign(CONFIG, payload.config);
      }
      
      // Iniciar com uma fila existente
      if (payload.queue) {
        syncQueue = payload.queue;
      }
      
      // Iniciar loop de sincronização
      startSyncLoop();
      
      // Notificar UI que o worker foi inicializado
      postMessage({ type: 'WORKER_INITIALIZED' });
      break;

    case 'ADD_SYNC_ITEM':
      // Adicionar um item à fila de sincronização
      addToSyncQueue(payload);
      break;

    case 'FORCE_SYNC':
      // Forçar uma sincronização imediata
      processSyncQueue(true);
      break;

    case 'CLEAR_QUEUE':
      // Limpar a fila de sincronização
      syncQueue.items = [];
      postMessage({ type: 'QUEUE_UPDATED', payload: syncQueue.items.length });
      break;

    case 'GET_STATUS':
      // Enviar status atual da fila
      postMessage({
        type: 'SYNC_STATUS',
        payload: {
          queueLength: syncQueue.items.length,
          lastSync: syncQueue.lastSync,
          processing: syncQueue.processing
        }
      });
      break;
  }
});

// Começar loop de sincronização
function startSyncLoop() {
  // Verifica e processa a fila periodicamente
  setInterval(() => {
    processSyncQueue();
  }, CONFIG.syncInterval);

  // Inicia uma primeira sincronização
  processSyncQueue();
}

// Adicionar item à fila de sincronização
function addToSyncQueue(item: Omit<SyncItem, 'timestamp' | 'attempts'>) {
  // Verificar se já existe um item para essa entidade
  const existingIndex = syncQueue.items.findIndex(
    i => i.id === item.id && i.entityType === item.entityType
  );

  const syncItem: SyncItem = {
    ...item,
    timestamp: Date.now(),
    attempts: 0
  };

  if (existingIndex >= 0) {
    // Atualizar item existente se for mais recente
    if (syncItem.type === 'delete') {
      // Delete sempre tem prioridade
      syncQueue.items[existingIndex] = syncItem;
    } else if (syncItem.type === 'update' && syncQueue.items[existingIndex].type === 'create') {
      // Se estamos atualizando um item que ainda não foi criado, mesclar os dados
      syncQueue.items[existingIndex].data = { ...syncQueue.items[existingIndex].data, ...syncItem.data };
    } else {
      // Caso contrário, substituir
      syncQueue.items[existingIndex] = syncItem;
    }
  } else {
    // Adicionar novo item
    syncQueue.items.push(syncItem);
  }

  // Notificar UI sobre mudança na fila
  postMessage({ type: 'QUEUE_UPDATED', payload: syncQueue.items.length });

  // Tenta sincronizar imediatamente se for o primeiro item
  if (syncQueue.items.length === 1) {
    processSyncQueue();
  }
}

// Processar a fila de sincronização
async function processSyncQueue(force = false) {
  // Não processar se já estiver em andamento, a menos que seja forçado
  if (syncQueue.processing && !force) {
    return;
  }

  // Verificar se há itens para sincronizar
  if (syncQueue.items.length === 0) {
    return;
  }

  // Marcar como processando
  syncQueue.processing = true;
  postMessage({ type: 'SYNC_STARTED' });

  try {
    // Ordenar itens por tipo de operação (create > update > delete) e timestamp
    const sortedItems = [...syncQueue.items].sort((a, b) => {
      const typeOrder = { create: 0, update: 1, delete: 2 };
      if (a.type !== b.type) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.timestamp - b.timestamp;
    });

    // Processar itens em sequência
    for (const item of sortedItems) {
      try {
        // Verificar se o item está pronto para retry (usando backoff exponencial)
        if (item.attempts > 0 && item.lastAttempt) {
          const backoffTime = CONFIG.initialBackoff * Math.pow(CONFIG.backoffMultiplier, item.attempts - 1);
          if (Date.now() - item.lastAttempt < backoffTime && !force) {
            continue; // Pular este item se não for tempo de retry ainda
          }
        }

        // Atualizar contadores de tentativas
        item.attempts++;
        item.lastAttempt = Date.now();

        // Enviar requisição
        await syncItem(item);

        // Se chegou aqui, foi bem sucedido, remover da fila
        syncQueue.items = syncQueue.items.filter(i => i.id !== item.id || i.entityType !== item.entityType);
      } catch (error) {
        console.error(`Erro ao sincronizar item ${item.id}:`, error);

        // Se excedeu o número máximo de tentativas, remover da fila e notificar
        if (item.attempts >= CONFIG.maxRetries) {
          syncQueue.items = syncQueue.items.filter(i => i !== item);
          postMessage({
            type: 'SYNC_ITEM_FAILED',
            payload: {
              id: item.id,
              entityType: item.entityType,
              error: error instanceof Error ? error.message : String(error)
            }
          });
        }
      }
    }

    // Atualizar timestamp da última sincronização
    syncQueue.lastSync = Date.now();

    // Notificar UI sobre o resultado
    postMessage({
      type: 'SYNC_COMPLETED',
      payload: {
        timestamp: syncQueue.lastSync,
        queueLength: syncQueue.items.length,
      }
    });
  } catch (error) {
    // Erro geral no processo de sincronização
    postMessage({
      type: 'SYNC_FAILED',
      payload: error instanceof Error ? error.message : String(error)
    });
  } finally {
    // Marcar como não processando
    syncQueue.processing = false;
  }
}

// Sincronizar um item específico
async function syncItem(item: SyncItem): Promise<void> {
  const endpoint = API_ENDPOINTS[item.entityType];
  let response;

  try {
    switch (item.type) {
      case 'create':
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        break;

      case 'update':
        response = await fetch(`${endpoint}/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        break;

      case 'delete':
        response = await fetch(`${endpoint}/${item.id}`, {
          method: 'DELETE'
        });
        break;
    }

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
    }

    // Enviar resultado de volta para o UI thread
    const result = await response.json();
    
    postMessage({
      type: 'SYNC_ITEM_COMPLETED',
      payload: {
        id: item.id,
        entityType: item.entityType,
        operation: item.type,
        result
      }
    });
  } catch (error) {
    // Repassar o erro para ser tratado no processamento da fila
    throw error;
  }
}

// Exportar tipo como WorkerGlobalScope
export {}; 