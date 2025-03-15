'use client';

import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { FiPlus, FiX, FiPackage, FiList, FiInbox, FiClock, FiPlay, FiCheck } from 'react-icons/fi';
import UserStoryCard from './UserStoryCard';
import { UserStory } from '../types';
import UserStoryForm from './UserStoryForm';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrumContext } from '../context/ScrumContext';

interface ScrumColumnProps {
  columnId: string;
  title: string;
  stories: UserStory[];
  onAddStory?: (story: UserStory) => void;
}

const ScrumColumn: React.FC<ScrumColumnProps> = ({ columnId, title, stories, onAddStory }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { setActiveDroppableId = () => {} } = useScrumContext();
  
  // Efeito para controlar a hidratação
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Configurar área onde é possível soltar
  const { isOver, setNodeRef } = useDroppable({
    id: columnId,
    data: {
      type: 'column',
      columnId
    }
  });
  
  // Obter a cor de fundo baseada na coluna
  const getBackgroundColor = () => {
    switch (columnId) {
      case 'productBacklog':
        return 'bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800';
      case 'sprintBacklog':
        return 'bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800';
      case 'inProgress':
        return 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800';
      case 'testing':
        return 'bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800';
      case 'done':
        return 'bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800';
      default:
        return 'bg-white dark:bg-gray-800';
    }
  };
  
  // Obter a cor do título baseada na coluna
  const getTitleColor = () => {
    switch (columnId) {
      case 'productBacklog':
        return 'bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent';
      case 'sprintBacklog':
        return 'bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-400 dark:to-indigo-500 bg-clip-text text-transparent';
      case 'inProgress':
        return 'bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent';
      case 'testing':
        return 'bg-gradient-to-r from-purple-600 to-purple-500 dark:from-purple-400 dark:to-purple-500 bg-clip-text text-transparent';
      case 'done':
        return 'bg-gradient-to-r from-green-600 to-green-500 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };
  
  // Obter ícone baseado na coluna
  const getColumnIcon = () => {
    switch (columnId) {
      case 'productBacklog':
        return <FiPackage size={16} className="mr-2 opacity-80" />;
      case 'sprintBacklog':
        return <FiList size={16} className="mr-2 opacity-80" />;
      case 'inProgress':
        return <FiPlay size={16} className="mr-2 opacity-80" />;
      case 'testing':
        return <FiClock size={16} className="mr-2 opacity-80" />;
      case 'done':
        return <FiCheck size={16} className="mr-2 opacity-80" />;
      default:
        return <FiList size={16} className="mr-2 opacity-80" />;
    }
  };
  
  // Função para renderizar o estado vazio com animação melhorada
  const renderEmptyState = () => {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center py-10 px-4 text-center"
        initial={{ opacity: 0.6, y: 10 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div 
          className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-white dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-inner mb-3"
          animate={{ 
            scale: isOver ? 1.1 : 1,
            boxShadow: isOver ? "0 0 12px rgba(99, 102, 241, 0.4)" : "inset 0 2px 4px rgba(0,0,0,0.1)" 
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <FiInbox size={24} className={`transition-all duration-300 ${isOver ? "text-indigo-400 dark:text-indigo-300" : "text-gray-400 dark:text-gray-500"}`} />
        </motion.div>
        <motion.p 
          className={`text-sm mb-1 font-medium transition-colors duration-300 ${isOver ? "text-indigo-600 dark:text-indigo-300" : "text-gray-500 dark:text-gray-400"}`}
        >
          {isOver ? "Solte aqui" : "Nenhuma história aqui"}
        </motion.p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          {columnId === 'productBacklog' && 'Adicione histórias ao backlog do produto'}
          {columnId === 'sprintBacklog' && 'Adicione histórias ao sprint atual'}
          {columnId === 'inProgress' && 'Arraste histórias para esta coluna'}
          {columnId === 'testing' && 'Mova histórias em teste para aqui'}
          {columnId === 'done' && 'Histórias concluídas aparecerão aqui'}
        </p>
        {(columnId === 'productBacklog' || columnId === 'sprintBacklog') && (
          <motion.button
            onClick={() => setShowAddForm(true)}
            className="text-xs px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiPlus size={12} className="mr-1" />
            Adicionar História
          </motion.button>
        )}
      </motion.div>
    );
  };
  
  // Renderizar um placeholder estático para o servidor e enquanto o componente não está montado no cliente
  if (!isMounted) {
    return (
      <div className={`flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-full ${getBackgroundColor()}`}>
        <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center">
            {getColumnIcon()}
            <h3 className={`font-medium text-sm ${getTitleColor()}`}>
              {title}
            </h3>
            <div className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300">
              {stories.length}
            </div>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto scrollbar-thin p-2 space-y-2">
          {stories.length > 0 ? (
            stories.map(story => (
              <div key={story.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-3">
                <h3 className="font-medium text-gray-800 dark:text-white mb-1.5">{story.title}</h3>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-white dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-inner mb-3"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">Nenhuma história aqui</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border shadow-sm h-full ${
        getBackgroundColor()
      }`}
      style={{
        width: '300px',
        minWidth: '300px',
        flex: '0 0 auto',
        borderColor: isOver 
          ? 'rgba(99, 102, 241, 0.8)' 
          : 'rgba(229, 231, 235, 1) dark:rgba(55, 65, 81, 1)',
        borderWidth: isOver ? '2px' : '1px',
        transition: 'border-color 0.2s ease, border-width 0.2s ease, transform 0.15s ease',
        position: 'relative',
        zIndex: isOver ? 10 : 1,
      }}
      animate={{
        scale: isOver ? 1.02 : 1,
        boxShadow: isOver 
          ? '0 8px 20px rgba(0, 0, 0, 0.12), 0 0 0 2px rgba(99, 102, 241, 0.3)' 
          : '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
      onMouseEnter={() => {
        setActiveDroppableId(columnId);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setActiveDroppableId(null);
        setIsHovered(false);
      }}
    >
      {/* Camada invisível para capturar o drop em toda a coluna */}
      {isOver && (
        <div 
          className="absolute inset-0 bg-transparent z-20 pointer-events-none"
          aria-hidden="true"
        />
      )}
      
      {/* Cabeçalho da coluna */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700/50 relative z-10">
        <div className="flex items-center">
          {getColumnIcon()}
          <h3 className={`font-medium text-sm ${getTitleColor()}`}>
            {title}
          </h3>
          <motion.div 
            className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300"
            animate={{ 
              backgroundColor: isOver ? 'rgba(99, 102, 241, 0.15)' : '',
              color: isOver ? 'rgba(99, 102, 241, 1)' : '' 
            }}
          >
            {stories.length}
          </motion.div>
        </div>
        
        {(columnId === 'productBacklog' || columnId === 'sprintBacklog') && (
          <motion.button
            onClick={() => setShowAddForm(true)}
            className={`p-1.5 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 
              ${isHovered ? 'opacity-100' : 'opacity-70'}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Adicionar história"
          >
            <FiPlus size={16} />
          </motion.button>
        )}
      </div>
      
      {/* Lista de histórias com animação de Framer Motion */}
      <motion.div 
        className="flex-grow overflow-y-auto scrollbar-thin p-2 space-y-2 relative z-10"
        animate={{ 
          backgroundColor: isOver ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
        }}
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence>
          {stories.length > 0 ? (
            stories.map(story => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 25,
                  delay: Math.random() * 0.1  // Escalonamento aleatório para efeito visual
                }}
              >
                <UserStoryCard 
                  story={story}
                  columnId={columnId}
                />
              </motion.div>
            ))
          ) : (
            renderEmptyState()
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Modal para adicionar história */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-800 dark:text-white">
                  Adicionar História ao {columnId === 'productBacklog' ? 'Backlog' : 'Sprint'}
                </h3>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FiX size={18} />
                </button>
              </div>
              
              <div className="p-4">
                <UserStoryForm
                  initialStatus={columnId === 'productBacklog' ? 'backlog' : columnId === 'sprintBacklog' ? 'selected' : columnId === 'inProgress' ? 'inProgress' : columnId === 'testing' ? 'testing' : columnId === 'done' ? 'done' : 'backlog'}
                  columnId={columnId}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ScrumColumn; 