"use client";

import React from 'react';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

export default function Melhorias() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Melhorias no NeoTask</h1>
          <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
            Voltar ao App
          </Link>
        </div>
        
        <div className="prose dark:prose-invert prose-lg max-w-none">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg mb-8 flex items-center justify-between">
            <p className="m-0 font-medium text-indigo-700 dark:text-indigo-300">
              🚀 Confira as próximas melhorias que estamos preparando para o NeoTask!
            </p>
            <Link href="/melhorias/novas-melhorias" className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Ver novidades <FiArrowRight className="ml-1" />
            </Link>
          </div>
          
          <p className="lead text-xl">
            Seu aplicativo de gerenciamento de tarefas agora é ainda mais avançado! Implementamos várias melhorias
            para fornecer uma experiência mais completa, confiável e acessível.
          </p>
          
          <h2>Funcionalidades PWA (Progressive Web App)</h2>
          <p>
            Transformamos o NeoTask em um Progressive Web App completo, permitindo:
          </p>
          <ul>
            <li>Instalação na tela inicial de qualquer dispositivo</li>
            <li>Acesso offline completo às suas tarefas</li>
            <li>Sincronização automática quando a conexão é restaurada</li>
            <li>Melhor desempenho com cache inteligente</li>
          </ul>
          
          <h2>Gerenciamento de Dados Aprimorado</h2>
          <p>
            Adicionamos recursos avançados de gerenciamento de dados:
          </p>
          <ul>
            <li>Exportação completa de dados em JSON</li>
            <li>Exportação de tarefas em CSV para uso em outras ferramentas</li>
            <li>Importação de dados de backups anteriores</li>
            <li>Backup automático de dados no armazenamento local</li>
          </ul>
          
          <h2>Indicador de Status de Conexão</h2>
          <p>
            O novo indicador de conexão mostra claramente:
          </p>
          <ul>
            <li>Status atual da sua conexão (online/offline)</li>
            <li>Progresso da sincronização de dados</li>
            <li>Número de alterações pendentes para sincronização</li>
            <li>Notificações quando a sincronização for concluída</li>
          </ul>
          
          <h2>Service Worker para Desempenho</h2>
          <p>
            Implementamos um Service Worker moderno que:
          </p>
          <ul>
            <li>Armazena em cache os recursos essenciais do aplicativo</li>
            <li>Permite o carregamento instantâneo em visitas subsequentes</li>
            <li>Gerencia a sincronização em segundo plano</li>
            <li>Entrega a versão mais recente do aplicativo automaticamente</li>
          </ul>
          
          <h2>Gerenciamento de Tags</h2>
          <p>
            O sistema de tags agora é mais poderoso:
          </p>
          <ul>
            <li>Gerenciamento centralizado de todas as tags</li>
            <li>Renomeação e exclusão de tags com propagação para todas as tarefas</li>
            <li>Cores personalizáveis para cada tag</li>
            <li>Filtros aprimorados por múltiplas tags</li>
          </ul>
          
          <h2>Próximos Passos</h2>
          <p>
            Continuamos trabalhando em mais melhorias:
          </p>
          <ul>
            <li>Sincronização com serviços de nuvem (Google Drive, Dropbox)</li>
            <li>Colaboração em tempo real para listas compartilhadas</li>
            <li>API completa para integração com outros serviços</li>
            <li>Mais temas e opções de personalização</li>
          </ul>
          
          <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h3 className="text-xl font-bold mb-3">Seu feedback é importante!</h3>
            <p className="mb-4">
              Adoraríamos ouvir sua opinião sobre essas melhorias e quais recursos você gostaria
              de ver no futuro. Envie suas sugestões e reporte problemas através do menu "Feedback"
              no aplicativo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/melhorias/novas-melhorias" className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition inline-block">
                Ver Próximas Melhorias
              </Link>
              <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition inline-block">
                Voltar ao NeoTask
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 