'use client';

import React, { useState, useRef } from 'react';
import { IoClose, IoCheckmark, IoCloudUpload, IoDownload, IoTrash, IoWarning } from 'react-icons/io5';
import { useOfflineSync } from '../hooks/useOfflineSync';

interface OfflineSettingsProps {
  onClose: () => void;
}

export default function OfflineSettings({ onClose }: OfflineSettingsProps) {
  // Obter funções e estados do hook
  const { 
    isOnline, 
    pendingChanges, 
    exportOfflineData, 
    importOfflineData, 
    clearPendingChanges 
  } = useOfflineSync();
  
  // Estados locais
  const [activeTab, setActiveTab] = useState<'geral' | 'backup' | 'avancado'>('geral');
  const [importing, setImporting] = useState(false);
  const [importData, setImportData] = useState<string>('');
  const [importResult, setImportResult] = useState<{success: boolean; message: string} | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Configurações
  const [settings, setSettings] = useState({
    autoSync: true,
    syncInterval: 30,  // em segundos
    backgroundSync: true,
    syncOnLoad: true,
    conflictResolution: 'local' as 'local' | 'remote' | 'ask',
    maxRetries: 3,
    wifiOnly: false,
    notifyOnSync: true
  });
  
  // Referência para o input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Manipuladores de eventos para alterações nas configurações
  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    // Em uma implementação real, salvaríamos isso no localStorage
    localStorage.setItem('offlineSettings', JSON.stringify({
      ...settings,
      [setting]: value
    }));
  };
  
  // Exportar dados para arquivo
  const handleExport = () => {
    const data = exportOfflineData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `neotask_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Gatilho para abrir o seletor de arquivo
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Manipular upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);
      setImporting(true);
    };
    reader.readAsText(file);
  };
  
  // Manipular a importação de dados
  const handleImport = () => {
    try {
      const success = importOfflineData(importData);
      
      if (success) {
        setImportResult({
          success: true,
          message: 'Dados importados com sucesso! Recarregue a página para aplicar as alterações.'
        });
      } else {
        throw new Error('Falha ao importar dados.');
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao importar dados.'
      });
    }
  };
  
  // Limpar todas as alterações pendentes
  const handleClearPendingChanges = () => {
    clearPendingChanges();
    setShowClearConfirm(false);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">Configurações de Sincronização</h2>
          <button 
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
          >
            <IoClose size={24} />
          </button>
        </div>
        
        {/* Navegação por abas */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('geral')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'geral' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Geral
          </button>
          
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'backup' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Backup e Restauração
          </button>
          
          <button
            onClick={() => setActiveTab('avancado')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'avancado' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Avançado
          </button>
        </div>
        
        {/* Conteúdo da aba */}
        <div className="p-6">
          {/* Aba Geral */}
          {activeTab === 'geral' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Sincronização Automática</h3>
                  <p className="text-sm text-gray-500">Sincronizar automaticamente quando houver alterações</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input 
                    type="checkbox" 
                    checked={settings.autoSync}
                    onChange={e => handleSettingChange('autoSync', e.target.checked)}
                    className="peer sr-only" 
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>
              
              {settings.autoSync && (
                <div className="ml-6 mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Intervalo de Sincronização
                    <div className="mt-1 flex items-center">
                      <input 
                        type="range" 
                        min="5" 
                        max="300" 
                        step="5"
                        value={settings.syncInterval}
                        onChange={e => handleSettingChange('syncInterval', parseInt(e.target.value))}
                        className="mr-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200" 
                      />
                      <span className="w-16 text-sm text-gray-600">
                        {settings.syncInterval} seg
                      </span>
                    </div>
                  </label>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h3 className="font-medium text-gray-900">Sincronizar ao Iniciar</h3>
                  <p className="text-sm text-gray-500">Verificar atualizações ao abrir o aplicativo</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input 
                    type="checkbox" 
                    checked={settings.syncOnLoad}
                    onChange={e => handleSettingChange('syncOnLoad', e.target.checked)}
                    className="peer sr-only" 
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h3 className="font-medium text-gray-900">Apenas em Wi-Fi</h3>
                  <p className="text-sm text-gray-500">Sincronizar apenas quando conectado a uma rede Wi-Fi</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input 
                    type="checkbox" 
                    checked={settings.wifiOnly}
                    onChange={e => handleSettingChange('wifiOnly', e.target.checked)}
                    className="peer sr-only" 
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h3 className="font-medium text-gray-900">Notificações de Sincronização</h3>
                  <p className="text-sm text-gray-500">Mostrar notificações ao sincronizar alterações</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input 
                    type="checkbox" 
                    checked={settings.notifyOnSync}
                    onChange={e => handleSettingChange('notifyOnSync', e.target.checked)}
                    className="peer sr-only" 
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>
              
              <div className="mt-4 pt-3">
                <h3 className="mb-2 font-medium text-gray-900">Resolução de Conflitos</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="radio"
                      name="conflictResolution"
                      checked={settings.conflictResolution === 'local'}
                      onChange={() => handleSettingChange('conflictResolution', 'local')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 block text-sm text-gray-900">Priorizar alterações locais</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input 
                      type="radio"
                      name="conflictResolution"
                      checked={settings.conflictResolution === 'remote'}
                      onChange={() => handleSettingChange('conflictResolution', 'remote')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 block text-sm text-gray-900">Priorizar alterações do servidor</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input 
                      type="radio"
                      name="conflictResolution"
                      checked={settings.conflictResolution === 'ask'}
                      onChange={() => handleSettingChange('conflictResolution', 'ask')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 block text-sm text-gray-900">Perguntar cada vez</span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Aba Backup e Restauração */}
          {activeTab === 'backup' && (
            <div>
              {!importing ? (
                <>
                  <div className="mb-6 rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                    <div className="flex">
                      <IoCloudUpload className="mr-2 h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Backup e restauração</p>
                        <p className="mt-1">Exporte seus dados para fazer backup ou transferi-los para outro dispositivo.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6 space-y-4">
                    <div>
                      <h3 className="mb-2 font-medium text-gray-900">Exportar Dados</h3>
                      <p className="mb-3 text-sm text-gray-600">
                        Exporte todos os seus dados, incluindo tarefas, listas e configurações para um arquivo JSON.
                      </p>
                      <button
                        onClick={handleExport}
                        className="flex items-center rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                      >
                        <IoDownload className="mr-2" />
                        Exportar para arquivo
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="mb-2 font-medium text-gray-900">Importar Dados</h3>
                      <p className="mb-3 text-sm text-gray-600">
                        Restaure seus dados a partir de um arquivo de backup previamente exportado.
                      </p>
                      <button
                        onClick={triggerFileInput}
                        className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <IoCloudUpload className="mr-2" />
                        Selecionar arquivo de backup
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".json"
                        className="hidden" 
                      />
                    </div>
                  </div>
                  
                  <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
                    <div className="flex">
                      <IoWarning className="mr-2 h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Atenção</p>
                        <p className="mt-1">Importar um backup substituirá todos os seus dados atuais. Certifique-se de exportar seus dados atuais primeiro, se necessário.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900">Confirmar Importação</h3>
                  
                  {importResult ? (
                    <div className={`mb-4 rounded-md p-4 ${
                      importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {importResult.success ? (
                        <div className="flex">
                          <IoCheckmark className="mr-2 h-5 w-5 text-green-500" />
                          <p>{importResult.message}</p>
                        </div>
                      ) : (
                        <div className="flex">
                          <IoWarning className="mr-2 h-5 w-5 text-red-500" />
                          <p>{importResult.message}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="mb-4 text-sm text-gray-600">
                        Você está prestes a importar um arquivo de backup. Esta ação substituirá todos os seus dados atuais. Deseja continuar?
                      </p>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={handleImport}
                          className="flex items-center rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                        >
                          <IoCheckmark className="mr-2" />
                          Confirmar Importação
                        </button>
                        
                        <button
                          onClick={() => {
                            setImporting(false);
                            setImportData('');
                          }}
                          className="flex items-center rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          <IoClose className="mr-2" />
                          Cancelar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Aba Avançado */}
          {activeTab === 'avancado' && (
            <div>
              <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
                <div className="flex">
                  <IoWarning className="mr-2 h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Atenção</p>
                    <p className="mt-1">As configurações avançadas podem afetar o desempenho e a estabilidade do aplicativo. Use com cautela.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Número Máximo de Tentativas</h3>
                  <p className="text-sm text-gray-500">Número de tentativas antes de desistir da sincronização</p>
                  <div className="mt-1 flex items-center">
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={settings.maxRetries}
                      onChange={e => handleSettingChange('maxRetries', parseInt(e.target.value))}
                      className="mr-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200" 
                    />
                    <span className="w-8 text-sm text-gray-600">
                      {settings.maxRetries}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <h3 className="font-medium text-gray-900">Sincronização em Segundo Plano</h3>
                    <p className="text-sm text-gray-500">Sincronizar mesmo quando o aplicativo estiver fechado</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input 
                      type="checkbox" 
                      checked={settings.backgroundSync}
                      onChange={e => handleSettingChange('backgroundSync', e.target.checked)}
                      className="peer sr-only" 
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                  </label>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="mb-2 font-medium text-gray-900">Limpar Alterações Pendentes</h3>
                  <p className="mb-3 text-sm text-gray-600">
                    {pendingChanges === 0 
                      ? 'Não há alterações pendentes para sincronização.'
                      : `Há ${pendingChanges} alterações pendentes para sincronização. Você pode limpar todas as alterações pendentes se estiver enfrentando problemas de sincronização.`
                    }
                  </p>
                  
                  {pendingChanges > 0 && (
                    <div>
                      {!showClearConfirm ? (
                        <button
                          onClick={() => setShowClearConfirm(true)}
                          className="flex items-center rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                        >
                          <IoTrash className="mr-2" />
                          Limpar Alterações Pendentes
                        </button>
                      ) : (
                        <div className="rounded-md border border-red-300 bg-red-50 p-3">
                          <p className="mb-2 text-sm text-red-800">
                            Tem certeza? Esta ação irá descartar todas as alterações pendentes de sincronização.
                          </p>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleClearPendingChanges}
                              className="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setShowClearConfirm(false)}
                              className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-800 hover:bg-gray-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Rodapé */}
        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
} 