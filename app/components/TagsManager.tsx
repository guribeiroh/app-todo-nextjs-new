import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiEdit2, FiTrash2, FiCheck, FiTag, FiFilter } from 'react-icons/fi';
import { useTaskContext } from '../context/TaskContext';

interface TagsManagerProps {
  onClose: () => void;
  tags: string[];
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
}

interface TagInfo {
  name: string;
  color: string;
  count: number;
}

export const TagsManager: React.FC<TagsManagerProps> = ({ onClose, tags: propTags, onAddTag, onRemoveTag }) => {
  const { tasks, updateTask } = useTaskContext();
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366F1');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editedTagName, setEditedTagName] = useState('');
  const [editedTagColor, setEditedTagColor] = useState('');
  const [filterText, setFilterText] = useState('');
  
  // Cores disponíveis para tags
  const colorOptions = [
    { name: 'Índigo', value: '#6366F1' },
    { name: 'Roxo', value: '#8B5CF6' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Vermelho', value: '#EF4444' },
    { name: 'Laranja', value: '#F97316' },
    { name: 'Âmbar', value: '#F59E0B' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Ciano', value: '#06B6D4' },
    { name: 'Cinza', value: '#6B7280' },
  ];
  
  // Carregar todas as tags existentes no sistema
  useEffect(() => {
    const tagMap = new Map<string, { color: string, count: number }>();
    
    // Primeiro adicionar as tags vindas das props
    propTags.forEach(tag => {
      const tagKey = tag.toLowerCase();
      const tagObj = tagMap.get(tagKey) || { color: getTagColor(tag) || newTagColor, count: 0 };
      tagObj.count += 1;
      tagMap.set(tagKey, tagObj);
    });
    
    // Percorrer todas as tarefas para coletar suas tags
    tasks.forEach(task => {
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tag => {
          const tagKey = tag.toLowerCase();
          const tagObj = tagMap.get(tagKey) || { color: getTagColor(tag) || newTagColor, count: 0 };
          tagObj.count += 1;
          tagMap.set(tagKey, tagObj);
        });
      }
    });
    
    // Converter o mapa para um array
    const tagArray = Array.from(tagMap.entries()).map(([name, info]) => ({
      name,
      color: info.color,
      count: info.count
    }));
    
    // Ordenar por frequência de uso, depois alfabeticamente
    tagArray.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
    
    setTags(tagArray);
  }, [propTags, tasks]);
  
  // Tenta obter a cor de uma tag existente
  const getTagColor = (tagName: string): string | null => {
    const lowerTagName = tagName.toLowerCase();
    
    // Buscar em tarefas que possam ter informações de cor para essa tag
    for (const task of tasks) {
      if (task.tags) {
        const tagIndex = task.tags.findIndex(t => t.toLowerCase() === lowerTagName);
        if (tagIndex !== -1) {
          // Usar uma cor padrão ou baseada no nome da tag
          return generateColorFromString(tagName);
        }
      }
    }
    
    // Se não encontrou, gerar uma cor baseada no nome da tag
    return generateColorFromString(tagName);
  };
  
  // Função para gerar uma cor baseada em uma string
  const generateColorFromString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    
    return color;
  };
  
  // Adicionar uma nova tag
  const addTag = () => {
    if (!newTagName.trim()) return;
    
    // Verificar se a tag já existe
    const existingTagIndex = tags.findIndex(t => t.name.toLowerCase() === newTagName.toLowerCase());
    
    if (existingTagIndex !== -1) {
      // Atualizar apenas a cor se a tag já existir
      const updatedTags = [...tags];
      updatedTags[existingTagIndex].color = newTagColor;
      setTags(updatedTags);
      
      // Atualizar a cor em todas as tarefas que usam essa tag
      updateTagInTasks(newTagName.trim().toLowerCase(), newTagColor);
    } else {
      // Adicionar nova tag
      const tagName = newTagName.trim().toLowerCase();
      setTags([...tags, { name: tagName, color: newTagColor, count: 0 }]);
      
      // Chamar a função onAddTag passada como prop
      if (onAddTag) {
        onAddTag(tagName);
      }
    }
    
    setNewTagName('');
  };
  
  // Iniciar edição de uma tag
  const startEditingTag = (tag: TagInfo) => {
    setEditingTag(tag.name);
    setEditedTagName(tag.name);
    setEditedTagColor(tag.color);
  };
  
  // Salvar edição de uma tag
  const saveTagEdit = () => {
    if (!editingTag || !editedTagName.trim()) return;
    
    const oldTagName = editingTag;
    const newTagName = editedTagName.trim().toLowerCase();
    
    // Verificar se o novo nome já existe (exceto o próprio sendo editado)
    if (newTagName !== oldTagName) {
      const existingTag = tags.find(t => 
        t.name.toLowerCase() === newTagName && t.name !== oldTagName
      );
      
      if (existingTag) {
        alert('Esta tag já existe com outro nome.');
        return;
      }
    }
    
    // Atualizar a tag na lista
    const updatedTags = tags.map(tag => {
      if (tag.name === oldTagName) {
        return { ...tag, name: newTagName, color: editedTagColor };
      }
      return tag;
    });
    
    setTags(updatedTags);
    
    // Atualizar a tag em todas as tarefas
    if (oldTagName !== newTagName || editedTagColor !== tags.find(t => t.name === oldTagName)?.color) {
      renameTagInTasks(oldTagName, newTagName, editedTagColor);
      
      // Remover a tag antiga e adicionar a nova se necessário
      if (oldTagName !== newTagName) {
        if (onRemoveTag) onRemoveTag(oldTagName);
        if (onAddTag) onAddTag(newTagName);
      }
    }
    
    setEditingTag(null);
  };
  
  // Excluir uma tag
  const deleteTag = (tagName: string) => {
    if (confirm(`Tem certeza que deseja excluir a tag "${tagName}"? Ela será removida de todas as tarefas.`)) {
      const updatedTags = tags.filter(tag => tag.name !== tagName);
      setTags(updatedTags);
      
      // Remover a tag de todas as tarefas
      removeTagFromTasks(tagName);
      
      // Chamar a função onRemoveTag passada como prop
      if (onRemoveTag) {
        onRemoveTag(tagName);
      }
    }
  };
  
  // Atualizar a cor de uma tag em todas as tarefas
  const updateTagInTasks = (tagName: string, newColor: string) => {
    tasks.forEach(task => {
      if (task.tags) {
        const tagIndex = task.tags.findIndex(t => t.toLowerCase() === tagName);
        
        if (tagIndex !== -1) {
          // Atualizar a tarefa com a mesma lista de tags
          // A cor será gerenciada pelo componente que renderiza as tags
          updateTask(task.id, {
            ...task
          });
        }
      }
    });
  };
  
  // Renomear uma tag em todas as tarefas
  const renameTagInTasks = (oldName: string, newName: string, newColor: string) => {
    tasks.forEach(task => {
      if (task.tags) {
        const tagIndex = task.tags.findIndex(t => t.toLowerCase() === oldName);
        
        if (tagIndex !== -1) {
          // Copiar o array de tags e atualizar o nome
          const updatedTags = [...task.tags];
          updatedTags[tagIndex] = newName;
          
          // Atualizar a tarefa
          updateTask(task.id, {
            ...task,
            tags: updatedTags
          });
        }
      }
    });
  };
  
  // Remover uma tag de todas as tarefas
  const removeTagFromTasks = (tagName: string) => {
    tasks.forEach(task => {
      if (task.tags) {
        const tagIndex = task.tags.findIndex(t => t.toLowerCase() === tagName);
        
        if (tagIndex !== -1) {
          // Remover a tag
          const updatedTags = task.tags.filter((_, i) => i !== tagIndex);
          
          // Atualizar a tarefa
          updateTask(task.id, {
            ...task,
            tags: updatedTags
          });
        }
      }
    });
  };
  
  // Filtrar tags com base no texto de busca
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(filterText.toLowerCase())
  );
  
  if (!onClose) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            <FiTag className="mr-2 text-indigo-500" />
            Gerenciar Tags
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <FiX size={20} />
          </button>
        </div>
        
        {/* Adicionar nova tag */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiTag className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Nova tag..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTag();
                }}
              />
            </div>
            
            <div className="flex-shrink-0">
              <select
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                style={{ 
                  backgroundColor: newTagColor, 
                  color: isLightColor(newTagColor) ? '#1F2937' : '#F9FAFB' 
                }}
              >
                {colorOptions.map(color => (
                  <option 
                    key={color.value} 
                    value={color.value}
                    style={{ 
                      backgroundColor: color.value, 
                      color: isLightColor(color.value) ? '#1F2937' : '#F9FAFB' 
                    }}
                  >
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={addTag}
              disabled={!newTagName.trim()}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 dark:hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlus size={18} />
            </button>
          </div>
        </div>
        
        {/* Filtro de tags */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filtrar tags..."
              className="block w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            />
          </div>
        </div>
        
        {/* Lista de tags */}
        <div className="overflow-y-auto flex-grow p-4">
          {filteredTags.length > 0 ? (
            <div className="space-y-2">
              {filteredTags.map(tag => (
                <div key={tag.name} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {editingTag === tag.name ? (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={editedTagName}
                          onChange={(e) => setEditedTagName(e.target.value)}
                          className="block flex-grow px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTagEdit();
                            if (e.key === 'Escape') setEditingTag(null);
                          }}
                        />
                        
                        <select
                          value={editedTagColor}
                          onChange={(e) => setEditedTagColor(e.target.value)}
                          className="block px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                          style={{ 
                            backgroundColor: editedTagColor, 
                            color: isLightColor(editedTagColor) ? '#1F2937' : '#F9FAFB' 
                          }}
                        >
                          {colorOptions.map(color => (
                            <option 
                              key={color.value} 
                              value={color.value}
                              style={{ 
                                backgroundColor: color.value, 
                                color: isLightColor(color.value) ? '#1F2937' : '#F9FAFB' 
                              }}
                            >
                              {color.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingTag(null)}
                          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveTagEdit}
                          disabled={!editedTagName.trim()}
                          className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800/30 disabled:opacity-50"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center">
                        <span 
                          className="w-4 h-4 mr-2 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        ></span>
                        <span className="text-gray-800 dark:text-gray-200 mr-2">
                          {tag.name}
                        </span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                          {tag.count}
                        </span>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEditingTag(tag)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                          aria-label={`Editar tag ${tag.name}`}
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteTag(tag.name)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                          aria-label={`Excluir tag ${tag.name}`}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <FiTag className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                {filterText ? 'Nenhuma tag encontrada' : 'Nenhuma tag criada'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filterText 
                  ? 'Tente ajustar seu filtro ou criar uma nova tag'
                  : 'Crie tags para organizar melhor suas tarefas'
                }
              </p>
            </div>
          )}
        </div>
        
        {/* Rodapé */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Uso de tags:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Atribua tags às tarefas durante a criação ou edição</li>
              <li>Use cores para categorizar visualmente suas tags</li>
              <li>Busque tarefas por tags na pesquisa global</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utilitário para determinar se uma cor é clara ou escura
function isLightColor(hexColor: string): boolean {
  // Remover o # se existir
  const hex = hexColor.replace('#', '');
  
  // Converter para RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calcular o brilho (fórmula YIQ)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Se brightness > 155, é uma cor clara
  return brightness > 155;
} 