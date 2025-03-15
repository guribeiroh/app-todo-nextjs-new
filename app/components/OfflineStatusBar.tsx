'use client';

import React, { useState } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { IoCloudOffline, IoCloudDone, IoCloudUpload, IoCog, IoDownload, IoArrowUp } from 'react-icons/io5';

interface OfflineStatusBarProps {
  onSettingsClick?: () => void;
}

export default function OfflineStatusBar({ onSettingsClick }: OfflineStatusBarProps) {
  const { 
    isOnline, 
    pendingChanges, 
    syncInProgress,

    lastSyncTime,
    synchronize,
    exportOfflineData,
    testConnection 
  } = useOfflineSync();
  
  const [showDetails, setShowDetails] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);
  
  // Formatar a hora da última sincronização
  const formatLastSync = () => {
    if (!lastSyncTime) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    
    // Se for menos de um minuto
    if (diff < 60 * 1000) {
      return 'Agora mesmo';
    }
    
    // Se for menos de uma hora
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} atrás`;
    }
    
    // Se for hoje
    if (now.toDateString() === lastSyncTime.toDateString()) {
      return `Hoje às ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Se for ontem
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === lastSyncTime.toDateString()) {
      return `Ontem às ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Outro dia
    return lastSyncTime.toLocaleString();
  };
  
  // Gerar dados para exportação
  const handleExport = () => {
    try {
      const data = exportOfflineData();
      setExportData(data);
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      // Implementar notificação de erro
    }
  };
  
  // Copiar dados para a área de transferência
  const handleCopyToClipboard = () => {
    if (exportData) {
      navigator.clipboard.writeText(exportData)
        .then(() => {
          // Implementar notificação de sucesso
          alert('Dados copiados para a área de transferência!');
        })
        .catch(err => {
          console.error('Erro ao copiar:', err);
          // Implementar notificação de erro
        });
    }
  };
  
  // Verificar conexão manualmente
  const handleTestConnection = async () => {
    const connected = await testConnection();
    if (connected && pendingChanges > 0) {
      synchronize();
    }
    // Implementar notificação do resultado
  };
  
  // Status principal
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <IoCloudOffline className="text-red-500" size={18} />,
        text: 'Offline',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700'
      };
    }
    
    if (syncInProgress) {
      return {
        icon: <IoCloudUpload className="text-blue-500 animate-pulse" size={18} />,
        text: 'Sincronizando...',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700'
      };
    }
    
    if (pendingChanges > 0) {
      return {
        icon: <IoCloudUpload className="text-amber-500" size={18} />,
        text: `${pendingChanges} ${pendingChanges === 1 ? 'alteração pendente' : 'alterações pendentes'}`,
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700'
      };
    }
    
    return {
      icon: <IoCloudDone className="text-green-500" size={18} />,
      text: 'Sincronizado',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700'
    };
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-1 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        {/* Botão principal com status */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-2 rounded-md px-3 py-1 text-sm ${statusInfo.bgColor} ${statusInfo.textColor}`}
        >
          {statusInfo.icon}
          <span>{statusInfo.text}</span>
          {pendingChanges > 0 && isOnline && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                synchronize();
              }}
              className="ml-2 rounded-full bg-blue-500 p-1 text-white hover:bg-blue-600 focus:outline-none"
              title="Sincronizar agora"
            >
              <IoArrowUp size={12} />
            </button>
          )}
        </button>

        {/* Ações à direita */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleTestConnection}
            className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            title="Verificar conexão"
          >
            Verificar
          </button>
          
          <button 
            onClick={onSettingsClick}
            className="rounded-md p-1 text-gray-600 hover:bg-gray-100"
            title="Configurações de sincronização"
          >
            <IoCog size={18} />
          </button>
        </div>
      </div>
      
      {/* Painel de detalhes */}
      {showDetails && (
        <div className="container mx-auto mt-1 rounded-md border border-gray-200 bg-white p-3 text-sm shadow-lg">
          <div className="mb-2 grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-gray-700">Status de Conexão:</p>
              <p className={isOnline ? "text-green-600" : "text-red-600"}>
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
            
            <div>
              <p className="font-medium text-gray-700">Alterações Pendentes:</p>
              <p>{pendingChanges}</p>
            </div>
            
            <div>
              <p className="font-medium text-gray-700">Última Sincronização:</p>
              <p>{formatLastSync()}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-2">
            <button 
              onClick={() => synchronize()}
              disabled={!isOnline || pendingChanges === 0 || syncInProgress}
              className={`rounded-md px-3 py-1 text-white ${
                !isOnline || pendingChanges === 0 || syncInProgress
                  ? "bg-gray-400"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              Sincronizar Agora
            </button>
            
            <button 
              onClick={handleExport}
              className="rounded-md bg-green-500 px-3 py-1 text-white hover:bg-green-600"
            >
              Exportar Dados
            </button>
          </div>
          
          {exportData && (
            <div className="mt-3 rounded-md border border-gray-300 bg-gray-50 p-2">
              <div className="flex justify-between">
                <h4 className="font-medium">Dados exportados</h4>
                <button 
                  onClick={handleCopyToClipboard}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Copiar
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-600">
                Copie estes dados para fazer backup ou transferir para outro dispositivo.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 