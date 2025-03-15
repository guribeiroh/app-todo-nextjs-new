'use client';

import React from 'react';
import { MigrationButton } from '../components/MigrationButton';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { SyncButton } from '../components/SyncButton';
import { useAuth } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, User, Cloud, Database, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Configurações</h1>
          <p className="text-gray-500">Gerencie suas preferências e configurações do sistema</p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
            <TabsTrigger value="account">Conta</TabsTrigger>
            <TabsTrigger value="database">Banco de Dados</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações da Conta
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie as informações da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">E-mail</p>
                        <p className="text-base font-medium">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">ID</p>
                        <p className="text-base font-medium">{user.id}</p>
                      </div>
                    </div>

                    <Button onClick={signOut} variant="outline">
                      Sair
                    </Button>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Não autenticado</AlertTitle>
                    <AlertDescription>
                      Você precisa fazer login para ver as informações da sua conta.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Gerenciamento de Dados
                </CardTitle>
                <CardDescription>
                  Configure a persistência de dados e opções de migração
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex items-start gap-3">
                          <Cloud className="h-5 w-5 text-blue-600 mt-1" />
                          <div>
                            <h3 className="font-medium">Armazenamento na Nuvem</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              O Supabase oferece armazenamento seguro na nuvem para seus dados, 
                              permitindo que você acesse seu trabalho de qualquer dispositivo
                              e compartilhe com sua equipe.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <MigrationButton />
                    </div>
                    
                    <div>
                      <ConnectionStatus />
                      
                      <div className="mt-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border p-3 shadow-sm">
                          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Sincronização
                          </h3>
                          <SyncButton />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
                <CardDescription>
                  Configurações para usuários avançados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Limpar Dados Locais</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-2">
                      Esta ação irá remover todos os dados armazenados localmente no seu navegador.
                      Certifique-se de que seus dados foram migrados para o Supabase antes de executar esta ação.
                    </p>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja limpar todos os dados locais? Esta ação não pode ser desfeita.')) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }}
                    >
                      Limpar LocalStorage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 