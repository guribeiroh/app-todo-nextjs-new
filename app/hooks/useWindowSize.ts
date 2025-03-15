import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  // Inicializa com valores padrão para evitar erro durante a renderização do servidor
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Garante que é executado apenas no cliente
    if (typeof window === 'undefined') {
      return;
    }

    // Handler para atualizar o estado quando a janela é redimensionada
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Adiciona o listener para o evento de resize
    window.addEventListener('resize', handleResize);
    
    // Chama o handler imediatamente para definir o tamanho correto
    // no caso do componente ter sido montado após um redimensionamento
    handleResize();

    // Remove o listener quando o componente é desmontado
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Array vazio garante que o efeito é executado apenas uma vez

  return windowSize;
} 