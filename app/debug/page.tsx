'use client';

import React, { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

export default function DebugPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('Tarefa de teste');
  const [listId, setListId] = useState('');
  const [lists, setLists] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Verificar sessão
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user.id || null);
      
      // Carregar listas
      const { data: listsData } = await supabase.from('task_lists').select('*');
      if (listsData && listsData.length > 0) {
        setLists(listsData);
        setListId(listsData[0].id);
      }
    }
    
    checkSession();
  }, []);

  const addTask = async () => {
    setError(null);
    setSuccess(null);
    setResult(null);
    
    try {
      console.log('Tentando adicionar tarefa com os seguintes dados:');
      console.log({
        title: taskTitle,
        list_id: listId,
        user_id: userId || 'anonymous_user',
        completed: false,
        position: 0,
        tags: []
      });
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskTitle,
          list_id: listId,
          user_id: userId || 'anonymous_user',
          completed: false,
          position: 0,
          tags: []
        })
        .select()
        .single();
        
      if (error) {
        console.error('Erro ao adicionar tarefa:', error);
        setError(`Erro: ${error.message}`);
        setResult(error);
      } else {
        console.log('Tarefa adicionada com sucesso:', data);
        setSuccess('Tarefa adicionada com sucesso!');
        setResult(data);
      }
    } catch (e: any) {
      console.error('Exceção ao adicionar tarefa:', e);
      setError(`Exceção: ${e.message}`);
      setResult(e);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Página de Debug - Teste de Adição de Tarefas</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded-md">
        <h2 className="font-semibold mb-2">Status da Sessão:</h2>
        <p>User ID: {userId || 'Não autenticado (será usado anonymous_user)'}</p>
      </div>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block mb-1">Título da Tarefa:</label>
          <Input 
            value={taskTitle} 
            onChange={e => setTaskTitle(e.target.value)} 
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block mb-1">Lista:</label>
          <select 
            value={listId} 
            onChange={e => setListId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {lists.map(list => (
              <option key={list.id} value={list.id}>
                {list.name} ({list.id})
              </option>
            ))}
          </select>
        </div>
        
        <Button 
          onClick={addTask}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Adicionar Tarefa
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      {result && (
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Resultado:</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 