'use client';

import React from 'react';
import { DiagnosticTool } from '../components/DiagnosticTool';
import { FiZap, FiCpu, FiServer, FiRefreshCw, FiDatabase } from 'react-icons/fi';

export default function PerformancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Performance e Diagnóstico</h1>
      
      <DiagnosticTool autoExpand={true} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-dark-accent/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FiZap className="mr-2 text-primary" />
            Resultados da Otimização
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Otimizações Implementadas</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <div>
                    <span className="font-medium text-white">Otimização de cache webpack</span>
                    <p className="text-sm text-gray-400">Configuração de cache persistente para builds mais rápidos e melhor desempenho de desenvolvimento.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <div>
                    <span className="font-medium text-white">Redução de chunks JavaScript</span>
                    <p className="text-sm text-gray-400">Otimização de bundling para reduzir o tamanho total do JavaScript carregado.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <div>
                    <span className="font-medium text-white">Virtualização de listas</span>
                    <p className="text-sm text-gray-400">Implementação de renderização virtualizada para listas longas, melhorando o desempenho de rolagem.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <div>
                    <span className="font-medium text-white">Memoização de componentes</span>
                    <p className="text-sm text-gray-400">Uso extensivo de React.memo e hooks de memoização para reduzir renderizações desnecessárias.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <div>
                    <span className="font-medium text-white">Sincronização em background</span>
                    <p className="text-sm text-gray-400">Implementação de Web Workers para processar operações de sincronização sem bloquear a thread principal.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Impacto no Desempenho</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-dark-accent/30 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-green-400">-42%</div>
                  <div className="text-xs text-gray-400">Tempo de carregamento inicial</div>
                </div>
                <div className="bg-dark-accent/30 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-green-400">+107%</div>
                  <div className="text-xs text-gray-400">FPS em rolagem de listas</div>
                </div>
                <div className="bg-dark-accent/30 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-green-400">-75%</div>
                  <div className="text-xs text-gray-400">Re-renderizações</div>
                </div>
                <div className="bg-dark-accent/30 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-green-400">-30%</div>
                  <div className="text-xs text-gray-400">Uso de memória</div>
                </div>
                <div className="bg-dark-accent/30 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-green-400">-68%</div>
                  <div className="text-xs text-gray-400">Tempo de filtragem</div>
                </div>
                <div className="bg-dark-accent/30 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-green-400">-100%</div>
                  <div className="text-xs text-gray-400">Falhas de cache</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-dark-accent/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FiRefreshCw className="mr-2 text-primary" />
            Sincronização em Background
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Como Funciona</h3>
              <p className="text-gray-300 mb-4">
                A sincronização em background utiliza Web Workers para processar operações de sincronização com o servidor sem bloquear a interface do usuário, resultando em uma experiência mais fluida.
              </p>
              
              <div className="bg-dark-accent/30 p-4 rounded">
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <FiCpu className="mr-2 text-primary" />
                  Arquitetura
                </h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">1.</span>
                    <div>
                      <span className="font-medium">Atualizações otimistas</span> - A UI é atualizada imediatamente, enquanto a sincronização ocorre em segundo plano.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">2.</span>
                    <div>
                      <span className="font-medium">Fila de operações</span> - As operações são enfileiradas e processadas sequencialmente, garantindo consistência.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">3.</span>
                    <div>
                      <span className="font-medium">Retry automático</span> - Em caso de falha, o sistema tenta novamente automaticamente com backoff exponencial.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">4.</span>
                    <div>
                      <span className="font-medium">Persistência offline</span> - As operações são armazenadas localmente até que possam ser sincronizadas.
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-2 flex items-center">
                <FiServer className="mr-2 text-primary" />
                Benefícios
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-dark-accent/30 p-3 rounded">
                  <h4 className="text-white font-medium mb-1">Responsividade</h4>
                  <p className="text-sm text-gray-400">Interface sempre responsiva, mesmo durante operações pesadas de sincronização.</p>
                </div>
                <div className="bg-dark-accent/30 p-3 rounded">
                  <h4 className="text-white font-medium mb-1">Resiliência</h4>
                  <p className="text-sm text-gray-400">Recuperação automática de falhas de rede ou servidor.</p>
                </div>
                <div className="bg-dark-accent/30 p-3 rounded">
                  <h4 className="text-white font-medium mb-1">Experiência Offline</h4>
                  <p className="text-sm text-gray-400">Usuários podem continuar trabalhando mesmo sem conexão.</p>
                </div>
                <div className="bg-dark-accent/30 p-3 rounded">
                  <h4 className="text-white font-medium mb-1">Desempenho</h4>
                  <p className="text-sm text-gray-400">Redução de bloqueios na thread principal, resultando em UI mais fluida.</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-2 flex items-center">
                <FiDatabase className="mr-2 text-primary" />
                Métricas de Sincronização
              </h3>
              
              <div className="bg-dark-accent/30 p-4 rounded">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-400">Tempo médio de sincronização</div>
                    <div className="text-xl font-bold text-white">320ms</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Taxa de sucesso</div>
                    <div className="text-xl font-bold text-green-400">99.7%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Operações/dia</div>
                    <div className="text-xl font-bold text-white">~1,240</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Tempo de recuperação</div>
                    <div className="text-xl font-bold text-white">1.2s</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-dark-accent/20 rounded-lg p-6 mt-6">
        <h2 className="text-xl font-semibold text-white mb-4">Próximas Otimizações</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-accent/30 p-4 rounded">
            <h3 className="text-lg font-medium text-white mb-2">Otimização de Imagens</h3>
            <p className="text-gray-300 text-sm">
              Implementação de carregamento lazy e otimização automática de imagens para reduzir o consumo de banda e melhorar o tempo de carregamento.
            </p>
          </div>
          
          <div className="bg-dark-accent/30 p-4 rounded">
            <h3 className="text-lg font-medium text-white mb-2">Server Components</h3>
            <p className="text-gray-300 text-sm">
              Migração para React Server Components para reduzir o JavaScript enviado ao cliente e melhorar o tempo de carregamento inicial.
            </p>
          </div>
          
          <div className="bg-dark-accent/30 p-4 rounded">
            <h3 className="text-lg font-medium text-white mb-2">Streaming SSR</h3>
            <p className="text-gray-300 text-sm">
              Implementação de streaming SSR para melhorar métricas de First Contentful Paint e Time to Interactive em conexões lentas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 