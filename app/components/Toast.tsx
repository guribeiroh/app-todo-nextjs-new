"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { FiX, FiInfo, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

// Tipos
export type ToastType = 'info' | 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

// Contexto
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Mostrar toast
  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    // Auto-remover após a duração
    if (duration !== Infinity) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
    
    return id;
  }, []);

  // Esconder toast
  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} hideToast={hideToast} />
    </ToastContext.Provider>
  );
};

// Hook para usar o toast
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  
  return context;
};

// Componente de Toast individual
const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const { type, message } = toast;
  
  // Efeito para animação de entrada
  useEffect(() => {
    const element = document.getElementById(`toast-${toast.id}`);
    if (element) {
      // Força um reflow para garantir que a animação funcione
      void element.offsetWidth;
      element.classList.add('translate-x-0', 'opacity-100');
    }
  }, [toast.id]);
  
  // Ícone baseado no tipo
  const Icon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <FiAlertCircle className="text-red-500" size={20} />;
      case 'warning':
        return <FiAlertCircle className="text-yellow-500" size={20} />;
      default:
        return <FiInfo className="text-blue-500" size={20} />;
    }
  };
  
  // Classes baseadas no tipo
  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/20 border-green-500/50';
      case 'error':
        return 'bg-red-900/20 border-red-500/50';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/50';
      default:
        return 'bg-blue-900/20 border-blue-500/50';
    }
  };
  
  return (
    <div
      id={`toast-${toast.id}`}
      className={`flex items-center p-3 mb-3 rounded-lg border ${getTypeClasses()} shadow-lg transform transition-all duration-300 ease-out translate-x-full opacity-0`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">
        <Icon />
      </div>
      <div className="flex-grow text-white">{message}</div>
      <button
        onClick={onClose}
        className="ml-3 p-1 rounded-full hover:bg-dark-accent/30 transition-colors"
        aria-label="Fechar"
      >
        <FiX size={18} className="text-gray-400" />
      </button>
    </div>
  );
};

// Container de Toasts
const ToastContainer: React.FC<{ toasts: Toast[]; hideToast: (id: string) => void }> = ({
  toasts,
  hideToast,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 w-72 max-w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
      ))}
    </div>
  );
};

export default ToastProvider; 