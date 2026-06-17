import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';

export interface NotifyInput {
  recipientId: string;
  title: string;
  message: string;
  type?: NotificationType;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async listForUser(userId: string): Promise<Notification[]> {
    return this.repo.find({ where: { recipientId: userId }, order: { createdAt: 'DESC' }, take: 100 });
  }

  async countUnreadForUser(userId: string): Promise<number> {
    return this.repo.count({ where: { recipientId: userId, isRead: false } });
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const entry = this.repo.create({
      type: dto.type ?? NotificationType.Info,
      title: dto.title,
      message: dto.message,
      recipientId: dto.recipientId,
      isRead: false,
    });
    return this.repo.save(entry);
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
      return await this.repo.save(entry);
    } catch (error) {
      this.logger.warn(
        `Failed to send notification "${input.title}" to ${input.recipientId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const note = await this.repo.findOne({ where: { id, recipientId: userId } });
    if (!note) throw new NotFoundException(`Notification ${id} not found`);
    note.isRead = true;
    return this.repo.save(note);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.repo.update({ recipientId: userId, isRead: false }, { isRead: true });
    return { updated: result.affected ?? 0 };
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.repo.delete({ id, recipientId: userId });
    if (result.affected === 0) throw new NotFoundException(`Notification ${id} not found`);
  }
}
