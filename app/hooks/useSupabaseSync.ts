import { useState, useEffect, useCallback } from 'react';
import { Task, TaskList, Subtask } from '../types';
import SupabaseService from '../services/SupabaseService';
import RealtimeService, { RealtimeEvent } from '../services/RealtimeService';
import { useAuth } from '../context/AuthContext';

// Hook personalizado para gerenciar sincronização com o Supabase
export function useSupabaseSync() {
  const { isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  
  // Serviços
  const supabaseService = SupabaseService.getInstance();
  const realtimeService = RealtimeService.getInstance();
  
  // Monitorar estado de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Configurar listeners para eventos em tempo real do Supabase
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const unsubscribeTaskChanges = realtimeService.onTaskChanges(handleTaskChange);
    const unsubscribeListChanges = realtimeService.onListChanges(handleListChange);
    
    return () => {
      unsubscribeTaskChanges();
      unsubscribeListChanges();
    };
  }, [isAuthenticated]);
  
  // Manipular alterações em tarefas recebidas em tempo real
  const handleTaskChange = (event: RealtimeEvent<Task>) => {
    // Implementação será feita no TaskContext
    console.log('Alteração de tarefa recebida:', event);
  };
  
  // Manipular alterações em listas recebidas em tempo real
  const handleListChange = (event: RealtimeEvent<TaskList>) => {
    // Implementação será feita no TaskContext
    console.log('Alteração de lista recebida:', event);
  };
  
  // Buscar todas as tarefas do usuário
  const fetchTasks = useCallback(async (): Promise<Task[]> => {
    if (!isAuthenticated || !isOnline) {
      return [];
    }
    
    setIsSyncing(true);
    try {
      const tasks = await supabaseService.fetchTasks();
      setLastSyncTime(new Date());
      return tasks;
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, isOnline]);
  
  // Buscar todas as listas do usuário
  const fetchLists = useCallback(async (): Promise<TaskList[]> => {
    if (!isAuthenticated || !isOnline) {
      return [];
    }
    
    setIsSyncing(true);
    try {
      const lists = await supabaseService.fetchLists();
      setLastSyncTime(new Date());
      return lists;
    } catch (error) {
      console.error('Erro ao buscar listas:', error);
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, isOnline]);
  
  // Sincronizar uma nova tarefa
  const syncAddTask = useCallback(async (task: Task | Omit<Task, 'id' | 'createdAt' | 'position' | 'subtasks'>) => {
    console.log('[useSupabaseSync] Iniciando syncAddTask com:', task);
    
    if (!isOnline) {
      console.log('[useSupabaseSync] Dispositivo offline. Incrementando pendingChanges.');
      setPendingChanges(prev => prev + 1);
      return null;
    }
    
    console.log('[useSupabaseSync] Dispositivo online. Iniciando sincronização...');
    setIsSyncing(true);
    try {
      // Filtrar as propriedades que não devem ser enviadas ao Supabase
      const { id, createdAt, position, subtasks, ...filteredTask } = task as Task;
      
      console.log('[useSupabaseSync] Objeto filtrado para envio:', filteredTask);
      
      const newTask = await supabaseService.addTask(filteredTask);
      console.log('[useSupabaseSync] Resposta do supabaseService.addTask:', newTask);
      
      setLastSyncTime(new Date());
      return newTask;
    } catch (error) {
      console.error('[useSupabaseSync] Erro ao adicionar tarefa:', error);
      setPendingChanges(prev => prev + 1);
      return null;
    } finally {
      setIsSyncing(false);
      console.log('[useSupabaseSync] Sincronização finalizada.');
    }
  }, [isOnline]);
  
  // Sincronizar atualização de tarefa
  const syncUpdateTask = useCallback(async (taskId: string, taskData: Partial<Task>) => {
    if (!isOnline) {
      setPendingChanges(prev => prev + 1);
      return false;
    }
    
    setIsSyncing(true);
    try {
      const success = await supabaseService.updateTask(taskId, taskData);
      setLastSyncTime(new Date());
      return success;
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      setPendingChanges(prev => prev + 1);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);
  
  // Sincronizar exclusão de tarefa
  const syncDeleteTask = useCallback(async (taskId: string) => {
    if (!isOnline) {
      setPendingChanges(prev => prev + 1);
      return false;
    }
    
    setIsSyncing(true);
    try {
      const success = await supabaseService.deleteTask(taskId);
      setLastSyncTime(new Date());
      return success;
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      setPendingChanges(prev => prev + 1);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);
  
  // Sincronizar adição de lista
  const syncAddList = useCallback(async (name: string, color: string) => {
    if (!isOnline) {
      setPendingChanges(prev => prev + 1);
      return null;
    }
    
    setIsSyncing(true);
    try {
      const newList = await supabaseService.addList(name, color);
      setLastSyncTime(new Date());
      return newList;
    } catch (error) {
      console.error('Erro ao adicionar lista:', error);
      setPendingChanges(prev => prev + 1);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);
  
  // Sincronizar atualização de lista
  const syncUpdateList = useCallback(async (listId: string, listData: Partial<TaskList>) => {
    if (!isOnline) {
      setPendingChanges(prev => prev + 1);
      return false;
    }
    
    setIsSyncing(true);
    try {
      const success = await supabaseService.updateList(listId, listData);
      setLastSyncTime(new Date());
      return success;
    } catch (error) {
      console.error('Erro ao atualizar lista:', error);
      setPendingChanges(prev => prev + 1);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);
  
  // Sincronizar exclusão de lista
  const syncDeleteList = useCallback(async (listId: string) => {
    if (!isOnline) {
      setPendingChanges(prev => prev + 1);
      return false;
    }
    
    setIsSyncing(true);
    try {
      const success = await supabaseService.deleteList(listId);
      setLastSyncTime(new Date());
      return success;
    } catch (error) {
      console.error('Erro ao excluir lista:', error);
      setPendingChanges(prev => prev + 1);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);
  
  // Sincronizar reordenação de tarefas
  const syncReorderTasks = useCallback(async (taskIds: string[]) => {
    if (!isOnline) {
      setPendingChanges(prev => prev + 1);
      return false;
    }
    
    setIsSyncing(true);
    try {
      const success = await supabaseService.reorderTasks(taskIds);
      setLastSyncTime(new Date());
      return success;
    } catch (error) {
      console.error('Erro ao reordenar tarefas:', error);
      setPendingChanges(prev => prev + 1);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);
  
  // Sincronizar adição de subtarefa
  const syncAddSubtask = useCallback(async (taskId: string, title: string, completed = false) => {
    if (!isOnline) {
      setPendingChanges(prev => prev + 1);
      return null;
    }
    
    setIsSyncing(true);
    try {
      const newSubtask = await supabaseService.addSubtask(taskId, title, completed);
      setLastSyncTime(new Date());
      return newSubtask;
    } catch (error) {
      console.error('Erro ao adicionar subtarefa:', error);
      setPendingChanges(prev => prev + 1);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);
  
  // Sincronizar atualização de subtarefa
  const syncUpdateSubtask = useCallback(async (subtaskId: string, subtaskData: Partial<Subtask>) => {
    if (!isOnline) {
      setPendingChanges(prev => prev + 1);
      return false;
    }
    
    setIsSyncing(true);
    try {
      const success = await supabaseService.updateSubtask(subtaskId, subtaskData);
      setLastSyncTime(new Date());
      return success;
    } catch (error) {
      console.error('Erro ao atualizar subtarefa:', error);
      setPendingChanges(prev => prev + 1);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);
  
  // Sincronizar exclusão de subtarefa
  const syncDeleteSubtask = useCallback(async (subtaskId: string) => {
    if (!isOnline) {
      setPendingChanges(prev => prev + 1);
      return false;
    }
    
    setIsSyncing(true);
    try {
      const success = await supabaseService.deleteSubtask(subtaskId);
      setLastSyncTime(new Date());
      return success;
    } catch (error) {
      console.error('Erro ao excluir subtarefa:', error);
      setPendingChanges(prev => prev + 1);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);
  
  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingChanges,
    fetchTasks,
    fetchLists,
    syncAddTask,
    syncUpdateTask,
    syncDeleteTask,
    syncAddList,
    syncUpdateList,
    syncDeleteList,
    syncReorderTasks,
    syncAddSubtask,
    syncUpdateSubtask,
    syncDeleteSubtask
  };
} 