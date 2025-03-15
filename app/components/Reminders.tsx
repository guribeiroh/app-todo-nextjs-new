import React, { useState, useEffect } from 'react';
import { addDays, format, parseISO, isAfter, isBefore, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiClock, FiBell, FiPlus, FiTrash2, FiCalendar, FiAlertCircle, FiX, FiCheck } from 'react-icons/fi';
import { Task } from '../types';

interface RemindersProps {
  tasks: Task[];
  onClose: () => void;
}

interface Reminder {
  id: string;
  taskId: string;
  taskTitle: string;
  time: Date;
  sent: boolean;
}

export const Reminders: React.FC<RemindersProps> = ({ tasks, onClose }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminder, setNewReminder] = useState<{taskId: string, time: string}>({
    taskId: '',
    time: ''
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [hideCompleted, setHideCompleted] = useState(true);
  
  // Verificar permissão para notificações e carregar lembretes salvos
  useEffect(() => {
    // Checar permissão de notificações
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    // Carregar lembretes do localStorage
    const savedReminders = localStorage.getItem('reminders');
    if (savedReminders) {
      try {
        const parsed = JSON.parse(savedReminders);
        setReminders(parsed.map((reminder: any) => ({
          ...reminder,
          time: new Date(reminder.time)
        })));
      } catch (e) {
        console.error('Erro ao carregar lembretes:', e);
      }
    }
    
    // Verificar lembretes pendentes a cada minuto
    const interval = setInterval(() => {
      checkReminders();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Verificar lembretes pendentes e enviar notificações
  const checkReminders = () => {
    if (notificationPermission !== 'granted') return;
    
    const now = new Date();
    const updatedReminders = [...reminders];
    let changed = false;
    
    updatedReminders.forEach(reminder => {
      // Verificar se é hora de enviar a notificação e se ainda não foi enviada
      if (!reminder.sent && isBefore(reminder.time, now)) {
        sendNotification(reminder);
        reminder.sent = true;
        changed = true;
      }
    });
    
    if (changed) {
      setReminders(updatedReminders);
      saveRemindersToLocalStorage(updatedReminders);
    }
  };
  
  // Enviar notificação
  const sendNotification = (reminder: Reminder) => {
    if (!('Notification' in window)) return;
    
    const notification = new Notification('Lembrete: ' + reminder.taskTitle, {
      body: `É hora de trabalhar na tarefa "${reminder.taskTitle}"`,
      icon: '/icons/icon-192x192.png'
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };
  
  // Solicitar permissão para notificações
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Este navegador não suporta notificações desktop');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        new Notification('Notificações ativadas!', {
          body: 'Agora você receberá lembretes para suas tarefas.',
          icon: '/icons/icon-192x192.png'
        });
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    }
  };
  
  // Salvar lembretes no localStorage
  const saveRemindersToLocalStorage = (remindersList: Reminder[]) => {
    localStorage.setItem('reminders', JSON.stringify(remindersList));
  };
  
  // Adicionar novo lembrete
  const addReminder = () => {
    if (!newReminder.taskId || !newReminder.time) return;
    
    const selectedTask = tasks.find(task => task.id === newReminder.taskId);
    if (!selectedTask) return;
    
    const reminderTime = new Date(newReminder.time);
    
    const newReminderItem: Reminder = {
      id: Date.now().toString(),
      taskId: newReminder.taskId,
      taskTitle: selectedTask.title,
      time: reminderTime,
      sent: false
    };
    
    const updatedReminders = [...reminders, newReminderItem];
    setReminders(updatedReminders);
    saveRemindersToLocalStorage(updatedReminders);
    
    // Limpar o formulário
    setNewReminder({
      taskId: '',
      time: ''
    });
  };
  
  // Excluir lembrete
  const deleteReminder = (id: string) => {
    const updatedReminders = reminders.filter(reminder => reminder.id !== id);
    setReminders(updatedReminders);
    saveRemindersToLocalStorage(updatedReminders);
  };
  
  // Formatar data para exibição
  const formatReminderTime = (date: Date) => {
    return format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };
  
  // Filtrar tarefas não concluídas para o seletor
  const availableTasks = tasks.filter(task => hideCompleted ? !task.completed : true);
  
  // Verificar se um lembrete está atrasado
  const isReminderOverdue = (reminder: Reminder) => {
    return reminder.time < new Date() && !reminder.sent;
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <FiBell className="text-amber-500" /> Lembretes
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FiX />
          </button>
        </div>
        
        {/* Status de permissão de notificação */}
        {notificationPermission !== 'granted' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-amber-800 dark:text-amber-200 font-medium">Notificações não ativadas</p>
                <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                  Ative as notificações para receber lembretes de suas tarefas mesmo quando não estiver usando o aplicativo.
                </p>
                <button
                  onClick={requestNotificationPermission}
                  className="mt-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-700"
                >
                  Ativar notificações
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Formulário para adicionar novo lembrete */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-md font-medium text-gray-800 dark:text-white mb-3">Novo lembrete</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tarefa
              </label>
              <select
                value={newReminder.taskId}
                onChange={(e) => setNewReminder({...newReminder, taskId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                <option value="">Selecione uma tarefa</option>
                {availableTasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="hideCompleted"
                  checked={hideCompleted}
                  onChange={() => setHideCompleted(!hideCompleted)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="hideCompleted" className="text-xs text-gray-600 dark:text-gray-400">
                  Ocultar tarefas concluídas
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data e hora
              </label>
              <input
                type="datetime-local"
                value={newReminder.time}
                onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
            
            <button
              onClick={addReminder}
              disabled={!newReminder.taskId || !newReminder.time}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <FiPlus size={16} /> Adicionar lembrete
            </button>
          </div>
        </div>
        
        {/* Lista de lembretes */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium text-gray-800 dark:text-white">Lembretes agendados</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {reminders.filter(r => !r.sent).length} pendentes
            </span>
          </div>
          
          {reminders.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-6 italic">
              Você não possui lembretes agendados
            </p>
          ) : (
            <div className="space-y-3">
              {reminders.map(reminder => {
                const isOverdue = isReminderOverdue(reminder);
                const task = tasks.find(t => t.id === reminder.taskId);
                const isTaskCompleted = task?.completed || false;
                
                return (
                  <div 
                    key={reminder.id} 
                    className={`p-3 border rounded-lg flex items-start justify-between ${
                      reminder.sent 
                        ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30' 
                        : isOverdue
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                          : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        reminder.sent 
                          ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400' 
                          : isOverdue
                            ? 'bg-red-200 text-red-600 dark:bg-red-800 dark:text-red-300'
                            : 'bg-blue-200 text-blue-600 dark:bg-blue-800 dark:text-blue-300'
                      }`}>
                        {reminder.sent ? (
                          <FiCheck size={18} />
                        ) : (
                          <FiClock size={18} />
                        )}
                      </div>
                      
                      <div>
                        <p className={`font-medium ${
                          isTaskCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'
                        }`}>
                          {reminder.taskTitle}
                        </p>
                        <p className={`text-sm mt-1 ${
                          reminder.sent 
                            ? 'text-gray-500 dark:text-gray-400' 
                            : isOverdue
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          <span className="flex items-center gap-1">
                            <FiCalendar size={12} />
                            {formatReminderTime(reminder.time)}
                          </span>
                        </p>
                        {isTaskCompleted && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Tarefa já concluída
                          </p>
                        )}
                        {isOverdue && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Lembrete atrasado
                          </p>
                        )}
                        {reminder.sent && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Notificação enviada
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 p-1"
                      title="Excluir lembrete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Informações sobre lembretes */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sobre lembretes</h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
            <li>Os lembretes são armazenados localmente em seu dispositivo</li>
            <li>Você receberá notificações mesmo quando não estiver usando o aplicativo, desde que seu navegador esteja aberto</li>
            <li>Os lembretes para tarefas concluídas serão mantidos, mas destacados como concluídos</li>
            <li>Lembretes atrasados serão destacados em vermelho</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 