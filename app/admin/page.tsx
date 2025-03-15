'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Database, Key, Lock, RefreshCw, User, Trash2 } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [migrationStatus, setMigrationStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  
  // Verifique se o usuário é um administrador (esta é uma verificação simples)
  // Na prática, você deve implementar uma verificação mais robusta no backend
  const isAdmin = user && (
    user.email === 'admin@example.com' || 
    user.email?.endsWith('@seudominio.com')
  );
  
  const runMigration = async () => {
    if (!apiKey) {
      setMigrationStatus({
        status: 'error',
        message: 'Chave de API necessária para executar a migração'
      });
      return;
    }
    
    setMigrationStatus({ status: 'loading', message: 'Executando migração...' });
    
    try {
      const response = await fetch(`/api/migrate?apiKey=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMigrationStatus({
          status: 'success',
          message: data.message || 'Migração executada com sucesso'
        });
      } else {
        setMigrationStatus({
          status: 'error',
          message: data.error || 'Falha ao executar migração'
        });
      }
    } catch (error) {
      setMigrationStatus({
        status: 'error',
        message: 'Erro ao conectar com o servidor'
      });
    }
  };
  
  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso negado</AlertTitle>
          <AlertDescription>
            Faça login para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Esta página é apenas para administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Painel de Administração</h1>
      
      <Tabs defaultValue="database">
        <TabsList className="mb-6">
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="database">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Migração de Banco de Dados
                </CardTitle>
                <CardDescription>
                  Execute migrações e scripts SQL no banco de dados Supabase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="apiKey">Chave de API Admin</Label>
                    <Input 
                      id="apiKey" 
                      type="password" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Digite a chave de API administrativa"
                    />
                    <p className="text-sm text-gray-500">
                      Chave definida no .env como MIGRATION_API_KEY
                    </p>
                  </div>
                  
                  {migrationStatus.status !== 'idle' && (
                    <Alert 
                      variant={migrationStatus.status === 'error' ? 'destructive' : 
                              migrationStatus.status === 'success' ? 'success' : 'default'}
                      className={migrationStatus.status === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
                    >
                      {migrationStatus.status === 'success' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : migrationStatus.status === 'error' ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      )}
                      <AlertTitle>
                        {migrationStatus.status === 'loading' ? 'Executando' : 
                         migrationStatus.status === 'success' ? 'Sucesso' : 'Erro'}
                      </AlertTitle>
                      <AlertDescription>
                        {migrationStatus.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={runMigration} 
                  disabled={migrationStatus.status === 'loading' || !apiKey}
                >
                  {migrationStatus.status === 'loading' ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    'Executar Migração Scrum'
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Limpar Dados
                </CardTitle>
                <CardDescription>
                  Funções para limpar dados no banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>
                      Estas operações são irreversíveis e podem resultar em perda de dados.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 items-start">
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja limpar TODOS os dados de Scrum? Esta ação não pode ser desfeita.')) {
                      // Implementar limpeza de dados do Supabase
                      alert('Função não implementada');
                    }
                  }}
                >
                  Limpar Todos os Dados Scrum
                </Button>
                
                <Button 
                  variant="outline"
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja redefinir métricas? Esta ação não pode ser desfeita.')) {
                      // Implementar redefinição de métricas
                      alert('Função não implementada');
                    }
                  }}
                >
                  Redefinir Métricas
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Gerenciamento de Usuários
              </CardTitle>
              <CardDescription>
                Gerencie usuários da aplicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Esta funcionalidade estará disponível em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Configurações gerais e avançadas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Esta funcionalidade estará disponível em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 