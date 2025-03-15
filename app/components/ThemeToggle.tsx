'use client';

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <motion.button
      onClick={toggleTheme}
      className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {theme === 'dark' ? (
        <FiSun className="w-5 h-5 text-yellow-400" />
      ) : (
        <FiMoon className="w-5 h-5 text-indigo-600" />
      )}
    </motion.button>
  );
};

export default ThemeToggle; 