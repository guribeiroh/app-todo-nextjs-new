'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SecurityActivityLog from '../../components/Auth/SecurityActivityLog';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';
import { FiArrowLeft, FiActivity } from 'react-icons/fi';

export default function SecurityActivitiesPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <FiArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <FiActivity className="mr-2 h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                Histórico de Atividades
              </h1>
            </div>
            <Link
              href="/perfil"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
            >
              Voltar ao Perfil
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Monitoramento de Segurança
              </h2>
              <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                <p>
                  Acompanhe todas as atividades relacionadas à segurança da sua conta. 
                  Isso inclui logins, alterações de senha, atualizações de perfil e outras ações importantes.
                </p>
              </div>
            </div>
          </div>

          <SecurityActivityLog />

          <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Outras Opções de Segurança
              </h3>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  href="/auth/two-factor"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Configurar Autenticação em Duas Etapas
                </Link>
                <Link
                  href="/auth/sessoes"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Gerenciar Sessões Ativas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 