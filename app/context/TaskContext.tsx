'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskList, TaskFilter, Subtask, KanbanColumn } from '../types';
import NotificationService from '../services/NotificationService';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useSupabaseSync } from '../hooks/useSupabaseSync';
import { useAuth } from '../context/AuthContext';
import { useSupabase } from './SupabaseContext';
import { useToast } from '../components/Toast';
import { useOffline } from '../hooks/useOffline';

// Interfaces para contextos separados
interface TaskDataContextType {
  tasks: Task[];
  lists: TaskList[];
  kanbanColumns: KanbanColumn[];
  tags: string[];
}

interface TaskFilterContextType {
  filter: TaskFilter;
  setFilter: (filter: TaskFilter) => void;
  filteredTasks: Task[];
}

interface TaskActionsContextType {
  addTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  toggleTaskCompletion: (taskId: string) => void;
  addList: (name: string, color: string, id?: string) => Promise<void>;
  updateList: (listId: string, data: Partial<TaskList>) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  reorderTasks: (startIndex: number, endIndex: number) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtaskCompletion: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  addKanbanColumn: (name: string, color: string, id?: string) => Promise<void>;
  updateKanbanColumn: (columnId: string, data: Partial<KanbanColumn>) => Promise<void>;
  deleteKanbanColumn: (columnId: string) => Promise<void>;
  moveTaskToColumn: (taskId: string, columnId: string) => Promise<void>;
}

interface TaskUtilsContextType {
  exportTasks: () => string;
  importTasks: (data: string) => boolean;
  importDataFromJson: (data: { tasks: Task[], lists: TaskList[], tags: string[] }) => void;
  getTasksStats: () => TaskStats;
  getPendingTasks: () => Task[];
  getUpcomingTasks: () => Task[];
  getAllTags: () => string[];
}

interface TaskSyncContextType {
  isOffline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  manualSync: () => Promise<void>;
}

// Criar contextos separados para diferentes partes do estado/funcionalidades
const TaskDataContext = createContext<TaskDataContextType | undefined>(undefined);
const TaskFilterContext = createContext<TaskFilterContextType | undefined>(undefined);
const TaskActionsContext = createContext<TaskActionsContextType | undefined>(undefined);
const TaskUtilsContext = createContext<TaskUtilsContextType | undefined>(undefined);
const TaskSyncContext = createContext<TaskSyncContextType | undefined>(undefined);

// Lista padrão
const DEFAULT_LIST: TaskList = {
  id: 'default',
  name: 'Tarefas',
  color: '#6366F1',
  createdAt: new Date(),
};

// Tipo para estatísticas
interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  highPriority: number;
  completionRate: number;
}

// Função de seletor para filtrar tarefas com base em filtros
function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  return tasks.filter(task => {
    // Filtrar por status
    if (filter.status === 'pendentes' && task.completed) return false;
    if (filter.status === 'concluídas' && !task.completed) return false;
    
    // Filtrar por prioridade
    if (filter.priority !== 'todas' && task.priority !== filter.priority) return false;
    
    // Filtrar por lista
    if (filter.listId !== 'todas' && task.listId !== filter.listId) return false;
    
    // Filtrar por termos de pesquisa
    if (filter.searchTerm) {
      const searchTermLower = filter.searchTerm.toLowerCase();
      const titleMatches = task.title.toLowerCase().includes(searchTermLower);
      const descriptionMatches = task.description?.toLowerCase().includes(searchTermLower) || false;
      if (!titleMatches && !descriptionMatches) return false;
    }
    
    // Filtrar por tags
    if (filter.tags && filter.tags.length > 0) {
      if (!task.tags || task.tags.length === 0) return false;
      const hasMatchingTag = filter.tags.some(tag => task.tags?.includes(tag));
      if (!hasMatchingTag) return false;
    }
    
    return true;
  });
}

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('tasks');
      if (savedTasks) {
        return JSON.parse(savedTasks, (key, value) => {
          if (key === 'createdAt' || key === 'dueDate') {
            return value ? new Date(value) : null;
          }
          return value;
        });
      }
    }
    return [];
  });

  const [lists, setLists] = useState<TaskList[]>(() => {
    if (typeof window !== 'undefined') {
      const savedLists = localStorage.getItem('lists');
      if (savedLists) {
        return JSON.parse(savedLists, (key, value) => {
          if (key === 'createdAt') {
            return new Date(value);
          }
          return value;
        });
      }
    }
    return [DEFAULT_LIST];
  });
  
  // Novo estado para tags
  const [tags, setTags] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const savedTags = localStorage.getItem('tags');
      if (savedTags) {
        return JSON.parse(savedTags);
      }
    }
    return [];
  });

  const [filter, setFilter] = useState<TaskFilter>({
    status: 'todas',
    priority: 'todas',
    listId: 'todas',
    searchTerm: '',
    tags: [],
  });

  const { 
    trackTaskChange, 
    trackListChange, 
    trackTagChange,
    isOnline: isLegacyOnline
  } = useOfflineSync();
  
  // Novo hook para sincronização com Supabase
  const {
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
  } = useSupabaseSync();

  // Definindo a variável isOffline baseada no estado online
  const isOffline = !isOnline;

  const supabase = useSupabase();
  const { showToast } = useToast();

  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);

  // Carregamento inicial de dados do Supabase quando o usuário está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      loadDataFromSupabase();
    }
  }, [isAuthenticated, user]);
  
  // Função para carregar dados do Supabase
  const loadDataFromSupabase = async () => {
    try {
      // Buscar tarefas e listas
      const supabaseTasks = await fetchTasks();
      const supabseLists = await fetchLists();
      
      if (supabaseTasks.length > 0) {
        setTasks(supabaseTasks);
      }
      
      if (supabseLists.length > 0) {
        setLists(prev => {
          // Manter a lista padrão se não estiver nas listas do Supabase
          const hasDefaultList = supabseLists.some(list => list.id === DEFAULT_LIST.id);
          return hasDefaultList ? supabseLists : [...supabseLists, DEFAULT_LIST];
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do Supabase:', error);
    }
  };
  
  // Função de sincronização manual
  const manualSync = async () => {
    await loadDataFromSupabase();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tasks', JSON.stringify(tasks));
      localStorage.setItem('lists', JSON.stringify(lists));
      localStorage.setItem('tags', JSON.stringify(tags));
    }
  }, [tasks, lists, tags]);

  // Inicializar colunas Kanban padrão se não existirem
  useEffect(() => {
    // Carregar colunas do localStorage
    const savedColumns = localStorage.getItem('kanban_columns');
    if (savedColumns) {
      try {
        const parsedColumns = JSON.parse(savedColumns);
        setKanbanColumns(parsedColumns);
      } catch (error) {
        console.error("Erro ao carregar colunas do Kanban:", error);
        // Criar colunas padrão em caso de erro
        createDefaultKanbanColumns();
      }
    } else {
      // Criar colunas padrão se não existirem
      createDefaultKanbanColumns();
    }
  }, []);

  // Salvar colunas Kanban no localStorage quando mudarem
  useEffect(() => {
    if (kanbanColumns.length > 0) {
      localStorage.setItem('kanban_columns', JSON.stringify(kanbanColumns));
    }
  }, [kanbanColumns]);

  // Criar colunas Kanban padrão
  const createDefaultKanbanColumns = () => {
    const defaultColumns = [
      { id: 'backlog', name: 'Backlog', color: '#4B5563', order: 0, createdAt: new Date() },
      { id: 'to-do', name: 'A Fazer', color: '#6366F1', order: 1, createdAt: new Date() },
      { id: 'in-progress', name: 'Em Progresso', color: '#047857', order: 2, createdAt: new Date() },
      { id: 'review', name: 'Revisão', color: '#B45309', order: 3, createdAt: new Date() },
      { id: 'done', name: 'Concluído', color: '#5B21B6', order: 4, createdAt: new Date() }
    ];
    setKanbanColumns(defaultColumns);
  };

  // Adicionar uma nova coluna Kanban
  const addKanbanColumn = async (name: string, color: string, id?: string): Promise<void> => {
    const newColumn: KanbanColumn = {
      id: id || uuidv4(),
      name,
      color,
      order: kanbanColumns.length,
      createdAt: new Date()
    };

    setKanbanColumns(prev => [...prev, newColumn]);
  };

  // Atualizar uma coluna Kanban existente
  const updateKanbanColumn = async (columnId: string, data: Partial<KanbanColumn>) => {
    setKanbanColumns(prev => 
      prev.map(column => column.id === columnId ? { ...column, ...data } : column)
    );
  };

  // Excluir uma coluna Kanban
  const deleteKanbanColumn = async (columnId: string) => {
    // Não permitir excluir todas as colunas
    if (kanbanColumns.length <= 1) {
      return;
    }

    // Mover tarefas dessa coluna para a primeira coluna
    const firstColumnId = kanbanColumns[0].id;
    if (firstColumnId !== columnId) {
      const tasksToMove = tasks.filter(task => task.columnId === columnId);
      tasksToMove.forEach(task => {
        updateTask(task.id, { columnId: firstColumnId });
      });
    }

    setKanbanColumns(prev => prev.filter(column => column.id !== columnId));
  };

  // Mover uma tarefa para uma coluna
  const moveTaskToColumn = async (taskId: string, columnId: string) => {
    updateTask(taskId, { columnId });
  };

  // Função para adicionar tarefa - atualizada para usar Supabase quando disponível
  const addTask = async (task: Partial<Task>): Promise<Task> => {
    console.log('[TaskContext] Iniciando addTask com:', task);
    
    // Criamos uma versão local da tarefa para atualização imediata da UI
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      title: task.title || 'Nova tarefa',
      description: task.description || '',
      completed: task.completed || false,
      priority: task.priority || 'média',
      createdAt: new Date(),
      position: tasks.length,
      subtasks: []
    };
    
    console.log('[TaskContext] Nova tarefa criada localmente:', newTask);
    
    setTasks((prev) => [...prev, newTask]);
    
    // Configurar notificação se aplicável
    if (newTask.dueDate && typeof window !== 'undefined') {
      const notificationService = NotificationService.getInstance();
      if (notificationService.getHasPermission()) {
        notificationService.scheduleTaskNotification(
          newTask.id,
          "Lembrete de tarefa",
          `A tarefa "${newTask.title}" está próxima do vencimento.`,
          new Date(newTask.dueDate)
        );
      }
    }
    
    console.log('[TaskContext] Status online:', isOnline);
    
    // Sempre tentar sincronizar com o Supabase, independente de autenticação
    try {
      // Apenas verifica se está online
      if (isOnline) {
        console.log('[TaskContext] Tentando sincronizar com Supabase...');
        // Enviar objeto completo em vez do parcial
        const supabaseTask = await syncAddTask(newTask);
        console.log('[TaskContext] Resultado da sincronização:', supabaseTask);
        
        if (supabaseTask) {
          console.log('[TaskContext] Tarefa sincronizada com sucesso. Atualizando localmente.');
          // Atualizar a versão local com os dados retornados do Supabase
          setTasks(prev => 
            prev.map(t => t.id === newTask.id ? { ...supabaseTask, subtasks: [] } : t)
          );
          return supabaseTask;
        } else {
          console.error('[TaskContext] Falha na sincronização da tarefa com o Supabase');
        }
      } else {
        console.log('[TaskContext] Offline. Rastreando para sincronização posterior.');
        // Se estiver offline, rastrear para sincronização posterior
        trackTaskChange('add', newTask);
      }
    } catch (error) {
      console.error('[TaskContext] Erro ao adicionar tarefa no Supabase:', error);
      // Em caso de erro, manter a versão local e rastrear para sincronização posterior
      trackTaskChange('add', newTask);
    }
    
    return newTask;
  };

  // Função para atualizar tarefa - atualizada para usar Supabase quando disponível
  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
    let updatedTask: Task | undefined;
    
    // Atualizar localmente para resposta imediata da UI
    setTasks((prev) => {
      const newTasks = prev.map((task) => {
        if (task.id === taskId) {
          updatedTask = { ...task, ...updates };
          return updatedTask;
        }
        return task;
      });
      return newTasks;
    });
    
    // Atualizar notificações se aplicável
    if (updatedTask && typeof window !== 'undefined') {
      const notificationService = NotificationService.getInstance();
      
      if (notificationService.getHasPermission()) {
        // Se a tarefa foi concluída, cancelar notificações existentes
        if (updatedTask.completed) {
          notificationService.cancelTaskNotification(taskId);
        } 
        // Se a data de vencimento foi atualizada, reagendar notificação
        else if (updates.dueDate && updatedTask.dueDate) {
          notificationService.scheduleTaskNotification(
            taskId,
            'Lembrete de tarefa',
            `A tarefa "${updatedTask.title}" está próxima do vencimento.`,
            new Date(updatedTask.dueDate)
          );
        }
      }
    }
    
    // Se estiver autenticado e online, sincronizar com Supabase
    if (isAuthenticated && isOnline && updatedTask) {
      try {
        await syncUpdateTask(taskId, updates);
      } catch (error) {
        console.error('Erro ao atualizar tarefa no Supabase:', error);
        // Em caso de erro, rastrear para sincronização posterior
        trackTaskChange('update', updatedTask);
      }
    } else if (updatedTask) {
      // Se offline ou não autenticado, rastrear para sincronização posterior
      trackTaskChange('update', updatedTask);
    }
    
    return true;
  };

  // Função para excluir tarefa - atualizada para usar Supabase quando disponível
  const deleteTask = async (taskId: string): Promise<boolean> => {
    // Guardar a tarefa antes de excluir para possível sincronização posterior
    const taskToDelete = tasks.find(task => task.id === taskId);
    
    // Excluir localmente para resposta imediata da UI
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    
    // Cancelar notificações
    if (typeof window !== 'undefined') {
      const notificationService = NotificationService.getInstance();
      notificationService.cancelTaskNotification(taskId);
    }
    
    // Se estiver autenticado e online, sincronizar com Supabase
    if (isAuthenticated && isOnline) {
      try {
        await syncDeleteTask(taskId);
      } catch (error) {
        console.error('Erro ao excluir tarefa no Supabase:', error);
        // Em caso de erro, rastrear para sincronização posterior
        if (taskToDelete) {
          trackTaskChange('delete', taskToDelete);
        }
      }
    } else if (taskToDelete) {
      // Se offline ou não autenticado, rastrear para sincronização posterior
      trackTaskChange('delete', taskToDelete);
    }
    
    return true;
  };

  // Função para alternar o status de conclusão de uma tarefa
  const toggleTaskCompletion = async (taskId: string) => {
    let updatedTask: Task | undefined;
    
    // Atualizar localmente para resposta imediata da UI
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          updatedTask = {
            ...task,
            completed: !task.completed,
          };
          return updatedTask;
        }
        return task;
      })
    );
    
    // Gerenciar notificações baseado no status da tarefa
    if (updatedTask && typeof window !== 'undefined') {
      const notificationService = NotificationService.getInstance();
      
      if (updatedTask.completed) {
        // Cancelar notificações se a tarefa for concluída
        notificationService.cancelTaskNotification(updatedTask.id);
      } else if (updatedTask.dueDate && notificationService.getHasPermission()) {
        // Reagendar notificação se a tarefa for desmarcada como concluída e tiver data de vencimento
        notificationService.scheduleTaskNotification(
          taskId,
          "Lembrete de tarefa reativada",
          `A tarefa "${updatedTask.title}" foi desmarcada como concluída e continua com vencimento.`,
          new Date(updatedTask.dueDate)
        );
      }
    }
    
    // Se estiver autenticado e online, sincronizar com Supabase
    if (isAuthenticated && isOnline && updatedTask) {
      try {
        await syncUpdateTask(taskId, { 
          completed: updatedTask.completed,
        });
      } catch (error) {
        console.error('Erro ao atualizar status da tarefa no Supabase:', error);
        // Em caso de erro, rastrear para sincronização posterior
        trackTaskChange('complete', updatedTask);
      }
    } else if (updatedTask) {
      // Se offline ou não autenticado, rastrear para sincronização posterior
      trackTaskChange('complete', updatedTask);
    }
  };

  // Filtragem de tarefas com base nos filtros atuais
  const filteredTasks = tasks.filter((task) => {
    // Filtro por status
    if (filter.status === 'pendentes' && task.completed) return false;
    if (filter.status === 'concluídas' && !task.completed) return false;

    // Filtro por prioridade
    if (filter.priority !== 'todas' && task.priority !== filter.priority) return false;

    // Filtro por lista
    if (filter.listId !== 'todas' && task.listId !== filter.listId) return false;

    // Filtro por termo de pesquisa
    if (filter.searchTerm && !task.title.toLowerCase().includes(filter.searchTerm.toLowerCase())) {
      return false;
    }

    // Filtro por tags
    if (filter.tags && filter.tags.length > 0) {
      if (!filter.tags.some(tag => task.tags.includes(tag))) {
        return false;
      }
    }

    // Filtro por intervalo de datas
    if (filter.dueDateRange) {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        
        if (filter.dueDateRange.start && dueDate < filter.dueDateRange.start) {
          return false;
        }
        
        if (filter.dueDateRange.end && dueDate > filter.dueDateRange.end) {
          return false;
        }
      } else if (filter.dueDateRange.start || filter.dueDateRange.end) {
        // Se a tarefa não tem data e o filtro exige uma data
        return false;
      }
    }

    return true;
  });

  // Função para reordenar tarefas (drag and drop)
  const reorderTasks = async (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return;

    // Atualizar localmente para resposta imediata da UI
    setTasks(prevTasks => {
      const result = Array.from(filteredTasks);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      
      // Atualizar as posições
      return prevTasks.map(task => {
        const indexInFiltered = result.findIndex(t => t.id === task.id);
        if (indexInFiltered >= 0) {
          return { ...task, position: indexInFiltered };
        }
        return task;
      });
    });
    
    // Se estiver autenticado e online, sincronizar com Supabase
    if (isAuthenticated && isOnline) {
      try {
        // Obter os IDs das tarefas na nova ordem
        const taskIds = filteredTasks.map(task => task.id);
        // Reordenar as tarefas no Supabase
        await syncReorderTasks(taskIds);
      } catch (error) {
        console.error('Erro ao reordenar tarefas no Supabase:', error);
        // Não precisamos rastrear essa alteração pois ela é puramente visual
        // e será recriada na próxima vez que o usuário carregar as tarefas
      }
    }
  };

  // Função para adicionar uma lista - atualizada para usar Supabase quando disponível
  const addList = async (name: string, color: string, id?: string): Promise<void> => {
    const newList: TaskList = {
      id: id || uuidv4(),
      name,
      color,
      createdAt: new Date(),
    };
    
    // Adicionar localmente para resposta imediata da UI
    setLists((prev) => [...prev, newList]);
    
    // Se estiver autenticado e online, sincronizar com Supabase
    if (isAuthenticated && isOnline) {
      try {
        const supabaseList = await syncAddList(name, color);
        if (supabaseList) {
          // Atualizar a versão local com os dados retornados do Supabase
          setLists(prev => 
            prev.map(l => l.id === newList.id ? supabaseList : l)
          );
        }
      } catch (error) {
        console.error('Erro ao adicionar lista no Supabase:', error);
        // Em caso de erro, rastrear para sincronização posterior
        trackListChange('add', newList);
      }
    } else {
      // Se offline ou não autenticado, rastrear para sincronização posterior
      trackListChange('add', newList);
    }
  };

  // Função para atualizar uma lista - atualizada para usar Supabase quando disponível
  const updateList = async (listId: string, data: Partial<TaskList>) => {
    // Atualizar localmente para resposta imediata da UI
    setLists((prev) =>
      prev.map((list) => (list.id === listId ? { ...list, ...data } : list))
    );
    
    // Obter a lista atualizada para possível sincronização posterior
    const updatedList = lists.find(list => list.id === listId);
    
    // Se estiver autenticado e online, sincronizar com Supabase
    if (isAuthenticated && isOnline && updatedList) {
      try {
        await syncUpdateList(listId, data);
      } catch (error) {
        console.error('Erro ao atualizar lista no Supabase:', error);
        // Em caso de erro, rastrear para sincronização posterior
        trackListChange('update', updatedList);
      }
    } else if (updatedList) {
      // Se offline ou não autenticado, rastrear para sincronização posterior
      trackListChange('update', updatedList);
    }
  };

  // Função para excluir uma lista - atualizada para usar Supabase quando disponível
  const deleteList = async (listId: string) => {
    // Não permitir excluir a lista padrão
    if (listId === DEFAULT_LIST.id) return;
    
    // Guardar a lista antes de excluir para possível sincronização posterior
    const listToDelete = lists.find(list => list.id === listId);
    
    // Mover tarefas para a lista padrão
    setTasks((prev) => 
      prev.map((task) => 
        task.listId === listId 
          ? { ...task, listId: DEFAULT_LIST.id } 
          : task
      )
    );
    
    // Remover a lista localmente
    setLists((prev) => prev.filter((list) => list.id !== listId));
    
    // Se estiver autenticado e online, sincronizar com Supabase
    if (isAuthenticated && isOnline) {
      try {
        await syncDeleteList(listId);
        
        // Atualizar as tarefas que foram movidas para a lista padrão
        const tasksToUpdate = tasks.filter(task => task.listId === listId);
        for (const task of tasksToUpdate) {
          await syncUpdateTask(task.id, { listId: DEFAULT_LIST.id });
        }
      } catch (error) {
        console.error('Erro ao excluir lista no Supabase:', error);
        // Em caso de erro, rastrear para sincronização posterior
        if (listToDelete) {
          trackListChange('delete', listToDelete);
        }
      }
    } else if (listToDelete) {
      // Se offline ou não autenticado, rastrear para sincronização posterior
      trackListChange('delete', listToDelete);
    }
  };

  // Função para adicionar subtarefa - atualizada para usar Supabase quando disponível
  const addSubtask = async (taskId: string, title: string) => {
    if (!title.trim()) return;
    
    // Criar a subtarefa localmente para resposta imediata da UI
    const newSubtask: Subtask = {
      id: uuidv4(),
      title,
      completed: false,
      parent_id: taskId
    };
    
    // Atualizar localmente
    setTasks(prev => 
      prev.map(task => {
        if (task.id === taskId) {
          const subtasks = task.subtasks || [];
          return { ...task, subtasks: [...subtasks, newSubtask] };
        }
        return task;
      })
    );
    
    // Se estiver autenticado e online, sincronizar com Supabase
    if (isAuthenticated && isOnline) {
      try {
        const supabaseSubtask = await syncAddSubtask(taskId, title);
        if (supabaseSubtask) {
          // Atualizar a versão local com os dados retornados do Supabase
          setTasks(prev => 
            prev.map(task => {
              if (task.id === taskId) {
                return { 
                  ...task, 
                  subtasks: task.subtasks.map(st => 
                    st.id === supabaseSubtask.id ? supabaseSubtask : st
                  ) 
                };
              }
              return task;
            })
          );
        }
      } catch (error) {
        console.error('Erro ao adicionar subtarefa no Supabase:', error);
        // Em caso de erro, rastrear para sincronização posterior
        // Aqui precisamos adicionar código para rastrear mudanças em subtarefas
      }
    }
  };
  
  // Função para alternar o status de conclusão de uma subtarefa
  const toggleSubtaskCompletion = async (taskId: string, subtaskId: string) => {
    let updatedSubtask: Subtask | undefined;
    
    // Atualizar localmente para resposta imediata da UI
    setTasks(prev => 
      prev.map(task => {
        if (task.id === taskId && task.subtasks) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              updatedSubtask = { ...subtask, completed: !subtask.completed };
              return updatedSubtask;
            }
            return subtask;
          });
          
          // Verificar se todas as subtarefas estão concluídas
          const allSubtasksCompleted = updatedSubtasks.every(subtask => subtask.completed);
          
          return { 
            ...task, 
            subtasks: updatedSubtasks,
            // Apenas atualizar o status da tarefa principal se todas as subtarefas estiverem concluídas
            // e a tarefa principal não estiver marcada como concluída
            completed: allSubtasksCompleted || task.completed
          };
        }
        return task;
      })
    );
    
    // Se estiver autenticado e online, sincronizar com Supabase
    if (isAuthenticated && isOnline && updatedSubtask) {
      try {
        await syncUpdateSubtask(subtaskId, { completed: updatedSubtask.completed });
      } catch (error) {
        console.error('Erro ao atualizar subtarefa no Supabase:', error);
        // Em caso de erro, rastrear para sincronização posterior
        // Aqui precisamos adicionar código para rastrear mudanças em subtarefas
      }
    }
  };
  
  // Função para excluir uma subtarefa
  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    // Atualizar localmente para resposta imediata da UI
    setTasks(prev => 
      prev.map(task => {
        if (task.id === taskId && task.subtasks) {
          return { 
            ...task, 
            subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId) 
          };
        }
        return task;
      })
    );
    
    // Se estiver autenticado e online, sincronizar com Supabase
    if (isAuthenticated && isOnline) {
      try {
        await syncDeleteSubtask(subtaskId);
      } catch (error) {
        console.error('Erro ao excluir subtarefa no Supabase:', error);
        // Em caso de erro, rastrear para sincronização posterior
        // Aqui precisamos adicionar código para rastrear mudanças em subtarefas
      }
    }
  };

  // Exportar tarefas como JSON
  const exportTasks = () => {
    const exportData = {
      tasks,
      lists,
      tags,
      version: '1.1',
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  };

  // Importar tarefas de JSON
  const importTasks = (dataString: string) => {
    try {
      const data = JSON.parse(dataString);
      
      // Validar dados básicos
      if (!Array.isArray(data.tasks) || !Array.isArray(data.lists)) {
        throw new Error('Formato de dados inválido');
      }
      
      // Processar datas
      const processedTasks = data.tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        subtasks: (task.subtasks || []).map((subtask: any) => ({
          ...subtask,
          createdAt: new Date(subtask.createdAt)
        }))
      }));
      
      const processedLists = data.lists.map((list: any) => ({
        ...list,
        createdAt: new Date(list.createdAt)
      }));
      
      // Atualizar estado e localStorage
      setTasks(processedTasks);
      setLists(processedLists);
      
      // Processar tags se disponíveis
      if (Array.isArray(data.tags)) {
        setTags(data.tags);
      }
      
      // Rastrear alteração para sincronização offline
      if (processedTasks.length > 0) {
        trackTaskChange('add', processedTasks[0]);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  };
  
  // Nova função para importar dados de forma mais controlada
  const importDataFromJson = (data: { tasks: Task[], lists: TaskList[], tags: string[] }) => {
    try {
      // Garantir que sempre temos pelo menos a lista padrão
      const hasDefaultList = data.lists.some(list => list.id === 'default');
      const newLists = hasDefaultList ? data.lists : [...data.lists, DEFAULT_LIST];
      
      // Atualizar todos os estados
      setTasks(data.tasks);
      setLists(newLists);
      setTags(data.tags);
      
      // Salvar tudo no localStorage
      localStorage.setItem('tasks', JSON.stringify(data.tasks));
      localStorage.setItem('lists', JSON.stringify(newLists));
      localStorage.setItem('tags', JSON.stringify(data.tags));
      
      // Adicionar ao histórico de sincronização
      const syncRecord = {
        type: 'import',
        count: data.tasks.length,
        timestamp: new Date().toISOString()
      };
      
      const syncHistory = JSON.parse(localStorage.getItem('sync-history') || '[]');
      syncHistory.push(syncRecord);
      localStorage.setItem('sync-history', JSON.stringify(syncHistory));
      
      // Rastrear alteração para sincronização offline
      if (data.tasks.length > 0) {
        trackTaskChange('add', data.tasks[0]);
      }
      
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      throw error;
    }
  };
  
  // Adicionar tag
  const addTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    
    // Não adicionar tags vazias ou duplicadas
    if (!normalizedTag || tags.includes(normalizedTag)) {
      return;
    }
    
    const newTags = [...tags, normalizedTag];
    setTags(newTags);
    
    // Rastrear alteração para sincronização offline
    trackTagChange('add', normalizedTag);
  };
  
  // Remover tag
  const removeTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    
    // Também remover tag de todas as tarefas
    const updatedTasks = tasks.map(task => {
      if (task.tags.includes(tag)) {
        return {
          ...task,
          tags: task.tags.filter(t => t !== tag)
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    
    // Rastrear alteração para sincronização offline
    trackTagChange('delete', tag);
  };
  
  // Obter todas as tags
  const getAllTags = () => {
    return tags;
  };

  // Estatísticas e funções de utilidade
  const getTasksStats = (): TaskStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      new Date(task.dueDate) < today
    ).length;
    const highPriority = tasks.filter(task => 
      !task.completed && 
      task.priority === 'alta'
    ).length;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      total,
      completed,
      pending,
      overdue,
      highPriority,
      completionRate
    };
  };
  
  const getPendingTasks = () => {
    return tasks
      .filter(task => !task.completed)
      .sort((a, b) => {
        // Primeiro por prioridade
        const priorityOrder = { alta: 0, média: 1, baixa: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Depois por data de vencimento (se existir)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        
        // Por fim, por posição ou data de criação
        return (a.position || 0) - (b.position || 0);
      });
  };
  
  const getUpcomingTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return tasks
      .filter(task => 
        !task.completed && 
        task.dueDate && 
        new Date(task.dueDate) >= today &&
        new Date(task.dueDate) <= nextWeek
      )
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      });
  };

  // Criar versões memoizadas dos diferentes contextos
  const dataContextValue = useMemo(() => ({
    tasks,
    lists,
    kanbanColumns,
    tags,
  }), [tasks, lists, kanbanColumns, tags]);
  
  const filteredTasksMemo = useMemo(() => filterTasks(tasks, filter), [tasks, filter]);
  
  const filterContextValue = useMemo(() => ({
    filter,
    setFilter,
    filteredTasks: filteredTasksMemo,
  }), [filter, filteredTasksMemo]);
  
  const actionsContextValue = useMemo(() => ({
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    addList,
    updateList,
    deleteList,
    reorderTasks,
    addSubtask,
    toggleSubtaskCompletion,
    deleteSubtask,
    addTag,
    removeTag,
    addKanbanColumn,
    updateKanbanColumn,
    deleteKanbanColumn,
    moveTaskToColumn,
  }), []);  // Não incluir dependências para funções estáveis que não mudam

  const utilsContextValue = useMemo(() => ({
    exportTasks,
    importTasks,
    importDataFromJson,
    getTasksStats,
    getPendingTasks,
    getUpcomingTasks,
    getAllTags
  }), [tasks]); // Dependência em tasks pois algumas funções utilizam o estado atual

  const syncContextValue = useMemo(() => ({
    isOffline,
    isSyncing,
    lastSyncTime,
    pendingChanges,
    manualSync
  }), [isOffline, isSyncing, lastSyncTime, pendingChanges]);

  return (
    <TaskDataContext.Provider value={dataContextValue}>
      <TaskFilterContext.Provider value={filterContextValue}>
        <TaskActionsContext.Provider value={actionsContextValue}>
          <TaskUtilsContext.Provider value={utilsContextValue}>
            <TaskSyncContext.Provider value={syncContextValue}>
              {children}
            </TaskSyncContext.Provider>
          </TaskUtilsContext.Provider>
        </TaskActionsContext.Provider>
      </TaskFilterContext.Provider>
    </TaskDataContext.Provider>
  );
};

// Hooks para usar os contextos separados
export function useTaskData() {
  const context = useContext(TaskDataContext);
  if (context === undefined) {
    throw new Error('useTaskData must be used within a TaskProvider');
  }
  return context;
}

export function useTaskFilter() {
  const context = useContext(TaskFilterContext);
  if (context === undefined) {
    throw new Error('useTaskFilter must be used within a TaskProvider');
  }
  return context;
}

export function useTaskActions() {
  const context = useContext(TaskActionsContext);
  if (context === undefined) {
    throw new Error('useTaskActions must be used within a TaskProvider');
  }
  return context;
}

export function useTaskUtils() {
  const context = useContext(TaskUtilsContext);
  if (context === undefined) {
    throw new Error('useTaskUtils must be used within a TaskProvider');
  }
  return context;
}

export function useTaskSync() {
  const context = useContext(TaskSyncContext);
  if (context === undefined) {
    throw new Error('useTaskSync must be used within a TaskProvider');
  }
  return context;
}

// Manter compatibilidade com código existente
export function useTaskContext() {
  const data = useTaskData();
  const filter = useTaskFilter();
  const actions = useTaskActions();
  const utils = useTaskUtils();
  const sync = useTaskSync();
  
  return {
    ...data,
    ...filter,
    ...actions,
    ...utils,
    ...sync
  };
} 