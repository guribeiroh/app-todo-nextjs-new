"use client";

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { TaskProvider } from './context/TaskContext';
import { FocusMode } from './components/FocusMode';
import { Dashboard } from './components/Dashboard';
import { Calendar } from './components/Calendar';
import { SearchModal } from './components/SearchModal';
import { ThemeSelector } from './components/ThemeSelector';
import { TagsManager } from './components/TagsManager';
import { Walkthrough } from './components/Walkthrough';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DataExport } from './components/DataExport';
import { useTaskContext } from './context/TaskContext';
import { useOffline } from './hooks/useOffline';
import { NetworkStatus } from './components/NetworkStatus';
import { Statistics } from './components/Statistics';
import { Reminders } from './components/Reminders';
import { FiBell, FiBarChart2, FiDownload, FiUserCheck } from 'react-icons/fi';
import { useFixNavigatorIssue } from './temp-fix';

// Componente para integrar DataExport com o contexto
const DataExportWrapper = () => {
  const { tasks, lists, tags, importDataFromJson } = useTaskContext();
  const [showExport, setShowExport] = useState(false);
  
  const handleImport = (data: { tasks: any[], lists: any[], tags: string[] }) => {
    try {
      importDataFromJson(data);
      alert('Dados importados com sucesso!');
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      alert('Erro ao importar dados. Verifique o console para mais detalhes.');
    }
  };
  
  return (
    <>
      {showExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Exportar e Importar</h2>
              <button 
                onClick={() => setShowExport(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <DataExport 
                tasks={tasks} 
                lists={lists} 
                tags={tags}
                onImport={handleImport} 
              />
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setShowExport(true)}
        className="fixed bottom-20 right-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg z-20"
        aria-label="Exportar/Importar Dados"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
        </svg>
      </button>
    </>
  );
};

export default function SafePage() {
  // Use o hook de correção temporária para prevenir problemas
  useFixNavigatorIssue();
  
  // Verificação segura para cliente
  const isClientSide = typeof window !== 'undefined';
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [dashboardActive, setDashboardActive] = useState(false);
  const [calendarActive, setCalendarActive] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [tagsManagerOpen, setTagsManagerOpen] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  
  // Obter estado online de forma segura através do hook
  const isOffline = useOffline();
  const isOnline = !isOffline;
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [pwaInstallable, setPwaInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  // Inicializar tema e modo escuro com base nas preferências
  useEffect(() => {
    // Verificação de segurança para o lado do cliente
    if (!isClientSide) return;
    
    try {
      // Verificar preferência salva
      const savedTheme = localStorage.getItem('theme');
      
      if (savedTheme) {
        setTheme(savedTheme);
        
        // Aplicar modo escuro com base na preferência
        if (savedTheme === 'dark') {
          setDarkMode(true);
          document.documentElement.classList.add('dark');
        } else if (savedTheme === 'light') {
          setDarkMode(false);
          document.documentElement.classList.remove('dark');
        } else if (savedTheme === 'system') {
          // Usar preferência do sistema
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setDarkMode(prefersDark);
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      }
      
      // Verificar se é a primeira visita para mostrar o walkthrough
      const hasSeenWalkthrough = localStorage.getItem('neotask-walkthrough-completed');
      if (!hasSeenWalkthrough) {
        setWalkthroughOpen(true);
      }
      
      // Carregar cor de destaque
      const savedAccentColor = localStorage.getItem('accent-color');
      if (savedAccentColor) {
        document.documentElement.style.setProperty('--color-primary', savedAccentColor);
        
        // Calcular cores derivadas
        const adjustColor = (color: string, percent: number) => {
          const hex = color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          
          const adjustBrightness = (channel: number) => {
            return Math.min(255, Math.max(0, Math.round(channel * (1 + percent / 100))));
          };
          
          const rr = adjustBrightness(r);
          const gg = adjustBrightness(g);
          const bb = adjustBrightness(b);
          
          return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
        };
        
        // Aplicar variações da cor de destaque
        document.documentElement.style.setProperty('--color-primary-light', adjustColor(savedAccentColor, 15));
        document.documentElement.style.setProperty('--color-primary-dark', adjustColor(savedAccentColor, -15));
      }
      
      // Detecção de PWA installable
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevenir o prompt automático
        e.preventDefault();
        // Armazenar o evento para uso posterior
        setInstallPrompt(e);
        // Atualizar estado para mostrar o botão de instalação
        setPwaInstallable(true);
      });
    } catch (error) {
      console.error('Erro ao inicializar configurações:', error);
    }
    
    return () => {
      // Limpeza segura de event listeners
      if (isClientSide) {
        // Não é necessário remover listeners online/offline pois estão no useOffline
      }
    };
  }, [isClientSide]);

  return (
    <TaskProvider>
      <div className={`app-container ${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
          {!focusModeActive && (
            <Header 
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
              onEnterFocusMode={() => setFocusModeActive(true)}
              onShowDashboard={() => setDashboardActive(true)}
              onShowCalendar={() => setCalendarActive(true)}
              onOpenSearch={() => setSearchOpen(true)}
              onOpenThemeSelector={() => setThemeMenuOpen(!themeMenuOpen)}
              onOpenTagsManager={() => setTagsManagerOpen(true)}
              onOpenWalkthrough={() => setWalkthroughOpen(true)}
              onOpenNotificationSettings={() => setShowRemindersModal(true)}
              onShowOverview={() => console.log('Mostrar visão geral')}
              pendingNotificationCount={0}
            />
          )}
          
          <div className="flex h-[calc(100vh-4rem)]">
            {!focusModeActive && sidebarOpen && (
              <Sidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)}
                onEnterFocusMode={() => setFocusModeActive(true)}
                onShowCalendar={() => setCalendarActive(true)}
                onOpenSearch={() => setSearchOpen(true)}
                onOpenTagsManager={() => setTagsManagerOpen(true)}
                onShowPomodoroTimer={() => {}}
                onShowHabitsTracker={() => {}}
                onShowGoalPlanner={() => {}}
                onShowWorkflowAutomation={() => {}}
              />
            )}
            
            <div className={`flex-grow p-6 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
              {focusModeActive ? (
                <FocusMode onExitFocusMode={() => setFocusModeActive(false)} />
              ) : dashboardActive ? (
                <Dashboard onClose={() => setDashboardActive(false)} />
              ) : calendarActive ? (
                <Calendar onClose={() => setCalendarActive(false)} />
              ) : (
                <>
                  <TaskForm />
                  <TaskList />
                </>
              )}
            </div>
          </div>
          
          {/* Modais e Componentes Flutuantes */}
          {searchOpen && (
            <SearchModal 
              onClose={() => setSearchOpen(false)} 
              tasks={[]} 
              lists={[]}
            />
          )}
          {themeMenuOpen && <ThemeSelector onClose={() => setThemeMenuOpen(false)} />}
          {tagsManagerOpen && (
            <TagsManager 
              onClose={() => setTagsManagerOpen(false)} 
              tags={[]}
            />
          )}
          {walkthroughOpen && (
            <Walkthrough 
              onClose={() => { 
                setWalkthroughOpen(false); 
                localStorage.setItem('neotask-walkthrough-completed', 'true'); 
              }} 
            />
          )}
          <OfflineIndicator />
          <DataExportWrapper />
          
          {/* Status de conexão */}
          <div className="fixed bottom-4 right-4 z-10">
            <NetworkStatus />
          </div>
        </div>
      </div>
    </TaskProvider>
  );
}