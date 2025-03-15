"use client";

import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiX, FiEdit2, FiFlag, FiAlignLeft, FiCalendar, FiClipboard, FiMoreVertical, FiCheck, FiTarget } from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// Definindo as interfaces
interface Goal {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'backlog' | 'planning' | 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
}

interface GoalPlannerProps {
  onClose: () => void;
}

export const GoalPlanner: React.FC<GoalPlannerProps> = ({ onClose }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  // Form fields
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalDueDate, setGoalDueDate] = useState('');
  const [goalPriority, setGoalPriority] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Load goals from localStorage on component mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('neotask_goals');
    if (savedGoals) {
      try {
        const parsedGoals = JSON.parse(savedGoals);
        setGoals(parsedGoals);
      } catch (error) {
        console.error('Erro ao carregar objetivos:', error);
      }
    }
  }, []);
  
  // Save goals to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('neotask_goals', JSON.stringify(goals));
  }, [goals]);
  
  const addGoal = () => {
    if (!goalTitle.trim()) return;
    
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: goalTitle,
      description: goalDescription,
      dueDate: goalDueDate,
      priority: goalPriority,
      status: 'backlog',
      createdAt: new Date().toISOString()
    };
    
    setGoals([...goals, newGoal]);
    resetForm();
  };
  
  const updateGoal = () => {
    if (!editingGoal || !goalTitle.trim()) return;
    
    const updatedGoals = goals.map(g => 
      g.id === editingGoal.id 
        ? {
            ...g,
            title: goalTitle,
            description: goalDescription,
            dueDate: goalDueDate,
            priority: goalPriority
          } 
        : g
    );
    
    setGoals(updatedGoals);
    resetForm();
    
    // Atualizar o painel de detalhes se o objetivo selecionado for o que está sendo editado
    if (selectedGoal?.id === editingGoal.id) {
      const updatedGoal = updatedGoals.find(g => g.id === editingGoal.id);
      if (updatedGoal) {
        setSelectedGoal(updatedGoal);
      }
    }
  };
  
  const resetForm = () => {
    setGoalTitle('');
    setGoalDescription('');
    setGoalDueDate('');
    setGoalPriority('medium');
    setShowAddForm(false);
    setEditingGoal(null);
  };
  
  const editGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalDescription(goal.description || '');
    setGoalDueDate(goal.dueDate || '');
    setGoalPriority(goal.priority);
    setShowAddForm(true);
  };
  
  const deleteGoal = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este objetivo?')) {
      setGoals(goals.filter(g => g.id !== id));
      
      // Fechar o painel de detalhes se o objetivo excluído for o selecionado
      if (selectedGoal?.id === id) {
        setShowDetailsPanel(false);
        setSelectedGoal(null);
      }
    }
  };
  
  const handleViewDetails = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowDetailsPanel(true);
  };
  
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // Se não houver destino ou se o destino for o mesmo que a origem, não faz nada
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }
    
    const goalToMove = goals.find(g => g.id === draggableId);
    
    if (!goalToMove) return;
    
    // Atualizar o status com base no destino
    const newStatus = destination.droppableId as 'backlog' | 'planning' | 'in_progress' | 'completed';
    
    const updatedGoals = goals.map(g => {
      if (g.id === draggableId) {
        // Se o status mudou para 'completed', adiciona a data de conclusão
        const updatedGoal = { 
          ...g, 
          status: newStatus 
        };
        
        if (newStatus === 'completed' && !g.completedAt) {
          updatedGoal.completedAt = new Date().toISOString();
        } else if (newStatus !== 'completed') {
          delete updatedGoal.completedAt;
        }
        
        return updatedGoal;
      }
      return g;
    });
    
    setGoals(updatedGoals);
    
    // Atualizar o objetivo selecionado se estiver sendo movido
    if (selectedGoal && selectedGoal.id === draggableId) {
      const updatedSelectedGoal = updatedGoals.find(g => g.id === draggableId);
      if (updatedSelectedGoal) {
        setSelectedGoal(updatedSelectedGoal);
      }
    }
  };
  
  // Função para obter o estilo da borda baseado na prioridade
  const getBorderColorStyle = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'border-red-500';
      case 'medium':
        return 'border-yellow-500';
      case 'low':
        return 'border-blue-500';
      default:
        return 'border-gray-300';
    }
  };
  
  // Obter metas por status
  const getGoalsByStatus = (status: 'backlog' | 'planning' | 'in_progress' | 'completed') => {
    return goals.filter(goal => goal.status === status);
  };
  
  // Formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-7xl w-full max-h-[90vh] overflow-auto shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <FiTarget className="mr-2 text-indigo-500" /> Planejador de Objetivos
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 flex items-center"
          >
            <FiPlus className="mr-2" /> Novo Objetivo
          </button>
          
          <div className="flex-grow"></div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Baixa</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Média</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Alta</span>
            </div>
          </div>
        </div>
        
        {showAddForm && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-4">
              {editingGoal ? 'Editar Objetivo' : 'Novo Objetivo'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Título</label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="Ex: Aprender React"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 h-20"
                placeholder="Detalhes sobre este objetivo..."
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data limite (opcional)</label>
                <input
                  type="date"
                  value={goalDueDate}
                  onChange={(e) => setGoalDueDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Prioridade</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setGoalPriority('low')}
                    className={`flex-1 p-2 rounded-md ${
                      goalPriority === 'low'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200'
                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    Baixa
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoalPriority('medium')}
                    className={`flex-1 p-2 rounded-md ${
                      goalPriority === 'medium'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border border-yellow-200'
                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    Média
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoalPriority('high')}
                    className={`flex-1 p-2 rounded-md ${
                      goalPriority === 'high'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200'
                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    Alta
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={editingGoal ? updateGoal : addGoal}
                className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
              >
                {editingGoal ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row h-full gap-4">
          <div className={`flex-1 ${showDetailsPanel ? 'md:w-2/3' : 'w-full'}`}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
                {/* Coluna Backlog */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2 h-full">
                  <h3 className="font-medium p-2 text-center mb-2 bg-gray-100 dark:bg-gray-700 rounded-md">Backlog</h3>
                  <Droppable droppableId="backlog">
                    {(provided) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[200px]"
                      >
                        {getGoalsByStatus('backlog').map((goal, index) => (
                          <Draggable key={goal.id} draggableId={goal.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 mb-2 bg-white dark:bg-gray-800 rounded-md shadow-sm border-l-4 ${getBorderColorStyle(goal.priority)}`}
                                onClick={() => handleViewDetails(goal)}
                              >
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium mb-1">{goal.title}</h4>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      editGoal(goal);
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                                  >
                                    <FiEdit2 size={14} />
                                  </button>
                                </div>
                                {goal.dueDate && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                    <FiCalendar size={12} className="mr-1" />
                                    {formatDate(goal.dueDate)}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
                
                {/* Coluna Planejamento */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2 h-full">
                  <h3 className="font-medium p-2 text-center mb-2 bg-gray-100 dark:bg-gray-700 rounded-md">Planejamento</h3>
                  <Droppable droppableId="planning">
                    {(provided) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[200px]"
                      >
                        {getGoalsByStatus('planning').map((goal, index) => (
                          <Draggable key={goal.id} draggableId={goal.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 mb-2 bg-white dark:bg-gray-800 rounded-md shadow-sm border-l-4 ${getBorderColorStyle(goal.priority)}`}
                                onClick={() => handleViewDetails(goal)}
                              >
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium mb-1">{goal.title}</h4>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      editGoal(goal);
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                                  >
                                    <FiEdit2 size={14} />
                                  </button>
                                </div>
                                {goal.dueDate && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                    <FiCalendar size={12} className="mr-1" />
                                    {formatDate(goal.dueDate)}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
                
                {/* Coluna Em Progresso */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2 h-full">
                  <h3 className="font-medium p-2 text-center mb-2 bg-gray-100 dark:bg-gray-700 rounded-md">Em Progresso</h3>
                  <Droppable droppableId="in_progress">
                    {(provided) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[200px]"
                      >
                        {getGoalsByStatus('in_progress').map((goal, index) => (
                          <Draggable key={goal.id} draggableId={goal.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 mb-2 bg-white dark:bg-gray-800 rounded-md shadow-sm border-l-4 ${getBorderColorStyle(goal.priority)}`}
                                onClick={() => handleViewDetails(goal)}
                              >
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium mb-1">{goal.title}</h4>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      editGoal(goal);
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                                  >
                                    <FiEdit2 size={14} />
                                  </button>
                                </div>
                                {goal.dueDate && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                    <FiCalendar size={12} className="mr-1" />
                                    {formatDate(goal.dueDate)}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
                
                {/* Coluna Concluído */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2 h-full">
                  <h3 className="font-medium p-2 text-center mb-2 bg-gray-100 dark:bg-gray-700 rounded-md">Concluído</h3>
                  <Droppable droppableId="completed">
                    {(provided) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[200px]"
                      >
                        {getGoalsByStatus('completed').map((goal, index) => (
                          <Draggable key={goal.id} draggableId={goal.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 mb-2 bg-white dark:bg-gray-800 rounded-md shadow-sm border-l-4 ${getBorderColorStyle(goal.priority)} opacity-70`}
                                onClick={() => handleViewDetails(goal)}
                              >
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium mb-1 line-through">{goal.title}</h4>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      editGoal(goal);
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                                  >
                                    <FiEdit2 size={14} />
                                  </button>
                                </div>
                                {goal.dueDate && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                    <FiCalendar size={12} className="mr-1" />
                                    {formatDate(goal.dueDate)}
                                  </div>
                                )}
                                {goal.completedAt && (
                                  <div className="text-xs text-green-500 flex items-center mt-1">
                                    <FiCheck size={12} className="mr-1" />
                                    Concluído em {formatDate(goal.completedAt)}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </DragDropContext>
          </div>
          
          {showDetailsPanel && selectedGoal && (
            <div className="md:w-1/3 bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Detalhes do Objetivo</h3>
                <button
                  onClick={() => setShowDetailsPanel(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FiX size={16} />
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-xl">{selectedGoal.title}</h4>
                <div className="flex items-center mt-2">
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                      selectedGoal.priority === 'high' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                        : selectedGoal.priority === 'medium' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    <FiFlag className="mr-1" size={12} />
                    {selectedGoal.priority === 'high' 
                      ? 'Alta Prioridade' 
                      : selectedGoal.priority === 'medium' 
                        ? 'Média Prioridade' 
                        : 'Baixa Prioridade'}
                  </span>
                  
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedGoal.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : selectedGoal.status === 'in_progress' 
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' 
                          : selectedGoal.status === 'planning' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {selectedGoal.status === 'completed' 
                      ? 'Concluído' 
                      : selectedGoal.status === 'in_progress' 
                        ? 'Em Progresso' 
                        : selectedGoal.status === 'planning' 
                          ? 'Planejamento'
                          : 'Backlog'}
                  </span>
                </div>
              </div>
              
              {selectedGoal.description && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                    <FiAlignLeft className="mr-1" size={14} /> Descrição
                  </h5>
                  <p className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                    {selectedGoal.description}
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                {selectedGoal.dueDate && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                      <FiCalendar className="mr-1" size={14} /> Data Limite
                    </h5>
                    <p className="text-gray-800 dark:text-gray-200">
                      {formatDate(selectedGoal.dueDate)}
                    </p>
                  </div>
                )}
                
                <div>
                  <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                    <FiClipboard className="mr-1" size={14} /> Criado em
                  </h5>
                  <p className="text-gray-800 dark:text-gray-200">
                    {formatDate(selectedGoal.createdAt)}
                  </p>
                </div>
                
                {selectedGoal.completedAt && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                      <FiCheck className="mr-1" size={14} /> Concluído em
                    </h5>
                    <p className="text-green-600 dark:text-green-400">
                      {formatDate(selectedGoal.completedAt)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex space-x-2">
                <button
                  onClick={() => editGoal(selectedGoal)}
                  className="flex-1 px-3 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 flex items-center justify-center"
                >
                  <FiEdit2 className="mr-1" /> Editar
                </button>
                <button
                  onClick={() => deleteGoal(selectedGoal.id)}
                  className="px-3 py-2 text-red-500 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                >
                  <FiTrash2 className="mr-1" /> Excluir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 