"use client";

import React, { useState, useEffect, lazy, Suspense } from 'react';
// Componentes essenciais
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TaskList } from './components/TaskList';
import { TaskForm } from './components/TaskForm';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import { useAuth } from './context/AuthContext';
import WelcomePage from './WelcomePage';
import OfflineStatusBar from './components/OfflineStatusBar';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastProvider, useToast } from './components/Toast';
import DiagnosticTool from './components/DiagnosticTool';

// Ícones essenciais
import { FiPlus, FiList, FiGrid, FiInfo } from 'react-icons/fi';

// Hooks principais
import { useOffline } from './hooks/useOffline';
import { useFixNavigatorIssue } from './temp-fix';

// Componentes carregados sob demanda com lazy loading
const FocusMode = lazy(() => import('./components/FocusMode').then(mod => ({ default: mod.FocusMode })));
const Dashboard = lazy(() => import('./components/Dashboard').then(mod => ({ default: mod.Dashboard })));
const Calendar = lazy(() => import('./components/Calendar').then(mod => ({ default: mod.Calendar })));
const SearchModal = lazy(() => import('./components/SearchModal').then(mod => ({ default: mod.SearchModal })));
const ThemeSelector = lazy(() => import('./components/ThemeSelector').then(mod => ({ default: mod.ThemeSelector })));
const TagsManager = lazy(() => import('./components/TagsManager').then(mod => ({ default: mod.TagsManager })));
const Walkthrough = lazy(() => import('./components/Walkthrough').then(mod => ({ default: mod.Walkthrough })));
const Statistics = lazy(() => import('./components/Statistics').then(mod => ({ default: mod.Statistics })));
const NotificationSettings = lazy(() => import('./components/NotificationSettings').then(mod => ({ default: mod.NotificationSettings })));
const PomodoroTimer = lazy(() => import('./components/PomodoroTimer').then(mod => ({ default: mod.default })));
const Overview = lazy(() => import('./components/Overview').then(mod => ({ default: mod.default })));
const OfflineSettings = lazy(() => import('./components/OfflineSettings').then(mod => ({ default: mod.default })));
const SyncHistory = lazy(() => import('./components/SyncHistory').then(mod => ({ default: mod.default })));
const KanbanBoard = lazy(() => import('./components/KanbanBoard').then(mod => ({ default: mod.KanbanBoard })));
const FeedbackForm = lazy(() => import('./components/FeedbackForm').then(mod => ({ default: mod.FeedbackForm })));
const HabitsTracker = lazy(() => import('./components/HabitsTracker').then(mod => ({ default: mod.HabitsTracker })));
const GoalPlanner = lazy(() => import('./components/GoalPlanner').then(mod => ({ default: mod.GoalPlanner })));
const WorkflowAutomation = lazy(() => import('./components/WorkflowAutomation').then(mod => ({ default: mod.WorkflowAutomation })));
const ProductivityInsights = lazy(() => import('./components/ProductivityInsights').then(mod => ({ default: mod.default })));
const SmartTags = lazy(() => import('./components/SmartTags').then(mod => ({ default: mod.default })));
const NavigationButtons = lazy(() => import('./components/NavigationButtons').then(mod => ({ default: mod.default })));
const DataExport = lazy(() => import('./components/DataExport').then(mod => ({ default: mod.DataExport })));
const NetworkStatus = lazy(() => import('./components/NetworkStatus').then(mod => ({ default: mod.NetworkStatus })));
const Reminders = lazy(() => import('./components/Reminders').then(mod => ({ default: mod.Reminders })));
const OfflineIndicator = lazy(() => import('./components/OfflineIndicator').then(mod => ({ default: mod.OfflineIndicator })));
const AuthLinks = lazy(() => import('./components/AuthLinks').then(mod => ({ default: mod.default })));

// Importações de serviços que podem ser carregadas sob demanda
import dynamic from 'next/dynamic';
// Não use dynamic para serviços não-componentes
// const CacheService = dynamic(() => import('./services/CacheService'), { ssr: false });
// const OfflineService = dynamic(() => import('./services/OfflineService'), { ssr: false });
// O NotificationService não é um componente, não deve usar dynamic
import type CacheService from './services/CacheService';
import type OfflineService from './services/OfflineService';

// Componente de carregamento para usar com Suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando...</span>
  </div>
);

// Componente separado para o conteúdo autenticado
const AuthenticatedApp = () => {
  const taskContext = useTaskContext();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [dashboardActive, setDashboardActive] = useState(false);
  const [calendarActive, setCalendarActive] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [tagsManagerOpen, setTagsManagerOpen] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  
  const [statisticsActive, setStatisticsActive] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState<any[]>([]);
  
  // Novos estados para componentes de produtividade
  const [pomodoroTimerOpen, setPomodoroTimerOpen] = useState(false);
  const [habitsTrackerOpen, setHabitsTrackerOpen] = useState(false);
  const [goalPlannerOpen, setGoalPlannerOpen] = useState(false);
  const [workflowAutomationOpen, setWorkflowAutomationOpen] = useState(false);
  
  // Estado para controlar a visualização ativa (lista ou kanban)
  // Inicializa com a preferência salva no localStorage se disponível
  const [activeView, setActiveView] = useState<'list' | 'kanban'>('list');

  // Estados para controlar se a visualização está carregando
  const [isListLoading, setIsListLoading] = useState(false);
  const [isKanbanLoading, setIsKanbanLoading] = useState(false);
  
  // Estados independentes para armazenar filtros de cada visualização
  const [listFilters, setListFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedFilters = localStorage.getItem('listViewFilters');
      return savedFilters ? JSON.parse(savedFilters) : null;
    }
    return null;
  });
  
  const [kanbanFilters, setKanbanFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedFilters = localStorage.getItem('kanbanViewFilters');
      return savedFilters ? JSON.parse(savedFilters) : null;
    }
    return null;
  });

  // Estado para controlar a exibição da ferramenta de diagnóstico
  const [showDiagnosticTool, setShowDiagnosticTool] = useState(false);
  
  // Detector de problemas de renderização
  const [renderError, setRenderError] = useState(false);
  
  // Função para mudar a visualização e salvar a preferência
  const handleViewChange = (view: 'list' | 'kanban') => {
    // Se for a mesma visualização, não faz nada
    if (view === activeView) return;
    
    // Define o estado de carregamento para a visualização que será exibida
    if (view === 'list') {
      setIsListLoading(true);
    } else {
      setIsKanbanLoading(true);
    }
    
    // Adiciona uma classe ao corpo para animar a mudança
    document.body.classList.add('view-changing');
    
    setActiveView(view);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredView', view);
    }
    
    // Simula um pequeno atraso para mostrar o carregamento e depois esconde
    setTimeout(() => {
      setIsListLoading(false);
      setIsKanbanLoading(false);
      document.body.classList.remove('view-changing');
    }, 500);
  };
  
  // Função para salvar os filtros de cada visualização
  const saveViewFilters = (viewType: 'list' | 'kanban', filters: any) => {
    if (viewType === 'list') {
      setListFilters(filters);
      if (typeof window !== 'undefined') {
        localStorage.setItem('listViewFilters', JSON.stringify(filters));
      }
    } else {
      setKanbanFilters(filters);
      if (typeof window !== 'undefined') {
        localStorage.setItem('kanbanViewFilters', JSON.stringify(filters));
      }
    }
  };
  
  // Obter estado online de forma segura através do hook
  const isOffline = useOffline();
  
  // Referência para o service worker
  const [offlineWorker, setOfflineWorker] = useState<ServiceWorker | null>(null);
  
  // Serviços offline e de cache
  const [offlineService, setOfflineService] = useState<OfflineService | null>(null);
  const [cacheService, setCacheService] = useState<CacheService | null>(null);
  
  // Inicializar serviços offline
  useEffect(() => {
    const isClientSide = typeof window !== 'undefined';
    if (isClientSide) {
      // Importar serviços diretamente dentro do useEffect
      import('./services/CacheService')
        .then(module => {
          setCacheService(module.default.getInstance());
        })
        .catch(error => {
          console.error('Erro ao carregar CacheService:', error);
        });
        
      import('./services/OfflineService')
        .then(module => {
          setOfflineService(module.default.getInstance());
        })
        .catch(error => {
          console.error('Erro ao carregar OfflineService:', error);
        });
      
      // Registrar service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            if (registration.active) {
              setOfflineWorker(registration.active);
            }
          })
          .catch(error => {
            console.error('Erro ao acessar service worker:', error);
          });
      }
    }
  }, []);
  
  // Manejar visibilidade do walkthrough apenas na primeira visita
  useEffect(() => {
    const isClientSide = typeof window !== 'undefined';
    if (isClientSide) {
      const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
      if (!hasVisitedBefore) {
        setWalkthroughOpen(true);
        localStorage.setItem('hasVisitedBefore', 'true');
      }
    }
  }, []);
  
  // Gerar notificações fictícias para demonstração
  useEffect(() => {
    const isClientSide = typeof window !== 'undefined';
    if (isClientSide) {
      const demoNotifications = [
        { id: '1', title: 'Tarefa próxima do vencimento', read: false },
        { id: '2', title: 'Lembrete: reunião às 14h', read: true }
      ];
      setPendingNotifications(demoNotifications.filter(n => !n.read));
    }
  }, []);
  
  // Configuração de atalhos de teclado
  useEffect(() => {
    const isClientSide = typeof window !== 'undefined';
    if (!isClientSide) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Só processa se não estiver em um input ou textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Ctrl/Cmd + / para abrir busca
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      }
      
      // Shift + F para modo foco
      if (e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setFocusModeActive(true);
      }
      
      // Shift + D para dashboard
      if (e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDashboardActive(true);
      }

      // Alt + L para visualização em lista
      if (e.altKey && e.key === 'l') {
        e.preventDefault();
        handleViewChange('list');
      }
      
      // Alt + K para visualização kanban
      if (e.altKey && e.key === 'k') {
        e.preventDefault();
        handleViewChange('kanban');
      }
      
      // Escape para fechar modais
      if (e.key === 'Escape') {
        setFocusModeActive(false);
        setSearchOpen(false);
        setThemeMenuOpen(false);
        setTagsManagerOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Verifica se há problemas de renderização após a montagem do componente
  useEffect(() => {
    // Verifica problemas com os dados
    const hasDataIssue = !taskContext || 
                         !Array.isArray(taskContext.tasks) || 
                         !Array.isArray(taskContext.lists);
    
    // Verifica se o localStorage indica uma tentativa anterior de diagnóstico
    const previousDiagnostic = typeof window !== 'undefined' && 
                              localStorage.getItem('app_diagnostic_reload') === 'true';
    
    if (hasDataIssue || previousDiagnostic) {
      setRenderError(true);
      // Se já houve uma tentativa de correção, mostrar a ferramenta de diagnóstico
      if (previousDiagnostic) {
        setShowDiagnosticTool(true);
        localStorage.removeItem('app_diagnostic_reload');
      }
    }
  }, [taskContext]);
  
  // Função para renderizar o componente principal com base no estado
  const renderMainComponent = () => {
    if (focusModeActive) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FocusMode onExitFocusMode={() => setFocusModeActive(false)} />
        </Suspense>
      );
    }
    
    if (dashboardActive) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <Dashboard onClose={() => setDashboardActive(false)} />
        </Suspense>
      );
    }
    
    if (calendarActive) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <Calendar onClose={() => setCalendarActive(false)} />
        </Suspense>
      );
    }
    
    if (statisticsActive && taskContext) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <Statistics 
            tasks={taskContext.tasks || []} 
            lists={taskContext.lists || []} 
            tags={taskContext.tags || []} 
            onClose={() => setStatisticsActive(false)} 
          />
        </Suspense>
      );
    }
    
    // Renderização dos componentes de produtividade
    if (pomodoroTimerOpen) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <PomodoroTimer 
            onClose={() => setPomodoroTimerOpen(false)} 
            onTimerComplete={() => null}
          />
        </Suspense>
      );
    }
    
    if (habitsTrackerOpen) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <HabitsTracker onClose={() => setHabitsTrackerOpen(false)} />
        </Suspense>
      );
    }
    
    if (goalPlannerOpen) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <GoalPlanner onClose={() => setGoalPlannerOpen(false)} />
        </Suspense>
      );
    }
    
    if (workflowAutomationOpen) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <WorkflowAutomation 
            onClose={() => setWorkflowAutomationOpen(false)} 
            lists={taskContext.lists.map(list => ({ id: list.id, name: list.name }))}
            tags={taskContext.tags}
          />
        </Suspense>
      );
    }
    
    return (
      <div className="flex flex-col md:flex-row h-screen main-container">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          onShowPomodoroTimer={() => setPomodoroTimerOpen(true)}
          onShowHabitsTracker={() => setHabitsTrackerOpen(true)}
          onShowGoalPlanner={() => setGoalPlannerOpen(true)}
          onShowWorkflowAutomation={() => setWorkflowAutomationOpen(true)}
          onEnterFocusMode={() => setFocusModeActive(true)}
          onShowCalendar={() => setCalendarActive(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenTagsManager={() => setTagsManagerOpen(true)}
        />
        
        <div className="flex-grow bg-white dark:bg-gray-900 main-content">
          <TaskForm />
          
          <div className="p-4 bg-white dark:bg-gray-900">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <h2 className="text-white text-lg font-medium flex items-center">
                {activeView === 'list' && (
                  <motion.span 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center"
                  >
                    <FiList className="mr-1" /> Modo Lista
                  </motion.span>
                )}
                {activeView === 'kanban' && (
                  <motion.span 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center"
                  >
                    <FiGrid className="mr-1" /> Modo Kanban
                  </motion.span>
                )}
              </h2>
              {/* Alternador visual mais bonito */}
              <div className="relative bg-gradient-to-r from-dark-primary/60 to-dark-accent/40 p-1 rounded-xl shadow-inner flex items-center">
                <motion.div 
                  className="absolute h-8 transition-all duration-300 ease-in-out bg-gradient-to-r from-primary/80 to-accent/80 rounded-lg shadow-lg"
                  initial={false}
                  animate={{
                    left: activeView === 'list' ? '4px' : '50%',
                    translateX: activeView === 'kanban' ? '-4px' : '0px',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{
                    width: 'calc(50% - 8px)',
                  }}
                />
                <button 
                  onClick={() => handleViewChange('list')}
                  className={`relative z-10 flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 w-24
                    ${activeView === 'list' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
                  aria-label="Visualização em Lista"
                >
                  <FiList className={`mr-2 ${activeView === 'list' ? 'animate-pulse' : ''}`} /> Lista
                </button>
                <button 
                  onClick={() => handleViewChange('kanban')}
                  className={`relative z-10 flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 w-24
                    ${activeView === 'kanban' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
                  aria-label="Visualização Kanban"
                >
                  <FiGrid className={`mr-2 ${activeView === 'kanban' ? 'animate-pulse' : ''}`} /> Kanban
                </button>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {activeView === 'list' ? (
                <motion.div
                  key="list-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  layout
                  className="task-list-container custom-scrollbar"
                >
                  {isListLoading && (
                    <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                        <span className="mt-3 text-white text-sm">Carregando visualização em lista...</span>
                      </div>
                    </div>
                  )}
                  <div className="p-3 mb-3 text-sm text-gray-400 italic border-l-2 border-primary/30 pl-3 bg-primary/5 rounded-md flex items-center">
                    <FiInfo className="mr-2 text-primary" />
                    <span>
                      <strong>Dica:</strong> A visualização em lista é ideal para gerenciar rapidamente suas tarefas e aplicar filtros avançados.
                      Use o agrupamento para organizar as tarefas por prioridade, status ou data.
                    </span>
                  </div>
                  <TaskList 
                    initialFilters={listFilters} 
                    onFiltersChange={(filters) => saveViewFilters('list', filters)} 
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="kanban-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  layout
                  className="kanban-container custom-scrollbar"
                >
                  {isKanbanLoading && (
                    <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                        <span className="mt-3 text-white text-sm">Carregando quadro Kanban...</span>
                      </div>
                    </div>
                  )}
                  <div className="p-3 mb-3 text-sm text-gray-400 italic border-l-2 border-primary/30 pl-3 bg-primary/5 rounded-md flex items-center">
                    <FiInfo className="mr-2 text-primary" />
                    <span>
                      <strong>Dica:</strong> O quadro Kanban é perfeito para visualizar seu fluxo de trabalho e arrastar tarefas entre colunas.
                      Adicione novas colunas para personalizar seu fluxo de trabalho.
                    </span>
                  </div>
                  {taskContext && taskContext.tasks && (
                    <KanbanBoard initialFilters={kanbanFilters} onFiltersChange={(filters) => saveViewFilters('kanban', filters)} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };
  
  const { showToast } = useToast();
  
  return (
    <ToastProvider>
      <TaskProvider>
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
          <Header 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onEnterFocusMode={() => setFocusModeActive(true)}
            onShowDashboard={() => setDashboardActive(true)}
            onShowCalendar={() => setCalendarActive(true)}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenThemeSelector={() => setThemeMenuOpen(true)}
            onOpenTagsManager={() => setTagsManagerOpen(true)}
            onOpenWalkthrough={() => setWalkthroughOpen(true)}
            onShowOverview={() => setStatisticsActive(true)}
            onOpenNotificationSettings={() => setNotificationSettingsOpen(true)}
            pendingNotificationCount={pendingNotifications.length}
            onOpenDiagnosticTool={() => setShowDiagnosticTool(true)}
          />
          
          <main className="flex-grow flex flex-col relative bg-white dark:bg-gray-900">
            {renderError ? (
              <div className="flex-grow flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900">
                <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-lg max-w-lg w-full text-center">
                  <div className="text-5xl mb-4">⚠️</div>
                  <h2 className="text-xl font-semibold mb-3 text-red-700 dark:text-red-400">
                    Problema de Renderização Detectado
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Parece que há um problema ao carregar seus dados. Isso pode ser causado por dados corrompidos ou um problema de armazenamento local.
                  </p>
                  <button
                    onClick={() => setShowDiagnosticTool(true)}
                    className="btn btn-primary"
                  >
                    Usar Ferramenta de Diagnóstico
                  </button>
                </div>
              </div>
            ) : (
              renderMainComponent()
            )}
          </main>
          
          {/* Modais */}
          {searchOpen && (
            <Suspense fallback={<LoadingFallback />}>
              <SearchModal 
                onClose={() => setSearchOpen(false)} 
                tasks={taskContext?.tasks || []}
                lists={taskContext?.lists || []}
              />
            </Suspense>
          )}
          
          {themeMenuOpen && (
            <Suspense fallback={<LoadingFallback />}>
              <ThemeSelector onClose={() => setThemeMenuOpen(false)} />
            </Suspense>
          )}
          
          {tagsManagerOpen && (
            <Suspense fallback={<LoadingFallback />}>
              <TagsManager 
                onClose={() => setTagsManagerOpen(false)}
                tags={taskContext?.tags || []}
                onAddTag={taskContext?.addTag}
                onRemoveTag={taskContext?.removeTag}
              />
            </Suspense>
          )}
          
          {walkthroughOpen && (
            <Suspense fallback={<LoadingFallback />}>
              <Walkthrough onClose={() => setWalkthroughOpen(false)} />
            </Suspense>
          )}
          
          {notificationSettingsOpen && (
            <Suspense fallback={<LoadingFallback />}>
              <NotificationSettings onClose={() => setNotificationSettingsOpen(false)} />
            </Suspense>
          )}
          
          {showDiagnosticTool && (
            <DiagnosticTool onClose={() => setShowDiagnosticTool(false)} />
          )}
        </div>
      </TaskProvider>
    </ToastProvider>
  );
};

export default function SafePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Use o hook de correção temporária para prevenir problemas
  useFixNavigatorIssue();
  
  // Verificação segura para cliente
  const isClientSide = typeof window !== 'undefined';
  
  // Estado para armazenar quando o componente está pronto no cliente
  const [isClient, setIsClient] = useState(false);
  
  // Efeito para definir isClient como verdadeiro quando executado no cliente
  useEffect(() => {
    setIsClient(true);
    
    // Aplicar o tema escuro ao body do documento
    if (isClientSide) {
      document.body.classList.add('bg-gray-900');
      document.body.classList.add('text-white');
    }
  }, []);
  
  // Se estiver carregando a autenticação ou não estiver no cliente, mostrar um estado de carregamento
  if (authLoading || !isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    );
  }
  
  // Se não estiver autenticado, mostrar a página de boas-vindas
  if (!isAuthenticated) {
    return <WelcomePage />;
  }
  
  // Se estiver autenticado, mostrar a aplicação principal
  return (
    <TaskProvider>
      <AuthenticatedApp />
    </TaskProvider>
  );
} 