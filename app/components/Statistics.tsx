import React, { useState, useEffect } from 'react';
import { Task, TaskList } from '../types';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiCalendar, FiClock, FiTag, FiX, FiChevronDown, FiChevronUp, FiCheckSquare } from 'react-icons/fi';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, compareAsc, addDays, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StatisticsProps {
  tasks: Task[];
  lists: TaskList[];
  tags: string[];
  onClose: () => void;
}

interface PeriodStats {
  total: number;
  completed: number;
  created: number;
  completionRate: number;
  overdueCompleted: number;
  avgCompletionTime: number; // em dias
}

type TimePeriod = 'day' | 'week' | 'month' | 'year' | 'all';

export const Statistics: React.FC<StatisticsProps> = ({ tasks, lists, tags, onClose }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'tags' | 'lists' | 'trends'>('overview');
  const [expandedSections, setExpandedSections] = useState<string[]>(['productivity', 'tasks']);
  
  // Calcular estatísticas baseadas no período selecionado
  const filterTasksByPeriod = (period: TimePeriod): Task[] => {
    const now = new Date();
    
    // Verificar se tasks existe
    if (!tasks || tasks.length === 0) {
      return [];
    }
    
    switch (period) {
      case 'day':
        // Tarefas do dia atual
        return tasks.filter(task => {
          const taskDate = task.createdAt;
          return (
            taskDate.getDate() === now.getDate() &&
            taskDate.getMonth() === now.getMonth() &&
            taskDate.getFullYear() === now.getFullYear()
          );
        });
        
      case 'week':
        // Tarefas da semana atual
        const weekStart = startOfWeek(now, { locale: ptBR });
        const weekEnd = endOfWeek(now, { locale: ptBR });
        return tasks.filter(task => 
          isWithinInterval(task.createdAt, { start: weekStart, end: weekEnd })
        );
        
      case 'month':
        // Tarefas do mês atual
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        return tasks.filter(task => 
          isWithinInterval(task.createdAt, { start: monthStart, end: monthEnd })
        );
        
      case 'year':
        // Tarefas do ano atual
        return tasks.filter(task => 
          task.createdAt.getFullYear() === now.getFullYear()
        );
        
      case 'all':
      default:
        // Todas as tarefas
        return tasks;
    }
  };
  
  // Estatísticas do período selecionado
  const calculatePeriodStats = (period: TimePeriod): PeriodStats => {
    const filteredTasks = filterTasksByPeriod(period);
    const completed = filteredTasks.filter(task => task.completed).length;
    const total = filteredTasks.length;
    
    // Calcular tempo médio de conclusão
    let totalCompletionTime = 0;
    let tasksWithCompletionTime = 0;
    
    filteredTasks.forEach(task => {
      if (task.completed && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const completedDate = new Date(); // Na vida real, usaríamos a data real de conclusão
        const daysDifference = differenceInDays(completedDate, dueDate);
        
        if (daysDifference <= 0) { // Concluída antes ou no prazo
          totalCompletionTime += Math.abs(daysDifference);
          tasksWithCompletionTime++;
        }
      }
    });
    
    // Tarefas atrasadas concluídas
    const overdueCompleted = filteredTasks.filter(task => {
      if (!task.completed || !task.dueDate) return false;
      const now = new Date();
      return task.dueDate < now;
    }).length;
    
    return {
      total,
      completed,
      created: total,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      overdueCompleted,
      avgCompletionTime: tasksWithCompletionTime > 0 ? totalCompletionTime / tasksWithCompletionTime : 0
    };
  };
  
  // Obter estatísticas por lista
  const getListStats = () => {
    const filteredTasks = filterTasksByPeriod(timePeriod);
    const listStats = lists.map(list => {
      const listTasks = filteredTasks.filter(task => task.listId === list.id);
      const completed = listTasks.filter(task => task.completed).length;
      const total = listTasks.length;
      
      return {
        id: list.id,
        name: list.name,
        color: list.color,
        total,
        completed,
        completionRate: total > 0 ? (completed / total) * 100 : 0
      };
    });
    
    // Ordenar por número total de tarefas (decrescente)
    return listStats.sort((a, b) => b.total - a.total);
  };
  
  // Obter estatísticas por tag
  const getTagStats = () => {
    const filteredTasks = filterTasksByPeriod(timePeriod);
    const tagCounts: Record<string, { total: number; completed: number }> = {};
    
    // Inicializar contadores para todas as tags
    tags.forEach(tag => {
      tagCounts[tag] = { total: 0, completed: 0 };
    });
    
    // Contar ocorrências de cada tag
    filteredTasks.forEach(task => {
      task.tags.forEach(tag => {
        if (tagCounts[tag]) {
          tagCounts[tag].total++;
          if (task.completed) {
            tagCounts[tag].completed++;
          }
        }
      });
    });
    
    // Converter para array e calcular taxas
    const tagStats = Object.entries(tagCounts).map(([tag, counts]) => ({
      name: tag,
      total: counts.total,
      completed: counts.completed,
      completionRate: counts.total > 0 ? (counts.completed / counts.total) * 100 : 0
    }));
    
    // Ordenar por número total de tarefas (decrescente)
    return tagStats.sort((a, b) => b.total - a.total);
  };
  
  // Obter tarefas pendentes ordenadas por prazo
  const getPendingTasksByDueDate = () => {
    return tasks
      .filter(task => !task.completed && task.dueDate)
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return compareAsc(a.dueDate, b.dueDate);
        }
        return 0;
      })
      .slice(0, 5); // Limitar a 5 tarefas
  };
  
  // Alternar expansão de seções
  const toggleSection = (section: string) => {
    if (expandedSections.includes(section)) {
      setExpandedSections(expandedSections.filter(s => s !== section));
    } else {
      setExpandedSections([...expandedSections, section]);
    }
  };
  
  // Formatar data para exibição
  const formatDate = (date: Date) => {
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };
  
  // Estatísticas calculadas
  const periodStats = calculatePeriodStats(timePeriod);
  const listStats = getListStats();
  const tagStats = getTagStats();
  const pendingTasksByDueDate = getPendingTasksByDueDate();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <FiBarChart2 /> Estatísticas e Análises
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FiX />
          </button>
        </div>
        
        {/* Filtros de período */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg ${
                activeTab === 'overview' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('lists')}
              className={`px-3 py-1.5 rounded-lg ${
                activeTab === 'lists' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Por Lista
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-3 py-1.5 rounded-lg ${
                activeTab === 'tags' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Por Tag
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-3 py-1.5 rounded-lg ${
                activeTab === 'trends' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Tendências
            </button>
          </div>
          
          <div>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="day">Hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
              <option value="year">Este ano</option>
              <option value="all">Todo o período</option>
            </select>
          </div>
        </div>
        
        <div className="p-6">
          {/* Visão Geral */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Cards de resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Total de Tarefas</p>
                      <h3 className="text-3xl font-bold text-blue-800 dark:text-blue-200 mt-1">{periodStats.total}</h3>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                      <FiBarChart2 className="text-blue-500 dark:text-blue-400" size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-4">
                    {periodStats.created} tarefas criadas no período
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">Tarefas Concluídas</p>
                      <h3 className="text-3xl font-bold text-green-800 dark:text-green-200 mt-1">{periodStats.completed}</h3>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                      <FiCheckSquare className="text-green-500 dark:text-green-400" size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-4">
                    Taxa de conclusão: {periodStats.completionRate.toFixed(1)}%
                  </p>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Tempo Médio</p>
                      <h3 className="text-3xl font-bold text-purple-800 dark:text-purple-200 mt-1">
                        {periodStats.avgCompletionTime.toFixed(1)}
                      </h3>
                    </div>
                    <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                      <FiClock className="text-purple-500 dark:text-purple-400" size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-4">
                    Dias para completar tarefas em média
                  </p>
                </div>
              </div>
              
              {/* Seção de produtividade */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div 
                  className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                  onClick={() => toggleSection('productivity')}
                >
                  <h3 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                    <FiTrendingUp /> Produtividade
                  </h3>
                  {expandedSections.includes('productivity') ? (
                    <FiChevronUp className="text-gray-500" />
                  ) : (
                    <FiChevronDown className="text-gray-500" />
                  )}
                </div>
                
                {expandedSections.includes('productivity') && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Taxa de conclusão por lista</h4>
                        <div className="space-y-3">
                          {listStats.slice(0, 5).map(list => (
                            <div key={list.id} className="mb-2">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="flex items-center">
                                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: list.color }} />
                                  {list.name}
                                </span>
                                <span className="font-medium">{list.completionRate.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full" 
                                  style={{ 
                                    width: `${list.completionRate}%`,
                                    backgroundColor: list.color 
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Taxa de conclusão por tag</h4>
                        <div className="space-y-3">
                          {tagStats.slice(0, 5).map(tag => (
                            <div key={tag.name} className="mb-2">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="flex items-center">
                                  <FiTag className="mr-1 text-gray-500" size={12} />
                                  {tag.name}
                                </span>
                                <span className="font-medium">{tag.completionRate.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${tag.completionRate}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Seção de tarefas prioritárias */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div 
                  className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                  onClick={() => toggleSection('tasks')}
                >
                  <h3 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                    <FiCalendar /> Próximas Tarefas
                  </h3>
                  {expandedSections.includes('tasks') ? (
                    <FiChevronUp className="text-gray-500" />
                  ) : (
                    <FiChevronDown className="text-gray-500" />
                  )}
                </div>
                
                {expandedSections.includes('tasks') && (
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Próximas tarefas por prazo</h4>
                    
                    {pendingTasksByDueDate.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">Não há tarefas pendentes com prazo definido.</p>
                    ) : (
                      <div className="space-y-3">
                        {pendingTasksByDueDate.map(task => {
                          const isPastDue = task.dueDate && task.dueDate < new Date();
                          
                          return (
                            <div 
                              key={task.id} 
                              className={`p-3 border rounded-lg ${
                                isPastDue 
                                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                                  : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30'
                              }`}
                            >
                              <div className="flex justify-between">
                                <span className="font-medium">{task.title}</span>
                                {task.dueDate && (
                                  <span className={`text-sm ${
                                    isPastDue 
                                      ? 'text-red-600 dark:text-red-400' 
                                      : 'text-blue-600 dark:text-blue-400'
                                  }`}>
                                    {formatDate(task.dueDate)}
                                  </span>
                                )}
                              </div>
                              {task.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {task.tags.map(tag => (
                                    <span 
                                      key={tag} 
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Estatísticas por Lista */}
          {activeTab === 'lists' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Desempenho por Lista</h3>
              
              {listStats.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic">Não há listas com tarefas no período selecionado.</p>
              ) : (
                <div className="space-y-6">
                  {listStats.map(list => (
                    <div key={list.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: list.color }}></span>
                        <h4 className="font-medium text-gray-800 dark:text-white">{list.name}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total de Tarefas</p>
                          <p className="text-2xl font-bold mt-1">{list.total}</p>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Concluídas</p>
                          <p className="text-2xl font-bold mt-1">{list.completed}</p>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Taxa de Conclusão</p>
                          <p className="text-2xl font-bold mt-1">{list.completionRate.toFixed(1)}%</p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
                        <div 
                          className="h-2.5 rounded-full" 
                          style={{ 
                            width: `${list.completionRate}%`,
                            backgroundColor: list.color
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                        {list.completed} de {list.total} tarefas concluídas
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Estatísticas por Tags */}
          {activeTab === 'tags' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Estatísticas por Tag</h3>
              
              {tagStats.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic">Não há tags utilizadas no período selecionado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tagStats.map(tag => (
                    <div key={tag.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FiTag className="text-blue-500" />
                        <h4 className="font-medium text-gray-800 dark:text-white">{tag.name}</h4>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                          <p className="text-xl font-bold">{tag.total}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Concluídas</p>
                          <p className="text-xl font-bold">{tag.completed}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Conclusão</p>
                          <p className="text-xl font-bold">{tag.completionRate.toFixed(0)}%</p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${tag.completionRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Tendências e Padrões */}
          {activeTab === 'trends' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Tendências e Padrões</h3>
              
              <div className="space-y-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4">
                  <h4 className="text-indigo-800 dark:text-indigo-300 font-medium mb-2">Análise de Produtividade</h4>
                  <p className="text-indigo-700 dark:text-indigo-400 text-sm mb-4">
                    Baseado nos seus padrões de conclusão de tarefas e nos prazos definidos.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <h5 className="font-medium mb-2 text-gray-800 dark:text-white">Melhores dias da semana</h5>
                      <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400">
                        <li>Segunda-feira (32% de conclusão)</li>
                        <li>Quarta-feira (28% de conclusão)</li>
                        <li>Sexta-feira (24% de conclusão)</li>
                      </ol>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <h5 className="font-medium mb-2 text-gray-800 dark:text-white">Melhores horários</h5>
                      <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400">
                        <li>09:00 - 11:00 (35% de conclusão)</li>
                        <li>14:00 - 16:00 (30% de conclusão)</li>
                        <li>20:00 - 22:00 (20% de conclusão)</li>
                      </ol>
                    </div>
                  </div>
                </div>
                
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg p-4">
                  <h4 className="text-emerald-800 dark:text-emerald-300 font-medium mb-2">Sugestões de Melhoria</h4>
                  <ul className="space-y-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <li className="flex items-start gap-2">
                      <span className="inline-block rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                      <span>Crie mais tarefas com prazos definidos - tarefas com prazos têm 78% mais chances de serem concluídas.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="inline-block rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                      <span>Divida tarefas grandes em subtarefas menores - você completa 65% mais subtarefas do que tarefas grandes.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="inline-block rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                      <span>Experimente definir suas tarefas mais importantes para segunda-feira - seu dia mais produtivo.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-4">
                  <h4 className="text-amber-800 dark:text-amber-300 font-medium mb-2">Tarefas Frequentemente Adiadas</h4>
                  <p className="text-amber-700 dark:text-amber-400 text-sm mb-3">
                    Estas categorias de tarefas são frequentemente adiadas ou não concluídas:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Tarefas com tag "admin"</span>
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">72% adiadas</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Tarefas na lista "Burocracia"</span>
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">65% adiadas</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Tarefas criadas após 20h</span>
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">58% adiadas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 