import React from 'react';
import { FiBookmark, FiBarChart2, FiUploadCloud, FiMessageSquare } from 'react-icons/fi';

interface NavigationButtonsProps {
  onOpenBookmarks: () => void;
  onOpenStats: () => void;
  onOpenCloud: () => void;
  onOpenChat: () => void;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onOpenBookmarks,
  onOpenStats,
  onOpenCloud,
  onOpenChat
}) => {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-8 z-50">
      <button
        onClick={onOpenBookmarks}
        className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
        aria-label="Abrir marcadores"
      >
        <FiBookmark size={24} />
      </button>
      
      <button
        onClick={onOpenStats}
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
        aria-label="Abrir estatísticas"
      >
        <FiBarChart2 size={24} />
      </button>
      
      <button
        onClick={onOpenCloud}
        className="w-14 h-14 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
        aria-label="Abrir nuvem"
      >
        <FiUploadCloud size={24} />
      </button>
      
      <button
        onClick={onOpenChat}
        className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
        aria-label="Abrir chat"
      >
        <FiMessageSquare size={24} />
      </button>
    </div>
  );
};

export default NavigationButtons; 