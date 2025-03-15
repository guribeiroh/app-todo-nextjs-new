import React, { useState, useEffect } from 'react';
import { FiMenu, FiX, FiMoon, FiSun, FiSearch, FiActivity, FiBell, FiUser, FiList, FiColumns } from 'react-icons/fi';
import { IoStatsChart } from 'react-icons/io5';
import { useTaskContext } from '../app/context/TaskContext';
import { motion } from 'framer-motion';

interface HeaderProps {
  toggleSidebar: () => void;
  showPomodoroTimer: () => void;
  showExport: () => void;
  showTags: () => void;
  showFeedback: () => void;
  showOverview: () => void;
  onOpenNotificationSettings: () => void;
  onShowProductivityInsights: () => void;
  pendingNotificationCount: number;
  viewMode?: 'list' | 'kanban';
  onChangeViewMode?: (mode: 'list' | 'kanban') => void;
}

const Header: React.FC<HeaderProps> = ({
  toggleSidebar,
  showPomodoroTimer,
  showExport,
  showTags,
  showFeedback,
  showOverview,
  onOpenNotificationSettings,
  onShowProductivityInsights,
  pendingNotificationCount,
  viewMode = 'list',
  onChangeViewMode
}) => {
  const [darkMode, setDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const { setFilter, tasks } = useTaskContext();
  const pendingTasksCount = tasks ? tasks.filter(task => !task.completed).length : 0;

  // Detectar scroll para aplicar efeitos visuais
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter({
      status: 'todas',
      priority: 'todas',
      listId: 'todas',
      searchTerm: searchTerm,
      tags: []
    });
  };

  return (
    <header 
      className={`bg-dark-primary py-3 px-4 flex items-center justify-between transition-all duration-300 ${
        isScrolled ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="btn-icon mr-3"
          aria-label="Abrir menu"
        >
          <FiMenu size={24} />
        </button>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          NeoTask
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Alternador de visualização melhorado */}
        {onChangeViewMode && (
          <div className="relative bg-dark-primary/80 p-1 rounded-xl shadow-inner flex items-center">
            <div 
              className="absolute h-7 transition-all duration-300 ease-in-out bg-gradient-to-r from-primary/80 to-accent/80 rounded-lg shadow-md"
              style={{
                left: viewMode === 'list' ? '4px' : '50%',
                width: 'calc(50% - 8px)',
                transform: viewMode === 'kanban' ? 'translateX(-4px)' : 'none',
              }}
            />
            <button
              onClick={() => onChangeViewMode('list')}
              className={`relative z-10 flex items-center justify-center px-2 py-1 text-xs font-medium rounded-lg transition-all duration-300 w-16
                ${viewMode === 'list' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              title="Visualização em lista"
            >
              <FiList className={`mr-1 ${viewMode === 'list' ? 'animate-pulse' : ''}`} size={14} /> Lista
            </button>
            <button
              onClick={() => onChangeViewMode('kanban')}
              className={`relative z-10 flex items-center justify-center px-2 py-1 text-xs font-medium rounded-lg transition-all duration-300 w-16
                ${viewMode === 'kanban' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              title="Visualização em kanban"
            >
              <FiColumns className={`mr-1 ${viewMode === 'kanban' ? 'animate-pulse' : ''}`} size={14} /> Kanban
            </button>
          </div>
        )}

        {/* Formulário de busca */}
        <form className="relative" onSubmit={handleSearch}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar tarefas..."
            className="bg-dark-lighter text-white border border-dark-accent/30 rounded-lg px-4 py-2 pr-10 w-64 focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all"
          />
          <button
            type="submit" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary"
          >
            <FiSearch size={18} />
          </button>
        </form>

        {/* Resto dos botões de ação */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-full hover:bg-dark-accent/70 transition-colors text-gray-300 relative"
          aria-label="Notificações"
        >
          <FiBell size={20} />
          {pendingTasksCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full">
              {pendingTasksCount > 9 ? '9+' : pendingTasksCount}
            </span>
          )}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-dark-accent/70 transition-colors text-gray-300"
          aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-8 h-8 rounded-full bg-primary/20 hover:bg-primary/30 text-primary flex items-center justify-center transition-all ml-1 border border-primary/30"
          aria-label="Perfil"
        >
          <FiUser size={18} />
        </motion.button>
        
        <motion.button
          onClick={onShowProductivityInsights}
          className="rounded-full p-2 text-gray-400 hover:text-primary hover:bg-dark-accent/50 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Análise de Produtividade"
        >
          <IoStatsChart size={20} />
        </motion.button>
      </div>
    </header>
  );
};

export default Header; 