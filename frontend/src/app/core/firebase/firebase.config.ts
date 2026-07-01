import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyBrKw_iFc2hnZjr__UcPviBk6xI6hr6ick',
  authDomain: 'boardroom-booking-system-4277e.firebaseapp.com',
  projectId: 'boardroom-booking-system-4277e',
  storageBucket: 'boardroom-booking-system-4277e.firebasestorage.app',
  messagingSenderId: '348322588453',
  appId: '1:348322588453:web:858b0444b96d6f0e9cdccc',
};

export const FIREBASE_VAPID_KEY =
  'BEbEM_AiUq62Y5CAeQuXfTeFV71zk5DXRqJZ_KtotADI9hFf4jVxeXjoxa2qPQs1IKeHQd9n5Tr1FOwlkvPBYD8';

let app: FirebaseApp;
let messaging: Messaging | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  if (messaging) return messaging;
  try {
    messaging = getMessaging(getFirebaseApp());
    return messaging;
  } catch {
    return null;
  }
}
