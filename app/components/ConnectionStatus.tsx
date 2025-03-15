'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import { CheckCircle2, Cloud, CloudOff, AlertCircle } from 'lucide-react';

export const ConnectionStatus = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  
  // Verificar status de conexão com a internet
  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(true);
    const handleOfflineStatus = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);
  
  // Verificar status do Supabase
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Verificar conexão usando a API de autenticação, que é mais confiável
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Erro ao verificar conexão com Supabase:', error);
          setSupabaseStatus('disconnected');
        } else {
          setSupabaseStatus('connected');
        }
      } catch (err) {
        console.error('Falha ao verificar status do Supabase:', err);
        setSupabaseStatus('disconnected');
      }
    };
    
    if (isOnline) {
      checkSupabaseConnection();
    } else {
      setSupabaseStatus('disconnected');
    }
  }, [isOnline]);
  
  return (
    <div className="rounded-lg border p-3 bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="text-sm font-medium mb-2">Status da Conexão</h3>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isOnline ? (
              <Cloud className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <CloudOff className="h-4 w-4 text-red-500 mr-2" />
            )}
            <span className="text-sm">Internet</span>
          </div>
          <span className={`text-xs ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
            {isOnline ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {supabaseStatus === 'connected' ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            ) : supabaseStatus === 'checking' ? (
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            )}
            <span className="text-sm">Supabase</span>
          </div>
          <span 
            className={`text-xs ${
              supabaseStatus === 'connected'
                ? 'text-green-500'
                : supabaseStatus === 'checking'
                ? 'text-amber-500'
                : 'text-red-500'
            }`}
          >
            {supabaseStatus === 'connected'
              ? 'Conectado'
              : supabaseStatus === 'checking'
              ? 'Verificando...'
              : 'Desconectado'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {user ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
            )}
            <span className="text-sm">Autenticação</span>
          </div>
          <span className={`text-xs ${user ? 'text-green-500' : 'text-amber-500'}`}>
            {user ? 'Autenticado' : 'Não autenticado'}
          </span>
        </div>
      </div>
      
      {!user && (
        <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
          Faça login para usar a sincronização com o Supabase
        </div>
      )}
      
      {!isOnline && (
        <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
          Modo offline ativo. Os dados serão salvos localmente e sincronizados quando a conexão for restaurada.
        </div>
      )}
    </div>
  );
}; 