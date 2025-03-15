'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiClock, FiTag, FiEdit2, FiTrash2, FiList, FiCheck, FiPlus, FiUser, FiStar, FiMoreVertical, FiAlertCircle, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { UserStory } from '../types';
import { useScrumContext } from '../context/ScrumContext';
import { useTaskContext } from '../context/TaskContext';
import { useToast } from './Toast';
import UserStoryForm from './UserStoryForm';
import { createPortal } from 'react-dom';

interface UserStoryCardProps {
  story: UserStory;
  columnId?: string;
  isDragging?: boolean;
}

const UserStoryCard: React.FC<UserStoryCardProps> = ({ story, columnId, isDragging }) => {
  const { deleteUserStory, updateUserStory, createUserStory, sprints } = useScrumContext();
  const { tasks } = useTaskContext();
  const { showToast } = useToast();
  
  const [showMenu, setShowMenu] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  // Efeito para controlar a hidratação
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Efeito para manipular o pressionamento da tecla Esc
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showEditForm) {
        setShowEditForm(false);
      }
    };

    // Adicionar listener quando o modal está aberto
    if (showEditForm) {
      document.addEventListener('keydown', handleEscKey);
    }

    // Remover listener quando o componente é desmontado ou o modal é fechado
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showEditForm]);
  
  // Configurar sortable para drag and drop com animações aprimoradas
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting
  } = useSortable({
    id: story.id,
    data: {
      type: 'story',
      story,
      columnId
    },
    transition: {
      duration: 250, // Reduzir a duração para maior responsividade
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }
  });
  
  // Decidir se está sendo arrastado (por prop ou por sortable)
  const isCurrentlyDragging = isDragging || isSorting;
  
  // Estilo para o cartão durante o arrasto com melhor feedback visual
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.6 : 1,
    zIndex: isCurrentlyDragging ? 999 : 1,
    boxShadow: isCurrentlyDragging 
      ? '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(99, 102, 241, 0.3)' 
      : isHovered 
        ? '0 4px 12px rgba(0, 0, 0, 0.1)' 
        : '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: isCurrentlyDragging ? 'grabbing' : 'grab',
    touchAction: 'none', // Importante para touch screens
  }), [transform, transition, isCurrentlyDragging, isHovered]);
  
  // Obter as tarefas associadas à história
  const storyTasks = tasks.filter(task => task.userStoryId === story.id);
  const completedTasks = storyTasks.filter(task => task.completed);
  const hasCompletedTasks = completedTasks.length > 0;
  const allTasksCompleted = storyTasks.length > 0 && completedTasks.length === storyTasks.length;
  
  // Encontrar a Sprint a que esta história pertence
  const storySprintName = useMemo(() => {
    if (!story.sprintId) return null;
    const sprint = sprints.find(s => s.id === story.sprintId);
    return sprint?.name || null;
  }, [story.sprintId, sprints]);
  
  // Obter cor com base na prioridade
  const getPriorityColor = () => {
    switch (story.priority) {
      case 'must':
        return 'bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20 text-red-800 dark:text-red-300';
      case 'should':
        return 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20 text-amber-800 dark:text-amber-300';
      case 'could':
        return 'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 text-blue-800 dark:text-blue-300';
      case 'wont':
        return 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-700/70 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-700/70 text-gray-800 dark:text-gray-300';
    }
  };
  
  // Obter ícone com base na prioridade
  const getPriorityIcon = () => {
    switch (story.priority) {
      case 'must':
        return <FiAlertCircle className="mr-1" size={10} />;
      case 'should':
        return <FiStar className="mr-1" size={10} />;
      case 'could':
        return <FiStar className="mr-1" size={10} />;
      case 'wont':
        return <FiClock className="mr-1" size={10} />;
      default:
        return <FiStar className="mr-1" size={10} />;
    }
  };
  
  // Obter texto para a prioridade
  const getPriorityText = () => {
    switch (story.priority) {
      case 'must': return 'Must';
      case 'should': return 'Should';
      case 'could': return 'Could';
      case 'wont': return "Won't";
      default: return story.priority;
    }
  };
  
  // Cor de borda com base na coluna
  const getColumnBorderColor = () => {
    if (!columnId) return 'border-gray-200 dark:border-gray-700';
    
    switch (columnId) {
      case 'productBacklog':
        return 'border-blue-200 dark:border-blue-700/30';
      case 'sprintBacklog':
        return 'border-indigo-200 dark:border-indigo-700/30';
      case 'inProgress':
        return 'border-amber-200 dark:border-amber-700/30';
      case 'testing':
        return 'border-purple-200 dark:border-purple-700/30';
      case 'done':
        return 'border-green-200 dark:border-green-700/30';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };
  
  // Manipuladores de eventos
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    if (window.confirm(`Tem certeza que deseja excluir a história "${story.title}"?`)) {
      try {
        await deleteUserStory(story.id);
        showToast('História excluída com sucesso', 'success');
      } catch (error) {
        showToast('Erro ao excluir história', 'error');
      }
    }
  };
  
  const handleCompletedToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const newStatus = story.status === 'done' ? 'inProgress' : 'done';
      await updateUserStory({
        ...story,
        status: newStatus,
        completedAt: newStatus === 'done' ? new Date() : undefined
      });
      showToast(`História marcada como ${newStatus === 'done' ? 'concluída' : 'em andamento'}`, 'success');
    } catch (error) {
      showToast('Erro ao atualizar status da história', 'error');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    console.log('Abrindo modal de edição para história:', story.title);
    setShowEditForm(true);
    console.log('Estado showEditForm após atualização:', true);
    setTimeout(() => {
      console.log('Estado showEditForm após timeout:', showEditForm);
    }, 100);
  };

  const handleSaveEdit = async (updatedStory: UserStory) => {
    try {
      await updateUserStory(updatedStory);
      showToast('História atualizada com sucesso', 'success');
      setShowEditForm(false);
    } catch (error) {
      showToast('Erro ao atualizar história', 'error');
    }
  };
  
  // Renderizar um placeholder estático para o servidor
  if (!isMounted) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
          <div className="flex justify-between">
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Renderizar o modal de edição
  const renderEditFormModal = () => {
    if (!showEditForm || typeof window === 'undefined') return null;
    
    return createPortal(
      <div 
        className="fixed inset-0 bg-black/80 z-[9999]" 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backdropFilter: 'blur(4px)'
        }}
      >
        <div className="absolute top-0 right-0 p-4">
          <button
            onClick={() => setShowEditForm(false)}
            className="text-white hover:text-gray-200 p-2 rounded-full"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <UserStoryForm
            storyToEdit={story}
            onSave={handleSaveEdit}
            onClose={() => setShowEditForm(false)}
            onCancel={() => setShowEditForm(false)}
            columnId={columnId}
          />
        </div>
      </div>,
      document.body
    );
  };
  
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white dark:bg-gray-800 
        rounded-lg p-3 
        border-l-4 ${getColumnBorderColor()} 
        border-t border-r border-b border-gray-200 dark:border-gray-700 
        ${isCurrentlyDragging ? 'cursor-grabbing' : 'cursor-grab'}
        transition-all duration-200
        touch-manipulation
      `}
      whileHover={{
        y: -3,
        boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
        borderColor: 'rgba(99, 102, 241, 0.4)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ scale: 0.98, opacity: 0.8 }}
      animate={{ 
        scale: isCurrentlyDragging ? 1.05 : 1, 
        opacity: isCurrentlyDragging ? 0.8 : 1,
        rotate: isCurrentlyDragging ? '1deg' : '0deg',
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25
      }}
      {...attributes}
      {...listeners}
    >
      <div 
        className="absolute inset-0 z-10"
        {...attributes}
        {...listeners}
        aria-hidden="true"
        style={{ touchAction: 'none' }}
      />
      
      {/* Conteúdo do card */}
      <div className="relative z-20 pointer-events-none">
        {/* Cabeçalho com título */}
        <div className="flex justify-between mb-2">
          <h3 className="font-medium text-gray-800 dark:text-white line-clamp-2 text-sm">
            {story.title}
          </h3>
          
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-full pointer-events-auto"
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiMoreVertical size={14} />
          </motion.button>
        </div>
        
        {/* Conteúdo da história */}
        {story.description && (
          <p className="text-gray-600 dark:text-gray-300 text-xs mb-3 line-clamp-2">
            {story.description}
          </p>
        )}
        
        {/* Metadados da história */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center">
            <motion.div
              className={`flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor()}`}
              whileHover={{ scale: 1.05 }}
              animate={isCurrentlyDragging ? { scale: 1.1 } : {}}
            >
              {getPriorityIcon()}
              <span>{getPriorityText()}</span>
            </motion.div>
            
            {storySprintName && (
              <div className="ml-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                <FiClock size={10} className="mr-1" />
                <span className="truncate max-w-[70px]">{storySprintName}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {storyTasks.length > 0 && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mr-2">
                <FiList size={10} className="mr-1" />
                <span>{completedTasks.length}/{storyTasks.length}</span>
              </div>
            )}
            
            {story.storyPoints > 0 && (
              <motion.div 
                className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-xs font-medium text-indigo-700 dark:text-indigo-300"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                animate={isCurrentlyDragging ? { scale: 1.1 } : {}}
              >
                {story.storyPoints}
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      {/* Menu de ações com pointer-events ativado */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            className="absolute z-50 right-2 mt-0 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700 pointer-events-auto"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-1">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(e);
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-md"
                whileHover={{ x: 2 }}
              >
                <FiEdit2 size={14} className="mr-2" />
                Editar
              </motion.button>
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(e);
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 rounded-md"
                whileHover={{ x: 2 }}
              >
                <FiTrash2 size={14} className="mr-2" />
                Excluir
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal de edição */}
      <AnimatePresence>
        {showEditForm && renderEditFormModal()}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserStoryCard; 