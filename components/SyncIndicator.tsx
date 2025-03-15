import React, { memo } from 'react';
import { FiCloud, FiCloudOff, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { motion } from 'framer-motion';

type SyncStatus = 'synced' | 'pending' | 'error' | 'offline';

interface SyncIndicatorProps {
  status: SyncStatus;
  lastSynced?: Date | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  status,
  lastSynced,
  className = '',
  size = 'md',
  showTooltip = true,
}) => {
  // Determinar tamanho do ícone com base no prop size
  const iconSize = {
    sm: 12,
    md: 16,
    lg: 20,
  }[size];

  // Definir classes de estilo com base no status
  const getStatusStyles = () => {
    switch (status) {
      case 'synced':
        return 'text-green-400';
      case 'pending':
        return 'text-amber-400';
      case 'error':
        return 'text-rose-400';
      case 'offline':
        return 'text-slate-400';
      default:
        return 'text-slate-400';
    }
  };

  // Definir mensagem de tooltip
  const getTooltipMessage = () => {
    const formattedDate = lastSynced 
      ? new Intl.DateTimeFormat('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        }).format(lastSynced)
      : 'Nunca';

    switch (status) {
      case 'synced':
        return `Sincronizado em: ${formattedDate}`;
      case 'pending':
        return 'Aguardando sincronização';
      case 'error':
        return 'Erro na sincronização';
      case 'offline':
        return 'Você está offline';
      default:
        return 'Status desconhecido';
    }
  };

  // Renderizar o ícone correto com base no status
  const renderIcon = () => {
    switch (status) {
      case 'synced':
        return <FiCheck size={iconSize} />;
      case 'pending':
        return <FiCloud size={iconSize} />;
      case 'error':
        return <FiAlertTriangle size={iconSize} />;
      case 'offline':
        return <FiCloudOff size={iconSize} />;
      default:
        return <FiCloud size={iconSize} />;
    }
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={status === 'pending' 
          ? { opacity: [0.5, 1, 0.5], scale: 1 } 
          : { opacity: 1, scale: 1 }}
        className={`flex items-center justify-center ${getStatusStyles()}`}
        title={showTooltip ? getTooltipMessage() : undefined}
        transition={status === 'pending' ? { repeat: Infinity, duration: 1.5 } : {}}
      >
        {renderIcon()}
      </motion.div>
    </div>
  );
};

export default memo(SyncIndicator); 