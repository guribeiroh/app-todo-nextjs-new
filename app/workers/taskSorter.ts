// Worker para processar tarefas e aplicar filtros sem bloquear a thread principal
import { Task, TaskFilter } from '../types';

// Interface para mensagens enviadas ao worker
interface WorkerMessage {
  tasks: Task[];
  filter: TaskFilter;
  action: 'filter' | 'sort';
}

// Função para filtrar tarefas
function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  return tasks.filter(task => {
    // Filtrar por status de conclusão
    if (filter.status === 'pendentes' && task.completed) {
      return false;
    }
    if (filter.status === 'concluídas' && !task.completed) {
      return false;
    }

    // Filtrar por prioridade
    if (filter.priority !== 'todas' && task.priority !== filter.priority) {
      return false;
    }

    // Filtrar por lista
    if (filter.listId && filter.listId !== 'todas' && task.listId !== filter.listId) {
      return false;
    }

    // Filtrar por termo de busca
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(searchLower);
      const descMatch = task.description?.toLowerCase().includes(searchLower) || false;
      const tagMatch = task.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false;
      
      if (!titleMatch && !descMatch && !tagMatch) {
        return false;
      }
    }

    return true;
  });
}

// Função para ordenar tarefas
function sortTasks(tasks: Task[], filter: TaskFilter): Task[] {
  return [...tasks].sort((a, b) => {
    // Se a ordenação primária é por conclusão
    if (filter.sortBy === 'completed') {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
    }
    
    // Ordenação por prioridade
    if (filter.sortBy === 'priority' || filter.sortBy === 'completed') {
      const priorityValues = { alta: 0, média: 1, baixa: 2 };
      const priorityDiff = priorityValues[a.priority] - priorityValues[b.priority];
      
      if (priorityDiff !== 0) {
        return priorityDiff * (filter.sortDirection === 'asc' ? 1 : -1);
      }
    }
    
    // Ordenação por data de criação
    if (filter.sortBy === 'createdAt' || !filter.sortBy) {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return (dateA - dateB) * (filter.sortDirection === 'asc' ? 1 : -1);
    }
    
    // Ordenação por data de vencimento
    if (filter.sortBy === 'dueDate') {
      // Coloca tarefas sem data de vencimento por último
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return (dateA - dateB) * (filter.sortDirection === 'asc' ? 1 : -1);
    }
    
    // Ordenação por título
    if (filter.sortBy === 'title') {
      return a.title.localeCompare(b.title) * (filter.sortDirection === 'asc' ? 1 : -1);
    }
    
    return 0;
  });
}

// Processar mensagem recebida pelo worker
self.addEventListener('message', (e: MessageEvent<WorkerMessage>) => {
  const { tasks, filter, action } = e.data;
  
  try {
    let result: Task[];
    
    if (action === 'filter') {
      result = filterTasks(tasks, filter);
    } else if (action === 'sort') {
      result = sortTasks(tasks, filter);
    } else {
      // Aplicar ambos se nenhuma ação específica
      result = sortTasks(filterTasks(tasks, filter), filter);
    }
    
    self.postMessage({ success: true, tasks: result });
  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
});

// Exportação vazia necessária para TypeScript
export {}; 