'use client';

import React, { useState } from 'react';
import { migrateLocalStorageToSupabase } from '../lib/migrateToSupabase';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const MigrationButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const handleMigration = async () => {
    if (isLoading) return;
    
    const confirmMigration = window.confirm(
      'Tem certeza que deseja migrar seus dados para o Supabase? ' +
      'Este processo irá criar cópias dos seus dados no servidor. ' +
      'Os dados locais serão mantidos como backup.'
    );
    
    if (!confirmMigration) return;
    
    setIsLoading(true);
    setMigrationResult(null);
    
    try {
      const result = await migrateLocalStorageToSupabase();
      setMigrationResult(result);
      
      if (result.success) {
        // Salvar flag para indicar que a migração foi concluída
        localStorage.setItem('migrationCompleted', 'true');
      }
    } catch (error) {
      console.error('Erro ao executar migração:', error);
      setMigrationResult({
        success: false,
        message: 'Ocorreu um erro ao migrar os dados. Verifique o console para mais detalhes.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar se a migração já foi concluída anteriormente
  const migrationCompleted = typeof window !== 'undefined' && localStorage.getItem('migrationCompleted') === 'true';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium">Migração para Supabase</h3>
        <p className="text-sm text-gray-500">
          Esta ação irá migrar todos os seus dados do armazenamento local (localStorage) para o Supabase, 
          permitindo persistência de dados no servidor e acesso de diferentes dispositivos.
        </p>

        {migrationCompleted && !migrationResult?.success && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle>Informação</AlertTitle>
            <AlertDescription>
              Você já realizou a migração anteriormente. Uma nova execução irá duplicar seus dados.
            </AlertDescription>
          </Alert>
        )}

        {migrationResult && (
          <Alert 
            className={migrationResult.success 
              ? "bg-green-50 border-green-200" 
              : "bg-red-50 border-red-200"
            }
          >
            {migrationResult.success 
              ? <CheckCircle2 className="h-4 w-4 text-green-600" /> 
              : <AlertCircle className="h-4 w-4 text-red-600" />
            }
            <AlertTitle>
              {migrationResult.success ? "Sucesso" : "Erro"}
            </AlertTitle>
            <AlertDescription>
              {migrationResult.message}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleMigration} 
          className="w-full md:w-auto"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrando dados...
            </>
          ) : (
            'Migrar para Supabase'
          )}
        </Button>
      </div>
    </div>
  );
}; 