'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiTag, FiUser, FiClock, FiFlag, FiCalendar, FiPlus, FiChevronDown, FiChevronUp, FiLink, FiSearch, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useScrumContext } from '../context/ScrumContext';
import { useTaskContext } from '../context/TaskContext';
import { useToast } from './Toast';
import { format } from 'date-fns';
import { UserStory } from '../types';

interface UserStoryFormProps {
  onClose?: () => void;
  onCancel?: () => void;
  onSubmit?: (story: UserStory) => void;
  storyToEdit?: UserStory;
  columnId?: string;
  onSave?: (story: UserStory) => void;
  initialStatus?: string;
}

const UserStoryForm: React.FC<UserStoryFormProps> = ({ 
  onClose, 
  onCancel,
  onSubmit,
  storyToEdit,
  columnId = 'productBacklog',
  onSave,
  initialStatus
}) => {
  const { 
    createUserStory, 
    updateUserStory, 
    sprints, 
    activeSprint 
  } = useScrumContext();
  
  const { tasks } = useTaskContext();
  const { showToast } = useToast();
  
  const isEditing = !!storyToEdit;
  
  // Definição de valores para pontos de história (Fibonacci)
  const storyPointOptions = [1, 2, 3, 5, 8, 13, 21];
  
  // Estado inicial para a história
  const [story, setStory] = useState<Partial<UserStory>>({
    title: '',
    description: '',
    priority: 'should',
    status: (initialStatus as 'backlog' | 'selected' | 'inProgress' | 'testing' | 'done') || 
            (columnId === 'productBacklog' ? 'backlog' : 'selected'),
    storyPoints: 3,
    sprintId: activeSprint?.id || '',
    taskIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    acceptanceCriteria: ['']
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>(['']);
  const [newCriteria, setNewCriteria] = useState<string>('');
  const [newTag, setNewTag] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  
  // Efeito para carregar dados quando o componente é montado ou a história editada muda
  useEffect(() => {
    // Se estiver editando, preencher o formulário com os dados da história
    if (storyToEdit) {
      setStory({
        ...storyToEdit,
        acceptanceCriteria: storyToEdit.acceptanceCriteria?.length ? storyToEdit.acceptanceCriteria : ['']
      });
      setSelectedTasks(storyToEdit.taskIds || []);
      setAcceptanceCriteria(storyToEdit.acceptanceCriteria?.length ? storyToEdit.acceptanceCriteria : ['']);
      setTags(storyToEdit.tags || []);
    }
    
    // Carregar tarefas disponíveis (que não estão associadas a outras histórias)
    const unassignedTasks = tasks.filter(task => 
      !task.userStoryId || (isEditing && task.userStoryId === storyToEdit.id)
    );
    setAvailableTasks(unassignedTasks);
    
  }, [storyToEdit, tasks, isEditing]);
  
  // Filtrar tarefas baseado no termo de busca
  const filteredTasks = availableTasks.filter(task => 
    task.title.toLowerCase().includes(taskSearchTerm.toLowerCase())
  );
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStory(prev => ({ ...prev, [name]: value }));
    
    // Limpar erros de validação quando o campo é alterado
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handlePointsChange = (value: number) => {
    // Permitir apenas valores da sequência de Fibonacci
    if (storyPointOptions.includes(value)) {
      setStory(prev => ({ ...prev, storyPoints: value }));
    }
  };
  
  const handleTaskToggle = (taskId: string) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    } else {
      setSelectedTasks(prev => [...prev, taskId]);
    }
  };
  
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!story.title?.trim()) {
      errors.title = 'O título da história é obrigatório';
    }
    
    if (!story.storyPoints || story.storyPoints < 1) {
      errors.storyPoints = 'Os pontos de história devem ser maiores que zero';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Mostrar mensagem de erro para o primeiro campo com erro
      const firstError = Object.values(validationErrors)[0];
      showToast(firstError, 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Determinar o status baseado na coluna ou initialStatus
      // Garantir que o status seja um dos valores aceitos pelo banco de dados
      let status = initialStatus || 
        (!storyToEdit ? 
        (columnId === 'productBacklog' ? 'backlog' : 'selected') : 
        storyToEdit.status);
      
      // Verificar se o status é válido
      const validStatuses = ['backlog', 'selected', 'inProgress', 'testing', 'done'];
      if (!validStatuses.includes(status)) {
        status = 'backlog'; // Valor padrão seguro
      }
      
      const completeStory = {
        ...story,
        status,
        taskIds: selectedTasks,
        acceptanceCriteria: acceptanceCriteria.filter(criteria => criteria.trim() !== ''),
        tags,
        updatedAt: new Date()
      } as UserStory;
      
      console.log('Story being submitted:', completeStory);
      
      let savedStory;
      
      if (storyToEdit) {
        savedStory = await updateUserStory(completeStory);
        showToast('História atualizada com sucesso', 'success');
      } else {
        savedStory = await createUserStory(completeStory, columnId);
        showToast('História criada com sucesso', 'success');
      }
      
      // Chamar apenas um callback na ordem de prioridade
      if (onSave && savedStory) {
        onSave(savedStory);
      } else if (onSubmit && savedStory) {
        onSubmit(savedStory);
      }
      
      // Chamar o callback de fechamento apropriado
      if (onClose) {
        onClose();
      } else if (onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error('Erro ao salvar história:', error);
      showToast('Erro ao salvar história. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddCriteria = () => {
    if (newCriteria.trim() !== '') {
      setAcceptanceCriteria([...acceptanceCriteria, newCriteria]);
      setNewCriteria('');
    }
  };
  
  const handleRemoveCriteria = (index: number) => {
    const newCriteria = [...acceptanceCriteria];
    newCriteria.splice(index, 1);
    setAcceptanceCriteria(newCriteria.length ? newCriteria : ['']);
  };
  
  const handleAddTag = () => {
    if (newTag.trim() !== '' && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };
  
  return (
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="bg-gray-900 rounded-lg shadow-lg w-full max-w-xl overflow-hidden text-gray-200"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
        <h2 className="text-xl font-semibold flex items-center text-white">
          <FiFlag className="mr-2 text-indigo-400" size={20} />
          {isEditing ? 'Editar História de Usuário' : 'Nova História de Usuário'}
        </h2>
        <button
          className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
          onClick={onClose || onCancel}
          aria-label="Fechar"
        >
          <FiX size={20} className="text-gray-400" />
        </button>
      </div>
      
      <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-5">
            <div>
              <label className="block mb-1 font-medium text-gray-300">
                Título <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={story.title || ''}
                onChange={handleChange}
                placeholder="Como um [usuário], eu quero [funcionalidade] para que [benefício]"
                className={`w-full px-3 py-2 border ${validationErrors.title ? 'border-red-500' : 'border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white`}
                autoFocus
              />
              {validationErrors.title && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.title}</p>
              )}
            </div>
            
            <div>
              <label className="block mb-1 font-medium text-gray-300">
                Descrição
              </label>
              <textarea
                name="description"
                value={story.description || ''}
                onChange={handleChange}
                placeholder="Detalhes adicionais sobre a história..."
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium text-gray-300">
                  Prioridade
                </label>
                <div className="relative">
                  <select
                    name="priority"
                    value={story.priority || 'should'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white appearance-none pr-10"
                  >
                    <option value="must">Must Have (Deve ter)</option>
                    <option value="should">Should Have (Deveria ter)</option>
                    <option value="could">Could Have (Poderia ter)</option>
                    <option value="wont">Won't Have (Não terá agora)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <FiChevronDown size={16} />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block mb-1 font-medium text-gray-300">
                  Pontos de História <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    name="storyPoints"
                    value={story.storyPoints?.toString() || '3'}
                    onChange={(e) => handlePointsChange(Number(e.target.value))}
                    className={`w-full px-3 py-2 border ${validationErrors.storyPoints ? 'border-red-500' : 'border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white appearance-none pr-10`}
                  >
                    {storyPointOptions.map(points => (
                      <option key={points} value={points}>{points}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <FiChevronDown size={16} />
                  </div>
                </div>
                {validationErrors.storyPoints && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.storyPoints}</p>
                )}
              </div>
              
              <div>
                <label className="block mb-1 font-medium text-gray-300">
                  Sprint
                </label>
                <div className="relative">
                  <select
                    name="sprintId"
                    value={story.sprintId || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white appearance-none pr-10"
                  >
                    <option value="">Sem sprint (Backlog)</option>
                    {sprints.map(sprint => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name} {sprint.isActive ? '(Ativo)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <FiChevronDown size={16} />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block mb-1 font-medium text-gray-300">
                  Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={story.status || 'backlog'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white appearance-none pr-10"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="selected">Selecionada</option>
                    <option value="inProgress">Em Progresso</option>
                    <option value="testing">Em Teste</option>
                    <option value="done">Concluída</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <FiChevronDown size={16} />
                  </div>
                </div>
              </div>
            </div>
            
            {availableTasks.length > 0 && (
              <div>
                <label className="block mb-2 font-medium text-gray-300 flex items-center">
                  <FiLink className="mr-1" size={16} />
                  Tarefas Relacionadas ({selectedTasks.length} selecionadas)
                </label>
                
                <div className="mb-2 relative">
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar tarefas..."
                    value={taskSearchTerm}
                    onChange={(e) => setTaskSearchTerm(e.target.value)}
                    className="pl-10 px-3 py-2 w-full border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                  />
                </div>
                
                <div className="max-h-40 overflow-y-auto border border-gray-600 rounded-md shadow-inner bg-gray-800">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map(task => (
                      <label 
                        key={task.id} 
                        className={`flex items-center p-2 ${selectedTasks.includes(task.id) ? 'bg-indigo-800' : ''} hover:bg-gray-700 border-b border-gray-700 cursor-pointer`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => handleTaskToggle(task.id)}
                          className="h-4 w-4 text-indigo-400 border-gray-600 rounded"
                        />
                        <div className="ml-2 flex-grow">
                          <span className={`text-gray-300 text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </span>
                          {task.priority && (
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                              task.priority === 'alta' ? 'bg-red-500 text-red-100' :
                              task.priority === 'média' ? 'bg-amber-500 text-amber-100' :
                              'bg-blue-500 text-blue-100'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-400">
                      Nenhuma tarefa encontrada {taskSearchTerm ? 'para esta busca' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                <FiCheckCircle className="mr-1" size={16} />
                Critérios de Aceitação
              </label>
              <div className="space-y-2">
                {acceptanceCriteria.map((criteria, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="text"
                      value={criteria}
                      onChange={(e) => {
                        const newCriteria = [...acceptanceCriteria];
                        newCriteria[index] = e.target.value;
                        setAcceptanceCriteria(newCriteria);
                      }}
                      placeholder={`Critério de aceitação #${index + 1}`}
                      className="px-3 py-2 flex-grow border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCriteria(index)}
                      className="ml-2 p-2 text-gray-400 hover:text-red-400"
                      aria-label="Remover critério"
                    >
                      <FiX size={18} className="text-gray-600" />
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newCriteria}
                    onChange={(e) => setNewCriteria(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddCriteria)}
                    placeholder="Adicionar novo critério..."
                    className="px-3 py-2 flex-grow border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCriteria}
                    className="ml-2 p-2 text-indigo-400 hover:text-indigo-300"
                    aria-label="Adicionar critério"
                  >
                    <FiPlus size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                <FiTag className="mr-1" size={16} />
                Tags
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map(tag => (
                    <span 
                      key={tag} 
                      className="bg-gray-800 text-gray-300 px-2 py-1 rounded-full text-sm flex items-center"
                    >
                      <FiTag size={12} className="mr-1" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-gray-400 hover:text-red-400"
                        aria-label="Remover tag"
                      >
                        <FiX size={14} className="text-gray-600" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">
                    Nenhuma tag adicionada
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleAddTag)}
                  placeholder="Adicionar nova tag..."
                  className="px-3 py-2 flex-grow border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="ml-2 p-2 text-indigo-400 hover:text-indigo-300"
                  aria-label="Adicionar tag"
                >
                  <FiPlus size={18} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3 sticky bottom-0 pt-3 pb-1 bg-gray-800 border-t border-gray-700">
            <button
              type="button"
              onClick={onCancel || onClose}
              className="px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  {isEditing ? 'Atualizar História' : 'Criar História'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default UserStoryForm; 