"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiAlertTriangle } from 'react-icons/fi';

// Tipos para o toast
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Contexto global para o Toast
export const ToastContext = React.createContext<{
  showToast: (message: string, type: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}>({
  showToast: () => {},
  hideToast: () => {},
});

// Hook para usar o Toast
export const useToast = () => React.useContext(ToastContext);

// Componente Provider do Toast
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = (message: string, type: ToastType, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 items-end">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={hideToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

// Componente Toast
const Toast: React.FC<ToastProps & { onClose: (id: string) => void }> = ({
  id,
  message,
  type,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  // Determina o ícone e cores com base no tipo
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <FiCheckCircle className="w-5 h-5" />,
          bgColor: 'bg-green-100 dark:bg-green-900',
          borderColor: 'border-green-500',
          textColor: 'text-green-800 dark:text-green-200',
          iconColor: 'text-green-500',
        };
      case 'error':
        return {
          icon: <FiAlertCircle className="w-5 h-5" />,
          bgColor: 'bg-red-100 dark:bg-red-900',
          borderColor: 'border-red-500',
          textColor: 'text-red-800 dark:text-red-200',
          iconColor: 'text-red-500',
        };
      case 'warning':
        return {
          icon: <FiAlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-yellow-100 dark:bg-yellow-900',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          iconColor: 'text-yellow-500',
        };
      case 'info':
      default:
        return {
          icon: <FiInfo className="w-5 h-5" />,
          bgColor: 'bg-blue-100 dark:bg-blue-900',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-800 dark:text-blue-200',
          iconColor: 'text-blue-500',
        };
    }
  };

  const { icon, bgColor, borderColor, textColor, iconColor } = getToastStyles();

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
      className={`max-w-md w-full md:w-auto overflow-hidden rounded-lg border-l-4 shadow-md ${bgColor} ${borderColor}`}
    >
      <div className="p-4 flex items-start">
        <div className={`flex-shrink-0 ${iconColor}`}>{icon}</div>
        <div className={`ml-3 flex-1 ${textColor}`}>
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => onClose(id)}
          className={`ml-4 flex-shrink-0 ${textColor} hover:${iconColor} focus:outline-none`}
          aria-label="Fechar"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
      {duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className={`h-1 ${borderColor.replace('border', 'bg')}`}
        />
      )}
    </motion.div>
  );
};

// Componente padrão exportado
const ToastContainer: React.FC = () => {
  return null; // Este componente será renderizado através do Provider
};

export default ToastContainer; 