// Nome do cache
const CACHE_NAME = 'neotask-cache-v1';

// Arquivos para armazenar em cache inicialmente
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de cache: Cache-first, fallback para network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna a resposta do cache
        if (response) {
          return response;
        }

        // Clone do request para poder usá-lo mais de uma vez
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Verifica se temos uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone da resposta para poder usá-la mais de uma vez
            const responseToCache = response.clone();

            // Armazena a resposta no cache para futuros acessos offline
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Não armazenar em cache API calls (normalmente contêm GET parameters)
                if (!event.request.url.includes('/api/')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          });
      }).catch(() => {
        // Falha na conexão, tenta servir a página offline
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Gerenciar sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

// Função para sincronizar tarefas com o servidor
async function syncTasks() {
  try {
    // Recuperar dados pendentes
    const data = await getDataFromIDB('pending-sync-tasks');
    
    if (!data || data.length === 0) {
      return;
    }
    
    // Em um app real, aqui faria a chamada para API
    // Por enquanto, simular um processo de sincronização
    console.log('Sincronizando', data.length, 'tarefas');
    
    // Simular um atraso
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Limpar os dados pendentes
    await clearDataFromIDB('pending-sync-tasks');
    
    // Notificar o usuário
    await self.registration.showNotification('NeoTask', {
      body: `${data.length} tarefas sincronizadas com sucesso!`,
      icon: '/icons/icon-192x192.png'
    });
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
}

// Funções auxiliares para interagir com IndexedDB (simplificadas)
function getDataFromIDB(storeName) {
  return new Promise((resolve) => {
    // Em um app real, implementar acesso real ao IndexedDB
    const data = localStorage.getItem(storeName);
    resolve(data ? JSON.parse(data) : []);
  });
}

function clearDataFromIDB(storeName) {
  return new Promise((resolve) => {
    localStorage.removeItem(storeName);
    resolve();
  });
}

// Ouvir notificações push
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        data: data.data
      })
    );
  }
});

// Lidar com cliques em notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Se já tiver uma janela aberta, focar nela
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Se não, abrir uma nova janela
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
}); 