import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { FiCheck, FiEdit2, FiTrash2, FiClock, FiFlag, FiMoreVertical, FiSave, FiX } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task } from '../app/types';
import { useTaskActions } from '../app/context/TaskContext';
import { motion } from 'framer-motion';
import SyncIndicator from './SyncIndicator';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  syncStatus?: 'synced' | 'pending' | 'error' | 'offline';
  lastSynced?: Date | null;
}

const priorityColors = {
  baixa: "bg-green-500/30 text-green-300",
  média: "bg-yellow-500/30 text-yellow-300",
  alta: "bg-rose-500/30 text-rose-300",
};

const priorityIcons = {
  baixa: <FiFlag className="text-green-400" aria-label="Prioridade baixa" />,
  média: <FiFlag className="text-yellow-400" aria-label="Prioridade média" />,
  alta: <FiFlag className="text-rose-400" aria-label="Prioridade alta" />,
};

const priorities = ['baixa', 'média', 'alta'] as const;

// Componentes de UI separados para melhor organização
const TaskActions = memo(({ 
  onEdit, 
  onDelete, 
  onToggleExpand 
}: { 
  onEdit: () => void, 
  onDelete: (e: React.MouseEvent) => void, 
  onToggleExpand: (e: React.MouseEvent) => void 
}) => (
  <div className="flex space-x-2">
    <button 
      onClick={onEdit} 
      className="p-1.5 hover:bg-slate-700 rounded-full transition-colors"
      aria-label="Editar tarefa"
    >
      <FiEdit2 className="text-slate-300" />
    </button>
    <button 
      onClick={onDelete} 
      className="p-1.5 hover:bg-slate-700 rounded-full transition-colors"
      aria-label="Excluir tarefa"
    >
      <FiTrash2 className="text-slate-300" />
    </button>
    <button 
      onClick={onToggleExpand} 
      className="p-1.5 hover:bg-slate-700 rounded-full transition-colors"
      aria-label="Mais ações"
    >
      <FiMoreVertical className="text-slate-300" />
    </button>
  </div>
));

TaskActions.displayName = 'TaskActions';

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onEdit, 
  syncStatus = 'synced',
  lastSynced = null 
}) => {
  const { toggleTaskCompletion, deleteTask, updateTask } = useTaskActions();
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedPriority, setEditedPriority] = useState(task.priority);
  const [expandedDetails, setExpandedDetails] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Atualizar estados editados quando a tarefa mudar
  useEffect(() => {
    setEditedTitle(task.title);
    setEditedDescription(task.description || '');
    setEditedPriority(task.priority);
  }, [task]);

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);

  const handleToggleCompletion = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTaskCompletion(task.id);
  }, [task.id, toggleTaskCompletion]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask(task.id);
  }, [task.id, deleteTask]);

  // Memoizar funções de manipulação para evitar recriações desnecessárias
  const handleEdit = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (showActions) {
      setShowActions(false);
    }
    setIsEditing(true);
  }, [showActions]);

  const handleSaveInlineEdit = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (editedTitle.trim() === '') return;
    
    updateTask(task.id, {
      ...task,
      title: editedTitle,
      description: editedDescription,
      priority: editedPriority
    });
    
    setIsEditing(false);
  }, [task, editedTitle, editedDescription, editedPriority, updateTask]);

  const handleCancelEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(task.title);
    setEditedDescription(task.description || '');
    setEditedPriority(task.priority);
    setIsEditing(false);
  }, [task]);

  const toggleActions = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(prev => !prev);
  }, []);

  const handleItemClick = useCallback(() => {
    if (!isEditing) {
      setExpandedDetails(prev => !prev);
    }
  }, [isEditing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSaveInlineEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit(e as unknown as React.MouseEvent);
    }
  }, [handleSaveInlineEdit, handleCancelEdit]);

  // Usar memo para renderizar apenas quando necessário
  const taskDate = useMemo(() => {
    if (!task.dueDate) return null;
    try {
      return format(new Date(task.dueDate), "d 'de' MMMM", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return null;
    }
  }, [task.dueDate]);

  return (
    <motion.div
      className={`bg-gray-800 rounded-lg shadow-md mb-3 overflow-hidden transition-all ${
        isHovered ? 'shadow-lg ring-1 ring-indigo-500/30' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
      layout
      onClick={handleItemClick}
    >
      <div className="p-4 relative">
        {/* Parte superior com checkbox, título e ações */}
        <div className="flex items-start">
          <button
            onClick={handleToggleCompletion}
            className={`p-1.5 rounded-full flex-shrink-0 transition-colors border ${
              task.completed
                ? 'bg-indigo-500 border-indigo-600'
                : 'border-gray-600 hover:border-indigo-500'
            }`}
            aria-label={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
          >
            {task.completed && <FiCheck className="text-white" />}
          </button>

          {isEditing ? (
            <div className="flex-1 ml-3">
              <input
                type="text"
                ref={titleInputRef}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-indigo-500"
                placeholder="Título da tarefa"
              />
            </div>
          ) : (
            <div className="flex-1 ml-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-base transition-colors ${
                    task.completed ? 'text-gray-400 line-through' : 'text-white'
                  }`}
                >
                  {task.title}
                </span>
                
                <div className="flex items-center">
                  {/* Indicador de sincronização */}
                  <SyncIndicator 
                    status={syncStatus} 
                    lastSynced={lastSynced} 
                    size="sm" 
                    className="mr-2"
                  />
                  
                  <div className="relative">
                    <button
                      onClick={toggleActions}
                      className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                      aria-label="Mais ações"
                    >
                      <FiMoreVertical className="text-gray-400" />
                    </button>

                    {showActions && (
                      <div className="absolute right-0 top-8 z-10 w-32 rounded-md bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                        <TaskActions onEdit={handleEdit} onDelete={handleDelete} onToggleExpand={toggleActions} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detalhes da tarefa - descrição, prioridade, data */}
              <div
                className={`mt-2 transition-all overflow-hidden ${
                  expandedDetails ? 'max-h-96' : 'max-h-0'
                }`}
              >
                {task.description && (
                  <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {task.priority && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                        priorityColors[task.priority]
                      }`}
                    >
                      {priorityIcons[task.priority]}
                      <span className="ml-1">Prioridade {task.priority}</span>
                    </span>
                  )}

                  {task.dueDate && (
                    <span className="flex items-center text-xs text-gray-300">
                      <FiClock className="mr-1" />
                      {taskDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botões para salvar/cancelar edição */}
        {isEditing && (
          <div className="flex mt-3 ml-9">
            <button
              onClick={handleSaveInlineEdit}
              className="flex items-center px-3 py-1 bg-indigo-600 rounded-md hover:bg-indigo-500 mr-2"
            >
              <FiSave className="mr-1" /> Salvar
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex items-center px-3 py-1 bg-gray-700 rounded-md hover:bg-gray-600"
            >
              <FiX className="mr-1" /> Cancelar
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default memo(TaskItem); 