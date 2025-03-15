'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, isBefore } from 'date-fns';
import { FiCalendar, FiFlag, FiTarget, FiClock } from 'react-icons/fi';
import { Sprint } from '../types';

interface SprintFormProps {
  sprint?: Sprint | null;
  onSave: (sprint: Sprint) => void;
  onCancel: () => void;
}

const SprintForm: React.FC<SprintFormProps> = ({ sprint, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  
  // Carregar dados do sprint se estiver editando
  useEffect(() => {
    if (sprint) {
      setName(sprint.name || '');
      setGoal(sprint.goal || '');
      setStartDate(format(new Date(sprint.startDate), 'yyyy-MM-dd'));
      setEndDate(format(new Date(sprint.endDate), 'yyyy-MM-dd'));
    }
  }, [sprint]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !startDate || !endDate) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isBefore(end, start)) {
      alert('A data de término deve ser posterior à data de início');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const sprintData: Sprint = {
        id: sprint?.id || '',
        name,
        goal,
        startDate: start,
        endDate: end,
        isActive: sprint?.isActive || false,
        status: sprint?.status || 'planning',
        createdAt: sprint?.createdAt || new Date(),
        updatedAt: new Date(),
        completedAt: sprint?.completedAt
      };
      
      onSave(sprintData);
    } catch (error) {
      console.error('Erro ao salvar sprint:', error);
      alert('Ocorreu um erro ao salvar o sprint');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nome do Sprint *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiTarget className="text-gray-400" size={16} />
          </div>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10 px-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Ex: Sprint 1"
            required
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Objetivo do Sprint
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFlag className="text-gray-400" size={16} />
          </div>
          <textarea
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={3}
            className="pl-10 px-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Ex: Implementar as funcionalidades X e Y, e resolver os bugs Z"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data de Início *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiCalendar className="text-gray-400" size={16} />
            </div>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10 px-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data de Término *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiCalendar className="text-gray-400" size={16} />
            </div>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10 px-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md flex items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <FiClock className="animate-spin mr-2" size={16} />
              Processando...
            </>
          ) : (
            <>{sprint ? 'Atualizar' : 'Criar'} Sprint</>
          )}
        </button>
      </div>
    </form>
  );
};

export default SprintForm; 