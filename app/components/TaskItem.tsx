import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { Task, Subtask } from '../types';
import { useTaskContext } from '../context/TaskContext';
import { 
  FiCalendar, FiCheck, FiX, FiPlus, FiChevronDown, FiChevronUp, 
  FiEdit, FiTrash, FiTag, FiList, FiClock, FiFlag, FiAlertCircle, 
  FiAlertTriangle, FiMoreVertical, FiBookmark 
} from 'react-icons/fi';
import SyncIndicator from './SyncIndicator';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskItemProps {
  task: Task;
}

// Usando memo para evitar re-renderizações desnecessárias
export const TaskItem: React.FC<TaskItemProps> = memo(({ task }) => {
  const { toggleTaskCompletion, deleteTask, updateTask, addSubtask, toggleSubtaskCompletion, deleteSubtask } = useTaskContext();
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [editTaskData, setEditTaskData] = useState({
    title: task.title,
    description: task.description || '',
  });
  const taskRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Fechar o menu de ações ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Efeito para animação ao montar
  useEffect(() => {
    if (taskRef.current) {
      taskRef.current.classList.add('animate-fade-in');
      setTimeout(() => {
        if (taskRef.current) {
          taskRef.current.classList.remove('animate-fade-in');
        }
      }, 300);
    }
  }, []);

  // Formatação da data com useCallback
  const formatDate = useCallback((date: Date | undefined) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  }, []);

  // Verificar se a data de vencimento está próxima - memoizado
  const isDateSoon = useCallback((date: Date | undefined) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    return diffDays >= 0 && diffDays <= 2;
  }, []);

  // Verificar se a tarefa está atrasada - memoizado
  const isOverdue = useCallback((date: Date | undefined) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    return dueDate < today && !task.completed;
  }, [task.completed]);

  // Handler para submeter uma nova subtarefa - memoizado
  const handleSubmitSubtask = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      addSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    }
  }, [addSubtask, task.id, newSubtaskTitle]);

  // Handler para atualizar tarefa - memoizado
  const handleUpdateTask = useCallback(() => {
    if (editTaskData.title.trim()) {
      updateTask(task.id, {
        title: editTaskData.title,
        description: editTaskData.description
      });
      setIsEditing(false);
    }
  }, [updateTask, task.id, editTaskData]);

  // Obter classes de estilo para prioridade - memoizado
  const priorityClasses = useMemo(() => {
    switch (task.priority) {
      case 'alta':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'média':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'baixa':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  }, [task.priority]);

  // Obter ícone para prioridade - memoizado
  const getPriorityIcon = useMemo(() => {
    switch (task.priority) {
      case 'alta':
        return <FiAlertCircle className="mr-1" />;
      case 'média':
        return <FiFlag className="mr-1" />;
      case 'baixa':
        return <FiBookmark className="mr-1" />;
      default:
        return <FiFlag className="mr-1" />;
    }
  }, [task.priority]);

  // Obter tradução da prioridade - memoizado
  const priorityTranslation = useMemo(() => {
    switch (task.priority) {
      case 'alta':
        return 'Alta';
      case 'média':
        return 'Média';
      case 'baixa':
        return 'Baixa';
      default:
        return 'Normal';
    }
  }, [task.priority]);

  // Memoizar handlers de eventos para evitar recriação em cada renderização
  const handleToggleCompletion = useCallback(() => {
    toggleTaskCompletion(task.id);
  }, [toggleTaskCompletion, task.id]);

  const handleDeleteTask = useCallback(() => {
    if (window.confirm(`Tem certeza que deseja excluir a tarefa "${task.title}"?`)) {
      deleteTask(task.id);
    }
  }, [deleteTask, task.id, task.title]);

  const handleToggleSubtasks = useCallback(() => {
    setShowSubtasks(prev => !prev);
  }, []);

  const handleToggleEditing = useCallback(() => {
    setIsEditing(prev => !prev);
    if (!isEditing) {
      // Resetar dados de edição para os valores atuais da tarefa
      setEditTaskData({
        title: task.title,
        description: task.description || '',
      });
    }
  }, [isEditing, task.title, task.description]);

  const handleNewSubtaskChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSubtaskTitle(e.target.value);
  }, []);

  // Memoizar a contagem de subtarefas concluídas
  const completedSubtasksCount = useMemo(() => {
    return task.subtasks ? task.subtasks.filter(subtask => subtask.completed).length : 0;
  }, [task.subtasks]);

  // Verificar se há data de vencimento e seu status - memoizado
  const dueDateStatus = useMemo(() => {
    if (!task.dueDate) return null;
    
    return {
      isOverdue: isOverdue(task.dueDate),
      isSoon: isDateSoon(task.dueDate),
      formattedDate: formatDate(task.dueDate)
    };
  }, [task.dueDate, isOverdue, isDateSoon, formatDate]);

  // Obter a borda com base na prioridade
  const priorityBorderClass = useMemo(() => {
    if (task.completed) return 'border-l-green-500 dark:border-l-green-600';
    
    switch (task.priority) {
      case 'alta':
        return 'border-l-red-500 dark:border-l-red-600';
      case 'média':
        return 'border-l-yellow-500 dark:border-l-yellow-600';
      case 'baixa':
        return 'border-l-green-500 dark:border-l-green-600';
      default:
        return 'border-l-gray-300 dark:border-l-gray-600';
    }
  }, [task.priority, task.completed]);

  // Obter a cor de fundo com base no status de hover e concluído
  const backgroundColor = useMemo(() => {
    if (task.completed) return 'bg-gray-50 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75';
    if (isHovering) return 'bg-indigo-50 dark:bg-indigo-900/10';
    return 'bg-white dark:bg-gray-800';
  }, [task.completed, isHovering]);

  return (
    <motion.div 
      ref={taskRef}
      className={`card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 transform ${backgroundColor} ${priorityBorderClass} border-l-4`}
      layout
      whileHover={{ 
        scale: 1.01,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
      onMouseEnter={() => setIsHovering(true)} 
      onMouseLeave={() => setIsHovering(false)}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {isEditing ? (
        <div className="p-4 animate-fade-in">
          <input
            type="text"
            className="w-full p-2 mb-2 rounded-md border dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={editTaskData.title}
            onChange={(e) => setEditTaskData({...editTaskData, title: e.target.value})}
            placeholder="Título da tarefa"
            autoFocus
          />
          <textarea
            className="w-full p-2 mb-2 rounded-md border dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px]"
            value={editTaskData.description}
            onChange={(e) => setEditTaskData({...editTaskData, description: e.target.value})}
            placeholder="Descrição (opcional)"
            rows={3}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-gray-700 dark:text-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdateTask}
              className="px-3 py-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-grow">
                <button
                  onClick={handleToggleCompletion}
                  className={`flex-shrink-0 w-6 h-6 mr-3 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.completed 
                      ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600' 
                      : 'border-gray-300 dark:border-gray-500 hover:border-indigo-500 dark:hover:border-indigo-400'
                  }`}
                  aria-label={task.completed ? "Marcar como não concluída" : "Marcar como concluída"}
                >
                  {task.completed && <FiCheck className="text-white" />}
                </button>
                
                <div className="flex-grow">
                  <h3 
                    className={`text-lg font-medium ${
                      task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100'
                    }`}
                  >
                    {task.title}
                  </h3>
                  
                  {task.description && (
                    <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center ml-2 relative" ref={actionsRef}>
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1.5 text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  aria-label="Opções da tarefa"
                >
                  <FiMoreVertical size={16} />
                </button>
                
                <AnimatePresence>
                  {showActions && (
                    <motion.div 
                      className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-10"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="py-1">
                        <button
                          onClick={handleToggleEditing}
                          className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiEdit className="mr-2" size={14} /> Editar tarefa
                        </button>
                        <button
                          onClick={handleToggleCompletion}
                          className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiCheck className="mr-2" size={14} /> 
                          {task.completed ? 'Desmarcar como concluída' : 'Marcar como concluída'}
                        </button>
                        <button
                          onClick={handleDeleteTask}
                          className="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiTrash className="mr-2" size={14} /> Excluir tarefa
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center mt-3 gap-1.5">
              {/* Indicador de prioridade */}
              <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full border ${priorityClasses}`}>
                {getPriorityIcon}
                {priorityTranslation}
              </span>
              
              {/* Data de vencimento */}
              {task.dueDate && (
                <span 
                  className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full border ${
                    task.completed 
                      ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600' 
                      : isOverdue(task.dueDate)
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700' 
                        : isDateSoon(task.dueDate)
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {isOverdue(task.dueDate) ? (
                    <FiAlertTriangle className="mr-1 text-red-500" />
                  ) : (
                    <FiCalendar className="mr-1" />
                  )}
                  {formatDate(task.dueDate)}
                </span>
              )}
              
              {/* Etiquetas */}
              {task.tags?.length > 0 && (
                <div className="flex items-center flex-wrap gap-1">
                  {task.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-1 rounded-full border border-indigo-300 dark:border-indigo-700"
                    >
                      <FiTag className="mr-1" size={10} />
                      {tag}
                    </span>
                  ))}
                  {task.tags.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                      +{task.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
              
              {/* Contador de subtarefas */}
              {task.subtasks.length > 0 && (
                <button
                  onClick={handleToggleSubtasks}
                  className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                >
                  {showSubtasks ? <FiChevronUp className="mr-1" size={12} /> : <FiChevronDown className="mr-1" size={12} />}
                  {completedSubtasksCount}/{task.subtasks.length}
                </button>
              )}
            </div>
          </div>

          {/* Subtarefas */}
          <AnimatePresence>
            {showSubtasks && task.subtasks.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 pt-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/90">
                  <div className="pl-9 space-y-1">
                    {task.subtasks.map(subtask => (
                      <SubtaskItem
                        key={subtask.id}
                        subtask={subtask}
                        taskId={task.id}
                        toggleSubtask={toggleSubtaskCompletion}
                        deleteSubtask={deleteSubtask}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Formulário para adicionar subtarefa */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmitSubtask} className="flex items-center pl-9">
              <input
                type="text"
                placeholder="Adicionar subtarefa..."
                value={newSubtaskTitle}
                onChange={handleNewSubtaskChange}
                className="flex-grow p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-l-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                className="bg-indigo-500 text-white p-1.5 rounded-r-md hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newSubtaskTitle.trim()}
              >
                <FiPlus size={16} />
              </button>
            </form>
          </div>
        </>
      )}
      
      <SyncIndicator itemId={task.id} itemType="task" />
    </motion.div>
  );
});

TaskItem.displayName = 'TaskItem';

interface SubtaskItemProps {
  subtask: Subtask;
  taskId: string;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
}

// Memoizar o componente de subtarefa para evitar renderizações desnecessárias
const SubtaskItem: React.FC<SubtaskItemProps> = memo(({ subtask, taskId, toggleSubtask, deleteSubtask }) => {
  // Estado para animação de hover
  const [isHovering, setIsHovering] = useState(false);
  
  // Handlers memoizados com useCallback
  const handleToggleSubtask = useCallback(() => {
    toggleSubtask(taskId, subtask.id);
  }, [toggleSubtask, taskId, subtask.id]);

  const handleDeleteSubtask = useCallback(() => {
    deleteSubtask(taskId, subtask.id);
  }, [deleteSubtask, taskId, subtask.id]);

  return (
    <motion.div 
      className={`flex items-center justify-between py-1.5 rounded-md ${
        isHovering ? 'bg-gray-100 dark:bg-gray-800' : ''
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center flex-grow">
        <button
          onClick={handleToggleSubtask}
          className={`flex-shrink-0 w-4 h-4 mr-2 rounded-full border flex items-center justify-center transition-colors ${
            subtask.completed 
              ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600' 
              : 'border-gray-300 dark:border-gray-500 hover:border-indigo-500 dark:hover:border-indigo-400'
          }`}
          aria-label={subtask.completed ? "Marcar como não concluída" : "Marcar como concluída"}
        >
          {subtask.completed && <FiCheck className="text-white text-xs" />}
        </button>
        <span
          className={`text-sm ${
            subtask.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'
          }`}
        >
          {subtask.title}
        </span>
      </div>
      
      <AnimatePresence>
        {isHovering && (
          <motion.button
            onClick={handleDeleteSubtask}
            className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            aria-label="Excluir subtarefa"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <FiX size={14} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

SubtaskItem.displayName = 'SubtaskItem'; 