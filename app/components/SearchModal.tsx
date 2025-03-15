import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiCalendar, FiCheckCircle, FiCircle, FiClock, FiList, FiTag } from 'react-icons/fi';
import { useTaskContext } from '../context/TaskContext';
import { Task, TaskList } from '../types';
import ReactMarkdown from 'react-markdown';

interface SearchModalProps {
  onClose: () => void;
  tasks: Task[];
  lists: TaskList[];
}

export const SearchModal: React.FC<SearchModalProps> = ({ onClose, tasks, lists }) => {
  const { setFilter } = useTaskContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<{
    status: string;
    priority: string;
    listId: string;
    timeframe: string;
  }>({
    status: 'todas',
    priority: 'todas',
    listId: 'todas',
    timeframe: 'todas',
  });
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Focar no input de pesquisa quando o modal abrir
  useEffect(() => {
    if (searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, []);
  
  // Função para filtrar tarefas com base nos termos e filtros selecionados
  const filterTasks = () => {
    if (!searchTerm && Object.values(selectedFilters).every(value => value === 'todas')) {
      setResults([]);
      return;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const filtered = tasks.filter(task => {
      // Verificar se o termo de busca corresponde ao título ou descrição
      const matchesSearchTerm = !searchTerm || 
        task.title.toLowerCase().includes(lowerSearchTerm) || 
        (task.description && task.description.toLowerCase().includes(lowerSearchTerm)) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)));
      
      // Verificar se corresponde aos filtros selecionados
      const matchesStatus = 
        selectedFilters.status === 'todas' || 
        (selectedFilters.status === 'concluídas' && task.completed) || 
        (selectedFilters.status === 'pendentes' && !task.completed);
      
      const matchesPriority = 
        selectedFilters.priority === 'todas' || 
        task.priority === selectedFilters.priority;
      
      const matchesList = 
        selectedFilters.listId === 'todas' || 
        task.listId === selectedFilters.listId;
      
      // Verificar timeframe
      let matchesTimeframe = selectedFilters.timeframe === 'todas';
      
      if (!matchesTimeframe && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        if (selectedFilters.timeframe === 'hoje') {
          const taskDate = new Date(dueDate);
          taskDate.setHours(0, 0, 0, 0);
          matchesTimeframe = taskDate.getTime() === today.getTime();
        } else if (selectedFilters.timeframe === 'amanhã') {
          const taskDate = new Date(dueDate);
          taskDate.setHours(0, 0, 0, 0);
          matchesTimeframe = taskDate.getTime() === tomorrow.getTime();
        } else if (selectedFilters.timeframe === 'esta-semana') {
          matchesTimeframe = dueDate >= today && dueDate < nextWeek;
        }
      }
      
      return matchesSearchTerm && matchesStatus && matchesPriority && matchesList && matchesTimeframe;
    });
    
    setResults(filtered);
  };
  
  // Filtrar tarefas sempre que o termo de busca ou filtros mudarem
  useEffect(() => {
    filterTasks();
  }, [searchTerm, selectedFilters, tasks]);
  
  // Ativar navegação com teclado no modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Fechar modal ao pressionar Esc
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  // Formatar data
  const formatDate = (date?: Date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Verificar se a data está no passado
  const isOverdue = (date?: Date) => {
    if (!date) return false;
    const dueDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };
  
  // Obter nome da lista por ID
  const getListName = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    return list ? list.name : 'Lista Padrão';
  };
  
  // Obter cor da lista por ID
  const getListColor = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    return list?.color || '#6366F1';
  };
  
  // Limitar tamanho do texto
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };
  
  // Navegar para uma tarefa
  const goToTask = (task: Task) => {
    // Aplicar filtro baseado na lista da tarefa para exibi-la no contexto correto
    setFilter({
      status: 'todas',
      priority: 'todas',
      listId: task.listId,
      searchTerm: '',
      tags: []
    });
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar tarefas por título, descrição ou tags..."
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setSearchTerm('')}
              >
                <FiX className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
              </button>
            )}
          </div>
        </div>
        
        {/* Filtros */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap gap-2">
          {/* Filtro de Status */}
          <div className="relative inline-block text-sm">
            <select
              value={selectedFilters.status}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-1.5 pl-8 pr-8 font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <option value="todas">Todos os Status</option>
              <option value="pendentes">Pendentes</option>
              <option value="concluídas">Concluídas</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center">
              <FiCheckCircle className="text-gray-500 dark:text-gray-400" size={16} />
            </div>
          </div>
          
          {/* Filtro de Prioridade */}
          <div className="relative inline-block text-sm">
            <select
              value={selectedFilters.priority}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-1.5 pl-8 pr-8 font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <option value="todas">Todas as Prioridades</option>
              <option value="alta">Alta</option>
              <option value="média">Média</option>
              <option value="baixa">Baixa</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center">
              <FiClock className="text-gray-500 dark:text-gray-400" size={16} />
            </div>
          </div>
          
          {/* Filtro de Lista */}
          <div className="relative inline-block text-sm">
            <select
              value={selectedFilters.listId}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, listId: e.target.value }))}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-1.5 pl-8 pr-8 font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <option value="todas">Todas as Listas</option>
              {lists.map(list => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center">
              <FiList className="text-gray-500 dark:text-gray-400" size={16} />
            </div>
          </div>
          
          {/* Filtro de Timeframe */}
          <div className="relative inline-block text-sm">
            <select
              value={selectedFilters.timeframe}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, timeframe: e.target.value }))}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-1.5 pl-8 pr-8 font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <option value="todas">Qualquer data</option>
              <option value="hoje">Hoje</option>
              <option value="amanhã">Amanhã</option>
              <option value="esta-semana">Esta semana</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center">
              <FiCalendar className="text-gray-500 dark:text-gray-400" size={16} />
            </div>
          </div>
        </div>
        
        {/* Resultados */}
        <div className="flex-grow overflow-y-auto p-4">
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map(task => (
                <div 
                  key={task.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => goToTask(task)}
                >
                  <div className="flex items-start gap-3">
                    {/* Indicador de completion */}
                    <div className="flex-shrink-0 pt-1">
                      {task.completed ? (
                        <FiCheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <FiCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className={`text-base font-medium ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {task.title}
                        </h4>
                      </div>
                      
                      {task.description && (
                        <div className={`text-sm mt-1 mb-2 prose prose-sm dark:prose-invert max-w-none ${task.completed ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          <ReactMarkdown>
                            {truncateText(task.description, 150)}
                          </ReactMarkdown>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                        {/* Lista */}
                        <div className="flex items-center">
                          <span 
                            className="w-2 h-2 mr-1 rounded-full" 
                            style={{ backgroundColor: getListColor(task.listId) }}
                          ></span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {getListName(task.listId)}
                          </span>
                        </div>
                        
                        {/* Prioridade */}
                        {task.priority && (
                          <span 
                            className={`px-2 py-0.5 rounded-full ${
                              task.priority === 'alta' 
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                                : task.priority === 'média'
                                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            }`}
                          >
                            {task.priority === 'alta' ? 'Alta' : task.priority === 'média' ? 'Média' : 'Baixa'}
                          </span>
                        )}
                        
                        {/* Data */}
                        {task.dueDate && (
                          <span 
                            className={`inline-flex items-center ${
                              isOverdue(task.dueDate) && !task.completed
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <FiCalendar className="mr-1" size={12} />
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                        
                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center flex-wrap gap-1 ml-auto">
                            <FiTag className="text-gray-400" size={12} />
                            {task.tags.map((tag, idx) => (
                              <span 
                                key={idx}
                                className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm || Object.values(selectedFilters).some(value => value !== 'todas') ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <FiSearch className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhuma tarefa encontrada</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Tente ajustar seus termos de busca ou filtros para encontrar o que procura.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <FiSearch className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Busque suas tarefas</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Digite palavras-chave para buscar em suas tarefas ou use os filtros acima para refinar sua busca.
              </p>
            </div>
          )}
        </div>
        
        {/* Rodapé */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {results.length > 0 && `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'} encontrados`}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}; 