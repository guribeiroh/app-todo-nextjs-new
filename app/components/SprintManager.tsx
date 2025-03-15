'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiPlus, FiFlag, FiCheckCircle, FiPlay, FiCheck, FiTrash2, FiEdit2, FiFilter, FiSearch, FiChevronDown, FiChevronUp, FiInfo, FiXCircle, FiChevronRight, FiBarChart2 } from 'react-icons/fi';
import { useScrumContext } from '../context/ScrumContext';
import { differenceInDays, format, isAfter, isBefore, isPast, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from './Toast';
import { Sprint } from '../types';

const SprintManager: React.FC = () => {
  const { 
    sprints, 
    activeSprint, 
    createSprint, 
    updateSprint, 
    deleteSprint, 
    startSprint, 
    completeSprint,
    userStories
  } = useScrumContext();
  
  const { showToast } = useToast();

  // Estados para UI
  const [showNewSprintForm, setShowNewSprintForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sprintForm, setSprintForm] = useState({
    name: '',
    goal: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'), // Padrão: 2 semanas
  });
  const [expandedSprintId, setExpandedSprintId] = useState<string | null>(null);

  // Resetar o formulário
  const resetForm = () => {
    setSprintForm({
      name: '',
      goal: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    });
    setEditingSprint(null);
  };

  // Preencher formulário ao editar sprint
  useEffect(() => {
    if (editingSprint) {
      setSprintForm({
        name: editingSprint.name,
        goal: editingSprint.goal,
        startDate: format(new Date(editingSprint.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(editingSprint.endDate), 'yyyy-MM-dd'),
      });
      setShowNewSprintForm(true);
    }
  }, [editingSprint]);

  // Filtrar e ordenar sprints
  const filteredSprints = sprints
    .filter(sprint => {
      const matchesSearch = sprint.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           sprint.goal.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'all') return matchesSearch;
      if (statusFilter === 'active') return sprint.status === 'active' && matchesSearch;
      if (statusFilter === 'planning') return sprint.status === 'planning' && matchesSearch;
      if (statusFilter === 'completed') return sprint.status === 'completed' && matchesSearch;
      
      return matchesSearch;
    })
    .sort((a, b) => {
      // Ordem: ativos primeiro, depois planejados, depois concluídos
      // Dentro de cada grupo, os mais recentes primeiro
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      
      if (a.status === 'planning' && b.status === 'completed') return -1;
      if (a.status === 'completed' && b.status === 'planning') return 1;
      
      // Se ambos têm o mesmo status, ordenar por data (mais recente primeiro)
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

  // Manipuladores de eventos para criação e atualização de sprints
  const handleSprintFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSprintForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitSprintForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sprintForm.name || !sprintForm.startDate || !sprintForm.endDate) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    
    // Validar datas
    const startDate = new Date(sprintForm.startDate);
    const endDate = new Date(sprintForm.endDate);
    
    if (isAfter(startDate, endDate)) {
      showToast('A data de início não pode ser posterior à data de término', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (editingSprint) {
        // Atualizar sprint existente
        await updateSprint({
          ...editingSprint,
          name: sprintForm.name,
          goal: sprintForm.goal,
          startDate: startDate,
          endDate: endDate,
          updatedAt: new Date()
        });
        showToast('Sprint atualizado com sucesso', 'success');
      } else {
        // Criar novo sprint
        await createSprint({
          name: sprintForm.name,
          goal: sprintForm.goal,
          startDate: startDate,
          endDate: endDate,
          isActive: false,
          status: 'planning',
        });
        showToast('Sprint criado com sucesso', 'success');
      }
      
      // Limpar formulário e fechar
      resetForm();
      setShowNewSprintForm(false);
    } catch (error) {
      showToast(`Erro ao ${editingSprint ? 'atualizar' : 'criar'} sprint`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Manipuladores para ações nos sprints
  const handleStartSprint = async (sprintId: string) => {
    // Verificar se já existe um sprint ativo
    if (activeSprint && activeSprint.id !== sprintId) {
      if (!confirm(`Você já tem um sprint ativo (${activeSprint.name}). Iniciar este sprint irá desativar o atual. Deseja continuar?`)) {
        return;
      }
    }
    
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
    if (!confirm('Tem certeza que deseja concluir este sprint?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await completeSprint(sprintId);
      showToast('Sprint concluído com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao concluir sprint', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    if (!confirm('Tem certeza que deseja excluir este sprint? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await deleteSprint(sprintId);
      showToast('Sprint excluído com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao excluir sprint', 'error');
    } finally {
      setIsLoading(false);
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

  // Função para calcular o progresso do sprint
  const calculateSprintProgress = (sprint: Sprint) => {
    // Filtrar histórias de usuário deste sprint
    const sprintStories = userStories.filter(story => story.sprintId === sprint.id);
    
    // Se não houver histórias, retornar 0%
    if (sprintStories.length === 0) return 0;
    
    // Contar histórias concluídas
    const completedStories = sprintStories.filter(story => story.status === 'done').length;
    
    // Calcular porcentagem
    return Math.round((completedStories / sprintStories.length) * 100);
  };

  // Função para exibir detalhes do sprint
  const renderSprintDetails = (sprint: Sprint) => {
    const isExpanded = expandedSprintId === sprint.id;
    const progress = calculateSprintProgress(sprint);
    const sprintStories = userStories.filter(story => story.sprintId === sprint.id);
    const totalStoryPoints = sprintStories.reduce((sum, story) => sum + story.storyPoints, 0);
    const completedPoints = sprintStories
      .filter(story => story.status === 'done')
      .reduce((sum, story) => sum + story.storyPoints, 0);
    
    return (
      <div className="mt-2">
        <div 
          className="flex items-center justify-between cursor-pointer text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md"
          onClick={() => setExpandedSprintId(isExpanded ? null : sprint.id)}
        >
          <span className="font-medium">Detalhes do Sprint</span>
          {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </div>
        
        {isExpanded && (
          <div className="mt-2 px-2 text-sm space-y-3 animate-fadeIn">
            {sprint.goal && (
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Meta:</span>
                <p className="mt-1 text-gray-800 dark:text-gray-200">{sprint.goal}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Histórias:</span>
                <p className="mt-1 text-gray-800 dark:text-gray-200">{sprintStories.length}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Story Points:</span>
                <p className="mt-1 text-gray-800 dark:text-gray-200">{completedPoints}/{totalStoryPoints}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Data de Início:</span>
                <p className="mt-1 text-gray-800 dark:text-gray-200">
                  {format(new Date(sprint.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Data de Término:</span>
                <p className="mt-1 text-gray-800 dark:text-gray-200">
                  {format(new Date(sprint.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Progresso:</span>
              <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400">
                <span>{progress}% concluído</span>
                {sprint.status === 'active' && (
                  <span>
                    {differenceInDays(new Date(sprint.endDate), new Date())} dias restantes
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar UI
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center mb-2">
              <FiCalendar className="mr-2 text-indigo-500" size={20} />
              Gerenciamento de Sprints
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Planeje, organize e monitore seus sprints de desenvolvimento
            </p>
          </div>
          
          {!showNewSprintForm && (
            <button
              onClick={() => {
                resetForm();
                setShowNewSprintForm(true);
              }}
              className="btn-primary flex items-center"
            >
              <FiPlus className="mr-1" />
              Novo Sprint
            </button>
          )}
        </div>
        
        <AnimatePresence mode="wait">
          {showNewSprintForm ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-lg mb-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FiFlag className="mr-2 text-indigo-500" size={18} />
                {editingSprint ? 'Editar Sprint' : 'Novo Sprint'}
              </h3>
              
              <form onSubmit={handleSubmitSprintForm}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nome do Sprint *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={sprintForm.name}
                      onChange={handleSprintFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                      placeholder="Ex: Sprint 1 - Login e cadastro"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Meta do Sprint
                    </label>
                    <textarea
                      name="goal"
                      value={sprintForm.goal}
                      onChange={handleSprintFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                      placeholder="Ex: Implementar funcionalidades de login e cadastro, incluindo recuperação de senha"
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
                        value={sprintForm.startDate}
                        onChange={handleSprintFormChange}
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
                        value={sprintForm.endDate}
                        onChange={handleSprintFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowNewSprintForm(false);
                    }}
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
                    {isLoading ? 'Salvando...' : editingSprint ? 'Atualizar Sprint' : 'Criar Sprint'}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <>
              <div className="mb-4 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar sprint..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <FiFilter size={16} className="mr-1" />
                    <span>Status:</span>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm dark:bg-gray-700"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Em andamento</option>
                    <option value="planning">Planejamento</option>
                    <option value="completed">Concluídos</option>
                  </select>
                </div>
              </div>
              
              {filteredSprints.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <FiInfo size={40} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">Nenhum sprint encontrado</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Nenhum sprint corresponde aos seus filtros de busca.'
                        : 'Você ainda não tem nenhum sprint. Vamos começar criando o primeiro!'}
                    </p>
                    <button
                      onClick={() => {
                        resetForm();
                        setShowNewSprintForm(true);
                      }}
                      className="btn-primary"
                    >
                      <FiPlus className="mr-1" />
                      Criar Primeiro Sprint
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredSprints.map(sprint => {
                    const isActive = sprint.isActive;
                    const daysLeft = differenceInDays(new Date(sprint.endDate), new Date());
                    const isPastDue = isPast(new Date(sprint.endDate)) && sprint.status !== 'completed';
                    
                    return (
                      <div
                        key={sprint.id}
                        className={`border rounded-lg p-4 transition-all ${
                          isActive 
                            ? 'border-indigo-300 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                            : isPastDue
                              ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/10'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
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
                              {format(new Date(sprint.startDate), 'dd/MM/yyyy', { locale: ptBR })} até {format(new Date(sprint.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          </div>
                          
                          <div className="flex items-center mt-2 md:mt-0">
                            <span className={`text-sm px-2 py-0.5 rounded-full mr-3 ${
                              sprint.status === 'completed'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : sprint.status === 'active'
                                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }`}>
                              {getSprintStatusText(sprint.status)}
                            </span>
                            
                            <div className="flex space-x-1">
                              {sprint.status === 'planning' && (
                                <button
                                  onClick={() => handleStartSprint(sprint.id)}
                                  disabled={isLoading}
                                  className="p-1.5 rounded-full text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  title="Iniciar Sprint"
                                >
                                  <FiPlay size={16} />
                                </button>
                              )}
                              
                              {sprint.status === 'active' && (
                                <button
                                  onClick={() => handleCompleteSprint(sprint.id)}
                                  disabled={isLoading}
                                  className="p-1.5 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  title="Completar Sprint"
                                >
                                  <FiCheck size={16} />
                                </button>
                              )}
                              
                              <button
                                onClick={() => setEditingSprint(sprint)}
                                disabled={isLoading || sprint.status === 'completed'}
                                className={`p-1.5 rounded-full ${
                                  sprint.status === 'completed'
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                }`}
                                title={sprint.status === 'completed' ? 'Não é possível editar um sprint concluído' : 'Editar Sprint'}
                              >
                                <FiEdit2 size={16} />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteSprint(sprint.id)}
                                disabled={isLoading}
                                className="p-1.5 rounded-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Excluir Sprint"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {renderSprintDetails(sprint)}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SprintManager; 