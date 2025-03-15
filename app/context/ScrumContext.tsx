'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sprint, UserStory, ScrumBoard, BurndownData, ScrumMetrics, Task } from '../types';
import { useTaskContext } from './TaskContext';
import { useAuth } from './AuthContext';
import { sprintServices, userStoryServices, boardServices, metricsServices } from '../lib/supabaseServices';

interface ScrumContextType {
  // Dados
  sprints: Sprint[];
  userStories: UserStory[];
  scrumBoards: ScrumBoard[];
  scrumMetrics: Record<string, ScrumMetrics>;
  activeSprint: Sprint | null;
  
  // Funções para Sprints
  createSprint: (sprint: Omit<Sprint, 'id' | 'createdAt'>) => Promise<Sprint>;
  updateSprint: (sprint: Sprint) => Promise<void>;
  deleteSprint: (sprintId: string) => Promise<void>;
  startSprint: (sprintId: string) => Promise<void>;
  completeSprint: (sprintId: string) => Promise<void>;
  setActiveSprint: (sprint: Sprint | null) => void;
  
  // Funções para Histórias de Usuário
  createUserStory: (story: Omit<UserStory, 'id' | 'createdAt' | 'taskIds'>, columnId?: string) => Promise<UserStory>;
  updateUserStory: (story: UserStory) => Promise<void>;
  deleteUserStory: (storyId: string) => Promise<void>;
  assignTaskToStory: (taskId: string, storyId: string) => Promise<void>;
  removeTaskFromStory: (taskId: string, storyId: string) => Promise<void>;
  
  // Funções para o Quadro SCRUM
  createScrumBoard: (name: string, projectId?: string) => Promise<ScrumBoard>;
  updateScrumBoard: (board: ScrumBoard) => Promise<void>;
  deleteScrumBoard: (boardId: string) => Promise<void>;
  moveUserStory: (storyId: string, sourceColumn: string, targetColumn: string, targetIndex?: number) => Promise<void>;
  
  // Métricas e estatísticas
  getBurndownData: (sprintId: string) => BurndownData[];
  updateBurndownData: (sprintId: string) => Promise<void>;
  calculateVelocity: (sprintCount?: number) => Promise<number>;
  
  // UI state para drag and drop
  setActiveDroppableId: (id: string | null) => void;
  
  // Configurações de UI
  soundsEnabled: boolean;
  toggleSounds: () => void;
}

const ScrumContext = createContext<ScrumContextType | undefined>(undefined);

export const ScrumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estado para Sprints
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para Histórias de Usuário
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  
  // Estado para o Quadro Scrum
  const [scrumBoards, setScrumBoards] = useState<ScrumBoard[]>([]);
  
  // Estado para Métricas
  const [metrics, setMetrics] = useState<Record<string, ScrumMetrics>>({});

  // Estados da UI
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(null);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  
  // Estado para controlar se os sons estão habilitados
  const [soundsEnabled, setSoundsEnabled] = useState<boolean>(true);
  
  const { tasks, updateTask, addTask, deleteTask } = useTaskContext();
  const { user } = useAuth();
  
  // Carrega os dados iniciais
  useEffect(() => {
    const loadScrumData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Carregar Sprints
        const sprintsData = await sprintServices.getAll();
        setSprints(sprintsData);
        
        // Verificar se há um ID de sprint ativo salvo no localStorage
        const savedActiveSprintId = localStorage.getItem('activeSprintId');
        if (savedActiveSprintId) {
          const savedSprint = sprintsData.find(s => s.id === savedActiveSprintId);
          if (savedSprint) {
            setActiveSprint(savedSprint);
          }
        } else {
          // Se não houver ID salvo, verificar se há um sprint ativo
          const activeSprint = sprintsData.find(s => s.isActive);
          if (activeSprint) {
            setActiveSprint(activeSprint);
          }
        }
        
        // Carregar Histórias de Usuário
        const storiesData = await userStoryServices.getAll();
        
        // Carregar as tarefas para cada história
        const storiesWithTasks = await Promise.all(
          storiesData.map(async (story) => {
            const taskIds = await userStoryServices.getStoryTasks(story.id);
            return { ...story, taskIds };
          })
        );
        
        setUserStories(storiesWithTasks);
        
        // Carregar Quadros Scrum
        const boardsData = await boardServices.getAll();
        setScrumBoards(boardsData);
        
        // Carregar Métricas para o Sprint ativo
        if (activeSprint) {
          const metricsData = await metricsServices.getBySprintId(activeSprint.id);
          if (metricsData) {
            setMetrics(prev => ({ ...prev, [activeSprint.id]: metricsData }));
          }
        }

        setError(null);
      } catch (err) {
        console.error('Erro ao carregar dados do Scrum:', err);
        setError('Falha ao carregar dados do Scrum. Por favor, tente novamente.');
        
        // Carregar dados do localStorage como fallback
        const localSprints = localStorage.getItem('scrumSprints');
        const localStories = localStorage.getItem('scrumUserStories');
        const localBoards = localStorage.getItem('scrumBoards');
        const localMetrics = localStorage.getItem('scrumMetrics');
        
        if (localSprints) setSprints(JSON.parse(localSprints));
        if (localStories) setUserStories(JSON.parse(localStories));
        if (localBoards) setScrumBoards(JSON.parse(localBoards));
        if (localMetrics) setMetrics(JSON.parse(localMetrics));
      } finally {
        setLoading(false);
      }
    };
    
    loadScrumData();
  }, [user]);
  
  // Salva os dados no localStorage como backup
  useEffect(() => {
    if (!loading && sprints.length > 0) {
      localStorage.setItem('scrumSprints', JSON.stringify(sprints));
    }
  }, [sprints, loading]);
  
  useEffect(() => {
    if (!loading && userStories.length > 0) {
      localStorage.setItem('scrumUserStories', JSON.stringify(userStories));
    }
  }, [userStories, loading]);
  
  useEffect(() => {
    if (!loading && scrumBoards.length > 0) {
      localStorage.setItem('scrumBoards', JSON.stringify(scrumBoards));
    }
  }, [scrumBoards, loading]);
  
  useEffect(() => {
    if (!loading && Object.keys(metrics).length > 0) {
      localStorage.setItem('scrumMetrics', JSON.stringify(metrics));
    }
  }, [metrics, loading]);

  // Determina o Sprint ativo sempre que os sprints mudarem
  useEffect(() => {
    const activeSprintFound = sprints.find(sprint => sprint.isActive);
    setActiveSprint(activeSprintFound || null);
  }, [sprints]);

  // Verificar configuração de sons ao inicializar
  useEffect(() => {
    const savedSoundPreference = localStorage.getItem('scrumSoundsEnabled');
    if (savedSoundPreference !== null) {
      setSoundsEnabled(savedSoundPreference === 'true');
    }
  }, []);
  
  // Função para alternar os sons
  const toggleSounds = useCallback(() => {
    const newValue = !soundsEnabled;
    setSoundsEnabled(newValue);
    localStorage.setItem('scrumSoundsEnabled', newValue.toString());
  }, [soundsEnabled]);

  // Funções para gerenciar Sprints
  const createSprint = async (sprint: Omit<Sprint, 'id' | 'createdAt'>) => {
    try {
      const newSprint = await sprintServices.create(sprint);
      setSprints(prev => [newSprint, ...prev]);
      return newSprint;
    } catch (err) {
      console.error('Erro ao criar Sprint:', err);
      setError('Falha ao criar Sprint.');
      throw err;
    }
  };
  
  const updateSprint = async (sprint: Sprint) => {
    try {
      await sprintServices.update(sprint);
      setSprints(prev => prev.map(s => s.id === sprint.id ? sprint : s));
    } catch (err) {
      console.error('Erro ao atualizar Sprint:', err);
      setError('Falha ao atualizar Sprint.');
      throw err;
    }
  };
  
  const deleteSprint = async (id: string) => {
    try {
      // Primeiro, remova métricas relacionadas a este sprint
      await metricsServices.delete(id);
      
      // Agora remova o sprint
      await sprintServices.delete(id);
      setSprints(prev => prev.filter(s => s.id !== id));
      
      // Remover o sprintId das histórias associadas
      const affectedStories = userStories.filter(story => story.sprintId === id);
      
      // Atualizar o estado local
      setUserStories(prev => 
        prev.map(story => 
          story.sprintId === id ? { ...story, sprintId: undefined } : story
        )
      );
      
      // Atualizar no Supabase
      await Promise.all(
        affectedStories.map(story => 
          userStoryServices.assignToSprint(story.id, null)
        )
      );
      
      // Atualizar os quadros que usam este sprint
      const affectedBoards = scrumBoards.filter(board => board.currentSprintId === id);
      
      // Atualizar o estado local
      setScrumBoards(prev =>
        prev.map(board =>
          board.currentSprintId === id ? { ...board, currentSprintId: undefined } : board
        )
      );
      
      // Atualizar no Supabase
      await Promise.all(
        affectedBoards.map(board =>
          boardServices.setCurrentSprint(board.id, null)
        )
      );
    } catch (err) {
      console.error('Erro ao excluir Sprint:', err);
      setError('Falha ao excluir Sprint.');
      throw err;
    }
  };
  
  const startSprint = async (id: string) => {
    try {
      await sprintServices.setActive(id, true);
      setSprints(prev => 
        prev.map(sprint => 
          sprint.id === id
            ? { ...sprint, isActive: true, status: 'active' }
            : { ...sprint, isActive: false }
        )
      );
      
      // Carregar métricas para o novo sprint ativo
      const metricsData = await metricsServices.getBySprintId(id);
      if (metricsData) {
        setMetrics(prev => ({ ...prev, [id]: metricsData }));
      }
    } catch (err) {
      console.error('Erro ao iniciar Sprint:', err);
      setError('Falha ao iniciar Sprint.');
      throw err;
    }
  };
  
  const completeSprint = async (id: string) => {
    try {
      await sprintServices.complete(id);
      setSprints(prev => 
        prev.map(sprint => 
          sprint.id === id
            ? { 
                ...sprint, 
                isActive: false, 
                status: 'completed' as const, 
                completedAt: new Date() 
              }
            : sprint
        )
      );
      
      // Atualizar métricas do sprint
      if (metrics[id]) {
        await metricsServices.updateMetrics(id, metrics[id]);
      }
    } catch (err) {
      console.error('Erro ao completar Sprint:', err);
      setError('Falha ao completar Sprint.');
      throw err;
    }
  };

  // Funções para gerenciar Histórias de Usuário
  const createUserStory = async (story: Omit<UserStory, 'id' | 'createdAt' | 'taskIds'>, columnId?: string) => {
    try {
      // Garantir que temos os valores padrão necessários
      const storyData = {
        ...story,
        acceptanceCriteria: story.acceptanceCriteria || [],
        position: story.position || 0,
        tags: story.tags || []
      };
      
      // Chamar o serviço para criar a história
      const newStory = await userStoryServices.create(storyData);
      
      if (!newStory) {
        throw new Error('Falha ao criar história de usuário. Resposta vazia do servidor.');
      }
      
      // Atualizar o estado local
      setUserStories(prev => [newStory, ...prev]);
      
      // Atualizar o quadro Scrum para adicionar a história na coluna apropriada
      if (scrumBoards.length > 0) {
        const board = scrumBoards[0]; // Usar o primeiro quadro disponível
        const statusToColumn: Record<string, string> = {
          'backlog': 'productBacklog',
          'selected': 'sprintBacklog',
          'inProgress': 'inProgress',
          'testing': 'testing',
          'done': 'done'
        };
        
        // Determinar a coluna com base no status da história ou columnId fornecido
        const targetColumn = columnId || statusToColumn[newStory.status] || 'productBacklog';
        
        // Criar uma cópia profunda do quadro
        const updatedBoard = {
          ...board,
          columns: {
            ...board.columns
          }
        };
        
        // Adicionar o ID da história à coluna apropriada
        if (!updatedBoard.columns[targetColumn]) {
          updatedBoard.columns[targetColumn] = [];
        }
        
        updatedBoard.columns[targetColumn] = [
          newStory.id,
          ...updatedBoard.columns[targetColumn]
        ];
        
        // Atualizar o estado local dos quadros
        setScrumBoards(prev => 
          prev.map(b => b.id === board.id ? updatedBoard : b)
        );
        
        // Atualizar o quadro no Supabase
        await boardServices.update(updatedBoard);
      }
      
      // Atualizar métricas se a história pertencer ao sprint ativo
      if (newStory.sprintId && activeSprint?.id === newStory.sprintId) {
        await updateBurndownData(newStory.sprintId);
      }
      
      return newStory;
    } catch (err) {
      console.error('Erro ao criar História de Usuário:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Falha ao criar História de Usuário.';
      
      setError(errorMessage);
      throw err;
    }
  };
  
  const updateUserStory = async (story: UserStory) => {
    try {
      await userStoryServices.update(story);
      setUserStories(prev => prev.map(s => s.id === story.id ? story : s));
      
      // Atualizar métricas se a história pertencer ao sprint ativo
      if (story.sprintId && activeSprint?.id === story.sprintId) {
        // Calcular métricas atualizadas
        const sprintStories = userStories.filter(s => s.sprintId === story.sprintId);
        const completedStories = sprintStories.filter(s => s.status === 'done').length;
        const totalStories = sprintStories.length;
        const completedPoints = sprintStories
          .filter(s => s.status === 'done')
          .reduce((sum, s) => sum + (s.storyPoints || 0), 0);
        const totalPoints = sprintStories
          .reduce((sum, s) => sum + (s.storyPoints || 0), 0);
        
        // Atualizar métricas localmente
        const updatedMetrics = {
          ...metrics[story.sprintId],
          completedStories,
          totalStories,
          completedPoints,
          totalPoints
        };
        
        setMetrics(prev => ({ 
          ...prev, 
          [story.sprintId]: updatedMetrics 
        }));
        
        // Atualizar no Supabase
        await metricsServices.updateMetrics(story.sprintId, updatedMetrics);
      }
    } catch (err) {
      console.error('Erro ao atualizar História de Usuário:', err);
      setError('Falha ao atualizar História de Usuário.');
      throw err;
    }
  };
  
  const deleteUserStory = async (id: string) => {
    try {
      const storyToDelete = userStories.find(s => s.id === id);
      await userStoryServices.delete(id);
      setUserStories(prev => prev.filter(s => s.id !== id));
      
      // Atualizar métricas se a história pertencer ao sprint ativo
      if (storyToDelete?.sprintId && activeSprint?.id === storyToDelete.sprintId) {
        const sprintId = storyToDelete.sprintId;
        
        // Calcular métricas atualizadas
        const sprintStories = userStories.filter(s => s.id !== id && s.sprintId === sprintId);
        const completedStories = sprintStories.filter(s => s.status === 'done').length;
        const totalStories = sprintStories.length;
        const completedPoints = sprintStories
          .filter(s => s.status === 'done')
          .reduce((sum, s) => sum + (s.storyPoints || 0), 0);
        const totalPoints = sprintStories
          .reduce((sum, s) => sum + (s.storyPoints || 0), 0);
        
        // Atualizar métricas localmente
        setMetrics(prev => ({ 
          ...prev, 
          [sprintId]: {
            ...prev[sprintId],
            completedStories,
            totalStories,
            completedPoints,
            totalPoints
          }
        }));
        
        // Atualizar no Supabase
        await metricsServices.updateMetrics(sprintId, {
          completedStories,
          totalStories,
          completedPoints,
          totalPoints
        });
      }
    } catch (err) {
      console.error('Erro ao excluir História de Usuário:', err);
      setError('Falha ao excluir História de Usuário.');
      throw err;
    }
  };
  
  const assignStoryToSprint = async (storyId: string, sprintId: string | undefined) => {
    try {
      // Primeiro atualize no Supabase
      await userStoryServices.assignToSprint(storyId, sprintId || null);
      
      // Em seguida, atualize o estado local
      setUserStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { ...story, sprintId: sprintId } 
            : story
        )
      );
    } catch (err) {
      console.error('Erro ao atribuir história ao sprint:', err);
      setError('Falha ao atribuir história ao sprint.');
      throw err;
    }
  };
  
  const moveUserStory = async (storyId: string, sourceColumn: string, targetColumn: string, targetIndex?: number) => {
    try {
      // Traduzir nomes das colunas do quadro Scrum para status das histórias
      const columnToStatus: Record<string, string> = {
        'productBacklog': 'backlog',
        'sprintBacklog': 'selected',
        'inProgress': 'inProgress',
        'testing': 'testing',
        'done': 'done'
      };
      
      // Obter o status correspondente
      let targetStatus = columnToStatus[targetColumn] || targetColumn;
      
      // Validar o status
      const validStatuses = ['backlog', 'selected', 'inProgress', 'testing', 'done'];
      if (!validStatuses.includes(targetStatus)) {
        console.warn(`Status inválido: "${targetStatus}". Usando valor padrão "backlog".`);
        targetStatus = 'backlog';
      }
      
      // Mover a história no Supabase
      await userStoryServices.moveStory(storyId, targetStatus, targetIndex);
      
      // Atualizar o estado local
      setUserStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { 
                ...story, 
                status: targetStatus as 'backlog' | 'selected' | 'inProgress' | 'testing' | 'done',
                position: targetIndex !== undefined ? targetIndex : story.position,
                completedAt: targetStatus === 'done' ? new Date() : story.completedAt
              } 
            : story
        )
      );
      
      // Atualizar o quadro Scrum também
      const updatedBoards = scrumBoards.map(board => {
        // Crie uma cópia profunda das colunas
        const updatedColumns = JSON.parse(JSON.stringify(board.columns));
        
        // Remova a história da coluna de origem
        if (updatedColumns[sourceColumn]?.includes(storyId)) {
          updatedColumns[sourceColumn] = updatedColumns[sourceColumn].filter((id: string) => id !== storyId);
        }
        
        // Adicione a história na coluna de destino
        if (!updatedColumns[targetColumn]) {
          updatedColumns[targetColumn] = [];
        }
        
        // Se temos um índice específico, insira nessa posição
        if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= updatedColumns[targetColumn].length) {
          updatedColumns[targetColumn].splice(targetIndex, 0, storyId);
        } else {
          // Caso contrário, adicione ao final
          updatedColumns[targetColumn].push(storyId);
        }
        
        return {
          ...board,
          columns: updatedColumns
        };
      });
      
      // Atualizar o estado local dos quadros
      setScrumBoards(updatedBoards);
      
      // Atualizar o primeiro quadro no Supabase (assumindo que só há um quadro ativo)
      if (updatedBoards.length > 0) {
        await boardServices.update(updatedBoards[0]);
      }
      
      // Se a história foi movida para "done", atualizar as métricas
      if (targetStatus === 'done' && activeSprint) {
        await updateBurndownData(activeSprint.id);
      }
    } catch (err) {
      console.error('Erro ao mover história:', err);
      setError('Falha ao mover história.');
      throw err;
    }
  };

  // Funções para gerenciar Quadros Scrum
  const createScrumBoard = async (name: string, projectId?: string) => {
    try {
      const newBoard = await boardServices.create(name, projectId);
      setScrumBoards(prev => [newBoard, ...prev]);
      return newBoard;
    } catch (err) {
      console.error('Erro ao criar Quadro Scrum:', err);
      setError('Falha ao criar Quadro Scrum.');
      throw err;
    }
  };
  
  const updateScrumBoard = async (board: ScrumBoard) => {
    try {
      await boardServices.update(board);
      setScrumBoards(prev => prev.map(b => b.id === board.id ? board : b));
    } catch (err) {
      console.error('Erro ao atualizar Quadro Scrum:', err);
      setError('Falha ao atualizar Quadro Scrum.');
      throw err;
    }
  };
  
  const deleteScrumBoard = async (id: string) => {
    try {
      await boardServices.delete(id);
      setScrumBoards(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Erro ao excluir Quadro Scrum:', err);
      setError('Falha ao excluir Quadro Scrum.');
      throw err;
    }
  };

  // Funções para gerenciar tarefas associadas às histórias
  const assignTaskToStory = async (taskId: string, storyId: string) => {
    try {
      await userStoryServices.assignTask(storyId, taskId);
      setUserStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { ...story, taskIds: [...(story.taskIds || []), taskId] } 
            : story
        )
      );
    } catch (err) {
      console.error('Erro ao associar Tarefa à História:', err);
      setError('Falha ao associar Tarefa à História.');
      throw err;
    }
  };
  
  const removeTaskFromStory = async (taskId: string, storyId: string) => {
    try {
      await userStoryServices.removeTask(storyId, taskId);
      setUserStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { ...story, taskIds: (story.taskIds || []).filter(id => id !== taskId) } 
            : story
        )
      );
    } catch (err) {
      console.error('Erro ao remover Tarefa da História:', err);
      setError('Falha ao remover Tarefa da História.');
      throw err;
    }
  };

  // Funções para gerenciar métricas
  const updateSprintMetrics = async (sprintId: string, metricsData: Partial<ScrumMetrics>) => {
    try {
      await metricsServices.updateMetrics(sprintId, metricsData);
      setMetrics(prev => ({ 
        ...prev, 
        [sprintId]: { ...(prev[sprintId] || {}), ...metricsData } as ScrumMetrics 
      }));
    } catch (err) {
      console.error('Erro ao atualizar Métricas do Sprint:', err);
      setError('Falha ao atualizar Métricas.');
      throw err;
    }
  };
  
  const updateBurndownChart = async (sprintId: string, burndownData: BurndownData[]) => {
    try {
      await metricsServices.updateBurndownData(sprintId, burndownData);
      setMetrics(prev => ({ 
        ...prev, 
        [sprintId]: { ...(prev[sprintId] || {}), burndown: burndownData } as ScrumMetrics 
      }));
    } catch (err) {
      console.error('Erro ao atualizar Gráfico Burndown:', err);
      setError('Falha ao atualizar Gráfico Burndown.');
      throw err;
    }
  };

  // Métricas e Estatísticas
  const getBurndownData = useCallback((sprintId: string): BurndownData[] => {
    return metrics[sprintId]?.burndown || [];
  }, [metrics]);

  const updateBurndownData = async (sprintId: string) => {
    if (!sprintId) return;
    
    try {
      // Obter o sprint
      const sprint = sprints.find(s => s.id === sprintId);
      if (!sprint) throw new Error('Sprint não encontrado');
      
      // Obter histórias de usuário deste sprint
      const sprintStories = userStories.filter(story => story.sprintId === sprintId);
      
      // Calcular pontos restantes e concluídos
      const totalPoints = sprintStories.reduce((sum, story) => sum + (story.storyPoints || 0), 0);
      const completedPoints = sprintStories
        .filter(story => story.status === 'done')
        .reduce((sum, story) => sum + (story.storyPoints || 0), 0);
      
      const remainingPoints = totalPoints - completedPoints;
      
      // Calcular dados para o gráfico burndown
      const today = new Date();
      const burndownData: BurndownData[] = [];
      
      // Se temos métricas existentes, use-as como base
      const existingBurndown = metrics[sprintId]?.burndown || [];
      
      // Adicionar ponto para hoje
      const todayEntry: BurndownData = {
        date: today,
        plannedPoints: totalPoints,
        remainingPoints: remainingPoints,
        completedPoints: completedPoints
      };
      
      // Verificar se já existe um ponto para hoje e atualizá-lo, ou adicionar um novo
      const existingTodayIndex = existingBurndown.findIndex(entry => 
        new Date(entry.date).toDateString() === today.toDateString()
      );
      
      if (existingTodayIndex >= 0) {
        existingBurndown[existingTodayIndex] = todayEntry;
      } else {
        existingBurndown.push(todayEntry);
      }
      
      // Atualizar as métricas no Supabase
      const metricsUpdate: Partial<ScrumMetrics> = {
        burndown: existingBurndown,
        completedPoints,
        totalPoints,
        completedStories: sprintStories.filter(story => story.status === 'done').length,
        totalStories: sprintStories.length,
        velocity: completedPoints // Simplificado - na realidade deveria ser calculado com base em sprints anteriores
      };
      
      const updatedMetrics = await metricsServices.updateMetrics(sprintId, metricsUpdate);
      
      // Atualizar o estado local
      setMetrics(prev => ({
        ...prev,
        [sprintId]: updatedMetrics
      }));
      
      return updatedMetrics;
    } catch (err) {
      console.error('Erro ao atualizar dados do burndown:', err);
      setError('Falha ao atualizar dados do burndown.');
      throw err;
    }
  };

  const calculateVelocity = useCallback(async (sprintCount: number = 3): Promise<number> => {
    if (!user) return 0;
    
    try {
      return metricsServices.calculateVelocity(user.id, sprintCount);
    } catch (err) {
      console.error('Erro ao calcular velocidade:', err);
      return 0;
    }
  }, [user]);

  // Função para definir o sprint ativo
  const setActiveSprintState = (sprint: Sprint | null) => {
    setActiveSprint(sprint);
    
    // Salvar o ID do sprint ativo no localStorage para persistência
    if (sprint) {
      localStorage.setItem('activeSprintId', sprint.id);
    } else {
      localStorage.removeItem('activeSprintId');
    }
  };

  // Valor do Context
  const contextValue: ScrumContextType = {
    // Dados
    sprints,
    userStories,
    scrumBoards,
    scrumMetrics: metrics,
    activeSprint,
    
    // Funções para Sprints
    createSprint,
    updateSprint,
    deleteSprint,
    startSprint,
    completeSprint,
    setActiveSprint: setActiveSprintState,
    
    // Funções para Histórias de Usuário
    createUserStory,
    updateUserStory,
    deleteUserStory,
    assignTaskToStory,
    removeTaskFromStory,
    
    // Funções para o Quadro Scrum
    createScrumBoard,
    updateScrumBoard,
    deleteScrumBoard,
    moveUserStory,
    
    // Métricas e estatísticas
    getBurndownData,
    updateBurndownData,
    calculateVelocity,
    
    // UI state para drag and drop
    setActiveDroppableId,
    
    // Configurações de UI
    soundsEnabled,
    toggleSounds
  };

  return (
    <ScrumContext.Provider value={contextValue}>
      {children}
    </ScrumContext.Provider>
  );
};

export const useScrumContext = () => {
  const context = useContext(ScrumContext);
  if (context === undefined) {
    throw new Error('useScrumContext deve ser usado dentro de um ScrumProvider');
  }
  return context;
}; 