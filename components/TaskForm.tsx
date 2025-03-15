import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiCalendar, FiTag, FiFlag, FiAlertCircle, FiList, FiPlus, FiSave, FiCheck } from 'react-icons/fi';
import { Task, Subtask } from '../app/types';
import { useTaskContext } from '../app/context/TaskContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask?: Task | null;
}

const initialTask: Omit<Task, 'id' | 'createdAt'> = {
  title: '',
  description: '',
  completed: false,
  priority: 'média',
  tags: [],
  listId: 'default',
  subtasks: [],
  position: 0
};

// Animações
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const formVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 300
    }
  },
  exit: { 
    opacity: 0,
    y: 50,
    scale: 0.95,
    transition: { 
      duration: 0.2 
    }
  }
};

const TaskForm: React.FC<TaskFormProps> = ({ isOpen, onClose, editingTask }) => {
  const { lists, addTask, updateTask } = useTaskContext();
  const [formData, setFormData] = useState<Omit<Task, 'id' | 'createdAt'>>({ ...initialTask });
  const [tagInput, setTagInput] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description || '',
        completed: editingTask.completed,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate,
        tags: [...editingTask.tags],
        listId: editingTask.listId,
        subtasks: [...editingTask.subtasks],
        position: editingTask.position
      });
      if (editingTask.dueDate) {
        setDueDate(format(new Date(editingTask.dueDate), 'yyyy-MM-dd'));
      } else {
        setDueDate('');
      }
    } else {
      setFormData({ ...initialTask });
      setDueDate('');
    }

    // Focar no título ao abrir o formulário
    if (isOpen) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [editingTask, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpar erro quando o usuário começar a digitar
    if (error) setError(null);
  };

  const handlePriorityChange = (priority: 'baixa' | 'média' | 'alta') => {
    setFormData((prev) => ({
      ...prev,
      priority,
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setDueDate(dateValue);

    if (dateValue) {
      setFormData((prev) => ({
        ...prev,
        dueDate: new Date(dateValue),
      }));
    } else {
      setFormData((prev) => {
        const updatedTask = { ...prev };
        delete updatedTask.dueDate;
        return updatedTask;
      });
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tagInput.trim() === '') return;
    
    if (!formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
    }
    
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (subtaskInput.trim() === '') return;
    
    // Gerar um ID temporário para a subtarefa
    const newSubtask: Subtask = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: subtaskInput.trim(),
      completed: false,
      parent_id: editingTask?.id || '' // Se estiver editando, usar o ID da tarefa atual
    };
    
    setFormData((prev) => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), newSubtask],
    }));
    
    setSubtaskInput('');
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks?.filter((subtask) => subtask.id !== subtaskId) || [],
    }));
  };

  const handleToggleSubtaskCompletion = (subtaskId: string) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks?.map((subtask) => 
        subtask.id === subtaskId
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      ) || [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Por favor, digite um título para a tarefa');
      titleInputRef.current?.focus();
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editingTask) {
        updateTask(editingTask.id, { ...formData, createdAt: editingTask.createdAt });
      } else {
        addTask(formData);
      }
      resetForm();
      onClose();
    } catch (err) {
      setError('Ocorreu um erro ao salvar a tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ ...initialTask });
    setTagInput('');
    setDueDate('');
    setError(null);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            onClick={handleOverlayClick}
          />
          
          <motion.div
            className="fixed left-1/2 top-1/2 w-11/12 max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-dark-card p-5 z-50 border border-dark-accent shadow-xl"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={formVariants}
          >
            <div className="flex items-center justify-between border-b border-dark-accent pb-3">
              <h2 className="text-xl font-semibold">
                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-dark-accent hover:text-white"
                aria-label="Fechar"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <div className="rounded-md bg-rose-500/20 px-3 py-2 text-rose-300 text-sm mb-4">
                  <div className="flex items-center">
                    <FiAlertCircle className="mr-2 shrink-0" />
                    <p>{error}</p>
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                  Título*
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md bg-dark-input border border-dark-accent px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="O que precisa ser feito?"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md bg-dark-input border border-dark-accent px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Detalhes adicionais..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-300">
                    Prioridade
                  </label>
                  <div className="mt-1 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handlePriorityChange('baixa')}
                      className={`flex items-center rounded px-3 py-1.5 text-sm transition-colors ${formData.priority === 'baixa' ? 'bg-green-500/30 text-green-300' : 'bg-dark-accent text-gray-300 hover:bg-dark-accent/70'}`}
                    >
                      <FiFlag className={formData.priority === 'baixa' ? 'mr-1 text-green-400' : 'mr-1'} />
                      Baixa
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePriorityChange('média')}
                      className={`flex items-center rounded px-3 py-1.5 text-sm transition-colors ${formData.priority === 'média' ? 'bg-yellow-500/30 text-yellow-300' : 'bg-dark-accent text-gray-300 hover:bg-dark-accent/70'}`}
                    >
                      <FiFlag className={formData.priority === 'média' ? 'mr-1 text-yellow-400' : 'mr-1'} />
                      Média
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePriorityChange('alta')}
                      className={`flex items-center rounded px-3 py-1.5 text-sm transition-colors ${formData.priority === 'alta' ? 'bg-rose-500/30 text-rose-300' : 'bg-dark-accent text-gray-300 hover:bg-dark-accent/70'}`}
                    >
                      <FiFlag className={formData.priority === 'alta' ? 'mr-1 text-rose-400' : 'mr-1'} />
                      Alta
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300">
                    Data de vencimento
                  </label>
                  <div className="mt-1 flex">
                    <div className="relative flex-grow">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <FiCalendar className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="dueDate"
                        value={dueDate}
                        onChange={handleDateChange}
                        className="block w-full rounded-md bg-dark-input border border-dark-accent pl-10 pr-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {dueDate && (
                      <button
                        type="button"
                        onClick={() => setDueDate('')}
                        className="ml-2 rounded bg-dark-accent p-2 text-gray-300 hover:bg-dark-accent/70"
                        aria-label="Limpar data"
                      >
                        <FiX size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="listId" className="block text-sm font-medium text-gray-300">
                  Lista
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FiList className="text-gray-400" />
                  </div>
                  <select
                    id="listId"
                    name="listId"
                    value={formData.listId || 'default'}
                    onChange={handleChange}
                    className="block w-full rounded-md bg-dark-input border border-dark-accent pl-10 pr-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="default">Lista padrão</option>
                    {lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-300">
                  Tags
                </label>
                <div className="mt-1">
                  <div className="flex">
                    <div className="relative flex-grow">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <FiTag className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="tagInput"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(e);
                          }
                        }}
                        className="block w-full rounded-md bg-dark-input border border-dark-accent pl-10 pr-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Adicionar tag..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="ml-2 rounded bg-primary/80 p-2 text-white hover:bg-primary"
                      aria-label="Adicionar tag"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                  
                  {formData.tags && formData.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-dark-accent px-3 py-1 text-sm text-gray-300"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1.5 text-gray-400 hover:text-white"
                            aria-label={`Remover tag ${tag}`}
                          >
                            <FiX size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Subtarefas */}
              <div>
                <label htmlFor="subtasks" className="block text-sm font-medium text-gray-300">
                  Subtarefas
                </label>
                <div className="mt-1">
                  <div className="flex">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        id="subtaskInput"
                        value={subtaskInput}
                        onChange={(e) => setSubtaskInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtask(e);
                          }
                        }}
                        className="block w-full rounded-md bg-dark-input border border-dark-accent px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Adicionar subtarefa..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      className="ml-2 rounded bg-primary/80 p-2 text-white hover:bg-primary"
                      aria-label="Adicionar subtarefa"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                  
                  {formData.subtasks && formData.subtasks.length > 0 && (
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto rounded-md bg-dark-accent/30 p-2">
                      {formData.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSubtaskCompletion(subtask.id)}
                              className={`flex-shrink-0 w-4 h-4 rounded border ${
                                subtask.completed
                                  ? 'bg-green-500/30 border-green-500'
                                  : 'border-gray-600'
                              } flex items-center justify-center mr-2`}
                              aria-label={subtask.completed ? 'Marcar como não concluída' : 'Marcar como concluída'}
                            >
                              {subtask.completed && <FiCheck size={10} className="text-green-400" />}
                            </button>
                            <span className={`text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-200'}`}>
                              {subtask.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtask(subtask.id)}
                            className="text-gray-400 hover:text-rose-400"
                            aria-label="Remover subtarefa"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3 pt-3 border-t border-dark-accent">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded px-4 py-2 text-sm text-gray-300 bg-dark-accent hover:bg-dark-accent/70 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded bg-primary/80 px-4 py-2 text-sm text-white hover:bg-primary transition-colors flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-1" size={16} />
                      {editingTask ? 'Atualizar' : 'Salvar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskForm;