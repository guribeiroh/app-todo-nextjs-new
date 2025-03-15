'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FiBarChart2, 
  FiPieChart, 
  FiTrendingUp, 
  FiCalendar, 
  FiClock, 
  FiCheckSquare,
  FiAlertCircle,
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiUsers
} from 'react-icons/fi';
import { format, differenceInCalendarDays, isAfter, isBefore, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useScrumContext } from '../context/ScrumContext';
import { Sprint, UserStory } from '../types';
import { useToast } from './Toast';

interface ReportsManagerProps {
  onClose?: () => void;
}

interface SprintMetric {
  sprintId: string;
  sprintName: string;
  totalStories: number;
  completedStories: number;
  totalPoints: number;
  completedPoints: number;
  startDate: Date;
  endDate: Date;
  completionRate: number;
  velocityPoints: number;
  averagePointsPerStory: number;
  isActive: boolean;
  status: string;
}

const ReportsManager: React.FC<ReportsManagerProps> = ({ onClose }) => {
  const { sprints, userStories, scrumMetrics } = useScrumContext();
  const { showToast } = useToast();
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 'lastThree' | 'lastSix'>('all');
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  
  // Calcular métricas para cada sprint
  const sprintMetrics = useMemo(() => {
    const metrics: SprintMetric[] = [];
    
    for (const sprint of sprints) {
      // Filtrar histórias deste sprint
      const sprintStories = userStories.filter(story => story.sprintId === sprint.id);
      
      // Contar histórias e pontos
      const totalStories = sprintStories.length;
      const completedStories = sprintStories.filter(story => story.status === 'done').length;
      const totalPoints = sprintStories.reduce((sum, story) => sum + (story.storyPoints || 0), 0);
      const completedPoints = sprintStories
        .filter(story => story.status === 'done')
        .reduce((sum, story) => sum + (story.storyPoints || 0), 0);
      
      // Calcular métricas derivadas
      const completionRate = totalStories > 0 ? (completedStories / totalStories) * 100 : 0;
      const velocityPoints = sprint.status === 'completed' ? completedPoints : 0;
      const averagePointsPerStory = totalStories > 0 ? totalPoints / totalStories : 0;
      
      metrics.push({
        sprintId: sprint.id,
        sprintName: sprint.name,
        totalStories,
        completedStories,
        totalPoints,
        completedPoints,
        startDate: new Date(sprint.startDate),
        endDate: new Date(sprint.endDate),
        completionRate,
        velocityPoints,
        averagePointsPerStory,
        isActive: sprint.isActive,
        status: sprint.status
      });
    }
    
    // Ordenar do mais recente para o mais antigo
    return metrics.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }, [sprints, userStories]);
  
  // Filtrar métricas por período de tempo
  const filteredMetrics = useMemo(() => {
    if (selectedTimeRange === 'all') {
      return sprintMetrics;
    }
    
    const today = new Date();
    const monthsToSubtract = selectedTimeRange === 'lastThree' ? 3 : 6;
    const cutoffDate = new Date(today);
    cutoffDate.setMonth(today.getMonth() - monthsToSubtract);
    
    return sprintMetrics.filter(metric => isAfter(metric.endDate, cutoffDate));
  }, [sprintMetrics, selectedTimeRange]);
  
  // Calcular velocidade média da equipe (apenas sprints concluídos)
  const averageVelocity = useMemo(() => {
    const completedSprints = filteredMetrics.filter(metric => metric.status === 'completed');
    if (completedSprints.length === 0) return 0;
    
    const totalVelocity = completedSprints.reduce((sum, metric) => sum + metric.velocityPoints, 0);
    return totalVelocity / completedSprints.length;
  }, [filteredMetrics]);
  
  // Calcular a taxa de sucesso de sprints (% de histórias completadas)
  const sprintSuccessRate = useMemo(() => {
    const completedSprints = filteredMetrics.filter(metric => metric.status === 'completed');
    if (completedSprints.length === 0) return 0;
    
    const totalCompletionRate = completedSprints.reduce((sum, metric) => sum + metric.completionRate, 0);
    return totalCompletionRate / completedSprints.length;
  }, [filteredMetrics]);
  
  // Obter métricas do sprint selecionado
  const selectedSprintMetrics = useMemo(() => {
    if (!selectedSprintId) return null;
    return filteredMetrics.find(metric => metric.sprintId === selectedSprintId) || null;
  }, [selectedSprintId, filteredMetrics]);
  
  // Métricas por prioridade
  const priorityMetrics = useMemo(() => {
    const metrics = {
      must: { total: 0, completed: 0, points: 0, completedPoints: 0 },
      should: { total: 0, completed: 0, points: 0, completedPoints: 0 },
      could: { total: 0, completed: 0, points: 0, completedPoints: 0 },
      wont: { total: 0, completed: 0, points: 0, completedPoints: 0 }
    };
    
    // Se um sprint está selecionado, filtrar para histórias daquele sprint
    const storiesToAnalyze = selectedSprintId 
      ? userStories.filter(story => story.sprintId === selectedSprintId)
      : userStories;
    
    for (const story of storiesToAnalyze) {
      const priority = story.priority as keyof typeof metrics;
      if (metrics[priority]) {
        metrics[priority].total += 1;
        metrics[priority].points += story.storyPoints || 0;
        
        if (story.status === 'done') {
          metrics[priority].completed += 1;
          metrics[priority].completedPoints += story.storyPoints || 0;
        }
      }
    }
    
    return metrics;
  }, [userStories, selectedSprintId]);
  
  // Formatar número para exibição
  const formatNumber = (num: number) => {
    return num.toFixed(1).replace(/\.0$/, '');
  };
  
  // Função para gerar CSV de métricas de sprint
  const generateSprintMetricsCSV = () => {
    const headers = [
      'Sprint', 
      'Status', 
      'Data Início', 
      'Data Término', 
      'Total Histórias', 
      'Histórias Concluídas', 
      'Total Pontos', 
      'Pontos Concluídos', 
      'Taxa de Conclusão (%)', 
      'Velocidade (pontos)'
    ].join(',');
    
    const rows = filteredMetrics.map(metric => [
      `"${metric.sprintName}"`,
      `"${metric.status}"`,
      format(metric.startDate, 'dd/MM/yyyy'),
      format(metric.endDate, 'dd/MM/yyyy'),
      metric.totalStories,
      metric.completedStories,
      metric.totalPoints,
      metric.completedPoints,
      formatNumber(metric.completionRate),
      formatNumber(metric.velocityPoints)
    ].join(','));
    
    return [headers, ...rows].join('\n');
  };
  
  // Função para baixar CSV
  const downloadCSV = () => {
    const csv = generateSprintMetricsCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `metricas_sprint_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Relatório baixado com sucesso', 'success');
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <FiBarChart2 className="mr-2 text-indigo-500" />
            Relatórios e Métricas
          </h2>
          
          <div className="flex space-x-2 mt-2 md:mt-0">
            <button
              onClick={downloadCSV}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md flex items-center text-sm"
              title="Exportar dados para CSV"
            >
              <FiDownload className="mr-1" size={16} />
              Exportar CSV
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todos os períodos</option>
              <option value="lastThree">Últimos 3 meses</option>
              <option value="lastSix">Últimos 6 meses</option>
            </select>
          </div>
          
          <div>
            <select
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos os Sprints</option>
              {filteredMetrics.map(metric => (
                <option key={metric.sprintId} value={metric.sprintId}>
                  {metric.sprintName} {metric.isActive ? '(Ativo)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4">
        {filteredMetrics.length > 0 ? (
          <div className="space-y-6">
            {/* Cartões de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                  <FiTrendingUp className="mr-1 text-indigo-500" size={16} />
                  Velocidade Média da Equipe
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(averageVelocity)} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">pontos/sprint</span>
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                  <FiCheckSquare className="mr-1 text-green-500" size={16} />
                  Taxa de Sucesso dos Sprints
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(sprintSuccessRate)}% <span className="text-sm font-normal text-gray-500 dark:text-gray-400">conclusão</span>
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                  <FiUsers className="mr-1 text-blue-500" size={16} />
                  Total de Sprints Analisados
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredMetrics.length} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">sprints</span>
                </p>
              </div>
            </div>
            
            {/* Métricas por prioridade */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium flex items-center">
                  <FiPieChart className="mr-2 text-purple-500" size={16} />
                  Distribuição por Prioridade
                </h3>
              </div>
              
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Prioridade
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Histórias
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Concluídas
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Pontos Totais
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          % Conclusão
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {Object.entries(priorityMetrics).map(([priority, data]) => {
                        const priorityLabel = {
                          must: 'Must Have',
                          should: 'Should Have',
                          could: 'Could Have',
                          wont: "Won't Have"
                        }[priority] || priority;
                        
                        const priorityColor = {
                          must: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
                          should: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
                          could: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                          wont: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }[priority] || '';
                        
                        const completionRate = data.total > 0 
                          ? (data.completed / data.total) * 100 
                          : 0;
                        
                        return (
                          <tr key={priority}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${priorityColor}`}>
                                {priorityLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                              {data.total}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                              {data.completed} <span className="text-xs text-gray-500">({formatNumber(completionRate)}%)</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                              {data.points} pts
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div 
                                  className="bg-indigo-600 h-2.5 rounded-full" 
                                  style={{ width: `${Math.min(completionRate, 100)}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Tabela de métricas por sprint */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium flex items-center">
                  <FiCalendar className="mr-2 text-indigo-500" size={16} />
                  Métricas por Sprint
                </h3>
              </div>
              
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Sprint
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Histórias
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Pontos
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Velocidade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredMetrics.map(metric => {
                        const statusLabel = {
                          planning: 'Planejamento',
                          active: 'Em Andamento',
                          review: 'Em Revisão',
                          completed: 'Concluído'
                        }[metric.status] || metric.status;
                        
                        const statusColor = {
                          planning: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                          active: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
                          review: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                          completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }[metric.status] || '';
                        
                        return (
                          <tr key={metric.sprintId} className={
                            selectedSprintId === metric.sprintId ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''
                          }>
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {metric.sprintName}
                                  {metric.isActive && (
                                    <span className="ml-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full">
                                      Ativo
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {format(metric.startDate, 'dd/MM/yyyy', { locale: ptBR })} - {format(metric.endDate, 'dd/MM/yyyy', { locale: ptBR })}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {metric.completedStories}/{metric.totalStories}
                              </div>
                              <div className="w-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-indigo-600 h-1.5 rounded-full" 
                                  style={{ width: `${Math.min(metric.completionRate, 100)}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                              {metric.completedPoints}/{metric.totalPoints} pts
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              {metric.status === 'completed' ? (
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatNumber(metric.velocityPoints)} pts
                                </span>
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Em andamento
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <FiAlertCircle size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nenhum dado disponível
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Complete pelo menos um sprint para ver estatísticas e relatórios.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsManager; 