'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSupabase } from './SupabaseContext';
import { useAuth } from './AuthContext';
import { useOffline } from '../hooks/useOffline';
import { useToast } from '../components/Toast';

// Tipos
export interface PomodoroSession {
  id: string;
  task_id?: string;
  duration_seconds: number;
  type: 'pomodoro' | 'shortBreak' | 'longBreak';
  started_at: Date;
  completed_at?: Date;
  completed: boolean;
  interruptions: number;
  notes?: string;
  created_at?: Date;
}

interface PomodoroContextType {
  sessions: PomodoroSession[];
  addSession: (session: Omit<PomodoroSession, 'id' | 'created_at'>) => Promise<string>;
  updateSession: (id: string, data: Partial<PomodoroSession>) => Promise<void>;
  completeSession: (id: string, interruptions?: number) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  getStats: (startDate?: Date, endDate?: Date) => Promise<PomodoroStats>;
  isLoading: boolean;
  error: string | null;
}

export interface PomodoroStats {
  totalSessions: number;
  completedSessions: number;
  totalFocusMinutes: number;
  totalInterruptions: number;
  completionRate: number;
  sessionsByDay?: Record<string, number>;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export const PomodoroProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [stats, setStats] = useState<PomodoroStats | null>(null);
  
  const supabase = useSupabase();
  const { isAuthenticated, user } = useAuth();
  const isOffline = useOffline();
  const { showToast } = useToast();

  // Carregar sessões ao inicializar
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSessions();
    } else {
      setIsLoading(false);
      setSessions([]);
    }
  }, [isAuthenticated, user]);

  // Sincronizar alterações pendentes quando voltar online
  useEffect(() => {
    if (!isOffline && pendingChanges.length > 0) {
      syncPendingChanges();
    }
  }, [isOffline, pendingChanges]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      
      // Carregar do armazenamento local primeiro para resposta imediata da UI
      const localSessions = localStorage.getItem('pomodoro_sessions');
      if (localSessions) {
        setSessions(JSON.parse(localSessions));
      }
      
      if (isAuthenticated && !isOffline) {
        const { data, error } = await supabase
          .from('pomodoro_sessions')
          .select('*')
          .order('started_at', { ascending: false });
          
        if (error) throw error;
        
        const formattedSessions = data.map(session => ({
          ...session,
          started_at: new Date(session.started_at as string),
          completed_at: session.completed_at ? new Date(session.completed_at as string) : undefined,
          created_at: session.created_at ? new Date(session.created_at as string) : undefined
        })) as PomodoroSession[];
        
        setSessions(formattedSessions);
        localStorage.setItem('pomodoro_sessions', JSON.stringify(formattedSessions));
      }
    } catch (err: any) {
      console.error('Erro ao carregar sessões de pomodoro:', err);
      setError(err.message);
      showToast('Erro ao carregar sessões de pomodoro', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const addSession = async (sessionData: Omit<PomodoroSession, 'id' | 'created_at'>): Promise<string> => {
    try {
      const newSession: PomodoroSession = {
        ...sessionData,
        id: uuidv4()
      };
      
      // Atualizar estado localmente primeiro para resposta imediata da UI
      setSessions(prev => [newSession, ...prev]);
      
      // Salvar localmente
      const updatedSessions = [newSession, ...sessions];
      localStorage.setItem('pomodoro_sessions', JSON.stringify(updatedSessions));
      
      // Se estiver online, salvar no Supabase
      if (isAuthenticated && !isOffline) {
        const { error } = await supabase.from('pomodoro_sessions').insert({
          id: newSession.id,
          user_id: user?.id,
          task_id: sessionData.task_id,
          duration_seconds: sessionData.duration_seconds,
          type: sessionData.type,
          started_at: sessionData.started_at,
          completed_at: sessionData.completed_at,
          completed: sessionData.completed,
          interruptions: sessionData.interruptions,
          notes: sessionData.notes
        });
        
        if (error) throw error;
      } else if (isAuthenticated) {
        // Se estiver offline, adicionar à fila de alterações pendentes
        setPendingChanges([...pendingChanges, {
          type: 'insert',
          table: 'pomodoro_sessions',
          data: {
            ...newSession,
            user_id: user?.id
          }
        }]);
      }
      
      return newSession.id;
    } catch (err: any) {
      console.error('Erro ao adicionar sessão de pomodoro:', err);
      setError(err.message);
      showToast('Erro ao iniciar sessão de pomodoro', 'error');
      throw err;
    }
  };

  const updateSession = async (id: string, data: Partial<PomodoroSession>) => {
    try {
      // Atualizar estado localmente primeiro para resposta imediata da UI
      setSessions(prev => prev.map(session => 
        session.id === id ? { ...session, ...data } : session
      ));
      
      // Atualizar storage local
      const updatedSessions = sessions.map(session => 
        session.id === id ? { ...session, ...data } : session
      );
      localStorage.setItem('pomodoro_sessions', JSON.stringify(updatedSessions));
      
      // Se estiver online, atualizar no Supabase
      if (isAuthenticated && !isOffline) {
        const { error } = await supabase
          .from('pomodoro_sessions')
          .update(data)
          .eq('id', id);
          
        if (error) throw error;
      } else if (isAuthenticated) {
        // Se estiver offline, adicionar à fila de alterações pendentes
        setPendingChanges([...pendingChanges, {
          type: 'update',
          table: 'pomodoro_sessions',
          id,
          data
        }]);
      }
    } catch (err: any) {
      console.error('Erro ao atualizar sessão de pomodoro:', err);
      setError(err.message);
      showToast('Erro ao atualizar sessão', 'error');
      throw err;
    }
  };

  const completeSession = async (id: string, interruptions?: number) => {
    const now = new Date();
    const updateData: Partial<PomodoroSession> = {
      completed: true,
      completed_at: now
    };
    
    if (typeof interruptions === 'number') {
      updateData.interruptions = interruptions;
    }
    
    await updateSession(id, updateData);
    showToast('Sessão Pomodoro concluída!', 'success');
  };

  const deleteSession = async (id: string) => {
    try {
      // Atualizar estado localmente primeiro para resposta imediata da UI
      setSessions(prev => prev.filter(session => session.id !== id));
      
      // Atualizar storage local
      const updatedSessions = sessions.filter(session => session.id !== id);
      localStorage.setItem('pomodoro_sessions', JSON.stringify(updatedSessions));
      
      // Se estiver online, deletar no Supabase
      if (isAuthenticated && !isOffline) {
        const { error } = await supabase
          .from('pomodoro_sessions')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
      } else if (isAuthenticated) {
        // Se estiver offline, adicionar à fila de alterações pendentes
        setPendingChanges([...pendingChanges, {
          type: 'delete',
          table: 'pomodoro_sessions',
          id
        }]);
      }
    } catch (err: any) {
      console.error('Erro ao deletar sessão de pomodoro:', err);
      setError(err.message);
      showToast('Erro ao excluir sessão', 'error');
      throw err;
    }
  };

  const syncPendingChanges = async () => {
    if (!isAuthenticated || isOffline || pendingChanges.length === 0) return;
    
    try {
      showToast('Sincronizando dados...', 'info');
      let successCount = 0;
      let errorCount = 0;
      
      for (const change of pendingChanges) {
        if (change.table === 'pomodoro_sessions') {
          try {
            if (change.type === 'insert') {
              await supabase.from('pomodoro_sessions').insert(change.data);
              successCount++;
            } else if (change.type === 'update') {
              await supabase.from('pomodoro_sessions').update(change.data).eq('id', change.id);
              successCount++;
            } else if (change.type === 'delete') {
              await supabase.from('pomodoro_sessions').delete().eq('id', change.id);
              successCount++;
            }
          } catch (error) {
            console.error(`Erro na sincronização de ${change.type}:`, error);
            errorCount++;
          }
        }
      }
      
      // Limpar alterações pendentes após sincronização
      if (errorCount === 0) {
        setPendingChanges([]);
        showToast(`${successCount} alterações sincronizadas com sucesso!`, 'success');
      } else {
        showToast(`Sincronização parcial: ${successCount} sucessos, ${errorCount} falhas`, 'warning');
        // Remover apenas as alterações bem-sucedidas
        // Isso exigiria rastrear quais alterações foram bem-sucedidas
      }
    } catch (err) {
      console.error('Erro ao sincronizar alterações pendentes:', err);
      showToast('Erro durante a sincronização', 'error');
    }
  };

  const getStats = async (startDate?: Date, endDate?: Date): Promise<PomodoroStats> => {
    // Calcular estatísticas a partir dos dados em memória
    const filteredSessions = sessions.filter(session => {
      if (startDate && session.started_at < startDate) return false;
      if (endDate && session.started_at > endDate) return false;
      return true;
    });
    
    const completedSessions = filteredSessions.filter(session => session.completed);
    const totalFocusMinutes = filteredSessions
      .filter(session => session.type === 'pomodoro')
      .reduce((sum, session) => sum + session.duration_seconds / 60, 0);
    
    const totalInterruptions = filteredSessions.reduce((sum, session) => sum + session.interruptions, 0);
    
    // Agrupar por dia
    const sessionsByDay: Record<string, number> = {};
    filteredSessions.forEach(session => {
      const day = session.started_at.toISOString().split('T')[0];
      sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
    });
    
    return {
      totalSessions: filteredSessions.length,
      completedSessions: completedSessions.length,
      totalFocusMinutes: Math.round(totalFocusMinutes),
      totalInterruptions,
      completionRate: filteredSessions.length > 0 
        ? (completedSessions.length / filteredSessions.length) * 100 
        : 0,
      sessionsByDay
    };
  };

  const value = {
    sessions,
    addSession,
    updateSession,
    completeSession,
    deleteSession,
    getStats,
    isLoading,
    error
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoroContext = () => {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoroContext deve ser usado dentro de um PomodoroProvider');
  }
  return context;
}; 