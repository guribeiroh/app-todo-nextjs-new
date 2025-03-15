'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiBarChart2, FiClock, FiCalendar, FiFilter, FiCheckCircle, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { Task } from '../types';
import { useTaskContext } from '../context/TaskContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isWithinInterval, differenceInDays } from 'date-fns';
import { pt } from 'date-fns/locale';

type TimeRange = 'today' | 'week' | 'month' | 'all';
type InsightTab = 'summary' | 'completion' | 'productivity' | 'patterns';

interface ProductivityInsightsProps {
  onClose: () => void;
}

const ProductivityInsights: React.FC<ProductivityInsightsProps> = ({ onClose }) => {
  const { tasks, lists } = useTaskContext();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [activeTab, setActiveTab] = useState<InsightTab>('summary');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0,
    avgCompletionTimeHours: 0,
    mostProductiveDay: '',
    mostProductiveHour: 0,
    popularTags: [] as {tag: string, count: number}[],
    listDistribution: [] as {list: string, count: number, color: string}[],
    productivityTrend: 'stable' as 'improving' | 'declining' | 'stable',
  });

  // Filtrar tarefas com base no intervalo de tempo selecionado
  useEffect(() => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = startOfWeek(now, { locale: pt });
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Desde o início dos tempos
        break;
    }
    
    const filtered = tasks.filter(task => {
      const taskDate = task.createdAt instanceof Date 
        ? task.createdAt 
        : new Date(task.createdAt);
      
      return taskDate >= startDate;
    });
    
    setFilteredTasks(filtered);
    calculateStats(filtered);
  }, [timeRange, tasks]);

  // Calcular estatísticas com base nas tarefas filtradas
  const calculateStats = (filteredTasks: Task[]) => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(task => task.completed).length;
    const pending = total - completed;
    const now = new Date();
    const overdue = filteredTasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      
      const dueDate = task.dueDate instanceof Date 
        ? task.dueDate 
        : new Date(task.dueDate);
      
      return dueDate < now;
    }).length;
    
    // Taxa de conclusão
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Tempo médio de conclusão (em horas)
    const completedTasks = filteredTasks.filter(task => task.completed);
    let totalCompletionTime = 0;
    
    for (const task of completedTasks) {
      const createdAt = task.createdAt instanceof Date 
        ? task.createdAt 
        : new Date(task.createdAt);
      
      // Como não temos um campo completedAt, vamos estimar 
      // usando a diferença de dias ou um valor fixo
      const estimatedCompletionTime = task.dueDate 
        ? differenceInDays(new Date(task.dueDate), createdAt) * 24
        : 24; // Assume 24h se não houver data de conclusão
      
      totalCompletionTime += estimatedCompletionTime;
    }
    
    const avgCompletionTimeHours = completedTasks.length > 0 
      ? Math.round(totalCompletionTime / completedTasks.length) 
      : 0;
    
    // Dia mais produtivo (com mais tarefas concluídas)
    const dayCompletionMap: Record<string, number> = {};
    
    for (const task of completedTasks) {
      const createdAt = task.createdAt instanceof Date 
        ? task.createdAt 
        : new Date(task.createdAt);
      
      const dayKey = format(createdAt, 'EEEE', { locale: pt });
      dayCompletionMap[dayKey] = (dayCompletionMap[dayKey] || 0) + 1;
    }
    
    const mostProductiveDay = Object.entries(dayCompletionMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    
    // Hora mais produtiva
    const hourCompletionMap: Record<number, number> = {};
    
    for (const task of completedTasks) {
      const createdAt = task.createdAt instanceof Date 
        ? task.createdAt 
        : new Date(task.createdAt);
      
      const hour = createdAt.getHours();
      hourCompletionMap[hour] = (hourCompletionMap[hour] || 0) + 1;
    }
    
    let mostProductiveHour = 0;
    let maxCompletions = 0;
    
    for (const [hour, count] of Object.entries(hourCompletionMap)) {
      if (count > maxCompletions) {
        mostProductiveHour = parseInt(hour);
        maxCompletions = count;
      }
    }
    
    // Tags populares
    const tagCountMap: Record<string, number> = {};
    
    for (const task of filteredTasks) {
      for (const tag of task.tags || []) {
        tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
      }
    }
    
    const popularTags = Object.entries(tagCountMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Distribuição por lista
    const listCountMap: Record<string, number> = {};
    
    for (const task of filteredTasks) {
      listCountMap[task.listId] = (listCountMap[task.listId] || 0) + 1;
    }
    
    const listDistribution = Object.entries(listCountMap)
      .map(([listId, count]) => {
        const list = lists.find(l => l.id === listId);
        return {
          list: list ? list.name : 'Sem lista',
          count,
          color: list ? list.color : '#888888'
        };
      })
      .sort((a, b) => b.count - a.count);
    
    // Tendência de produtividade (simplificada)
    let productivityTrend: 'improving' | 'declining' | 'stable' = 'stable';
    
    if (completionRate > 70) {
      productivityTrend = 'improving';
    } else if (completionRate < 30) {
      productivityTrend = 'declining';
    }
    
    setTaskStats({
      total,
      completed,
      pending,
      overdue,
      completionRate,
      avgCompletionTimeHours,
      mostProductiveDay,
      mostProductiveHour,
      popularTags,
      listDistribution,
      productivityTrend,
    });
  };

  // Renderizar gráfico de distribuição de tarefas por status
  const renderStatusDistribution = () => {
    const { completed, pending, overdue } = taskStats;
    const total = completed + pending;
    
    if (total === 0) {
      return (
        <div className="flex justify-center items-center h-40 text-gray-400">
          Nenhuma tarefa no período selecionado
        </div>
      );
    }
    
    const completedPercent = Math.round((completed / total) * 100);
    const pendingPercent = Math.round((pending / total) * 100);
    const overduePercent = Math.round((overdue / total) * 100);
    
    return (
      <div className="mt-4">
        <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-green-500" 
            style={{ width: `${completedPercent}%` }}
            title={`${completed} tarefas concluídas (${completedPercent}%)`}
          />
          <div 
            className="h-full bg-blue-500" 
            style={{ width: `${pendingPercent}%` }}
            title={`${pending} tarefas pendentes (${pendingPercent}%)`}
          />
          <div 
            className="h-full bg-red-500" 
            style={{ width: `${overduePercent}%` }}
            title={`${overdue} tarefas atrasadas (${overduePercent}%)`}
          />
        </div>
        
        <div className="flex justify-between mt-2 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
            <span>Concluídas ({completedPercent}%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
            <span>Pendentes ({pendingPercent}%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
            <span>Atrasadas ({overduePercent}%)</span>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar gráfico de distribuição por listas
  const renderListDistribution = () => {
    if (taskStats.listDistribution.length === 0) {
      return (
        <div className="flex justify-center items-center h-40 text-gray-400">
          Nenhuma tarefa categorizada por lista
        </div>
      );
    }
    
    const total = taskStats.listDistribution.reduce((sum, item) => sum + item.count, 0);
    
    return (
      <div className="mt-4 space-y-2">
        {taskStats.listDistribution.map((item, index) => {
          const percent = Math.round((item.count / total) * 100);
          
          return (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: item.color }}>{item.list}</span>
                <span>{percent}% ({item.count})</span>
              </div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full" 
                  style={{ width: `${percent}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Renderizar estatísticas resumidas
  const renderSummaryTab = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Resumo de tarefas</h3>
          {renderStatusDistribution()}
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Distribuição por lista</h3>
          {renderListDistribution()}
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium mb-2">Estatísticas rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="text-gray-500 dark:text-gray-400 text-sm">Taxa de conclusão</div>
              <div className="text-2xl font-bold mt-1">
                {taskStats.completionRate}%
              </div>
            </div>
            <div className="text-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="text-gray-500 dark:text-gray-400 text-sm">Tempo médio</div>
              <div className="text-2xl font-bold mt-1">
                {taskStats.avgCompletionTimeHours}h
              </div>
            </div>
            <div className="text-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="text-gray-500 dark:text-gray-400 text-sm">Melhor dia</div>
              <div className="text-xl font-bold mt-1 capitalize">
                {taskStats.mostProductiveDay || "-"}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="text-gray-500 dark:text-gray-400 text-sm">Melhor horário</div>
              <div className="text-2xl font-bold mt-1">
                {taskStats.mostProductiveHour || 0}h
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Renderizar tendências de produtividade
  const renderProductivityTab = () => {
    const { productivityTrend } = taskStats;
    
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-3">Tendência de produtividade</h3>
          <div className="flex items-center justify-center p-6">
            {productivityTrend === 'improving' ? (
              <div className="flex flex-col items-center text-green-500">
                <FiTrendingUp size={64} />
                <div className="mt-2 text-lg font-medium">Melhorando</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                  Sua produtividade está aumentando! Continue com o bom trabalho.
                </p>
              </div>
            ) : productivityTrend === 'declining' ? (
              <div className="flex flex-col items-center text-red-500">
                <FiTrendingDown size={64} />
                <div className="mt-2 text-lg font-medium">Diminuindo</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                  Sua produtividade parece estar caindo. Considere ajustar sua abordagem.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-blue-500">
                <FiBarChart2 size={64} />
                <div className="mt-2 text-lg font-medium">Estável</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                  Sua produtividade está constante. Pense em estratégias para melhorar ainda mais.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-3">Tags mais usadas</h3>
          <div className="flex flex-wrap gap-2 mt-3">
            {taskStats.popularTags.length > 0 ? (
              taskStats.popularTags.map((tagItem, index) => (
                <div 
                  key={index}
                  className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm flex items-center"
                >
                  <span>{tagItem.tag}</span>
                  <span className="ml-2 bg-indigo-200 dark:bg-indigo-800 px-1.5 py-0.5 rounded-full text-xs">
                    {tagItem.count}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                Nenhuma tag utilizada ainda
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Renderizar padrões de conclusão de tarefas
  const renderPatternsTab = () => {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-3">Padrões de produtividade</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiClock className="inline-block mr-2" />
                Melhor horário para trabalhar
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Você tende a ser mais produtivo às <strong>{taskStats.mostProductiveHour}h</strong>. 
                Considere agendar suas tarefas mais importantes para este horário.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiCalendar className="inline-block mr-2" />
                Dia mais produtivo
              </h4>
              <p className="text-gray-600 dark:text-gray-400 capitalize">
                <strong>{taskStats.mostProductiveDay || "Nenhum padrão"}</strong> parece ser seu dia mais produtivo. 
                Reserve este dia para tarefas que exigem maior foco.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiCheckCircle className="inline-block mr-2" />
                Tempo médio para conclusão
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Você leva em média <strong>{taskStats.avgCompletionTimeHours} horas</strong> para concluir uma tarefa. 
                Use essa informação para planejar seu tempo com mais precisão.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-3">Dicas personalizadas</h3>
          
          <div className="space-y-3">
            {taskStats.completionRate < 50 && (
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg">
                Sua taxa de conclusão está abaixo de 50%. Tente dividir tarefas grandes em subtarefas menores para 
                facilitar o progresso.
              </div>
            )}
            
            {taskStats.overdue > 0 && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg">
                Você tem {taskStats.overdue} {taskStats.overdue === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}. 
                Considere reorganizar suas prioridades.
              </div>
            )}
            
            {taskStats.completionRate > 80 && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg">
                Ótimo trabalho! Sua taxa de conclusão está acima de 80%. Continue com o excelente ritmo!
              </div>
            )}
            
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg">
              Experimente usar o timer Pomodoro para aumentar seu foco e produtividade ao trabalhar em tarefas complexas.
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-100 dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <FiBarChart2 size={24} className="text-indigo-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Análise de Produtividade</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex justify-between items-center bg-white dark:bg-gray-800">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'summary' 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Resumo
            </button>
            <button
              onClick={() => setActiveTab('productivity')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'productivity' 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Tendências
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'patterns' 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Padrões
            </button>
          </div>
          
          <div className="flex items-center">
            <FiFilter size={18} className="text-gray-400 mr-2" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm py-1 pl-2 pr-8"
            >
              <option value="today">Hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
              <option value="all">Todo período</option>
            </select>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'summary' && renderSummaryTab()}
          {activeTab === 'productivity' && renderProductivityTab()}
          {activeTab === 'patterns' && renderPatternsTab()}
        </div>
      </motion.div>
    </div>
  );
};

export default ProductivityInsights; 