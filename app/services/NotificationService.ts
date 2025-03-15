// Serviço de notificações para o NeoTask
// Gerencia notificações push, permissões e armazenamento de configurações

import { Task } from '../types';

export interface NotificationOptions {
  body: string;
  icon?: string;
  tag?: string; 
  actions?: NotificationAction[];
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  vibrate?: number[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  dueDateReminders: boolean;
  priorityTaskReminders: boolean;
  dailyDigest: boolean;
  reminderTiming: 'sameDay' | 'dayBefore' | 'hourBefore' | 'custom';
  customReminderHours?: number;
  notificationSound: boolean;
  soundVolume: number;
  notificationsForCompletedTasks: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // formato: "HH:MM"
  quietHoursEnd?: string;   // formato: "HH:MM"
}

class NotificationService {
  private static instance: NotificationService;
  private notificationsEnabled: boolean = false;
  private hasPermission: boolean = false;
  private scheduledNotifications: Map<string, NodeJS.Timeout> = new Map();
  private settings: NotificationSettings = {
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
  };
  
  private constructor() {
    // Somente verificar permissão se estiver no navegador
    if (typeof window !== 'undefined') {
      this.checkPermission();
      this.loadSettings();
    }
  }
  
  public static getInstance(): NotificationService {
    // Verificar se estamos no ambiente do navegador
    if (typeof window === 'undefined') {
      // No servidor, retornar uma instância com funcionalidades limitadas
      if (!NotificationService.instance) {
        NotificationService.instance = new NotificationService();
      }
      return NotificationService.instance;
    }
    
    // No navegador, comportamento normal
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  private checkPermission() {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações de desktop');
      this.hasPermission = false;
      return;
    }
    
    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      this.notificationsEnabled = true;
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.hasPermission = true;
          this.notificationsEnabled = true;
        }
      });
    }
  }
  
  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      this.notificationsEnabled = true;
      return true;
    }
    
      const permission = await Notification.requestPermission();
    this.hasPermission = permission === 'granted';
    this.notificationsEnabled = this.hasPermission;
    return this.hasPermission;
  }
  
  public setEnabled(enabled: boolean) {
    this.notificationsEnabled = enabled && this.hasPermission;
    
    if (enabled && !this.hasPermission) {
      this.requestPermission();
    }
  }
  
  public isEnabled(): boolean {
    return this.notificationsEnabled;
  }
  
  public async showNotification(title: string, options: NotificationOptions = { body: 'Notificação do NeoTask' }): Promise<boolean> {
    if (typeof window === 'undefined' || !this.notificationsEnabled) {
      return false;
    }
    
    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });
      
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      
      return true;
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
      return false;
    }
  }
  
  public notifyTaskDue(task: Task): void {
    if (typeof window === 'undefined' || !this.notificationsEnabled || !task.dueDate) {
      return;
    }
    
    const dueDate = task.dueDate;
    const now = new Date();
    
    // Cancelar notificação anterior se existir
    if (this.scheduledNotifications.has(task.id)) {
      clearTimeout(this.scheduledNotifications.get(task.id));
      this.scheduledNotifications.delete(task.id);
    }
    
    // Se a tarefa já estiver vencida, mostrar notificação imediatamente
    if (dueDate <= now) {
      this.showNotification(`Tarefa atrasada: ${task.title}`, {
        body: `A tarefa "${task.title}" está atrasada! Clique para visualizar.`,
        tag: `task-overdue-${task.id}`,
        vibrate: [200, 100, 200],
        data: { taskId: task.id },
      });
      return;
    }
    
    // Calcular quanto tempo falta para o vencimento
    const timeUntilDue = dueDate.getTime() - now.getTime();
    
    // Notificar 1 dia antes, 1 hora antes e no momento do vencimento
    const dayBefore = 24 * 60 * 60 * 1000;
    const hourBefore = 60 * 60 * 1000;
    
    if (timeUntilDue > dayBefore) {
      // Agendar notificação para 1 dia antes
      const dayNotificationId = setTimeout(() => {
        this.showNotification(`Lembrete: ${task.title}`, {
          body: `A tarefa "${task.title}" vence em 24 horas. Clique para visualizar.`,
          tag: `task-reminder-day-${task.id}`,
          vibrate: [100, 50, 100],
          data: { taskId: task.id },
        });
      }, timeUntilDue - dayBefore);
      
      this.scheduledNotifications.set(`${task.id}-day`, dayNotificationId);
    }
    
    if (timeUntilDue > hourBefore) {
      // Agendar notificação para 1 hora antes
      const hourNotificationId = setTimeout(() => {
        this.showNotification(`Lembrete urgente: ${task.title}`, {
          body: `A tarefa "${task.title}" vence em 1 hora. Clique para visualizar.`,
          tag: `task-reminder-hour-${task.id}`,
          vibrate: [200, 100, 200, 100, 200],
          data: { taskId: task.id },
        });
      }, timeUntilDue - hourBefore);
      
      this.scheduledNotifications.set(`${task.id}-hour`, hourNotificationId);
    }
    
    // Agendar notificação para o momento do vencimento
    const dueNotificationId = setTimeout(() => {
      this.showNotification(`Prazo final: ${task.title}`, {
        body: `A tarefa "${task.title}" vence agora! Clique para visualizar.`,
        tag: `task-due-${task.id}`,
        vibrate: [300, 150, 300, 150, 300],
        data: { taskId: task.id },
      });
    }, timeUntilDue);
    
    this.scheduledNotifications.set(`${task.id}-due`, dueNotificationId);
  }
  
  public cancelTaskNotifications(taskId: string): void {
    const notificationIds = [
      `${taskId}-day`, 
      `${taskId}-hour`, 
      `${taskId}-due`
    ];
    
    for (const id of notificationIds) {
      if (this.scheduledNotifications.has(id)) {
        clearTimeout(this.scheduledNotifications.get(id));
        this.scheduledNotifications.delete(id);
      }
    }
  }
  
  public scheduleTaskReminders(tasks: Task[]): void {
    if (typeof window === 'undefined' || !this.notificationsEnabled) {
      return;
    }
    
    // Limpar todos os lembretes agendados
    Array.from(this.scheduledNotifications.entries()).forEach(([id, timeoutId]) => {
      clearTimeout(timeoutId);
    });
    this.scheduledNotifications.clear();
    
    // Agendar para todas as tarefas pendentes com data de vencimento
    const pendingTasks = tasks.filter(task => !task.completed && task.dueDate);
    for (const task of pendingTasks) {
      this.notifyTaskDue(task);
    }
  }
  
  // Adicionar estes métodos para compatibilidade
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
  
  public getHasPermission(): boolean {
    return this.hasPermission;
  }

  // Método de compatibilidade
  public cancelTaskNotification(taskId: string): void {
    this.cancelTaskNotifications(taskId);
  }

  // Método de compatibilidade para programação de notificações
  public scheduleTaskNotification(
    taskId: string, 
    title: string, 
    body: string, 
    dueDate: Date
  ): void {
    // Encontrar a tarefa correspondente ou criar uma temporária
    const task: Task = {
      id: taskId,
      title: title,
      description: body,
      dueDate: dueDate,
      completed: false,
      priority: 'média',
      listId: '',
      subtasks: [],
      createdAt: new Date(),
      position: 0,
      tags: []
    };
    
    this.notifyTaskDue(task);
  }

  // Método de compatibilidade para notificação de tarefa de alta prioridade
  public notifyHighPriorityTask(title: string, taskName: string): void {
    this.showNotification(title, {
      body: `"${taskName}" é uma tarefa de alta prioridade.`,
      requireInteraction: true
    });
  }
  
  // Método para obter as configurações atuais
  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }
  
  // Método para salvar as configurações
  public saveSettings(settings: NotificationSettings): void {
    this.settings = { ...settings };
    
    // Atualizar o estado de habilitado com base nas configurações
    this.notificationsEnabled = settings.enabled && this.hasPermission;
    
    // Salvar no localStorage se estiver no navegador
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
    }
  }
  
  // Método para carregar as configurações do localStorage
  private loadSettings(): void {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('notificationSettings');
      if (savedSettings) {
        try {
          this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
          this.notificationsEnabled = this.settings.enabled && this.hasPermission;
        } catch (error) {
          console.error('Erro ao carregar configurações de notificação:', error);
        }
      }
    }
  }
}

// Exportar a classe em vez da instância
export default NotificationService; 