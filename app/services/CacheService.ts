import { Task, TaskList } from '../types';

/**
 * Configurações de cache
 */
interface CachePreferences {
  maxAge: number; // Tempo máximo de armazenamento em ms
  itemSpecificMaxAge: Map<string, number>; // Tempo específico para determinados itens
  priorityItems: Set<string>; // Itens prioritários que serão mantidos no cache mesmo quando outros forem removidos
  itemsToPreload: Set<string>; // Itens que serão pré-carregados ao iniciar a aplicação
}

/**
 * Serviço de cache inteligente para melhorar o desempenho da aplicação
 * Implementa estratégias de cache para reduzir o uso de recursos e melhorar o tempo de resposta
 */
export default class CacheService {
  private static instance: CacheService;
  private cache: Map<string, { data: any; timestamp: number; }> = new Map();
  private preferences: CachePreferences = {
    maxAge: 24 * 60 * 60 * 1000, // 24 horas como padrão
    itemSpecificMaxAge: new Map(),
    priorityItems: new Set(),
    itemsToPreload: new Set(),
  };

  private constructor() {
    this.loadFromLocalStorage();
    this.setupCleanupInterval();
    this.preloadCacheItems();
  }

  /**
   * Obter a instância do serviço (Singleton)
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Armazenar um item no cache
   */
  public set<T>(key: string, value: T, customMaxAge?: number): void {
    const timestamp = Date.now();
    
    // Verificar se é um item com valor potencialmente grande (como listas de tarefas)
    let shouldCompress = false;
    
    if (Array.isArray(value) && value.length > 100) {
      shouldCompress = true;
    }
    
    this.cache.set(key, { 
      data: shouldCompress ? this.compressData(value) : value, 
      timestamp 
    });
    
    if (customMaxAge) {
      this.preferences.itemSpecificMaxAge.set(key, customMaxAge);
    }
    
    // Persistir no localStorage para itens importantes
    if (this.preferences.priorityItems.has(key)) {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify({
          data: value,
          timestamp
        }));
      } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
      }
    }
  }

  /**
   * Obter um item do cache
   */
  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Verificar se o item expirou
    const maxAge = this.preferences.itemSpecificMaxAge.get(key) || this.preferences.maxAge;
    if (Date.now() - item.timestamp > maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    // Descomprimir se necessário
    const data = typeof item.data === 'string' && item.data.startsWith('COMPRESSED:')
      ? this.decompressData(item.data)
      : item.data;
    
    return data as T;
  }

  /**
   * Remover um item do cache
   */
  public remove(key: string): void {
    this.cache.delete(key);
    localStorage.removeItem(`cache_${key}`);
  }

  /**
   * Limpar todo o cache
   */
  public clear(): void {
    this.cache.clear();
    
    // Remover itens do localStorage
    Array.from(this.preferences.priorityItems).forEach(key => {
      localStorage.removeItem(`cache_${key}`);
    });
  }

  /**
   * Configurar as preferências de cache
   */
  public setPreferences(preferences: Partial<CachePreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
  }

  /**
   * Definir um item como prioritário
   */
  public setPriorityItem(key: string, isPriority: boolean): void {
    if (isPriority) {
      this.preferences.priorityItems.add(key);
    } else {
      this.preferences.priorityItems.delete(key);
    }
  }

  /**
   * Definir um item para pré-carregamento
   */
  public setPreloadItem(key: string, shouldPreload: boolean): void {
    if (shouldPreload) {
      this.preferences.itemsToPreload.add(key);
    } else {
      this.preferences.itemsToPreload.delete(key);
    }
  }

  /**
   * Carregar dados do localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('cache_')) {
          const cacheKey = key.replace('cache_', '');
          const value = localStorage.getItem(key);
          
          if (value) {
            const parsed = JSON.parse(value);
            this.cache.set(cacheKey, parsed);
            this.preferences.priorityItems.add(cacheKey);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cache do localStorage:', error);
    }
  }

  /**
   * Configurar intervalo de limpeza do cache
   */
  private setupCleanupInterval(): void {
    // Limpar o cache a cada hora
    setInterval(() => {
      const now = Date.now();
      
      Array.from(this.cache.entries()).forEach(([key, item]) => {
        // Não limpar itens prioritários
        if (this.preferences.priorityItems.has(key)) {
          return;
        }
        
        const maxAge = this.preferences.itemSpecificMaxAge.get(key) || this.preferences.maxAge;
        if (now - item.timestamp > maxAge) {
          this.cache.delete(key);
        }
      });
    }, 60 * 60 * 1000); // 1 hora
  }

  /**
   * Pré-carregar itens do cache
   */
  private preloadCacheItems(): void {
    // Implementar lógica de pré-carregamento
    // Por exemplo, carregar listas comuns ou tarefas recentes
  }

  /**
   * Comprimir dados para economizar memória
   * Simplificação: apenas adiciona um marcador para fins de demonstração
   */
  private compressData(data: any): string {
    // Em uma implementação real, usaríamos uma biblioteca de compressão
    return `COMPRESSED:${JSON.stringify(data)}`;
  }

  /**
   * Descomprimir dados
   */
  private decompressData(compressedData: string): any {
    // Em uma implementação real, usaríamos uma biblioteca de descompressão
    const jsonData = compressedData.replace('COMPRESSED:', '');
    return JSON.parse(jsonData);
  }
} 