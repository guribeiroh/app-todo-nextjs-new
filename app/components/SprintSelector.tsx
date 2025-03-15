'use client';

import React, { useState } from 'react';
import { FiCalendar, FiPlus, FiFlag, FiCheckCircle, FiXCircle, FiClock, FiPlay, FiCheck, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useScrumContext } from '../context/ScrumContext';
import { format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from './Toast';

interface SprintSelectorProps {
  onClose: () => void;
  onSelectSprint?: (sprintId: string) => void;
  currentSprintId?: string;
}

const SprintSelector: React.FC<SprintSelectorProps> = ({ onClose, onSelectSprint, currentSprintId }) => {
  const { 
    sprints, 
    activeSprint, 
    createSprint, 
    updateSprint, 
    deleteSprint, 
    startSprint, 
    completeSprint 
  } = useScrumContext();
  
  const { showToast } = useToast();
  
  const [showNewSprintForm, setShowNewSprintForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para o novo sprint
  const [newSprint, setNewSprint] = useState({
    name: '',
    goal: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'), // Padrão: 2 semanas
  });
  
  // Ordenar sprints: ativos primeiro, depois por data de início (mais recentes primeiro)
  const sortedSprints = [...sprints].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });
  
  const handleNewSprintChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSprint(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await createSprint({
        name: newSprint.name,
        goal: newSprint.goal,
        startDate: new Date(newSprint.startDate),
        endDate: new Date(newSprint.endDate),
        isActive: false,
        status: 'planning',
        completedAt: undefined,
        updatedAt: undefined,
      });
      
      showToast('Sprint criado com sucesso', 'success');
      setShowNewSprintForm(false);
      setNewSprint({
        name: '',
        goal: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
      });
    } catch (error) {
      showToast('Erro ao criar sprint', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartSprint = async (sprintId: string) => {
    setIsLoading(true);
    
    try {
      await startSprint(sprintId);
      showToast('Sprint iniciado com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao iniciar sprint', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCompleteSprint = async (sprintId: string) => {
    if (window.confirm('Tem certeza que deseja concluir este sprint?')) {
      setIsLoading(true);
      
      try {
        await completeSprint(sprintId);
        showToast('Sprint concluído com sucesso', 'success');
      } catch (error) {
        showToast('Erro ao concluir sprint', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleDeleteSprint = async (sprintId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este sprint? Esta ação não pode ser desfeita.')) {
      setIsLoading(true);
      
      try {
        await deleteSprint(sprintId);
        showToast('Sprint excluído com sucesso', 'success');
      } catch (error) {
        showToast('Erro ao excluir sprint', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Função para obter o status do sprint formatado em português
  const getSprintStatusText = (status: string) => {
    switch (status) {
      case 'planning': return 'Planejamento';
      case 'active': return 'Em Andamento';
      case 'review': return 'Em Revisão';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };
  
  // Função para selecionar um sprint
  const handleSelectSprint = (sprintId: string) => {
    if (onSelectSprint) {
      onSelectSprint(sprintId);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold flex items-center">
            <FiCalendar className="mr-2 text-indigo-500" size={20} />
            Gerenciar Sprints
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiXCircle size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {!showNewSprintForm ? (
            <>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Sprints Disponíveis</h3>
                <button
                  onClick={() => setShowNewSprintForm(true)}
                  className="btn-primary flex items-center text-sm"
                >
                  <FiPlus className="mr-1" size={14} />
                  Novo Sprint
                </button>
              </div>
              
              {sortedSprints.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Nenhum sprint encontrado. Crie seu primeiro sprint para começar.
                  </p>
                  <button
                    onClick={() => setShowNewSprintForm(true)}
                    className="btn-primary"
                  >
                    Criar Primeiro Sprint
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedSprints.map(sprint => {
                    const isActive = sprint.isActive;
                    const isPast = new Date(sprint.endDate) < new Date();
                    const daysLeft = differenceInDays(new Date(sprint.endDate), new Date());
                    const startDate = format(new Date(sprint.startDate), 'dd/MM/yyyy', { locale: ptBR });
                    const endDate = format(new Date(sprint.endDate), 'dd/MM/yyyy', { locale: ptBR });
                    
                    return (
                      <div 
                        key={sprint.id}
                        className={`border rounded-lg p-4 ${
                          isActive 
                            ? 'border-indigo-300 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium text-lg flex items-center">
                              {sprint.name}
                              {isActive && (
                                <span className="ml-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full">
                                  Ativo
                                </span>
                              )}
                            </h4>
                            
                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <FiCalendar className="mr-1" size={14} />
                              {startDate} até {endDate}
                            </div>
                            
                            {sprint.goal && (
                              <div className="mt-1 text-sm">
                                <span className="font-medium">Meta:</span> {sprint.goal}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className={`text-sm px-2 py-0.5 rounded-full ${
                              sprint.status === 'completed'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : sprint.status === 'active'
                                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }`}>
                              {getSprintStatusText(sprint.status)}
                            </span>
                            
                            {isActive && daysLeft >= 0 && (
                              <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                {daysLeft} dias restantes
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex justify-between">
                          <div>
                            {sprint.id === currentSprintId ? (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded flex items-center">
                                <FiCheck size={12} className="mr-1" />
                                Selecionado
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectSprint(sprint.id)}
                                className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center"
                              >
                                <FiPlay size={12} className="mr-1" />
                                Selecionar
                              </button>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            {sprint.status === 'planning' && (
                              <button
                                onClick={() => handleStartSprint(sprint.id)}
                                disabled={isLoading}
                                className="btn-outline-success text-xs"
                              >
                                <FiPlay className="mr-1" size={12} />
                                Iniciar
                              </button>
                            )}
                            
                            {sprint.status === 'active' && (
                              <button
                                onClick={() => handleCompleteSprint(sprint.id)}
                                disabled={isLoading}
                                className="btn-outline-info text-xs"
                              >
                                <FiCheck className="mr-1" size={12} />
                                Completar
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteSprint(sprint.id)}
                              disabled={isLoading}
                              className="btn-outline-danger text-xs"
                            >
                              <FiTrash2 className="mr-1" size={12} />
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-4">Novo Sprint</h3>
              
              <form onSubmit={handleCreateSprint}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nome do Sprint *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newSprint.name}
                      onChange={handleNewSprintChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                      placeholder="Ex: Sprint 1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Meta do Sprint
                    </label>
                    <textarea
                      name="goal"
                      value={newSprint.goal}
                      onChange={handleNewSprintChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                      placeholder="Ex: Implementar recursos X, Y e Z"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Data de início *
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={newSprint.startDate}
                        onChange={handleNewSprintChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Data de término *
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={newSprint.endDate}
                        onChange={handleNewSprintChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewSprintForm(false)}
                    className="btn-outline"
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Criando...' : 'Criar Sprint'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SprintSelector; 