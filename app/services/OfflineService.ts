// Serviço para gerenciar funcionalidades offline e sincronização
// Implementa persistência local, detecção de estado de conexão, e sincronização

import { Task, TaskList } from '../types';

// Tipos para armazenar alterações pendentes
export interface PendingChange {
  id: string;
  type: 'add' | 'update' | 'delete' | 'complete';
  entity: 'task' | 'list' | 'tag';
  data?: any;
  timestamp: number;
}

export interface SyncState {
  lastSyncTimestamp: number;
  hasPendingChanges: boolean;
  pendingChanges: PendingChange[];
  isOnline: boolean;
  syncInProgress: boolean;
  syncError: string | null;
}

// Interface para eventos de sincronização
export interface SyncEvent {
  type: 'sync' | 'error' | 'connection-lost' | 'connection-restored';
  timestamp: number;
  details?: string;
  changeCount?: number;
  success?: boolean;
}

export default class OfflineService {
  private static instance: OfflineService;
  private syncState: SyncState;
  private onlineStatusChangeCallbacks: ((isOnline: boolean) => void)[] = [];
  private pendingChangesCallbacks: ((pendingCount: number) => void)[] = [];
  private isOnlineState: boolean = navigator.onLine;
  private pendingChanges: Array<{ type: string; operation: string; data: any; timestamp: number }> = [];
  private onlineStatusListeners: Array<(status: boolean) => void> = [];
  private pendingChangesListeners: Array<(count: number) => void> = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private apiEndpoint: string = '/api';
  private lastOnlineState: boolean = navigator.onLine;
  private syncEventListeners: Array<(event: SyncEvent) => void> = [];
  
  // Configurações do serviço
  private config = {
    autoSyncInterval: 30000, // 30 segundos
    maxRetries: 3,
    connectionTimeout: 5000,
    storageKeys: {
      pendingChanges: 'neotask_pending_changes',
      lastSyncTime: 'neotask_last_sync',
      taskData: 'neotask_tasks',
      listData: 'neotask_lists',
      tagData: 'neotask_tags',
      syncHistory: 'neotask_sync_history'
    }
  };
  
  private constructor() {
    this.syncState = this.loadSyncState();
    this.initOnlineListener();
    this.loadPendingChanges();
    
    // Configurar listeners para monitorar o estado da conexão
    window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
    window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));
    
    // Iniciar sincronização automática se estiver online
    if (this.isOnlineState) {
      this.setupAutoSync();
    }
    
    // Armazenar estado inicial de conexão
    this.lastOnlineState = this.isOnlineState;
  }
  
  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }
  
  // Carregar o estado de sincronização do localStorage
  private loadSyncState(): SyncState {
    try {
      const savedState = localStorage.getItem('offline-sync-state');
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error('Erro ao carregar estado de sincronização:', error);
    }
    
    // Estado padrão
    return {
      lastSyncTimestamp: Date.now(),
      hasPendingChanges: false,
      pendingChanges: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      syncInProgress: false,
      syncError: null
    };
  }
  
  // Salvar o estado de sincronização no localStorage
  private saveSyncState(): void {
    localStorage.setItem('offline-sync-state', JSON.stringify(this.syncState));
    
    // Notificar callbacks sobre alterações pendentes
    const pendingCount = this.syncState.pendingChanges.length;
    this.pendingChangesCallbacks.forEach(callback => callback(pendingCount));
  }
  
  // Configurar detector de status online/offline
  private initOnlineListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncState.isOnline = true;
        this.saveSyncState();
        
        // Notificar callbacks sobre mudança de status
        this.onlineStatusChangeCallbacks.forEach(callback => callback(true));
        
        // Tentar sincronizar alterações pendentes
        if (this.syncState.hasPendingChanges) {
          this.synchronize();
        }
      });
      
      window.addEventListener('offline', () => {
        this.syncState.isOnline = false;
        this.saveSyncState();
        
        // Notificar callbacks sobre mudança de status
        this.onlineStatusChangeCallbacks.forEach(callback => callback(false));
      });
    }
  }
  
  // Registrar callback para mudanças de status online
  public onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.onlineStatusListeners.push(callback);
    
    // Chamar imediatamente com o status atual
    callback(this.isOnlineState);
    
    // Retornar função para remover o callback
    return () => {
      this.onlineStatusListeners = this.onlineStatusListeners.filter(cb => cb !== callback);
    };
  }
  
  // Registrar callback para alterações no número de alterações pendentes
  public onPendingChangesUpdate(callback: (pendingCount: number) => void): () => void {
    this.pendingChangesListeners.push(callback);
    
    // Chamar imediatamente com o número atual
    callback(this.pendingChanges.length);
    
    // Retornar função para remover o callback
    return () => {
      this.pendingChangesListeners = this.pendingChangesListeners.filter(cb => cb !== callback);
    };
  }
  
  // Verificar se estamos online
  public isOnline(): boolean {
    return this.isOnlineState;
  }
  
  // Verificar se temos alterações pendentes
  public hasPendingChanges(): boolean {
    return this.syncState.hasPendingChanges;
  }
  
  // Obter número de alterações pendentes
  public getPendingChangesCount(): number {
    return this.pendingChanges.length;
  }
  
  // Adicionar evento ao histórico de sincronização
  private addToSyncHistory(event: SyncEvent): void {
    try {
      // Obter histórico existente
      const historyStr = localStorage.getItem(this.config.storageKeys.syncHistory);
      let history: SyncEvent[] = historyStr ? JSON.parse(historyStr) : [];
      
      // Adicionar novo evento no início
      history = [event, ...history].slice(0, 100); // Limitar a 100 eventos
      
      // Salvar histórico atualizado
      localStorage.setItem(this.config.storageKeys.syncHistory, JSON.stringify(history));
      
      // Notificar listeners de eventos de sincronização
      this.notifySyncEventListeners(event);
    } catch (error) {
      console.error('Erro ao salvar histórico de sincronização:', error);
    }
  }
  
  // Registrar callback para eventos de sincronização
  public onSyncEvent(callback: (event: SyncEvent) => void): () => void {
    this.syncEventListeners.push(callback);
    
    // Retornar função para remover o callback
    return () => {
      this.syncEventListeners = this.syncEventListeners.filter(cb => cb !== callback);
    };
  }
  
  // Notificar listeners de eventos de sincronização
  private notifySyncEventListeners(event: SyncEvent): void {
    this.syncEventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Erro ao notificar listener de sincronização:', error);
      }
    });
  }
  
  // Adicionar uma alteração pendente
  public addPendingChange(change: Omit<PendingChange, 'timestamp'>): void {
    const newChange: PendingChange = {
      ...change,
      timestamp: Date.now()
    };
    
    // Verificar se já existe uma alteração para o mesmo item e atualizá-la
    const existingIndex = this.syncState.pendingChanges.findIndex(
      c => c.id === change.id && c.entity === change.entity
    );
    
    if (existingIndex >= 0) {
      // Se a alteração existente for add e a nova for delete, remover completamente
      if (this.syncState.pendingChanges[existingIndex].type === 'add' && change.type === 'delete') {
        this.syncState.pendingChanges = this.syncState.pendingChanges.filter(
          (_, index) => index !== existingIndex
        );
      } else {
        // Caso contrário, atualizar a alteração existente
        this.syncState.pendingChanges[existingIndex] = newChange;
      }
    } else {
      // Adicionar nova alteração
      this.syncState.pendingChanges.push(newChange);
    }
    
    this.syncState.hasPendingChanges = this.syncState.pendingChanges.length > 0;
    this.saveSyncState();
    
    // Se estamos online, tentar sincronizar imediatamente
    if (this.isOnlineState && !this.syncState.syncInProgress) {
      this.synchronize();
    }
  }
  
  // Sincronizar alterações pendentes com o servidor
  public async synchronize(): Promise<boolean> {
    if (!this.isOnlineState || this.pendingChanges.length === 0) {
      return true; // Nada para sincronizar ou offline
    }
    
    // Adicionar evento ao histórico - início da sincronização
    const syncStartEvent: SyncEvent = {
      type: 'sync',
      timestamp: Date.now(),
      success: false,
      changeCount: this.pendingChanges.length
    };
    this.addToSyncHistory(syncStartEvent);
    
    // Atualizar estado
    this.syncState.syncInProgress = true;
    this.syncState.syncError = null;
    this.saveSyncState();
    
    // Verificar conexão antes de sincronizar
    try {
      // Verificar se ainda estamos online antes de enviar as alterações
      if (!navigator.onLine) {
        this.syncState.isOnline = false;
        this.syncState.syncInProgress = false;
        this.saveSyncState();
        
        const connectionLostEvent: SyncEvent = {
          type: 'connection-lost',
          timestamp: Date.now(),
          details: 'Conexão perdida antes da sincronização'
        };
        this.addToSyncHistory(connectionLostEvent);
        
        return false;
      }
      
      // Aqui iria implementar a lógica real de sincronização com o servidor
      // Por exemplo:
      // const response = await fetch(`${this.apiEndpoint}/sync`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ changes: this.syncState.pendingChanges })
      // });
      //
      // if (!response.ok) throw new Error('Falha na sincronização');
      // const result = await response.json();
      
      // Para fins de demonstração, simulamos que a sincronização foi bem-sucedida
      await this.mockSyncProcess();
      
      // Limpar alterações pendentes após sincronização bem-sucedida
      const changeCount = this.syncState.pendingChanges.length;
      this.syncState.pendingChanges = [];
      this.syncState.hasPendingChanges = false;
      this.syncState.syncInProgress = false;
      this.syncState.lastSyncTimestamp = Date.now();
      this.saveSyncState();
      
      // Adicionar evento ao histórico - sincronização bem-sucedida
      const syncSuccessEvent: SyncEvent = {
        type: 'sync',
        timestamp: Date.now(),
        success: true,
        changeCount: changeCount,
        details: 'Sincronização concluída com sucesso'
      };
      this.addToSyncHistory(syncSuccessEvent);
      
      return true;
    } catch (error) {
      console.error('Erro durante sincronização:', error);
      
      // Atualizar estado
      this.syncState.syncInProgress = false;
      this.syncState.syncError = error instanceof Error ? error.message : 'Erro desconhecido';
      this.saveSyncState();
      
      // Adicionar evento ao histórico - erro de sincronização
      const syncErrorEvent: SyncEvent = {
        type: 'error',
        timestamp: Date.now(),
        success: false,
        details: this.syncState.syncError
      };
      this.addToSyncHistory(syncErrorEvent);
      
      return false;
    }
  }
  
  // Método para simular um processo de sincronização (para fins de demonstração)
  private async mockSyncProcess(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Simular um processo de sincronização que leva algum tempo
      setTimeout(() => {
        // 90% de chance de sucesso
        if (Math.random() < 0.9) {
          resolve();
        } else {
          reject(new Error('Falha na conexão com o servidor'));
        }
      }, 1500); // 1.5 segundos
    });
  }
  
  // Processar alterações localmente (simulação de server-side)
  private processLocalChanges(): void {
    // Em um sistema real, isso seria feito pelo servidor
    
    // Registrar alterações no histórico de sincronização
    const syncHistory = JSON.parse(localStorage.getItem('sync-history') || '[]');
    
    syncHistory.push({
      timestamp: Date.now(),
      changeCount: this.syncState.pendingChanges.length,
      status: 'success'
    });
    
    localStorage.setItem('sync-history', JSON.stringify(syncHistory));
  }
  
  // Capturar alterações em tarefas
  public trackTaskChange(type: 'add' | 'update' | 'delete' | 'complete', task: Task): void {
    this.addPendingChange({
      id: task.id,
      type,
      entity: 'task',
      data: type !== 'delete' ? task : undefined
    });
  }
  
  // Capturar alterações em listas
  public trackListChange(type: 'add' | 'update' | 'delete', list: TaskList): void {
    this.addPendingChange({
      id: list.id,
      type,
      entity: 'list',
      data: type !== 'delete' ? list : undefined
    });
  }
  
  // Capturar alterações em tags
  public trackTagChange(type: 'add' | 'delete', tag: string): void {
    this.addPendingChange({
      id: tag,
      type,
      entity: 'tag',
      data: type === 'add' ? tag : undefined
    });
  }
  
  // Limpar todas as alterações pendentes (força sincronização)
  public clearPendingChanges(): void {
    this.pendingChanges = [];
    this.savePendingChanges();
    
    // Registrar no histórico
    this.addToSyncHistory({
      type: 'sync',
      timestamp: Date.now(),
      success: true,
      details: 'Alterações pendentes limpas manualmente',
      changeCount: 0
    });
  }
  
  // Testar conexão com o servidor
  public async testConnection(): Promise<boolean> {
    if (!navigator.onLine) {
      return false;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.connectionTimeout);
      
      const response = await fetch(`${this.apiEndpoint}/ping`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
  
  // Exportar dados para backup
  public exportData(): string {
    try {
      const exportData = {
        tasks: localStorage.getItem(this.config.storageKeys.taskData),
        lists: localStorage.getItem(this.config.storageKeys.listData),
        tags: localStorage.getItem(this.config.storageKeys.tagData),
        pendingChanges: this.pendingChanges,
        exportTime: Date.now()
      };
      
      return JSON.stringify(exportData);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw new Error('Falha ao exportar dados');
    }
  }
  
  // Importar dados de backup
  public importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      // Validar dados importados
      if (!data.tasks || !data.lists) {
        throw new Error('Dados inválidos ou incompletos');
      }
      
      // Armazenar dados
      localStorage.setItem(this.config.storageKeys.taskData, data.tasks);
      localStorage.setItem(this.config.storageKeys.listData, data.lists);
      
      if (data.tags) {
        localStorage.setItem(this.config.storageKeys.tagData, data.tags);
      }
      
      if (data.pendingChanges) {
        this.pendingChanges = data.pendingChanges;
        this.savePendingChanges();
      }
      
      // Registrar no histórico
      this.addToSyncHistory({
        type: 'sync',
        timestamp: Date.now(),
        success: true,
        details: 'Dados importados de backup',
        changeCount: 0
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      
      // Registrar erro no histórico
      this.addToSyncHistory({
        type: 'error',
        timestamp: Date.now(),
        details: `Erro ao importar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
      
      return false;
    }
  }
  
  // Configurar sincronização automática
  private setupAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnlineState && this.pendingChanges.length > 0) {
        this.synchronize();
      }
    }, this.config.autoSyncInterval);
  }
  
  // Lidar com mudanças no estado da conexão
  private handleOnlineStatusChange(): void {
    const currentOnlineState = navigator.onLine;
    
    // Verificar se o estado mudou
    if (currentOnlineState !== this.lastOnlineState) {
      this.isOnlineState = currentOnlineState;
      
      // Atualizar estado de sincronização
      this.syncState.isOnline = currentOnlineState;
      this.saveSyncState();
      
      // Notificar callbacks de mudança de status
      this.notifyOnlineStatusListeners();
      
      // Registrar evento de alteração de conectividade
      if (currentOnlineState) {
        // Conexão restaurada
        const connectionRestoredEvent: SyncEvent = {
          type: 'connection-restored',
          timestamp: Date.now(),
          details: 'Conexão com a Internet restaurada'
        };
        this.addToSyncHistory(connectionRestoredEvent);
        
        // Tentar sincronizar alterações pendentes automaticamente
        if (this.syncState.hasPendingChanges && !this.syncState.syncInProgress) {
          this.synchronize();
        }
      } else {
        // Conexão perdida
        const connectionLostEvent: SyncEvent = {
          type: 'connection-lost',
          timestamp: Date.now(),
          details: 'Conexão com a Internet perdida'
        };
        this.addToSyncHistory(connectionLostEvent);
      }
      
      // Atualizar estado anterior
      this.lastOnlineState = currentOnlineState;
    }
  }
  
  // Notificar ouvintes sobre mudança de status online
  private notifyOnlineStatusListeners(): void {
    this.onlineStatusListeners.forEach(callback => {
      callback(this.isOnlineState);
    });
  }
  
  // Notificar ouvintes sobre mudança na contagem de alterações pendentes
  private notifyPendingChangesListeners(): void {
    this.pendingChangesListeners.forEach(callback => {
      callback(this.pendingChanges.length);
    });
  }
  
  // Carregar alterações pendentes do armazenamento local
  private loadPendingChanges(): void {
    try {
      const storedChanges = localStorage.getItem(this.config.storageKeys.pendingChanges);
      if (storedChanges) {
        this.pendingChanges = JSON.parse(storedChanges);
      }
    } catch (error) {
      console.error('Erro ao carregar alterações pendentes:', error);
      this.pendingChanges = [];
    }
  }
  
  // Salvar alterações pendentes no armazenamento local
  private savePendingChanges(): void {
    try {
      localStorage.setItem(
        this.config.storageKeys.pendingChanges,
        JSON.stringify(this.pendingChanges)
      );
      this.notifyPendingChangesListeners();
    } catch (error) {
      console.error('Erro ao salvar alterações pendentes:', error);
    }
  }
  
  // Adicionar uma alteração ao rastreamento
  private trackChange(entityType: string, operationType: string, data: any): void {
    const change = {
      type: entityType,
      operation: operationType,
      data: { ...data },
      timestamp: Date.now()
    };
    
    // Verificar se já existe uma alteração para a mesma entidade e atualizar
    const existingIndex = this.pendingChanges.findIndex(
      c => c.type === entityType && c.data.id === data.id
    );
    
    if (existingIndex !== -1) {
      // Se a operação atual é 'delete', ela tem precedência
      if (operationType === 'delete') {
        this.pendingChanges[existingIndex] = change;
      } 
      // Se a operação existente é 'add' e a atual é 'update', mantenha como 'add'
      else if (this.pendingChanges[existingIndex].operation === 'add' && operationType === 'update') {
        this.pendingChanges[existingIndex].data = { ...data };
        this.pendingChanges[existingIndex].timestamp = Date.now();
      }
      // Outras combinações, simplesmente atualize
      else {
        this.pendingChanges[existingIndex] = change;
      }
    } else {
      this.pendingChanges.push(change);
    }
    
    this.savePendingChanges();
  }
} 