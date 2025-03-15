# Correção do Problema com Navigator.onLine no Next.js

## Problema

A aplicação NeoTask estava enfrentando um problema de erro durante a renderização no servidor (SSR) do Next.js. O problema ocorria porque o código estava tentando acessar propriedades específicas do navegador (`navigator.onLine` e `window.addEventListener`) durante a renderização do servidor, onde esses objetos não estão disponíveis.

Os principais pontos problemáticos eram:

1. Acesso direto a `navigator.onLine` durante a renderização
2. Chamadas para `window.addEventListener` para eventos 'online'/'offline' durante a renderização do servidor
3. Uso de propriedades do navegador sem verificar se estavam em ambiente de navegador

## Solução

A solução aplicada consistiu em várias camadas de proteção:

### 1. Hook useOffline Melhorado

O hook `useOffline` foi atualizado para detectar de forma segura se está executando no cliente:

```typescript
// hooks/useOffline.ts
export function useOffline() {
  // Verifica se está no cliente de forma segura
  const isClientSide = typeof window !== 'undefined';
  
  // Define o estado inicial apenas com navigator.onLine se estiver no cliente
  const [isOnline, setIsOnline] = useState<boolean>(isClientSide ? navigator.onLine : true);
  
  useEffect(() => {
    // Só adiciona event listeners se estiver no cliente
    if (!isClientSide) return;
    
    const handleOnline = () => {
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isClientSide]);
  
  return { isOnline, setIsOnline };
}
```

### 2. Interceptação Temporária (temp-fix.ts)

Foi criado um mecanismo para interceptar e bloquear chamadas problemáticas ao navigator:

```typescript
// temp-fix.ts
export function useFixNavigatorIssue() {
  const isClientSide = typeof window !== 'undefined';
  
  useEffect(() => {
    if (!isClientSide) return;
    
    // Salvar as funções originais
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;
    
    // Substituir addEventListener para evitar novos listeners problemáticos
    window.addEventListener = function(type, listener, options) {
      if (type === 'online' || type === 'offline') {
        console.warn(`[Fixador] Tentativa bloqueada de adicionar listener para '${type}'`);
        return undefined;
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Substituir removeEventListener para evitar erros ao tentar remover
    window.removeEventListener = function(type, listener, options) {
      if (type === 'online' || type === 'offline') {
        console.warn(`[Fixador] Tentativa bloqueada de remover listener para '${type}'`);
        return undefined;
      }
      return originalRemoveEventListener.call(this, type, listener, options);
    };
    
    // Restaurar as funções originais após 3 segundos (tempo suficiente para a renderização inicial)
    const timerId = setTimeout(() => {
      window.addEventListener = originalAddEventListener;
      window.removeEventListener = originalRemoveEventListener;
      console.log('[Fixador] Funções addEventListener/removeEventListener restauradas');
    }, 3000);
    
    return () => {
      clearTimeout(timerId);
      window.addEventListener = originalAddEventListener;
      window.removeEventListener = originalRemoveEventListener;
    };
  }, [isClientSide]);
}
```

### 3. Estratégia na Página Principal

Na página principal, usamos uma abordagem segura para lidar com o status online:

```typescript
export default function Home() {
  // Use o hook de correção temporária
  useFixNavigatorIssue();
  
  // Verificação segura para cliente
  const isClientSide = typeof window !== 'undefined';
  
  // Obter estado online de forma segura através do hook
  const { isOnline } = useOffline();
  
  // ... resto do componente ...
}
```

## Boas Práticas para SSR

Para evitar problemas similares no futuro, siga estas práticas:

1. **Verificação de Ambiente**: Sempre verifique se está no cliente antes de acessar APIs do navegador:
   ```typescript
   const isClientSide = typeof window !== 'undefined';
   if (isClientSide) {
     // código que usa APIs do navegador
   }
   ```

2. **Inicialização Condicional**: Inicialize estados com valores seguros para SSR:
   ```typescript
   const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
   ```

3. **useEffect para APIs do Navegador**: Coloque todo código que acessa APIs do navegador dentro de useEffect:
   ```typescript
   useEffect(() => {
     // Código seguro para o navegador aqui
   }, []);
   ```

4. **Componentes Condicionais**: Use renderização condicional para componentes que dependem do navegador:
   ```typescript
   {typeof window !== 'undefined' && <ComponenteQueUsaAPIsDoNavegador />}
   ```

Seguindo essas práticas, é possível criar aplicações Next.js que funcionam perfeitamente tanto no servidor quanto no cliente. 