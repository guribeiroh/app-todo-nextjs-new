'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  DndContext, 
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects,
  CollisionDetection,
  rectIntersection,
  getFirstCollision,
  pointerWithin
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { FiPlus, FiBarChart2, FiDownload, FiRefreshCw, FiFilter, FiX, FiVolume2, FiVolumeX } from 'react-icons/fi';
import ScrumColumn from './ScrumColumn';
import UserStoryCard from './UserStoryCard';
import { UserStory } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrumContext } from '../context/ScrumContext';
import SprintSelector from './SprintSelector';
import BurndownChart from './BurndownChart';
import { useToast } from './Toast';
import UserStoryForm from './UserStoryForm';

const ScrumBoard: React.FC = () => {
  const { 
    scrumBoards,
    userStories,
    updateUserStory,
    createUserStory,
    sprints,
    activeSprint,
    updateBurndownData: updateBurndown,
    moveUserStory,
    createScrumBoard,
    setActiveSprint,
    soundsEnabled,
    toggleSounds,
    updateScrumBoard
  } = useScrumContext();
  
  const { showToast } = useToast();
  
  // Estado para controlar hidratação
  const [isMounted, setIsMounted] = useState(false);
  
  // Estado para controle do DnD e UI
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(null);
  const [showSprintSelector, setShowSprintSelector] = useState(false);
  const [showBurndownChart, setShowBurndownChart] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllStories, setShowAllStories] = useState(false);
  
  // Estado para o formulário de adição de história
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormColumnId, setAddFormColumnId] = useState<string | null>(null);
  
  const [previousOverId, setPreviousOverId] = useState<string | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  
  // Mapear os status das histórias para as colunas do quadro
  const statusToColumn = {
    'backlog': 'productBacklog',
    'selected': 'sprintBacklog',
    'inProgress': 'inProgress',
    'testing': 'testing',
    'done': 'done'
  };
  
  // Configurar sensores para drag and drop com melhor sensibilidade
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduzir ainda mais para ativar o arrasto mais facilmente
        tolerance: 8, // Aumentar tolerância para movimentos pequenos
        delay: 0, // Sem delay para início imediato
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Obter o quadro ativo
  const activeBoard = useMemo(() => {
    return scrumBoards.length > 0 ? scrumBoards[0] : null;
  }, [scrumBoards]);
  
  // Carregar ou criar um quadro quando não há nenhum disponível
  useEffect(() => {
    const initBoard = async () => {
      if (scrumBoards.length === 0) {
        showToast('Carregando quadro Scrum...', 'info');
        console.log('Nenhum quadro encontrado. Criando um novo.');
      }
    };
    
    initBoard();
  }, [scrumBoards]);
  
  // Atualizar dados do burndown quando mudar o sprint ou métricas
  const updateBurndownData = useCallback(async () => {
    if (!activeSprint) return;
    
    try {
      setIsRefreshing(true);
      await updateBurndown(activeSprint.id);
      await new Promise(resolve => setTimeout(resolve, 600)); // Simulação
      showToast('Dados do burndown atualizados', 'success');
    } catch (error) {
      showToast('Erro ao atualizar dados', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [activeSprint, showToast, updateBurndown]);
  
  // Filtrar histórias com base na prioridade e Sprint selecionada
  const filteredStories = useMemo(() => {
    // Primeiro filtramos por prioridade (se houver filtro ativo)
    return priorityFilter.length === 0 
      ? userStories 
      : userStories.filter(story => priorityFilter.includes(story.priority));
  }, [userStories, priorityFilter]);
  
  // Obter histórias organizadas por colunas diretamente do board do Supabase
  const boardStories = useMemo(() => {
    // Mapeamento de status para coluna
    const statusToColumn: Record<string, string> = {
      'backlog': 'productBacklog',
      'selected': 'sprintBacklog',
      'inProgress': 'inProgress',
      'testing': 'testing',
      'done': 'done'
    };

    // Criar um objeto vazio para armazenar histórias por coluna
    const columnStories: {[key: string]: UserStory[]} = {
      productBacklog: [],
      sprintBacklog: [],
      inProgress: [],
      testing: [],
      done: []
    };
    
    // Filtrar histórias por sprint ativo e prioridade
    const filteredStories = userStories.filter(story => 
      (showAllStories || !activeSprint || !story.sprintId || story.sprintId === activeSprint.id) &&
      (priorityFilter.length === 0 || priorityFilter.includes(story.priority))
    );
    
    // Adicionar cada história APENAS na coluna correspondente ao seu status atual
    filteredStories.forEach(story => {
      const columnId = statusToColumn[story.status] || 'productBacklog';
      if (!columnStories[columnId]) {
        columnStories[columnId] = [];
      }
      columnStories[columnId].push(story);
    });
    
    return columnStories;
  }, [userStories, activeSprint, showAllStories, priorityFilter]);
  
  // Encontrar a história ativa (sendo arrastada)
  const activeStory = activeId ? userStories.find(story => story.id === activeId) : null;
  
  // Função personalizada para detectar colisões de forma mais precisa
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      // Verificar se estamos movendo para um novo contêiner
      if (activeId && recentlyMovedToNewContainer.current) {
        // Usar pointerWithin para detectar colisões baseadas na posição do ponteiro
        const pointerCollisions = pointerWithin(args);
        
        if (pointerCollisions.length > 0) {
          // Registrar a colisão para não processar novamente
          recentlyMovedToNewContainer.current = false;
          return pointerCollisions;
        }
      }
      
      // Use rectIntersection como estratégia principal - mais preciso para quadros kanban
      const rectCollisions = rectIntersection(args);
      
      // Se houver colisões, retorná-las
      if (rectCollisions.length > 0) {
        return rectCollisions;
      }
      
      // Se não houver colisões retangulares, tentar colisões baseadas no ponteiro
      const pointerCollisions = pointerWithin(args);
      
      if (pointerCollisions.length > 0) {
        return pointerCollisions;
      }
      
      // Último recurso: usar o algoritmo de cantos mais próximos
      return closestCorners(args);
    },
    [activeId]
  );
  
  // Função para tocar som ao arrastar e soltar (utilizando a configuração do contexto)
  const playSound = useCallback((soundType: 'drop' | 'pickup' | 'error') => {
    // Verificar se os sons estão habilitados no contexto
    if (!soundsEnabled) return;
    
    // Criar elemento de áudio programaticamente
    const audioElement = new Audio();
    
    switch (soundType) {
      case 'drop':
        audioElement.src = '/audio/drop-sound.mp3'; // Caminho fictício, você precisaria criar estes arquivos
        audioElement.volume = 0.2;
        break;
      case 'pickup':
        audioElement.src = '/audio/pickup-sound.mp3';
        audioElement.volume = 0.1;
        break;
      case 'error':
        audioElement.src = '/audio/error-sound.mp3';
        audioElement.volume = 0.15;
        break;
    }
    
    // Tentar reproduzir o som, tratando possíveis erros (como bloqueio do navegador)
    audioElement.play().catch(error => {
      console.log('Erro ao reproduzir som:', error);
    });
  }, [soundsEnabled]);
  
  // Manipuladores de eventos para drag and drop com feedback visual aprimorado
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Feedback tátil/vibração se disponível
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    // Tocar som de pickup
    playSound('pickup');
  };
  
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setPreviousOverId(null);
      return;
    }
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    setPreviousOverId(over.id as string);
    
    // Se estiver arrastando sobre uma coluna
    if (activeData?.type === 'story' && overData?.type === 'column') {
      const story = activeData.story as UserStory;
      const newStatus = overData.columnId as string;
      
      // Não fazer nada se a história já está na coluna
      if (story.status === newStatus) return;
      
      // Feedback visual melhorado ao arrastar sobre uma coluna
      setActiveDroppableId(over.id as string);
      
      // Registrar que estamos movendo para um novo contêiner
      recentlyMovedToNewContainer.current = true;
    }
  };
  
  // Configuração da animação de drop
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
    easing: 'cubic-bezier(0.2, 1, 0.3, 1)', // Easing personalizado para animação mais natural
    duration: 400, // Duração mais longa para efeito mais suave
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDroppableId(null);
    
    if (!over) {
      // Feedback quando o card é solto em uma área inválida
      playSound('error');
      
      // Mostrar um toast de feedback ao usuário
      showToast('Item não pode ser movido para esta área', 'warning');
      return;
    }
    
    // Tocar som de sucesso ao soltar o item
    playSound('drop');
    
    const storyId = active.id as string;
    const sourceColumn = active.data.current?.sortable?.containerId as string;
    
    // Verificar se os dados necessários estão presentes
    if (!sourceColumn) {
      console.error('Dados de origem ausentes');
      showToast('Erro ao mover história', 'error');
      return;
    }
    
    // Verificar se o "over" é uma coluna ou um item dentro de uma coluna
    const isOverColumn = over.data.current?.type === 'column';
    const targetColumn = isOverColumn ? over.id as string : over.data.current?.sortable?.containerId as string;
    
    if (!targetColumn) {
      console.error('Coluna de destino não identificada');
      showToast('Erro ao mover história', 'error');
      return;
    }
    
    // Se a coluna de destino for a mesma, apenas reordenar na mesma coluna
    if (sourceColumn === targetColumn) {
      if (!activeBoard) return;
      
      try {
        const items = [...(activeBoard.columns[sourceColumn] || [])];
        const oldIndex = items.indexOf(storyId);
        
        // Verificar se over.data.current?.sortable existe antes de acessar o índice
        if (!over.data.current?.sortable) {
          console.error('Dados de ordenação ausentes no destino');
          showToast('Erro ao mover história', 'error');
          return;
        }
        
        const newIndex = over.data.current.sortable.index || 0;
        
        if (oldIndex !== -1 && oldIndex !== newIndex) {
          // Reordenar array
          const newItems = arrayMove(items, oldIndex, newIndex);
          
          // Atualizar o board local
          const updatedBoard = {
            ...activeBoard,
            columns: {
              ...activeBoard.columns,
              [sourceColumn]: newItems
            }
          };
          
          // Atualizar no Supabase
          await updateScrumBoard(updatedBoard);
          
          // Atualizar posição da história
          const story = userStories.find(s => s.id === storyId);
          if (story) {
            await updateUserStory({
              ...story,
              position: newIndex
            });
          }
        }
      } catch (error) {
        console.error('Erro ao reordenar história:', error);
        showToast('Erro ao reordenar história', 'error');
      }
      return;
    }
    
    // Se for uma coluna diferente, mover a história entre colunas
    try {
      // Converter coluna para status
      const columnToStatus: Record<string, string> = {
        'productBacklog': 'backlog',
        'sprintBacklog': 'selected',
        'inProgress': 'inProgress',
        'testing': 'testing',
        'done': 'done'
      };
      
      const targetStatus = columnToStatus[targetColumn];
      
      // Verificar se o status é válido
      if (!targetStatus) {
        console.error(`Status inválido para coluna: ${targetColumn}`);
        showToast('Erro: Coluna inválida', 'error');
        return;
      }
      
      // Verificar se os dados de ordenação existem
      const targetIndex = over.data.current?.sortable?.index;
      
      // Se targetIndex for undefined, posicione no final
      const finalTargetIndex = targetIndex !== undefined ? targetIndex : 0;
      
      // Localizar a história
      const story = userStories.find(s => s.id === storyId);
      if (!story) {
        console.error(`História não encontrada: ${storyId}`);
        return;
      }
      
      // Verificar se a história seria movida para "done"
      const isMovingToDone = targetStatus === 'done' && story.status !== 'done';
      
      // Mover a história entre colunas no board
      // Isso já atualiza o status da história no banco de dados e no estado
      await moveUserStory(storyId, sourceColumn, targetColumn, finalTargetIndex);
      
      // Se a história foi movida para "done", atualizar dados do burndown
      if (isMovingToDone && activeSprint && story.sprintId === activeSprint.id) {
        await updateBurndownData();
      }
    } catch (error) {
      console.error('Erro ao mover história:', error);
      showToast('Erro ao mover história', 'error');
    }
  };
  
  // Manipulador para adicionar nova história
  const handleAddStory = (column: string) => {
    setAddFormColumnId(column);
    setShowAddForm(true);
  };
  
  const togglePriorityFilter = (priority: string) => {
    setPriorityFilter(prev => 
      prev.includes(priority) 
        ? prev.filter(p => p !== priority) 
        : [...prev, priority]
    );
  };
  
  // Efeito para controlar a hidratação
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Retornar um estado de carregamento até que o componente seja montado no cliente
  if (!isMounted) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="animate-pulse h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="animate-pulse h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </header>
        
        <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-pulse h-10 w-10 mx-auto rounded-full bg-indigo-200 dark:bg-indigo-800"></div>
            <div className="mt-4 animate-pulse h-5 w-48 mx-auto bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mr-3">
            Quadro Scrum
          </h2>
          
          {activeSprint && (
            <div className="px-2.5 py-1 bg-gradient-to-r from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-md text-sm font-medium shadow-sm">
              Sprint: {activeSprint.name}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* Botão para alternar sons */}
          <motion.button
            onClick={toggleSounds}
            className={`p-2 rounded-md flex items-center justify-center transition-colors ${
              soundsEnabled
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={soundsEnabled ? "Desativar sons" : "Ativar sons"}
          >
            {soundsEnabled ? <FiVolume2 size={18} /> : <FiVolumeX size={18} />}
          </motion.button>
          
          {/* Botão para mostrar seletor de Sprint */}
          <motion.button
            onClick={() => setShowSprintSelector(true)}
            className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {activeSprint ? 'Mudar Sprint' : 'Selecionar Sprint'}
          </motion.button>
          
          {/* Botão para mostrar gráfico burndown */}
          <motion.button
            onClick={() => setShowBurndownChart(true)}
            className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiBarChart2 size={18} />
          </motion.button>
        </div>
      </header>
      
      <div className="flex-grow overflow-x-auto p-2 md:p-4 bg-gray-100 dark:bg-gray-900">
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          autoScroll={{
            enabled: true,
            threshold: {
              x: 50,
              y: 50
            }
          }}
        >
          {activeBoard ? (
            <div className="flex flex-row gap-4 h-full min-w-max">
              <ScrumColumn
                columnId="productBacklog"
                title="Product Backlog"
                stories={boardStories.productBacklog || []}
                onAddStory={() => handleAddStory('productBacklog')}
              />
              
              <ScrumColumn
                columnId="sprintBacklog"
                title="Sprint Backlog"
                stories={boardStories.sprintBacklog || []}
                onAddStory={() => handleAddStory('sprintBacklog')}
              />
              
              <ScrumColumn
                columnId="inProgress"
                title="Em Progresso"
                stories={boardStories.inProgress || []}
                onAddStory={() => handleAddStory('inProgress')}
              />
              
              <ScrumColumn
                columnId="testing"
                title="Em Teste"
                stories={boardStories.testing || []}
                onAddStory={() => handleAddStory('testing')}
              />
              
              <ScrumColumn
                columnId="done"
                title="Concluído"
                stories={boardStories.done || []}
                onAddStory={() => handleAddStory('done')}
              />
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <div className="text-center p-6 max-w-md mx-auto">
                <div className="animate-pulse mb-4">
                  <div className="h-10 w-10 mx-auto rounded-full bg-indigo-200 dark:bg-indigo-800"></div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Carregando Quadro Scrum...
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Se o quadro não aparecer em alguns segundos, tente criar um novo.
                </p>
                <button
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  onClick={() => {
                    if (activeSprint) {
                      createScrumBoard('Quadro Scrum', activeSprint.projectId);
                    } else {
                      showToast('Crie um Sprint ativo primeiro', 'warning');
                    }
                  }}
                >
                  Criar Novo Quadro
                </button>
              </div>
            </div>
          )}
          
          {/* Overlay com efeito de escala e rotação para feedback visual durante o arrasto */}
          <DragOverlay dropAnimation={dropAnimation} zIndex={999}>
            {activeId && activeStory ? (
              <div className="transform scale-105 rotate-1 opacity-95 shadow-xl">
                <UserStoryCard
                  story={activeStory}
                  isDragging={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      
      {/* Modal para adicionar história */}
      <AnimatePresence>
        {showAddForm && addFormColumnId && (
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
                  Adicionar História ao {addFormColumnId === 'productBacklog' ? 'Backlog' : 
                                        addFormColumnId === 'sprintBacklog' ? 'Sprint' : 
                                        addFormColumnId === 'inProgress' ? 'Em Progresso' : 
                                        addFormColumnId === 'testing' ? 'Em Teste' : 'Concluído'}
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
                  initialStatus={addFormColumnId === 'productBacklog' ? 'backlog' : 
                                addFormColumnId === 'sprintBacklog' ? 'selected' : 
                                addFormColumnId === 'inProgress' ? 'inProgress' : 
                                addFormColumnId === 'testing' ? 'testing' : 'done'}
                  columnId={addFormColumnId}
                  onCancel={() => setShowAddForm(false)}
                  onSave={() => {
                    setShowAddForm(false);
                    showToast('História criada com sucesso', 'success');
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal para seleção de sprint */}
      <AnimatePresence>
        {showSprintSelector && (
          <SprintSelector
            currentSprintId={activeSprint?.id}
            onClose={() => setShowSprintSelector(false)}
            onSelectSprint={(sprintId) => {
              const selectedSprint = sprints.find(s => s.id === sprintId);
              if (selectedSprint) {
                setActiveSprint(selectedSprint);
                setShowAllStories(false);
                showToast(`Sprint "${selectedSprint.name}" selecionado`, 'success');
              }
              setShowSprintSelector(false);
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Modal para o gráfico de burndown */}
      <AnimatePresence>
        {showBurndownChart && activeSprint && (
          <BurndownChart
            sprintId={activeSprint.id}
            onClose={() => setShowBurndownChart(false)}
          />
        )}
        
        {showBurndownChart && !activeSprint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
            onClick={() => setShowBurndownChart(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl"
            >
              <div className="text-center mb-4">
                <FiBarChart2 size={40} className="mx-auto mb-4 text-amber-500" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                  Nenhum Sprint Ativo
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Selecione um sprint ativo para visualizar o gráfico de burndown.
                </p>
              </div>
              
              <motion.button
                onClick={() => setShowSprintSelector(true)}
                className="w-full mt-2 flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                whileHover={{ y: -1 }}
                whileTap={{ y: 1 }}
              >
                <FiPlus size={16} className="mr-2" />
                Selecionar Sprint
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScrumBoard; 