import React, { useState, useEffect } from 'react';
import { FiX, FiBell, FiVolume2, FiMoon, FiClock, FiToggleRight, FiToggleLeft, FiCheck } from 'react-icons/fi';
import NotificationService, { NotificationSettings as Settings } from '../services/NotificationService';

interface NotificationSettingsProps {
  onClose: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    dueDateReminders: true,
    priorityTaskReminders: true,
    dailyDigest: false,
    reminderTiming: 'dayBefore',
    notificationSound: true,
    soundVolume: 70,
    notificationsForCompletedTasks: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });
  
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  
  // Carregar configurações ao iniciar
  useEffect(() => {
    const service = NotificationService.getInstance();
    setSettings(service.getSettings());
    setIsSupported(service.isSupported());
    
    if (service.isSupported()) {
      setPermissionStatus(Notification.permission);
    }
  }, []);
  
  // Salvar configurações quando alteradas
  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Salvar no serviço
    const service = NotificationService.getInstance();
    service.saveSettings(updatedSettings);
  };
  
  // Solicitar permissão
  const requestPermission = async () => {
    const service = NotificationService.getInstance();
    const granted = await service.requestPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
    
    if (granted) {
      handleSettingsChange({ enabled: true });
    }
  };
  
  // Enviar notificação de teste
  const sendTestNotification = () => {
    const service = NotificationService.getInstance();
    
    if (service.getHasPermission()) {
      service.showNotification(
        'Notificação de Teste',
        {
          body: 'Esta é uma notificação de teste do NeoTask. Se você está vendo isso, suas notificações estão funcionando corretamente!',
          requireInteraction: false
        }
      );
      
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);
    } else {
      alert('É necessário ter permissão para notificações. Por favor, conceda permissão primeiro.');
    }
  };
  
  // Renderizar estado de permissão
  const renderPermissionStatus = () => {
    if (!isSupported) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-yellow-700 dark:text-yellow-300 mb-6">
          <p className="text-sm">Seu navegador não suporta notificações. Considere usar um navegador moderno como Chrome, Firefox, Edge ou Safari.</p>
        </div>
      );
    }
    
    if (permissionStatus === 'granted') {
      return (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-300 mb-6">
          <p className="text-sm flex items-center"><FiCheck className="mr-2" /> Notificações permitidas</p>
        </div>
      );
    }
    
    if (permissionStatus === 'denied') {
      return (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 mb-6">
          <p className="text-sm">Notificações bloqueadas. Por favor, altere as permissões do site nas configurações do seu navegador.</p>
        </div>
      );
    }
    
    return (
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-blue-700 dark:text-blue-300 mb-6">
        <p className="text-sm mb-2">Ative as notificações para receber lembretes de tarefas e atualizações importantes.</p>
        <button
          onClick={requestPermission}
          className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
        >
          Permitir Notificações
        </button>
      </div>
    );
  };
  
  // Toggle para opções booleanas
  const ToggleOption = ({ 
    label, 
    value, 
    onChange, 
    disabled = false 
  }: { 
    label: string, 
    value: boolean, 
    onChange: (value: boolean) => void,
    disabled?: boolean 
  }) => (
    <div className={`flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 ${disabled ? 'opacity-60' : ''}`}>
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <button 
        onClick={() => !disabled && onChange(!value)}
        className="text-2xl"
        disabled={disabled}
      >
        {value ? <FiToggleRight className="text-indigo-600 dark:text-indigo-400" /> : <FiToggleLeft className="text-gray-400" />}
      </button>
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <FiBell className="text-indigo-600 dark:text-indigo-400" />
            Configurações de Notificações
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {renderPermissionStatus()}
          
          <ToggleOption 
            label="Ativar notificações" 
            value={settings.enabled}
            onChange={(value) => handleSettingsChange({ enabled: value })}
            disabled={permissionStatus !== 'granted'}
          />
          
          <ToggleOption 
            label="Lembretes de data de vencimento" 
            value={settings.dueDateReminders}
            onChange={(value) => handleSettingsChange({ dueDateReminders: value })}
            disabled={!settings.enabled || permissionStatus !== 'granted'}
          />
          
          <ToggleOption 
            label="Alertas para tarefas de alta prioridade" 
            value={settings.priorityTaskReminders}
            onChange={(value) => handleSettingsChange({ priorityTaskReminders: value })}
            disabled={!settings.enabled || permissionStatus !== 'granted'}
          />
          
          <ToggleOption 
            label="Resumo diário de tarefas" 
            value={settings.dailyDigest}
            onChange={(value) => handleSettingsChange({ dailyDigest: value })}
            disabled={!settings.enabled || permissionStatus !== 'granted'}
          />
          
          <ToggleOption 
            label="Som de notificação" 
            value={settings.notificationSound}
            onChange={(value) => handleSettingsChange({ notificationSound: value })}
            disabled={!settings.enabled || permissionStatus !== 'granted'}
          />
          
          {settings.notificationSound && settings.enabled && permissionStatus === 'granted' && (
            <div className="py-3 border-b border-gray-200 dark:border-gray-700">
              <label className="text-gray-700 dark:text-gray-300 block mb-2">
                Volume do som: {settings.soundVolume}%
              </label>
              <div className="flex items-center gap-2">
                <FiVolume2 className="text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.soundVolume}
                  onChange={(e) => handleSettingsChange({ soundVolume: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
          
          <div className="py-3 border-b border-gray-200 dark:border-gray-700">
            <label className="text-gray-700 dark:text-gray-300 block mb-2">
              Tempo do lembrete
            </label>
            <select
              value={settings.reminderTiming}
              onChange={(e) => handleSettingsChange({ reminderTiming: e.target.value as any })}
              disabled={!settings.enabled || !settings.dueDateReminders || permissionStatus !== 'granted'}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 dark:text-gray-300 disabled:opacity-60"
            >
              <option value="sameDay">No mesmo dia (9:00)</option>
              <option value="dayBefore">No dia anterior (18:00)</option>
              <option value="hourBefore">1 hora antes</option>
              <option value="custom">Personalizado</option>
            </select>
            
            {settings.reminderTiming === 'custom' && (
              <div className="mt-2">
                <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">
                  Horas antes do vencimento
                </label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={settings.customReminderHours || 2}
                  onChange={(e) => handleSettingsChange({ customReminderHours: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 dark:text-gray-300"
                  disabled={!settings.enabled || !settings.dueDateReminders || permissionStatus !== 'granted'}
                />
              </div>
            )}
          </div>
          
          <ToggleOption 
            label="Modo não perturbe" 
            value={settings.quietHoursEnabled}
            onChange={(value) => handleSettingsChange({ quietHoursEnabled: value })}
            disabled={!settings.enabled || permissionStatus !== 'granted'}
          />
          
          {settings.quietHoursEnabled && settings.enabled && permissionStatus === 'granted' && (
            <div className="py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">
                    Início
                  </label>
                  <input
                    type="time"
                    value={settings.quietHoursStart || '22:00'}
                    onChange={(e) => handleSettingsChange({ quietHoursStart: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">
                    Fim
                  </label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd || '07:00'}
                    onChange={(e) => handleSettingsChange({ quietHoursEnd: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Durante este período, notificações não serão exibidas.
              </p>
            </div>
          )}
          
          {permissionStatus === 'granted' && settings.enabled && (
            <div className="mt-6">
              <button
                onClick={sendTestNotification}
                className={`w-full py-2 px-4 rounded-md transition-colors ${
                  testNotificationSent 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {testNotificationSent ? 'Notificação enviada!' : 'Enviar notificação de teste'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 