// syncWorker.ts - Worker para sincronização em segundo plano
// Este worker é executado em uma thread separada para não bloquear a thread principal

// Importação de tipos
interface SyncItem {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retries?: number;
}

interface SyncStatus {
  queue: number;
  isProcessing: boolean;
  lastSync: number | null;
  totalSynced: number;
  failedSync: number;
}

// Estado do worker
let queue: SyncItem[] = [];
let isProcessing = false;
let apiBaseUrl = '';
let authToken = '';
let maxRetries = 3;
let retryDelay = 2000; // 2 segundos
let syncInterval: number | null = null;
let totalSynced = 0;
let failedSync = 0;
let lastStatus: SyncStatus | null = null;

// Mock de API para demonstração
const mockApiResults = {
  success: true,
  delay: 500, // Simula atraso de rede
  errorRate: 0.1 // 10% de falha para testes
};

// Escuta mensagens da thread principal
self.addEventListener('message', (event) => {
  const { command, data } = event.data;
  
  switch (command) {
    case 'INIT':
      handleInit(data);
      break;
    case 'ADD_TO_QUEUE':
      handleAddToQueue(data);
      break;
    case 'FORCE_SYNC':
      processQueue(true);
      break;
    case 'CLEAR_QUEUE':
      handleClearQueue();
      break;
    case 'GET_STATUS':
      sendStatus();
      break;
    case 'SET_CONFIG':
      handleSetConfig(data);
      break;
    default:
      console.error('Worker: Comando desconhecido', command);
  }
});

// Inicializa o worker
function handleInit(config: any) {
  apiBaseUrl = config.apiBaseUrl || '';
  authToken = config.authToken || '';
  maxRetries = config.maxRetries || 3;
  retryDelay = config.retryDelay || 2000;
  
  // Configura intervalo de sincronização automática
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  syncInterval = setInterval(() => {
    if (queue.length > 0 && !isProcessing) {
      processQueue();
    }
  }, config.syncInterval || 30000) as unknown as number;
  
  log('Worker inicializado com sucesso');
  sendStatus();
}

// Adiciona um item à fila de sincronização
function handleAddToQueue(item: SyncItem) {
  // Gera um ID único se não foi fornecido
  if (!item.id) {
    item.id = generateUUID();
  }
  
  // Adiciona timestamp se não fornecido
  if (!item.timestamp) {
    item.timestamp = Date.now();
  }
  
  // Adiciona à fila
  queue.push(item);
  log(`Item adicionado à fila: ${item.type} (${item.id})`);
  
  // Atualiza o status na thread principal
  sendStatus();
  
  // Se não estiver processando, inicia o processamento
  if (!isProcessing && queue.length === 1) {
    processQueue();
  }
}

// Processa a fila de sincronização
async function processQueue(force = false) {
  // Se já estiver processando e não for forçado, retorna
  if (isProcessing && !force) {
    return;
  }
  
  // Define como processando
  isProcessing = true;
  sendStatus();
  
  while (queue.length > 0) {
    const item = queue[0]; // Pega primeiro item sem remover
    
    try {
      log(`Processando item: ${item.type} (${item.id})`);
      postMessage({ type: 'SYNC_STARTED', itemId: item.id });
      
      // Executar a sincronização com a API
      await syncItem(item);
      
      // Se chegou aqui, deu certo
      log(`Item sincronizado com sucesso: ${item.type} (${item.id})`);
      totalSynced++;
      
      // Remove o item da fila após sincronização bem-sucedida
      queue.shift();
      
      // Notifica a thread principal
      postMessage({ 
        type: 'SYNC_COMPLETED', 
        itemId: item.id,
        itemType: item.type,
        data: item.data
      });
    } catch (error) {
      // Se excedeu as tentativas, remove da fila
      if ((item.retries || 0) >= maxRetries) {
        log(`Desistindo de sincronizar após ${maxRetries} tentativas: ${item.type} (${item.id})`);
        queue.shift();
        failedSync++;
        
        // Notifica a thread principal
        postMessage({ 
          type: 'SYNC_FAILED', 
          itemId: item.id, 
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          permanent: true
        });
      } else {
        // Incrementa tentativas e deixa na fila
        item.retries = (item.retries || 0) + 1;
        log(`Falha ao sincronizar (tentativa ${item.retries}): ${item.type} (${item.id})`);
        
        // Notifica a thread principal
        postMessage({ 
          type: 'SYNC_FAILED', 
          itemId: item.id, 
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          permanent: false,
          retries: item.retries,
          maxRetries
        });
        
        // Aguarda um tempo antes de tentar novamente
        await delay(retryDelay);
      }
    }
  }
  
  // Define como não processando
  isProcessing = false;
  sendStatus();
}

// Simula a sincronização com a API
async function syncItem(item: SyncItem): Promise<any> {
  // Simula atraso da rede
  await delay(mockApiResults.delay);
  
  // Simula erro ocasional para testes de resiliência
  if (Math.random() < mockApiResults.errorRate) {
    throw new Error('Falha na sincronização (simulada)');
  }
  
  // Aqui seria a implementação real de chamada à API
  // Em um ambiente real, isso seria uma chamada fetch ou axios
  
  // Simulação de diferentes tipos de operações
  switch (item.type) {
    case 'CREATE_TASK':
      // Simulação de criação de tarefa
      return { id: item.data.id, success: true };
      
    case 'UPDATE_TASK':
      // Simulação de atualização de tarefa
      return { id: item.data.id, success: true };
      
    case 'DELETE_TASK':
      // Simulação de exclusão de tarefa
      return { id: item.data.id, success: true };
      
    case 'CREATE_LIST':
    case 'UPDATE_LIST':
    case 'DELETE_LIST':
    case 'CREATE_TAG':
    case 'UPDATE_TAG':
    case 'DELETE_TAG':
      // Outras operações
      return { id: item.data.id, success: true };
      
    default:
      throw new Error(`Tipo de operação não suportado: ${item.type}`);
  }
}

// Limpa a fila de sincronização
function handleClearQueue() {
  const count = queue.length;
  queue = [];
  log(`Fila limpa (${count} itens removidos)`);
  sendStatus();
}

// Configura as opções de sincronização
function handleSetConfig(config: any) {
  if (config.apiBaseUrl !== undefined) apiBaseUrl = config.apiBaseUrl;
  if (config.authToken !== undefined) authToken = config.authToken;
  if (config.maxRetries !== undefined) maxRetries = config.maxRetries;
  if (config.retryDelay !== undefined) retryDelay = config.retryDelay;
  
  log('Configuração atualizada');
  
  // Reconfigurar intervalo de sincronização
  if (config.syncInterval !== undefined) {
    if (syncInterval) {
      clearInterval(syncInterval);
    }
    
    syncInterval = setInterval(() => {
      if (queue.length > 0 && !isProcessing) {
        processQueue();
      }
    }, config.syncInterval) as unknown as number;
  }
}

// Envia status atual para a thread principal
function sendStatus() {
  const currentStatus = {
    queue: queue.length,
    isProcessing,
    lastSync: queue.length > 0 ? Math.max(...queue.map(item => item.timestamp)) : null,
    totalSynced,
    failedSync
  };
  
  // Verificar se o status mudou antes de enviar
  if (!lastStatus || 
      lastStatus.queue !== currentStatus.queue || 
      lastStatus.isProcessing !== currentStatus.isProcessing ||
      lastStatus.lastSync !== currentStatus.lastSync ||
      lastStatus.totalSynced !== currentStatus.totalSynced ||
      lastStatus.failedSync !== currentStatus.failedSync) {
    
    lastStatus = { ...currentStatus };
    
    postMessage({
      type: 'STATUS_UPDATE',
      status: currentStatus
    });
  }
}

// Utilitários

// Delay helper
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Gera UUID para identificação única
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Log helper
function log(message: string) {
  console.log(`[SyncWorker] ${message}`);
}

// Inicialização
log('SyncWorker inicializado');
sendStatus();

// Necessário para TypeScript em workers
export {}; 