"use client";

import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiX, FiEdit2, FiZap, FiCalendar, FiClock, FiFlag, FiTag, FiCheck, FiList, FiAlertTriangle, FiSliders, FiSave } from 'react-icons/fi';

interface WorkflowRule {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  trigger: {
    type: 'due_date' | 'completion' | 'creation' | 'tag_added' | 'priority_changed';
    value?: string; // tag name, hours_before etc.
  };
  conditions: Array<{
    field: 'list' | 'priority' | 'has_tag' | 'due_date_exists';
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
    value?: string;
  }>;
  actions: Array<{
    type: 'change_priority' | 'add_tag' | 'remove_tag' | 'move_to_list' | 'send_notification';
    value?: string; // tag name, list id, etc.
  }>;
  createdAt: string;
  lastRun?: string;
}

interface WorkflowAutomationProps {
  onClose: () => void;
  lists: { id: string; name: string }[];
  tags: string[];
}

export const WorkflowAutomation: React.FC<WorkflowAutomationProps> = ({ onClose, lists, tags }) => {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRule | null>(null);
  
  // Form fields
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [triggerType, setTriggerType] = useState<'due_date' | 'completion' | 'creation' | 'tag_added' | 'priority_changed'>('due_date');
  const [triggerValue, setTriggerValue] = useState('');
  const [conditions, setConditions] = useState<WorkflowRule['conditions']>([]);
  const [actions, setActions] = useState<WorkflowRule['actions']>([]);
  
  // Load workflows from localStorage on component mount
  useEffect(() => {
    const savedWorkflows = localStorage.getItem('neotask_workflows');
    if (savedWorkflows) {
      try {
        const parsedWorkflows = JSON.parse(savedWorkflows);
        setWorkflows(parsedWorkflows);
      } catch (error) {
        console.error('Erro ao carregar fluxos de trabalho:', error);
      }
    }
  }, []);
  
  // Save workflows to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('neotask_workflows', JSON.stringify(workflows));
  }, [workflows]);
  
  const addWorkflow = () => {
    if (!workflowName.trim()) return;
    
    const newWorkflow: WorkflowRule = {
      id: Date.now().toString(),
      name: workflowName,
      description: workflowDescription,
      active: true,
      trigger: {
        type: triggerType,
        value: triggerValue
      },
      conditions,
      actions,
      createdAt: new Date().toISOString()
    };
    
    setWorkflows([...workflows, newWorkflow]);
    resetForm();
  };
  
  const updateWorkflow = () => {
    if (!selectedWorkflow || !workflowName.trim()) return;
    
    const updatedWorkflows = workflows.map(w => 
      w.id === selectedWorkflow.id 
        ? {
            ...w,
            name: workflowName,
            description: workflowDescription,
            trigger: {
              type: triggerType,
              value: triggerValue
            },
            conditions,
            actions
          } 
        : w
    );
    
    setWorkflows(updatedWorkflows);
    resetForm();
  };
  
  const deleteWorkflow = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fluxo de trabalho?')) {
      setWorkflows(workflows.filter(w => w.id !== id));
      
      if (selectedWorkflow?.id === id) {
        resetForm();
      }
    }
  };
  
  const toggleWorkflowActive = (id: string) => {
    setWorkflows(
      workflows.map(w => 
        w.id === id ? { ...w, active: !w.active } : w
      )
    );
  };
  
  const editWorkflow = (workflow: WorkflowRule) => {
    setSelectedWorkflow(workflow);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setTriggerType(workflow.trigger.type);
    setTriggerValue(workflow.trigger.value || '');
    setConditions([...workflow.conditions]);
    setActions([...workflow.actions]);
    setIsEditMode(true);
  };
  
  const resetForm = () => {
    setWorkflowName('');
    setWorkflowDescription('');
    setTriggerType('due_date');
    setTriggerValue('');
    setConditions([]);
    setActions([]);
    setSelectedWorkflow(null);
    setIsEditMode(false);
  };
  
  const addCondition = () => {
    setConditions([
      ...conditions, 
      { 
        field: 'list', 
        operator: 'equals',
        value: lists.length > 0 ? lists[0].id : ''
      }
    ]);
  };
  
  const updateCondition = (index: number, field: keyof typeof conditions[0], value: string) => {
    const newConditions = [...conditions];
    // @ts-ignore
    newConditions[index][field] = value;
    setConditions(newConditions);
  };
  
  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };
  
  const addAction = () => {
    setActions([
      ...actions, 
      { 
        type: 'change_priority',
        value: 'high'
      }
    ]);
  };
  
  const updateAction = (index: number, field: keyof typeof actions[0], value: string) => {
    const newActions = [...actions];
    // @ts-ignore
    newActions[index][field] = value;
    setActions(newActions);
  };
  
  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };
  
  // Formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getTriggerName = (trigger: WorkflowRule['trigger']) => {
    switch (trigger.type) {
      case 'due_date':
        return `${trigger.value || '24'} horas antes do prazo`;
      case 'completion':
        return 'Quando a tarefa for concluída';
      case 'creation':
        return 'Quando uma nova tarefa for criada';
      case 'tag_added':
        return `Quando a tag "${trigger.value}" for adicionada`;
      case 'priority_changed':
        return `Quando a prioridade mudar para "${trigger.value || 'alta'}"`;
      default:
        return 'Desconhecido';
    }
  };
  
  // Renderiza uma representação em texto amigável das condições
  const getConditionDescription = (condition: WorkflowRule['conditions'][0]) => {
    let fieldName = '';
    switch (condition.field) {
      case 'list': fieldName = 'Lista'; break;
      case 'priority': fieldName = 'Prioridade'; break;
      case 'has_tag': fieldName = 'Tag'; break;
      case 'due_date_exists': fieldName = 'Data de vencimento'; break;
    }
    
    let operatorName = '';
    switch (condition.operator) {
      case 'equals': operatorName = 'igual a'; break;
      case 'not_equals': operatorName = 'diferente de'; break;
      case 'contains': operatorName = 'contém'; break;
      case 'not_contains': operatorName = 'não contém'; break;
      case 'exists': operatorName = 'existe'; break;
      case 'not_exists': operatorName = 'não existe'; break;
    }
    
    if (condition.operator === 'exists' || condition.operator === 'not_exists') {
      return `${fieldName} ${operatorName}`;
    }
    
    // Para o campo 'list', substitui o ID pelo nome da lista
    let value = condition.value || '';
    if (condition.field === 'list') {
      const list = lists.find(l => l.id === value);
      if (list) {
        value = list.name;
      }
    }
    
    return `${fieldName} ${operatorName} "${value}"`;
  };
  
  // Renderiza uma representação em texto amigável das ações
  const getActionDescription = (action: WorkflowRule['actions'][0]) => {
    switch (action.type) {
      case 'change_priority':
        return `Mudar prioridade para "${action.value}"`;
      case 'add_tag':
        return `Adicionar tag "${action.value}"`;
      case 'remove_tag':
        return `Remover tag "${action.value}"`;
      case 'move_to_list':
        const list = lists.find(l => l.id === action.value);
        return `Mover para lista "${list ? list.name : action.value}"`;
      case 'send_notification':
        return `Enviar notificação "${action.value}"`;
      default:
        return 'Ação desconhecida';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-auto shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <FiZap className="mr-2 text-indigo-500" /> Automação de Tarefas
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-300">
            Crie regras de automação para executar ações quando certas condições forem atendidas.
            Automatize tarefas repetitivas e mantenha seu fluxo de trabalho consistente.
          </p>
        </div>
        
        {isEditMode ? (
          <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <FiSliders className="mr-2" /> 
              {selectedWorkflow ? 'Editar Automação' : 'Nova Automação'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Nome da Automação</label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="Ex: Tarefas importantes para a lista Urgente"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
              <textarea
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="Descreva o propósito desta automação..."
                rows={2}
              ></textarea>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium mb-3">Gatilho (Quando executar)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Gatilho</label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  >
                    <option value="due_date">Antes do prazo</option>
                    <option value="completion">Ao concluir a tarefa</option>
                    <option value="creation">Ao criar nova tarefa</option>
                    <option value="tag_added">Quando uma tag for adicionada</option>
                    <option value="priority_changed">Quando a prioridade mudar</option>
                  </select>
                </div>
                
                {(triggerType === 'due_date') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Horas antes do prazo</label>
                    <input
                      type="number"
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      placeholder="Ex: 24"
                    />
                  </div>
                )}
                
                {(triggerType === 'tag_added') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Tag</label>
                    <select
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      {tags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                      {tags.length === 0 && (
                        <option value="">Nenhuma tag disponível</option>
                      )}
                    </select>
                  </div>
                )}
                
                {(triggerType === 'priority_changed') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Prioridade</label>
                    <select
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="média">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Condições (Se)</h4>
                <button
                  onClick={addCondition}
                  className="text-indigo-500 text-sm flex items-center hover:text-indigo-600"
                >
                  <FiPlus className="mr-1" size={14} /> Adicionar Condição
                </button>
              </div>
              
              {conditions.length === 0 ? (
                <div className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  Nenhuma condição. A automação será executada para todas as tarefas que atendam ao gatilho.
                </div>
              ) : (
                <div className="space-y-3">
                  {conditions.map((condition, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                      <select
                        value={condition.field}
                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                        className="p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      >
                        <option value="list">Lista</option>
                        <option value="priority">Prioridade</option>
                        <option value="has_tag">Tag</option>
                        <option value="due_date_exists">Data de vencimento</option>
                      </select>
                      
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        className="p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      >
                        {(condition.field === 'list' || condition.field === 'priority') && (
                          <>
                            <option value="equals">igual a</option>
                            <option value="not_equals">diferente de</option>
                          </>
                        )}
                        
                        {condition.field === 'has_tag' && (
                          <>
                            <option value="contains">contém</option>
                            <option value="not_contains">não contém</option>
                          </>
                        )}
                        
                        {condition.field === 'due_date_exists' && (
                          <>
                            <option value="exists">existe</option>
                            <option value="not_exists">não existe</option>
                          </>
                        )}
                      </select>
                      
                      {!['exists', 'not_exists'].includes(condition.operator) && (
                        condition.field === 'list' ? (
                          <select
                            value={condition.value}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            className="flex-1 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          >
                            {lists.map(list => (
                              <option key={list.id} value={list.id}>{list.name}</option>
                            ))}
                            {lists.length === 0 && (
                              <option value="">Nenhuma lista disponível</option>
                            )}
                          </select>
                        ) : condition.field === 'priority' ? (
                          <select
                            value={condition.value}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            className="flex-1 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          >
                            <option value="baixa">Baixa</option>
                            <option value="média">Média</option>
                            <option value="alta">Alta</option>
                          </select>
                        ) : condition.field === 'has_tag' ? (
                          <select
                            value={condition.value}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            className="flex-1 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          >
                            {tags.map(tag => (
                              <option key={tag} value={tag}>{tag}</option>
                            ))}
                            {tags.length === 0 && (
                              <option value="">Nenhuma tag disponível</option>
                            )}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={condition.value}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            className="flex-1 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          />
                        )
                      )}
                      
                      <button
                        onClick={() => removeCondition(index)}
                        className="p-1 text-gray-500 hover:text-red-500"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Ações (Então)</h4>
                <button
                  onClick={addAction}
                  className="text-indigo-500 text-sm flex items-center hover:text-indigo-600"
                >
                  <FiPlus className="mr-1" size={14} /> Adicionar Ação
                </button>
              </div>
              
              {actions.length === 0 ? (
                <div className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  Nenhuma ação definida. Adicione pelo menos uma ação para esta automação.
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map((action, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                      <select
                        value={action.type}
                        onChange={(e) => updateAction(index, 'type', e.target.value)}
                        className="p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      >
                        <option value="change_priority">Mudar prioridade</option>
                        <option value="add_tag">Adicionar tag</option>
                        <option value="remove_tag">Remover tag</option>
                        <option value="move_to_list">Mover para lista</option>
                        <option value="send_notification">Enviar notificação</option>
                      </select>
                      
                      {action.type === 'change_priority' && (
                        <select
                          value={action.value}
                          onChange={(e) => updateAction(index, 'value', e.target.value)}
                          className="flex-1 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                        >
                          <option value="baixa">Baixa</option>
                          <option value="média">Média</option>
                          <option value="alta">Alta</option>
                        </select>
                      )}
                      
                      {(action.type === 'add_tag' || action.type === 'remove_tag') && (
                        <select
                          value={action.value}
                          onChange={(e) => updateAction(index, 'value', e.target.value)}
                          className="flex-1 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                        >
                          {tags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                          ))}
                          {tags.length === 0 && (
                            <option value="">Nenhuma tag disponível</option>
                          )}
                        </select>
                      )}
                      
                      {action.type === 'move_to_list' && (
                        <select
                          value={action.value}
                          onChange={(e) => updateAction(index, 'value', e.target.value)}
                          className="flex-1 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                        >
                          {lists.map(list => (
                            <option key={list.id} value={list.id}>{list.name}</option>
                          ))}
                          {lists.length === 0 && (
                            <option value="">Nenhuma lista disponível</option>
                          )}
                        </select>
                      )}
                      
                      {action.type === 'send_notification' && (
                        <input
                          type="text"
                          value={action.value}
                          onChange={(e) => updateAction(index, 'value', e.target.value)}
                          className="flex-1 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          placeholder="Mensagem da notificação"
                        />
                      )}
                      
                      <button
                        onClick={() => removeAction(index)}
                        className="p-1 text-gray-500 hover:text-red-500"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={selectedWorkflow ? updateWorkflow : addWorkflow}
                disabled={!workflowName || actions.length === 0}
                className={`px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 flex items-center ${
                  (!workflowName || actions.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FiSave className="mr-2" /> {selectedWorkflow ? 'Atualizar' : 'Salvar'} Automação
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setIsEditMode(true)}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 flex items-center"
            >
              <FiPlus className="mr-2" /> Nova Automação
            </button>
          </div>
        )}
        
        {workflows.length === 0 && !isEditMode ? (
          <div className="text-center py-12">
            <FiZap className="mx-auto text-4xl mb-4 text-gray-400 dark:text-gray-600" />
            <h3 className="text-lg font-medium mb-2">Nenhuma automação criada</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              As automações ajudam a manter suas tarefas organizadas executando ações automáticas
              quando certos eventos acontecem.
            </p>
            <button
              onClick={() => setIsEditMode(true)}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
            >
              Criar primeira automação
            </button>
          </div>
        ) : (
          !isEditMode && (
            <div className="space-y-3">
              {workflows.map(workflow => (
                <div 
                  key={workflow.id} 
                  className={`p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${
                    workflow.active ? '' : 'opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-1">
                        <h3 className="font-medium text-lg">{workflow.name}</h3>
                        <span 
                          className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            workflow.active 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {workflow.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      {workflow.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{workflow.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleWorkflowActive(workflow.id)}
                        className={`p-1.5 rounded-md mr-1 ${
                          workflow.active 
                            ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' 
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {workflow.active ? <FiCheck size={18} /> : <FiClock size={18} />}
                      </button>
                      <button
                        onClick={() => editWorkflow(workflow)}
                        className="p-1.5 rounded-md mr-1 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteWorkflow(workflow.id)}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                        <FiZap className="mr-1" size={14} /> Gatilho
                      </h4>
                      <p className="text-sm">{getTriggerName(workflow.trigger)}</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                        <FiAlertTriangle className="mr-1" size={14} /> Condições
                      </h4>
                      {workflow.conditions.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">Sem condições</p>
                      ) : (
                        <ul className="text-sm space-y-1">
                          {workflow.conditions.map((condition, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-xs bg-gray-200 dark:bg-gray-600 rounded-full w-4 h-4 flex items-center justify-center mr-1.5 mt-0.5">
                                {index + 1}
                              </span>
                              {getConditionDescription(condition)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                        <FiList className="mr-1" size={14} /> Ações
                      </h4>
                      <ul className="text-sm space-y-1">
                        {workflow.actions.map((action, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-xs bg-gray-200 dark:bg-gray-600 rounded-full w-4 h-4 flex items-center justify-center mr-1.5 mt-0.5">
                              {index + 1}
                            </span>
                            {getActionDescription(action)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                    <div>Criado em: {formatDate(workflow.createdAt)}</div>
                    <div>Última execução: {formatDate(workflow.lastRun)}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}; 