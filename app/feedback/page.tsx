"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { FeedbackForm, FeedbackData } from '../components/FeedbackForm';
import { FiMessageSquare, FiThumbsUp, FiSend, FiArrowLeft } from 'react-icons/fi';

export default function FeedbackPage() {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'geral' | 'desempenho' | 'recursos' | 'interface' | 'bug' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmitFeedback = (data: FeedbackData) => {
    // Em um aplicativo real, aqui você enviaria o feedback para um backend
    console.log('Feedback recebido:', data);
    
    // Simular o envio de feedback
    setTimeout(() => {
      setShowFeedbackForm(false);
      setSuccessMessage(`Agradecemos seu feedback sobre "${data.category}"! Nossa equipe irá analisá-lo com atenção.`);
      
      // Limpar a mensagem de sucesso após alguns segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 8000);
    }, 1000);
  };

  const handleOpenFeedbackForm = (type: 'geral' | 'desempenho' | 'recursos' | 'interface' | 'bug') => {
    setFeedbackType(type);
    setShowFeedbackForm(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {showFeedbackForm && (
        <FeedbackForm
          onClose={() => setShowFeedbackForm(false)}
          onSubmit={handleSubmitFeedback}
        />
      )}

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center">
            <FiMessageSquare className="mr-2" /> Feedback do NeoTask
          </h1>
          <Link href="/" className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition flex items-center">
            <FiArrowLeft className="mr-2" /> Voltar ao App
          </Link>
        </div>

        {successMessage && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg flex items-start">
            <FiThumbsUp className="text-xl mr-3 mt-1" />
            <div>
              <p className="font-medium">{successMessage}</p>
              <p className="text-sm opacity-80 mt-1">
                Seu feedback ajuda a melhorar o NeoTask para todos os usuários.
              </p>
            </div>
          </div>
        )}

        <div className="prose dark:prose-invert prose-lg max-w-none mb-12">
          <p className="lead text-xl">
            Sua opinião é fundamental para melhorarmos continuamente o NeoTask. 
            Compartilhe suas experiências, ideias ou problemas que encontrou.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4">Feedback Geral</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Compartilhe sua experiência geral com o NeoTask, o que você mais gosta e o que poderíamos melhorar.
            </p>
            <button
              onClick={() => handleOpenFeedbackForm('geral')}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition flex items-center w-full justify-center"
            >
              <FiSend className="mr-2" /> Enviar Feedback
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4">Sugerir Recursos</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Tem uma ideia para um novo recurso ou melhoria? Adoraríamos ouvir suas sugestões para o NeoTask.
            </p>
            <button
              onClick={() => handleOpenFeedbackForm('recursos')}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition flex items-center w-full justify-center"
            >
              <FiSend className="mr-2" /> Sugerir Recurso
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4">Reportar Problema</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Encontrou um bug ou problema? Ajude-nos a corrigir enviando um relatório detalhado do problema.
            </p>
            <button
              onClick={() => handleOpenFeedbackForm('bug')}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition flex items-center w-full justify-center"
            >
              <FiSend className="mr-2" /> Reportar Bug
            </button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Comentários sobre Interface</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Como você se sente em relação à interface do usuário do NeoTask? É intuitiva, atraente e fácil de usar?
            </p>
            <button
              onClick={() => handleOpenFeedbackForm('interface')}
              className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center"
            >
              <FiSend className="mr-2" /> Feedback sobre UI/UX
            </button>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Desempenho do Aplicativo</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              O NeoTask está rápido e responsivo em seu dispositivo? Compartilhe sua experiência sobre o desempenho.
            </p>
            <button
              onClick={() => handleOpenFeedbackForm('desempenho')}
              className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition flex items-center"
            >
              <FiSend className="mr-2" /> Feedback sobre Desempenho
            </button>
          </div>
        </div>

        <div className="mt-16 mb-8 p-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-xl">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Ajude a moldar o futuro do NeoTask</h2>
            <p className="mb-6 text-lg">
              Valorizamos muito seu feedback. Cada sugestão, ideia ou relatório de problema ajuda a tornar 
              o NeoTask melhor para todos. Obrigado por dedicar seu tempo para compartilhar sua opinião!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/melhorias/novas-melhorias" 
                className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition shadow-lg"
              >
                Ver Próximas Melhorias
              </Link>
              <Link 
                href="/" 
                className="px-6 py-2 bg-indigo-700 text-white rounded-lg font-medium hover:bg-indigo-800 transition shadow-lg"
              >
                Voltar ao NeoTask
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 