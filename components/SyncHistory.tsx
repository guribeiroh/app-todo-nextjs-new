import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiClock, FiRefreshCw, FiInfo, FiArrowDown } from 'react-icons/fi';

type SyncEvent = {
  id: string;
  type: 'success' | 'error' | 'pending';
  description: string;
  timestamp: Date;
  details?: string;
};

interface SyncHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  events: SyncEvent[];
  lastSyncTime?: Date;
}

const SyncHistory: React.FC<SyncHistoryProps> = ({
  isOpen,
  onClose,
  events = [],
  lastSyncTime
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const formatSyncTime = (date?: Date) => {
    if (!date) return 'Nunca';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const eventIcons = {
    success: <FiCheck className="text-green-400" />,
    error: <FiX className="text-rose-400" />,
    pending: <FiRefreshCw className="text-amber-400 animate-spin" />
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-dark-lighter w-full max-w-lg rounded-xl shadow-xl border border-dark-accent/50 overflow-hidden"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-dark-accent/50 p-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FiInfo className="text-primary" size={20} />
                Histórico de Sincronização
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-dark-accent/50 transition-colors"
                aria-label="Fechar"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-dark-accent/50">
              <div className="flex items-center justify-between">
                <div className="text-gray-300 text-sm">
                  <span className="text-gray-400">Última sincronização:</span>
                  <div className="font-medium mt-1 flex items-center gap-2">
                    <FiClock className="text-primary" size={15} />
                    {formatSyncTime(lastSyncTime)}
                  </div>
                </div>
                <motion.button
                  className="btn bg-dark-accent/80 text-primary hover:bg-dark-accent flex items-center gap-1.5 text-sm py-1.5"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiRefreshCw size={15} />
                  Sincronizar Agora
                </motion.button>
              </div>
            </div>

            <div className="max-h-[350px] overflow-y-auto p-1">
              {events.length > 0 ? (
                <div className="divide-y divide-dark-accent/30">
                  {events.map(event => (
                    <motion.div
                      key={event.id}
                      className={`p-3 transition-colors hover:bg-dark-accent/20 cursor-pointer rounded-md ${
                        selectedEventId === event.id ? 'bg-dark-accent/40' : ''
                      }`}
                      onClick={() => setSelectedEventId(
                        selectedEventId === event.id ? null : event.id
                      )}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-full bg-dark-accent/60">
                            {eventIcons[event.type]}
                          </div>
                          <div>
                            <div className="text-gray-200 font-medium">{event.description}</div>
                            <div className="text-gray-400 text-xs mt-0.5">
                              {formatSyncTime(event.timestamp)}
                            </div>
                          </div>
                        </div>
                        {event.details && (
                          <motion.div
                            animate={{ rotate: selectedEventId === event.id ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <FiArrowDown size={16} className="text-gray-400" />
                          </motion.div>
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {selectedEventId === event.id && event.details && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 pt-3 border-t border-dark-accent/30 text-sm text-gray-400 overflow-hidden"
                          >
                            {event.details}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 mb-3 text-dark-accent/60">
                    <FiInfo size={48} />
                  </div>
                  <p className="text-gray-300">Nenhum evento de sincronização ainda.</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Os eventos aparecerão aqui à medida que você sincronizar seus dados.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-dark-accent/50 flex justify-end">
              <button
                onClick={onClose}
                className="btn btn-primary text-sm"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SyncHistory; 