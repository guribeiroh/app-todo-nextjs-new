'use client';

import React, { useState, useEffect } from 'react';
import { IoCloudUpload, IoCloudDone, IoCloudOffline, IoTrash, IoClose } from 'react-icons/io5';

interface SyncEvent {
  type: 'sync' | 'error' | 'connection-lost' | 'connection-restored';
  timestamp: number;
  details?: string;
  changeCount?: number;
  success?: boolean;
}

export default function SyncHistory() {
  const [history, setHistory] = useState<SyncEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Carregar histórico ao iniciar
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('neotask_sync_history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de sincronização:', error);
      setHistory([]);
    }
  }, []);
  
  // Adicionar um evento ao histórico (usado pelo serviço)
  const addEvent = (event: SyncEvent) => {
    const updatedHistory = [event, ...history].slice(0, 100); // Limitar a 100 eventos
    setHistory(updatedHistory);
    localStorage.setItem('neotask_sync_history', JSON.stringify(updatedHistory));
  };
  
  // Limpar histórico
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('neotask_sync_history');
  };
  
  // Formatar data e hora
  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  // Obter ícone baseado no tipo de evento
  const getEventIcon = (event: SyncEvent) => {
    switch (event.type) {
      case 'sync':
        return event.success 
          ? <IoCloudDone className="text-green-500" size={20} />
          : <IoCloudUpload className="text-amber-500" size={20} />;
      case 'error':
        return <IoCloudUpload className="text-red-500" size={20} />;
      case 'connection-lost':
        return <IoCloudOffline className="text-red-500" size={20} />;
      case 'connection-restored':
        return <IoCloudDone className="text-green-500" size={20} />;
      default:
        return <IoCloudUpload className="text-gray-500" size={20} />;
    }
  };
  
  // Obter descrição baseada no tipo de evento
  const getEventDescription = (event: SyncEvent) => {
    switch (event.type) {
      case 'sync':
        return event.success 
          ? `Sincronização concluída (${event.changeCount || 0} alterações)`
          : 'Sincronização iniciada';
      case 'error':
        return `Erro na sincronização: ${event.details || 'Erro desconhecido'}`;
      case 'connection-lost':
        return 'Conexão perdida';
      case 'connection-restored':
        return 'Conexão restaurada';
      default:
        return 'Evento desconhecido';
    }
  };
  
  // Obter classe CSS baseada no tipo de evento
  const getEventColor = (event: SyncEvent) => {
    switch (event.type) {
      case 'sync':
        return event.success ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'connection-lost':
        return 'bg-red-50 border-red-200';
      case 'connection-restored':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  
  if (!isOpen) {
    return (
      <div className="fixed bottom-16 right-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-blue-500 p-3 text-white shadow-lg hover:bg-blue-600"
          title="Histórico de Sincronização"
        >
          <IoCloudUpload size={20} />
        </button>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">Histórico de Sincronização</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
          >
            <IoClose size={24} />
          </button>
        </div>
        
        <div className="max-h-[calc(90vh-4rem-4rem)] overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
              <IoCloudDone size={48} className="mb-4 text-gray-300" />
              <p>Nenhum histórico de sincronização registrado.</p>
              <p className="mt-2 text-sm">O histórico será registrado à medida que você usa o aplicativo.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((event, index) => (
                <div 
                  key={index}
                  className={`flex items-start rounded-md border p-3 ${getEventColor(event)}`}
                >
                  <div className="mr-3 mt-0.5">{getEventIcon(event)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{getEventDescription(event)}</p>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>
                    {event.details && event.type === 'error' && (
                      <p className="mt-1 text-sm text-red-700">{event.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end border-t border-gray-200 p-4">
          <button
            onClick={clearHistory}
            className="mr-2 flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            disabled={history.length === 0}
          >
            <IoTrash className="mr-2" size={16} />
            Limpar Histórico
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
} 