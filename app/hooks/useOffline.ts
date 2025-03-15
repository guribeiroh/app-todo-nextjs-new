'use client';

import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar se a aplicação está offline
 * Retorna true se estiver offline, false se estiver online
 */
export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Verificar status inicial
    setIsOffline(!navigator.onLine);

    // Adicionar listeners para mudanças de estado
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Remover listeners ao desmontar o componente
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
}; 