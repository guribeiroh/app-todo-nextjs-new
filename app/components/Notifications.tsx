import React, { useState, useEffect } from 'react';
import { FiBell, FiX, FiCalendar, FiAlertCircle, FiCheckCircle, FiSettings } from 'react-icons/fi';
import { useTaskContext } from '../context/TaskContext';
import { Task } from '../types';

interface NotificationsProps {
  onClose: () => void;
  onOpenSettings: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onClose, onOpenSettings }) => {
  const { tasks } = useTaskContext();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Tipos de notificações
  type NotificationType = 'dueSoon' | 'overdue' | 'completed';
  
  interface NotificationItem {
    id: string;
    type: NotificationType;
    task: Task;
    message: string;
    date: Date;
    read: boolean;
  }
  
  // Verificar tarefas para criar notificações
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    const newNotifications: NotificationItem[] = [];
    
    // Recuperar notificações salvas
    const savedNotifications = localStorage.getItem('notifications');
    const existingNotifications: NotificationItem[] = savedNotifications 
      ? JSON.parse(savedNotifications, (key, value) => {
          if (key === 'date') return new Date(value);
          return value;
        }) 
      : [];
    
    // Índice para rastrear notificações existentes
    const existingTaskNotifications: Record<string, NotificationType[]> = {};
    
    existingNotifications.forEach(notification => {
      if (!existingTaskNotifications[notification.task.id]) {
        existingTaskNotifications[notification.task.id] = [];
      }
      existingTaskNotifications[notification.task.id].push(notification.type);
    });
    
    // Verificar tarefas próximas do vencimento (1-2 dias)
    tasks.forEach(task => {
      if (task.dueDate && !task.completed) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        // Tarefas que vencem amanhã ou depois de amanhã
        if (
          (dueDate.getTime() === tomorrow.getTime() || dueDate.getTime() === dayAfterTomorrow.getTime()) && 
          (!existingTaskNotifications[task.id] || !existingTaskNotifications[task.id].includes('dueSoon'))
        ) {
          newNotifications.push({
            id: `dueSoon-${task.id}-${Date.now()}`,
            type: 'dueSoon',
            task,
            message: `A tarefa "${task.title}" vence ${
              dueDate.getTime() === tomorrow.getTime() ? 'amanhã' : 'em 2 dias'
            }.`,
            date: new Date(),
            read: false
          });
        }
        
        // Tarefas atrasadas
        if (
          dueDate < today && 
          (!existingTaskNotifications[task.id] || !existingTaskNotifications[task.id].includes('overdue'))
        ) {
          newNotifications.push({
            id: `overdue-${task.id}-${Date.now()}`,
            type: 'overdue',
            task,
            message: `A tarefa "${task.title}" está atrasada!`,
            date: new Date(),
            read: false
          });
        }
      }
      
      // Tarefas concluídas recentemente (nas últimas 24 horas)
      if (
        task.completed && 
        (!existingTaskNotifications[task.id] || !existingTaskNotifications[task.id].includes('completed'))
      ) {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        // Verificar se foi concluída nas últimas 24 horas
        // Nota: para fins de demonstração, estamos considerando todas as tarefas completas
        newNotifications.push({
          id: `completed-${task.id}-${Date.now()}`,
          type: 'completed',
          task,
          message: `Você concluiu a tarefa "${task.title}". Parabéns!`,
          date: new Date(),
          read: false
        });
      }
    });
    
    // Combinar notificações existentes com novas
    const combinedNotifications = [...existingNotifications, ...newNotifications]
      // Limitar a 50 notificações para não sobrecarregar o localStorage
      .slice(0, 50)
      // Ordenar por data (mais recentes primeiro)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    setNotifications(combinedNotifications);
    
    // Calcular contagem de não lidas
    const unread = combinedNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
    
    // Salvar notificações atualizadas
    localStorage.setItem('notifications', JSON.stringify(combinedNotifications));
    
    // Solicitar permissão para notificações ao navegador
    if (
      typeof window !== 'undefined' && 
      'Notification' in window && 
      Notification.permission !== 'granted' && 
      Notification.permission !== 'denied'
    ) {
      Notification.requestPermission();
    }
    
    // Exibir notificações do navegador para novas notificações
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      newNotifications.forEach(notification => {
        // Criar notificação do navegador
        const browserNotification = new Notification('NeoTask', {
          body: notification.message,
          icon: '/favicon.ico'
        });
        
        // Fechar automaticamente após 5 segundos
        setTimeout(() => browserNotification.close(), 5000);
      });
    }
  }, [tasks]);
  
  // Marcar todas como lidas
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    
    // Atualizar no localStorage
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };
  
  // Marcar uma notificação como lida
  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    
    setNotifications(updatedNotifications);
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Atualizar no localStorage
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };
  
  // Limpar todas as notificações
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    
    // Limpar do localStorage
    localStorage.removeItem('notifications');
  };
  
  // Formatar data relativa (ex: "há 5 minutos", "há 1 hora")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
      return 'agora mesmo';
    } else if (diffMinutes < 60) {
      return `há ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffHours < 24) {
      return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else {
      return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    }
  };

  return (
    <div className="w-full">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-medium text-gray-800 dark:text-white">
          Notificações
        </h3>
        
        <div className="flex space-x-2">
          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                Marcar todas como lidas
              </button>
              <button
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Limpar
              </button>
            </>
          )}
          <button
            onClick={onOpenSettings}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            title="Configurações de notificação"
          >
            <FiSettings size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <p>Nenhuma notificação no momento.</p>
            <p className="text-sm mt-1">Você será notificado sobre tarefas importantes.</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`
                  p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0
                  ${!notification.read ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}
                  hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative
                `}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    {notification.type === 'dueSoon' && (
                      <FiCalendar className="text-amber-500" size={20} />
                    )}
                    {notification.type === 'overdue' && (
                      <FiAlertCircle className="text-red-500" size={20} />
                    )}
                    {notification.type === 'completed' && (
                      <FiCheckCircle className="text-green-500" size={20} />
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">
                      {notification.message}
                    </p>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(notification.date)}
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className="absolute right-3 top-3 w-2 h-2 bg-indigo-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 