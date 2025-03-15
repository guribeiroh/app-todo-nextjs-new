'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCheckCircle, 
  FiClock, 
  FiLayout, 
  FiCalendar, 
  FiTarget, 
  FiList, 
  FiGrid, 
  FiArrowRight, 
  FiMoon, 
  FiSun, 
  FiSmartphone 
} from 'react-icons/fi';

const features = [
  {
    icon: <FiCheckCircle className="w-6 h-6 text-indigo-500" />,
    title: "Organize Tarefas",
    description: "Gerencie suas atividades com facilidade e mantenha-se produtivo."
  },
  {
    icon: <FiClock className="w-6 h-6 text-purple-500" />,
    title: "Timer Pomodoro",
    description: "Maximize sua produtividade com a técnica Pomodoro integrada."
  },
  {
    icon: <FiLayout className="w-6 h-6 text-emerald-500" />,
    title: "Visualização Kanban",
    description: "Visualize seu fluxo de trabalho em um quadro kanban interativo."
  },
  {
    icon: <FiCalendar className="w-6 h-6 text-blue-500" />,
    title: "Calendário",
    description: "Organize suas tarefas em um calendário visual e intuitivo."
  },
  {
    icon: <FiTarget className="w-6 h-6 text-pink-500" />,
    title: "Metas e Hábitos",
    description: "Defina objetivos e acompanhe o desenvolvimento de hábitos positivos."
  },
  {
    icon: <FiSmartphone className="w-6 h-6 text-orange-500" />,
    title: "Acesso Offline",
    description: "Continue produtivo mesmo sem conexão com a internet."
  },
];

// Componente para demonstração visual das funcionalidades
const FeatureDemo = () => {
  const [activeView, setActiveView] = useState<'list' | 'kanban'>('list');
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('dark');

  // Alternar entre as visualizações a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveView(prev => prev === 'list' ? 'kanban' : 'list');
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tarefas de demonstração
  const demoTasks = [
    { id: '1', title: "Preparar apresentação", completed: false, priority: "alta" },
    { id: '2', title: "Enviar e-mails", completed: true, priority: "média" },
    { id: '3', title: "Reunião de equipe", completed: false, priority: "alta" },
    { id: '4', title: "Revisar relatório", completed: false, priority: "média" }
  ];

  return (
    <div className={`mt-8 p-4 rounded-xl shadow-2xl overflow-hidden transition-all duration-500 ${activeTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-medium ${activeTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Suas Tarefas
        </h3>
        <div className="flex items-center space-x-3">
          <div className="relative bg-gray-700/60 p-1 rounded-xl shadow-inner flex items-center">
            <div 
              className="absolute h-7 transition-all duration-300 ease-in-out bg-gradient-to-r from-indigo-500/90 to-indigo-600/90 rounded-lg shadow-md"
              style={{
                left: activeView === 'list' ? '4px' : '50%',
                width: 'calc(50% - 8px)',
                transform: activeView === 'kanban' ? 'translateX(-4px)' : 'none',
              }}
            />
            <button
              onClick={() => setActiveView('list')}
              className={`relative z-10 flex items-center justify-center px-3 py-1 text-xs font-medium rounded-lg transition-all duration-300 w-11
                ${activeView === 'list' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
            >
              <FiList className={`${activeView === 'list' ? 'animate-pulse' : ''}`} />
            </button>
            <button
              onClick={() => setActiveView('kanban')}
              className={`relative z-10 flex items-center justify-center px-3 py-1 text-xs font-medium rounded-lg transition-all duration-300 w-11
                ${activeView === 'kanban' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
            >
              <FiGrid className={`${activeView === 'kanban' ? 'animate-pulse' : ''}`} />
            </button>
          </div>
          <button
            className={`p-2 rounded-xl shadow-sm transition-all duration-300 ${activeTheme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          >
            {activeTheme === 'dark' ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'list' ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {demoTasks.map(task => (
              <div 
                key={task.id} 
                className={`p-3 rounded-lg border ${activeTheme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'} flex items-center justify-between animate-pulse-subtle`}
              >
                <div className="flex items-center">
                  <span className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${task.completed ? 'border-green-500 bg-green-500/20' : 'border-gray-400'}`}>
                    {task.completed && <FiCheckCircle className="w-3 h-3 text-green-500" />}
                  </span>
                  <span className={`${task.completed ? 'line-through text-gray-500' : activeTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {task.title}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.priority === 'alta' 
                    ? 'bg-red-500/20 text-red-500' 
                    : 'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="kanban-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className={`p-3 rounded-lg ${activeTheme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <h4 className={`font-medium mb-2 ${activeTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Pendentes</h4>
              <div className="space-y-2">
                {demoTasks.filter(t => !t.completed).map(task => (
                  <div 
                    key={task.id} 
                    className={`p-2 rounded ${activeTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
                  >
                    <p className={`text-sm ${activeTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{task.title}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${
                      task.priority === 'alta' 
                        ? 'bg-red-500/20 text-red-500' 
                        : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${activeTheme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <h4 className={`font-medium mb-2 ${activeTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Em progresso</h4>
              <div className={`p-3 h-20 rounded-lg border-2 border-dashed flex items-center justify-center ${activeTheme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                <p className="text-sm">Arraste itens aqui</p>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${activeTheme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <h4 className={`font-medium mb-2 ${activeTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Concluídas</h4>
              <div className="space-y-2">
                {demoTasks.filter(t => t.completed).map(task => (
                  <div 
                    key={task.id} 
                    className={`p-2 rounded ${activeTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
                  >
                    <p className={`text-sm line-through ${activeTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{task.title}</p>
                    <div className="flex items-center mt-1">
                      <FiCheckCircle className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-500">Concluída</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-gray-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            ToDoApp
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-10 text-indigo-100">
            Transforme sua produtividade com um gerenciador de tarefas inteligente, personalizável e fácil de usar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/login">
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium shadow-lg hover:shadow-indigo-500/30 transition-all"
              >
                Entrar
              </motion.button>
            </Link>
            <Link href="/auth/register">
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white hover:bg-gray-100 rounded-lg text-indigo-700 font-medium shadow-lg transition-all flex items-center"
              >
                Criar conta grátis <FiArrowRight className="ml-2" />
              </motion.button>
            </Link>
          </div>

          <FeatureDemo />
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Recursos principais</h2>
            <p className="text-xl text-indigo-200 max-w-2xl mx-auto">
              Tudo o que você precisa para organizar sua vida pessoal e profissional em um único aplicativo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800 p-6 rounded-xl hover:bg-gray-750 transition-all hover:shadow-lg"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">O que nossos usuários dizem</h2>
            <p className="text-xl text-indigo-200 max-w-2xl mx-auto">
              Milhares de usuários já transformaram sua produtividade com nossa plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Nunca imaginei que organizar tarefas pudesse ser tão intuitivo. Finalmente encontrei um app que se adapta ao meu fluxo de trabalho!",
                author: "Maria S.",
                role: "Designer Freelancer"
              },
              {
                quote: "O visual Kanban revolucionou minha forma de trabalhar. Consigo visualizar todo meu fluxo de atividades e me sinto muito mais produtivo.",
                author: "Carlos L.",
                role: "Gerente de Projetos"
              },
              {
                quote: "O acesso offline é incrível! Mesmo quando estou sem conexão, consigo manter minha produtividade. Recomendo para todos!",
                author: "Ana P.",
                role: "Estudante de Medicina"
              }
            ].map((testimonial, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900 p-6 rounded-xl shadow-lg"
              >
                <p className="italic text-gray-300 mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-medium text-white">{testimonial.author}</p>
                  <p className="text-indigo-400 text-sm">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-indigo-800 to-purple-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Comece a organizar sua vida hoje</h2>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
            Junte-se a milhares de usuários que transformaram sua produtividade com ToDoApp.
          </p>
          <Link href="/auth/register">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white hover:bg-gray-100 rounded-lg text-indigo-700 font-medium shadow-lg text-lg transition-all flex items-center mx-auto"
            >
              Criar conta grátis <FiArrowRight className="ml-2" />
            </motion.button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">ToDoApp</h3>
              <p className="text-gray-400 mt-2">Organize sua vida com eficiência.</p>
            </div>
            <div className="mt-6 md:mt-0">
              <ul className="flex space-x-6">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Termos</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Ajuda</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
            &copy; {new Date().getFullYear()} ToDoApp. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
} 