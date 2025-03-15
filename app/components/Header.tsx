import React, { useState, useRef, useEffect } from 'react';
import { FiMenu, FiMoon, FiSun, FiHelpCircle, FiDownload, FiUpload, FiCalendar, FiClock, FiBarChart2, FiSearch, FiSettings, FiTag, FiInfo, FiMessageSquare, FiMoreVertical, FiBell, FiArrowRight, FiX, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import { useTaskContext } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { Notifications } from './Notifications';
import ThemeToggle from './ThemeToggle';
import Link from 'next/link';
import AuthLinks from './AuthLinks';

interface HeaderProps {
  onToggleSidebar: () => void;
  onEnterFocusMode: () => void;
  onShowDashboard: () => void;
  onShowCalendar: () => void;
  onOpenSearch: () => void;
  onOpenThemeSelector: () => void;
  onOpenTagsManager: () => void;
  onOpenWalkthrough: () => void;
  onShowOverview: () => void;
  onOpenNotificationSettings: () => void;
  pendingNotificationCount: number;
  onOpenDiagnosticTool?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar,
  onEnterFocusMode,
  onShowDashboard,
  onShowCalendar,
  onOpenSearch,
  onOpenThemeSelector,
  onOpenTagsManager,
  onOpenWalkthrough,
  onShowOverview,
  onOpenNotificationSettings,
  pendingNotificationCount,
  onOpenDiagnosticTool
}) => {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  
  const keyboardShortcutsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);
  
  const { exportTasks, importTasks } = useTaskContext();

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleClickOutside(event: MouseEvent) {
    if (keyboardShortcutsRef.current && !keyboardShortcutsRef.current.contains(event.target as Node)) {
      setShowKeyboardShortcuts(false);
    }
    
    if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
      setShowNotifications(false);
    }
    
    if (helpMenuRef.current && !helpMenuRef.current.contains(event.target as Node)) {
      setHelpMenuOpen(false);
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      setShowKeyboardShortcuts(false);
      setShowNotifications(false);
      setHelpMenuOpen(false);
    }
  }

  const handleExport = () => {
    const data = exportTasks();
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tarefas-exportadas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const importResult = importTasks(content);
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 px-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center">
        <button 
          onClick={onToggleSidebar}
          className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Toggle sidebar"
        >
          <FiMenu className="h-6 w-6" />
        </button>
        
        <div className="ml-4 hidden sm:flex items-center">
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            TodoApp
          </span>
          <span className="ml-2 text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 font-medium">
            PRO
          </span>
        </div>
        
        <div className="ml-4 flex items-center space-x-2">
          <button 
            onClick={onShowDashboard}
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md hidden md:flex items-center"
            title="Dashboard (Ctrl+D)"
          >
            <FiBarChart2 className="mr-1.5" />
            <span>Dashboard</span>
          </button>
          
          <button 
            onClick={onShowCalendar}
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md hidden md:flex items-center"
            title="Calendário (Ctrl+C)"
          >
            <FiCalendar className="mr-1.5" />
            <span>Calendário</span>
          </button>
          
          <button 
            onClick={onEnterFocusMode}
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md hidden md:flex items-center"
            title="Modo Foco (Ctrl+F)"
          >
            <FiClock className="mr-1.5" />
            <span>Foco</span>
          </button>
          
          {onShowOverview && (
            <button 
              onClick={onShowOverview}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md hidden md:flex items-center"
              title="Estatísticas"
            >
              <FiBarChart2 className="mr-1.5" />
              <span>Estatísticas</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <button 
          onClick={onOpenSearch}
          className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          aria-label="Buscar tarefas"
          title="Buscar (Ctrl+K)"
        >
          <FiSearch className="h-5 w-5" />
        </button>
        
        <button
          onClick={onOpenTagsManager}
          className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none hidden sm:block"
          aria-label="Gerenciar Tags"
          title="Gerenciar Tags (Ctrl+T)"
        >
          <FiTag className="h-5 w-5" />
        </button>
        
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            aria-label="Notificações"
            title="Notificações"
          >
            <div className="relative">
              <FiBell className="h-5 w-5" />
              {pendingNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingNotificationCount > 9 ? '9+' : pendingNotificationCount}
                </span>
              )}
            </div>
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <Notifications 
                onClose={() => setShowNotifications(false)} 
                onOpenSettings={onOpenNotificationSettings}
              />
            </div>
          )}
        </div>
        
        <div className="hidden md:block h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
        
        <button
          onClick={handleExport}
          className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none hidden md:block"
          aria-label="Exportar dados"
          title="Exportar dados"
        >
          <FiDownload className="h-5 w-5" />
        </button>
        
        <button
          onClick={handleImport}
          className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none hidden md:block"
          aria-label="Importar dados"
          title="Importar dados"
        >
          <FiUpload className="h-5 w-5" />
        </button>
        
        <div className="relative" ref={helpMenuRef}>
          <button 
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none" 
            onClick={() => setHelpMenuOpen(!helpMenuOpen)}
            aria-expanded={helpMenuOpen}
            aria-haspopup="true"
            title="Ajuda"
          >
            <FiHelpCircle className="h-5 w-5" />
          </button>
          {helpMenuOpen && (
            <ul className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
              <li>
                <button 
                  onClick={() => {
                    onOpenWalkthrough();
                    setHelpMenuOpen(false);
                  }} 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <FiInfo className="mr-2" /> Tutorial
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setShowKeyboardShortcuts(true);
                    setHelpMenuOpen(false);
                  }} 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <FiHelpCircle className="mr-2" /> Atalhos de teclado
                </button>
              </li>
              <li>
                <a 
                  href="https://github.com/yourusername/neotask" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  onClick={() => setHelpMenuOpen(false)}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              </li>
              <li>
                <Link 
                  href="/melhorias" 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  onClick={() => setHelpMenuOpen(false)}
                >
                  <FiBarChart2 className="mr-2" /> Melhorias recentes
                </Link>
              </li>
              <li>
                <Link 
                  href="/performance" 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  onClick={() => setHelpMenuOpen(false)}
                >
                  <FiActivity className="mr-2" /> Diagnóstico de desempenho
                </Link>
              </li>
              <li>
                <Link 
                  href="/feedback" 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  onClick={() => setHelpMenuOpen(false)}
                >
                  <FiMessageSquare className="mr-2" /> Enviar feedback
                </Link>
              </li>
            </ul>
          )}
        </div>
        
        <div className="ml-1">
          <AuthLinks />
        </div>
        
        <button
          onClick={onOpenThemeSelector}
          className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          aria-label="Personalizar tema"
          title="Personalizar tema"
        >
          <FiSettings className="h-5 w-5" />
        </button>

        {onOpenDiagnosticTool && (
          <button 
            onClick={onOpenDiagnosticTool}
            className="relative p-2 rounded-full hover:bg-dark-accent/30 transition-colors duration-200 text-yellow-400 mr-2"
            aria-label="Diagnóstico"
            title="Ferramenta de Diagnóstico"
          >
            <FiAlertTriangle size={20} />
          </button>
        )}
      </div>
      
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            ref={keyboardShortcutsRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <KeyboardShortcuts onClose={() => setShowKeyboardShortcuts(false)} />
          </div>
        </div>
      )}
    </header>
  );
}; 