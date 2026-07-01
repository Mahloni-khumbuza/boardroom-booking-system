import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushToken } from '../entities/push-token.entity';
import { RegisterTokenDto } from '../dto/register-token.dto';

@Injectable()
export class PushTokensService {
  private readonly logger = new Logger(PushTokensService.name);

  constructor(
    @InjectRepository(PushToken)
    private readonly repo: Repository<PushToken>,
  ) {}

  async register(userId: string, dto: RegisterTokenDto): Promise<{ id: string }> {
    const existing = await this.repo.findOne({
      where: { userId, token: dto.token },
    });

    if (existing) {
      existing.platform = dto.platform;
      existing.deviceId = dto.deviceId ?? existing.deviceId;
      const saved = await this.repo.save(existing);
      return { id: saved.id };
    }

    const entry = this.repo.create({
      userId,
      token: dto.token,
      platform: dto.platform,
      deviceId: dto.deviceId ?? null,
    });
    const saved = await this.repo.save(entry);
    this.logger.log(`Registered push token for user ${userId} (${dto.platform})`);
    return { id: saved.id };
  }

  async remove(userId: string, token: string): Promise<void> {
    await this.repo.delete({ userId, token });
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.repo.delete({ userId });
    this.logger.log(`Removed all push tokens for user ${userId}`);
  }

  async getTokensForUser(userId: string): Promise<PushToken[]> {
    return this.repo.find({ where: { userId } });
  }

  async getTokensForUsers(userIds: string[]): Promise<PushToken[]> {
    if (userIds.length === 0) return [];
    return this.repo
      .createQueryBuilder('pt')
      .where('pt.userId IN (:...userIds)', { userIds })
      .getMany();
  }
}
