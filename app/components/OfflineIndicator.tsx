import React, { useState, useEffect } from 'react';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error'>('synced');

  useEffect(() => {
    // Verificar estado inicial de conexão
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    
    // Monitora mudanças no estado de conexão
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingChanges();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Verificar se há dados pendentes quando inicia
      checkPendingChanges();
      
      // Registrar Service Worker para funcionalidades de PWA
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registrado com sucesso:', registration);
          })
          .catch(error => {
            console.error('Falha ao registrar Service Worker:', error);
          });
      }
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);
  
  // Simula verificação de mudanças pendentes (em uma aplicação real, usaria indexedDB ou outro mecanismo)
  const checkPendingChanges = () => {
    const pendingData = localStorage.getItem('pending-sync-data');
    if (pendingData) {
      try {
        const data = JSON.parse(pendingData);
        setPendingChanges(data.length);
        if (data.length > 0) {
          setShowIndicator(true);
          setSyncStatus('pending');
        }
      } catch (e) {
        console.error('Erro ao processar dados pendentes:', e);
      }
    }
  };
  
  // Simula sincronização de mudanças pendentes
  const syncPendingChanges = async () => {
    if (!isOnline) return;
    
    const pendingData = localStorage.getItem('pending-sync-data');
    if (!pendingData) return;
    
    try {
      setSyncStatus('pending');
      // Simulação de sincronização com servidor
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Em uma aplicação real, enviaria as alterações para o servidor aqui
      
      // Limpar dados pendentes após sincronização bem-sucedida
      localStorage.removeItem('pending-sync-data');
      setPendingChanges(0);
      setSyncStatus('synced');
      
      // Oculta o indicador após 3 segundos
      setTimeout(() => {
        if (pendingChanges === 0) {
          setShowIndicator(false);
        }
      }, 3000);
    } catch (e) {
      console.error('Erro ao sincronizar dados:', e);
      setSyncStatus('error');
    }
  };
  
  // Adiciona mudança à fila de sincronização
  const addToPendingChanges = (change: any) => {
    try {
      const pendingData = localStorage.getItem('pending-sync-data');
      const changes = pendingData ? JSON.parse(pendingData) : [];
      changes.push(change);
      localStorage.setItem('pending-sync-data', JSON.stringify(changes));
      setPendingChanges(changes.length);
      setSyncStatus('pending');
      setShowIndicator(true);
    } catch (e) {
      console.error('Erro ao adicionar mudança pendente:', e);
    }
  };
  
  if (!showIndicator) return null;
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-full py-2 px-4 flex items-center gap-2 transition-all duration-300 ${
      isOnline 
        ? syncStatus === 'pending' 
          ? 'bg-amber-500 text-white' 
          : syncStatus === 'error' 
            ? 'bg-red-500 text-white'
            : 'bg-green-500 text-white'
        : 'bg-red-500 text-white'
    }`}>
      {isOnline ? (
        <>
          <FaWifi className="text-lg" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {syncStatus === 'pending' 
                ? `Sincronizando ${pendingChanges} alterações...` 
                : syncStatus === 'error'
                  ? 'Erro na sincronização'
                  : 'Sincronizado'}
            </span>
            {syncStatus === 'pending' && (
              <div className="w-full bg-amber-700 rounded-full h-1 mt-1">
                <div className="bg-white h-1 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <FaExclamationTriangle className="text-lg" />
          <span className="text-sm font-medium">
            Você está offline. Suas alterações serão sincronizadas quando a conexão retornar.
          </span>
        </>
      )}
      <button 
        onClick={() => setShowIndicator(false)}
        className="ml-2 text-white hover:text-gray-200 font-bold"
      >
        ×
      </button>
    </div>
  );
};

// Expor funções úteis para uso em outros componentes
export { OfflineIndicator };

// Hook personalizado para usar em componentes que precisam sincronizar dados
export const useSyncedState = (key: string, initialValue: any) => {
  const [state, setState] = useState(() => {
    // Tentar obter do localStorage
    const saved = localStorage.getItem(`synced-${key}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialValue;
      }
    }
    return initialValue;
  });
  
  // Atualiza o estado e marca para sincronização
  const setSyncedState = (value: any) => {
    const newValue = typeof value === 'function' ? value(state) : value;
    setState(newValue);
    
    // Salvar localmente
    localStorage.setItem(`synced-${key}`, JSON.stringify(newValue));
    
    // Adicionar à fila de sincronização (em uma app real, usaria background sync)
    const change = {
      key,
      value: newValue,
      timestamp: new Date().toISOString()
    };
    
    // Simulação: armazenar em localStorage para sync posterior
    try {
      const pendingData = localStorage.getItem('pending-sync-data');
      const changes = pendingData ? JSON.parse(pendingData) : [];
      changes.push(change);
      localStorage.setItem('pending-sync-data', JSON.stringify(changes));
    } catch (e) {
      console.error('Erro ao adicionar à fila de sincronização:', e);
    }
  };
  
  return [state, setSyncedState];
}; 