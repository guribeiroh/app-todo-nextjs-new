"use client";

import React from 'react';
import Link from 'next/link';
import { FiRefreshCw, FiZap, FiShield, FiUserPlus, FiGlobe, FiTrendingUp, FiSmartphone, FiHeart } from 'react-icons/fi';

export default function NovasMelhorias() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Próximas Melhorias do NeoTask</h1>
          <Link href="/" className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition shadow-lg">
            Voltar ao App
          </Link>
        </div>
        
        <div className="prose dark:prose-invert prose-lg max-w-none">
          <p className="lead text-xl border-l-4 border-indigo-500 pl-4 italic">
            Estamos comprometidos em transformar o NeoTask no gerenciador de tarefas mais completo e intuitivo disponível.
            Confira as novas funcionalidades que estamos preparando para você!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition duration-300">
              <div className="flex items-center mb-4">
                <FiZap className="text-yellow-500 text-2xl mr-3" />
                <h2 className="text-xl font-bold mb-0">Modo Turbo</h2>
              </div>
              <p>Implementamos uma nova arquitetura de alto desempenho que torna tudo instantâneo:</p>
              <ul>
                <li>Carregamento inicial 90% mais rápido</li>
                <li>Renderização otimizada de longas listas de tarefas</li>
                <li>Animações fluidas mesmo em dispositivos de entrada</li>
                <li>Redução significativa do consumo de bateria</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition duration-300">
              <div className="flex items-center mb-4">
                <FiSmartphone className="text-green-500 text-2xl mr-3" />
                <h2 className="text-xl font-bold mb-0">Notificações Avançadas</h2>
              </div>
              <p>Sistema completo de notificações em todos os dispositivos:</p>
              <ul>
                <li>Notificações push em dispositivos móveis e desktop</li>
                <li>Lembretes escalonáveis (15min, 1h, 4h antes)</li>
                <li>Notificações mesmo quando o app está fechado</li>
                <li>Resumos diários e semanais personalizáveis</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition duration-300">
              <div className="flex items-center mb-4">
                <FiGlobe className="text-blue-500 text-2xl mr-3" />
                <h2 className="text-xl font-bold mb-0">Sincronização Universal</h2>
              </div>
              <p>Acesse seus dados em qualquer lugar, a qualquer momento:</p>
              <ul>
                <li>Sincronização com Google Tasks, Microsoft To-Do e Apple Reminders</li>
                <li>Integração bidirecional com Trello, Asana e Notion</li>
                <li>Sincronização com calendários (Google, Outlook, Apple)</li>
                <li>API pública para desenvolvedores criarem integrações</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition duration-300">
              <div className="flex items-center mb-4">
                <FiUserPlus className="text-purple-500 text-2xl mr-3" />
                <h2 className="text-xl font-bold mb-0">Colaboração em Tempo Real</h2>
              </div>
              <p>Trabalhe em equipe sem complicações:</p>
              <ul>
                <li>Compartilhamento de listas com permissões granulares</li>
                <li>Comentários e menções em tarefas específicas</li>
                <li>Atribuição de tarefas para membros da equipe</li>
                <li>Histórico completo de alterações e atividades</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition duration-300">
              <div className="flex items-center mb-4">
                <FiShield className="text-red-500 text-2xl mr-3" />
                <h2 className="text-xl font-bold mb-0">Segurança Avançada</h2>
              </div>
              <p>Proteção total para seus dados importantes:</p>
              <ul>
                <li>Criptografia de ponta a ponta para todas as informações</li>
                <li>Autenticação biométrica (FaceID, Touch ID)</li>
                <li>Bloqueio de listas específicas com senha</li>
                <li>Controle de acesso baseado em funções para equipes</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition duration-300">
              <div className="flex items-center mb-4">
                <FiTrendingUp className="text-orange-500 text-2xl mr-3" />
                <h2 className="text-xl font-bold mb-0">Análises Inteligentes</h2>
              </div>
              <p>Insights poderosos sobre sua produtividade:</p>
              <ul>
                <li>Painel personalizado com métricas de produtividade</li>
                <li>Previsões baseadas em IA sobre conclusão de tarefas</li>
                <li>Análise detalhada de tempo gasto por categoria</li>
                <li>Recomendações para otimização do fluxo de trabalho</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-10 mb-10">
            <h2 className="flex items-center text-2xl font-bold">
              <FiHeart className="text-pink-500 mr-2" /> 
              Recursos Personalizados
            </h2>
            <p>
              Além das melhorias gerais, estamos adicionando recursos solicitados pela comunidade:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <h3 className="font-bold">Temas Personalizáveis</h3>
                <p className="text-sm">Crie seu próprio tema com cores e fontes totalmente customizáveis</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <h3 className="font-bold">Fluxos de Trabalho</h3>
                <p className="text-sm">Automatize sequências de tarefas com nosso sistema de automação</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <h3 className="font-bold">Modelos Avançados</h3>
                <p className="text-sm">Crie modelos complexos com subtarefas e datas relativas</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <h3 className="font-bold">Campos Personalizados</h3>
                <p className="text-sm">Adicione campos únicos como orçamento, links ou avaliações às tarefas</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <h3 className="font-bold">Comandos de Voz</h3>
                <p className="text-sm">Adicione tarefas e atribua prioridades usando comandos de voz</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <h3 className="font-bold">Áreas de Foco</h3>
                <p className="text-sm">Agrupe listas e projetos relacionados em áreas temáticas</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-8 rounded-xl shadow-xl mt-12">
            <h2 className="text-2xl font-bold mb-4">Participe da Evolução do NeoTask</h2>
            <p className="mb-6">
              Queremos desenvolver o NeoTask junto com você! Compartilhe suas ideias, vote em funcionalidades propostas
              e participe de nosso programa de testes antecipados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/feedback" 
                className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-medium hover:bg-indigo-50 transition shadow-lg text-center"
              >
                Enviar Sugestão
              </Link>
              <Link 
                href="/" 
                className="bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-800 transition shadow-lg text-center"
              >
                Voltar ao NeoTask
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 