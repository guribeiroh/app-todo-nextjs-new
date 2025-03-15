'use client';

import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Globe, 
  Trash2 
} from 'lucide-react';
import SecurityService, { SecurityActivityType } from '../../services/SecurityService';

interface Session {
  id: string;
  created_at: string;
  user_agent?: string;
  ip?: string;
  current?: boolean;
}

export default function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Obter a sessão atual
      const { data: currentSession } = await supabase.auth.getSession();
      
      if (currentSession?.session) {
        setCurrentSessionId((currentSession.session as any).id);
      }
      
      // Obter todas as sessões ativas
      const { data, error } = await supabase.rpc('get_user_sessions');
      
      if (error) throw error;
      
      // Marcar a sessão atual
      const sessionsWithCurrent = (data || []).map((session: Session) => ({
        ...session,
        current: session.id === currentSessionId
      }));
      
      setSessions(sessionsWithCurrent);
    } catch (error: any) {
      console.error('Erro ao buscar sessões:', error);
      setError('Não foi possível carregar suas sessões ativas.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Globe size={18} />;
    
    userAgent = userAgent.toLowerCase();
    
    if (userAgent.includes('android') || userAgent.includes('iphone')) {
      return <Smartphone size={18} />;
    } else if (userAgent.includes('ipad') || userAgent.includes('tablet')) {
      return <Tablet size={18} />;
    } else {
      return <Monitor size={18} />;
    }
  };

  const getDeviceName = (userAgent?: string) => {
    if (!userAgent) return 'Dispositivo desconhecido';
    
    userAgent = userAgent.toLowerCase();
    let device = 'Computador';
    let browser = 'Navegador';
    let os = 'Sistema';
    
    // Detectar SO
    if (userAgent.includes('windows')) {
      os = 'Windows';
    } else if (userAgent.includes('mac')) {
      os = 'macOS';
    } else if (userAgent.includes('linux')) {
      os = 'Linux';
    } else if (userAgent.includes('android')) {
      os = 'Android';
      device = 'Smartphone';
    } else if (userAgent.includes('iphone')) {
      os = 'iOS';
      device = 'iPhone';
    } else if (userAgent.includes('ipad')) {
      os = 'iOS';
      device = 'iPad';
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
    
    return `${device} - ${browser} em ${os}`;
  };

  const terminateSession = async (sessionId: string) => {
    // Não permitir encerrar a sessão atual através desta interface
    if (sessionId === currentSessionId) {
      setError('Você não pode encerrar sua sessão atual por aqui. Use a opção "Sair" no menu.');
      return;
    }
    
    try {
      const { error } = await supabase.rpc('terminate_session', {
        session_id: sessionId
      });
      
      if (error) throw error;
      
      // Registrar atividade de encerramento de sessão
      const securityService = SecurityService.getInstance();
      await securityService.logSessionTerminated(sessionId);
      
      setMessage('Sessão encerrada com sucesso.');
      // Atualizar a lista de sessões
      setSessions(sessions.filter(session => session.id !== sessionId));
    } catch (error: any) {
      console.error('Erro ao encerrar sessão:', error);
      setError('Não foi possível encerrar a sessão. Tente novamente.');
    }
  };

  const terminateAllSessions = async () => {
    if (!window.confirm('Tem certeza que deseja encerrar todas as outras sessões? Você precisará fazer login novamente em todos os outros dispositivos.')) {
      return;
    }
    
    try {
      // Encerrar todas as sessões exceto a atual
      const { error } = await supabase.rpc('terminate_all_sessions_except_current');
      
      if (error) throw error;
      
      // Registrar atividade de encerramento de todas as sessões
      const securityService = SecurityService.getInstance();
      await securityService.logActivity(
        SecurityActivityType.SESSION_TERMINATED,
        'Todas as outras sessões foram encerradas',
        { multiple: true }
      );
      
      // Manter apenas a sessão atual na lista
      setSessions(sessions.filter(session => session.id === currentSessionId));
      setMessage('Todas as outras sessões foram encerradas com sucesso.');
    } catch (error: any) {
      console.error('Erro ao encerrar todas as sessões:', error);
      setError('Não foi possível encerrar as sessões. Tente novamente.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sessões Ativas</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gerencie os dispositivos onde você está conectado
        </p>
      </div>
      
      {error && (
        <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      {message && (
        <div className="p-4 mb-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md">
          {message}
        </div>
      )}
      
      {sessions.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          Nenhuma sessão ativa encontrada
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {sessions.map(session => (
              <li key={session.id} className={`p-4 ${session.current ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 pt-1">
                      {getDeviceIcon(session.user_agent)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getDeviceName(session.user_agent)}
                        {session.current && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Sessão atual
                          </span>
                        )}
                      </p>
                      <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                        <span>
                          IP: {session.ip || 'Desconhecido'}
                        </span>
                        <span>•</span>
                        <span>
                          Iniciada: {formatDistanceToNow(new Date(session.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(session.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  
                  {!session.current && (
                    <button
                      onClick={() => terminateSession(session.id)}
                      className="ml-4 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      title="Encerrar sessão"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          
          {sessions.length > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={terminateAllSessions}
                className="w-full flex justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Encerrar todas as outras sessões
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 