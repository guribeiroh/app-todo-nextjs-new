'use client';

import React, { useState, useEffect } from 'react';
import { IoCloudUpload, IoCheckmarkDone, IoWarning } from 'react-icons/io5';
import { useOfflineSync } from '../hooks/useOfflineSync';

interface SyncIndicatorProps {
  itemId: string;
  itemType: 'task' | 'list' | 'tag';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export default function SyncIndicator({ 
  itemId, 
  itemType, 
  size = 'sm',
  showTooltip = true 
}: SyncIndicatorProps) {
  const { isOnline, pendingChanges, syncInProgress } = useOfflineSync();
  const [isPending, setIsPending] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // Verificar se este item está pendente de sincronização
  useEffect(() => {
    const checkPendingStatus = () => {
      const pendingItems = JSON.parse(
        localStorage.getItem('neotask_pending_changes') || '[]'
      );
      
      const itemIsPending = pendingItems.some(
        (item: any) => item.data?.id === itemId && item.type === itemType
      );
      
      setIsPending(itemIsPending);
    };
    
    // Verificar status inicial
    checkPendingStatus();
    
    // Adicionar listener para mudanças no armazenamento local
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'neotask_pending_changes') {
        checkPendingStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Verificar periodicamente (necessário para atualizações no mesmo navegador)
    const interval = setInterval(checkPendingStatus, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [itemId, itemType]);
  
  // Se não estiver pendente, não mostrar nada
  if (!isPending) {
    return null;
  }
  
  // Determinar tamanho do ícone
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 18 : 24;
  
  // Classes CSS para tamanho
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  // Conteúdo da dica (tooltip)
  const tooltipContent = isOnline 
    ? syncInProgress 
      ? 'Sincronizando...'
      : 'Aguardando sincronização'
    : 'Alterações serão sincronizadas quando você estiver online';
  
  return (
    <div className="relative inline-flex items-center">
      <div 
        className={`${sizeClasses[size]} flex items-center justify-center relative`}
        onMouseEnter={() => showTooltip && setShowHint(true)}
        onMouseLeave={() => showTooltip && setShowHint(false)}
        onClick={(e) => {
          e.stopPropagation();
          setShowHint(!showHint);
        }}
      >
        {syncInProgress ? (
          <IoCloudUpload className="text-blue-500 animate-pulse" size={iconSize} />
        ) : isOnline ? (
          <IoCloudUpload className="text-amber-500" size={iconSize} />
        ) : (
          <IoWarning className="text-red-500" size={iconSize} />
        )}
      </div>
      
      {showHint && (
        <div className="absolute bottom-full left-1/2 z-10 mb-1 w-48 -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg">
          {tooltipContent}
        </div>
      )}
    </div>
  );
} 