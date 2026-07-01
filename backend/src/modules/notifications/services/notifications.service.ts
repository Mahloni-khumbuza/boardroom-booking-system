import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotifyInput } from '../dto/notify-input.dto';
import { PushTokensService } from '../../push-tokens/services/push-tokens.service';
import { ExpoPushService } from './expo-push.service';
import { FcmPushService } from './fcm-push.service';

export type { NotifyInput };

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    private readonly pushTokens: PushTokensService,
    private readonly expoPush: ExpoPushService,
    private readonly fcmPush: FcmPushService,
  ) {}

  async listForUser(userId: string): Promise<NotificationResponseDto[]> {
    const results = await this.repo.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return results.map(e => this.toDto(e));
  }

  async countUnreadForUser(userId: string): Promise<number> {
    return this.repo.count({ where: { recipientId: userId, isRead: false } });
  }

  async create(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    const entry = this.repo.create({
      type: dto.type ?? NotificationType.Info,
      title: dto.title,
      message: dto.message,
      recipientId: dto.recipientId,
      isRead: false,
    });
    const saved = await this.repo.save(entry);
    void this.dispatchPush(dto.recipientId, dto.title, dto.message, dto.type);
    return this.toDto(saved);
  }

  async notify(input: NotifyInput): Promise<Notification | null> {
    try {
      const entry = this.repo.create({
        type: input.type ?? NotificationType.Info,
        title: input.title,
        message: input.message,
        recipientId: input.recipientId,
        isRead: false,
      });
      const saved = await this.repo.save(entry);
      void this.dispatchPush(input.recipientId, input.title, input.message, input.type);
      return saved;
    } catch (error) {
      this.logger.warn(
        `Failed to send notification "${input.title}" to ${input.recipientId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  async markRead(id: string, userId: string): Promise<NotificationResponseDto> {
    const note = await this.repo.findOne({ where: { id, recipientId: userId } });
    if (!note) throw new NotFoundException(`Notification ${id} not found`);
    note.isRead = true;
    return this.toDto(await this.repo.save(note));
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.repo.update({ recipientId: userId, isRead: false }, { isRead: true });
    return { updated: result.affected ?? 0 };
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.repo.delete({ id, recipientId: userId });
    if (result.affected === 0) throw new NotFoundException(`Notification ${id} not found`);
  }

  private toDto(entity: Notification): NotificationResponseDto {
    const dto = new NotificationResponseDto();
    dto.id = entity.id;
    dto.type = entity.type;
    dto.title = entity.title;
    dto.message = entity.message;
    dto.isRead = entity.isRead;
    dto.recipientId = entity.recipientId;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  private async dispatchPush(
    recipientId: string,
    title: string,
    body: string,
    type?: NotificationType,
  ): Promise<void> {
    try {
      const tokens = await this.pushTokens.getTokensForUser(recipientId);
      if (tokens.length === 0) return;
      const data = type ? { type } : undefined;
      await Promise.allSettled([
        this.expoPush.sendToTokens(tokens, title, body, data),
        this.fcmPush.sendToTokens(tokens, title, body, data),
      ]);
    } catch (err) {
      this.logger.warn(
        `Push dispatch failed for user ${recipientId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
