import { Task, TaskList } from '../types';
import SupabaseService from './SupabaseService';

export default class MigrationService {
  private static instance: MigrationService;
  private supabaseService: SupabaseService;

  private constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  /**
   * Obtém a instância única do serviço (Singleton)
   */
  public static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }

  /**
   * Verifica se o usuário tem dados no localStorage
   */
  public hasLocalData(): boolean {
    if (typeof window === 'undefined') return false;
    
    const tasksJson = localStorage.getItem('tasks');
    const listsJson = localStorage.getItem('lists');
    
    return !!(tasksJson || listsJson);
  }

  /**
   * Verifica se os dados locais já existem no Supabase
   * Esta verificação é feita de forma assíncrona após o carregamento do app
   */
  public async localDataAlreadyInSupabase(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    if (!this.supabaseService.isAuthenticated()) {
      return false;
    }

    try {
      // Recupera dados locais
      const tasksJson = localStorage.getItem('tasks');
      const listsJson = localStorage.getItem('lists');
      
      if (!tasksJson && !listsJson) {
        return false; // Não há dados locais
      }

      // Recupera dados do Supabase
      const supabaseTasks = await this.supabaseService.fetchTasks();
      const supabaseLists = await this.supabaseService.fetchLists();
      
      // Se não há dados no Supabase, os dados locais definitivamente não estão lá
      if (supabaseTasks.length === 0 && supabaseLists.length === 0) {
        return false;
      }

      // Verifica se há tarefas locais
      if (tasksJson) {
        const localTasks: Task[] = JSON.parse(tasksJson, (key, value) => {
          if (key === 'createdAt' || key === 'dueDate' || key === 'completedAt') {
            return value ? new Date(value) : null;
          }
          return value;
        });
        
        // Se há muitas mais tarefas locais do que no Supabase, 
        // provavelmente os dados não estão sincronizados
        if (localTasks.length > supabaseTasks.length * 1.5) {
          return false;
        }
        
        // Verificação por amostragem - pega algumas tarefas locais e verifica se existem no Supabase por título
        const sampleSize = Math.min(5, localTasks.length);
        if (sampleSize > 0) {
          const sampleTasks = localTasks.slice(0, sampleSize);
          
          // Verifica se pelo menos 60% das tarefas de amostra existem no Supabase por título
          const matchCount = sampleTasks.reduce((count, localTask) => {
            const exists = supabaseTasks.some(
              supabaseTask => supabaseTask.title === localTask.title
            );
            return exists ? count + 1 : count;
          }, 0);
          
          const matchRatio = matchCount / sampleSize;
          if (matchRatio < 0.6) {
            return false;
          }
        }
      }
      
      // Verifica se há listas locais
      if (listsJson) {
        const localLists: TaskList[] = JSON.parse(listsJson, (key, value) => {
          if (key === 'createdAt') {
            return new Date(value);
          }
          return value;
        });
        
        // Verificação simples - pelo menos 70% das listas locais devem existir no Supabase por nome
        const matchCount = localLists.reduce((count, localList) => {
          const exists = supabaseLists.some(
            supabaseList => supabaseList.name === localList.name
          );
          return exists ? count + 1 : count;
        }, 0);
        
        const matchRatio = matchCount / localLists.length;
        if (matchRatio < 0.7) {
          return false;
        }
      }
      
      // Se chegou até aqui, é provável que os dados locais já existam no Supabase
      return true;
      
    } catch (error) {
      console.error('Erro ao verificar dados no Supabase:', error);
      return false;
    }
  }

  /**
   * Migra dados do localStorage para o Supabase
   */
  public async migrateToSupabase(): Promise<{
    success: boolean;
    tasksMigrated: number;
    listsMigrated: number;
    errors?: string[];
  }> {
    if (!this.supabaseService.isAuthenticated()) {
      return {
        success: false,
        tasksMigrated: 0,
        listsMigrated: 0,
        errors: ['Usuário não autenticado. Faça login antes de migrar dados.']
      };
    }

    if (typeof window === 'undefined') {
      return {
        success: false,
        tasksMigrated: 0,
        listsMigrated: 0,
        errors: ['Migração só pode ser executada no navegador.']
      };
    }

    const errors: string[] = [];
    let tasksMigrated = 0;
    let listsMigrated = 0;

    try {
      // Migrar listas primeiro
      const listsJson = localStorage.getItem('lists');
      if (listsJson) {
        const lists: TaskList[] = JSON.parse(listsJson, (key, value) => {
          if (key === 'createdAt') {
            return new Date(value);
          }
          return value;
        });

        // Mapear IDs locais para novos IDs
        const listIdMap = new Map<string, string>();

        // Buscar listas existentes para evitar duplicação
        const existingLists = await this.supabaseService.fetchLists();
        const existingListsMap = new Map(existingLists.map(list => [list.name, list.id]));

        // Migrar cada lista
        for (const list of lists) {
          if (list.id === 'default') {
            // Buscar ID da lista padrão existente
            const defaultList = existingLists.find(l => l.name === 'Tarefas' || l.id === 'default');
            if (defaultList) {
              listIdMap.set('default', defaultList.id);
              continue;
            }
          }

          // Verificar se já existe uma lista com o mesmo nome
          if (existingListsMap.has(list.name)) {
            listIdMap.set(list.id, existingListsMap.get(list.name)!);
            continue;
          }

          try {
            const newList = await this.supabaseService.addList(list.name, list.color);
            if (newList) {
              listsMigrated++;
              listIdMap.set(list.id, newList.id);
            }
          } catch (error: any) {
            errors.push(`Erro ao migrar lista "${list.name}": ${error.message}`);
          }
        }

        // Migrar tarefas
        const tasksJson = localStorage.getItem('tasks');
        if (tasksJson) {
          const tasks: Task[] = JSON.parse(tasksJson, (key, value) => {
            if (key === 'createdAt' || key === 'dueDate' || key === 'completedAt') {
              return value ? new Date(value) : null;
            }
            return value;
          });

          // Migrar cada tarefa
          for (const task of tasks) {
            try {
              // Mapear ID da lista para o novo ID
              const listId = listIdMap.get(task.listId) || 'default';

              const taskToAdd = {
                title: task.title,
                description: task.description,
                completed: task.completed,
                priority: task.priority,
                dueDate: task.dueDate,
                listId: listId,
                tags: task.tags || []
              };

              const newTask = await this.supabaseService.addTask(taskToAdd);
              if (newTask) {
                tasksMigrated++;

                // Migrar subtarefas
                if (task.subtasks && task.subtasks.length > 0) {
                  for (const subtask of task.subtasks) {
                    await this.supabaseService.addSubtask(newTask.id, subtask.title, subtask.completed);
                  }
                }
              }
            } catch (error: any) {
              errors.push(`Erro ao migrar tarefa "${task.title}": ${error.message}`);
            }
          }
        }
      }

      return {
        success: errors.length === 0,
        tasksMigrated,
        listsMigrated,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error: any) {
      return {
        success: false,
        tasksMigrated,
        listsMigrated,
        errors: [`Erro durante a migração: ${error.message}`]
      };
    }
  }

  /**
   * Limpa os dados locais após uma migração bem-sucedida
   */
  public clearLocalData(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('tasks');
    localStorage.removeItem('lists');
    localStorage.removeItem('tags');
  }
} 