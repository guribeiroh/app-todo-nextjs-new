'use client';

import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FiKey, FiLogIn, FiLogOut, FiShield, FiAlertTriangle, 
  FiUserPlus, FiEdit, FiLock, FiSmartphone, FiRefreshCw 
} from 'react-icons/fi';

interface SecurityLog {
  id: string;
  activity_type: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  metadata?: any;
}

export default function SecurityActivityLog() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const logsPerPage = 20;

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_user_security_logs', {
        limit_count: logsPerPage,
        offset_count: page * logsPerPage
      });
      
      if (error) throw error;
      
      if (data) {
        if (data.length < logsPerPage) {
          setHasMore(false);
        }
        
        if (page === 0) {
          setLogs(data);
        } else {
          setLogs(prevLogs => [...prevLogs, ...data]);
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar logs de segurança:', error);
      setError('Não foi possível carregar seu histórico de atividades.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login':
        return <FiLogIn size={18} className="text-green-500" />;
      case 'logout':
        return <FiLogOut size={18} className="text-gray-500" />;
      case 'password_change':
        return <FiKey size={18} className="text-orange-500" />;
      case 'password_reset':
        return <FiRefreshCw size={18} className="text-blue-500" />;
      case 'signup':
        return <FiUserPlus size={18} className="text-indigo-500" />;
      case 'profile_update':
        return <FiEdit size={18} className="text-purple-500" />;
      case 'two_factor_enabled':
        return <FiShield size={18} className="text-green-600" />;
      case 'two_factor_disabled':
        return <FiShield size={18} className="text-red-500" />;
      case 'session_terminated':
        return <FiSmartphone size={18} className="text-red-500" />;
      case 'failed_login':
        return <FiAlertTriangle size={18} className="text-red-600" />;
      default:
        return <FiLock size={18} className="text-gray-500" />;
    }
  };

  const getActivityName = (activityType: string) => {
    switch (activityType) {
      case 'login':
        return 'Login';
      case 'logout':
        return 'Logout';
      case 'password_change':
        return 'Alteração de senha';
      case 'password_reset':
        return 'Redefinição de senha';
      case 'signup':
        return 'Criação de conta';
      case 'profile_update':
        return 'Atualização de perfil';
      case 'two_factor_enabled':
        return 'Autenticação em duas etapas ativada';
      case 'two_factor_disabled':
        return 'Autenticação em duas etapas desativada';
      case 'session_terminated':
        return 'Sessão encerrada';
      case 'failed_login':
        return 'Tentativa de login malsucedida';
      default:
        return activityType.replace(/_/g, ' ');
    }
  };

  const getBrowserInfo = (userAgent?: string) => {
    if (!userAgent) return 'Dispositivo desconhecido';
    
    userAgent = userAgent.toLowerCase();
    let device = 'Computador';
    let browser = 'Navegador';
    
    // Detectar dispositivo
    if (userAgent.includes('android') || userAgent.includes('iphone')) {
      device = 'Smartphone';
    } else if (userAgent.includes('ipad') || userAgent.includes('tablet')) {
      device = 'Tablet';
    }
    
    // Detectar navegador
    if (userAgent.includes('chrome')) {
      browser = 'Chrome';
    } else if (userAgent.includes('firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      browser = 'Safari';
    } else if (userAgent.includes('edge')) {
      browser = 'Edge';
    } else if (userAgent.includes('opera')) {
      browser = 'Opera';
    }
    
    return `${device} - ${browser}`;
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Histórico de Atividades</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Acompanhe as atividades de segurança da sua conta
        </p>
      </div>
      
      {error && (
        <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      {logs.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          Nenhuma atividade registrada
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map(log => (
              <li key={log.id} className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-1">
                    {getActivityIcon(log.activity_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getActivityName(log.activity_type)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {log.description}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                      {log.ip_address && (
                        <>
                          <span>IP: {log.ip_address}</span>
                          <span>•</span>
                        </>
                      )}
                      {log.user_agent && (
                        <span>{getBrowserInfo(log.user_agent)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {hasMore && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className={`w-full flex justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 