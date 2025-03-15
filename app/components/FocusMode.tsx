import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import PomodoroTimer from './PomodoroTimer';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { Task } from '../types';

interface FocusModeProps {
  onExitFocusMode: () => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({ onExitFocusMode }) => {
  const { getPendingTasks, toggleTaskCompletion, updateTask } = useTaskContext();
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [focusSessionCount, setFocusSessionCount] = useState(0);

  // Carregar tarefas pendentes
  useEffect(() => {
    const tasks = getPendingTasks();
    setPendingTasks(tasks);
    
    // Selecionar automaticamente a primeira tarefa de alta prioridade ou a primeira da lista
    const highPriorityTask = tasks.find(task => task.priority === 'alta');
    setSelectedTask(highPriorityTask || tasks[0]);
  }, [getPendingTasks]);

  // Callback quando o timer de foco é concluído
  const handleFocusComplete = () => {
    setFocusSessionCount(prev => prev + 1);
    
    // Registrar progresso na tarefa se selecionada
    if (selectedTask) {
      // Adicionar uma nota sobre a sessão de foco à descrição da tarefa
      const newDescription = selectedTask.description
        ? `${selectedTask.description}\n[${new Date().toLocaleString()}] Sessão de foco concluída.`
        : `[${new Date().toLocaleString()}] Sessão de foco concluída.`;
      
      updateTask(selectedTask.id, { description: newDescription });
    }
  };

  // Marcar tarefa como concluída
  const completeTask = (taskId: string) => {
    toggleTaskCompletion(taskId);
    setCompleted(prev => [...prev, taskId]);
    
    // Se a tarefa selecionada foi concluída, selecionar a próxima
    if (selectedTask && selectedTask.id === taskId) {
      const remainingTasks = pendingTasks.filter(
        task => task.id !== taskId && !completed.includes(task.id)
      );
      setSelectedTask(remainingTasks[0]);
    }
  };

  // Selecionar uma nova tarefa para foco
  const selectTask = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={onExitFocusMode}
            className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            <span>Sair do Modo Foco</span>
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {focusSessionCount > 0 && (
              <span>
                {focusSessionCount} {focusSessionCount === 1 ? 'sessão' : 'sessões'} de foco concluída{focusSessionCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Modo Foco
          </h2>
          
          <PomodoroTimer 
            selectedTask={selectedTask} 
            onTimerComplete={handleFocusComplete} 
            onClose={onExitFocusMode}
          />
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
              Dicas para Produtividade
            </h3>
            
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Elimine distrações e notificações durante o tempo de foco.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Defina um objetivo claro para cada sessão de foco.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Faça pausas completas, afastando-se da tela.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Mantenha um copo de água por perto para se manter hidratado.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Após 4 ciclos, faça uma pausa mais longa de 15-30 minutos.</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white flex items-center">
            <span>Tarefas Pendentes</span>
            <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 py-0.5 px-2 rounded-full">
              {pendingTasks.length}
            </span>
          </h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              {pendingTasks.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <p>Não há tarefas pendentes.</p>
                  <p className="mt-2 text-sm">Todas as tarefas foram concluídas! 🎉</p>
                </div>
              ) : (
                <ul>
                  {pendingTasks.map(task => {
                    const isCompleted = completed.includes(task.id);
                    const isSelected = selectedTask?.id === task.id;
                    
                    return (
                      <li 
                        key={task.id}
                        className={`
                          border-b border-gray-200 dark:border-gray-700 last:border-b-0
                          ${isCompleted ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
                          ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                        `}
                      >
                        <div className="flex items-center p-4">
                          <button
                            onClick={() => completeTask(task.id)}
                            className={`
                              flex-shrink-0 w-6 h-6 mr-3 rounded-full border-2 flex items-center justify-center
                              ${isCompleted
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400'}
                              transition-colors duration-200
                            `}
                            disabled={isCompleted}
                          >
                            {isCompleted && <FiCheck size={14} />}
                          </button>
                          
                          <div 
                            className={`
                              flex-grow cursor-pointer
                              ${isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : ''}
                            `}
                            onClick={() => !isCompleted && selectTask(task)}
                          >
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              {task.title}
                            </div>
                            
                            <div className="flex mt-1 items-center text-xs">
                              <span className={`
                                inline-block px-2 py-0.5 rounded-full mr-2
                                ${task.priority === 'alta' 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                                  : task.priority === 'média'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}
                              `}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </span>
                              
                              {task.dueDate && (
                                <span className="text-gray-500 dark:text-gray-400">
                                  Vence: {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 