'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '../../lib/supabase';

export default function RedefinirSenhaPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar se há um hash na URL (token de redefinição)
    const hasHash = window.location.hash && window.location.hash.length > 0;
    if (!hasHash) {
      setError('Link de redefinição inválido ou expirado. Solicite um novo link.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      setMessage('Senha atualizada com sucesso!');
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      setError(error.message || 'Ocorreu um erro ao redefinir sua senha.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Redefinir Senha</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Digite sua nova senha
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nova Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Digite sua nova senha"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Confirme sua nova senha"
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
                {isLoading ? 'Processando...' : 'Redefinir Senha'}
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