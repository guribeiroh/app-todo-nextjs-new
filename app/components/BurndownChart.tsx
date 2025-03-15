'use client';

import React, { useEffect, useState, useRef } from 'react';
import { FiXCircle, FiDownload, FiBarChart2, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useScrumContext } from '../context/ScrumContext';
import { format, differenceInDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import { BurndownData, Sprint } from '../types';
import { useToast } from './Toast';

// Importar Chart.js dinamicamente para evitar problemas de SSR
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Registrar os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Importar Line dinamicamente para evitar problemas de SSR
const Line = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Line),
  { ssr: false }
);

interface BurndownChartProps {
  sprintId: string;
  onClose: () => void;
}

const BurndownChart: React.FC<BurndownChartProps> = ({ sprintId, onClose }) => {
  const { 
    sprints, 
    scrumMetrics, 
    updateBurndownData, 
    getBurndownData 
  } = useScrumContext();
  
  const { showToast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  
  // Obter o sprint atual
  const sprint = sprints.find(s => s.id === sprintId);
  
  // Preparar dados para o gráfico quando o sprint ou métricas mudarem
  useEffect(() => {
    if (!sprint) return;
    
    setIsLoading(true);
    
    // Preparar os dados do gráfico
    prepareChartData(sprint);
    
    setIsLoading(false);
  }, [sprint, scrumMetrics, sprintId]);
  
  // Função para preparar os dados do gráfico
  const prepareChartData = (sprint: Sprint) => {
    if (!sprint) return;
    
    // Obter dados do burndown
    const burndownData = getBurndownData(sprint.id);
    
    // Obter intervalo de datas do sprint
    const sprintStart = new Date(sprint.startDate);
    const sprintEnd = new Date(sprint.endDate);
    
    // Determinar pontos totais do sprint (usando o primeiro registro ou 0)
    const totalPoints = burndownData.length > 0 
      ? burndownData[0].plannedPoints 
      : 0;
    
    // Gerar todas as datas do sprint
    const daysInterval = eachDayOfInterval({
      start: sprintStart,
      end: sprintEnd
    });
    
    // Preparar dados para a linha ideal (queda constante até 0)
    const idealLine = daysInterval.map((date, index) => {
      const totalDays = daysInterval.length - 1; // -1 porque começamos em 0
      const idealPointsRemaining = totalPoints * (1 - index / totalDays);
      return Math.round(idealPointsRemaining * 10) / 10;
    });
    
    // Preparar dados para a linha real
    const actualRemainingPoints: number[] = [];
    const actualCompletedPoints: number[] = [];
    
    daysInterval.forEach(date => {
      const dateStr = startOfDay(date).toISOString();
      
      // Encontrar dados para esta data
      const dayData = burndownData.find(bd => 
        startOfDay(new Date(bd.date)).toISOString() === dateStr
      );
      
      // Se temos dados para esta data, use-os. Caso contrário, use o último valor conhecido
      if (dayData) {
        actualRemainingPoints.push(dayData.remainingPoints);
        actualCompletedPoints.push(dayData.completedPoints);
      } else {
        // Se não tiver dados para esta data e for uma data futura, use null (para não desenhar)
        const isDateInFuture = date > new Date();
        
        if (isDateInFuture) {
          actualRemainingPoints.push(NaN); // NaN não será desenhado
          actualCompletedPoints.push(NaN);
        } else {
          // Se for uma data passada sem dados, use o valor anterior ou inicial
          const lastKnownIndex = actualRemainingPoints.length - 1;
          const lastRemaining = lastKnownIndex >= 0 
            ? actualRemainingPoints[lastKnownIndex] 
            : totalPoints;
          const lastCompleted = lastKnownIndex >= 0 
            ? actualCompletedPoints[lastKnownIndex] 
            : 0;
          
          actualRemainingPoints.push(lastRemaining);
          actualCompletedPoints.push(lastCompleted);
        }
      }
    });
    
    // Formatação de datas para exibição
    const dateLabels = daysInterval.map(date => 
      format(date, 'dd/MM', { locale: ptBR })
    );
    
    // Configurar opções do gráfico
    const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Pontos',
            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary')
          }
        },
        x: {
          title: {
            display: true,
            text: 'Dias do Sprint',
            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary')
          }
        }
      },
      plugins: {
        legend: {
          position: 'top' as const
        },
        title: {
          display: true,
          text: `Burndown do Sprint - ${sprint.name}`,
          color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary')
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      }
    };
    
    // Criar dados do gráfico
    const data = {
      labels: dateLabels,
      datasets: [
        {
          label: 'Linha Ideal',
          data: idealLine,
          borderColor: 'rgba(255, 99, 132, 0.8)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          borderDash: [5, 5],
          tension: 0.1,
          fill: false
        },
        {
          label: 'Pontos Restantes',
          data: actualRemainingPoints,
          borderColor: 'rgba(75, 192, 192, 0.8)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'Pontos Concluídos',
          data: actualCompletedPoints,
          borderColor: 'rgba(54, 162, 235, 0.8)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          tension: 0.1,
          fill: false
        }
      ]
    };
    
    setChartData({ data, options });
  };
  
  // Função para atualizar os dados do burndown
  const handleUpdateBurndown = async () => {
    try {
      setIsLoading(true);
      await updateBurndownData(sprintId);
      showToast('Dados do burndown atualizados com sucesso', 'success');
      
      // Atualizar o gráfico
      if (sprint) {
        prepareChartData(sprint);
      }
    } catch (error) {
      showToast('Erro ao atualizar dados do burndown', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para baixar o gráfico como imagem
  const handleDownloadChart = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `burndown-${sprint?.name.replace(/\s+/g, '-').toLowerCase() || 'sprint'}.png`;
    link.href = image;
    link.click();
  };
  
  // Se não houver sprint, mostrar mensagem
  if (!sprint) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl p-6"
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center p-8">
            <FiBarChart2 size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Sprint não encontrado</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Não foi possível encontrar o sprint selecionado.
            </p>
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold flex items-center">
            <FiBarChart2 className="mr-2 text-indigo-500" size={20} />
            Gráfico Burndown - {sprint.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiXCircle size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Período: {format(new Date(sprint.startDate), 'dd/MM/yyyy', { locale: ptBR })} a {format(new Date(sprint.endDate), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
              
              {sprint.goal && (
                <p className="text-sm mt-1">
                  <span className="font-medium">Meta:</span> {sprint.goal}
                </p>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleUpdateBurndown}
                disabled={isLoading}
                className="btn-outline flex items-center text-sm"
              >
                <FiRefreshCw className="mr-1" size={14} />
                Atualizar
              </button>
              
              <button
                onClick={handleDownloadChart}
                disabled={isLoading || !chartData}
                className="btn-outline flex items-center text-sm"
              >
                <FiDownload className="mr-1" size={14} />
                Baixar PNG
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="h-[400px]">
              {isLoading && !chartData ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : chartData ? (
                <Line data={chartData.data} options={chartData.options} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Não há dados de burndown disponíveis para este sprint.
                  </p>
                  <button
                    onClick={handleUpdateBurndown}
                    className="btn-primary"
                  >
                    Gerar Dados Iniciais
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {chartData && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-medium mb-2">Métricas do Sprint</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Pontos Totais:</span>
                    <span className="text-sm font-medium">
                      {scrumMetrics[sprintId]?.totalPoints || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Pontos Concluídos:</span>
                    <span className="text-sm font-medium">
                      {scrumMetrics[sprintId]?.completedPoints || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Progresso:</span>
                    <span className="text-sm font-medium">
                      {scrumMetrics[sprintId]?.totalPoints 
                        ? Math.round((scrumMetrics[sprintId]?.completedPoints || 0) / scrumMetrics[sprintId]?.totalPoints * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-medium mb-2">Histórias</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total:</span>
                    <span className="text-sm font-medium">
                      {scrumMetrics[sprintId]?.totalStories || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Concluídas:</span>
                    <span className="text-sm font-medium">
                      {scrumMetrics[sprintId]?.completedStories || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Progresso:</span>
                    <span className="text-sm font-medium">
                      {scrumMetrics[sprintId]?.totalStories 
                        ? Math.round((scrumMetrics[sprintId]?.completedStories || 0) / scrumMetrics[sprintId]?.totalStories * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-medium mb-2">Tempo</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Duração Total:</span>
                    <span className="text-sm font-medium">
                      {differenceInDays(new Date(sprint.endDate), new Date(sprint.startDate)) + 1} dias
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Dias Passados:</span>
                    <span className="text-sm font-medium">
                      {Math.min(
                        differenceInDays(new Date(), new Date(sprint.startDate)) + 1,
                        differenceInDays(new Date(sprint.endDate), new Date(sprint.startDate)) + 1
                      )} dias
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Dias Restantes:</span>
                    <span className="text-sm font-medium">
                      {Math.max(0, differenceInDays(new Date(sprint.endDate), new Date()))} dias
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BurndownChart; 