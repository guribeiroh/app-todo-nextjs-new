import supabase from './supabase';
import { Sprint, UserStory, ScrumBoard, BurndownData, ScrumMetrics, Task } from '../types';

// Serviços para Sprints
export const sprintServices = {
  async getAll() {
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Converter para o formato esperado pela aplicação
    return data.map(sprint => ({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.start_date,
      endDate: sprint.end_date,
      isActive: sprint.is_active,
      status: sprint.status,
      projectId: sprint.project_id,
      createdAt: sprint.created_at,
      updatedAt: sprint.updated_at,
      completedAt: sprint.completed_at
    })) as Sprint[];
  },
  
  async getById(id: string) {
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Converter para o formato esperado pela aplicação
    return {
      id: data.id,
      name: data.name,
      goal: data.goal,
      startDate: data.start_date,
      endDate: data.end_date,
      isActive: data.is_active,
      status: data.status,
      projectId: data.project_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at
    } as Sprint;
  },
  
  async getActive() {
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Nenhum sprint ativo encontrado
        return null;
      }
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      goal: data.goal,
      startDate: data.start_date,
      endDate: data.end_date,
      isActive: data.is_active,
      status: data.status,
      projectId: data.project_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at
    } as Sprint;
  },
  
  async create(sprint: Omit<Sprint, 'id' | 'createdAt'>) {
    // Converter do formato da aplicação para o formato do banco
    const sprintData = {
      name: sprint.name,
      goal: sprint.goal,
      start_date: sprint.startDate,
      end_date: sprint.endDate,
      is_active: sprint.isActive,
      status: sprint.status,
      project_id: sprint.projectId,
      completed_at: sprint.completedAt,
      user_id: (await supabase.auth.getUser()).data.user?.id
    };
    
    const { data, error } = await supabase
      .from('sprints')
      .insert([sprintData])
      .select()
      .single();
    
    if (error) throw error;
    
    // Converter de volta para o formato esperado pela aplicação
    return {
      id: data.id,
      name: data.name,
      goal: data.goal,
      startDate: data.start_date,
      endDate: data.end_date,
      isActive: data.is_active,
      status: data.status,
      projectId: data.project_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at
    } as Sprint;
  },
  
  async update(sprint: Sprint) {
    // Converter do formato da aplicação para o formato do banco
    const sprintData = {
      name: sprint.name,
      goal: sprint.goal,
      start_date: sprint.startDate,
      end_date: sprint.endDate,
      is_active: sprint.isActive,
      status: sprint.status,
      project_id: sprint.projectId,
      completed_at: sprint.completedAt,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('sprints')
      .update(sprintData)
      .eq('id', sprint.id);
    
    if (error) throw error;
  },
  
  async delete(id: string) {
    const { error } = await supabase
      .from('sprints')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
  
  async setActive(id: string, isActive: boolean) {
    // Primeiro, desative todos os Sprints
    if (isActive) {
      const { error: resetError } = await supabase
        .from('sprints')
        .update({ is_active: false })
        .neq('id', id);
      
      if (resetError) throw resetError;
    }
    
    // Em seguida, atualize o Sprint específico
    const { error } = await supabase
      .from('sprints')
      .update({ 
        is_active: isActive,
        status: isActive ? 'active' : 'planning',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  },
  
  async complete(id: string) {
    const { error } = await supabase
      .from('sprints')
      .update({ 
        is_active: false,
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  },
  
  async getSprintStories(sprintId: string) {
    const { data, error } = await supabase
      .from('user_stories')
      .select('*')
      .eq('sprint_id', sprintId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    
    return data.map(story => ({
      ...story,
      id: story.id,
      sprintId: story.sprint_id,
      storyPoints: story.story_points,
      acceptanceCriteria: story.acceptance_criteria,
      createdAt: story.created_at,
      updatedAt: story.updated_at,
      completedAt: story.completed_at,
      taskIds: []
    })) as UserStory[];
  }
};

// Serviços para Histórias de Usuário
export const userStoryServices = {
  async getAll() {
    const { data, error } = await supabase
      .from('user_stories')
      .select('*, sprint:sprints(id, name, is_active)')
      .order('position', { ascending: true });
    
    if (error) throw error;
    
    return data.map(story => ({
      ...story,
      id: story.id,
      sprintId: story.sprint_id,
      storyPoints: story.story_points,
      acceptanceCriteria: story.acceptance_criteria,
      createdAt: story.created_at,
      updatedAt: story.updated_at,
      completedAt: story.completed_at,
      taskIds: [] // Será preenchido em uma chamada separada
    })) as UserStory[];
  },
  
  async getById(storyId: string) {
    const { data, error } = await supabase
      .from('user_stories')
      .select('*, sprint:sprints(id, name, is_active)')
      .eq('id', storyId)
      .single();
    
    if (error) throw error;
    
    return {
      ...data,
      id: data.id,
      sprintId: data.sprint_id,
      storyPoints: data.story_points,
      acceptanceCriteria: data.acceptance_criteria,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,
      taskIds: []
    } as UserStory;
  },
  
  async getByStatus(status: string) {
    const { data, error } = await supabase
      .from('user_stories')
      .select('*, sprint:sprints(id, name, is_active)')
      .eq('status', status)
      .order('position', { ascending: true });
    
    if (error) throw error;
    
    return data.map(story => ({
      ...story,
      id: story.id,
      sprintId: story.sprint_id,
      storyPoints: story.story_points,
      acceptanceCriteria: story.acceptance_criteria,
      createdAt: story.created_at,
      updatedAt: story.updated_at,
      completedAt: story.completed_at,
      taskIds: []
    })) as UserStory[];
  },
  
  async getStoryTasks(storyId: string) {
    const { data, error } = await supabase
      .from('user_story_tasks')
      .select('task_id')
      .eq('user_story_id', storyId);
    
    if (error) throw error;
    return data.map(item => item.task_id);
  },
  
  async getTasksWithDetails(storyId: string) {
    // Primeiro, obtenha os IDs das tarefas
    const taskIds = await this.getStoryTasks(storyId);
    
    if (taskIds.length === 0) return [];
    
    // Em seguida, obtenha os detalhes completos das tarefas
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .in('id', taskIds);
    
    if (error) throw error;
    
    return data as Task[];
  },
  
  async create(story: Omit<UserStory, 'id' | 'createdAt' | 'taskIds'>) {
    try {
      // Validar o status da história para garantir que esteja de acordo com a constraint
      const validStatuses = ['backlog', 'selected', 'inProgress', 'testing', 'done'];
      let status = story.status;
      
      if (!validStatuses.includes(status)) {
        status = 'backlog'; // Valor padrão seguro
        console.warn(`Status inválido: "${status}". Usando valor padrão "backlog".`);
      }
      
      const storyData = {
        title: story.title,
        description: story.description,
        priority: story.priority,
        status: status, // Garantir que seja um valor válido
        story_points: story.storyPoints,
        acceptance_criteria: story.acceptanceCriteria || [],
        sprint_id: story.sprintId,
        epic: story.epic,
        position: story.position || 0,
        tags: story.tags || [],
        user_id: (await supabase.auth.getUser()).data.user?.id
      };
      
      console.log('Sending to Supabase:', storyData);
      
      const { data, error } = await supabase
        .from('user_stories')
        .insert(storyData)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        storyPoints: data.story_points,
        acceptanceCriteria: data.acceptance_criteria || [],
        sprintId: data.sprint_id,
        epic: data.epic,
        position: data.position || 0,
        tags: data.tags || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        completedAt: data.completed_at,
        taskIds: []
      } as UserStory;
    } catch (error) {
      console.error('Erro ao criar história:', error);
      throw error;
    }
  },
  
  async update(story: UserStory) {
    try {
      // Validar o status da história para garantir que esteja de acordo com a constraint
      const validStatuses = ['backlog', 'selected', 'inProgress', 'testing', 'done'];
      let status = story.status;
      
      if (!validStatuses.includes(status)) {
        status = 'backlog'; // Valor padrão seguro
        console.warn(`Status inválido: "${status}". Usando valor padrão "backlog".`);
      }
      
      const storyData = {
        title: story.title,
        description: story.description,
        priority: story.priority,
        status: status, // Garantir que seja um valor válido
        story_points: story.storyPoints,
        acceptance_criteria: story.acceptanceCriteria || [],
        sprint_id: story.sprintId,
        epic: story.epic,
        position: story.position || 0,
        tags: story.tags || [],
        updated_at: new Date().toISOString(),
        completed_at: story.status === 'done' && !story.completedAt 
          ? new Date().toISOString() 
          : story.completedAt
      };
      
      const { error } = await supabase
        .from('user_stories')
        .update(storyData)
        .eq('id', story.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar história:', error);
      throw error;
    }
  },
  
  async delete(id: string) {
    // Primeiro remova todas as associações de tarefas
    const { error: relationError } = await supabase
      .from('user_story_tasks')
      .delete()
      .eq('user_story_id', id);
    
    if (relationError) throw relationError;
    
    // Em seguida, exclua a história
    const { error } = await supabase
      .from('user_stories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
  
  async assignTask(storyId: string, taskId: string) {
    const { error } = await supabase
      .from('user_story_tasks')
      .insert([{ user_story_id: storyId, task_id: taskId }]);
    
    if (error) throw error;
  },
  
  async removeTask(storyId: string, taskId: string) {
    const { error } = await supabase
      .from('user_story_tasks')
      .delete()
      .match({ user_story_id: storyId, task_id: taskId });
    
    if (error) throw error;
  },
  
  async moveStory(storyId: string, status: string, position?: number) {
    try {
      // Validar o status da história para garantir que esteja de acordo com a constraint
      const validStatuses = ['backlog', 'selected', 'inProgress', 'testing', 'done'];
      
      if (!validStatuses.includes(status)) {
        console.warn(`Status inválido: "${status}". Usando valor padrão "backlog".`);
        status = 'backlog'; // Valor padrão seguro
      }
      
      const { error } = await supabase
        .from('user_stories')
        .update({ 
          status, 
          position: position !== undefined ? position : 0,
          updated_at: new Date().toISOString(),
          completed_at: status === 'done' ? new Date().toISOString() : null
        })
        .eq('id', storyId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao mover história:', error);
      throw error;
    }
  },
  
  async assignToSprint(storyId: string, sprintId: string | null) {
    const { error } = await supabase
      .from('user_stories')
      .update({ 
        sprint_id: sprintId,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);
    
    if (error) throw error;
  }
};

// Serviços para Quadros Scrum
export const boardServices = {
  async getAll() {
    const { data, error } = await supabase
      .from('scrum_boards')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(board => ({
      id: board.id,
      name: board.name,
      columns: board.columns,
      currentSprintId: board.current_sprint_id,
      projectId: board.project_id,
      createdAt: board.created_at,
      updatedAt: board.updated_at
    })) as ScrumBoard[];
  },
  
  async getById(boardId: string) {
    const { data, error } = await supabase
      .from('scrum_boards')
      .select('*')
      .eq('id', boardId)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      columns: data.columns,
      currentSprintId: data.current_sprint_id,
      projectId: data.project_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } as ScrumBoard;
  },
  
  async create(name: string, projectId?: string) {
    const boardData = {
      name,
      columns: {
        productBacklog: [],
        sprintBacklog: [],
        inProgress: [],
        testing: [],
        done: []
      },
      project_id: projectId,
      user_id: (await supabase.auth.getUser()).data.user?.id
    };
    
    const { data, error } = await supabase
      .from('scrum_boards')
      .insert([boardData])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      columns: data.columns,
      currentSprintId: data.current_sprint_id,
      projectId: data.project_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } as ScrumBoard;
  },
  
  async update(board: ScrumBoard) {
    const boardData = {
      name: board.name,
      columns: board.columns,
      current_sprint_id: board.currentSprintId,
      project_id: board.projectId,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('scrum_boards')
      .update(boardData)
      .eq('id', board.id);
    
    if (error) throw error;
  },
  
  async delete(id: string) {
    const { error } = await supabase
      .from('scrum_boards')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
  
  async setCurrentSprint(boardId: string, sprintId: string | null) {
    const { error } = await supabase
      .from('scrum_boards')
      .update({ 
        current_sprint_id: sprintId,
        updated_at: new Date().toISOString()
      })
      .eq('id', boardId);
    
    if (error) throw error;
  }
};

// Serviços para métricas Scrum
export const metricsServices = {
  async getBySprintId(sprintId: string) {
    try {
      const { data, error } = await supabase
        .from('scrum_metrics')
        .select('*')
        .eq('sprint_id', sprintId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) return null;
      
      return {
        sprintId: data.sprint_id,
        burndown: data.burndown_data || [],
        velocity: data.velocity || 0,
        completedStories: data.completed_stories || 0,
        totalStories: data.total_stories || 0,
        completedPoints: data.completed_points || 0,
        totalPoints: data.total_points || 0
      } as ScrumMetrics;
    } catch (error) {
      console.error('Erro ao obter métricas:', error);
      return null;
    }
  },
  
  async updateMetrics(sprintId: string, metrics: Partial<ScrumMetrics>) {
    try {
      const existingMetrics = await this.getBySprintId(sprintId);
      
      const metricsData = {
        sprint_id: sprintId,
        burndown_data: metrics.burndown || (existingMetrics?.burndown || []),
        velocity: metrics.velocity || existingMetrics?.velocity || 0,
        completed_stories: metrics.completedStories || existingMetrics?.completedStories || 0,
        total_stories: metrics.totalStories || existingMetrics?.totalStories || 0,
        completed_points: metrics.completedPoints || existingMetrics?.completedPoints || 0,
        total_points: metrics.totalPoints || existingMetrics?.totalPoints || 0,
        updated_at: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      };
      
      if (existingMetrics) {
        const { error } = await supabase
          .from('scrum_metrics')
          .update(metricsData)
          .eq('sprint_id', sprintId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('scrum_metrics')
          .insert([metricsData]);
        
        if (error) throw error;
      }
      
      return await this.getBySprintId(sprintId);
    } catch (error) {
      console.error('Erro ao atualizar métricas:', error);
      throw error;
    }
  },
  
  async updateBurndownData(sprintId: string, burndownData: BurndownData[]) {
    const { error } = await supabase
      .from('scrum_metrics')
      .update({ 
        burndown_data: burndownData,
        updated_at: new Date().toISOString()
      })
      .eq('sprint_id', sprintId);
    
    if (error) throw error;
  },
  
  async delete(sprintId: string) {
    const { error } = await supabase
      .from('scrum_metrics')
      .delete()
      .eq('sprint_id', sprintId);
    
    if (error) throw error;
  },
  
  async calculateVelocity(userId: string, sprintCount: number = 3) {
    // Obter os sprints concluídos mais recentes
    const { data: sprints, error } = await supabase
      .from('sprints')
      .select('id')
      .eq('status', 'completed')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(sprintCount);
    
    if (error) throw error;
    
    if (!sprints || sprints.length === 0) return 0;
    
    // Obter as métricas para esses sprints
    const sprintIds = sprints.map(s => s.id);
    const { data: metrics, error: metricsError } = await supabase
      .from('scrum_metrics')
      .select('completed_points')
      .in('sprint_id', sprintIds);
    
    if (metricsError) throw metricsError;
    
    if (!metrics || metrics.length === 0) return 0;
    
    // Calcular a velocidade média
    const totalPoints = metrics.reduce((sum, m) => sum + (m.completed_points || 0), 0);
    return totalPoints / metrics.length;
  }
}; 