'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useSupabase } from './SupabaseContext';
import { useToast } from '../components/Toast';
import SupabaseService from '../services/SupabaseService';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabase();
  const router = useRouter();
  const { showToast } = useToast();
  const supabaseService = SupabaseService.getInstance();

  // Verificar a sessão atual e configurar o usuário
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Verificar se há uma sessão ativa
        const { data: { session: activeSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (activeSession) {
          setSession(activeSession);
          setUser(activeSession.user);
          supabaseService.setUserId(activeSession.user.id);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
    
    // Configurar listener para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
      setIsLoading(false);
      
      // Atualizar o ID do usuário no SupabaseService
      supabaseService.setUserId(newSession?.user?.id || null);
      
      // Log da alteração
      console.log('Estado de autenticação alterado:', event);
      console.log('Novo usuário:', newSession?.user?.id || 'Nenhum');
      
      if (event === 'SIGNED_IN') {
        router.refresh();
        showToast('Login realizado com sucesso!', 'success');
      }
      
      if (event === 'SIGNED_OUT') {
        router.push('/login');
        showToast('Você saiu da sua conta', 'info');
      }
    });
    
    // Limpar o listener ao desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, showToast, supabaseService]);
  
  // Funções de autenticação
  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      
      // Atualizar o ID do usuário no SupabaseService após login bem-sucedido
      if (data?.user) {
        supabaseService.setUserId(data.user.id);
      }
      
      router.push('/');
    } catch (error: any) {
      showToast(`Erro ao fazer login: ${error.message}`, 'error');
      throw error;
    }
  };
  
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      showToast('Cadastro realizado! Verifique seu email para confirmar.', 'success');
    } catch (error: any) {
      showToast(`Erro ao criar conta: ${error.message}`, 'error');
      throw error;
    }
  };
  
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpar o ID do usuário no SupabaseService ao fazer logout
      supabaseService.setUserId(null);
    } catch (error: any) {
      showToast(`Erro ao sair: ${error.message}`, 'error');
      throw error;
    }
  };
  
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      showToast('Email de recuperação enviado. Verifique sua caixa de entrada.', 'success');
    } catch (error: any) {
      showToast(`Erro ao solicitar recuperação de senha: ${error.message}`, 'error');
      throw error;
    }
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 