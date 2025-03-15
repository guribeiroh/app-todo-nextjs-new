'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Obter as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Criar o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SupabaseContextProps {
  supabase: any; // Usar any para evitar problemas de tipo
}

const SupabaseContext = createContext<SupabaseContextProps | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    // Atualizar a página quando a sessão de autenticação mudar
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase deve ser usado dentro de um SupabaseProvider');
  }
  return context.supabase;
}; 