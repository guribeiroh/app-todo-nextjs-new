import React from 'react';
import { FiX } from 'react-icons/fi';

interface KeyboardShortcutsProps {
  onClose: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onClose }) => {
  // Atalhos de teclado agrupados por categoria
  const shortcutGroups = [
    {
      title: 'Navegação',
      shortcuts: [
        { key: '⌘ / Ctrl + /', description: 'Alternar menu lateral' },
        { key: '⌘ / Ctrl + K', description: 'Pesquisa global' },
        { key: '⌘ / Ctrl + C', description: 'Abrir visualização de calendário' },
        { key: '⌘ / Ctrl + B', description: 'Abrir dashboard de produtividade' },
      ]
    },
    {
      title: 'Tarefas',
      shortcuts: [
        { key: 'N', description: 'Criar nova tarefa (foco no formulário)' },
        { key: 'E', description: 'Editar tarefa selecionada' },
        { key: 'Del / Backspace', description: 'Excluir tarefa selecionada' },
        { key: 'Space', description: 'Marcar/desmarcar tarefa' },
        { key: 'Tab', description: 'Próxima tarefa na lista' },
        { key: 'Shift + Tab', description: 'Tarefa anterior na lista' },
      ]
    },
    {
      title: 'Modo Foco',
      shortcuts: [
        { key: '⌘ / Ctrl + F', description: 'Entrar/sair do modo foco' },
        { key: 'Space', description: 'Iniciar/pausar temporizador no modo foco' },
        { key: 'S', description: 'Pular sessão atual no modo foco' },
        { key: 'Esc', description: 'Sair do modo foco' },
      ]
    },
    {
      title: 'Filtros',
      shortcuts: [
        { key: 'A', description: 'Ver todas as tarefas' },
        { key: 'T', description: 'Ver tarefas de hoje' },
        { key: 'W', description: 'Ver tarefas da semana' },
        { key: 'C', description: 'Ver tarefas concluídas' },
      ]
    },
    {
      title: 'Personalização',
      shortcuts: [
        { key: '⌘ / Ctrl + D', description: 'Alternar modo escuro/claro' },
        { key: '⌘ / Ctrl + T', description: 'Gerenciar tags' },
        { key: '⌘ / Ctrl + H', description: 'Abrir tutorial interativo' },
      ]
    },
    {
      title: 'Avançado',
      shortcuts: [
        { key: '⌘ / Ctrl + S', description: 'Forçar salvamento' },
        { key: '⌘ / Ctrl + P', description: 'Imprimir lista atual' },
        { key: '⌘ / Ctrl + O', description: 'Importar dados' },
        { key: '⌘ / Ctrl + E', description: 'Exportar dados' },
      ]
    },
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden max-w-2xl w-full max-h-[calc(100vh-2rem)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Atalhos de Teclado</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Fechar"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-10rem)]">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Use estes atalhos de teclado para aumentar sua produtividade no NeoTask.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcutGroups.map((group, index) => (
              <div key={index} className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center">
                      <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 min-w-[80px] text-center">
                        {shortcut.key}
                      </kbd>
                      <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                        {shortcut.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              <strong>Dica:</strong> Pressione <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">?</kbd> a qualquer momento para abrir esta tela de atalhos.
            </p>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}; 