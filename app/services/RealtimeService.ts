import { RealtimeChannel } from '@supabase/supabase-js';
import supabase from '../lib/supabase';
import { Task, TaskList } from '../types';

export type RealtimeEvent<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
};

export default class RealtimeService {
  private static instance: RealtimeService;
  private taskChannel: RealtimeChannel | null = null;
  private listChannel: RealtimeChannel | null = null;
  private userId: string | null = null;
  private taskCallbacks: Array<(event: RealtimeEvent<any>) => void> = [];
  private listCallbacks: Array<(event: RealtimeEvent<any>) => void> = [];

  private constructor() {}

  /**
   * Obtém a instância única do serviço (Singleton)
   */
  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Define o ID do usuário para filtrar eventos
   */
  public setUserId(userId: string | null): void {
    this.userId = userId;
    
    if (userId) {
      this.subscribeToTasks();
      this.subscribeToLists();
    } else {
      this.unsubscribe();
    }
  }

  /**
   * Inscreve-se nas atualizações de tarefas em tempo real
   */
  private subscribeToTasks(): void {
    if (!this.userId) return;
    
    // Cancelar inscrição existente, se houver
    if (this.taskChannel) {
      this.taskChannel.unsubscribe();
    }

    // Inscrever-se em atualizações de tarefas para o usuário atual
    this.taskChannel = supabase
      .channel(`tasks:user_id=eq.${this.userId}`)
      .on('postgres_changes', 
        {
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `user_id=eq.${this.userId}`
        }, 
        (payload) => {
          const event = {
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new,
            old: payload.old
          };
          
          // Notificar todos os callbacks registrados
          this.taskCallbacks.forEach(callback => callback(event));
        }
      )
      .subscribe();
  }

  /**
   * Inscreve-se nas atualizações de listas em tempo real
   */
  private subscribeToLists(): void {
    if (!this.userId) return;
    
    // Cancelar inscrição existente, se houver
    if (this.listChannel) {
      this.listChannel.unsubscribe();
    }

    // Inscrever-se em atualizações de listas para o usuário atual
    this.listChannel = supabase
      .channel(`lists:user_id=eq.${this.userId}`)
      .on('postgres_changes', 
        {
          event: '*', 
          schema: 'public', 
          table: 'task_lists',
          filter: `user_id=eq.${this.userId}`
        }, 
        (payload) => {
          const event = {
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new,
            old: payload.old
          };
          
          // Notificar todos os callbacks registrados
          this.listCallbacks.forEach(callback => callback(event));
        }
      )
      .subscribe();
  }

  /**
   * Cancela todas as inscrições em tempo real
   */
  public unsubscribe(): void {
    if (this.taskChannel) {
      this.taskChannel.unsubscribe();
      this.taskChannel = null;
    }
    
    if (this.listChannel) {
      this.listChannel.unsubscribe();
      this.listChannel = null;
    }
  }

  /**
   * Registra um callback para eventos de tarefas
   */
  public onTaskChanges(callback: (event: RealtimeEvent<Task>) => void): () => void {
    this.taskCallbacks.push(callback as any);
    
    // Retornar função para remover o callback
    return () => {
      this.taskCallbacks = this.taskCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Registra um callback para eventos de listas
   */
  public onListChanges(callback: (event: RealtimeEvent<TaskList>) => void): () => void {
    this.listCallbacks.push(callback as any);
    
    // Retornar função para remover o callback
    return () => {
      this.listCallbacks = this.listCallbacks.filter(cb => cb !== callback);
    };
  }
} 