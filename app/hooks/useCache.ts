import { useState, useEffect, useCallback } from 'react';
import CacheService from '../services/CacheService';

/**
 * Hook personalizado para facilitar o uso do serviço de cache
 * @param key A chave para o item no cache
 * @param initialValue O valor inicial se não existir no cache
 * @param maxAge Tempo máximo de vida do item em milissegundos (opcional)
 * @param isPriority Se o item deve ser considerado prioritário (persistirá no localStorage)
 */
export function useCache<T>(
  key: string, 
  initialValue: T, 
  maxAge?: number, 
  isPriority: boolean = false
): [T, (value: T | ((prevState: T) => T)) => void, () => void] {
  // Obter o serviço de cache
  const cacheService = CacheService.getInstance();
  
  // Estado local
  const [cachedValue, setCachedValue] = useState<T>(() => {
    // Tentar obter do cache primeiro
    const cached = cacheService.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    // Se não existe no cache, usar o valor inicial
    return initialValue;
  });
  
  // Configurar o item como prioritário se necessário
  useEffect(() => {
    if (isPriority) {
      cacheService.setPriorityItem(key, true);
    }
  }, [key, isPriority]);
  
  // Função para atualizar o valor no cache e no estado
  const updateCachedValue = useCallback((value: T | ((prevState: T) => T)) => {
    setCachedValue(currentValue => {
      // Calcular o novo valor
      const newValue = typeof value === 'function' 
        ? (value as ((prevState: T) => T))(currentValue) 
        : value;
      
      // Armazenar no cache
      cacheService.set(key, newValue, maxAge);
      
      return newValue;
    });
  }, [key, maxAge]);
  
  // Função para remover o item do cache
  const removeCachedValue = useCallback(() => {
    cacheService.remove(key);
    setCachedValue(initialValue);
  }, [key, initialValue]);
  
  // Retornar o valor do cache e a função para atualizá-lo, similar ao useState
  return [cachedValue, updateCachedValue, removeCachedValue];
}

/**
 * Hook simplificado para gerenciar o cache de forma mais eficiente
 * com gerenciamento de estado local e remoto sincronizado
 */
export function useSyncedCache<T>(
  key: string,
  options?: {
    initialValue?: T;
    maxAge?: number;
    isPriority?: boolean;
    onError?: (error: Error) => void;
  }
) {
  const {
    initialValue = null as unknown as T,
    maxAge,
    isPriority = false,
    onError = (error: Error) => console.error('Erro no cache:', error)
  } = options || {};
  
  const cacheService = CacheService.getInstance();
  const [value, setValue] = useState<T | null>(() => {
    try {
      const cached = cacheService.get<T>(key);
      return cached !== null ? cached : initialValue;
    } catch (error) {
      onError(error as Error);
      return initialValue;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Configurações iniciais
  useEffect(() => {
    if (isPriority) {
      cacheService.setPriorityItem(key, true);
    }
  }, [key, isPriority]);
  
  // Obter do cache
  const get = useCallback(() => {
    try {
      const cached = cacheService.get<T>(key);
      setValue(cached !== null ? cached : initialValue);
      return cached;
    } catch (error) {
      const err = error as Error;
      setError(err);
      onError(err);
      return null;
    }
  }, [key, initialValue]);
  
  // Definir no cache
  const set = useCallback(
    (newValue: T | ((prevValue: T | null) => T)) => {
      setLoading(true);
      setError(null);
      
      try {
        const valueToStore = typeof newValue === 'function'
          ? (newValue as ((prevValue: T | null) => T))(value)
          : newValue;
        
        cacheService.set(key, valueToStore, maxAge);
        setValue(valueToStore);
        setLoading(false);
        return true;
      } catch (error) {
        const err = error as Error;
        setError(err);
        onError(err);
        setLoading(false);
        return false;
      }
    },
    [key, maxAge, value]
  );
  
  // Remover do cache
  const remove = useCallback(() => {
    try {
      cacheService.remove(key);
      setValue(initialValue);
      return true;
    } catch (error) {
      const err = error as Error;
      setError(err);
      onError(err);
      return false;
    }
  }, [key, initialValue]);
  
  return {
    value,
    loading,
    error,
    get,
    set,
    remove
  };
} 