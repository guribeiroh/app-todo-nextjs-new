import { useCallback, useMemo, useRef } from 'react';

/**
 * Hook personalizado para selecionar e memoizar partes específicas de um estado.
 * Isso evita re-renderizações desnecessárias quando apenas partes do estado mudam.
 * 
 * @param state O estado completo
 * @param selector Função seletora que extrai a parte desejada do estado
 * @returns A parte selecionada do estado, memoizada
 */
export function useMemoizedSelector<State, Selected>(
  state: State,
  selector: (state: State) => Selected
): Selected {
  // Armazenar a última versão do estado selecionado
  const lastSelectedState = useRef<Selected | undefined>(undefined);
  const lastFullState = useRef<State | undefined>(undefined);
  
  // Memoizar o selector para evitar recriação
  const memoizedSelector = useCallback(selector, [selector]);
  
  // Calcular o estado selecionado apenas se o estado completo mudar
  return useMemo(() => {
    // Verificar se o estado completo mudou
    if (lastFullState.current === state) {
      // Se não mudou, retornar o último estado selecionado
      return lastSelectedState.current as Selected;
    }
    
    // Atualizar referências e calcular novo estado selecionado
    lastFullState.current = state;
    const newSelectedState = memoizedSelector(state);
    lastSelectedState.current = newSelectedState;
    return newSelectedState;
  }, [state, memoizedSelector]);
}

/**
 * Hook especializado para selecionar uma tarefa específica por ID
 */
export function useTaskSelector<State extends { tasks: Array<{ id: string }> }, Selected>(
  state: State,
  taskId: string,
  selector: (task: State['tasks'][0]) => Selected
): Selected | undefined {
  return useMemoizedSelector(state, useCallback((state: State) => {
    const task = state.tasks.find(t => t.id === taskId);
    return task ? selector(task) : undefined;
  }, [taskId, selector]));
}

/**
 * Hook especializado para selecionar tarefas filtradas
 */
export function useFilteredTasksSelector<State extends { tasks: any[], filter: any }>(
  state: State,
  filterFn: (tasks: State['tasks'], filter: State['filter']) => any[]
): any[] {
  return useMemoizedSelector(state, useCallback((state: State) => {
    return filterFn(state.tasks, state.filter);
  }, [filterFn]));
}

export default useMemoizedSelector; 