import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { FiPlus, FiFilter, FiX, FiCheckCircle, FiStar, FiList, FiSliders, FiSearch } from 'react-icons/fi';
import { useTaskFilter, useTaskData } from '../app/context/TaskContext';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import { Task, TaskFilter } from '../app/types';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface TaskListProps {
  initialFilters?: TaskFilter | null;
  onFiltersChange?: (filters: TaskFilter) => void;
}

// Componente de filtro separado para melhor organização e performance
const FilterOption = memo(({ 
  label, 
  active, 
  onClick, 
  icon 
}: { 
  label: string, 
  active: boolean, 
  onClick: () => void, 
  icon: React.ReactNode 
}) => (
  <button
    onClick={onClick}
    className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
      active ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 text-gray-300'
    }`}
    aria-pressed={active}
  >
    <span className="mr-2">{icon}</span>
    {label}
  </button>
));

FilterOption.displayName = 'FilterOption';

// Componente de cabeçalho de lista separado
const ListHeader = memo(({
  onAddTask,
  showFilter,
  toggleFilter,
  filterTitle,
  filterIcon
}: {
  onAddTask: () => void,
  showFilter: boolean,
  toggleFilter: () => void,
  filterTitle: string,
  filterIcon: React.ReactNode
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center">
      <h2 className="text-xl font-semibold text-white">Minhas Tarefas</h2>
      <button
        onClick={toggleFilter}
        className="ml-4 flex items-center px-3 py-1 text-sm bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
        aria-expanded={showFilter}
        aria-label="Mostrar filtros"
      >
        {filterIcon}
        <span className="ml-2">{filterTitle}</span>
      </button>
    </div>
    <button
      onClick={onAddTask}
      className="flex items-center px-3 py-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors"
      aria-label="Adicionar nova tarefa"
    >
      <FiPlus className="mr-1" />
      <span>Nova Tarefa</span>
    </button>
  </div>
));

ListHeader.displayName = 'ListHeader';

const TaskList: React.FC<TaskListProps> = ({ initialFilters, onFiltersChange }) => {
  const { filter: contextFilter, setFilter, filteredTasks } = useTaskFilter();
  const { lists } = useTaskData();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
  // Use initialFilters do prop ou o filtro do contexto
  const [localFilter, setLocalFilter] = useState<TaskFilter>(initialFilters || contextFilter);
  const [searchTerm, setSearchTerm] = useState(localFilter.searchTerm || '');

  // Inicializa com filtros iniciais se fornecidos
  useEffect(() => {
    if (initialFilters) {
      setFilter(initialFilters);
      setSearchTerm(initialFilters.searchTerm || '');
    }
  }, [initialFilters, setFilter]);

  const handleAddTask = useCallback(() => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  }, []);

  const handleCloseTaskForm = useCallback(() => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  }, []);

  // Modificar o handleFilterChange para notificar mudanças via prop
  const handleFilterChange = useCallback((key: keyof TaskFilter, value: any) => {
    const newFilter = { ...localFilter, [key]: value };
    setLocalFilter(newFilter);
    setFilter(newFilter);
    
    if (onFiltersChange) {
      onFiltersChange(newFilter);
    }
  }, [localFilter, setFilter, onFiltersChange]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange('searchTerm', searchTerm);
  }, [searchTerm, handleFilterChange]);

  const clearFilters = useCallback(() => {
    const defaultFilter: TaskFilter = {
      status: 'todas',
      priority: null,
      listId: null,
      searchTerm: '',
      tags: [],
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };
    
    setSearchTerm('');
    setLocalFilter(defaultFilter);
    setFilter(defaultFilter);
    
    if (onFiltersChange) {
      onFiltersChange(defaultFilter);
    }
  }, [setFilter, onFiltersChange]);

  const toggleFilterOptions = useCallback(() => {
    setShowFilterOptions(prev => !prev);
  }, []);

  // Memoizar computações para evitar recálculos desnecessários
  const getFilterTitle = useMemo(() => {
    if (localFilter.status === 'concluídas') {
      return "Concluídas";
    } else if (localFilter.status === 'pendentes') {
      return "Pendentes";
    } else if (localFilter.priority) {
      return `Prioridade ${localFilter.priority}`;
    } else if (localFilter.listId && localFilter.listId !== 'all') {
      const list = lists.find(l => l.id === localFilter.listId);
      return list ? list.name : "Lista personalizada";
    } else if (localFilter.searchTerm) {
      return `Busca: ${localFilter.searchTerm}`;
    } else {
      return "Todas as tarefas";
    }
  }, [localFilter, lists]);

  const getFilterIcon = useMemo(() => {
    if (localFilter.status === 'concluídas') {
      return <FiCheckCircle />;
    } else if (localFilter.status === 'pendentes') {
      return <FiList />;
    } else if (localFilter.priority) {
      return <FiStar />;
    } else if (localFilter.searchTerm) {
      return <FiSearch />;
    } else {
      return <FiFilter />;
    }
  }, [localFilter]);

  // Renderizar item da lista virtualizada
  const renderTask = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
    const task = filteredTasks[index];
    return (
      <div style={style} key={task.id}>
        <TaskItem task={task} onEdit={handleEditTask} />
      </div>
    );
  }, [filteredTasks, handleEditTask]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3">
        <ListHeader 
          onAddTask={handleAddTask}
          showFilter={showFilterOptions}
          toggleFilter={toggleFilterOptions}
          filterTitle={getFilterTitle}
          filterIcon={getFilterIcon}
        />
        
        <AnimatePresence>
          {showFilterOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="flex flex-wrap gap-2 mb-4">
                  <FilterOption 
                    label="Todas" 
                    active={localFilter.status === 'todas'} 
                    onClick={() => handleFilterChange('status', 'todas')}
                    icon={<FiList />}
                  />
                  <FilterOption 
                    label="Pendentes" 
                    active={localFilter.status === 'pendentes'} 
                    onClick={() => handleFilterChange('status', 'pendentes')}
                    icon={<FiList />}
                  />
                  <FilterOption 
                    label="Concluídas" 
                    active={localFilter.status === 'concluídas'} 
                    onClick={() => handleFilterChange('status', 'concluídas')}
                    icon={<FiCheckCircle />}
                  />
                </div>

                <form onSubmit={handleSearch} className="mb-4 flex">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar tarefas..."
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    aria-label="Buscar tarefas"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-indigo-600 rounded-r-md hover:bg-indigo-500"
                    aria-label="Iniciar busca"
                  >
                    <FiSearch />
                  </button>
                </form>

                <div className="flex justify-between">
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={localFilter.priority || ''}
                      onChange={(e) => handleFilterChange('priority', e.target.value || null)}
                      className="px-3 py-2 bg-gray-700 rounded-md"
                      aria-label="Filtrar por prioridade"
                    >
                      <option value="">Todas as prioridades</option>
                      <option value="baixa">Baixa</option>
                      <option value="média">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                    
                    <select
                      value={localFilter.listId || ''}
                      onChange={(e) => handleFilterChange('listId', e.target.value || null)}
                      className="px-3 py-2 bg-gray-700 rounded-md"
                      aria-label="Filtrar por lista"
                    >
                      <option value="">Todas as listas</option>
                      {lists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={clearFilters}
                    className="flex items-center px-3 py-2 text-sm text-white bg-gray-700 rounded-md hover:bg-gray-600"
                    aria-label="Limpar todos os filtros"
                  >
                    <FiX className="mr-1" />
                    Limpar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-hidden px-4">
        {filteredTasks.length > 0 ? (
          <div className="h-full w-full">
            <AutoSizer>
              {({ height, width }) => (
                <List
                  height={height}
                  width={width}
                  itemCount={filteredTasks.length}
                  itemSize={100} // Ajuste de acordo com o tamanho médio do seu item
                  overscanCount={5}
                >
                  {renderTask}
                </List>
              )}
            </AutoSizer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FiList className="text-4xl mb-2" />
            <p>Nenhuma tarefa encontrada</p>
            <button
              onClick={handleAddTask}
              className="mt-4 px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-500"
            >
              Adicionar Tarefa
            </button>
          </div>
        )}
      </div>

      {/* Formulário de tarefa */}
      <AnimatePresence>
        {isTaskFormOpen && (
          <TaskForm
            isOpen={isTaskFormOpen}
            onClose={handleCloseTaskForm}
            editingTask={editingTask}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(TaskList); 