importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBrKw_iFc2hnZjr__UcPviBk6xI6hr6ick',
  authDomain: 'boardroom-booking-system-4277e.firebaseapp.com',
  projectId: 'boardroom-booking-system-4277e',
  storageBucket: 'boardroom-booking-system-4277e.firebasestorage.app',
  messagingSenderId: '348322588453',
  appId: '1:348322588453:web:858b0444b96d6f0e9cdccc',
});

const messaging = firebase.messaging();

// Resolve role-based portal path from localStorage
function resolveUrl(clickAction) {
  const page = clickAction || 'notifications';
  try {
    const raw = self.__user_role;
    const role = raw || 'employee';
    const portalMap = {
      SuperAdmin:        'superadmin',
      Admin:             'admin',
      FacilitiesManager: 'facilities',
      Employee:          'employee',
    };
    const portal = portalMap[role] || 'employee';
    return `/${portal}/${page}`;
  } catch {
    return `/employee/${page}`;
  }
}

// Store role from clients so SW can resolve the correct portal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_USER_ROLE') {
    self.__user_role = event.data.role;
  }
});

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const title       = payload.notification?.title ?? 'Boardroom Booking';
  const body        = payload.notification?.body  ?? '';
  const clickAction = payload.data?.clickAction   ?? 'notifications';

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: { clickAction },
  });
});

// Navigate to the correct page when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickAction = event.notification.data?.clickAction ?? 'notifications';
  const url = resolveUrl(clickAction);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
