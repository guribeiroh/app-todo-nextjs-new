import React, { useState, useEffect } from 'react';
import { FiX, FiArrowRight, FiArrowLeft, FiCheckCircle, FiCalendar, FiClock, FiSearch, FiSettings, FiTag } from 'react-icons/fi';

interface WalkthroughProps {
  onClose: () => void;
}

export const Walkthrough: React.FC<WalkthroughProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWalkthroughOnStartup, setShowWalkthroughOnStartup] = useState(true);
  
  // Verificar se é a primeira vez que o usuário está abrindo o app
  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem('neotask-walkthrough-completed');
    if (!hasSeenWalkthrough) {
      setShowWalkthroughOnStartup(true);
    }
  }, []);
  
  // Definir os passos do tutorial
  const steps = [
    {
      title: 'Bem-vindo ao NeoTask',
      description: 'Seu novo assistente de produtividade para gerenciar tarefas com facilidade e eficiência.',
      image: '/walkthrough/welcome.svg',
    },
    {
      title: 'Gerenciamento de Tarefas',
      description: 'Adicione tarefas rapidamente, defina prazos, prioridades e organize-as em listas personalizadas.',
      image: '/walkthrough/tasks.svg',
      highlight: 'taskform',
    },
    {
      title: 'Visualização em Calendário',
      description: 'Veja suas tarefas organizadas por data e arraste-as para reorganizar facilmente seus prazos.',
      image: '/walkthrough/calendar.svg',
      highlight: 'calendar',
      icon: <FiCalendar size={24} className="text-purple-500" />,
    },
    {
      title: 'Modo Foco',
      description: 'Aumente sua produtividade usando a técnica Pomodoro para focar em uma tarefa de cada vez.',
      image: '/walkthrough/focus.svg',
      highlight: 'focus',
      icon: <FiClock size={24} className="text-indigo-500" />,
    },
    {
      title: 'Pesquisa Avançada',
      description: 'Encontre qualquer tarefa rapidamente com a busca completa e filtros avançados.',
      image: '/walkthrough/search.svg',
      highlight: 'search',
      icon: <FiSearch size={24} className="text-blue-500" />,
    },
    {
      title: 'Temas Personalizados',
      description: 'Personalize a aparência do NeoTask escolhendo temas e cores que combinam com seu estilo.',
      image: '/walkthrough/themes.svg',
      highlight: 'theme',
      icon: <FiSettings size={24} className="text-pink-500" />,
    },
    {
      title: 'Tags e Organização',
      description: 'Use tags para categorizar suas tarefas e encontre-as mais facilmente depois.',
      image: '/walkthrough/tags.svg',
      highlight: 'tags',
      icon: <FiTag size={24} className="text-amber-500" />,
    },
    {
      title: 'Pronto para começar!',
      description: 'Você já conhece o básico do NeoTask. Explore mais recursos e aumente sua produtividade!',
      image: '/walkthrough/done.svg',
      icon: <FiCheckCircle size={24} className="text-green-500" />,
    },
  ];
  
  // Marca o tutorial como concluído
  const completeWalkthrough = () => {
    localStorage.setItem('neotask-walkthrough-completed', 'true');
    onClose();
  };
  
  // Reinicia o tutorial
  const resetWalkthrough = () => {
    localStorage.removeItem('neotask-walkthrough-completed');
    setCurrentStep(0);
    onClose();
  };
  
  // Passa para o próximo passo
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeWalkthrough();
    }
  };
  
  // Volta para o passo anterior
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Pular o tutorial
  const skipWalkthrough = () => {
    if (showWalkthroughOnStartup) {
      localStorage.setItem('neotask-walkthrough-completed', 'true');
    }
    onClose();
  };
  
  const currentStepData = steps[currentStep];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mr-3">
              {currentStepData.icon || (currentStep + 1)}
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {currentStepData.title}
            </h2>
          </div>
          <button
            onClick={skipWalkthrough}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            aria-label="Fechar tutorial"
          >
            <FiX size={20} />
          </button>
        </div>
        
        {/* Conteúdo */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Imagem ilustrativa */}
            <div className="w-full md:w-1/2 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl flex items-center justify-center">
              <div className="w-48 h-48 flex items-center justify-center text-gray-300 dark:text-gray-700">
                <img 
                  src={currentStepData.image || '/placeholder.svg'} 
                  alt={`Tutorial step ${currentStep + 1}`} 
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
            </div>
            
            {/* Descrição */}
            <div className="w-full md:w-1/2">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {currentStepData.description}
              </p>
              
              {/* Destaque de recursos específicos */}
              {currentStepData.highlight && (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 dark:border-yellow-700 p-3 mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    {currentStepData.highlight === 'taskform' && 'Experimente adicionar sua primeira tarefa no formulário no topo da página.'}
                    {currentStepData.highlight === 'calendar' && 'Clique no ícone de calendário na barra de navegação para visualizar suas tarefas organizadas por data.'}
                    {currentStepData.highlight === 'focus' && 'Inicie o modo foco quando precisar de concentração total em uma tarefa específica.'}
                    {currentStepData.highlight === 'search' && 'Use Ctrl+K para abrir a pesquisa rápida a qualquer momento.'}
                    {currentStepData.highlight === 'theme' && 'Personalize as cores da interface para combinar com seu estilo.'}
                    {currentStepData.highlight === 'tags' && 'Adicione tags às suas tarefas para organizá-las por categorias.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Navegação */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center">
            {/* Indicador de progresso */}
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div 
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-indigo-500 dark:bg-indigo-400' 
                      : index < currentStep 
                        ? 'bg-gray-300 dark:bg-gray-700' 
                        : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                ></div>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center"
              >
                <FiArrowLeft className="mr-2" size={16} />
                Anterior
              </button>
            )}
            
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 dark:hover:bg-indigo-400 flex items-center"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Próximo
                  <FiArrowRight className="ml-2" size={16} />
                </>
              ) : (
                'Começar a usar'
              )}
            </button>
          </div>
        </div>
        
        {/* Opção de não mostrar novamente */}
        <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50">
          <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={!showWalkthroughOnStartup}
              onChange={(e) => setShowWalkthroughOnStartup(!e.target.checked)}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            Não mostrar este tutorial novamente
          </label>
        </div>
      </div>
    </div>
  );
}; 