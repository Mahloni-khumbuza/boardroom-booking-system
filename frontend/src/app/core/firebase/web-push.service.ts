import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { getToken, onMessage } from 'firebase/messaging';
import { FIREBASE_VAPID_KEY, getFirebaseMessaging } from './firebase.config';
import { PushTokensService } from '../../features/notifications/services/push-tokens.service';

@Injectable({ providedIn: 'root' })
export class WebPushService {
  private readonly pushTokens = inject(PushTokensService);
  private readonly router     = inject(Router);
  private registeredToken: string | null = null;
  private userRole: string = 'Employee';

  // Map notification type → relative page path
  private readonly clickActionToPath: Record<string, string> = {
    bookings:      'bookings',
    notifications: 'notifications',
    boardrooms:    'boardrooms',
    calendar:      'calendar',
    dashboard:     'dashboard',
  };

  async init(role?: string): Promise<void> {
    if (role) this.userRole = role;
    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const swReg = await this.registerServiceWorker();
      await this.postRoleToServiceWorker(swReg);

      const token = await getToken(messaging, {
        vapidKey: FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      console.log('[WebPush] FCM token:', token ? token.substring(0, 20) + '...' : 'null');
      if (token && token !== this.registeredToken) {
        this.pushTokens.register(token, 'web', this.getDeviceId()).subscribe({
          next: () => { this.registeredToken = token; console.log('[WebPush] Token registered with backend'); },
          error: (e) => { console.error('[WebPush] Token registration failed:', e); },
        });
      }

      // Foreground: show browser notification and navigate on click
      onMessage(messaging, (payload) => {
        const title       = payload.notification?.title ?? 'New notification';
        const body        = payload.notification?.body  ?? '';
        const clickAction = payload.data?.['clickAction'] ?? 'notifications';

        if (Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/badge-72x72.png',
              data: { clickAction },
            });
          });
        }

        // Also listen for the click on that foreground notification
        navigator.serviceWorker.addEventListener('message', (e) => {
          if (e.data?.type === 'NOTIFICATION_CLICK') {
            const action = e.data.clickAction ?? 'notifications';
            void this.router.navigateByUrl(this.resolveUrl(action));
          }
        });
      });
    } catch (err) {
      console.error('[WebPush] init failed:', err);
    }
  }

  async unregister(): Promise<void> {
    if (this.registeredToken) {
      this.pushTokens.remove(this.registeredToken).subscribe({ error: () => {} });
      this.registeredToken = null;
    }
  }

  private resolveUrl(clickAction: string): string {
    const page   = this.clickActionToPath[clickAction] ?? 'notifications';
    const portal = this.portalBase();
    return `/${portal}/${page}`;
  }

  private portalBase(): string {
    if (this.userRole === 'SuperAdmin')        return 'superadmin';
    if (this.userRole === 'Admin')             return 'admin';
    if (this.userRole === 'FacilitiesManager') return 'facilities';
    return 'employee';
  }

  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
    if (!('serviceWorker' in navigator)) return undefined;
    try {
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      return reg;
    } catch {
      return undefined;
    }
  }

  private async postRoleToServiceWorker(reg?: ServiceWorkerRegistration): Promise<void> {
    try {
      const active = reg?.active ?? (await navigator.serviceWorker.getRegistration('/'))?.active;
      if (active) {
        active.postMessage({ type: 'SET_USER_ROLE', role: this.userRole });
      }
    } catch {
      // SW not available
    }
  }

  private getDeviceId(): string {
    const key = 'bbs.deviceId';
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  }
}
