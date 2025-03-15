import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'secondary';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  text 
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const colorMap = {
    primary: 'border-primary',
    white: 'border-white',
    secondary: 'border-secondary'
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <motion.div
          className={`${sizeMap[size]} rounded-full border-2 ${colorMap[color]} border-t-transparent`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className={`absolute inset-0 ${sizeMap[size]} rounded-full border-2 border-t-transparent border-b-transparent ${colorMap[color]}`}
          initial={{ rotate: 0 }}
          animate={{ rotate: -180 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
      {text && (
        <p className="mt-3 text-sm text-gray-300">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner; 