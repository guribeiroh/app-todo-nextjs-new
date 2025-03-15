import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { TaskItem } from './TaskItem';
import { useTaskContext } from '../context/TaskContext';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { FixedSizeList as List } from 'react-window';
import { FiFilter, FiChevronDown, FiChevronUp, FiCalendar, FiFlag, FiClock, FiCheck, FiList, FiGrid, FiAlertCircle, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Interface para os filtros e ordenação do TaskList
interface TaskListFilter {
  priority: string;
  tags?: string[];
  searchTerm?: string;
  groupBy?: 'priority' | 'status' | 'date' | 'none';
  sortBy?: 'date' | 'priority' | 'alphabetical' | 'created';
  sortOrder?: 'asc' | 'desc';
}

// Props para o componente TaskList
interface TaskListProps {
  initialFilters?: TaskListFilter | null;
  onFiltersChange?: (filters: TaskListFilter) => void;
}

// Hook personalizado para obter o tamanho da janela
const useWindowDimensions = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

export const TaskList: React.FC<TaskListProps> = ({ initialFilters, onFiltersChange }) => {
  const { filteredTasks, reorderTasks, lists } = useTaskContext();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<List>(null);
  
  // Estados para filtros e ordenação
  const [filterPriority, setFilterPriority] = useState<string>(initialFilters?.priority || 'todas');
  const [searchTerm, setSearchTerm] = useState<string>(initialFilters?.searchTerm || '');
  const [groupBy, setGroupBy] = useState<'priority' | 'status' | 'date' | 'none'>(initialFilters?.groupBy || 'none');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'alphabetical' | 'created'>(initialFilters?.sortBy || 'created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialFilters?.sortOrder || 'asc');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Aplicar filtros e ordenação às tarefas
  const processedTasks = useMemo(() => {
    // Primeiro aplicamos os filtros
    let result = [...filteredTasks];
    
    // Filtrar por prioridade se não for "todas"
    if (filterPriority !== 'todas') {
      result = result.filter(task => task.priority === filterPriority);
    }
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(search) || 
        (task.description && task.description.toLowerCase().includes(search)) ||
        task.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    // Ordenar tarefas
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          // Tarefas sem data vão para o final
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        
        case 'priority':
          const priorityOrder = { 'alta': 0, 'média': 1, 'baixa': 2 };
          comparison = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
          break;
          
        case 'alphabetical':
          comparison = a.title.localeCompare(b.title);
          break;
          
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      // Inverter a ordem se for descendente
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return result;
  }, [filteredTasks, filterPriority, searchTerm, sortBy, sortOrder]);

  // Agrupar tarefas se necessário
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'Todas as tarefas': processedTasks };
    }
    
    const groups: Record<string, typeof processedTasks> = {};
    
    switch (groupBy) {
      case 'priority':
        groups['Alta prioridade'] = processedTasks.filter(task => task.priority === 'alta');
        groups['Média prioridade'] = processedTasks.filter(task => task.priority === 'média');
        groups['Baixa prioridade'] = processedTasks.filter(task => task.priority === 'baixa');
        groups['Sem prioridade'] = processedTasks.filter(task => !task.priority);
        break;
        
      case 'status':
        groups['Pendentes'] = processedTasks.filter(task => !task.completed);
        groups['Concluídas'] = processedTasks.filter(task => task.completed);
        break;
        
      case 'date':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        groups['Atrasadas'] = processedTasks.filter(task => {
          if (!task.dueDate || task.completed) return false;
          return new Date(task.dueDate) < today;
        });
        
        groups['Para hoje'] = processedTasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
        
        groups['Para amanhã'] = processedTasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === tomorrow.getTime();
        });
        
        groups['Esta semana'] = processedTasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate > tomorrow && dueDate <= nextWeek;
        });
        
        groups['Futuro'] = processedTasks.filter(task => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) > nextWeek;
        });
        
        groups['Sem data'] = processedTasks.filter(task => !task.dueDate);
        break;
    }
    
    // Remover grupos vazios
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });
    
    return groups;
  }, [processedTasks, groupBy]);
  
  // Inicializar estado de expansão de grupos
  useEffect(() => {
    const newExpandedGroups: Record<string, boolean> = {};
    Object.keys(groupedTasks).forEach(key => {
      newExpandedGroups[key] = true; // Expandir por padrão
    });
    setExpandedGroups(newExpandedGroups);
  }, [groupBy]);

  // Notificar o componente pai sobre mudanças nos filtros
  const updateFilters = useCallback(() => {
    if (onFiltersChange) {
      onFiltersChange({
        priority: filterPriority,
        searchTerm: searchTerm,
        groupBy: groupBy,
        sortBy: sortBy,
        sortOrder: sortOrder,
        tags: [] // Adicionar suporte a tags no futuro
      });
    }
  }, [filterPriority, searchTerm, groupBy, sortBy, sortOrder, onFiltersChange]);

  // Atualizar filtros quando mudarem
  useEffect(() => {
    updateFilters();
  }, [filterPriority, searchTerm, groupBy, sortBy, sortOrder, updateFilters]);

  // Alternar a expansão de um grupo
  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  }, []);

  // Recalcular tamanhos quando a lista muda
  useEffect(() => {
    if (listRef.current) {
      // Forçar recálculo da lista
      listRef.current.scrollToItem(0);
    }
  }, [processedTasks.length]);

  const handleDragEnd = useCallback((result: DropResult) => {
    // Se não houver destino válido, não fazer nada
    if (!result.destination) return;

    // Se a posição não mudou, não fazer nada
    if (result.destination.index === result.source.index) return;

    setIsAnimating(true);
    
    // Reordenar as tarefas
    reorderTasks(result.source.index, result.destination.index);
    
    // Resetar o estado de animação após um breve período
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [reorderTasks]);

  // Obter o ícone para o botão de ordenação
  const getSortIcon = useCallback(() => {
    switch (sortBy) {
      case 'date':
        return <FiCalendar />;
      case 'priority':
        return <FiFlag />;
      case 'created':
        return <FiClock />;
      case 'alphabetical':
        return <FiList />;
      default:
        return <FiList />;
    }
  }, [sortBy]);

  // Se não houver tarefas, mostrar mensagem
  if (processedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-4xl mb-4 opacity-30">📋</div>
        <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
          Nenhuma tarefa encontrada
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Adicione novas tarefas ou ajuste seus filtros para visualizar tarefas existentes.
        </p>
        {(filterPriority !== 'todas' || searchTerm) && (
          <button
            onClick={() => {
              setFilterPriority('todas');
              setSearchTerm('');
            }}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Barra de ferramentas e filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center">
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors"
            >
              <FiFilter className="mr-1" />
              <span>Filtros</span>
              {filtersVisible ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            
            <div className="flex items-center ml-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                {processedTasks.length} {processedTasks.length === 1 ? 'tarefa' : 'tarefas'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-8 pr-8 py-1.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-md text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="created">Data de criação</option>
                <option value="date">Data de vencimento</option>
                <option value="priority">Prioridade</option>
                <option value="alphabetical">Alfabética</option>
              </select>
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                {getSortIcon()}
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            
            <div className="relative">
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="appearance-none px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-md text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="none">Sem agrupamento</option>
                <option value="status">Por status</option>
                <option value="priority">Por prioridade</option>
                <option value="date">Por data</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                <FiChevronDown />
              </div>
            </div>
          </div>
        </div>
        
        {/* Painel de filtros expansível */}
        <AnimatePresence>
          {filtersVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Prioridade</label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="appearance-none px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-md text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="todas">Todas</option>
                      <option value="alta">Alta</option>
                      <option value="média">Média</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col flex-grow">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Buscar</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar tarefas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-md text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-red-500"
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Lista de tarefas */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          {Object.entries(groupedTasks).map(([groupName, tasks]) => (
            <div key={groupName} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              {/* Cabeçalho do grupo */}
              <div 
                className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                onClick={() => toggleGroup(groupName)}
              >
                <div className="flex items-center">
                  {groupBy === 'priority' && (
                    <span 
                      className={`w-3 h-3 rounded-full mr-2 ${
                        groupName.includes('Alta') ? 'bg-red-500' : 
                        groupName.includes('Média') ? 'bg-yellow-500' : 
                        groupName.includes('Baixa') ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    />
                  )}
                  
                  {groupBy === 'status' && (
                    <span className="mr-2">
                      {groupName === 'Concluídas' ? 
                        <FiCheck className="text-green-500" /> : 
                        <FiAlertCircle className="text-blue-500" />
                      }
                    </span>
                  )}
                  
                  {groupBy === 'date' && (
                    <span className="mr-2">
                      {groupName === 'Atrasadas' ? 
                        <FiAlertCircle className="text-red-500" /> : 
                        <FiCalendar className={
                          groupName === 'Para hoje' ? 'text-orange-500' :
                          groupName === 'Para amanhã' ? 'text-yellow-500' :
                          groupName === 'Esta semana' ? 'text-blue-500' :
                          'text-gray-500'
                        } />
                      }
                    </span>
                  )}
                  
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">
                    {groupName} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({tasks.length})</span>
                  </h3>
                </div>
                
                <div className="flex items-center">
                  {expandedGroups[groupName] ? 
                    <FiChevronUp className="text-gray-500 dark:text-gray-400" /> : 
                    <FiChevronDown className="text-gray-500 dark:text-gray-400" />
                  }
                </div>
              </div>
              
              {/* Conteúdo do grupo */}
              <AnimatePresence>
                {expandedGroups[groupName] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Droppable droppableId={`group-${groupName}`}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`space-y-3 p-3 transition-colors ${
                            snapshot.isDraggingOver 
                              ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                              : ''
                          }`}
                        >
                          {tasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`transition-all duration-200 ${
                                    snapshot.isDragging 
                                      ? 'scale-102 shadow-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 rounded-lg z-10' 
                                      : isAnimating ? 'animate-pulse' : ''
                                  }`}
                                >
                                  <TaskItem task={task} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}; 