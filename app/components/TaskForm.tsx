import React, { useState, useEffect } from 'react';
import { FiCalendar, FiPlus, FiX } from 'react-icons/fi';
import { useTaskContext } from '../context/TaskContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export const TaskForm: React.FC = () => {
  const { addTask, lists, filter } = useTaskContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<'baixa' | 'média' | 'alta'>('média');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [listId, setListId] = useState(lists[0]?.id || 'default');
  const [isExpanded, setIsExpanded] = useState(false);

  // Definir automaticamente a lista selecionada quando o filtro de lista mudar
  useEffect(() => {
    if (filter.listId !== 'todas') {
      setListId(filter.listId);
    }
  }, [filter.listId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    addTask({
      title: title.trim(),
      description: description.trim(),
      completed: false,
      dueDate: dueDate,
      priority,
      tags,
      listId,
    });
    
    // Limpar o formulário
    resetForm();
    
    // Recolher o formulário após envio
    setIsExpanded(false);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(null);
    setPriority('média');
    setTags([]);
    setTagInput('');
  };

  // Expandir o formulário quando o usuário começar a digitar
  const handleTitleFocus = () => {
    setIsExpanded(true);
  };

  // Definir atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+N para focar no formulário de nova tarefa
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        document.getElementById('task-title-input')?.focus();
      }
      
      // Alt+C para limpar o formulário
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        resetForm();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Adicionar nova tarefa..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={handleTitleFocus}
            className="flex-grow px-3 py-2 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button 
            type="submit" 
            className="ml-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md focus:outline-none"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        </div>
        
        {isExpanded && (
          <div className="space-y-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                rows={3}
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 
                  rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Vencimento
                </label>
                <div className="relative">
                  <DatePicker
                    selected={dueDate}
                    onChange={(date: Date) => setDueDate(date)}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Selecionar data"
                    className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 
                      rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  />
                  <FiCalendar className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'baixa' | 'média' | 'alta')}
                  className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 
                    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                >
                  <option value="baixa">Baixa</option>
                  <option value="média">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lista
              </label>
              <select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 
                  rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 
                      px-2 py-1 rounded-md text-sm"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Evitar propagação do evento
                        removeTag(tag);
                      }}
                      className="ml-1 p-0.5 text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Adicionar tags (pressione Enter)"
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 
                  rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Pressione Enter para adicionar cada tag
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-grow py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors
                  flex items-center justify-center"
              >
                <FiPlus className="mr-2" size={16} />
                Adicionar Tarefa
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                  hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                  hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Recolher
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}; 