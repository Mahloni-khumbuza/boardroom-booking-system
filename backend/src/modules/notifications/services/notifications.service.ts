import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
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
    try {
      return await this.repo.find({ where: { recipientId: userId }, order: { createdAt: 'DESC' }, take: 100 });
    } catch (err) { return this.rethrow(err, 'listForUser'); }
  }

  async countUnreadForUser(userId: string): Promise<number> {
    try {
      return await this.repo.count({ where: { recipientId: userId, isRead: false } });
    } catch (err) { return this.rethrow(err, 'countUnreadForUser'); }
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    try {
      const entry = this.repo.create({
        type: dto.type ?? NotificationType.Info,
        title: dto.title,
        message: dto.message,
        recipientId: dto.recipientId,
        isRead: false,
      });
      return await this.repo.save(entry);
    } catch (err) { return this.rethrow(err, 'create notification'); }
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
    } catch (err) {
      this.logger.warn(
        `Failed to send notification "${input.title}" to ${input.recipientId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return null;
    }
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    try {
      const note = await this.repo.findOne({ where: { id, recipientId: userId } });
      if (!note) throw new NotFoundException(`Notification ${id} not found`);
      note.isRead = true;
      return await this.repo.save(note);
    } catch (err) { return this.rethrow(err, 'markRead'); }
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    try {
      const result = await this.repo.update({ recipientId: userId, isRead: false }, { isRead: true });
      return { updated: result.affected ?? 0 };
    } catch (err) { return this.rethrow(err, 'markAllRead'); }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const result = await this.repo.delete({ id, recipientId: userId });
      if (result.affected === 0) throw new NotFoundException(`Notification ${id} not found`);
    } catch (err) { return this.rethrow(err, 'remove notification'); }
  }

  private rethrow(err: unknown, context: string): never {
    if (err instanceof NotFoundException) throw err;
    this.logger.error(`Unexpected error in ${context}`, err instanceof Error ? err.stack : String(err));
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
