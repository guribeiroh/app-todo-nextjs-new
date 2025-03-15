// Este arquivo contém uma solução temporária para o problema de navigator.onLine
// Ele pode ser importado em page.tsx se necessário

import { useEffect } from 'react';

// Solução temporária mais robusta para problemas com navigator/window
export function useFixNavigatorIssue() {
  useEffect(() => {
    // Este hook só funciona no cliente
    if (typeof window === 'undefined') return;
    
    // Detectar e remover quaisquer event listeners relacionados a online/offline
    // que possam ter sido adicionados fora do hook useOffline
    
    // 1. Salvar as funções originais
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;
    
    // 2. Substituir addEventListener para evitar novos listeners problemáticos
    window.addEventListener = function(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
      // Bloquear novos event listeners de online/offline
      if (type === 'online' || type === 'offline') {
        console.warn('[Fix] Bloqueado registro de evento ' + type + '. Use o hook useOffline.');
        return undefined;
      }
      
      // Permitir outros tipos de event listeners
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // 3. Também substituir o removeEventListener para manter a consistência
    window.removeEventListener = function(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
      // Ignorar tentativas de remover eventos online/offline
      if (type === 'online' || type === 'offline') {
        console.warn('[Fix] Ignorada remoção de evento ' + type + '. Use o hook useOffline.');
        return undefined;
      }
      
      // Permitir remover outros tipos de listeners
      return originalRemoveEventListener.call(this, type, listener, options);
    };
    
    // 4. Definir uma proprieta navigator.onLine segura
    // que não causará erros durante SSR
    try {
      // Usar Object.defineProperty para interceptar acessos a navigator.onLine
      if (typeof navigator !== 'undefined') {
        const originalOnlineGetter = Object.getOwnPropertyDescriptor(navigator, 'onLine')?.get;
        
        if (originalOnlineGetter) {
          Object.defineProperty(navigator, 'onLine', {
            get: function() {
              // No SSR, retorne true como valor padrão
              if (typeof window === 'undefined') return true;
              // No cliente, use o getter original
              return originalOnlineGetter.call(this);
            }
          });
        }
      }
    } catch (e) {
      console.warn('[Fix] Não foi possível proteger navigator.onLine:', e);
    }
    
    // 5. Reverter as funções originais após um delay
    // para permitir que a aplicação inicialize completamente
    const timeout = setTimeout(() => {
      window.addEventListener = originalAddEventListener;
      window.removeEventListener = originalRemoveEventListener;
      console.log('[Fix] Restauradas funções originais de manipulação de eventos');
    }, 3000);
    
    // Limpeza
    return () => {
      clearTimeout(timeout);
      window.addEventListener = originalAddEventListener;
      window.removeEventListener = originalRemoveEventListener;
    };
  }, []);
} 