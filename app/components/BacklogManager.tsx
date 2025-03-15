'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiList, FiPlus, FiFilter, FiSearch, FiTag, FiAlertTriangle, FiStar, FiEdit, FiTrash2, FiClock, FiInbox, FiX } from 'react-icons/fi';
import { useScrumContext } from '../context/ScrumContext';
import { UserStory } from '../types';
import { useToast } from './Toast';
import UserStoryForm from './UserStoryForm';

interface BacklogManagerProps {
  onClose?: () => void;
}

const BacklogManager: React.FC<BacklogManagerProps> = ({ onClose }) => {
  const scrumContext = useScrumContext();
  const { userStories, sprints, updateUserStory, deleteUserStory } = scrumContext;
  const createUserStory = scrumContext.createUserStory;
  const { showToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStory | null>(null);
  
  // Histórias no backlog são aquelas sem sprintId
  const backlogStories = userStories.filter(story => !story.sprintId);
  
  // Filtrar histórias
  const filteredStories = backlogStories.filter(story => {
    const matchesSearch = searchTerm === '' || 
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (story.description && story.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPriority = priorityFilter === 'all' || story.priority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  });
  
  // Ordenar por prioridade e depois por pontos
  const sortedStories = [...filteredStories].sort((a, b) => {
    const priorityOrder = { must: 0, should: 1, could: 2, wont: 3 };
    const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 999;
    const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 999;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    return (b.storyPoints || 0) - (a.storyPoints || 0);
  });
  
  const handleAddStory = () => {
    setEditingStory(null);
    setShowForm(true);
  };
  
  const handleEditStory = (story: UserStory) => {
    setEditingStory(story);
    setShowForm(true);
  };
  
  const handleDeleteStory = async (storyId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta história de usuário?')) {
      await deleteUserStory(storyId);
      showToast('História de usuário excluída com sucesso', 'success');
    }
  };
  
  const handleSaveStory = async (story: UserStory) => {
    try {
      if (story.id) {
        await updateUserStory(story);
        showToast('História de usuário atualizada com sucesso', 'success');
      } else {
        await createUserStory(story);
        showToast('História de usuário adicionada com sucesso', 'success');
      }
      setShowForm(false);
    } catch (error) {
      showToast('Erro ao salvar história de usuário', 'error');
    }
  };
  
  const getPriorityLabel = (priority: string) => {
    const labels = {
      must: 'Must Have',
      should: 'Should Have',
      could: 'Could Have',
      wont: "Won't Have"
    };
    return labels[priority as keyof typeof labels] || priority;
  };
  
  const getPriorityColor = (priority: string) => {
    const colors = {
      must: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      should: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      could: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      wont: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    };
    return colors[priority as keyof typeof colors] || '';
  };
  
  const getPriorityIcon = (priority: string) => {
    const icons = {
      must: <FiStar size={14} className="text-red-500" />,
      should: <FiStar size={14} className="text-amber-500" />,
      could: <FiStar size={14} className="text-blue-500" />,
      wont: <FiStar size={14} className="text-gray-500" />
    };
    return icons[priority as keyof typeof icons] || null;
  };
  
  const getPriorityText = (priority: string) => {
    const texts = {
      must: 'Must',
      should: 'Should',
      could: 'Could',
      wont: "Won't"
    };
    return texts[priority as keyof typeof texts] || priority;
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Cabeçalho */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center">
          <FiList size={20} className="text-indigo-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Backlog do Produto</h2>
          <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
            {sortedStories.length} {sortedStories.length === 1 ? 'história' : 'histórias'}
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 dark:text-gray-500" size={16} />
            </div>
            <input
              type="text"
              placeholder="Buscar histórias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-1.5 pl-9 pr-3 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            />
          </div>
          
          <div className="flex space-x-1">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            >
              <option value="all">Todas prioridades</option>
              <option value="must">Must</option>
              <option value="should">Should</option>
              <option value="could">Could</option>
              <option value="wont">Won't</option>
            </select>
            
            <button
              onClick={() => {
                setEditingStory(null);
                setShowForm(true);
              }}
              className="flex items-center px-3 py-1.5 rounded-md bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
            >
              <FiPlus size={16} className="mr-1.5" />
              Nova História
            </button>
          </div>
        </div>
      </div>
      
      {/* Lista de histórias */}
      <div className="flex-grow overflow-y-auto p-2">
        {sortedStories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <FiInbox size={28} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              {searchTerm || priorityFilter !== 'all' 
                ? 'Nenhuma história encontrada' 
                : 'Backlog vazio'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4">
              {searchTerm || priorityFilter !== 'all' 
                ? 'Tente alterar os filtros ou os termos de busca.' 
                : 'Crie histórias de usuário para o seu produto e organize-as aqui.'}
            </p>
            {!(searchTerm || priorityFilter !== 'all') && (
              <button
                onClick={() => {
                  setEditingStory(null);
                  setShowForm(true);
                }}
                className="flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <FiPlus size={18} className="mr-2" />
                Adicionar primeira história
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedStories.map(story => (
              <div 
                key={story.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setEditingStory(story);
                  setShowForm(true);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(story.priority)}`}>
                    {getPriorityIcon(story.priority)}
                    {getPriorityText(story.priority)}
                  </span>
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs text-gray-600 dark:text-gray-400">
                    {story.storyPoints || 0} pts
                  </span>
                </div>
                
                <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-1 line-clamp-2">{story.title}</h3>
                
                {story.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{story.description}</p>
                )}
                
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <FiClock size={12} className="mr-1" />
                    {new Date(story.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingStory(story);
                        setShowForm(true);
                      }}
                      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FiEdit size={14} className="text-blue-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStory(story.id);
                      }}
                      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FiTrash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal para adicionar/editar história */}
      <AnimatePresence>
        {showForm && (
          <UserStoryForm
            storyToEdit={editingStory}
            onSave={handleSaveStory}
            onClose={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
            columnId="productBacklog"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BacklogManager; 