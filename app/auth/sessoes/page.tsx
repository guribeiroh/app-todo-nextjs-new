'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SessionManager from '../../components/Auth/SessionManager';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';
import { FiArrowLeft, FiShield } from 'react-icons/fi';

export default function SessionsPage() {
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
                <FiShield className="mr-2 h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                Gerenciamento de Sessões
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
                Segurança da Conta
              </h2>
              <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                <p>
                  Gerencie os dispositivos onde você está conectado. Se você notar alguma atividade suspeita, 
                  encerre a sessão e altere sua senha imediatamente.
                </p>
              </div>
            </div>
          </div>

          <SessionManager />

          <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Dicas de Segurança
              </h3>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Nunca compartilhe suas credenciais de acesso com terceiros.</li>
                  <li>Utilize senhas fortes e únicas para cada serviço.</li>
                  <li>Ative a autenticação em duas etapas para maior segurança.</li>
                  <li>Encerre suas sessões em dispositivos públicos após o uso.</li>
                  <li>Verifique regularmente suas sessões ativas para identificar acessos não autorizados.</li>
                </ul>
              </div>
              <div className="mt-5">
                <Link
                  href="/auth/two-factor"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Configurar Autenticação em Duas Etapas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 