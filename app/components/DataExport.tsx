import React, { useState, useRef } from 'react';
import { FiDownload, FiUpload, FiClipboard, FiCheck } from 'react-icons/fi';
import { Task, TaskList } from '../types';

interface DataExportProps {
  tasks: Task[];
  lists: TaskList[];
  tags: string[];
  onImport: (data: { tasks: Task[], lists: TaskList[], tags: string[] }) => void;
}

export const DataExport: React.FC<DataExportProps> = ({ tasks, lists, tags, onImport }) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prepara os dados para exportação
  const prepareExportData = () => {
    const exportData = {
      tasks,
      lists,
      tags,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    return exportData;
  };

  // Exportar para JSON
  const exportToJson = () => {
    const exportData = prepareExportData();
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Criar um Blob e um URL para download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Criar um link para download e clicar nele
    const link = document.createElement('a');
    link.href = url;
    link.download = `neotask-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Limpar após o download
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  // Exportar para CSV
  const exportToCsv = () => {
    // Cabeçalhos para o CSV
    const headers = ['id', 'title', 'description', 'completed', 'createdAt', 'dueDate', 'priority', 'tags', 'listId'];
    
    // Converter tarefas para linhas CSV
    const taskRows = tasks.map(task => [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`, // Escapar aspas
      task.description ? `"${task.description.replace(/"/g, '""')}"` : '',
      task.completed ? 'true' : 'false',
      task.createdAt.toISOString(),
      task.dueDate ? task.dueDate.toISOString() : '',
      task.priority,
      task.tags.length > 0 ? `"${task.tags.join(',')}"` : '',
      task.listId
    ]);
    
    // Criar o conteúdo CSV
    const csvContent = [
      headers.join(','),
      ...taskRows.map(row => row.join(','))
    ].join('\n');
    
    // Criar um Blob e um URL para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Criar um link para download e clicar nele
    const link = document.createElement('a');
    link.href = url;
    link.download = `neotask-tasks-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    
    // Limpar após o download
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  // Copiar para a área de transferência
  const copyToClipboard = () => {
    const exportData = prepareExportData();
    const jsonString = JSON.stringify(exportData, null, 2);
    
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        console.error('Falha ao copiar para a área de transferência:', err);
      });
  };

  // Importar de arquivo
  const importFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    setImportError(null);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        
        // Validar a estrutura dos dados
        if (!importedData.tasks || !importedData.lists) {
          throw new Error('Formato de arquivo inválido. Os dados devem conter tarefas e listas.');
        }
        
        // Converter strings de data para objetos Date
        const processedTasks = importedData.tasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined
        }));
        
        const processedLists = importedData.lists.map((list: any) => ({
          ...list,
          createdAt: new Date(list.createdAt)
        }));
        
        // Passar os dados para o callback de importação
        onImport({
          tasks: processedTasks,
          lists: processedLists,
          tags: importedData.tags || []
        });
        
        setImporting(false);
      } catch (error) {
        console.error('Erro ao importar dados:', error);
        setImportError('Falha ao importar dados. Verifique se o arquivo está no formato correto.');
        setImporting(false);
      }
    };
    
    reader.onerror = () => {
      setImportError('Erro ao ler o arquivo.');
      setImporting(false);
    };
    
    reader.readAsText(file);
    
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Exportar e Importar Dados</h3>
      
      {/* Opções de exportação */}
      <div className="mb-6">
        <button
          onClick={() => setShowExportOptions(!showExportOptions)}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-150"
        >
          <FiDownload /> Exportar Dados
        </button>
        
        {showExportOptions && (
          <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="json-format"
                  name="export-format"
                  checked={exportFormat === 'json'}
                  onChange={() => setExportFormat('json')}
                  className="text-blue-500"
                />
                <label htmlFor="json-format" className="cursor-pointer text-gray-700 dark:text-gray-300">
                  JSON (completo)
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="csv-format"
                  name="export-format"
                  checked={exportFormat === 'csv'}
                  onChange={() => setExportFormat('csv')}
                  className="text-blue-500"
                />
                <label htmlFor="csv-format" className="cursor-pointer text-gray-700 dark:text-gray-300">
                  CSV (apenas tarefas)
                </label>
              </div>
              
              <div className="mt-3 flex gap-2">
                <button
                  onClick={exportFormat === 'json' ? exportToJson : exportToCsv}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 px-3 rounded text-sm"
                >
                  Baixar {exportFormat.toUpperCase()}
                </button>
                
                {exportFormat === 'json' && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-1 bg-gray-500 hover:bg-gray-600 text-white py-1.5 px-3 rounded text-sm"
                  >
                    {copied ? <FiCheck /> : <FiClipboard />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                )}
              </div>
              
              {exportSuccess && (
                <div className="mt-2 text-center text-sm text-green-600 dark:text-green-400">
                  Dados exportados com sucesso!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Seção de importação */}
      <div>
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          Você pode importar seus dados de um arquivo JSON exportado anteriormente.
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded transition duration-150 disabled:opacity-50"
        >
          <FiUpload /> {importing ? 'Importando...' : 'Importar Dados'}
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={importFromFile}
          className="hidden"
        />
        
        {importError && (
          <div className="mt-2 text-sm text-red-600">
            {importError}
          </div>
        )}
      </div>
      
      {/* Informação adicional */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>Exportar seus dados permite que você:</p>
        <ul className="list-disc list-inside mt-1">
          <li>Faça backup de suas tarefas e listas</li>
          <li>Transfira seus dados para outro dispositivo</li>
          <li>Importe seus dados de volta em caso de perda</li>
        </ul>
      </div>
    </div>
  );
}; 