import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheOptions {
  ttl?: number;  // Time-to-live em milissegundos
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
  namespace?: string;
}

interface CacheItem<T> {
  value: T;
  timestamp: number;
  expiry: number;
}

/**
 * Hook personalizado para caching de recursos com expiração e invalidação inteligente
 * Melhora o desempenho ao evitar buscas repetidas de dados
 * 
 * @param key Chave única para identificar o recurso
 * @param fetchFn Função assíncrona para buscar o recurso quando necessário
 * @param options Opções de configuração do cache
 * @returns Objeto com o valor em cache, funções para atualizar e invalidar
 */
export default function useResourceCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutos padrão
    storage = 'memory',
    namespace = 'app_cache'
  } = options;

  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const memoryCache = useRef<Map<string, CacheItem<T>>>(new Map());

  const cacheKey = `${namespace}:${key}`;

  // Função para salvar no cache
  const saveToCache = useCallback((value: T) => {
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };

    if (storage === 'memory') {
      memoryCache.current.set(cacheKey, item);
    } else {
      try {
        const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
        storageObj.setItem(cacheKey, JSON.stringify(item));
      } catch (err) {
        console.error('Error saving to storage:', err);
      }
    }

    setValue(value);
    setLastUpdated(Date.now());
  }, [cacheKey, storage, ttl]);

  // Função para ler do cache
  const readFromCache = useCallback((): CacheItem<T> | null => {
    if (storage === 'memory') {
      return memoryCache.current.get(cacheKey) || null;
    } else {
      try {
        const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
        const item = storageObj.getItem(cacheKey);
        return item ? JSON.parse(item) : null;
      } catch (err) {
        console.error('Error reading from storage:', err);
        return null;
      }
    }
  }, [cacheKey, storage]);

  // Verifica se o cache é válido (não expirou)
  const isCacheValid = useCallback((item: CacheItem<T> | null): boolean => {
    if (!item) return false;
    return Date.now() < item.expiry;
  }, []);

  // Função para buscar ou atualizar o recurso
  const fetchResource = useCallback(async (force = false) => {
    // Se não forçar atualização, verifique o cache primeiro
    if (!force) {
      const cachedItem = readFromCache();
      if (isCacheValid(cachedItem)) {
        setValue(cachedItem!.value);
        setLastUpdated(cachedItem!.timestamp);
        return cachedItem!.value;
      }
    }

    // Se chegou aqui, precisamos buscar novamente
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      saveToCache(result);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
      throw err;
    }
  }, [fetchFn, isCacheValid, readFromCache, saveToCache]);

  // Função para invalidar o cache manualmente
  const invalidateCache = useCallback(() => {
    if (storage === 'memory') {
      memoryCache.current.delete(cacheKey);
    } else {
      try {
        const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
        storageObj.removeItem(cacheKey);
      } catch (err) {
        console.error('Error removing from storage:', err);
      }
    }
    
    setValue(null);
    setLastUpdated(null);
  }, [cacheKey, storage]);

  // Inicializar: tenta ler do cache na montagem
  useEffect(() => {
    const initializeFromCache = async () => {
      const cachedItem = readFromCache();
      
      // Se o cache é válido, use-o
      if (isCacheValid(cachedItem)) {
        setValue(cachedItem!.value);
        setLastUpdated(cachedItem!.timestamp);
      } else {
        // Se não for válido, busque novamente, mas não bloqueie a renderização
        fetchResource().catch(() => {});
      }
    };

    initializeFromCache();
  }, [isCacheValid, readFromCache, fetchResource]);

  return {
    value,
    loading,
    error,
    lastUpdated,
    refresh: () => fetchResource(true),
    invalidate: invalidateCache,
  };
} 