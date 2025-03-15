"use client";

import React, { useState } from 'react';
import { FiStar, FiSmile, FiMeh, FiFrown, FiSend, FiX } from 'react-icons/fi';

interface FeedbackFormProps {
  onClose: () => void;
  onSubmit: (data: FeedbackData) => void;
}

export interface FeedbackData {
  rating: number;
  satisfaction: 'satisfied' | 'neutral' | 'unsatisfied';
  feedback: string;
  email?: string;
  category: 'geral' | 'desempenho' | 'recursos' | 'interface' | 'bug';
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose, onSubmit }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [satisfaction, setSatisfaction] = useState<'satisfied' | 'neutral' | 'unsatisfied' | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [category, setCategory] = useState<'geral' | 'desempenho' | 'recursos' | 'interface' | 'bug'>('geral');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Por favor, forneça uma avaliação em estrelas');
      return;
    }
    
    if (!satisfaction) {
      setError('Por favor, indique seu nível de satisfação');
      return;
    }
    
    if (feedback.trim().length < 10) {
      setError('Por favor, forneça um feedback mais detalhado (mínimo 10 caracteres)');
      return;
    }
    
    setError(null);
    
    onSubmit({
      rating,
      satisfaction,
      feedback,
      email: email || undefined,
      category
    });
    
    setSubmitted(true);
  };

  const renderStar = (position: number) => {
    const filled = position <= (hoveredRating || rating);
    return (
      <FiStar 
        className={`text-2xl cursor-pointer transition-all duration-200 ${
          filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'
        } ${filled ? 'transform scale-110' : ''}`}
        onClick={() => setRating(position)}
        onMouseEnter={() => setHoveredRating(position)}
        onMouseLeave={() => setHoveredRating(0)}
      />
    );
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-xl">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FiX className="text-xl" />
            </button>
          </div>
          
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiSmile className="text-4xl text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Obrigado pelo seu feedback!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sua opinião é extremamente valiosa para melhorarmos o NeoTask.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Sua opinião é importante</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Como você avalia sua experiência?</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num}>{renderStar(num)}</div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Qual seu nível de satisfação?</label>
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => setSatisfaction('satisfied')}
                className={`p-3 rounded-full ${
                  satisfaction === 'satisfied'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                <FiSmile className="text-2xl" />
              </button>
              <button
                type="button"
                onClick={() => setSatisfaction('neutral')}
                className={`p-3 rounded-full ${
                  satisfaction === 'neutral'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                <FiMeh className="text-2xl" />
              </button>
              <button
                type="button"
                onClick={() => setSatisfaction('unsatisfied')}
                className={`p-3 rounded-full ${
                  satisfaction === 'unsatisfied'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                <FiFrown className="text-2xl" />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            >
              <option value="geral">Feedback Geral</option>
              <option value="desempenho">Desempenho</option>
              <option value="recursos">Recursos</option>
              <option value="interface">Interface do Usuário</option>
              <option value="bug">Reportar Bug</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Seu feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="O que você gostou? O que podemos melhorar?"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md h-32 bg-white dark:bg-gray-700"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Seu email (opcional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Caso queira receber uma resposta"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition flex items-center"
            >
              <FiSend className="mr-2" /> Enviar Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 