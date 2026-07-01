import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushToken } from '../../push-tokens/entities/push-token.entity';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

interface ExpoPushTicket {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly apiUrl = 'https://exp.host/--/api/v2/push/send';

  constructor(private readonly config: ConfigService) {}

  async sendToTokens(
    tokens: PushToken[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const expoTokens = tokens
      .filter((t) => t.token.startsWith('ExponentPushToken[') || t.token.startsWith('ExpoPushToken['))
      .map((t) => t.token);

    if (expoTokens.length === 0) return;

    const messages: ExpoPushMessage[] = expoTokens.map((to) => ({
      to,
      title,
      body,
      data,
      sound: 'default',
      channelId: 'default',
    }));

    // Expo allows up to 100 messages per request
    const chunks = this.chunk(messages, 100);

    await Promise.allSettled(
      chunks.map((chunk) => this.sendChunk(chunk)),
    );
  }

  private async sendChunk(messages: ExpoPushMessage[]): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      const accessToken = this.config.get<string>('EXPO_ACCESS_TOKEN');
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        this.logger.warn(`Expo push returned HTTP ${response.status}`);
        return;
      }

      const result = (await response.json()) as { data: ExpoPushTicket[] };
      for (const ticket of result.data ?? []) {
        if (ticket.status === 'error') {
          this.logger.warn(`Expo push ticket error: ${ticket.message ?? 'unknown'}`);
        }
      }
    } catch (err) {
      this.logger.warn(
        `Failed to send Expo push chunk: ${err instanceof Error ? err.message : String(err)}`,
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
