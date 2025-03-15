'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MigrationService from '../services/MigrationService';

export default function MigrationDialog() {
  const { isAuthenticated, user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success?: boolean;
    tasksMigrated?: number;
    listsMigrated?: number;
    errors?: string[];
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const migrationService = MigrationService.getInstance();

  useEffect(() => {
    // Verificação inicial simplificada - apenas checar se há dados locais
    // A verificação mais completa será feita depois do app carregar
    if (isAuthenticated && user && migrationService.hasLocalData()) {
      // Inicia a verificação assíncrona, mas não bloqueia o carregamento do app
      checkDataAsynchronously();
    }
  }, [isAuthenticated, user]);

  // Função para verificar dados de forma assíncrona após o carregamento
  const checkDataAsynchronously = async () => {
    // Dá um tempo para o app terminar de carregar (não bloqueia o carregamento inicial)
    setTimeout(async () => {
      setIsVerifying(true);
      try {
        // Verificar se os dados já existem no Supabase
        const alreadyExists = await migrationService.localDataAlreadyInSupabase();
        
        if (!alreadyExists) {
          // Só mostra o diálogo se os dados não existirem no Supabase
          setShowDialog(true);
        } else {
          console.log('Dados locais já existem no Supabase. Ignorando migração.');
        }
      } catch (error) {
        console.error('Erro ao verificar dados:', error);
        // Em caso de erro, mostra o diálogo para dar a opção ao usuário
        setShowDialog(true);
      } finally {
        setIsVerifying(false);
      }
    }, 2000); // Espera 2 segundos para não afetar o carregamento inicial
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await migrationService.migrateToSupabase();
      setMigrationResult(result);

      if (result.success) {
        // Se a migração foi bem-sucedida, limpar dados locais após 3 segundos
        setTimeout(() => {
          migrationService.clearLocalData();
          setShowDialog(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Erro durante a migração:', error);
      setMigrationResult({
        success: false,
        errors: ['Ocorreu um erro inesperado durante a migração.']
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSkip = () => {
    setShowDialog(false);
  };

  if (!showDialog) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Migração de Dados
        </h2>

        {!migrationResult ? (
          <>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Detectamos que você possui dados salvos localmente no seu navegador.
              Deseja migrar esses dados para sua conta no Supabase? Isso permitirá
              que você acesse suas tarefas em qualquer dispositivo.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleSkip}
                disabled={isMigrating}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Pular
              </button>
              <button
                onClick={handleMigrate}
                disabled={isMigrating}
                className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md ${
                  isMigrating ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isMigrating ? 'Migrando...' : 'Migrar Dados'}
              </button>
            </div>
          </>
        ) : (
          <div>
            {migrationResult.success ? (
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <svg
                    className="w-16 h-16 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Migração concluída!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  {migrationResult.listsMigrated} listas migradas
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {migrationResult.tasksMigrated} tarefas migradas
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Os dados locais serão removidos automaticamente.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex justify-center">
                  <svg
                    className="w-16 h-16 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Ocorreu um erro durante a migração
                </h3>
                {migrationResult.errors && migrationResult.errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-md mb-4 text-sm max-h-40 overflow-y-auto">
                    {migrationResult.errors.map((error, index) => (
                      <p key={index} className="mb-1">
                        {error}
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleMigrate}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 