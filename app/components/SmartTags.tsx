'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiTag, FiPlusCircle, FiSave, FiTrash2, FiEdit3, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { useTaskContext } from '../context/TaskContext';

interface SmartTagsProps {
  onClose: () => void;
}

interface TagSuggestion {
  tag: string;
  score: number;
  used: number;
  color?: string;
}

const SmartTags: React.FC<SmartTagsProps> = ({ onClose }) => {
  const { tasks, addTag, removeTag } = useTaskContext();
  const [tags, setTags] = useState<string[]>([]);
  const [tagColors, setTagColors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366F1'); // Indigo como padrão
  const [activeTab, setActiveTab] = useState<'all' | 'smart' | 'editor'>('all');
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingColor, setEditingColor] = useState('');
  
  // Cores predefinidas para tags
  const predefinedColors = [
    '#6366F1', // Indigo
    '#8B5CF6', // Violeta
    '#EC4899', // Rosa
    '#EF4444', // Vermelho
    '#F97316', // Laranja
    '#F59E0B', // Âmbar
    '#10B981', // Esmeralda
    '#06B6D4', // Ciano
    '#3B82F6', // Azul
  ];
  
  // Carregar tags e cores salvas
  useEffect(() => {
    const loadTags = () => {
      // Extrair todas as tags únicas das tarefas
      const allTaskTags = tasks.flatMap(task => task.tags || []);
      const uniqueTags = Array.from(new Set(allTaskTags));
      setTags(uniqueTags);
      
      // Carregar cores salvas
      const savedColors = localStorage.getItem('tag-colors');
      if (savedColors) {
        try {
          setTagColors(JSON.parse(savedColors));
        } catch (e) {
          console.error('Erro ao carregar cores de tags:', e);
        }
      }
    };
    
    loadTags();
  }, [tasks]);
  
  // Gerar sugestões inteligentes baseadas em padrões de uso
  useEffect(() => {
    const generateSuggestions = () => {
      // Contagem de uso de tags
      const tagUsage = new Map<string, number>();
      
      // Analisar tarefas para padrões
      tasks.forEach(task => {
        // Contar ocorrências de cada tag
        (task.tags || []).forEach(tag => {
          tagUsage.set(tag, (tagUsage.get(tag) || 0) + 1);
        });
      });
      
      // Identificar palavras comuns nos títulos que não são tags ainda
      const words = new Map<string, number>();
      const existingTags = new Set(tags);
      
      tasks.forEach(task => {
        // Tokenizar o título
        const titleWords = task.title
          .toLowerCase()
          .split(/\s+/)
          .filter(word => 
            word.length > 3 && 
            !['que', 'com', 'para', 'como', 'esse', 'esta', 'este', 'isto'].includes(word)
          );
          
        // Contar ocorrências de palavras relevantes
        titleWords.forEach(word => {
          if (!existingTags.has(word)) {
            words.set(word, (words.get(word) || 0) + 1);
          }
        });
      });
      
      // Criar sugestões a partir das palavras mais comuns
      const wordSuggestions: TagSuggestion[] = Array.from(words.entries())
        .filter(([_, count]) => count >= 2) // Pelo menos 2 ocorrências
        .map(([word, count]) => ({
          tag: word,
          score: count * 0.8, // Peso menor que tags explícitas
          used: 0,
        }))
        .slice(0, 5); // Limitar a 5 sugestões baseadas em palavras
      
      // Criar sugestões de tags populares
      const popularTags: TagSuggestion[] = Array.from(tagUsage.entries())
        .map(([tag, count]) => ({
          tag,
          score: count * 1.2, // Peso maior para tags explícitas
          used: count,
          color: tagColors[tag] || getRandomColor(),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Top 10 tags
      
      // Combinar sugestões
      setSuggestions([...popularTags, ...wordSuggestions]
        .sort((a, b) => b.score - a.score)
        .slice(0, 15)); // Limitar a 15 sugestões no total
    };
    
    generateSuggestions();
  }, [tags, tasks, tagColors]);
  
  // Salvar tags e cores
  const saveTagColors = () => {
    localStorage.setItem('tag-colors', JSON.stringify(tagColors));
  };
  
  // Adicionar nova tag
  const handleAddTag = () => {
    if (newTag.trim() === '') return;
    
    if (!tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      
      // Definir cor para a nova tag
      const updatedColors = { ...tagColors, [newTag.trim()]: newTagColor };
      setTagColors(updatedColors);
      
      // Salvar no localStorage
      localStorage.setItem('tag-colors', JSON.stringify(updatedColors));
      
      // Adicionar à lista global
      addTag(newTag.trim());
      
      setNewTag('');
    }
  };
  
  // Remover tag
  const handleRemoveTag = (tag: string) => {
    const updatedTags = tags.filter(t => t !== tag);
    setTags(updatedTags);
    
    // Remover cor da tag
    const updatedColors = { ...tagColors };
    delete updatedColors[tag];
    setTagColors(updatedColors);
    
    // Salvar no localStorage
    localStorage.setItem('tag-colors', JSON.stringify(updatedColors));
    
    // Remover da lista global
    removeTag(tag);
  };
  
  // Editar cor de tag
  const handleStartEditing = (tag: string) => {
    setEditingTag(tag);
    setEditingColor(tagColors[tag] || '#6366F1');
  };
  
  const handleSaveEdit = () => {
    if (!editingTag) return;
    
    // Atualizar cor da tag
    const updatedColors = { ...tagColors, [editingTag]: editingColor };
    setTagColors(updatedColors);
    
    // Salvar no localStorage
    localStorage.setItem('tag-colors', JSON.stringify(updatedColors));
    
    setEditingTag(null);
  };
  
  // Adicionar tag sugerida
  const handleAddSuggestion = (suggestion: TagSuggestion) => {
    if (!tags.includes(suggestion.tag)) {
      const updatedTags = [...tags, suggestion.tag];
      setTags(updatedTags);
      
      // Definir cor para a nova tag
      const updatedColors = { 
        ...tagColors, 
        [suggestion.tag]: suggestion.color || getRandomColor() 
      };
      setTagColors(updatedColors);
      
      // Salvar no localStorage
      localStorage.setItem('tag-colors', JSON.stringify(updatedColors));
      
      // Adicionar à lista global
      addTag(suggestion.tag);
    }
  };
  
  // Gerar uma cor aleatória para tags
  const getRandomColor = () => {
    return predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FiTag className="mr-2 text-indigo-500" size={20} />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Gerenciar Tags</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'all' 
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Todas Tags
            </button>
            <button
              onClick={() => setActiveTab('smart')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'smart' 
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Sugestões
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'editor' 
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Editor
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {activeTab === 'all' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Suas Tags</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.length > 0 ? (
                  tags.map((tag, index) => (
                    <div 
                      key={index}
                      className="px-3 py-1.5 rounded-full text-white text-sm flex items-center gap-1"
                      style={{ backgroundColor: tagColors[tag] || '#6366F1' }}
                    >
                      {tag}
                      <button
                        onClick={() => handleStartEditing(tag)}
                        className="ml-1 p-0.5 hover:bg-white/20 rounded"
                        title="Editar cor"
                      >
                        <FiEdit3 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma tag encontrada. Adicione tags às suas tarefas!
                  </p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'smart' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Tags Sugeridas</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Baseadas nas suas tarefas e padrões de uso.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {suggestions
                  .filter(suggestion => !tags.includes(suggestion.tag))
                  .map((suggestion, index) => (
                    <div 
                      key={index}
                      className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: suggestion.color || getRandomColor() }}
                        />
                        <span className="text-gray-800 dark:text-gray-200">{suggestion.tag}</span>
                      </div>
                      <button
                        onClick={() => handleAddSuggestion(suggestion)}
                        className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded"
                        title="Adicionar tag"
                      >
                        <FiPlusCircle size={16} />
                      </button>
                    </div>
                  ))}
                  
                {suggestions.filter(suggestion => !tags.includes(suggestion.tag)).length === 0 && (
                  <p className="col-span-2 text-gray-500 dark:text-gray-400">
                    Sem sugestões novas no momento. Continue adicionando mais tarefas!
                  </p>
                )}
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags Populares
                </h4>
                <div className="flex flex-wrap gap-2">
                  {suggestions
                    .filter(suggestion => tags.includes(suggestion.tag))
                    .slice(0, 5)
                    .map((suggestion, index) => (
                      <div 
                        key={index}
                        className="px-3 py-1 rounded-full text-white text-sm flex items-center"
                        style={{ backgroundColor: suggestion.color || '#6366F1' }}
                      >
                        {suggestion.tag}
                        <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                          {suggestion.used}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'editor' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                  {editingTag ? 'Editar Tag' : 'Adicionar Nova Tag'}
                </h3>
                
                {/* Formulário de edição */}
                {editingTag ? (
                  <div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome da Tag
                      </label>
                      <div className="text-gray-800 dark:text-gray-200 font-medium py-2 px-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                        {editingTag}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cor da Tag
                      </label>
                      <div className="flex gap-2 mb-2">
                        {predefinedColors.map((color, index) => (
                          <button
                            key={index}
                            className={`w-8 h-8 rounded-full ${
                              editingColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setEditingColor(color)}
                            title={`Selecionar cor ${index + 1}`}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={editingColor}
                        onChange={(e) => setEditingColor(e.target.value)}
                        className="w-full h-10 p-1 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 flex justify-center items-center py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                      >
                        <FiSave className="mr-2" size={16} />
                        Salvar
                      </button>
                      <button
                        onClick={() => handleRemoveTag(editingTag)}
                        className="flex-1 flex justify-center items-center py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md"
                      >
                        <FiTrash2 className="mr-2" size={16} />
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome da Tag
                      </label>
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Digite o nome da nova tag"
                        className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cor da Tag
                      </label>
                      <div className="flex gap-2 mb-2">
                        {predefinedColors.map((color, index) => (
                          <button
                            key={index}
                            className={`w-8 h-8 rounded-full ${
                              newTagColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewTagColor(color)}
                            title={`Selecionar cor ${index + 1}`}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-full h-10 p-1 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    
                    <button
                      onClick={handleAddTag}
                      disabled={newTag.trim() === ''}
                      className={`w-full py-2 px-4 rounded-md text-white flex justify-center items-center ${
                        newTag.trim() === '' 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      <FiPlusCircle className="mr-2" size={16} />
                      Adicionar Tag
                    </button>
                  </div>
                )}
              </div>
              
              {/* Lista de tags para edição rápida */}
              {!editingTag && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Tags Existentes</h4>
                  <div className="max-h-48 overflow-y-auto">
                    {tags.map((tag, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between py-2 px-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: tagColors[tag] || '#6366F1' }}
                          />
                          <span className="text-gray-800 dark:text-gray-200">{tag}</span>
                        </div>
                        <div className="flex items-center">
                          <button
                            onClick={() => handleStartEditing(tag)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                            title="Editar tag"
                          >
                            <FiEdit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            title="Remover tag"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SmartTags; 