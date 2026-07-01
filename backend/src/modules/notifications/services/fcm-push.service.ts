import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import { PushToken } from '../../push-tokens/entities/push-token.entity';

@Injectable()
export class FcmPushService implements OnModuleInit {
  private readonly logger = new Logger(FcmPushService.name);
  private app: App | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const raw = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!raw) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set — FCM push disabled');
      return;
    }
    try {
      const serviceAccount = JSON.parse(raw);
      const existing = getApps().find((a) => a.name === 'boardroom-fcm');
      this.app = existing ?? initializeApp(
        { credential: cert(serviceAccount) },
        'boardroom-fcm',
      );
      this.logger.log('Firebase Admin SDK initialised');
    } catch (err) {
      this.logger.error(
        `Failed to initialise Firebase Admin: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  get isReady(): boolean {
    return this.app !== null;
  }

  private readonly typeToClickAction: Record<string, string> = {
    booking_created:           'bookings',
    booking_approval_required: 'bookings',
    booking_approved:          'bookings',
    booking_rejected:          'bookings',
    booking_cancelled:         'bookings',
    booking_updated:           'bookings',
    booking_reminder:          'bookings',
    facilities_request:        'bookings',
    room_blocked:              'bookings',
    info:                      'notifications',
    system:                    'notifications',
  };

  async sendToTokens(
    tokens: PushToken[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.app) return;

    const fcmTokens = tokens
      .filter((t) => t.platform === 'fcm' || t.platform === 'web')
      .map((t) => t.token);

    if (fcmTokens.length === 0) return;

    const stringData: Record<string, string> = {};
    if (data) {
      for (const [k, v] of Object.entries(data)) {
        stringData[k] = String(v);
      }
    }

    // Attach click action so the service worker knows which page to open
    const type = stringData['type'];
    if (type && !stringData['clickAction']) {
      stringData['clickAction'] = this.typeToClickAction[type] ?? 'notifications';
    }

    const chunks = this.chunk(fcmTokens, 500);
    await Promise.allSettled(
      chunks.map((chunk) => this.sendChunk(chunk, title, body, stringData)),
    );
  }

  private async sendChunk(
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, string>,
  ): Promise<void> {
    try {
      const message: MulticastMessage = {
        tokens,
        notification: { title, body },
        webpush: {
          notification: {
            title,
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            requireInteraction: false,
          },
          fcmOptions: { link: '/' },
        },
        data,
      };

      const messaging = getMessaging(this.app!);
      const result = await messaging.sendEachForMulticast(message);

      result.responses.forEach((resp, idx) => {
        if (!resp.success) {
          this.logger.warn(
            `FCM send failed for token[${idx}]: ${resp.error?.message ?? 'unknown'}`,
          );
        }
      });

      this.logger.log(`FCM: ${result.successCount}/${tokens.length} delivered`);
    } catch (err) {
      this.logger.warn(
        `FCM chunk send error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }
}
