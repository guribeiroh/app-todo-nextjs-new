import supabase from './supabase';
import { sprintServices, userStoryServices, boardServices, metricsServices } from './supabaseServices';
import { Sprint, UserStory, ScrumBoard, ScrumMetrics } from '../types';

/**
 * Função para migrar dados do localStorage para o Supabase
 * Esta função deve ser chamada uma única vez por usuário no processo de migração
 */
export const migrateLocalStorageToSupabase = async () => {
  console.log('Iniciando migração de dados para o Supabase...');
  
  try {
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Usuário não autenticado. A migração requer autenticação.');
      return { success: false, message: 'Usuário não autenticado' };
    }
    
    // Obter dados do localStorage
    const localSprints = localStorage.getItem('scrumSprints');
    const localStories = localStorage.getItem('scrumUserStories');
    const localBoards = localStorage.getItem('scrumBoards');
    const localMetrics = localStorage.getItem('scrumMetrics');
    
    // Mapear IDs antigos para novos IDs
    const idMappings: Record<string, string> = {};
    
    // Migrar Sprints
    if (localSprints) {
      console.log('Migrando sprints...');
      const sprints = JSON.parse(localSprints) as Sprint[];
      
      for (const sprint of sprints) {
        try {
          // Criar sprint no Supabase
          const newSprint = await sprintServices.create({
            name: sprint.name,
            goal: sprint.goal,
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            isActive: sprint.isActive,
            status: sprint.status,
            projectId: sprint.projectId
          });
          
          // Armazenar mapeamento de ID
          idMappings[sprint.id] = newSprint.id;
          console.log(`Sprint migrado: ${sprint.name} (${sprint.id} -> ${newSprint.id})`);
        } catch (error) {
          console.error(`Erro ao migrar sprint ${sprint.id}:`, error);
        }
      }
    }
    
    // Migrar Quadros Scrum
    if (localBoards) {
      console.log('Migrando quadros Scrum...');
      const boards = JSON.parse(localBoards) as ScrumBoard[];
      
      for (const board of boards) {
        try {
          // Criar quadro no Supabase
          const newBoard = await boardServices.create(board.name, board.projectId);
          
          // Atualizar com colunas e outras propriedades
          await boardServices.update({
            ...newBoard,
            columns: board.columns,
            currentSprintId: board.currentSprintId ? idMappings[board.currentSprintId] : undefined
          });
          
          console.log(`Quadro migrado: ${board.name}`);
        } catch (error) {
          console.error(`Erro ao migrar quadro ${board.id}:`, error);
        }
      }
    }
    
    // Migrar Histórias de Usuário
    if (localStories) {
      console.log('Migrando histórias de usuário...');
      const stories = JSON.parse(localStories) as UserStory[];
      
      for (const story of stories) {
        try {
          // Criar história no Supabase
          const newStory = await userStoryServices.create({
            title: story.title,
            description: story.description,
            priority: story.priority,
            status: story.status,
            storyPoints: story.storyPoints,
            acceptanceCriteria: story.acceptanceCriteria,
            sprintId: story.sprintId ? idMappings[story.sprintId] : undefined,
            epic: story.epic,
            position: story.position,
            tags: story.tags
          });
          
          // Se houver tarefas associadas, associá-las à nova história
          if (story.taskIds && story.taskIds.length > 0) {
            for (const taskId of story.taskIds) {
              await userStoryServices.assignTask(newStory.id, taskId);
            }
          }
          
          console.log(`História migrada: ${story.title}`);
        } catch (error) {
          console.error(`Erro ao migrar história ${story.id}:`, error);
        }
      }
    }
    
    // Migrar Métricas
    if (localMetrics) {
      console.log('Migrando métricas...');
      const metricsData = JSON.parse(localMetrics) as Record<string, ScrumMetrics>;
      
      for (const [oldSprintId, metricData] of Object.entries(metricsData)) {
        const newSprintId = idMappings[oldSprintId];
        
        if (newSprintId) {
          try {
            await metricsServices.updateMetrics(newSprintId, {
              burndown: metricData.burndown,
              velocity: metricData.velocity,
              completedStories: metricData.completedStories,
              totalStories: metricData.totalStories,
              completedPoints: metricData.completedPoints,
              totalPoints: metricData.totalPoints
            });
            
            console.log(`Métricas migradas para o sprint ${newSprintId}`);
          } catch (error) {
            console.error(`Erro ao migrar métricas do sprint ${oldSprintId}:`, error);
          }
        }
      }
    }
    
    console.log('Migração concluída com sucesso!');
    return { 
      success: true, 
      message: 'Dados migrados com sucesso para o Supabase',
      idMappings
    };
    
  } catch (error) {
    console.error('Erro durante o processo de migração:', error);
    return { 
      success: false, 
      message: 'Erro durante a migração. Verifique o console para mais detalhes.'
    };
  }
}; 