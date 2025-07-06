// Service Worker for Push Notifications
// This file should be placed in the public directory as sw.js

const CACHE_NAME = 'health-tracker-v2';
const STATIC_CACHE = 'static-v2';
const API_CACHE = 'api-v2';

const urlsToCache = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/_next/static/css/',
  '/_next/static/chunks/',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!['health-tracker-v2', 'static-v2', 'api-v2'].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event (for offline support)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both fail, show offline page
        if (event.request.destination === 'document') {
          return caches.match('/offline');
        }
      })
  );
});

// Push event
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'Health Tracker',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    data: {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-72x72.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: false,
    silent: false,
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        data: data.data || {},
      };
    } catch (error) {
      console.error('Failed to parse push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Customize notification based on type
  if (notificationData.data.type) {
    switch (notificationData.data.type) {
      case 'period_reminder':
        notificationData.icon = '/period-icon.png';
        notificationData.badge = '/period-badge.png';
        notificationData.requireInteraction = true;
        break;
      case 'medication_reminder':
        notificationData.icon = '/medication-icon.png';
        notificationData.badge = '/medication-badge.png';
        notificationData.requireInteraction = true;
        break;
      case 'log_reminder':
        notificationData.icon = '/log-icon.png';
        notificationData.actions = [
          {
            action: 'log-now',
            title: 'Log Now',
            icon: '/log-icon.png'
          },
          {
            action: 'remind-later',
            title: 'Remind Later'
          }
        ];
        break;
      case 'achievement':
        notificationData.icon = '/achievement-icon.png';
        notificationData.badge = '/achievement-badge.png';
        notificationData.silent = false;
        break;
      case 'cycle_insight':
        notificationData.icon = '/insight-icon.png';
        notificationData.actions = [
          {
            action: 'view-insights',
            title: 'View Insights',
            icon: '/insight-icon.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ];
        break;
    }
  }

  // Android-specific notification enhancements
  function getAndroidNotificationOptions(data) {
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      return {
        ...data,
        // Android-specific options
        vibrate: [200, 100, 200], // Vibration pattern
        renotify: true, // Allow re-notification for same tag
        tag: data.data?.type || 'health-tracker', // Group similar notifications
        image: data.data?.type === 'achievement' ? '/achievement-large.png' : undefined,
        // Android supports larger images
        actions: data.actions?.slice(0, 3) || [], // Android supports max 3 actions
      };
    }
    
    return data;
  }

  notificationData = getAndroidNotificationOptions(notificationData);

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title, 
      getAndroidNotificationOptions(notificationData)
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;

  let urlToOpen = '/';

  // Handle different actions
  switch (action) {
    case 'view':
      urlToOpen = notificationData.url || '/notifications';
      break;
    case 'log-now':
      urlToOpen = '/log';
      break;
    case 'view-insights':
      urlToOpen = '/insights';
      break;
    case 'remind-later':
      // Handle remind later (maybe schedule another notification)
      return;
    case 'dismiss':
    default:
      if (!action && notificationData.url) {
        urlToOpen = notificationData.url;
      } else if (!action) {
        urlToOpen = '/notifications';
      }
      break;
  }

  // Open the URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === new URL(urlToOpen, self.location.origin).href && 'focus' in client) {
            return client.focus();
          }
        }

        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );

  // Mark notification as interacted with
  if (notificationData.notificationId) {
    event.waitUntil(
      fetch(`/api/notifications/${notificationData.notificationId}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action || 'click',
          timestamp: new Date().toISOString(),
        }),
      }).catch((error) => {
        console.error('Failed to record notification interaction:', error);
      })
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);

  const notificationData = event.notification.data || {};

  // Record dismissal if needed
  if (notificationData.notificationId) {
    event.waitUntil(
      fetch(`/api/notifications/${notificationData.notificationId}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'dismiss',
          timestamp: new Date().toISOString(),
        }),
      }).catch((error) => {
        console.error('Failed to record notification dismissal:', error);
      })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);

  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    // Sync any pending notification actions when back online
    const cache = await caches.open('notifications-sync');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        await fetch(request);
        await cache.delete(request);
      } catch (error) {
        console.error('Failed to sync notification:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync notifications:', error);
  }
}
