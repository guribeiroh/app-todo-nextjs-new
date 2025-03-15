import React, { useMemo, memo, useCallback } from 'react';
import { FiCalendar, FiBell, FiTrendingUp, FiStar, FiCheckCircle, FiActivity, FiAlertCircle, FiClock, FiBarChart2, FiTarget, FiMoon, FiSun, FiList, FiTag } from 'react-icons/fi';
import { useTaskContext } from '../context/TaskContext';
import { Task } from '../types';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  description?: string;
  color: string;
}

// Memoizado o componente StatCard para evitar re-renderizações desnecessárias
const StatCard: React.FC<StatCardProps> = memo(({ title, value, icon, description, color }) => {
  return (
    <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md ${color ? `border-l-4 ${color}` : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">
            {title}
          </h3>
          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
            {value}
          </p>
          {description && (
            <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export interface DashboardProps {
  onClose: () => void;
}

// Utilizando React.memo para o componente principal
export const Dashboard: React.FC<DashboardProps> = memo(({ onClose }) => {
  const { tasks, lists, filteredTasks } = useTaskContext();
  
  // Calcular estatísticas com useMemo para evitar recálculos desnecessários
  const stats = useMemo(() => {
    // Tarefas completadas por dia da semana
    const completedByDayOfWeek = Array(7).fill(0);
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Tarefas por prioridade
    const byPriority = {
      alta: 0,
      média: 0,
      baixa: 0
    };
    
    // Tempos de conclusão
    const completionTimes: number[] = [];
    
    // Horário mais produtivo
    const completionByHour = Array(24).fill(0);
    let mostProductiveHour = 0;
    
    // Streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let lastCompletionDate: Date | null = null;
    
    // Tarefas por tag
    const byTag: Record<string, number> = {};
    
    // Tarefas por lista
    const byList: Record<string, number> = {};
    
    // Processa cada tarefa
    tasks.forEach(task => {
      // Contagem por prioridade
      if (task.priority) {
        byPriority[task.priority as keyof typeof byPriority]++;
      }
      
      // Contagem por lista
      if (task.listId) {
        byList[task.listId] = (byList[task.listId] || 0) + 1;
      }
      
      // Contagem por tags
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tag => {
          byTag[tag] = (byTag[tag] || 0) + 1;
        });
      }
      
      // Análise de tarefas concluídas
      if (task.completed && task.updatedAt) {
        const completionDate = new Date(task.updatedAt);
        
        // Dia da semana
        const dayOfWeek = completionDate.getDay();
        completedByDayOfWeek[dayOfWeek]++;
        
        // Hora do dia
        const hour = completionDate.getHours();
        completionByHour[hour]++;
        
        // Calcular tempo de conclusão se houver data de criação
        if (task.createdAt) {
          const creationDate = new Date(task.createdAt);
          const timeToComplete = completionDate.getTime() - creationDate.getTime();
          completionTimes.push(timeToComplete);
        }
        
        // Calcular streak
        if (lastCompletionDate) {
          const prevDate = new Date(lastCompletionDate);
          prevDate.setHours(0, 0, 0, 0);
          
          const currDate = new Date(completionDate);
          currDate.setHours(0, 0, 0, 0);
          
          // Verificar se é o dia seguinte
          const nextDay = new Date(prevDate);
          nextDay.setDate(nextDay.getDate() + 1);
          
          if (currDate.getTime() === nextDay.getTime()) {
            currentStreak++;
          } else if (currDate.getTime() > nextDay.getTime()) {
            // Se pulou um dia, reinicia o streak
            if (currentStreak > longestStreak) {
              longestStreak = currentStreak;
            }
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }
        
        lastCompletionDate = completionDate;
      }
    });
    
    // Encontrar a hora mais produtiva
    let maxCompletions = 0;
    completionByHour.forEach((count, hour) => {
      if (count > maxCompletions) {
        maxCompletions = count;
        mostProductiveHour = hour;
      }
    });
    
    // Atualizar o streak mais longo se o atual for maior
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
    
    // Calcular tempo médio de conclusão
    let avgCompletionTime = 0;
    if (completionTimes.length > 0) {
      avgCompletionTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
    }
    
    // Dias com mais produtividade
    const mostProductiveDays = [...completedByDayOfWeek]
      .map((count, index) => ({ day: dayNames[index], count }))
      .sort((a, b) => b.count - a.count);
    
    // Porcentagem de tarefas concluídas
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Tarefas atrasadas
    const overdueTasks = tasks.filter(task => {
      if (!task.completed && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(23, 59, 59, 999);
        return dueDate < new Date();
      }
      return false;
    }).length;
    
    return {
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      overdueTasks,
      completionRate,
      completedByDayOfWeek,
      dayNames,
      byPriority,
      avgCompletionTime,
      mostProductiveHour,
      currentStreak,
      longestStreak,
      mostProductiveDays,
      byTag,
      byList
    };
  }, [tasks]); // Dependência apenas de tasks
  
  // Memoizando funções de formatação
  const formatTime = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else {
      return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
  }, []);
  
  // Calcular tarefas próximas do vencimento (na próxima semana)
  const upcomingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return tasks.filter(task => {
      if (!task.completed && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= nextWeek;
      }
      return false;
    }).sort((a, b) => {
      const dateA = new Date(a.dueDate!);
      const dateB = new Date(b.dueDate!);
      return dateA.getTime() - dateB.getTime();
    });
  }, [tasks]);
  
  // Encontrar tags mais usadas - memoizado
  const topTags = useMemo(() => {
    return Object.entries(stats.byTag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [stats.byTag]);
  
  // Encontrar as listas com mais tarefas - memoizado
  const topLists = useMemo(() => {
    return Object.entries(stats.byList)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([listId, count]) => {
        const list = lists.find(l => l.id === listId);
        return {
          id: listId,
          name: list ? list.name : 'Lista sem nome',
          count
        };
      });
  }, [stats.byList, lists]);
  
  // Calcular valores máximos para o gráfico - memoizado
  const maxCompletions = useMemo(() => {
    return Math.max(...stats.completedByDayOfWeek);
  }, [stats.completedByDayOfWeek]);
  
  // Formatar data com useCallback
  const formatDate = useCallback((date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  }, []);
  
  // Função de fechar memoizada para evitar recriação
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Cabeçalho do dashboard */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
              <FiBarChart2 className="mr-2" />
              Dashboard
            </h2>
            <button 
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              aria-label="Fechar dashboard"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Estatísticas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Tarefas Totais"
              value={stats.totalTasks}
              icon={<FiList size={20} />}
              color="border-blue-500"
            />
            <StatCard
              title="Concluídas"
              value={stats.completedTasks}
              icon={<FiCheckCircle size={20} />}
              description={`${stats.completionRate.toFixed(0)}% do total`}
              color="border-green-500"
            />
            <StatCard
              title="Pendentes"
              value={stats.pendingTasks}
              icon={<FiClock size={20} />}
              color="border-amber-500"
            />
            <StatCard
              title="Atrasadas"
              value={stats.overdueTasks}
              icon={<FiAlertCircle size={20} />}
              color="border-red-500"
            />
          </div>
          
          {/* Estatísticas secundárias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard
              title="Sequência Atual"
              value={stats.currentStreak}
              icon={<FiActivity size={20} />}
              description="Dias consecutivos com tarefas concluídas"
              color="border-indigo-500"
            />
            <StatCard
              title="Melhor Sequência"
              value={stats.longestStreak}
              icon={<FiTrendingUp size={20} />}
              description="Seu recorde de produtividade"
              color="border-purple-500"
            />
            <StatCard
              title="Tempo Médio de Conclusão"
              value={formatTime(stats.avgCompletionTime)}
              icon={<FiTarget size={20} />}
              description="Da criação até a conclusão"
              color="border-cyan-500"
            />
          </div>
          
          {/* Gráfico de atividade por dia da semana */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Atividade por Dia da Semana
            </h3>
            
            <div className="flex h-60 items-end justify-between">
              {stats.completedByDayOfWeek.map((count, index) => (
                <div key={index} className="flex flex-col items-center w-full">
                  <div
                    className="w-full mx-1 bg-indigo-500 dark:bg-indigo-600 rounded-t"
                    style={{
                      height: `${maxCompletions > 0 ? (count / maxCompletions) * 100 : 0}%`,
                      minHeight: count > 0 ? '8px' : '0'
                    }}
                  ></div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {stats.dayNames[index]}
                  </div>
                  <div className="text-xs font-medium text-gray-800 dark:text-gray-300">
                    {count}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p>
                Dia mais produtivo: <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  {stats.mostProductiveDays[0]?.day || '-'} ({stats.mostProductiveDays[0]?.count || 0} tarefas)
                </span>
              </p>
              <p className="mt-1">
                Horário mais produtivo: <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  {stats.mostProductiveHour}:00 - {stats.mostProductiveHour + 1}:00
                </span>
              </p>
            </div>
          </div>
          
          {/* Distribuição e próximas tarefas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Distribuição de tarefas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                Distribuição de Tarefas
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <FiStar className="mr-1" /> Por Prioridade
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-24 text-sm text-gray-600 dark:text-gray-400">Alta:</div>
                      <div className="flex-grow bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-red-500 h-full"
                          style={{
                            width: `${stats.totalTasks > 0 ? (stats.byPriority.alta / stats.totalTasks) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                      <div className="w-10 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                        {stats.byPriority.alta}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-sm text-gray-600 dark:text-gray-400">Média:</div>
                      <div className="flex-grow bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-yellow-500 h-full"
                          style={{
                            width: `${stats.totalTasks > 0 ? (stats.byPriority.média / stats.totalTasks) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                      <div className="w-10 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                        {stats.byPriority.média}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-sm text-gray-600 dark:text-gray-400">Baixa:</div>
                      <div className="flex-grow bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-green-500 h-full"
                          style={{
                            width: `${stats.totalTasks > 0 ? (stats.byPriority.baixa / stats.totalTasks) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                      <div className="w-10 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                        {stats.byPriority.baixa}
                      </div>
                    </div>
                  </div>
                </div>
                
                {topLists.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <FiList className="mr-1" /> Por Lista
                    </h4>
                    <div className="space-y-1">
                      {topLists.map((list) => (
                        <div key={list.id} className="flex items-center">
                          <div className="w-28 truncate text-sm text-gray-600 dark:text-gray-400">
                            {list.name}:
                          </div>
                          <div className="flex-grow bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-500 h-full"
                              style={{
                                width: `${stats.totalTasks > 0 ? (list.count / stats.totalTasks) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                          <div className="w-10 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                            {list.count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {topTags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <FiTag className="mr-1" /> Tags Mais Usadas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {topTags.map(([tag, count]) => (
                        <div 
                          key={tag} 
                          className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded text-xs flex items-center"
                        >
                          {tag} <span className="ml-1 text-indigo-600 dark:text-indigo-400 font-medium">({count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Próximas tarefas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                Próximas Tarefas
              </h3>
              
              {upcomingTasks.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTasks.slice(0, 6).map((task) => {
                    const dueDate = new Date(task.dueDate!);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    
                    let dueDateText = formatDate(dueDate);
                    let dueDateClass = 'text-gray-500 dark:text-gray-400';
                    
                    if (dueDate.getTime() === today.getTime()) {
                      dueDateText = 'Hoje';
                      dueDateClass = 'text-amber-500 dark:text-amber-400 font-medium';
                    } else if (dueDate.getTime() === tomorrow.getTime()) {
                      dueDateText = 'Amanhã';
                      dueDateClass = 'text-green-500 dark:text-green-400 font-medium';
                    }
                    
                    return (
                      <div 
                        key={task.id} 
                        className="flex items-start p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"
                      >
                        <div 
                          className={`w-2 h-2 rounded-full mt-1.5 mr-2 ${
                            task.priority === 'alta' ? 'bg-red-500' : 
                            task.priority === 'média' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        ></div>
                        <div className="flex-grow min-w-0">
                          <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {task.description}
                            </div>
                          )}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {task.tags.map((tag) => (
                                <span 
                                  key={tag} 
                                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={`ml-2 text-xs whitespace-nowrap ${dueDateClass}`}>
                          <FiCalendar className="inline-block mr-1" size={10} />
                          {dueDateText}
                        </div>
                      </div>
                    );
                  })}
                  
                  {upcomingTasks.length > 6 && (
                    <div className="text-center text-sm text-indigo-600 dark:text-indigo-400 mt-2">
                      + {upcomingTasks.length - 6} mais tarefas próximas
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FiCalendar size={40} className="mx-auto mb-2 opacity-30" />
                  <p>Nenhuma tarefa agendada para os próximos 7 dias.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Dicas de produtividade */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">
              💡 Dicas de Produtividade
            </h3>
            <ul className="text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
              <li>• Experimente o Modo Foco para se concentrar em uma tarefa de cada vez.</li>
              <li>• Divida tarefas grandes em subtarefas menores e mais gerenciáveis.</li>
              <li>• Priorize as tarefas mais importantes e urgentes.</li>
              <li>• Use tags para categorizar suas tarefas e encontrá-las facilmente.</li>
              <li>• Confira suas notificações regularmente para não perder prazos.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard'; 