import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTaskCard from './SortableTaskCard';
import { FiPlus, FiMoreVertical, FiEdit, FiTrash, FiX, FiCheck, FiArrowDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskContext } from '../context/TaskContext';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  className?: string;
  color?: string;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tasks, className = '', color }) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `${id}-column`,
    data: {
      type: 'column',
      id: id,
      accepts: ['task']
    }
  });
  
  const { addTask, updateKanbanColumn, deleteKanbanColumn, lists } = useTaskContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditingColumn, setIsEditingColumn] = useState(false);
  const [editedColumnTitle, setEditedColumnTitle] = useState(title);
  const [dragTimeout, setDragTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showDropIndicator, setShowDropIndicator] = useState(false);
  
  // Garantir que usamos IDs consistentes para o arrasto
  const taskIds = tasks.map(task => task.id);
  
  // Efeito para mostrar o indicador de drop após um breve atraso
  useEffect(() => {
    if (isOver && active) {
      // Limpar timeout anterior se existir
      if (dragTimeout) {
        clearTimeout(dragTimeout);
      }
      
      // Criar novo timeout para mostrar indicador após 200ms
      const timeout = setTimeout(() => {
        setShowDropIndicator(true);
      }, 200);
      
      setDragTimeout(timeout);
    } else {
      // Limpar timeout e esconder indicador quando não está mais sobre
      if (dragTimeout) {
        clearTimeout(dragTimeout);
      }
      setShowDropIndicator(false);
    }
    
    // Limpar timeout ao desmontar
    return () => {
      if (dragTimeout) {
        clearTimeout(dragTimeout);
      }
    };
  }, [isOver, active]);
  
  // Efeito para atualizar o título da coluna quando muda externamente
  useEffect(() => {
    setEditedColumnTitle(title);
  }, [title]);
  
  // Determinar a cor da coluna com base no ID ou na cor fornecida
  const getColumnColor = () => {
    if (color) return color;
    
    switch(id) {
      case 'pending':
        return '#3B82F6'; // Azul
      case 'completed':
        return '#10B981'; // Verde
      default:
        return '#6366F1'; // Roxo (indigo)
    }
  };
  
  // Calcular o estilo baseado no status "over" e na cor da coluna
  const columnColor = getColumnColor();
  const columnStyle = {
    borderColor: isOver ? `${columnColor}` : undefined,
    boxShadow: isOver ? `0 0 10px ${columnColor}40` : undefined,
    backgroundColor: `${columnColor}10`,
    borderLeft: `3px solid ${columnColor}`,
    borderTop: `1px solid ${columnColor}30`,
    borderRight: `1px solid ${columnColor}30`,
    borderBottom: `1px solid ${columnColor}30`,
  };
  
  // Calcular totais
  const completedCount = tasks.filter(task => task.completed).length;
  const pendingCount = tasks.length - completedCount;
  
  // Adicionar uma nova tarefa
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      // Identificar se estamos em uma coluna predefinida ou em uma lista
      const isCustomList = id.startsWith('list-');
      
      // Obter o ID da lista padrão (primeira lista) para colunas não personalizadas
      const defaultListId = lists && lists.length > 0 ? lists[0].id : null;
      
      console.log('[KanbanColumn] Criando nova tarefa:', {
        titulo: newTaskTitle,
        coluna: id,
        isCustomList,
        defaultListId,
        todasListas: lists
      });
      
      // Se não tivermos uma lista padrão, mostrar erro e retornar
      if (!defaultListId && !isCustomList) {
        console.error("Não foi possível adicionar tarefa: nenhuma lista padrão encontrada");
        return;
      }
      
      const listIdToUse = isCustomList ? id.replace('list-', '') : defaultListId;
      console.log('[KanbanColumn] listId a ser usado:', listIdToUse);
      
      // Criar objeto da tarefa
      const taskData = {
        title: newTaskTitle,
        description: '',
        completed: id === 'completed', // Definir como concluída se estiver na coluna 'completed'
        priority: 'média',
        // Usar ID da lista personalizada ou o ID da lista padrão
        listId: listIdToUse,
        subtasks: [],
        position: tasks.length,
        tags: []
      };
      
      console.log('[KanbanColumn] Objeto da tarefa criado:', taskData);
      
      // Chamar função de adição
      addTask(taskData);
      
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };
  
  // Atualizar o título da coluna
  const handleUpdateColumn = () => {
    if (editedColumnTitle.trim() && editedColumnTitle !== title) {
      updateKanbanColumn(id, { name: editedColumnTitle });
      setIsEditingColumn(false);
    } else {
      setEditedColumnTitle(title);
      setIsEditingColumn(false);
    }
  };
  
  // Excluir a coluna
  const handleDeleteColumn = () => {
    deleteKanbanColumn(id);
    setIsMenuOpen(false);
  };
  
  // Estilo para o overlay durante arrasto
  const getOverlayStyle = () => {
    if (!isOver) return {};
    
    return {
      background: `linear-gradient(0deg, ${columnColor}20, transparent)`,
    };
  };
  
  // Renderizar indicador de drop
  const renderDropIndicator = () => {
    if (!showDropIndicator) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`absolute bottom-0 left-0 right-0 h-1.5 rounded-full mx-4`}
        style={{ backgroundColor: columnColor }}
      />
    );
  };

  // Determinar o ícone e o texto para o status das tarefas
  const renderStatusIndicator = () => {
    let bgColor, textColor, text;
    
    switch(id) {
      case 'pending':
        bgColor = 'bg-blue-100 dark:bg-blue-900';
        textColor = 'text-blue-800 dark:text-blue-200';
        text = 'Pendentes';
        break;
      case 'completed':
        bgColor = 'bg-green-100 dark:bg-green-900';
        textColor = 'text-green-800 dark:text-green-200';
        text = 'Concluídas';
        break;
      default:
        bgColor = 'bg-indigo-100 dark:bg-indigo-900';
        textColor = 'text-indigo-800 dark:text-indigo-200';
        text = title;
    }
    
    return (
      <div className={`text-xs font-medium px-2 py-1 rounded-full ${bgColor} ${textColor} inline-flex items-center`}>
        {text}
      </div>
    );
  };
  
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md w-80 min-w-[280px] flex-shrink-0 h-full ${className}`}
    >
      {/* Cabeçalho da coluna */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
        {isEditingColumn ? (
          <div className="flex items-center space-x-2 w-full">
            <input
              type="text"
              value={editedColumnTitle}
              onChange={(e) => setEditedColumnTitle(e.target.value)}
              className="flex-grow px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <button
              onClick={handleUpdateColumn}
              className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900 rounded-full"
              aria-label="Salvar edição"
            >
              <FiCheck size={16} />
            </button>
            <button
              onClick={() => setIsEditingColumn(false)}
              className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"
              aria-label="Cancelar edição"
            >
              <FiX size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: columnColor }}
              />
              <h3 className="font-medium text-gray-800 dark:text-white">{title}</h3>
            </div>
            <div className="flex items-center">
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {tasks.length}
              </div>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1 ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Opções da coluna"
                >
                  <FiMoreVertical size={16} />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 z-10 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {id.startsWith('list-') && (
                      <>
                        <button
                          onClick={() => {
                            setIsEditingColumn(true);
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiEdit className="mr-2" size={14} /> Renomear
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteColumn();
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiTrash className="mr-2" size={14} /> Excluir
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Lista de tarefas */}
      <div 
        className="flex-grow p-2 overflow-y-auto space-y-2 relative custom-scrollbar"
        style={getOverlayStyle()}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <SortableTaskCard 
                  key={task.id} 
                  task={task} 
                  columnId={id}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                className="flex flex-col items-center justify-center h-20 text-center text-gray-400 dark:text-gray-500"
              >
                <FiArrowDown className="mb-2" size={20} />
                <p className="text-sm">Arraste tarefas aqui ou adicione uma nova</p>
              </motion.div>
            )}
          </AnimatePresence>
        </SortableContext>
        {renderDropIndicator()}
      </div>
      
      {/* Rodapé da coluna */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700">
        {isAddingTask ? (
          <div className="flex flex-col space-y-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Título da tarefa"
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAddTask}
                className="flex-grow px-3 py-1 text-sm text-white bg-indigo-500 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-gray-800"
              >
                Adicionar
              </button>
              <button
                onClick={() => setIsAddingTask(false)}
                className="px-3 py-1 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="flex items-center justify-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
          >
            <FiPlus className="mr-1" size={14} /> Adicionar tarefa
          </button>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn; 