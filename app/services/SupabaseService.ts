import { Task, TaskList, Subtask } from '../types';
import supabase from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Serviço para gerenciar operações com o Supabase
 */
export default class SupabaseService {
  private static instance: SupabaseService;
  private userId: string | null = null;

  private constructor() {
    // Verificar se há um usuário logado ao inicializar
    this.checkSession();
  }

  /**
   * Obtém a instância única do serviço (Singleton)
   */
  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Verifica se há uma sessão ativa
   */
  private async checkSession() {
    try {
      console.log('Verificando sessão do usuário...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao verificar sessão:', error);
        this.userId = null;
        return;
      }
      
      this.userId = data.session?.user.id || null;
      
      if (this.userId) {
        console.log('Usuário autenticado encontrado:', this.userId);
      } else {
        console.log('Nenhum usuário autenticado encontrado');
      }
    } catch (error) {
      console.error('Exceção ao verificar sessão:', error);
      this.userId = null;
    }
  }

  /**
   * Testa a conexão com o Supabase
   */
  public async testConnection(): Promise<boolean> {
    try {
      console.log('Testando conexão com o Supabase...');
      const { data, error } = await supabase.from('task_lists').select('count').limit(1);
      
      if (error) {
        console.error('Erro ao testar conexão com o Supabase:', error);
        return false;
      }
      
      console.log('Conexão com o Supabase bem-sucedida');
      return true;
    } catch (error) {
      console.error('Exceção ao testar conexão com o Supabase:', error);
      return false;
    }
  }

  /**
   * Retorna o ID do usuário atual
   */
  public getUserId(): string | null {
    return this.userId;
  }

  /**
   * Define o ID do usuário atual (usado após login)
   */
  public async setUserId(userId: string | null): Promise<void> {
    console.log('Atualizando ID do usuário:', userId);
    
    // Se estamos fazendo login (userId não é null) e tínhamos tarefas anônimas anteriormente
    if (userId && !this.userId) {
      // Primeiro, tentamos migrar todas as tarefas anônimas para o usuário autenticado
      try {
        console.log('Tentando migrar tarefas anônimas para o usuário autenticado:', userId);
        
        // Verificar se existem tarefas anônimas
        const { data: anonymousTasks, error: checkError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', 'anonymous_user');
          
        if (checkError) {
          console.error('Erro ao verificar tarefas anônimas:', checkError);
        } 
        else if (anonymousTasks && anonymousTasks.length > 0) {
          console.log(`Encontradas ${anonymousTasks.length} tarefas anônimas para migrar`);
          
          // Atualizar as tarefas para o novo ID de usuário
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ user_id: userId })
            .eq('user_id', 'anonymous_user');
            
          if (updateError) {
            console.error('Erro ao migrar tarefas anônimas:', updateError);
          } else {
            console.log('Tarefas anônimas migradas com sucesso para:', userId);
          }
        } else {
          console.log('Nenhuma tarefa anônima encontrada para migrar');
        }
        
        // Também migrar listas anônimas
        const { data: anonymousLists, error: listsCheckError } = await supabase
          .from('task_lists')
          .select('*')
          .eq('user_id', 'anonymous_user');
          
        if (listsCheckError) {
          console.error('Erro ao verificar listas anônimas:', listsCheckError);
        } 
        else if (anonymousLists && anonymousLists.length > 0) {
          console.log(`Encontradas ${anonymousLists.length} listas anônimas para migrar`);
          
          // Atualizar as listas para o novo ID de usuário
          const { error: listUpdateError } = await supabase
            .from('task_lists')
            .update({ user_id: userId })
            .eq('user_id', 'anonymous_user');
            
          if (listUpdateError) {
            console.error('Erro ao migrar listas anônimas:', listUpdateError);
          } else {
            console.log('Listas anônimas migradas com sucesso para:', userId);
          }
        } else {
          console.log('Nenhuma lista anônima encontrada para migrar');
        }
      } catch (error) {
        console.error('Erro ao migrar dados anônimos:', error);
      }
    }
    
    // Atualizar o ID do usuário
    this.userId = userId;
    
    // Se houver um usuário, verificar se ele já tem listas
    // Se não tiver, criar a lista padrão
    if (userId) {
      try {
        console.log('Verificando listas existentes para o usuário:', userId);
        const { data, error } = await supabase
          .from('task_lists')
          .select('id')
          .eq('user_id', userId);
          
        if (error) {
          console.error('Erro ao verificar listas existentes:', error);
        } else if (!data || data.length === 0) {
          // Se não houver listas, criar a lista padrão
          console.log('Nenhuma lista encontrada, criando lista padrão para:', userId);
          await this.addList('Geral', '#6366F1');
        } else {
          console.log(`Encontradas ${data.length} listas para o usuário:`, userId);
        }
      } catch (error) {
        console.error('Erro ao verificar/criar listas para o usuário:', error);
      }
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  public isAuthenticated(): boolean {
    return !!this.userId;
  }

  /**
   * Busca todas as tarefas do usuário
   */
  public async fetchTasks(): Promise<Task[]> {
    if (!this.userId) {
      console.error('Usuário não autenticado');
      return [];
    }

    console.log('Buscando tarefas para o usuário:', this.userId);

    try {
      // Buscar tarefas no Supabase
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          subtasks(*)
        `)
        .eq('user_id', this.userId)
        .order('position');

      if (error) {
        console.error('Erro ao buscar tarefas:', error);
        return [];
      }

      console.log(`Encontradas ${data.length} tarefas para o usuário`);
      
      // Converter o resultado do banco de dados para o formato esperado pela aplicação
      const tasks: Task[] = data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        priority: task.priority,
        dueDate: task.due_date ? new Date(task.due_date) : undefined,
        listId: task.list_id,
        createdAt: new Date(task.created_at),
        position: task.position,
        tags: task.tags || [],
        subtasks: (task.subtasks || []).map((subtask: any) => ({
          id: subtask.id,
          title: subtask.title,
          completed: subtask.completed,
          createdAt: new Date(subtask.created_at),
          position: subtask.position
        }))
      }));
      
      return tasks;
    } catch (error) {
      console.error('Exceção não tratada ao buscar tarefas:', error);
      return [];
    }
  }

  /**
   * Busca todas as listas do usuário
   */
  public async fetchLists(): Promise<TaskList[]> {
    if (!this.userId) {
      console.error('Usuário não autenticado');
      return [];
    }

    console.log('Buscando listas para o usuário:', this.userId);

    try {
      const { data, error } = await supabase
        .from('task_lists')
        .select('*')
        .eq('user_id', this.userId);

      if (error) {
        console.error('Erro ao buscar listas:', error);
        return [];
      }

      console.log(`Encontradas ${data.length} listas para o usuário`);
      
      // Converter o resultado do banco de dados para o formato esperado pela aplicação
      const lists: TaskList[] = data.map(list => ({
        id: list.id,
        name: list.name,
        color: list.color,
        createdAt: new Date(list.created_at)
      }));
      
      return lists;
    } catch (error) {
      console.error('Exceção não tratada ao buscar listas:', error);
      return [];
    }
  }

  /**
   * Busca todas as subtarefas para uma tarefa
   */
  public async fetchSubtasks(taskId: string): Promise<Subtask[]> {
    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('taskId', taskId)
      .order('position');

    if (error) {
      console.error(`Erro ao buscar subtarefas para tarefa ${taskId}:`, error);
      return [];
    }

    return data.map(subtask => ({
      ...subtask,
      createdAt: new Date(subtask.createdAt)
    }));
  }

  /**
   * Adiciona uma nova tarefa
   */
  public async addTask(task: Omit<Task, 'id' | 'createdAt' | 'position' | 'subtasks'>): Promise<Task | null> {
    // Se não houver usuário autenticado, usar um ID padrão para armazenar as tarefas
    const effectiveUserId = this.userId || 'anonymous_user';
    
    console.log('[SupabaseService] Iniciando adição de nova tarefa para o usuário:', effectiveUserId);
    console.log('[SupabaseService] Dados da tarefa recebidos:', task);
    
    try {
      // Verificar se a lista existe (se um listId foi fornecido)
      if (task.listId) {
        console.log('[SupabaseService] Verificando se a lista existe:', task.listId);
        const { data: listData, error: listError } = await supabase
          .from('task_lists')
          .select('id')
          .eq('id', task.listId)
          .single();
          
        if (listError || !listData) {
          console.error('[SupabaseService] Erro: A lista especificada não existe:', task.listId);
          console.error('[SupabaseService] Detalhes do erro:', listError);
          return null;
        }
        
        console.log('[SupabaseService] Lista verificada e existe:', listData);
      } else {
        console.error('[SupabaseService] Erro: listId é obrigatório e não foi fornecido');
        return null;
      }
      
      // Busca a posição máxima atual para inserir como última tarefa
      const { data: positionData, error: positionError } = await supabase
        .from('tasks')
        .select('position')
        .eq('user_id', effectiveUserId)
        .order('position', { ascending: false })
        .limit(1);

      if (positionError) {
        console.error('[SupabaseService] Erro ao buscar posição para nova tarefa:', positionError);
      }
      
      const position = positionData && positionData.length > 0 
        ? positionData[0].position + 1 
        : 0;

      console.log('[SupabaseService] Posição calculada para nova tarefa:', position);

      // Preparar objeto para inserção seguindo o esquema da tabela 'tasks'
      const newTask = {
        title: task.title,
        description: task.description || null,
        completed: task.completed || false,
        priority: task.priority || 'média',
        due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
        list_id: task.listId,
        position: position,
        tags: task.tags || [],
        user_id: effectiveUserId,
        // Os campos completed_at e created_at serão preenchidos automaticamente pelo Supabase
      };

      console.log('[SupabaseService] Objeto da tarefa preparado para inserção:', newTask);

      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) {
        console.error('[SupabaseService] Erro ao adicionar tarefa:', error);
        console.error('[SupabaseService] Detalhes da operação:', { newTask, error });
        return null;
      }

      console.log('[SupabaseService] Tarefa adicionada com sucesso:', data);

      // Converter e retornar a tarefa no formato esperado pela aplicação
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        completed: data.completed,
        priority: data.priority,
        dueDate: data.due_date ? new Date(data.due_date) : undefined,
        listId: data.list_id,
        createdAt: new Date(data.created_at),
        position: data.position,
        tags: data.tags || [],
        subtasks: []
      };
    } catch (error) {
      console.error('[SupabaseService] Exceção não tratada ao adicionar tarefa:', error);
      return null;
    }
  }

  /**
   * Atualiza uma tarefa existente
   */
  public async updateTask(taskId: string, taskData: Partial<Task>): Promise<boolean> {
    // Se não houver usuário autenticado, usar um ID padrão
    const effectiveUserId = this.userId || 'anonymous_user';
    
    console.log(`Atualizando tarefa ${taskId} para o usuário ${effectiveUserId}`);
    
    try {
      // Preparar objeto para atualização seguindo o esquema da tabela 'tasks'
      const updateData: Record<string, any> = {};
      
      if (taskData.title !== undefined) updateData.title = taskData.title;
      if (taskData.description !== undefined) updateData.description = taskData.description;
      if (taskData.completed !== undefined) {
        updateData.completed = taskData.completed;
        
        // Se a tarefa foi concluída, definir a data de conclusão
        if (taskData.completed) {
          updateData.completed_at = new Date().toISOString();
        } else {
          updateData.completed_at = null;
        }
      }
      if (taskData.priority !== undefined) updateData.priority = taskData.priority;
      if (taskData.dueDate !== undefined) updateData.due_date = taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null;
      if (taskData.tags !== undefined) updateData.tags = taskData.tags;
      if (taskData.listId !== undefined) updateData.list_id = taskData.listId;
      if (taskData.position !== undefined) updateData.position = taskData.position;
      if (taskData.columnId !== undefined) updateData.column_id = taskData.columnId;
      
      console.log('Dados preparados para atualização:', updateData);
      
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', effectiveUserId);
      
      if (error) {
        console.error('Erro ao atualizar tarefa:', error);
        return false;
      }
      
      console.log(`Tarefa ${taskId} atualizada com sucesso`);
      return true;
    } catch (error) {
      console.error('Exceção não tratada ao atualizar tarefa:', error);
      return false;
    }
  }

  /**
   * Exclui uma tarefa
   */
  public async deleteTask(taskId: string): Promise<boolean> {
    // Se não houver usuário autenticado, usar um ID padrão
    const effectiveUserId = this.userId || 'anonymous_user';
    
    console.log(`Excluindo tarefa ${taskId} para o usuário ${effectiveUserId}`);
    
    try {
      // Primeiro excluir todas as subtarefas associadas
      const { error: subtasksError } = await supabase
        .from('subtasks')
        .delete()
        .eq('task_id', taskId);
      
      if (subtasksError) {
        console.error('Erro ao excluir subtarefas:', subtasksError);
        // Continuar com a exclusão da tarefa principal mesmo se houver erro nas subtarefas
      }
      
      // Excluir a tarefa principal
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', effectiveUserId);
      
      if (error) {
        console.error('Erro ao excluir tarefa:', error);
        return false;
      }
      
      console.log(`Tarefa ${taskId} excluída com sucesso`);
      return true;
    } catch (error) {
      console.error('Exceção não tratada ao excluir tarefa:', error);
      return false;
    }
  }

  /**
   * Adiciona uma nova lista
   */
  public async addList(name: string, color: string): Promise<TaskList | null> {
    // Se não houver usuário autenticado, usar um ID padrão
    const effectiveUserId = this.userId || 'anonymous_user';
    
    console.log(`Adicionando lista "${name}" para o usuário ${effectiveUserId}`);
    
    try {
      // Gerar um novo ID para a lista
      const listId = uuidv4();
      
      // Buscar a posição máxima atual
      const { data: positionData, error: positionError } = await supabase
        .from('task_lists')
        .select('order')
        .eq('user_id', effectiveUserId)
        .order('order', { ascending: false })
        .limit(1);
      
      if (positionError) {
        console.error('Erro ao buscar posição para nova lista:', positionError);
      }
      
      const order = positionData && positionData.length > 0 
        ? positionData[0].order + 1 
        : 0;
      
      console.log('Posição calculada para nova lista:', order);
      
      // Inserir nova lista
      const { data, error } = await supabase
        .from('task_lists')
        .insert({
          id: listId,
          name,
          color,
          order,
          user_id: effectiveUserId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao adicionar lista:', error);
        return null;
      }
      
      console.log('Lista adicionada com sucesso:', data);
      
      // Retornar a lista no formato esperado pela aplicação
      return {
        id: data.id,
        name: data.name,
        color: data.color,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Exceção não tratada ao adicionar lista:', error);
      return null;
    }
  }

  /**
   * Atualiza uma lista existente
   */
  public async updateList(listId: string, listData: Partial<TaskList>): Promise<boolean> {
    // Se não houver usuário autenticado, usar um ID padrão
    const effectiveUserId = this.userId || 'anonymous_user';
    
    console.log(`Atualizando lista ${listId} para o usuário ${effectiveUserId}`);
    
    try {
      // Preparar objeto para atualização
      const updateData: Record<string, any> = {};
      
      if (listData.name !== undefined) updateData.name = listData.name;
      if (listData.color !== undefined) updateData.color = listData.color;

      console.log('Dados preparados para atualização:', updateData);
      
      const { error } = await supabase
        .from('task_lists')
        .update(updateData)
        .eq('id', listId)
        .eq('user_id', effectiveUserId);
      
      if (error) {
        console.error('Erro ao atualizar lista:', error);
        return false;
      }
      
      console.log(`Lista ${listId} atualizada com sucesso`);
      return true;
    } catch (error) {
      console.error('Exceção não tratada ao atualizar lista:', error);
      return false;
    }
  }

  /**
   * Exclui uma lista
   */
  public async deleteList(listId: string): Promise<boolean> {
    // Se não houver usuário autenticado, usar um ID padrão
    const effectiveUserId = this.userId || 'anonymous_user';
    
    console.log(`Excluindo lista ${listId} para o usuário ${effectiveUserId}`);
    
    try {
      // Atualizar as tarefas que estão nesta lista para não terem lista (mover para a lista padrão)
      const { error: tasksError } = await supabase
        .from('tasks')
        .update({ list_id: null })
        .eq('list_id', listId)
        .eq('user_id', effectiveUserId);
      
      if (tasksError) {
        console.error('Erro ao atualizar tarefas da lista:', tasksError);
        // Continuar com a exclusão da lista mesmo se houver erro nas tarefas
      }
      
      // Excluir a lista
      const { error } = await supabase
        .from('task_lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', effectiveUserId);
      
      if (error) {
        console.error('Erro ao excluir lista:', error);
        return false;
      }
      
      console.log(`Lista ${listId} excluída com sucesso`);
      return true;
    } catch (error) {
      console.error('Exceção não tratada ao excluir lista:', error);
      return false;
    }
  }

  /**
   * Adiciona uma nova subtarefa
   */
  public async addSubtask(taskId: string, title: string, completed: boolean = false): Promise<Subtask | null> {
    if (!this.userId) {
      console.error('Usuário não autenticado');
      return null;
    }

    console.log('Iniciando adição de subtarefa para a tarefa:', taskId);
    
    try {
      // Verificar se o usuário tem acesso à tarefa
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('user_id')
        .eq('id', taskId)
        .single();
        
      if (taskError) {
        console.error('Erro ao verificar acesso à tarefa:', taskError);
        return null;
      }
      
      // Verificar se o usuário é o proprietário da tarefa
      if (taskData.user_id !== this.userId) {
        console.error('Usuário não tem permissão para adicionar subtarefas a esta tarefa');
        return null;
      }
      
      // Buscar a posição máxima atual para esta tarefa
      const { data: positionData, error: positionError } = await supabase
        .from('subtasks')
        .select('position')
        .eq('task_id', taskId)
        .order('position', { ascending: false })
        .limit(1);
        
      if (positionError) {
        console.error('Erro ao buscar posição para nova subtarefa:', positionError);
      }
      
      const position = positionData && positionData.length > 0 
        ? positionData[0].position + 1 
        : 0;
      
      console.log('Posição calculada para nova subtarefa:', position);
      
      // Preparar objeto para inserção
      const newSubtask = {
        task_id: taskId,
        title: title,
        completed: completed,
        position: position
        // O campo created_at será preenchido automaticamente
      };
      
      console.log('Objeto de subtarefa preparado para inserção:', newSubtask);
      
      // Inserir a subtarefa
      const { data, error } = await supabase
        .from('subtasks')
        .insert(newSubtask)
        .select()
        .single();
        
      if (error) {
        console.error('Erro ao adicionar subtarefa:', error);
        console.error('Detalhes da operação:', { taskId, title, newSubtask, error });
        return null;
      }
      
      console.log('Subtarefa adicionada com sucesso:', data);
      
      // Converter e retornar no formato esperado pela aplicação
      return {
        id: data.id,
        title: data.title,
        completed: data.completed,
        parent_id: data.task_id
      };
    } catch (error) {
      console.error('Exceção não tratada ao adicionar subtarefa:', error);
      return null;
    }
  }

  /**
   * Atualiza uma subtarefa
   */
  public async updateSubtask(subtaskId: string, subtaskData: Partial<Subtask>): Promise<boolean> {
    if (!this.userId) {
      console.error('Usuário não autenticado');
      return false;
    }

    console.log('Iniciando atualização da subtarefa:', subtaskId);
    
    try {
      // Converter os dados para o formato esperado pelo banco
      const updateData: Record<string, any> = {};
      
      // Atualizar a subtarefa no Supabase
      const { error } = await supabase
        .from('subtasks')
        .update(updateData)
        .eq('id', subtaskId)
        .eq('user_id', this.userId);
      
      if (error) {
        console.error('Erro ao atualizar subtarefa:', error);
        return false;
      }
      
      console.log('Subtarefa atualizada com sucesso:', subtaskId);
      return true;
    } catch (error) {
      console.error('Exceção não tratada ao atualizar subtarefa:', error);
      return false;
    }
  }

  /**
   * Exclui uma subtarefa
   */
  public async deleteSubtask(subtaskId: string): Promise<boolean> {
    if (!this.userId) {
      console.error('Usuário não autenticado');
      return false;
    }

    console.log('Iniciando exclusão da subtarefa:', subtaskId);
    
    try {
      // Verificar se o usuário tem acesso a essa subtarefa (através da tarefa)
      const { data: subtaskData, error: subtaskError } = await supabase
        .from('subtasks')
        .select('task_id')
        .eq('id', subtaskId)
        .single();
        
      if (subtaskError) {
        console.error('Erro ao verificar acesso à subtarefa:', subtaskError);
        return false;
      }
      
      const taskId = subtaskData.task_id;
      
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('user_id')
        .eq('id', taskId)
        .single();
        
      if (taskError) {
        console.error('Erro ao verificar propriedade da tarefa:', taskError);
        return false;
      }
      
      // Verificar se o usuário é o proprietário da tarefa
      if (taskData.user_id !== this.userId) {
        console.error('Usuário não tem permissão para excluir esta subtarefa');
        return false;
      }
      
      // Excluir a subtarefa
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) {
        console.error(`Erro ao excluir subtarefa ${subtaskId}:`, error);
        console.error('Detalhes da operação:', { subtaskId, error });
        return false;
      }

      console.log('Subtarefa excluída com sucesso:', subtaskId);
      return true;
    } catch (error) {
      console.error('Exceção não tratada ao excluir subtarefa:', error);
      return false;
    }
  }

  /**
   * Altera a ordem das tarefas
   */
  public async reorderTasks(taskIds: string[]): Promise<boolean> {
    if (!this.userId) {
      console.error('Usuário não autenticado');
      return false;
    }

    try {
      // Atualizar a posição de cada tarefa
      for (let i = 0; i < taskIds.length; i++) {
        const { error } = await supabase
          .from('tasks')
          .update({ position: i })
          .eq('id', taskIds[i])
          .eq('user_id', this.userId);

        if (error) {
          console.error(`Erro ao reordenar tarefa ${taskIds[i]}:`, error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao reordenar tarefas:', error);
      return false;
    }
  }
} 