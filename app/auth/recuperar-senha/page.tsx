'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '../../lib/supabase';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor, informe seu email');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/redefinir-senha`,
      });
      
      if (error) throw error;
      
      setMessage('Enviamos um link de recuperação para seu email. Verifique sua caixa de entrada.');
    } catch (error: any) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      setError(error.message || 'Ocorreu um erro ao solicitar recuperação de senha.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recuperar Senha</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Digite seu email para receber um link de recuperação
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Processando...' : 'Enviar link de recuperação'}
              </button>
            </div>
          </form>
          
          <div className="mt-4 text-center">
            <Link 
              href="/auth/login" 
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 