import React, { useState } from 'react';
import { FiInbox, FiCalendar, FiClock, FiPlus, FiCheck, FiChevronDown, FiChevronRight, FiList, FiEdit2, FiTrash2, FiX, FiFilter, FiBarChart2, FiTarget, FiSearch, FiTag, FiMenu, FiHome, FiCheckSquare, FiInfo, FiChevronLeft, FiActivity, FiZap, FiTrello, FiSettings } from 'react-icons/fi';
import { useTaskContext } from '../context/TaskContext';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterFocusMode: () => void;
  onShowCalendar: () => void;
  onOpenSearch: () => void;
  onOpenTagsManager: () => void;
  onShowPomodoroTimer: () => void;
  onShowHabitsTracker: () => void;
  onShowGoalPlanner: () => void;
  onShowWorkflowAutomation: () => void;
  onOpenScrumBoard?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose,
  onEnterFocusMode,
  onShowCalendar,
  onOpenSearch,
  onOpenTagsManager,
  onShowPomodoroTimer,
  onShowHabitsTracker,
  onShowGoalPlanner,
  onShowWorkflowAutomation,
  onOpenScrumBoard
}) => {
  const { lists, addList, updateList, deleteList, setFilter, filter, getTasksStats } = useTaskContext();
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#6366F1'); // Cor padrão (indigo-500)
  const [isAddingList, setIsAddingList] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');
  const [editedColor, setEditedColor] = useState('');
  const [hoveringList, setHoveringList] = useState<string | null>(null);
  const [expandedLists, setExpandedLists] = useState(true);
  
  const stats = getTasksStats();
  
  // Lista de cores para escolher
  const colorOptions = [
    { name: 'indigo', value: '#6366F1' }, 
    { name: 'red', value: '#EF4444' },
    { name: 'green', value: '#10B981' },
    { name: 'yellow', value: '#F59E0B' },
    { name: 'purple', value: '#8B5CF6' },
    { name: 'blue', value: '#3B82F6' },
    { name: 'pink', value: '#EC4899' },
    { name: 'gray', value: '#6B7280' }
  ];
  
  // Adicionar nova lista
  const handleAddList = () => {
    if (newListName.trim()) {
      addList(newListName.trim(), newListColor);
      setNewListName('');
      setIsAddingList(false);
    }
  };
  
  // Iniciar edição de uma lista
  const startEditing = (listId: string, listName: string, listColor: string) => {
    setEditingListId(listId);
    setEditingListName(listName);
    setEditedColor(listColor);
  };
  
  // Salvar edição de uma lista
  const saveListEdit = () => {
    if (editingListId && editingListName.trim()) {
      updateList(editingListId, { 
        name: editingListName.trim(),
        color: editedColor
      });
      setEditingListId(null);
    }
  };
  
  // Cancelar edição de uma lista
  const cancelListEdit = () => {
    setEditingListId(null);
  };
  
  // Excluir uma lista
  const handleDeleteList = (listId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta lista?')) {
      deleteList(listId);
    }
  };
  
  // Verificar se um filtro está ativo
  const isFilterActive = (filterType: string, listId?: string) => {
    if (filterType === 'list' && listId) {
      return filter.listId === listId;
    }
    
    if (filterType === 'all') {
      return filter.status === 'todas' && filter.priority === 'todas' && filter.listId === '';
    }
    
    if (filterType === 'pending') {
      return filter.status === 'pendentes';
    }
    
    if (filterType === 'completed') {
      return filter.status === 'concluídas';
    }
    
    return false;
  };
  
  return (
    <div className={`h-full bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isOpen ? 'w-64' : 'w-14'} overflow-hidden sidebar`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 lg:border-none">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white hidden lg:block">
          Menu
        </h2>
        <button 
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 lg:hidden"
          onClick={onClose}
        >
          <FiX size={20} />
        </button>
      </div>
      
      <div className="overflow-y-auto h-[calc(100vh-4rem)] p-4">
        {/* Barra de pesquisa */}
        <div 
          className="flex items-center p-2 mb-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          onClick={onOpenSearch}
        >
          <FiSearch className="mr-2 text-gray-500 dark:text-gray-400" size={18} />
          <span className="text-sm">Buscar tarefas...</span>
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">⌘K</span>
        </div>
        
        <nav className="space-y-6">
          {/* Filtros principais */}
          <div className="space-y-1">
            <button
              className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors
                ${isFilterActive('all') 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}
              `}
              onClick={(e) => {
                e.stopPropagation();
                setFilter({
                  status: 'todas',
                  priority: 'todas',
                  listId: '',
                  searchTerm: '',
                  tags: []
                });
              }}
            >
              <FiInbox className={`mr-3 ${isFilterActive('all') ? 'text-indigo-500' : 'text-gray-500 dark:text-gray-400'}`} size={18} />
              Todas as Tarefas
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{stats.total}</span>
            </button>
            
            <button
              className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors
                ${isFilterActive('today') 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}
              `}
              onClick={(e) => {
                e.stopPropagation();
                setFilter({
                  status: 'pendentes',
                  priority: 'todas',
                  listId: '',
                  searchTerm: '',
                  tags: [],
                  dueDateRange: {
                    start: new Date(),
                    end: new Date()
                  }
                });
              }}
            >
              <FiCalendar className={`mr-3 ${isFilterActive('today') ? 'text-blue-500' : 'text-blue-500/70 dark:text-blue-500/50'}`} size={18} />
              Hoje
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{stats.pending}</span>
            </button>
            
            <button
              className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors
                ${isFilterActive('upcoming') 
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}
              `}
              onClick={(e) => {
                e.stopPropagation();
                const today = new Date();
                const nextWeek = new Date();
                nextWeek.setDate(today.getDate() + 7);
                
                setFilter({
                  status: 'pendentes',
                  priority: 'todas',
                  listId: '',
                  searchTerm: '',
                  tags: [],
                  dueDateRange: {
                    start: today,
                    end: nextWeek
                  }
                });
              }}
            >
              <FiCalendar className={`mr-3 ${isFilterActive('upcoming') ? 'text-amber-500' : 'text-amber-500/70 dark:text-amber-500/50'}`} size={18} />
              Próximos 7 dias
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{stats.pending}</span>
            </button>
            
            <button
              className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors
                ${isFilterActive('completed') 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}
              `}
              onClick={(e) => {
                e.stopPropagation();
                setFilter({
                  status: 'concluídas',
                  priority: 'todas',
                  listId: '',
                  searchTerm: '',
                  tags: []
                });
              }}
            >
              <FiCheck className={`mr-3 ${isFilterActive('completed') ? 'text-green-500' : 'text-green-500/70 dark:text-green-500/50'}`} size={18} />
              Concluídas
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{stats.completed}</span>
            </button>
          </div>
          
          {/* Recursos especiais */}
          <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/scrum"
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <FiTrello className="mr-3 text-indigo-500" size={18} />
              Modo SCRUM
            </Link>
          
            <button
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              onClick={onEnterFocusMode}
            >
              <FiClock className="mr-3 text-indigo-500" size={18} />
              Modo Foco
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">⌘F</span>
            </button>
            
            <button
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              onClick={onShowCalendar}
            >
              <FiCalendar className="mr-3 text-purple-500" size={18} />
              Calendário
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">⌘C</span>
            </button>
            
            <button
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              onClick={onOpenTagsManager}
            >
              <FiTag className="mr-3 text-amber-500" size={18} />
              Gerenciar Tags
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">⌘T</span>
            </button>
          </div>
          
          {/* Listas personalizadas */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <button
                className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                onClick={() => setExpandedLists(!expandedLists)}
              >
                {expandedLists ? <FiChevronDown size={16} className="mr-1" /> : <FiChevronRight size={16} className="mr-1" />}
                Minhas Listas
              </button>
              
              <button
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                onClick={() => setIsAddingList(true)}
                aria-label="Adicionar lista"
              >
                <FiPlus size={16} />
              </button>
            </div>
            
            {expandedLists && (
              <div className="space-y-1 ml-2">
                {isAddingList ? (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-2">
                    <div className="mb-2">
                      <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Nome da lista"
                        className="w-full px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddList();
                          if (e.key === 'Escape') setIsAddingList(false);
                        }}
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {colorOptions.map(color => (
                        <button
                          key={color.name}
                          className={`w-6 h-6 rounded-full ${newListColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setNewListColor(color.value)}
                          aria-label={`Cor ${color.name}`}
                        />
                      ))}
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        onClick={() => setIsAddingList(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800/30"
                        onClick={handleAddList}
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                ) : null}
                
                {lists.map(list => (
                  <div 
                    key={list.id} 
                    className="group relative"
                    onMouseEnter={() => setHoveringList(list.id)}
                    onMouseLeave={() => setHoveringList(null)}
                  >
                    {editingListId === list.id ? (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-1">
                        <div className="mb-2">
                          <input
                            type="text"
                            value={editingListName}
                            onChange={(e) => setEditingListName(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveListEdit();
                              if (e.key === 'Escape') cancelListEdit();
                            }}
                          />
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          {colorOptions.map(color => (
                            <button
                              key={color.name}
                              className={`w-6 h-6 rounded-full ${editedColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''}`}
                              style={{ backgroundColor: color.value }}
                              onClick={() => setEditedColor(color.value)}
                              aria-label={`Cor ${color.name}`}
                            />
                          ))}
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <button
                            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            onClick={cancelListEdit}
                          >
                            Cancelar
                          </button>
                          <button
                            className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800/30"
                            onClick={saveListEdit}
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors
                          ${isFilterActive('list', list.id)
                            ? 'bg-gray-100 dark:bg-gray-800 font-medium' 
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilter({
                            status: 'pendentes',
                            priority: 'todas',
                            listId: '',
                            searchTerm: '',
                            tags: [],
                            dueDateRange: {
                              start: new Date(),
                              end: new Date()
                            }
                          });
                        }}
                      >
                        <span 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: list.color || '#6366F1' }}
                        ></span>
                        <span className="truncate flex-1 text-left">{list.name}</span>
                        
                        {(hoveringList === list.id || isFilterActive('list', list.id)) && (
                          <div className="flex items-center ml-1">
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(list.id, list.name, list.color || '#6366F1');
                              }}
                              aria-label="Editar lista"
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteList(list.id);
                              }}
                              aria-label="Excluir lista"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                ))}
                
                {!isAddingList && lists.length === 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 italic px-3 py-2">
                    Nenhuma lista criada ainda
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Seção de produtividade */}
        <div className="mt-6">
          <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Produtividade
          </h3>
          <ul className="mt-2">
            <li>
              <button
                onClick={onShowPomodoroTimer}
                className="px-4 py-2 w-full flex items-center text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <FiClock className="mr-3 text-indigo-500" size={18} />
                <span>Pomodoro Timer</span>
              </button>
            </li>
            <li>
              <button
                onClick={onShowHabitsTracker}
                className="px-4 py-2 w-full flex items-center text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <FiActivity className="mr-3 text-green-500" size={18} />
                <span>Rastreador de Hábitos</span>
              </button>
            </li>
            <li>
              <button
                onClick={onShowGoalPlanner}
                className="px-4 py-2 w-full flex items-center text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <FiTarget className="mr-3 text-purple-500" size={18} />
                <span>Planejador de Objetivos</span>
              </button>
            </li>
            <li>
              <button
                onClick={onShowWorkflowAutomation}
                className="px-4 py-2 w-full flex items-center text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <FiZap className="mr-3 text-yellow-500" size={18} />
                <span>Automação de Fluxos</span>
              </button>
            </li>
          </ul>
        </div>

        <a 
          href="/scrum"
          className="flex items-center p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg text-gray-700 dark:text-gray-300 group"
        >
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mr-3">
            <FiTarget size={20} />
          </div>
          <span className="font-medium">Scrum Board</span>
        </a>

        <a 
          href="/settings"
          className="flex items-center p-3 mt-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg text-gray-700 dark:text-gray-300 group"
        >
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800/70 text-gray-600 dark:text-gray-400 mr-3">
            <FiSettings size={20} />
          </div>
          <span className="font-medium">Configurações</span>
        </a>
      </div>
    </div>
  );
}; 