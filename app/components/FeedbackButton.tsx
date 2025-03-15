import React, { useState } from 'react';
import { FiMessageSquare, FiX, FiSmile, FiMeh, FiFrown, FiSend } from 'react-icons/fi';

interface FeedbackButtonProps {
  position?: 'bottom-right' | 'bottom-left';
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'positive' | 'neutral' | 'negative' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const positionClass = position === 'bottom-right' 
    ? 'right-6 bottom-6' 
    : 'left-6 bottom-6';
  
  const handleToggle = () => {
    setIsOpen(!isOpen);
    // Reset state when reopening
    if (!isOpen) {
      setFeedbackType(null);
      setFeedbackText('');
      setIsSubmitted(false);
    }
  };
  
  const handleSubmit = () => {
    if (!feedbackType) return;
    
    setIsSubmitting(true);
    
    // Simular envio para um servidor
    setTimeout(() => {
      // Aqui você poderia enviar para um backend ou API
      console.log('Feedback enviado:', {
        type: feedbackType,
        text: feedbackText,
        date: new Date().toISOString()
      });
      
      // Salvar no localStorage para histórico
      const feedbackHistory = JSON.parse(localStorage.getItem('feedbackHistory') || '[]');
      feedbackHistory.push({
        type: feedbackType,
        text: feedbackText,
        date: new Date().toISOString()
      });
      localStorage.setItem('feedbackHistory', JSON.stringify(feedbackHistory));
      
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Fechar automaticamente após alguns segundos
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    }, 1000);
  };
  
  return (
    <div className={`fixed ${positionClass} z-50`}>
      {/* Botão Principal */}
      <button
        onClick={handleToggle}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-colors duration-300 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
        aria-label="Feedback"
      >
        {isOpen ? (
          <FiX className="text-white" size={24} />
        ) : (
          <FiMessageSquare className="text-white" size={22} />
        )}
      </button>
      
      {/* Painel de Feedback */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 overflow-hidden">
          {!isSubmitted ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                O que você achou das novas funcionalidades?
              </h3>
              
              <div className="flex justify-around mb-4">
                <button
                  onClick={() => setFeedbackType('positive')}
                  className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                    feedbackType === 'positive' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-500' 
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiSmile size={28} />
                  <span className="text-xs mt-1">Gostei</span>
                </button>
                
                <button
                  onClick={() => setFeedbackType('neutral')}
                  className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                    feedbackType === 'neutral' 
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500' 
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiMeh size={28} />
                  <span className="text-xs mt-1">Neutro</span>
                </button>
                
                <button
                  onClick={() => setFeedbackType('negative')}
                  className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                    feedbackType === 'negative' 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-500' 
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiFrown size={28} />
                  <span className="text-xs mt-1">Não gostei</span>
                </button>
              </div>
              
              {feedbackType && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Seus comentários (opcional)
                    </label>
                    <textarea
                      id="feedback"
                      rows={3}
                      placeholder="Conte-nos mais sobre sua experiência..."
                      className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                    />
                  </div>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FiSend className="mr-2" size={16} />
                        Enviar feedback
                      </span>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Obrigado pelo feedback!
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Sua opinião é muito importante para continuarmos melhorando.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackButton; 