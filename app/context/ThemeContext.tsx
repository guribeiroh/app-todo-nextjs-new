'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('system');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Inicializar tema do localStorage ou do sistema
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // Se não houver tema salvo, verificar preferência do sistema
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark'); // Definir como dark se a preferência do sistema for dark
      }
    }
  }, []);

  // Aplicar tema
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    const body = window.document.body;
    
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');

    let resolvedTheme: 'light' | 'dark';
    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolvedTheme = theme;
    }

    // Adicionar classes ao html e body
    root.classList.add(resolvedTheme);
    body.classList.add(resolvedTheme);
    
    // Também definir o atributo data-theme
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    
    // Aplicar cores de fundo necessárias
    if (resolvedTheme === 'dark') {
      body.style.backgroundColor = 'rgb(17, 24, 39)';
      body.style.color = 'rgb(229, 231, 235)';
    } else {
      body.style.backgroundColor = '';
      body.style.color = '';
    }
    
    setIsDarkMode(resolvedTheme === 'dark');

    // Persistir no localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Escutar mudanças de tema do sistema quando o tema escolhido for 'system'
  useEffect(() => {
    if (typeof window === 'undefined' || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const root = window.document.documentElement;
      const body = window.document.body;
      
      root.classList.remove('light', 'dark');
      body.classList.remove('light', 'dark');
      
      const newTheme = mediaQuery.matches ? 'dark' : 'light';
      root.classList.add(newTheme);
      body.classList.add(newTheme);
      
      document.documentElement.setAttribute('data-theme', newTheme);
      
      if (newTheme === 'dark') {
        body.style.backgroundColor = 'rgb(17, 24, 39)';
        body.style.color = 'rgb(229, 231, 235)';
      } else {
        body.style.backgroundColor = '';
        body.style.color = '';
      }
      
      setIsDarkMode(newTheme === 'dark');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    isDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};