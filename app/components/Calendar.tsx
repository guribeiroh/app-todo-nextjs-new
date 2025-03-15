import React, { useState, useMemo, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiX, FiList, FiGrid } from 'react-icons/fi';
import { useTaskContext } from '../context/TaskContext';
import { Task } from '../types';

interface CalendarProps {
  onClose: () => void;
}

export const Calendar: React.FC<CalendarProps> = ({ onClose }) => {
  const { tasks, updateTask } = useTaskContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthTasks, setMonthTasks] = useState<Record<string, Task[]>>({});
  const [view, setView] = useState<'month' | 'week'>('month');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
  // Nomes dos meses em português
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Nomes dos dias da semana em português
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  // Função para avançar para o próximo mês
  const nextMonth = () => {
    setCurrentDate(prevDate => {
      const nextDate = new Date(prevDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      return nextDate;
    });
  };
  
  // Função para voltar para o mês anterior
  const prevMonth = () => {
    setCurrentDate(prevDate => {
      const prevMonthDate = new Date(prevDate);
      prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
      return prevMonthDate;
    });
  };
  
  // Função para ir para a semana seguinte
  const nextWeek = () => {
    setCurrentDate(prevDate => {
      const nextDate = new Date(prevDate);
      nextDate.setDate(nextDate.getDate() + 7);
      return nextDate;
    });
  };
  
  // Função para voltar para a semana anterior
  const prevWeek = () => {
    setCurrentDate(prevDate => {
      const prevWeekDate = new Date(prevDate);
      prevWeekDate.setDate(prevWeekDate.getDate() - 7);
      return prevWeekDate;
    });
  };
  
  // Função para ir para hoje
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };
  
  // Gerar dias do mês
  const calendarDays = useMemo(() => {
    // Primeiro dia do mês
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    // Último dia do mês
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Dia da semana do primeiro dia (0 = Domingo, 1 = Segunda, etc)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Total de dias no mês
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Array para guardar todos os dias do calendário
    const calendarDays: (Date | null)[] = [];
    
    // Adicionar dias do mês anterior para completar a primeira semana
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthDay = new Date(firstDayOfMonth);
      prevMonthDay.setDate(prevMonthDay.getDate() - (firstDayOfWeek - i));
      calendarDays.push(prevMonthDay);
    }
    
    // Adicionar dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    
    // Calcular quantos dias precisamos do próximo mês para completar as semanas
    const remainingDays = 42 - calendarDays.length; // 6 semanas * 7 dias
    
    // Adicionar dias do próximo mês
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(lastDayOfMonth);
      nextMonthDay.setDate(nextMonthDay.getDate() + i);
      calendarDays.push(nextMonthDay);
    }
    
    return calendarDays;
  }, [currentDate]);
  
  // Gerar dias da semana
  const weekDaysArray = useMemo(() => {
    // Obtém o domingo da semana atual
    const sunday = new Date(currentDate);
    sunday.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Cria array com os 7 dias da semana
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      days.push(day);
    }
    
    return days;
  }, [currentDate]);
  
  // Processar tarefas para o mês atual
  useEffect(() => {
    // Organizar tarefas por data
    const tasksByDate: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        // Chave no formato YYYY-MM-DD
        const dateKey = `${dueDate.getFullYear()}-${dueDate.getMonth()}-${dueDate.getDate()}`;
        
        if (!tasksByDate[dateKey]) {
          tasksByDate[dateKey] = [];
        }
        
        tasksByDate[dateKey].push(task);
      }
    });
    
    setMonthTasks(tasksByDate);
  }, [tasks, currentDate]);
  
  // Encontrar tarefas para uma data específica
  const getTasksForDate = (date: Date): Task[] => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return monthTasks[dateKey] || [];
  };
  
  // Verificar se uma data tem tarefas
  const hasTasksForDate = (date: Date): boolean => {
    return getTasksForDate(date).length > 0;
  };
  
  // Verificar se uma data tem tarefas em atraso
  const hasOverdueTasks = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Se a data for menor que hoje e tiver tarefas não concluídas, está atrasada
    if (date < today) {
      const tasks = getTasksForDate(date);
      return tasks.some(task => !task.completed);
    }
    
    return false;
  };
  
  // Verificar se é a data atual
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  // Verificar se é a data selecionada
  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };
  
  // Formatar data para exibição
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Função para lidar com o início do arrasto de uma tarefa
  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };
  
  // Função para lidar com o evento de soltar uma tarefa
  const handleDrop = (date: Date) => {
    if (draggedTask) {
      const updatedTask = { 
        ...draggedTask,
        dueDate: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
      };
      
      updateTask(draggedTask.id, updatedTask);
      setDraggedTask(null);
    }
  };
  
  // Função para permitir o drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  return (
    <div className="fixed inset-0 bg-gray-900/80 dark:bg-black/80 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center z-10">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <FiCalendar className="text-indigo-600 dark:text-indigo-400" />
              Calendário de Tarefas
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800/30"
              >
                Hoje
              </button>
              
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-0.5 flex">
                <button
                  onClick={() => setView('month')}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    view === 'month'
                      ? 'bg-white dark:bg-gray-700 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <FiGrid className="inline-block mr-1" size={14} />
                  Mês
                </button>
                <button
                  onClick={() => setView('week')}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    view === 'week'
                      ? 'bg-white dark:bg-gray-700 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <FiList className="inline-block mr-1" size={14} />
                  Semana
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                {view === 'month' 
                  ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` 
                  : `Semana de ${formatDate(weekDaysArray[0])} a ${formatDate(weekDaysArray[6])}`
                }
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={view === 'month' ? prevMonth : prevWeek}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  <FiChevronLeft size={20} />
                </button>
                <button
                  onClick={view === 'month' ? nextMonth : nextWeek}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  <FiChevronRight size={20} />
                </button>
              </div>
            </div>
            
            {view === 'month' ? (
              // Visualização de mês
              <div>
                {/* Cabeçalho com dias da semana */}
                <div className="grid grid-cols-7 mb-2">
                  {weekDays.map((day, index) => (
                    <div 
                      key={index} 
                      className="text-center py-2 text-sm font-medium text-gray-600 dark:text-gray-400"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Grade do calendário */}
                <div 
                  className="grid grid-cols-7 gap-1 auto-rows-fr border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
                  style={{ minHeight: '600px' }}
                >
                  {calendarDays.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} className="h-full"></div>;
                    
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    const dateHasTasks = hasTasksForDate(date);
                    const dateHasOverdueTasks = hasOverdueTasks(date);
                    const isCurrentDate = isToday(date);
                    const isSelectedDate = isSelected(date);
                    
                    return (
                      <div 
                        key={`day-${index}`}
                        className={`
                          min-h-[100px] p-1 border border-gray-100 dark:border-gray-800
                          ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-600'}
                          ${isCurrentDate ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''}
                          ${isSelectedDate ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                          hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                          relative
                        `}
                        onClick={() => setSelectedDate(date)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(date)}
                      >
                        <div className="flex justify-between items-start">
                          <span 
                            className={`
                              inline-flex items-center justify-center w-6 h-6 rounded-full text-sm
                              ${isCurrentDate ? 'bg-indigo-500 text-white' : 'text-gray-700 dark:text-gray-300'}
                            `}
                          >
                            {date.getDate()}
                          </span>
                          
                          {dateHasTasks && (
                            <span 
                              className={`
                                h-2 w-2 rounded-full
                                ${dateHasOverdueTasks ? 'bg-red-500' : 'bg-green-500'}
                              `}
                            ></span>
                          )}
                        </div>
                        
                        {/* Lista de tarefas do dia */}
                        <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                          {getTasksForDate(date).map(task => (
                            <div 
                              key={task.id} 
                              className={`
                                text-xs p-1 rounded truncate
                                ${task.completed 
                                  ? 'line-through text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800' 
                                  : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'}
                              `}
                              draggable
                              onDragStart={() => handleDragStart(task)}
                            >
                              {task.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Visualização de semana
              <div>
                <div className="grid grid-cols-7 gap-4 mb-4">
                  {weekDaysArray.map((date, index) => (
                    <div 
                      key={index} 
                      className={`
                        text-center py-2 text-sm font-medium rounded-lg
                        ${isToday(date) 
                          ? 'bg-indigo-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}
                      `}
                    >
                      <div>{weekDays[index]}</div>
                      <div className="text-lg">{date.getDate()}</div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  {weekDaysArray.map((date, index) => (
                    <div 
                      key={index} 
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700"
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(date)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                            ${isToday(date) 
                              ? 'bg-indigo-500 text-white' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}
                          `}
                        >
                          {date.getDate()}
                        </div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {weekDays[index]}, {date.getDate()} de {monthNames[date.getMonth()]}
                        </h4>
                      </div>
                      
                      {getTasksForDate(date).length > 0 ? (
                        <div className="space-y-2 pl-10">
                          {getTasksForDate(date).map(task => (
                            <div 
                              key={task.id} 
                              className={`
                                p-2 rounded-md text-sm flex items-start gap-2 border
                                ${task.completed 
                                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800' 
                                  : task.priority === 'alta'
                                    ? 'border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10'
                                    : task.priority === 'média'
                                      ? 'border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10'
                                      : 'border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10'
                                }
                              `}
                              draggable
                              onDragStart={() => handleDragStart(task)}
                            >
                              {/* Indicador de prioridade */}
                              <div 
                                className={`
                                  w-2 h-2 rounded-full mt-1.5
                                  ${task.priority === 'alta' 
                                    ? 'bg-red-500' 
                                    : task.priority === 'média' 
                                      ? 'bg-amber-500' 
                                      : 'bg-green-500'}
                                `}
                              ></div>
                              
                              <div className="flex-grow">
                                <div className={`font-medium ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                  {task.title}
                                </div>
                                {task.description && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                    {task.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pl-10 text-sm text-gray-400 dark:text-gray-500 italic">
                          Nenhuma tarefa para este dia
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Legenda do calendário */}
            <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Data atual</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Com tarefas</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Com tarefas atrasadas</span>
              </div>
              
              <div className="flex-grow"></div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                Dica: Arraste e solte tarefas para alterar a data de vencimento
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 