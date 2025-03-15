import { useState, useCallback, useEffect } from 'react';

interface VirtualListOptions {
  itemHeight: number;
  overScan?: number;
  windowHeight?: number;
  initialPosition?: number;
}

interface ItemMeta {
  index: number;
  start: number;
  height: number;
  measured: boolean;
}

/**
 * Hook personalizado para virtualização eficiente de listas
 * Melhora drasticamente o desempenho ao renderizar apenas os itens visíveis
 * 
 * @param items Array de itens a serem renderizados
 * @param options Opções para configurar a virtualização
 * @returns Informações para renderizar a lista virtual
 */
export default function useVirtualList<T>(items: T[], options: VirtualListOptions) {
  const { 
    itemHeight, 
    overScan = 5, 
    windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800,
    initialPosition = 0
  } = options;

  const [scrollTop, setScrollTop] = useState(initialPosition);
  const [measuredItems, setMeasuredItems] = useState<ItemMeta[]>([]);
  
  // Inicialização e atualização de metadados de itens
  useEffect(() => {
    // Gera metadados iniciais para todos os itens
    const newItemsMeta = items.map((_, index) => ({
      index,
      start: index * itemHeight,
      height: itemHeight,
      measured: false
    }));
    
    setMeasuredItems(newItemsMeta);
  }, [items.length, itemHeight]);

  // Calcula a altura total da lista
  const totalHeight = measuredItems.length > 0 
    ? measuredItems[measuredItems.length - 1].start + measuredItems[measuredItems.length - 1].height
    : items.length * itemHeight;

  // Calcula quais itens estão visíveis
  const visibleItems = useCallback(() => {
    if (measuredItems.length === 0) return [];

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overScan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + windowHeight) / itemHeight) + overScan
    );

    return items
      .slice(startIndex, endIndex + 1)
      .map((item, idx) => {
        const virtualIndex = startIndex + idx;
        const meta = measuredItems[virtualIndex];
        
        return {
          item,
          index: virtualIndex,
          style: {
            position: 'absolute',
            top: 0,
            transform: `translateY(${meta.start}px)`,
            width: '100%',
            height: `${meta.height}px`
          }
        };
      });
  }, [items, measuredItems, scrollTop, windowHeight, itemHeight, overScan]);

  // Handler para atualizar a posição de rolagem
  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  // Função para medir a altura real de um item
  const measureItem = useCallback((index: number, height: number) => {
    setMeasuredItems(prev => {
      // Se a altura não mudou, não faça nada
      if (prev[index] && prev[index].height === height && prev[index].measured) {
        return prev;
      }

      // Crie uma cópia para atualizar
      const newMeasuredItems = [...prev];
      
      // Atualize a altura do item
      newMeasuredItems[index] = {
        ...newMeasuredItems[index],
        height,
        measured: true
      };
      
      // Recalcule as posições de início para os itens seguintes
      for (let i = index + 1; i < newMeasuredItems.length; i++) {
        newMeasuredItems[i] = {
          ...newMeasuredItems[i],
          start: newMeasuredItems[i - 1].start + newMeasuredItems[i - 1].height
        };
      }
      
      return newMeasuredItems;
    });
  }, []);

  return {
    visibleItems: visibleItems(),
    totalHeight,
    onScroll,
    measureItem,
    scrollTop
  };
} 