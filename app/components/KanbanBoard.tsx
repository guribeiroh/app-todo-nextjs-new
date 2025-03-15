import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Task } from '../types';
import { useTaskContext } from '../context/TaskContext';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay, 
  DragEndEvent, 
  DragStartEvent, 
  useDndMonitor,
  DragOverEvent,
  DragCancelEvent,
  MeasuringStrategy,
  DropAnimation,
  defaultDropAnimationSideEffects,
  CollisionDetection,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  UniqueIdentifier
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import { FiPlus, FiSettings, FiX, FiMoreHorizontal, FiFilter, FiSave, FiRefreshCw, FiSearch, FiLayout } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import SortableTaskCard from './SortableTaskCard';
import { useToast } from './Toast';
import { KanbanTemplate, KanbanTemplateSelector } from './KanbanTemplates';

// Interface para os filtros do Kanban
interface KanbanFilter {
  priority: string;
  tags?: string[];
  searchTerm?: string;
  listId?: string; // Adicionado filtro para listas
}

// Props para o componente KanbanBoard
interface KanbanBoardProps {
  initialFilters?: KanbanFilter | null;
  onFiltersChange?: (filters: KanbanFilter) => void;
}

// Novo hook para persistência local das colunas
const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log('Erro ao recuperar configuração do Kanban:', error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log('Erro ao salvar configuração do Kanban:', error);
    }
  };

  return [storedValue, setValue];
};

// Componente interno que usa o hook useDndMonitor
const KanbanBoardContent: React.FC<{
  onDragOverColumn: (columnId: string | null) => void;
  setActiveId: (id: string | null) => void;
}> = ({ onDragOverColumn, setActiveId }) => {
  useDndMonitor({
    onDragOver(event) {
      // Extrair ID da coluna do over.id
      const overId = event.over?.id.toString() || '';
      const columnId = overId.includes('-column-') 
        ? overId.split('-column-')[0] 
        : overId.includes('-task-') 
          ? overId.split('-task-')[0] 
          : overId;
      
      onDragOverColumn(columnId);
    },
    onDragEnd() {
      onDragOverColumn(null);
    },
    onDragCancel() {
      onDragOverColumn(null);
    }
  });

  return null; // Este componente não renderiza nada, apenas monitora eventos
};

// Configuração da animação de drop personalizada
const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ initialFilters, onFiltersChange }) => {
  const { tasks, lists, kanbanColumns, updateTask, addKanbanColumn, deleteKanbanColumn, addList } = useTaskContext();
  const { showToast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [currentColumn, setCurrentColumn] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<KanbanFilter>(initialFilters || { priority: 'all' });
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#6366F1');
  const [selectedListId, setSelectedListId] = useState<string | undefined>(undefined);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#6366F1');
  
  // Novo estado para armazenar configuração do usuário
  const [userBoardConfig, setUserBoardConfig] = useLocalStorage('kanban_board_config', {
    visibleColumns: [] as string[],
    columnOrder: [] as string[],
    lastUsedTemplate: '',
  });
  
  // Usar initialFilters se fornecido, caso contrário usar o padrão
  const [filterPriority, setFilterPriority] = useState<string>(
    initialFilters?.priority || 'todas'
  );
  const [searchTerm, setSearchTerm] = useState<string>(
    initialFilters?.searchTerm || ''
  );
  
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [currentTaskOrder, setCurrentTaskOrder] = useState<Record<string, string[]>>({});
  const [clonedTasks, setClonedTasks] = useState<Task[]>([]);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  
  // Verificar tamanho da tela ao montar e redimensionar
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  
  // Inicializa colunas visíveis com base na configuração salva
  useEffect(() => {
    if (userBoardConfig.visibleColumns.length > 0) {
      // Usar configuração salva se existir
      setVisibleColumns(userBoardConfig.visibleColumns);
    } else if (isSmallScreen) {
      // Configuração para telas pequenas
      setVisibleColumns(['pending']);
      setUserBoardConfig({
        ...userBoardConfig,
        visibleColumns: ['pending']
      });
    } else {
      // Configuração para telas grandes
      const uniqueColumns = ['pending', 'completed', ...lists.map(list => `list-${list.id}`)];
      setVisibleColumns(uniqueColumns);
      setUserBoardConfig({
        ...userBoardConfig,
        visibleColumns: uniqueColumns
      });
    }
  }, [isSmallScreen, lists, userBoardConfig.visibleColumns.length]);

  // Inicializa a ordem das tarefas com base nas tarefas atuais
  useEffect(() => {
    const newTaskOrder: Record<string, string[]> = {
      pending: pendingTasks.map(task => task.id),
      completed: completedTasks.map(task => task.id),
    };
    
    lists.forEach(list => {
      newTaskOrder[`list-${list.id}`] = tasksByList[list.id]?.map(task => task.id) || [];
    });
    
    setCurrentTaskOrder(newTaskOrder);
    setClonedTasks([...tasks]);
  }, [tasks, lists]);
  
  // Define sensores para diferentes tipos de interação
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduzido para tornar mais fácil iniciar o arrasto
        tolerance: 5, // Tolerância para pequenos movimentos
        delay: 120, // Pequeno atraso para evitar arrastar acidentalmente
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filtrar as tarefas com base nos filtros
  const filteredTasksList = useMemo(() => {
    return tasks.filter(task => {
      // Aplicar filtro de prioridade se não for "todas"
      if (filterPriority !== 'todas' && task.priority !== filterPriority) {
        return false;
      }
      
      // Aplicar filtro de busca se houver termo de pesquisa
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Aplicar filtro de lista se selecionada
      if (selectedListId && task.listId !== selectedListId) {
        return false;
      }
      
      return true;
    });
  }, [tasks, filterPriority, searchTerm, selectedListId]);
  
  // Separar as tarefas em diferentes categorias
  const pendingTasks = useMemo(() => {
    return filteredTasksList.filter(task => !task.completed && !task.listId);
  }, [filteredTasksList]);
  
  const completedTasks = useMemo(() => {
    return filteredTasksList.filter(task => task.completed);
  }, [filteredTasksList]);
  
  const tasksByList = useMemo(() => {
    const result: Record<string, Task[]> = {};
    
    lists.forEach(list => {
      result[list.id] = filteredTasksList.filter(
        task => !task.completed && task.listId === list.id
      );
    });
    
    return result;
  }, [filteredTasksList, lists]);
  
  // Encontrar tarefa ativa para overlay
  const taskForOverlay = activeId ? tasks.find(t => t.id === activeId) : null;
  
  // Detecção de colisão personalizada
  const customCollisionDetection: CollisionDetection = (args) => {
    // Primeiro tentamos encontrar uma colisão com pointerWithin
    const pointerCollisions = pointerWithin(args);
    
    // Se encontrarmos colisões com pointer, usamos elas
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    
    // Se não encontrarmos, usamos intersecção de retângulos
    const rectCollisions = rectIntersection(args);
    return rectCollisions;
  };

  // Manipulador para o início do arrasto
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };
  
  // Manipulador para quando o item está sendo arrastado sobre um alvo
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setDraggedOverColumn(null);
      return;
    }
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) {
      return;
    }
    
    // Extrair o ID da coluna do formato "{id}-column"
    const overColumnId = String(overId).replace('-column', '');
    
    // Indicar qual coluna está recebendo o arrasto
    setDraggedOverColumn(overColumnId);
  };

  // Manipulador para o final do arrasto
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) {
      return;
    }
    
    // Extrair o ID da coluna do formato "{id}-column"
    const overColumnId = String(overId).replace('-column', '');
    
    // Se o que está sendo arrastado é uma tarefa
    if (active.data.current?.type === 'task') {
      // Atualizar a tarefa com a nova coluna
      updateTask(String(activeId), { columnId: overColumnId });
    }
    
    // Limpar estados
    setActiveId(null);
    setDraggedOverColumn(null);
  };
  
  // Manipulador para cancelamento do arrasto
  const handleDragCancel = () => {
    setActiveId(null);
    setDraggedOverColumn(null);
  };
  
  // Versão modificada da alternância de coluna visível que salva na configuração
  const toggleColumnVisibility = (columnId: string) => {
    if (isSmallScreen) {
      setVisibleColumns([columnId]);
      setUserBoardConfig({
        ...userBoardConfig,
        visibleColumns: [columnId]
      });
    } else {
      // Para telas grandes, adicionamos/removemos colunas da lista de visibilidade
      const isVisible = visibleColumns.includes(columnId);
      const newVisibleColumns = isVisible
        ? visibleColumns.filter(id => id !== columnId)
        : [...visibleColumns, columnId];
      
      setVisibleColumns(newVisibleColumns);
      setUserBoardConfig({
        ...userBoardConfig,
        visibleColumns: newVisibleColumns
      });
    }
  };
  
  // Adicionar nova lista
  const handleAddList = () => {
    if (newListName.trim()) {
      addList(newListName.trim(), newListColor);
      setNewListName('');
      setNewListColor('#6366F1');
      showToast(`Coluna "${newListName}" adicionada`, 'success');
    }
  };

  // Notificar o componente pai sobre mudanças nos filtros
  const updateFilters = () => {
    if (onFiltersChange) {
      onFiltersChange({
        priority: filterPriority,
        searchTerm: searchTerm,
        tags: [] // Adicionar suporte a tags no futuro
      });
    }
  };

  // Atualizar filtros quando mudarem
  useEffect(() => {
    updateFilters();
  }, [filterPriority, searchTerm]);

  // Função modificada para aplicar um template e salvar na configuração do usuário
  const applyTemplate = (template: KanbanTemplate) => {
    // Remover colunas existentes
    kanbanColumns.forEach(column => {
      deleteKanbanColumn(column.id);
    });
    
    // Adicionar novas colunas do template
    template.columns.forEach(column => {
      addKanbanColumn(column.name, column.color || '#6366F1', column.id);
    });
    
    // Salvar o template usado na configuração do usuário
    setUserBoardConfig({
      ...userBoardConfig,
      lastUsedTemplate: template.id,
      columnOrder: template.columns.map(col => col.id)
    });
    
    // Fechar modal após aplicar o template
    setIsTemplateModalOpen(false);
    
    // Exibir mensagem de sucesso
    showToast(`Template ${template.name} aplicado com sucesso!`, 'success');
  };

  // Agrupar tarefas por coluna Kanban
  const tasksByColumn = useMemo(() => {
    const result: Record<string, Task[]> = {};
    
    // Inicializar todas as colunas com arrays vazios
    kanbanColumns.forEach(column => {
      result[column.id] = [];
    });
    
    // Adicionar tarefas às colunas corretas
    filteredTasksList.forEach(task => {
      // Se a tarefa tem columnId definido, adicionar à coluna correspondente
      if (task.columnId && result[task.columnId]) {
        result[task.columnId].push(task);
      } else {
        // Se não tem columnId, adicionar à primeira coluna (normalmente "Backlog" ou "A Fazer")
        const firstColumnId = kanbanColumns.length > 0 ? kanbanColumns[0].id : 'backlog';
        
        // Verificar se o array existe antes de fazer push
        if (!result[firstColumnId]) {
          result[firstColumnId] = [];
        }
        
        result[firstColumnId].push(task);
      }
    });
    
    return result;
  }, [filteredTasksList, kanbanColumns]);
  
  // Função modificada para adicionar coluna que atualiza a configuração do usuário
  const handleAddColumn = async () => {
    if (newColumnName.trim()) {
      const newColumnId = await addKanbanColumn(newColumnName.trim(), newColumnColor);
      setNewColumnName('');
      setNewColumnColor('#6366F1');
      
      if (typeof newColumnId === 'string') {
        // Atualizar colunas visíveis e ordem
        const newVisibleColumns = [...visibleColumns, newColumnId];
        setVisibleColumns(newVisibleColumns);
        
        // Atualizar configuração do usuário
        setUserBoardConfig({
          ...userBoardConfig,
          visibleColumns: newVisibleColumns,
          columnOrder: [...(userBoardConfig.columnOrder || []), newColumnId]
        });
        
        showToast(`Coluna "${newColumnName}" adicionada`, 'success');
      }
    }
  };

  // Verificação de segurança para lidar com o problema da tela branca
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner">
        <div className="text-5xl mb-4 opacity-30">📋</div>
        <h3 className="text-xl font-medium mb-3 text-gray-700 dark:text-gray-300">
          Nenhuma tarefa encontrada
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          Adicione novas tarefas ou ajuste seus filtros para visualizar o quadro Kanban.
        </p>
      </div>
    );
  }

  // Verificação de segurança para listas
  if (!lists || lists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner">
        <div className="text-5xl mb-4 opacity-30">🗂️</div>
        <h3 className="text-xl font-medium mb-3 text-gray-700 dark:text-gray-300">
          Nenhuma lista encontrada
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          Crie listas para organizar suas tarefas no quadro Kanban.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg shadow-lg animate-fade-in">
      <div className="p-4 md:p-6 flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-2 md:mb-0">
          Quadro Kanban
          {selectedListId && (
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              - Filtrando pela lista: {lists.find(l => l.id === selectedListId)?.name}
            </span>
          )}
        </h2>
        
        <div className="flex space-x-2 items-center">
          <button
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setIsTemplateModalOpen(true)}
            title="Escolher modelo"
          >
            <FiLayout size={18} />
          </button>
          
          <button
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            title="Filtrar tarefas"
          >
            <FiFilter size={18} />
          </button>
          
          <button 
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={handleAddColumn}
            title="Adicionar nova coluna"
          >
            <FiPlus size={18} />
          </button>
        </div>
      </div>
      
      {/* Navegação em dispositivos móveis */}
      {isSmallScreen && (
        <div className="px-4 py-2 flex overflow-x-auto scrollbar-hide space-x-2 bg-gray-100 dark:bg-gray-800">
          <button
            onClick={() => toggleColumnVisibility('pending')}
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
              visibleColumns.includes('pending')
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Pendentes
          </button>
          
          {lists.map(list => (
            <button
              key={list.id}
              onClick={() => toggleColumnVisibility(`list-${list.id}`)}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                visibleColumns.includes(`list-${list.id}`)
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              style={{ 
                backgroundColor: visibleColumns.includes(`list-${list.id}`) ? undefined : list.color + '20',
                color: visibleColumns.includes(`list-${list.id}`) ? undefined : list.color
              }}
            >
              {list.name}
            </button>
          ))}
          
          <button
            onClick={() => toggleColumnVisibility('completed')}
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
              visibleColumns.includes('completed')
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Concluídas
          </button>
        </div>
      )}
      
      {/* Painel de configurações */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">Adicionar Nova Coluna</h3>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Nome da coluna"
                  className="flex-grow px-3 py-2 text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="color"
                  value={newListColor}
                  onChange={(e) => setNewListColor(e.target.value)}
                  className="w-10 h-10 rounded-md cursor-pointer"
                />
                <button
                  onClick={handleAddList}
                  className="px-4 py-2 text-sm text-white bg-indigo-500 hover:bg-indigo-600 rounded-md"
                >
                  <FiPlus className="inline-block mr-1" /> Adicionar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal para seleção de templates */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-medium">Escolher Modelo de Quadro</h3>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FiX size={20} />
              </button>
            </div>
            <KanbanTemplateSelector onSelect={applyTemplate} />
          </div>
        </div>
      )}
      
      {/* Componente de filtros */}
      <AnimatePresence>
        {isFiltersOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">Filtrar Tarefas</h3>
              <div className="flex flex-wrap gap-2">
                <div className="relative group">
                  <select
                    value={filterPriority}
                    onChange={(e) => {
                      setFilterPriority(e.target.value);
                      // Atualizar filtros automaticamente
                      if (onFiltersChange) {
                        onFiltersChange({
                          priority: e.target.value,
                          searchTerm: searchTerm,
                          tags: []
                        });
                      }
                    }}
                    className="form-select text-sm rounded-md border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200
                      focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 pr-8 py-1.5 pl-3"
                  >
                    <option value="todas">Todas as prioridades</option>
                    <option value="baixa">Baixa</option>
                    <option value="média">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                  <FiFilter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                </div>

                <div className="relative group">
                  <select
                    value={selectedListId || ''}
                    onChange={(e) => {
                      setSelectedListId(e.target.value || undefined);
                    }}
                    className="form-select text-sm rounded-md border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200
                      focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 pr-8 py-1.5 pl-3"
                  >
                    <option value="">Todas as listas</option>
                    {lists.map(list => (
                      <option key={list.id} value={list.id}>{list.name}</option>
                    ))}
                  </select>
                  <FiFilter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                </div>
                
                <div className="relative group ml-2 md:ml-4">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      // Não atualizar em tempo real, apenas após digitar
                      if (e.target.value === '' && searchTerm !== '') {
                        updateFilters();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateFilters();
                      }
                    }}
                    className="form-input text-sm rounded-md border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200
                      focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 pr-8 py-1.5 pl-3"
                  />
                  <FiSearch className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        <div className="flex-grow overflow-x-auto overflow-y-hidden p-4 custom-scrollbar kanban-board-container">
          <div className="flex h-full space-x-6 min-w-max kanban-columns-container">
            {/* Colunas do Kanban */}
            {kanbanColumns.map(column => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.name}
                tasks={tasksByColumn[column.id] || []}
                color={column.color}
                className={draggedOverColumn === column.id ? 'border-indigo-500 dark:border-indigo-400 shadow-md' : ''}
              />
            ))}
          </div>
        </div>
        
        {/* Overlay para a tarefa que está sendo arrastada */}
        <DragOverlay 
          adjustScale={false} 
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}
        >
          {activeId && taskForOverlay ? (
            <SortableTaskCard task={taskForOverlay} columnId="" isDragging={true} />
          ) : null}
        </DragOverlay>
        
        {/* Componente de monitoramento */}
        <KanbanBoardContent 
          onDragOverColumn={setDraggedOverColumn}
          setActiveId={setActiveId}
        />
      </DndContext>
    </div>
  );
};

// Adicionando um componente wrapper para o KanbanBoard
const KanbanBoardWrapper: React.FC<KanbanBoardProps> = (props) => {
  return <KanbanBoard {...props} />;
};

export default KanbanBoardWrapper; 