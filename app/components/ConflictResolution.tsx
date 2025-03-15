'use client';

import React, { useState } from 'react';
import { 
  IoCloudUpload, 
  IoCloudDownload, 
  IoClose, 
  IoCheckmarkDone, 
  IoAlertCircle, 
  IoChevronDown, 
  IoChevronUp 
} from 'react-icons/io5';

// Interface para itens em conflito
interface ConflictItem {
  id: string;
  entityType: 'task' | 'list' | 'tag';
  localData: any;
  remoteData: any;
  resolved?: boolean;
  resolution?: 'local' | 'remote' | 'merge';
}

interface ConflictResolutionProps {
  conflicts: ConflictItem[];
  onResolve: (resolvedConflicts: ConflictItem[]) => void;
  onCancel: () => void;
}

export default function ConflictResolution({ conflicts, onResolve, onCancel }: ConflictResolutionProps) {
  const [resolvedConflicts, setResolvedConflicts] = useState<ConflictItem[]>(conflicts);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Calcular o número de conflitos resolvidos
  const resolvedCount = resolvedConflicts.filter(c => c.resolved).length;
  const totalCount = resolvedConflicts.length;
  const allResolved = resolvedCount === totalCount;
  
  // Resolver um conflito específico
  const resolveConflict = (id: string, resolution: 'local' | 'remote' | 'merge') => {
    setResolvedConflicts(prev => 
      prev.map(conflict => 
        conflict.id === id 
          ? { ...conflict, resolution, resolved: true } 
          : conflict
      )
    );
  };
  
  // Resolver todos os conflitos restantes usando a mesma estratégia
  const resolveAll = (resolution: 'local' | 'remote') => {
    setResolvedConflicts(prev => 
      prev.map(conflict => 
        conflict.resolved 
          ? conflict 
          : { ...conflict, resolution, resolved: true }
      )
    );
  };
  
  // Alternar visualização expandida de um item
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Mostrar o título apropriado para o tipo de entidade
  const getEntityTitle = (entityType: string, data: any) => {
    switch (entityType) {
      case 'task':
        return data.title || 'Tarefa sem título';
      case 'list':
        return data.name || 'Lista sem nome';
      case 'tag':
        return data.name || data || 'Tag sem nome';
      default:
        return 'Item desconhecido';
    }
  };
  
  // Formatar diferenças entre versões local e remota
  const formatDiff = (local: any, remote: any, entityType: string) => {
    if (!local || !remote) return [];
    
    const diffs = [];
    
    // Comparar propriedades comuns
    if (entityType === 'task') {
      if (local.title !== remote.title) {
        diffs.push({
          field: 'Título',
          local: local.title,
          remote: remote.title
        });
      }
      
      if (local.description !== remote.description) {
        diffs.push({
          field: 'Descrição',
          local: local.description || '(vazio)',
          remote: remote.description || '(vazio)'
        });
      }
      
      if (local.status !== remote.status) {
        diffs.push({
          field: 'Status',
          local: local.status,
          remote: remote.status
        });
      }
      
      if (local.priority !== remote.priority) {
        diffs.push({
          field: 'Prioridade',
          local: local.priority,
          remote: remote.priority
        });
      }
      
      if (local.dueDate !== remote.dueDate) {
        diffs.push({
          field: 'Data de vencimento',
          local: local.dueDate 
            ? new Date(local.dueDate).toLocaleDateString() 
            : '(sem data)',
          remote: remote.dueDate 
            ? new Date(remote.dueDate).toLocaleDateString() 
            : '(sem data)'
        });
      }
      
      // Comparar tags
      if (JSON.stringify(local.tags) !== JSON.stringify(remote.tags)) {
        diffs.push({
          field: 'Tags',
          local: local.tags?.length ? local.tags.join(', ') : '(sem tags)',
          remote: remote.tags?.length ? remote.tags.join(', ') : '(sem tags)'
        });
      }
    } else if (entityType === 'list') {
      if (local.name !== remote.name) {
        diffs.push({
          field: 'Nome',
          local: local.name,
          remote: remote.name
        });
      }
      
      if (local.color !== remote.color) {
        diffs.push({
          field: 'Cor',
          local: local.color,
          remote: remote.color
        });
      }
    }
    
    return diffs;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Resolução de Conflitos
          </h2>
          <button
            onClick={onCancel}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
          >
            <IoClose size={24} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
            <div className="flex">
              <IoAlertCircle className="mr-3 mt-0.5 h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium">Conflitos Detectados</p>
                <p className="mt-1">
                  Foram encontrados conflitos entre suas mudanças locais e as versões remotas.
                  Por favor, revise cada conflito e escolha a versão a manter.
                </p>
                <p className="mt-2">
                  Progresso: {resolvedCount} de {totalCount} resolvidos
                </p>
              </div>
            </div>
          </div>
          
          {/* Lista de conflitos */}
          <div className="max-h-[50vh] space-y-4 overflow-y-auto">
            {resolvedConflicts.map((conflict) => (
              <div
                key={conflict.id}
                className={`rounded-md border p-4 ${
                  conflict.resolved
                    ? 'border-green-200 bg-green-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      {conflict.resolved && (
                        <IoCheckmarkDone className="mr-2 text-green-500" size={20} />
                      )}
                      <h3 className="text-lg font-medium">
                        {getEntityTitle(conflict.entityType, conflict.localData)}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {conflict.entityType === 'task' 
                        ? 'Tarefa' 
                        : conflict.entityType === 'list' 
                        ? 'Lista' 
                        : 'Tag'}
                    </p>
                  </div>
                  
                  {conflict.resolved ? (
                    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      {conflict.resolution === 'local' 
                        ? 'Versão Local' 
                        : conflict.resolution === 'remote' 
                        ? 'Versão Remota' 
                        : 'Mesclado'}
                    </span>
                  ) : (
                    <button
                      onClick={() => toggleExpand(conflict.id)}
                      className="flex items-center rounded-md px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
                    >
                      {expandedItems[conflict.id] 
                        ? <IoChevronUp className="mr-1" /> 
                        : <IoChevronDown className="mr-1" />}
                      {expandedItems[conflict.id] ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                    </button>
                  )}
                </div>
                
                {/* Detalhes do conflito */}
                {expandedItems[conflict.id] && !conflict.resolved && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-medium">Diferenças:</h4>
                    <div className="rounded-md border border-gray-200">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Campo</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Versão Local</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Versão Remota</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formatDiff(conflict.localData, conflict.remoteData, conflict.entityType).map((diff, index) => (
                            <tr key={index} className="border-b border-gray-200">
                              <td className="px-4 py-2 font-medium">{diff.field}</td>
                              <td className="px-4 py-2">{diff.local}</td>
                              <td className="px-4 py-2">{diff.remote}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => resolveConflict(conflict.id, 'local')}
                        className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <IoCloudUpload className="mr-2" />
                        Usar Versão Local
                      </button>
                      <button
                        onClick={() => resolveConflict(conflict.id, 'remote')}
                        className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <IoCloudDownload className="mr-2" />
                        Usar Versão Remota
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between border-t border-gray-200 p-4">
          <div>
            {!allResolved && (
              <div className="flex space-x-2">
                <button
                  onClick={() => resolveAll('local')}
                  className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <IoCloudUpload className="mr-2" />
                  Usar Versão Local para todos
                </button>
                <button
                  onClick={() => resolveAll('remote')}
                  className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <IoCloudDownload className="mr-2" />
                  Usar Versão Remota para todos
                </button>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onCancel}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => onResolve(resolvedConflicts)}
              disabled={!allResolved}
              className={`rounded-md px-4 py-2 text-sm text-white ${
                allResolved
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'cursor-not-allowed bg-gray-400'
              }`}
            >
              Aplicar Resoluções
              {!allResolved && ` (${resolvedCount}/${totalCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 