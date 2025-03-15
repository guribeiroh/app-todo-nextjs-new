'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiPause, FiSkipForward, FiSettings, FiX, FiBell, FiBarChart2 } from 'react-icons/fi';
import { Task } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { usePomodoroContext, PomodoroSession, PomodoroStats } from '../context/PomodoroContext';
import { useTaskContext } from '../context/TaskContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from './Toast';

interface PomodoroTimerProps {
  selectedTask?: Task;
  onTimerComplete?: (type: string) => void;
  onClose: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ 
  selectedTask = undefined,
  onTimerComplete,
  onClose
}) => {
  // Estados para configurações
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  const [alarmSound, setAlarmSound] = useState('bell');
  const [alarmVolume, setAlarmVolume] = useState(50);

  // Estados para o timer
  const [mode, setMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(pomodoroTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [interruptions, setInterruptions] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<PomodoroStats | null>(null);
  
  // Referências para áudio
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  
  // Uso dos contextos
  const { 
    addSession, 
    updateSession, 
    completeSession, 
    getStats,
    isLoading
  } = usePomodoroContext();
  
  const { showToast } = useToast();

  // Efeito para carregar configurações do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setPomodoroTime(settings.pomodoroTime || 25);
      setShortBreakTime(settings.shortBreakTime || 5);
      setLongBreakTime(settings.longBreakTime || 15);
      setLongBreakInterval(settings.longBreakInterval || 4);
      setAutoStartBreaks(settings.autoStartBreaks ?? true);
      setAutoStartPomodoros(settings.autoStartPomodoros ?? false);
      setAlarmSound(settings.alarmSound || 'bell');
      setAlarmVolume(settings.alarmVolume || 50);
    }
  }, []);

  // Carregar estatísticas quando abrir estatísticas
  useEffect(() => {
    if (showStats) {
      loadStats();
    }
  }, [showStats]);

  // Carregar estatísticas
  const loadStats = async () => {
    try {
      // Obter estatísticas dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const stats = await getStats(thirtyDaysAgo);
      setStatsData(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      showToast('Erro ao carregar estatísticas', 'error');
    }
  };

  // Efeito para salvar configurações
  useEffect(() => {
    const settings = {
      pomodoroTime,
      shortBreakTime,
      longBreakTime,
      longBreakInterval,
      autoStartBreaks,
      autoStartPomodoros,
      alarmSound,
      alarmVolume
    };
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
  }, [pomodoroTime, shortBreakTime, longBreakTime, longBreakInterval, autoStartBreaks, autoStartPomodoros, alarmSound, alarmVolume]);

  // Efeito para definir o tempo inicial baseado no modo
  useEffect(() => {
    switch (mode) {
      case 'pomodoro':
        setTimeLeft(pomodoroTime * 60);
        break;
      case 'shortBreak':
        setTimeLeft(shortBreakTime * 60);
        break;
      case 'longBreak':
        setTimeLeft(longBreakTime * 60);
        break;
    }
  }, [mode, pomodoroTime, shortBreakTime, longBreakTime]);

  // Efeito para o timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer completou
      playAlarm();
      
      if (mode === 'pomodoro') {
        // Completar a sessão no contexto
        if (currentSessionId) {
          completeSession(currentSessionId, interruptions)
            .then(() => {
              // Notificar conclusão
              if (onTimerComplete) {
                onTimerComplete(mode);
              }
            })
            .catch(error => {
              console.error('Erro ao completar sessão:', error);
            });
        }
        
        // Incrementar contador de pomodoros
        setPomodoroCount(prev => prev + 1);
        
        // Determinar próximo modo
        const nextMode = (pomodoroCount + 1) % longBreakInterval === 0 
          ? 'longBreak' 
          : 'shortBreak';
        
        setMode(nextMode);
        
        // Auto iniciar break se configurado
        setIsActive(autoStartBreaks);
        setInterruptions(0);
        setCurrentSessionId(null);
      } else {
        // Após um break, voltar para pomodoro
        setMode('pomodoro');
        
        // Auto iniciar pomodoro se configurado
        setIsActive(autoStartPomodoros);
      }
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isActive, timeLeft, mode, pomodoroCount, longBreakInterval, autoStartBreaks, autoStartPomodoros, onTimerComplete, completeSession, currentSessionId, interruptions]);

  // Função para tocar alarme
  const playAlarm = () => {
    if (alarmRef.current) {
      alarmRef.current.volume = alarmVolume / 100;
      alarmRef.current.currentTime = 0;
      alarmRef.current.play().catch(e => console.error('Erro ao tocar alarme:', e));
    }
  };
  
  // Iniciar/pausar o timer
  const toggleTimer = async () => {
    if (!isActive && mode === 'pomodoro' && !currentSessionId) {
      // Criar uma nova sessão
      try {
        const sessionData: Omit<PomodoroSession, 'id' | 'created_at'> = {
          task_id: selectedTask?.id,
          duration_seconds: pomodoroTime * 60,
          type: mode,
          started_at: new Date(),
          completed: false,
          interruptions: 0
        };
        
        const newSessionId = await addSession(sessionData);
        setCurrentSessionId(newSessionId);
        showToast('Sessão Pomodoro iniciada!', 'success');
      } catch (error) {
        console.error('Erro ao criar sessão:', error);
        showToast('Erro ao iniciar sessão', 'error');
      }
    } else if (isActive && mode === 'pomodoro') {
      // Registrar uma interrupção
      registerInterruption();
    }
    
    setIsActive(!isActive);
  };
  
  // Pular para o próximo modo
  const skipToNext = async () => {
    // Incrementar interrupções se estiver pulando um pomodoro ativo
    if (mode === 'pomodoro' && isActive) {
      setInterruptions(prev => prev + 1);
      
      if (currentSessionId) {
        try {
          await updateSession(currentSessionId, { interruptions: interruptions + 1 });
        } catch (error) {
          console.error('Erro ao atualizar interrupções:', error);
        }
      }
    }
    
    setIsActive(false);
    
    if (mode === 'pomodoro') {
      if (pomodoroCount % longBreakInterval === longBreakInterval - 1) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      setMode('pomodoro');
      setInterruptions(0);
      setCurrentSessionId(null);
    }
  };
  
  // Registrar uma interrupção manualmente
  const registerInterruption = async () => {
    setInterruptions(prev => prev + 1);
    
    if (currentSessionId) {
      try {
        await updateSession(currentSessionId, { interruptions: interruptions + 1 });
        showToast('Interrupção registrada', 'info');
      } catch (error) {
        console.error('Erro ao registrar interrupção:', error);
      }
    }
  };
  
  // Formatar tempo para exibição
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Componente de configurações
  const renderSettings = () => {
    return (
      <div className="p-4 space-y-6">
        <h2 className="text-lg font-medium text-gray-100 mb-4">Configurações do Pomodoro</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tempo de Pomodoro (minutos)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={pomodoroTime}
              onChange={(e) => setPomodoroTime(parseInt(e.target.value) || 25)}
              className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pausa Curta (minutos)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={shortBreakTime}
              onChange={(e) => setShortBreakTime(parseInt(e.target.value) || 5)}
              className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pausa Longa (minutos)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={longBreakTime}
              onChange={(e) => setLongBreakTime(parseInt(e.target.value) || 15)}
              className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pomodoros até Pausa Longa</label>
            <input
              type="number"
              min="1"
              max="10"
              value={longBreakInterval}
              onChange={(e) => setLongBreakInterval(parseInt(e.target.value) || 4)}
              className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoStartBreaks"
              checked={autoStartBreaks}
              onChange={(e) => setAutoStartBreaks(e.target.checked)}
              className="w-4 h-4 mr-2 text-primary focus:ring-primary border-gray-600 rounded"
            />
            <label htmlFor="autoStartBreaks" className="text-gray-300">
              Iniciar pausas automaticamente
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoStartPomodoros"
              checked={autoStartPomodoros}
              onChange={(e) => setAutoStartPomodoros(e.target.checked)}
              className="w-4 h-4 mr-2 text-primary focus:ring-primary border-gray-600 rounded"
            />
            <label htmlFor="autoStartPomodoros" className="text-gray-300">
              Iniciar pomodoros automaticamente após pausas
            </label>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Som do Alarme</label>
            <select
              value={alarmSound}
              onChange={(e) => setAlarmSound(e.target.value)}
              className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="bell">Sino</option>
              <option value="digital">Digital</option>
              <option value="gentle">Suave</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Volume do Alarme: {alarmVolume}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={alarmVolume}
              onChange={(e) => setAlarmVolume(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <button
            onClick={() => setShowSettings(false)}
            className="btn bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded"
          >
            Salvar
          </button>
        </div>
      </div>
    );
  };

  // Componente de estatísticas
  const renderStats = () => {
    if (isLoading || !statsData) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    return (
      <div className="p-4 space-y-6">
        <h2 className="text-lg font-medium text-gray-100 mb-4">Estatísticas do Pomodoro</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Pomodoros Concluídos</div>
            <div className="text-2xl font-bold text-white mt-1">{statsData.completedSessions}</div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Tempo Total de Foco</div>
            <div className="text-2xl font-bold text-white mt-1">{statsData.totalFocusMinutes} min</div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Taxa de Conclusão</div>
            <div className="text-2xl font-bold text-white mt-1">{statsData.completionRate.toFixed(1)}%</div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Interrupções</div>
            <div className="text-2xl font-bold text-white mt-1">{statsData.totalInterruptions}</div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <button
            onClick={() => setShowStats(false)}
            className="btn bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  };

  // Renderizar o componente de timer
  const renderTimer = () => {
    const progress = mode === 'pomodoro' 
      ? (1 - timeLeft / (pomodoroTime * 60)) * 100
      : mode === 'shortBreak'
        ? (1 - timeLeft / (shortBreakTime * 60)) * 100
        : (1 - timeLeft / (longBreakTime * 60)) * 100;
    
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="relative w-64 h-64 mb-8">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1f2937"
              strokeWidth="2"
              className="opacity-50"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={
                mode === 'pomodoro' 
                  ? '#ef4444' 
                  : mode === 'shortBreak' 
                    ? '#10b981' 
                    : '#3b82f6'
              }
              strokeWidth="3"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progress) / 100}
              className="transition-all duration-1000"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-white mb-2">{formatTime(timeLeft)}</span>
            <span className="text-sm uppercase tracking-widest font-medium text-gray-300">
              {mode === 'pomodoro' 
                ? 'Pomodoro' 
                : mode === 'shortBreak' 
                  ? 'Pausa Curta' 
                  : 'Pausa Longa'}
            </span>
            {mode === 'pomodoro' && interruptions > 0 && (
              <span className="text-xs mt-2 text-red-400">
                Interrupções: {interruptions}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={toggleTimer}
            className={`btn ${
              isActive 
                ? 'bg-gray-600 hover:bg-gray-700' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white px-6 py-2 rounded-full flex items-center justify-center w-32 transition-colors`}
          >
            {isActive ? <FiPause className="mr-2" /> : <FiPlay className="mr-2" />}
            {isActive ? 'Pausar' : 'Iniciar'}
          </button>
          <button
            onClick={skipToNext}
            className="btn bg-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded-full flex items-center justify-center transition-colors"
          >
            <FiSkipForward className="mr-2" /> Pular
          </button>
          {mode === 'pomodoro' && isActive && (
            <button
              onClick={registerInterruption}
              className="btn bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full flex items-center justify-center transition-colors"
            >
              <FiBell className="mr-2" /> Interrupção
            </button>
          )}
        </div>
        
        <div className="flex space-x-2 mt-2">
          <button
            onClick={() => setMode('pomodoro')}
            className={`px-3 py-1 rounded-md text-sm ${
              mode === 'pomodoro' 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Pomodoro
          </button>
          <button
            onClick={() => setMode('shortBreak')}
            className={`px-3 py-1 rounded-md text-sm ${
              mode === 'shortBreak' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Pausa Curta
          </button>
          <button
            onClick={() => setMode('longBreak')}
            className={`px-3 py-1 rounded-md text-sm ${
              mode === 'longBreak' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Pausa Longa
          </button>
        </div>
        
        {/* Mostrar a tarefa selecionada apenas se ela existir */}
        {selectedTask && (
          <div className="mb-4 text-center mt-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Trabalhando em:</span>
            <h4 className="font-medium text-gray-800 dark:text-white truncate">
              {selectedTask.title}
            </h4>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-lg relative overflow-y-auto max-h-[90vh]">
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={() => setShowStats(true)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Estatísticas"
          >
            <FiBarChart2 size={20} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Configurações"
          >
            <FiSettings size={20} />
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Fechar"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="pt-6">
          {showSettings ? renderSettings() : showStats ? renderStats() : renderTimer()}
        </div>
        
        {/* Elemento de áudio para o alarme */}
        <audio ref={alarmRef} src={`/sounds/${alarmSound}.mp3`} />
      </div>
    </div>
  );
};

export default PomodoroTimer; 