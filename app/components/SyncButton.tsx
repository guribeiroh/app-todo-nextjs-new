'use client';

import React from 'react';
import { useSupabaseSync } from './SupabaseSyncProvider';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const SyncButton = () => {
  const { 
    isOnline, 
    isSyncing, 
    lastSyncDate, 
    syncError, 
    pendingChanges,
    syncNow,
    enableAutoSync
  } = useSupabaseSync();
  
  const handleSyncClick = () => {
    if (!isSyncing && isOnline) {
      syncNow();
    }
  };
  
  const formatSyncDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Verificar se o localStorage tem a preferência de sincronização automática
  const autoSyncEnabled = typeof window !== 'undefined' 
    ? localStorage.getItem('autoSyncEnabled') !== 'false'
    : true;
  
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch 
            id="auto-sync" 
            checked={autoSyncEnabled}
            onCheckedChange={(checked) => enableAutoSync(checked)}
          />
          <Label htmlFor="auto-sync">Sincronização automática</Label>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncClick}
                disabled={!isOnline || isSyncing}
                className="flex items-center gap-1.5"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sincronizando</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Sincronizar</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!isOnline ? (
                <p>Sem conexão com a internet</p>
              ) : isSyncing ? (
                <p>Sincronizando dados com o Supabase</p>
              ) : lastSyncDate ? (
                <p>Última sincronização: {formatSyncDate(lastSyncDate)}</p>
              ) : (
                <p>Clique para sincronizar com o Supabase</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {syncError && (
        <div className="flex items-center text-xs text-red-500 bg-red-50 p-2 rounded">
          <AlertCircle className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
          <span>{syncError}</span>
        </div>
      )}
      
      {lastSyncDate && !syncError && (
        <div className="flex items-center text-xs text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          <span>Sincronizado em {formatSyncDate(lastSyncDate)}</span>
        </div>
      )}
      
      {pendingChanges > 0 && !isSyncing && (
        <div className="flex items-center text-xs text-amber-600">
          <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
          <span>{pendingChanges} alterações pendentes</span>
        </div>
      )}
    </div>
  );
}; 