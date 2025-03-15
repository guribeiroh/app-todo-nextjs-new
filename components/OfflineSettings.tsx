import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSettings, FiCheck, FiClock, FiCloud, FiDatabase, FiWifi, FiShield } from 'react-icons/fi';

interface OfflineSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  syncInterval: number;
  onSyncIntervalChange: (interval: number) => void;
  autoSync: boolean;
  onAutoSyncChange: (enabled: boolean) => void;
  offlineMode: boolean;
  onOfflineModeChange: (enabled: boolean) => void;
  encryptData: boolean;
  onEncryptDataChange: (enabled: boolean) => void;
}

const OfflineSettings: React.FC<OfflineSettingsProps> = ({
  isOpen,
  onClose,
  syncInterval = 5,
  onSyncIntervalChange,
  autoSync = true,
  onAutoSyncChange,
  offlineMode = false,
  onOfflineModeChange,
  encryptData = true,
  onEncryptDataChange
}) => {
  const [tempSyncInterval, setTempSyncInterval] = useState(syncInterval);

  const handleSave = () => {
    onSyncIntervalChange(tempSyncInterval);
    onClose();
  };

  // Reiniciar valores temporários quando o modal abre
  React.useEffect(() => {
    if (isOpen) {
      setTempSyncInterval(syncInterval);
    }
  }, [isOpen, syncInterval]);

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
            className="bg-dark-lighter w-full max-w-xl rounded-xl shadow-xl border border-dark-accent/50 overflow-hidden"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-dark-accent/50 p-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FiSettings className="text-primary" size={20} />
                Configurações de Sincronização
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-dark-accent/50 transition-colors"
                aria-label="Fechar"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/20 text-primary mt-0.5">
                      <FiCloud size={20} />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Sincronização Automática</h3>
                      <p className="text-gray-400 text-sm mt-0.5">
                        Sincroniza suas tarefas automaticamente com a nuvem
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={autoSync}
                      onChange={() => onAutoSyncChange(!autoSync)}
                    />
                    <div className="w-11 h-6 bg-dark-accent peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {autoSync && (
                  <div className="ml-9 bg-dark-accent/20 p-4 rounded-lg border border-dark-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <FiClock size={16} className="text-primary" />
                      <h4 className="text-gray-200 font-medium">Intervalo de Sincronização</h4>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">
                      Sincronizar a cada {tempSyncInterval} minutos
                    </p>
                    <input
                      type="range"
                      min={1}
                      max={60}
                      step={1}
                      value={tempSyncInterval}
                      onChange={(e) => setTempSyncInterval(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-dark-accent rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1m</span>
                      <span>15m</span>
                      <span>30m</span>
                      <span>60m</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/20 text-primary mt-0.5">
                    <FiWifi size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Modo Offline</h3>
                    <p className="text-gray-400 text-sm mt-0.5">
                      Desativa todas as tentativas de sincronização
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={offlineMode}
                    onChange={() => onOfflineModeChange(!offlineMode)}
                  />
                  <div className="w-11 h-6 bg-dark-accent peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/20 text-primary mt-0.5">
                    <FiShield size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Criptografar Dados</h3>
                    <p className="text-gray-400 text-sm mt-0.5">
                      Protege seus dados com criptografia de ponta a ponta
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={encryptData}
                    onChange={() => onEncryptDataChange(!encryptData)}
                  />
                  <div className="w-11 h-6 bg-dark-accent peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/20 text-primary mt-0.5">
                    <FiDatabase size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Armazenamento Local</h3>
                    <p className="text-gray-400 text-sm mt-0.5">
                      <span className="text-gray-300 font-medium">42 KB</span> usados de <span className="text-gray-300 font-medium">5 MB</span> disponíveis
                    </p>
                  </div>
                </div>
                <button className="btn bg-dark-accent/80 text-gray-300 hover:bg-dark-accent text-sm py-1.5">
                  Limpar
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-dark-accent/50 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="btn bg-dark-accent text-gray-300 hover:bg-dark-lighter"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary flex items-center gap-1.5"
              >
                <FiCheck size={18} />
                Salvar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineSettings; 