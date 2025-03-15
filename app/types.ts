export interface User {
  id: string;
  email: string;
  avatar_url?: string;
  display_name?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: Date; 
  priority: string;
  listId?: string;   // Lista para agrupar/categorizar tarefas
  columnId?: string; // Coluna do Kanban (estágio do fluxo de trabalho)
  tags?: string[];
  reminder?: Date;
  subtasks: Subtask[];
  position: number;
  createdAt: Date;
  updatedAt?: Date;
  userId?: string;
  lastSynced?: Date;
  color?: string;
  storyPoints?: number; // Pontos de história para tarefas SCRUM
  sprintId?: string;    // Sprint ao qual a tarefa pertence
  userStoryId?: string; // História de usuário relacionada
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface ColumnMap {
  [key: string]: Column;
}

export interface TaskData {
  tasks: Task[];
  columns: ColumnMap;
  columnOrder: string[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  parent_id: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface TaskFilter {
  status: 'todas' | 'pendentes' | 'concluídas';
  priority: 'todas' | 'baixa' | 'média' | 'alta';
  listId: string;
  searchTerm: string;
  tags: string[];
  sortBy?: 'dueDate' | 'priority' | 'completed' | 'title' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  dueDateRange?: {
    start?: Date;
    end?: Date;
  };
}

// Definição para as colunas do quadro Kanban (estágios do fluxo de trabalho)
export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: Date;
}

// Interfaces para SCRUM

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  status: 'planning' | 'active' | 'review' | 'completed';
  projectId?: string;
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[]; // Critérios de aceitação como array
  storyPoints: number;
  priority: 'must' | 'should' | 'could' | 'wont'; // MoSCoW priorização
  status: 'backlog' | 'selected' | 'inProgress' | 'testing' | 'done';
  sprintId?: string;
  position: number; // Posição na lista de histórias
  taskIds: string[]; // IDs das tarefas relacionadas
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  epic?: string; // Épico ao qual esta história pertence
  tags?: string[]; // Tags para categorização adicional
}

export interface ScrumBoard {
  id: string;
  name: string;
  columns: {
    productBacklog: string[];
    sprintBacklog: string[];
    inProgress: string[];
    testing: string[];
    done: string[];
    [key: string]: string[]; // Permite colunas personalizadas
  };
  currentSprintId?: string;
  projectId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface BurndownData {
  date: Date;
  plannedPoints: number;
  remainingPoints: number;
  completedPoints: number;
}

export interface ScrumMetrics {
  sprintId: string;
  burndown: BurndownData[];
  velocity: number;
  completedStories: number;
  totalStories: number;
  completedPoints: number;
  totalPoints: number;
}

export interface ScrumRole {
  id: string;
  userId: string;
  role: 'productOwner' | 'scrumMaster' | 'teamMember';
  projectId: string;
} 