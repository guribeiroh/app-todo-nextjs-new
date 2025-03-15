'use client';

import React from 'react';
import { FiActivity, FiX } from 'react-icons/fi';

interface DiagnosticToolProps {
  autoExpand?: boolean;
  onClose?: () => void;
}

export const DiagnosticTool: React.FC<DiagnosticToolProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <FiActivity className="mr-2" /> Ferramenta de Diagnóstico
          </h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Fechar"
            >
              <FiX className="text-gray-500" />
            </button>
          )}
        </div>
        
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Esta ferramenta analisa o desempenho do aplicativo e fornece métricas para ajudar na otimização.
          </p>
          
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Executar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticTool; 