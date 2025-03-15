import { useEffect, useState, useRef, useCallback } from 'react';
import { Task, TaskFilter } from '../types';

// Hook para gerenciar o worker de processamento de tarefas
export function useTaskWorker() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Inicializa o worker
  useEffect(() => {
    // Verificar se estamos no navegador e se Web Workers são suportados
    if (typeof window !== 'undefined' && 'Worker' in window) {
      try {
        workerRef.current = new Worker(
          new URL('../workers/taskSorter.ts', import.meta.url)
        );

        // Configurar event listener para receber mensagens do worker
        workerRef.current.onmessage = (event) => {
          setLoading(false);
          if (event.data.success) {
            // Armazenar no cache se necessário
          } else {
            setError(event.data.error || 'Erro ao processar tarefas');
          }
        };

        workerRef.current.onerror = (e) => {
          setLoading(false);
          setError('Erro no worker: ' + e.message);
        };
      } catch (err) {
        console.error('Erro ao inicializar worker:', err);
        setError('Não foi possível inicializar o processador de tarefas');
      }
    }

    // Cleanup: encerrar o worker quando o componente for desmontado
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Função para enviar tarefas para o worker processar
  const processTasks = useCallback(
    async (tasks: Task[], filter: TaskFilter, action: 'filter' | 'sort' = 'filter'): Promise<Task[]> => {
      if (!workerRef.current) {
        // Fallback para processamento síncrono se o worker não estiver disponível
        console.warn('Worker não disponível, processando de forma síncrona');
        
        // Implementação básica síncrona
        const filtered = tasks.filter(task => {
          if (filter.status === 'pendentes' && task.completed) return false;
          if (filter.status === 'concluídas' && !task.completed) return false;
          if (filter.priority !== 'todas' && task.priority !== filter.priority) return false;
          if (filter.listId && filter.listId !== 'todas' && task.listId !== filter.listId) return false;
          return true;
        });
        
        return filtered;
      }

      setLoading(true);
      setError(null);

      return new Promise((resolve, reject) => {
        // Configurar um handler temporário para esta chamada específica
        const messageHandler = (e: MessageEvent) => {
          if (e.data.success) {
            resolve(e.data.tasks);
          } else {
            reject(new Error(e.data.error || 'Erro ao processar tarefas'));
          }
          
          // Remover este handler depois de receber a resposta
          if (workerRef.current) {
            workerRef.current.removeEventListener('message', messageHandler);
          }
        };

        // Adicionar o handler temporário
        if (workerRef.current) {
          workerRef.current.addEventListener('message', messageHandler);
          
          // Enviar as tarefas para processamento
          workerRef.current.postMessage({
            tasks,
            filter,
            action
          });
        } else {
          reject(new Error('Worker não está disponível'));
        }
      })
        .then((result) => {
          setLoading(false);
          return result as Task[];
        })
        .catch((err) => {
          setLoading(false);
          setError(err.message);
          console.error('Erro ao processar tarefas:', err);
          return []; // Retornar array vazio em caso de erro
        });
    },
    []
  );

  // Método para filtrar e ordenar tarefas
  const filterAndSortTasks = useCallback(
    (tasks: Task[], filter: TaskFilter): Promise<Task[]> => {
      return processTasks(tasks, filter);
    },
    [processTasks]
  );

  return {
    filterAndSortTasks,
    loading,
    error
  };
} 