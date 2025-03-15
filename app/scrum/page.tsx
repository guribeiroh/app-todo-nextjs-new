'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrello, FiClock, FiInbox, FiBarChart2, FiArrowLeft, FiSettings } from 'react-icons/fi';
import { useScrumContext } from '../context/ScrumContext';
import dynamic from 'next/dynamic';
import { ScrumProvider } from '../context/ScrumContext';
import { ToastProvider } from '../components/Toast';

// Importação dinâmica para evitar erros de SSR
const DynamicReportsManager = dynamic(
  () => import('../components/ReportsManager'),
  { ssr: false }
);

const DynamicBacklogManager = dynamic(
  () => import('../components/BacklogManager'),
  { ssr: false }
);

const DynamicSprintManager = dynamic(
  () => import('../components/SprintManager'),
  { ssr: false }
);

// Carregamento dinâmico (apenas no cliente) do componente ScrumBoard
const ScrumBoard = dynamic(() => import('../components/ScrumBoard'), { 
  ssr: false, // Desabilitar SSR para este componente
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 mx-auto mb-4 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
        <p className="text-gray-600 dark:text-gray-400">Carregando quadro Scrum...</p>
      </div>
    </div>
  )
});

const ScrumPage: React.FC = () => {
  const { activeSprint } = useScrumContext();
  const [activeTab, setActiveTab] = useState<'board' | 'sprints' | 'backlog' | 'reports'>('board');
  
  // Variante para animação das tabs
  const tabVariants = {
    inactive: { opacity: 0.7, y: 0 },
    active: { opacity: 1, y: 0 },
    hover: { opacity: 1, y: -2 },
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col p-0 md:p-2">
      {/* Cabeçalho */}
      <header className="bg-white dark:bg-gray-800 rounded-t-lg md:rounded-lg shadow-sm p-3 md:mb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center">
            <Link href="/" className="mr-3">
              <motion.button 
                className="flex items-center justify-center p-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-100 dark:bg-gray-700 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiArrowLeft size={18} />
              </motion.button>
            </Link>
            <div className="flex items-center">
              <FiTrello className="text-indigo-500 mr-2" size={22} />
              <h1 className="text-lg font-bold text-gray-800 dark:text-white">Scrum Board</h1>
            </div>
            {activeSprint && (
              <span className="ml-3 px-2.5 py-0.5 bg-gradient-to-r from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium shadow-sm">
                Sprint: {activeSprint.name}
              </span>
            )}
          </div>
          
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg shadow-inner">
            <motion.button
              onClick={() => setActiveTab('board')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${
                activeTab === 'board'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
              variants={tabVariants}
              initial="inactive"
              animate={activeTab === 'board' ? 'active' : 'inactive'}
              whileHover="hover"
            >
              <FiTrello className="mr-1.5" size={15} />
              Quadro
            </motion.button>
            
            <motion.button
              onClick={() => setActiveTab('sprints')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${
                activeTab === 'sprints'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
              variants={tabVariants}
              initial="inactive"
              animate={activeTab === 'sprints' ? 'active' : 'inactive'}
              whileHover="hover"
            >
              <FiClock className="mr-1.5" size={15} />
              Sprints
            </motion.button>
            
            <motion.button
              onClick={() => setActiveTab('backlog')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${
                activeTab === 'backlog'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
              variants={tabVariants}
              initial="inactive"
              animate={activeTab === 'backlog' ? 'active' : 'inactive'}
              whileHover="hover"
            >
              <FiInbox className="mr-1.5" size={15} />
              Backlog
            </motion.button>
            
            <motion.button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${
                activeTab === 'reports'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
              variants={tabVariants}
              initial="inactive"
              animate={activeTab === 'reports' ? 'active' : 'inactive'}
              whileHover="hover"
            >
              <FiBarChart2 className="mr-1.5" size={15} />
              Relatórios
            </motion.button>
          </div>
        </div>
      </header>
      
      {/* Conteúdo principal */}
      <main className="flex-grow bg-white dark:bg-gray-800 rounded-b-lg md:rounded-lg shadow-sm">
        <ToastProvider>
          <ScrumProvider>
            <AnimatePresence mode="wait">
              {activeTab === 'board' && (
                <motion.div
                  key="board"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5rem)]"
                >
                  <ScrumBoard />
                </motion.div>
              )}
              
              {activeTab === 'sprints' && (
                <motion.div
                  key="sprints"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5rem)] overflow-auto"
                >
                  <DynamicSprintManager />
                </motion.div>
              )}
              
              {activeTab === 'backlog' && (
                <motion.div
                  key="backlog"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5rem)] overflow-auto"
                >
                  <DynamicBacklogManager />
                </motion.div>
              )}
              
              {activeTab === 'reports' && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5rem)] overflow-auto"
                >
                  <DynamicReportsManager />
                </motion.div>
              )}
            </AnimatePresence>
          </ScrumProvider>
        </ToastProvider>
      </main>
    </div>
  );
};

export default ScrumPage; 