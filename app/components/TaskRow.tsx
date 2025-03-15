'use client';

import React, { useMemo, memo, useState, useCallback } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { formatDate } from '../utils/date';
import { FiCheck, FiClock, FiTag, FiList, FiTrash2, FiEdit3 } from 'react-icons/fi';
import { useBackgroundSync } from '../hooks/useBackgroundSync';
import { useToast } from './Toast';

export interface TaskProps {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  tags: string[];
  listId: string;
}

interface TaskRowProps {
  task: TaskProps;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  index?: number;
  style?: React.CSSProperties;
}

const TagsList = memo(({ tags, allTags }: { tags: string[], allTags: any[] }) => {
  if (tags.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {tags.map(tagId => {
        const tag = allTags.find(t => t.id === tagId);
        if (!tag) return null;
        return (
          <span 
            key={tagId} 
            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-opacity-20"
            style={{ 
              backgroundColor: `${tag.color}30`, 
              color: tag.color 
            }}
          >
            <FiTag className="mr-1" size={10} />
            {tag.name}
          </span>
        );
      })}
    </div>
  );
});

TagsList.displayName = 'TagsList';

const TaskRow: React.FC<TaskRowProps> = memo(({ task, onSelect, isSelected, style }) => {
  const { updateTask, deleteTask, lists, tags } = useTaskContext();
  const { addToQueue } = useBackgroundSync();
  const { showToast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);

  // Encontra a lista à qual a tarefa pertence (memoizado para evitar recálculo)
  const listName = useMemo(() => {
    const list = lists.find(l => l.id === task.listId);
    return list ? list.name : 'Lista desconhecida';
  }, [lists, task.listId]);

  // Formatação de data memoizada
  const formattedDate = useMemo(() => {
    return task.dueDate ? formatDate(new Date(task.dueDate)) : '';
  }, [task.dueDate]);

  // Manipuladores de eventos com useCallback para evitar recriação desnecessária
  const handleToggleDone = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    
    try {
      const updatedTask = { ...task, done: !task.done };
      
      // Atualiza otimisticamente a interface do usuário
      updateTask(task.id, { completed: !task.done });
      
      // Adiciona a operação à fila de sincronização
      addToQueue({
        type: 'UPDATE_TASK',
        data: updatedTask,
        onSuccess: () => {
          setLoading(false);
        },
        onError: (error) => {
          // Reverte a mudança em caso de erro
          updateTask(task.id, { completed: task.done });
          showToast(`Erro ao atualizar tarefa: ${error}`, 'error');
          setLoading(false);
        }
      });
    } catch (error) {
      showToast('Erro ao atualizar tarefa', 'error');
      setLoading(false);
    }
  }, [task, updateTask, addToQueue, showToast]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setLoading(true);
    
    try {
      // Remove otimisticamente da interface
      deleteTask(task.id);
      
      // Adiciona à fila de sincronização
      addToQueue({
        type: 'DELETE_TASK',
        data: { id: task.id },
        onSuccess: () => {
          setLoading(false);
        },
        onError: (error) => {
          // Em caso de erro, adicionamos a tarefa de volta (isso é simplificado)
          updateTask(task.id, { completed: task.done });
          showToast(`Erro ao excluir tarefa: ${error}`, 'error');
          setLoading(false);
        }
      });
    } catch (error) {
      showToast('Erro ao excluir tarefa', 'error');
      setLoading(false);
    }
  }, [task, deleteTask, addToQueue, updateTask, showToast]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Implementação de edição (pode ser adicionada posteriormente)
    showToast('Edição de tarefa: Em implementação', 'info');
  }, [showToast]);

  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(task.id);
    }
  }, [task.id, onSelect]);

  // Classe computada para o estado de seleção/conclusão
  const rowClass = useMemo(() => {
    return `relative flex items-start p-3 ${
      isSelected ? 'bg-dark-accent/40' : 'hover:bg-dark-accent/30'
    } ${
      task.done ? 'opacity-60' : ''
    } transition-all rounded-lg mb-2 cursor-pointer border border-transparent hover:border-primary/20`;
  }, [isSelected, task.done]);

  return (
    <div
      className={`relative p-3 border-b border-gray-200 dark:border-gray-700 flex items-start transition-colors ${
        task.done ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'
      } ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/50`}
      onClick={() => onSelect && onSelect(task.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={style}
    >
      <div className="flex-grow flex items-start">
        <button
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center ${
            task.done
              ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600'
              : 'border-gray-300 dark:border-gray-500 hover:border-green-400 dark:hover:border-green-400'
          }`}
          onClick={handleToggleDone}
          disabled={loading}
        >
          {task.done && <FiCheck size={12} className="text-white" />}
        </button>
        
        <div className="flex-grow">
          <h4 className={`font-medium ${task.done ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
            {task.title}
          </h4>
          
          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formattedDate && (
              <span className="flex items-center mr-3">
                <FiClock size={12} className="mr-1" />
                {formattedDate}
              </span>
            )}
            
            <span className="flex items-center opacity-70">
              <FiList size={12} className="mr-1" />
              {listName}
            </span>
          </div>
          
          <TagsList tags={task.tags} allTags={tags} />
        </div>
      </div>
      
      <div className="flex space-x-1">
        <button
          className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
          onClick={handleDelete}
          disabled={loading}
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
  );
});

TaskRow.displayName = 'TaskRow';

export default TaskRow; 