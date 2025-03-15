import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiMoon, FiSun, FiSliders } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface ThemeSelectorProps {
  onClose: () => void;
  onThemeChange: (theme: string) => void;
}

interface ThemeOption {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  dark: boolean;
}

const defaultThemes: ThemeOption[] = [
  {
    id: 'default-dark',
    name: 'Escuro Padrão',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    dark: true
  },
  {
    id: 'default-light',
    name: 'Claro Padrão',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    dark: false
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    primary: '#10b981',
    secondary: '#059669',
    accent: '#14b8a6',
    dark: true
  },
  {
    id: 'amber',
    name: 'Âmbar',
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#fbbf24',
    dark: true
  },
  {
    id: 'rose',
    name: 'Rosa',
    primary: '#f43f5e',
    secondary: '#e11d48',
    accent: '#fb7185',
    dark: true
  },
  {
    id: 'sky',
    name: 'Céu',
    primary: '#0ea5e9',
    secondary: '#0284c7',
    accent: '#38bdf8',
    dark: true
  },
  {
    id: 'violet',
    name: 'Violeta',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#a78bfa',
    dark: true
  },
  {
    id: 'slate-light',
    name: 'Cinza Claro',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    dark: false
  }
];

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onClose, onThemeChange }) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [customTheme, setCustomTheme] = useState<ThemeOption>({
    id: 'custom',
    name: 'Personalizado',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    dark: true
  });
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Efeito para carregar a preferência de tema ao iniciar
  useEffect(() => {
    try {
      // Carregar tema atual
      const savedTheme = localStorage.getItem('theme-id') || 'default-dark';
      setSelectedTheme(savedTheme);
      
      // Carregar tema personalizado se existir
      const savedCustomTheme = localStorage.getItem('custom-theme');
      if (savedCustomTheme) {
        setCustomTheme(JSON.parse(savedCustomTheme));
      }
      
      // Verificar modo escuro
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDarkMode(darkMode);
    } catch (error) {
      console.error('Erro ao carregar configurações de tema:', error);
    }
  }, []);
  
  // Aplicar o tema selecionado
  const applyTheme = (theme: ThemeOption) => {
    // Aplicar cores CSS
    document.documentElement.style.setProperty('--color-primary', theme.primary);
    document.documentElement.style.setProperty('--color-secondary', theme.secondary);
    document.documentElement.style.setProperty('--color-accent', theme.accent);
    
    // Ajustar cores mais claras e mais escuras
    const adjustColor = (hex: string, percent: number): string => {
      const num = parseInt(hex.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.max(Math.min((num >> 16) + amt, 255), 0);
      const G = Math.max(Math.min(((num >> 8) & 0x00FF) + amt, 255), 0);
      const B = Math.max(Math.min((num & 0x0000FF) + amt, 255), 0);
      return '#' + (0x1000000 + (R<<16) + (G<<8) + B).toString(16).slice(1);
    };
    
    // Aplicar variações de cores
    document.documentElement.style.setProperty('--color-primary-light', adjustColor(theme.primary, 15));
    document.documentElement.style.setProperty('--color-primary-dark', adjustColor(theme.primary, -15));
    document.documentElement.style.setProperty('--color-secondary-light', adjustColor(theme.secondary, 15));
    document.documentElement.style.setProperty('--color-secondary-dark', adjustColor(theme.secondary, -15));
    document.documentElement.style.setProperty('--color-accent-light', adjustColor(theme.accent, 15));
    document.documentElement.style.setProperty('--color-accent-dark', adjustColor(theme.accent, -15));
    
    // Aplicar modo escuro
    if (theme.dark) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
    
    // Salvar preferências
    localStorage.setItem('theme-id', theme.id);
    localStorage.setItem('accent-color', theme.primary);
    
    if (theme.id === 'custom') {
      localStorage.setItem('custom-theme', JSON.stringify(theme));
    }
    
    // Notificar alteração
    onThemeChange(theme.id);
  };
  
  // Manipular alteração de tema
  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    
    // Encontrar tema selecionado
    let selectedThemeOption = defaultThemes.find(t => t.id === themeId);
    
    // Se for tema personalizado
    if (themeId === 'custom') {
      selectedThemeOption = customTheme;
    }
    
    if (selectedThemeOption) {
      applyTheme(selectedThemeOption);
    }
  };
  
  // Atualizar tema personalizado
  const updateCustomTheme = (key: keyof ThemeOption, value: string | boolean) => {
    setCustomTheme(prev => {
      const updated = { ...prev, [key]: value };
      
      // Aplicar tema atualizado se estiver selecionado
      if (selectedTheme === 'custom') {
        applyTheme(updated);
      }
      
      return updated;
    });
  };
  
  // Animação do modal
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', duration: 0.4 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-dark-primary rounded-xl shadow-xl max-w-lg w-full overflow-hidden"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="p-4 border-b border-gray-200 dark:border-dark-accent/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Personalização de Tema</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-accent/30 transition-colors"
            aria-label="Fechar"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">Temas predefinidos</h3>
              <button
                className="text-sm flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                onClick={() => setShowCustomizer(!showCustomizer)}
              >
                <FiSliders size={14} className="mr-1" />
                {showCustomizer ? 'Ocultar personalizador' : 'Personalizar'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {defaultThemes.map(theme => (
                <button
                  key={theme.id}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all h-24 ${
                    selectedTheme === theme.id 
                      ? 'border-primary shadow-glow'
                      : 'border-transparent hover:border-gray-200 dark:hover:border-dark-accent/50'
                  }`}
                  onClick={() => handleThemeChange(theme.id)}
                  aria-label={`Tema ${theme.name}`}
                >
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.dark ? '#1a1a2e' : '#f8fafc'} 0%, ${theme.primary} 100%)`,
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-30 backdrop-blur-sm">
                    <span className="text-white text-sm font-medium truncate block">{theme.name}</span>
                  </div>
                  
                  {selectedTheme === theme.id && (
                    <div className="absolute top-2 right-2 rounded-full bg-primary border-2 border-white p-0.5">
                      <FiCheck size={12} className="text-white" />
                    </div>
                  )}
                  
                  <div className="absolute top-2 left-2 flex space-x-1">
                    {[theme.primary, theme.secondary, theme.accent].map((color, i) => (
                      <div 
                        key={i} 
                        className="w-3 h-3 rounded-full border border-white"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
              
              <button
                className={`relative rounded-lg overflow-hidden border-2 transition-all h-24 ${
                  selectedTheme === 'custom' 
                    ? 'border-primary shadow-glow'
                    : 'border-transparent hover:border-gray-200 dark:hover:border-dark-accent/50'
                }`}
                onClick={() => handleThemeChange('custom')}
                aria-label="Tema personalizado"
              >
                <div 
                  className="absolute inset-0"
                  style={{ 
                    background: `linear-gradient(135deg, ${customTheme.dark ? '#1a1a2e' : '#f8fafc'} 0%, ${customTheme.primary} 100%)`,
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-30 backdrop-blur-sm">
                  <span className="text-white text-sm font-medium truncate block">Personalizado</span>
                </div>
                
                {selectedTheme === 'custom' && (
                  <div className="absolute top-2 right-2 rounded-full bg-primary border-2 border-white p-0.5">
                    <FiCheck size={12} className="text-white" />
                  </div>
                )}
                
                <div className="absolute top-2 left-2 flex space-x-1">
                  {[customTheme.primary, customTheme.secondary, customTheme.accent].map((color, i) => (
                    <div 
                      key={i} 
                      className="w-3 h-3 rounded-full border border-white"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
            </div>
          </div>
          
          {showCustomizer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border rounded-lg p-4 bg-gray-50 dark:bg-dark-lighter/30"
            >
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Personalizar Tema</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Modo
                  </label>
                  <div className="flex space-x-2">
                    <button
                      className={`flex items-center px-3 py-2 rounded-lg ${
                        customTheme.dark 
                          ? 'bg-gray-200 dark:bg-dark-accent/50 text-gray-800 dark:text-white' 
                          : 'bg-gray-100 dark:bg-dark-accent/20 text-gray-500'
                      }`}
                      onClick={() => updateCustomTheme('dark', true)}
                    >
                      <FiMoon className="mr-2" size={16} />
                      Escuro
                    </button>
                    <button
                      className={`flex items-center px-3 py-2 rounded-lg ${
                        !customTheme.dark 
                          ? 'bg-gray-200 dark:bg-dark-accent/50 text-gray-800 dark:text-white' 
                          : 'bg-gray-100 dark:bg-dark-accent/20 text-gray-500'
                      }`}
                      onClick={() => updateCustomTheme('dark', false)}
                    >
                      <FiSun className="mr-2" size={16} />
                      Claro
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Cor Primária
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={customTheme.primary}
                      onChange={e => updateCustomTheme('primary', e.target.value)}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customTheme.primary}
                      onChange={e => updateCustomTheme('primary', e.target.value)}
                      className="ml-2 input"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Cor Secundária
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={customTheme.secondary}
                      onChange={e => updateCustomTheme('secondary', e.target.value)}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customTheme.secondary}
                      onChange={e => updateCustomTheme('secondary', e.target.value)}
                      className="ml-2 input"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Cor de Destaque
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={customTheme.accent}
                      onChange={e => updateCustomTheme('accent', e.target.value)}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customTheme.accent}
                      onChange={e => updateCustomTheme('accent', e.target.value)}
                      className="ml-2 input"
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                    onClick={() => {
                      handleThemeChange('custom');
                      setShowCustomizer(false);
                    }}
                  >
                    Aplicar Tema Personalizado
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-dark-accent/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-dark-accent/50 hover:bg-gray-300 dark:hover:bg-dark-accent text-gray-800 dark:text-white rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ThemeSelector; 