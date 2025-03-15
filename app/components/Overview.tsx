import React from 'react';
import { FiX, FiClock, FiActivity, FiTarget, FiZap, FiInfo, FiCheckSquare, FiCalendar, FiTag } from 'react-icons/fi';

interface OverviewProps {
  onClose: () => void;
}

const Overview: React.FC<OverviewProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-4xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Fechar"
        >
          <FiX size={24} />
        </button>

        <div className="mt-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Bem-vindo ao NeoTask</h1>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            O NeoTask evoluiu para uma ferramenta completa de produtividade. Conheça as novas funcionalidades que 
            transformarão sua forma de trabalhar e gerenciar seu tempo.
          </p>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Novas Funcionalidades</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Gerenciador de Tarefas */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mr-3">
                  <FiCheckSquare className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-400">Gerenciador de Tarefas</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Organize suas tarefas com listas personalizadas, prioridades, datas de vencimento e tags coloridas.
                Filtre e pesquise com facilidade para manter o controle total do seu trabalho.
              </p>
            </div>

            {/* Calendário */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center mr-3">
                  <FiCalendar className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-400">Visualização de Calendário</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Visualize suas tarefas em um calendário intuitivo. Alterne facilmente entre visualização diária, 
                semanal e mensal para planejar seu tempo com eficiência.
              </p>
            </div>

            {/* Timer Pomodoro */}
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center mr-3">
                  <FiClock className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">Timer Pomodoro Avançado</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Aumente sua produtividade com nosso timer Pomodoro completo. Monitore interrupções, veja estatísticas 
                detalhadas de foco e personalize os intervalos de acordo com seu estilo de trabalho.
              </p>
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Novo!</span> Análise detalhada de sessões e histórico completo.
              </div>
            </div>

            {/* Rastreador de Hábitos */}
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mr-3">
                  <FiActivity className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-green-700 dark:text-green-400">Rastreador de Hábitos</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Desenvolva novos hábitos e rastreie sua consistência. Defina metas diárias, semanais ou mensais
                e acompanhe seu progresso visualmente com nosso sistema de calendário colorido.
              </p>
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Novo!</span> Visualização personalizada por dia, semana e mês.
              </div>
            </div>

            {/* Planejador de Objetivos */}
            <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center mr-3">
                  <FiTarget className="text-amber-600 dark:text-amber-400" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-amber-700 dark:text-amber-400">Planejador de Objetivos</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Estabeleça objetivos claros e divida-os em etapas gerenciáveis. Nosso sistema Kanban permite
                visualizar seu progresso e manter o foco no que realmente importa.
              </p>
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Novo!</span> Interface Kanban com arrastar e soltar.
              </div>
            </div>

            {/* Automação de Fluxos */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center mr-3">
                  <FiZap className="text-indigo-600 dark:text-indigo-400" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-indigo-700 dark:text-indigo-400">Automação de Fluxos</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Crie regras personalizadas para automatizar tarefas repetitivas. Configure gatilhos e ações
                para que o NeoTask trabalhe por você, economizando seu tempo e esforço.
              </p>
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Novo!</span> Sistema flexível de regras e condições.
              </div>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-8">
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center mr-4 mt-1">
                <FiInfo className="text-gray-600 dark:text-gray-400" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Dica de uso</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Todas as novas funcionalidades estão acessíveis através da barra lateral, na seção "Produtividade".
                  Experimente cada uma delas para descobrir como podem melhorar seu fluxo de trabalho!
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Os dados são armazenados localmente em seu dispositivo, então você não precisa se preocupar
                  com privacidade ou criar uma conta.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors"
            >
              Começar a usar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview; 