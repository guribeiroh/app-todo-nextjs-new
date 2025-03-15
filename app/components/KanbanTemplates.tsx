import React, { useState, useCallback } from 'react';
import { KanbanColumn } from '../types';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiSave, FiDownload, FiUpload, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Interface para os modelos de Kanban
export interface KanbanTemplateColumn {
  id: string;
  name: string;
  color?: string;
  order: number;
}

export interface KanbanTemplate {
  id: string;
  name: string;
  description: string;
  columns: KanbanTemplateColumn[];
  isCustom?: boolean;
}

// Modelo Scrum
const scrumTemplate: KanbanTemplate = {
  id: 'scrum',
  name: 'Scrum',
  description: 'Modelo baseado na metodologia Scrum com colunas para Product Backlog, Sprint Backlog, Em Progresso, Revisão e Concluído.',
  columns: [
    { id: 'product-backlog', name: 'Product Backlog', color: '#4B5563', order: 0 },
    { id: 'sprint-backlog', name: 'Sprint Backlog', color: '#1E40AF', order: 1 },
    { id: 'in-progress', name: 'Em Progresso', color: '#047857', order: 2 },
    { id: 'review', name: 'Revisão', color: '#B45309', order: 3 },
    { id: 'done', name: 'Concluído', color: '#5B21B6', order: 4 }
  ]
};

// Modelo Kanban simples
const simpleKanbanTemplate: KanbanTemplate = {
  id: 'simple-kanban',
  name: 'Kanban Simples',
  description: 'Modelo básico de Kanban com colunas para A Fazer, Em Progresso e Concluído.',
  columns: [
    { id: 'to-do', name: 'A Fazer', color: '#4B5563', order: 0 },
    { id: 'in-progress', name: 'Em Progresso', color: '#047857', order: 1 },
    { id: 'done', name: 'Concluído', color: '#5B21B6', order: 2 }
  ]
};

// Modelo de fluxo de trabalho
const workflowTemplate: KanbanTemplate = {
  id: 'workflow',
  name: 'Fluxo de Trabalho',
  description: 'Modelo para fluxos de trabalho com colunas para Planejamento, Desenvolvimento, Revisão, Testes e Produção.',
  columns: [
    { id: 'planning', name: 'Planejamento', color: '#4B5563', order: 0 },
    { id: 'development', name: 'Desenvolvimento', color: '#1E40AF', order: 1 },
    { id: 'review', name: 'Revisão', color: '#B45309', order: 2 },
    { id: 'testing', name: 'Testes', color: '#9D174D', order: 3 },
    { id: 'production', name: 'Produção', color: '#5B21B6', order: 4 }
  ]
};

// Modelo de Design Thinking
const designThinkingTemplate: KanbanTemplate = {
  id: 'design-thinking',
  name: 'Design Thinking',
  description: 'Modelo baseado no processo de Design Thinking com colunas para Empatia, Definição, Ideação, Prototipagem e Testes.',
  columns: [
    { id: 'empathize', name: 'Empatia', color: '#4B5563', order: 0 },
    { id: 'define', name: 'Definição', color: '#1E40AF', order: 1 },
    { id: 'ideate', name: 'Ideação', color: '#B45309', order: 2 },
    { id: 'prototype', name: 'Prototipagem', color: '#9D174D', order: 3 },
    { id: 'test', name: 'Testes', color: '#5B21B6', order: 4 }
  ]
};

// Modelo personalizado para gestão de projetos
const projectManagementTemplate: KanbanTemplate = {
  id: 'project-management',
  name: 'Gestão de Projetos',
  description: 'Modelo para gestão de projetos com colunas para Backlog, Priorizado, Em Progresso, Bloqueado, Em Revisão e Concluído.',
  columns: [
    { id: 'backlog', name: 'Backlog', color: '#4B5563', order: 0 },
    { id: 'prioritized', name: 'Priorizado', color: '#1E40AF', order: 1 },
    { id: 'in-progress', name: 'Em Progresso', color: '#047857', order: 2 },
    { id: 'blocked', name: 'Bloqueado', color: '#DC2626', order: 3 },
    { id: 'review', name: 'Em Revisão', color: '#B45309', order: 4 },
    { id: 'done', name: 'Concluído', color: '#5B21B6', order: 5 }
  ]
};

// Lista com todos os modelos disponíveis
export const kanbanTemplates: KanbanTemplate[] = [
  scrumTemplate,
  simpleKanbanTemplate,
  workflowTemplate,
  designThinkingTemplate,
  projectManagementTemplate
];

// Hook para gerenciar modelos personalizados
const useCustomTemplates = () => {
  const [customTemplates, setCustomTemplates] = useState<KanbanTemplate[]>(() => {
    // Carregar modelos personalizados do localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('custom_kanban_templates');
        return saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.error('Erro ao carregar modelos personalizados:', error);
        return [];
      }
    }
    return [];
  });

  // Salvar modelos personalizados no localStorage
  const saveTemplates = useCallback((templates: KanbanTemplate[]) => {
    setCustomTemplates(templates);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('custom_kanban_templates', JSON.stringify(templates));
      } catch (error) {
        console.error('Erro ao salvar modelos personalizados:', error);
      }
    }
  }, []);

  // Adicionar novo modelo personalizado
  const addCustomTemplate = useCallback((template: KanbanTemplate) => {
    const newTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      isCustom: true
    };
    const updated = [...customTemplates, newTemplate];
    saveTemplates(updated);
    return newTemplate;
  }, [customTemplates, saveTemplates]);

  // Atualizar modelo personalizado existente
  const updateCustomTemplate = useCallback((id: string, updatedTemplate: Partial<KanbanTemplate>) => {
    const templates = customTemplates.map(template => 
      template.id === id ? { ...template, ...updatedTemplate } : template
    );
    saveTemplates(templates);
  }, [customTemplates, saveTemplates]);

  // Remover modelo personalizado
  const removeCustomTemplate = useCallback((id: string) => {
    const templates = customTemplates.filter(template => template.id !== id);
    saveTemplates(templates);
  }, [customTemplates, saveTemplates]);

  // Exportar modelo como JSON
  const exportTemplate = useCallback((id: string) => {
    const template = customTemplates.find(t => t.id === id);
    if (!template) return null;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${template.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [customTemplates]);

  // Importar modelo de JSON
  const importTemplate = useCallback((jsonData: string) => {
    try {
      const template = JSON.parse(jsonData) as KanbanTemplate;
      if (!template.id || !template.name || !template.columns) {
        throw new Error('Formato de modelo inválido');
      }
      
      // Garantir que é marcado como personalizado
      const newTemplate = {
        ...template,
        id: `custom-${Date.now()}`,
        isCustom: true
      };
      
      const updated = [...customTemplates, newTemplate];
      saveTemplates(updated);
      return newTemplate;
    } catch (error) {
      console.error('Erro ao importar modelo:', error);
      return null;
    }
  }, [customTemplates, saveTemplates]);

  return {
    customTemplates,
    addCustomTemplate,
    updateCustomTemplate,
    removeCustomTemplate,
    exportTemplate,
    importTemplate
  };
};

// Componente para seleção de modelo
interface TemplateSelectProps {
  onSelect: (template: KanbanTemplate) => void;
}

export const KanbanTemplateSelector: React.FC<TemplateSelectProps> = ({ onSelect }) => {
  const {
    customTemplates,
    addCustomTemplate,
    updateCustomTemplate,
    removeCustomTemplate,
    exportTemplate,
    importTemplate
  } = useCustomTemplates();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<KanbanTemplate>({
    id: '',
    name: '',
    description: '',
    columns: [
      { id: 'column-1', name: 'Coluna 1', color: '#4B5563', order: 0 },
      { id: 'column-2', name: 'Coluna 2', color: '#1E40AF', order: 1 },
      { id: 'column-3', name: 'Coluna 3', color: '#047857', order: 2 }
    ],
    isCustom: true
  });
  const [importError, setImportError] = useState<string | null>(null);
  
  // Adicionar nova coluna ao modelo em criação/edição
  const addColumn = () => {
    setNewTemplate(current => ({
      ...current,
      columns: [
        ...current.columns,
        {
          id: `column-${current.columns.length + 1}`,
          name: `Coluna ${current.columns.length + 1}`,
          color: '#6366F1',
          order: current.columns.length
        }
      ]
    }));
  };
  
  // Remover coluna do modelo em criação/edição
  const removeColumn = (columnId: string) => {
    setNewTemplate(current => ({
      ...current,
      columns: current.columns.filter(column => column.id !== columnId)
    }));
  };
  
  // Atualizar propriedade de coluna do modelo em criação/edição
  const updateColumn = (columnId: string, property: string, value: string) => {
    setNewTemplate(current => ({
      ...current,
      columns: current.columns.map(column => 
        column.id === columnId ? { ...column, [property]: value } : column
      )
    }));
  };
  
  // Salvar novo modelo
  const saveNewTemplate = () => {
    if (newTemplate.name.trim() === '') {
      alert('Por favor, dê um nome ao modelo');
      return;
    }
    
    if (newTemplate.columns.length === 0) {
      alert('Adicione pelo menos uma coluna ao modelo');
      return;
    }
    
    if (isEditing) {
      updateCustomTemplate(isEditing, newTemplate);
      setIsEditing(null);
    } else {
      addCustomTemplate(newTemplate);
      setIsCreating(false);
    }
    
    // Reiniciar o formulário
    setNewTemplate({
      id: '',
      name: '',
      description: '',
      columns: [
        { id: 'column-1', name: 'Coluna 1', color: '#4B5563', order: 0 },
        { id: 'column-2', name: 'Coluna 2', color: '#1E40AF', order: 1 },
        { id: 'column-3', name: 'Coluna 3', color: '#047857', order: 2 }
      ],
      isCustom: true
    });
  };
  
  // Iniciar edição de modelo existente
  const startEditing = (template: KanbanTemplate) => {
    setIsEditing(template.id);
    setNewTemplate({...template});
  };
  
  // Cancelar criação/edição
  const cancelEdit = () => {
    setIsCreating(false);
    setIsEditing(null);
    setNewTemplate({
      id: '',
      name: '',
      description: '',
      columns: [
        { id: 'column-1', name: 'Coluna 1', color: '#4B5563', order: 0 },
        { id: 'column-2', name: 'Coluna 2', color: '#1E40AF', order: 1 },
        { id: 'column-3', name: 'Coluna 3', color: '#047857', order: 2 }
      ],
      isCustom: true
    });
  };
  
  // Lidar com upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const imported = importTemplate(result);
          if (!imported) {
            setImportError('Erro ao importar modelo. Verifique se o arquivo está no formato correto.');
          }
        }
      } catch (error) {
        setImportError('Erro ao ler arquivo. Verifique se é um arquivo JSON válido.');
      }
    };
    reader.readAsText(file);
    
    // Limpar o input para permitir o upload do mesmo arquivo novamente
    e.target.value = '';
  };
  
  // Todos os modelos (padrão + personalizados)
  const allTemplates = [...kanbanTemplates, ...customTemplates];
  
  return (
    <div className="p-4">
      {/* Cabeçalho com opções */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">Modelos de Quadro</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm flex items-center hover:bg-indigo-700 transition-colors"
          >
            <FiPlus className="mr-1" size={16} />
            Criar Modelo
          </button>
          
          <label className="cursor-pointer px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm flex items-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <FiUpload className="mr-1" size={16} />
            Importar
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>
      
      {/* Mensagem de erro de importação */}
      {importError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md flex items-center">
          <FiX className="mr-2 flex-shrink-0" />
          <span className="text-sm">{importError}</span>
          <button 
            onClick={() => setImportError(null)} 
            className="ml-auto p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded-full"
          >
            <FiX size={14} />
          </button>
        </div>
      )}
      
      {/* Formulário de criação/edição de modelo */}
      <AnimatePresence>
        {(isCreating || isEditing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-800 dark:text-white">
                  {isEditing ? 'Editar Modelo' : 'Novo Modelo'}
                </h3>
                <button 
                  onClick={cancelEdit}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-full"
                >
                  <FiX size={16} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome do Modelo
                  </label>
                  <input 
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(current => ({ ...current, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: Meu Modelo Personalizado"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea 
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(current => ({ ...current, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Descreva brevemente o propósito deste modelo"
                    rows={2}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Colunas
                    </label>
                    <button
                      onClick={addColumn}
                      className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded flex items-center hover:bg-indigo-200 dark:hover:bg-indigo-800/50"
                    >
                      <FiPlus size={12} className="mr-1" />
                      Adicionar Coluna
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
                    {newTemplate.columns.map((column, index) => (
                      <div 
                        key={column.id}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                      >
                        <input 
                          type="color"
                          value={column.color}
                          onChange={(e) => updateColumn(column.id, 'color', e.target.value)}
                          className="w-8 h-8 rounded-md cursor-pointer"
                        />
                        
                        <input 
                          type="text"
                          value={column.name}
                          onChange={(e) => updateColumn(column.id, 'name', e.target.value)}
                          className="flex-grow px-2 py-1 bg-transparent border-b border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-indigo-500"
                          placeholder={`Coluna ${index + 1}`}
                        />
                        
                        <button
                          onClick={() => removeColumn(column.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
                          disabled={newTemplate.columns.length <= 1}
                          title={newTemplate.columns.length <= 1 ? "Necessário pelo menos uma coluna" : "Remover coluna"}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveNewTemplate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                  >
                    <FiSave size={16} className="mr-1" />
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Lista de modelos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allTemplates.map((template) => (
        <div 
          key={template.id}
            className={`border relative rounded-lg p-4 
              ${template.isCustom 
                ? 'border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-900/10' 
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'} 
              transition-colors cursor-pointer`}
          >
            {/* Ações para modelos personalizados */}
            {template.isCustom && (
              <div className="absolute top-2 right-2 flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(template);
                  }}
                  className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"
                  title="Editar modelo"
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Tem certeza que deseja excluir este modelo?')) {
                      removeCustomTemplate(template.id);
                    }
                  }}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"
                  title="Excluir modelo"
                >
                  <FiTrash2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    exportTemplate(template.id);
                  }}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"
                  title="Exportar modelo"
                >
                  <FiDownload size={14} />
                </button>
              </div>
            )}
            
            <div onClick={() => onSelect(template)}>
              <h3 className="text-lg font-medium mb-2 flex items-center text-gray-800 dark:text-white">
                {template.name}
                {template.isCustom && (
                  <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                    Personalizado
                  </span>
                )}
              </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{template.description}</p>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {template.columns.map((column) => (
              <div 
                key={column.id} 
                className="flex-shrink-0 px-2 py-1 rounded text-xs font-medium"
                style={{ backgroundColor: `${column.color}20`, color: column.color }}
              >
                {column.name}
              </div>
            ))}
              </div>
              
              <div className="mt-3 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(template);
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center ml-auto"
                >
                  <FiCheck size={12} className="mr-1" />
                  Usar este modelo
                </button>
              </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};

export default KanbanTemplateSelector; 