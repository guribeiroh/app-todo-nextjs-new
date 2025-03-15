import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSun, FiMoon, FiDroplet, FiSettings } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeSelectorProps {
  onClose: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onClose }) => {
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [accentColor, setAccentColor] = useState('#6366F1'); // Indigo padrão
  
  // Carregar preferências salvas
  useEffect(() => {
    const savedAccentColor = localStorage.getItem('accent-color');
    if (savedAccentColor) {
      setAccentColor(savedAccentColor);
    }
    
    setSelectedTheme(theme);
  }, [theme]);
  
  // Opções de temas
  const themes = [
    { id: 'light' as const, name: 'Claro', icon: <FiSun /> },
    { id: 'dark' as const, name: 'Escuro', icon: <FiMoon /> }
  ];
  
  // Opções de cores de destaque
  const accentColors = [
    { name: 'Índigo', value: '#6366F1' },
    { name: 'Roxo', value: '#8B5CF6' },
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Vermelho', value: '#EF4444' },
    { name: 'Laranja', value: '#F97316' },
    { name: 'Rosa', value: '#EC4899' },
  ];
  
  // Aplicar o tema selecionado
  const applyTheme = () => {
    // Salvar preferências
    localStorage.setItem('accent-color', accentColor);
    
    // Definir cor de destaque como variável CSS
    document.documentElement.style.setProperty('--color-primary', accentColor);
    document.documentElement.style.setProperty('--color-primary-light', adjustColor(accentColor, 15));
    document.documentElement.style.setProperty('--color-primary-dark', adjustColor(accentColor, -15));
    
    // Aplicar o tema usando o contexto
    setTheme(selectedTheme as 'light' | 'dark');
    
    onClose();
  };
  
  // Função para ajustar cor (mais clara ou mais escura)
  const adjustColor = (color: string, percent: number) => {
    const num = parseInt(color.slice(1), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    
    const adjustBrightness = (channel: number) => {
      return Math.min(255, Math.max(0, Math.round(channel * (1 + percent / 100))));
    };
    
    const rr = adjustBrightness(r).toString(16).padStart(2, '0');
    const gg = adjustBrightness(g).toString(16).padStart(2, '0');
    const bb = adjustBrightness(b).toString(16).padStart(2, '0');
    
    return `#${rr}${gg}${bb}`;
  };
  
  // Visualizar cor de destaque
  const previewAccentColor = (color: string) => {
    document.documentElement.style.setProperty('--color-primary-preview', color);
  };
  
  // Resetar visualização
  const resetPreview = () => {
    document.documentElement.style.setProperty('--color-primary-preview', 'transparent');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    >
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Personalizar tema</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Tema</h3>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {themes.map((themeOption) => (
              <button
                key={themeOption.id}
                onClick={() => setSelectedTheme(themeOption.id)}
                className={`
                  p-3 flex flex-col items-center justify-center rounded-lg border transition-colors
                  ${selectedTheme === themeOption.id 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}
                `}
              >
                <span className="text-xl mb-1">{themeOption.icon}</span>
                <span className="text-sm">{themeOption.name}</span>
              </button>
            ))}
          </div>
          
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Cor de destaque</h3>
          <div className="flex flex-wrap gap-3 mb-6">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setAccentColor(color.value)}
                onMouseEnter={() => previewAccentColor(color.value)}
                onMouseLeave={resetPreview}
                className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center transition-transform
                  ${accentColor === color.value ? 'border-gray-300 dark:border-gray-500 scale-110' : 'border-transparent'}
                `}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {accentColor === color.value && (
                  <span className="text-white">
                    <FiCheck size={16} />
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 mr-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={applyTheme}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}; 