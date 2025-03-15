// Service Worker para gerenciar notificações em background
// Este arquivo deve estar na pasta public para ser acessível na raiz

const CACHE_NAME = 'neotask-notification-cache-v1';
const urlsToCache = [
  '/sounds/notification.mp3',
  '/images/notification-icon.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
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
    })
  );
});

// Interceptar solicitações de rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Gerenciar notificações push
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nova notificação do NeoTask',
      icon: data.icon || '/images/notification-icon.png',
      badge: '/images/notification-badge.png',
      data: data.data || {},
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      tag: data.tag || 'default'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'NeoTask', options)
    );
  } catch (error) {
    console.error('Erro ao processar evento push:', error);
    
    // Tente mostrar uma notificação básica mesmo se o parsing falhar
    event.waitUntil(
      self.registration.showNotification('NeoTask', {
        body: 'Você tem uma nova notificação',
        icon: '/images/notification-icon.png'
      })
    );
  }
});

// Lidar com cliques em notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Verificar se clicou em uma ação específica
  if (event.action) {
    // Manipular ações específicas
    console.log('Ação de notificação clicada:', event.action);
    
    // Aqui você pode adicionar lógica específica para diferentes ações
    // por exemplo, marcar como concluído, adiar, etc.
  } else {
    // Clique na notificação principal
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          // Verificar se já há uma janela aberta
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              // Se houver dados específicos, adicione à URL como parâmetros
              if (event.notification.data && event.notification.data.taskId) {
                return client.navigate(`/?taskId=${event.notification.data.taskId}`)
                  .then((client) => client.focus());
              }
              return client.focus();
            }
          }
          
          // Se não há janelas abertas, abra uma nova
          if (clients.openWindow) {
            let url = '/';
            // Adicione parâmetros se houver dados específicos
            if (event.notification.data && event.notification.data.taskId) {
              url += `?taskId=${event.notification.data.taskId}`;
            }
            return clients.openWindow(url);
          }
        })
    );
  }
});

// Lidar com fechamento de notificações
self.addEventListener('notificationclose', (event) => {
  // Pode ser usado para rastreamento de métricas
  console.log('Notificação fechada sem interação');
});

// Receber mensagens da página
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { id, title, body, time, data } = event.data;
    
    // Agendar notificação para um momento futuro
    const now = Date.now();
    const delay = new Date(time).getTime() - now;
    
    if (delay <= 0) {
      return;
    }
    
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/images/notification-icon.png',
        data,
        requireInteraction: true
      });
    }, delay);
  }
}); 