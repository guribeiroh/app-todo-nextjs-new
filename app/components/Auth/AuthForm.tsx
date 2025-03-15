'use client';

import React, { useState } from 'react';
import supabase from '../../lib/supabase';
import { FaGoogle, FaGithub, FaMicrosoft } from 'react-icons/fa';
import SupabaseService from '../../services/SupabaseService';
import SecurityService from '../../services/SecurityService';
import Link from 'next/link';

type AuthMode = 'login' | 'register';
type SocialProvider = 'google' | 'github' | 'microsoft';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleModeToggle = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Registrar falha de login
          const securityService = SecurityService.getInstance();
          await securityService.logFailedLogin(email, error.message);
          throw error;
        }
        
        if (data.user) {
          // Atualizar o ID do usuário no serviço
          const supabaseService = SupabaseService.getInstance();
          supabaseService.setUserId(data.user.id);
          
          // Registrar login bem-sucedido
          const securityService = SecurityService.getInstance();
          securityService.setUserId(data.user.id);
          await securityService.logLogin(email);
          
          setMessage('Login realizado com sucesso!');
          // Redirecionar ou atualizar o estado global
          window.location.href = '/';
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // Registrar cadastro bem-sucedido
        if (data.user) {
          const securityService = SecurityService.getInstance();
          await securityService.logSignup(email);
        }

        setMessage('Registro concluído. Verifique seu email para confirmar.');
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error);
      setError(error.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Adicionar feedback visual ao botão de login social
      const socialButton = document.getElementById(`social-${provider}`);
      if (socialButton) {
        socialButton.classList.add('animate-pulse');
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: window.location.origin,
          scopes: provider === 'google' ? 'email profile' : undefined
        },
      });

      if (error) {
        // Registrar falha de login social
        const securityService = SecurityService.getInstance();
        await securityService.logFailedLogin(`login social com ${provider}`, error.message);
        throw error;
      }
      
      // Se não houver redirecionamento em 5 segundos, exibir mensagem
      setTimeout(() => {
        if (socialButton) {
          socialButton.classList.remove('animate-pulse');
        }
        setMessage('Redirecionando para o provedor de autenticação...');
      }, 5000);
    } catch (error: any) {
      console.error(`Erro ao entrar com ${provider}:`, error);
      setError(error.message || `Erro ao entrar com ${provider}.`);
      const socialButton = document.getElementById(`social-${provider}`);
      if (socialButton) {
        socialButton.classList.remove('animate-pulse');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
        {mode === 'login' ? 'Entrar na sua conta' : 'Criar uma conta'}
      </h2>

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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            {isLoading
              ? 'Processando...'
              : mode === 'login'
              ? 'Entrar'
              : 'Registrar'}
          </button>
        </div>
        
        {mode === 'login' && (
          <div className="text-center">
            <Link 
              href="/auth/recuperar-senha" 
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Esqueceu sua senha?
            </Link>
          </div>
        )}
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Ou continue com
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <button
            id="social-google"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <FaGoogle className="h-5 w-5 text-red-500" />
            <span className="sr-only">Google</span>
          </button>

          <button
            id="social-github"
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <FaGithub className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </button>
          
          <button
            id="social-microsoft"
            onClick={() => handleSocialLogin('microsoft')}
            disabled={isLoading}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <FaMicrosoft className="h-5 w-5 text-blue-500" />
            <span className="sr-only">Microsoft</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={handleModeToggle}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {mode === 'login'
            ? 'Não tem uma conta? Registre-se'
            : 'Já tem uma conta? Entre'}
        </button>
      </div>
    </div>
  );
} 