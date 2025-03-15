"use client";

import React, { useState, useEffect } from 'react';
import { FiCheck, FiActivity, FiTrendingUp, FiCalendar, FiPlus, FiTrash2, FiX, FiEdit2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'workdays' | 'custom';
  customDays?: number[]; // 0 = domingo, 1 = segunda, etc.
  color: string;
  icon?: string;
  startDate: Date;
  streak: number;
  completedDates: string[]; // ISO date strings
}

interface HabitsTrackerProps {
  onClose: () => void;
}

export const HabitsTracker: React.FC<HabitsTrackerProps> = ({ onClose }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  
  // Form fields
  const [habitName, setHabitName] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekly' | 'workdays' | 'custom'>('daily');
  const [habitColor, setHabitColor] = useState('#4F46E5');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  
  // Load habits from localStorage on component mount
  useEffect(() => {
    const savedHabits = localStorage.getItem('neotask_habits');
    if (savedHabits) {
      try {
        const parsedHabits = JSON.parse(savedHabits);
        setHabits(parsedHabits);
      } catch (error) {
        console.error('Erro ao carregar hábitos:', error);
      }
    }
  }, []);
  
  // Save habits to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('neotask_habits', JSON.stringify(habits));
  }, [habits]);
  
  const addHabit = () => {
    if (!habitName.trim()) return;
    
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: habitName,
      description: habitDescription,
      frequency: habitFrequency,
      customDays: habitFrequency === 'custom' ? selectedDays : undefined,
      color: habitColor,
      startDate: new Date(),
      streak: 0,
      completedDates: []
    };
    
    setHabits([...habits, newHabit]);
    resetForm();
  };
  
  const updateHabit = () => {
    if (!editingHabit || !habitName.trim()) return;
    
    const updatedHabits = habits.map(h => 
      h.id === editingHabit.id 
        ? {
            ...h,
            name: habitName,
            description: habitDescription,
            frequency: habitFrequency,
            customDays: habitFrequency === 'custom' ? selectedDays : undefined,
            color: habitColor
          } 
        : h
    );
    
    setHabits(updatedHabits);
    resetForm();
  };
  
  const deleteHabit = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este hábito? Todos os dados de progresso serão perdidos.')) {
      setHabits(habits.filter(h => h.id !== id));
    }
  };
  
  const resetForm = () => {
    setHabitName('');
    setHabitDescription('');
    setHabitFrequency('daily');
    setHabitColor('#4F46E5');
    setSelectedDays([]);
    setShowAddForm(false);
    setEditingHabit(null);
  };
  
  const editHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitDescription(habit.description || '');
    setHabitFrequency(habit.frequency);
    setHabitColor(habit.color);
    setSelectedDays(habit.customDays || []);
    setShowAddForm(true);
  };
  
  const toggleHabitCompletion = (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habit.completedDates.includes(today);
    
    const updatedHabit = { ...habit };
    
    if (completedToday) {
      // Remove today from completed dates
      updatedHabit.completedDates = habit.completedDates.filter(date => date !== today);
      // Decrement streak if needed
      if (updatedHabit.streak > 0) {
        updatedHabit.streak -= 1;
      }
    } else {
      // Add today to completed dates
      updatedHabit.completedDates = [...habit.completedDates, today];
      // Increment streak
      updatedHabit.streak += 1;
    }
    
    setHabits(habits.map(h => h.id === habit.id ? updatedHabit : h));
  };
  
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      direction === 'prev' ? newDate.setDate(newDate.getDate() - 1) : newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      direction === 'prev' ? newDate.setDate(newDate.getDate() - 7) : newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === 'month') {
      direction === 'prev' ? newDate.setMonth(newDate.getMonth() - 1) : newDate.setMonth(newDate.getMonth() + 1);
    }
    
    setCurrentDate(newDate);
  };
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  const shouldShowHabitForDate = (habit: Habit, date: Date): boolean => {
    const dayOfWeek = date.getDay(); // 0 = domingo, 1 = segunda, etc.
    
    switch (habit.frequency) {
      case 'daily':
        return true;
      case 'weekly':
        // Se for domingo
        return dayOfWeek === 0;
      case 'workdays':
        // Se for de segunda a sexta
        return dayOfWeek > 0 && dayOfWeek < 6;
      case 'custom':
        return habit.customDays?.includes(dayOfWeek) || false;
      default:
        return true;
    }
  };
  
  const isHabitCompletedForDate = (habit: Habit, date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0];
    return habit.completedDates.includes(dateString);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center">
            <FiActivity className="mr-2 text-indigo-500" /> Rastreador de Hábitos
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="relative bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner flex items-center">
            <div 
              className="absolute h-8 transition-all duration-300 ease-in-out bg-gradient-to-r from-indigo-500/80 to-indigo-600/80 rounded-lg shadow-md"
              style={{
                left: viewMode === 'day' ? '4px' : viewMode === 'week' ? '33.33%' : '66.66%',
                width: 'calc(33.33% - 8px)',
                transform: viewMode === 'week' ? 'translateX(-4px)' : viewMode === 'month' ? 'translateX(-8px)' : 'none',
              }}
            />
            <button 
              onClick={() => setViewMode('day')}
              className={`relative z-10 flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 w-20
                ${viewMode === 'day' ? 'text-white' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Dia
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={`relative z-10 flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 w-20
                ${viewMode === 'week' ? 'text-white' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setViewMode('month')}
              className={`relative z-10 flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 w-20
                ${viewMode === 'month' ? 'text-white' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Mês
            </button>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => navigateDate('prev')}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiChevronLeft size={20} />
            </button>
            
            <div className="mx-2 font-medium">
              {formatDate(currentDate)}
            </div>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 flex items-center"
          >
            <FiPlus className="mr-1" /> Novo Hábito
          </button>
        </div>
        
        {showAddForm ? (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-4">
              {editingHabit ? 'Editar Hábito' : 'Novo Hábito'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Hábito</label>
                <input
                  type="text"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  placeholder="Ex: Beber água"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Cor</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={habitColor}
                    onChange={(e) => setHabitColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <select
                    value={habitColor}
                    onChange={(e) => setHabitColor(e.target.value)}
                    className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  >
                    <option value="#4F46E5">Indigo</option>
                    <option value="#10B981">Esmeralda</option>
                    <option value="#EF4444">Vermelho</option>
                    <option value="#F59E0B">Âmbar</option>
                    <option value="#6366F1">Roxo</option>
                    <option value="#EC4899">Rosa</option>
                    <option value="#06B6D4">Ciano</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
              <textarea
                value={habitDescription}
                onChange={(e) => setHabitDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 h-20"
                placeholder="Detalhes sobre este hábito..."
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Frequência</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setHabitFrequency('daily')}
                  className={`p-2 rounded-md text-center ${
                    habitFrequency === 'daily'
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  Diário
                </button>
                <button
                  type="button"
                  onClick={() => setHabitFrequency('weekly')}
                  className={`p-2 rounded-md text-center ${
                    habitFrequency === 'weekly'
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  Semanal (dom)
                </button>
                <button
                  type="button"
                  onClick={() => setHabitFrequency('workdays')}
                  className={`p-2 rounded-md text-center ${
                    habitFrequency === 'workdays'
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  Dias úteis
                </button>
                <button
                  type="button"
                  onClick={() => setHabitFrequency('custom')}
                  className={`p-2 rounded-md text-center ${
                    habitFrequency === 'custom'
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  Personalizado
                </button>
              </div>
            </div>
            
            {habitFrequency === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Dias da semana</label>
                <div className="flex flex-wrap gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (selectedDays.includes(index)) {
                          setSelectedDays(selectedDays.filter(d => d !== index));
                        } else {
                          setSelectedDays([...selectedDays, index]);
                        }
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedDays.includes(index)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={editingHabit ? updateHabit : addHabit}
                className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
              >
                {editingHabit ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </div>
        ) : null}
        
        {habits.length === 0 ? (
          <div className="text-center py-12">
            <FiActivity className="mx-auto text-4xl mb-4 text-gray-400 dark:text-gray-600" />
            <h3 className="text-lg font-medium mb-2">Nenhum hábito criado</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Crie hábitos para rastrear suas rotinas diárias e construir consistência
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
            >
              Criar primeiro hábito
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {habits
              .filter(habit => shouldShowHabitForDate(habit, currentDate))
              .map(habit => (
                <div 
                  key={habit.id} 
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  style={{borderLeftWidth: '4px', borderLeftColor: habit.color}}
                >
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleHabitCompletion(habit)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 border-2 ${
                        isHabitCompletedForDate(habit, currentDate)
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {isHabitCompletedForDate(habit, currentDate) && <FiCheck size={14} />}
                    </button>
                    
                    <div>
                      <h3 className="font-medium">{habit.name}</h3>
                      {habit.description && <p className="text-sm text-gray-500 dark:text-gray-400">{habit.description}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm flex items-center">
                      <FiTrendingUp className="mr-1" size={14} /> 
                      <span>{habit.streak} dias</span>
                    </div>
                    
                    <button
                      onClick={() => editHabit(habit)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}; 