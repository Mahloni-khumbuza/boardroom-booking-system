import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Mapper } from '@automapper/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AuditLogsService } from '../../audit-logs/services/audit-logs.service';
import { MailQueueService } from '../../mail/services/mail-queue.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';
import { User } from '../../users/entities/user.entity';
import { roomBlockedHtml } from '../../mail/templates/mail-templates';
import { BoardroomBlock } from '../entities/boardroom-block.entity';
import { BoardroomBlockResponseDto } from '../dto/boardroom-block-response.dto';
import { BoardroomBlockQueryDto } from '../dto/boardroom-block-query.dto';
import { CreateBoardroomBlockDto } from '../dto/create-boardroom-block.dto';
import { UpdateBoardroomBlockDto } from '../dto/update-boardroom-block.dto';

@Injectable()
export class BoardroomBlocksService {
  private readonly logger = new Logger(BoardroomBlocksService.name);

  constructor(
    @InjectRepository(BoardroomBlock)
    private readonly repo: Repository<BoardroomBlock>,
    @InjectRepository(Boardroom)
    private readonly boardroomsRepo: Repository<Boardroom>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly auditLogs: AuditLogsService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailQueueService,
    @Inject('automapper:nestjs:default') private readonly mapper: any,
  ) {}

  async findAll(query: BoardroomBlockQueryDto = {}): Promise<BoardroomBlockResponseDto[]> {
    try {
      const where: Record<string, unknown> = {};
      if (query.boardroomId) where['boardroomId'] = query.boardroomId;
      if (query.from && query.to) {
        where['startTime'] = Between(new Date(query.from), new Date(query.to));
      } else if (query.from) {
        where['endTime'] = MoreThanOrEqual(new Date(query.from));
      } else if (query.to) {
        where['startTime'] = LessThanOrEqual(new Date(query.to));
      }
      const blocks = await this.repo.find({
        where,
        relations: { boardroom: true, createdBy: true },
        order: { startTime: 'ASC' },
        take: 500,
      });
      return this.mapper.mapArray(blocks, BoardroomBlock, BoardroomBlockResponseDto);
    } catch (error) {
      this.logger.error('Failed to fetch boardroom blocks', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<BoardroomBlockResponseDto> {
    try {
      return this.mapper.map(await this.findOneEntity(id), BoardroomBlock, BoardroomBlockResponseDto);
    } catch (error) {
      this.logger.error(`Failed to fetch boardroom block ${id}`, error);
      throw error;
    }
  }

  async create(dto: CreateBoardroomBlockDto, actorId: string): Promise<BoardroomBlockResponseDto> {
    try {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestException('Invalid start or end time');
      }
      if (end <= start) throw new BadRequestException('endTime must be after startTime');

      const boardroom = await this.boardroomsRepo.findOne({ where: { id: dto.boardroomId } });
      if (!boardroom) throw new BadRequestException(`Boardroom ${dto.boardroomId} not found`);

      const block = this.repo.create({
        boardroomId: boardroom.id,
        startTime: start,
        endTime: end,
        reason: dto.reason.trim(),
        createdById: actorId,
      });
      const saved = await this.repo.save(block);

      await this.auditLogs.record({
        action: 'boardroom_block.created',
        entity: 'boardroom_block',
        entityId: saved.id,
        actorId,
        metadata: { boardroomId: boardroom.id, reason: saved.reason, startTime: saved.startTime, endTime: saved.endTime },
      });

      await this.notifyRoomBlocked(boardroom, saved, actorId);

      return this.mapper.map(await this.findOneEntity(saved.id), BoardroomBlock, BoardroomBlockResponseDto);
    } catch (error) {
      this.logger.error('Failed to create boardroom block', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateBoardroomBlockDto, actorId: string): Promise<BoardroomBlockResponseDto> {
    try {
      const block = await this.findOneEntity(id);
      const before = { reason: block.reason, startTime: block.startTime, endTime: block.endTime, isActive: block.isActive };
      const start = dto.startTime ? new Date(dto.startTime) : block.startTime;
      const end = dto.endTime ? new Date(dto.endTime) : block.endTime;
      if (end <= start) throw new BadRequestException('endTime must be after startTime');

      if (dto.reason !== undefined) block.reason = dto.reason.trim();
      if (dto.isActive !== undefined) block.isActive = dto.isActive;
      block.startTime = start;
      block.endTime = end;
      await this.repo.save(block);
      await this.auditLogs.record({
        action: 'boardroom_block.updated',
        entity: 'boardroom_block',
        entityId: id,
        actorId,
        before,
        after: { reason: block.reason, startTime: block.startTime, endTime: block.endTime, isActive: block.isActive },
      });
      return this.mapper.map(await this.findOneEntity(id), BoardroomBlock, BoardroomBlockResponseDto);
    } catch (error) {
      this.logger.error(`Failed to update boardroom block ${id}`, error);
      throw error;
    }
  }

  async activate(id: string, actorId: string): Promise<BoardroomBlockResponseDto> {
    try {
      const block = await this.findOneEntity(id);
      if (block.isActive) return this.mapper.map(block, BoardroomBlock, BoardroomBlockResponseDto);
      block.isActive = true;
      await this.repo.save(block);
      await this.auditLogs.record({ action: 'boardroom_block.activated', entity: 'boardroom_block', entityId: id, actorId });
      return this.mapper.map(await this.findOneEntity(id), BoardroomBlock, BoardroomBlockResponseDto);
    } catch (error) {
      this.logger.error(`Failed to activate boardroom block ${id}`, error);
      throw error;
    }
  }

  async deactivate(id: string, actorId: string): Promise<BoardroomBlockResponseDto> {
    try {
      const block = await this.findOneEntity(id);
      if (!block.isActive) return this.mapper.map(block, BoardroomBlock, BoardroomBlockResponseDto);
      block.isActive = false;
      await this.repo.save(block);
      await this.auditLogs.record({ action: 'boardroom_block.deactivated', entity: 'boardroom_block', entityId: id, actorId });
      return this.mapper.map(await this.findOneEntity(id), BoardroomBlock, BoardroomBlockResponseDto);
    } catch (error) {
      this.logger.error(`Failed to deactivate boardroom block ${id}`, error);
      throw error;
    }
  }

  async remove(id: string, actorId: string): Promise<void> {
    try {
      const block = await this.findOneEntity(id);
      await this.repo.delete(block.id);
      await this.auditLogs.record({
        action: 'boardroom_block.removed',
        entity: 'boardroom_block',
        entityId: id,
        actorId,
        metadata: { reason: block.reason, boardroomId: block.boardroomId },
      });
    } catch (error) {
      this.logger.error(`Failed to remove boardroom block ${id}`, error);
      throw error;
    }
  }

  async findOverlapping(boardroomId: string, start: Date, end: Date): Promise<BoardroomBlock | null> {
    return this.repo
      .createQueryBuilder('blk')
      .where('blk.boardroomId = :boardroomId', { boardroomId })
      .andWhere('blk.isActive = true')
      .andWhere('blk.startTime < :end AND blk.endTime > :start', { start, end })
      .getOne();
  }

  // Ã‚Â§12: Room blocked Ã¢â€ â€™ notify Admins + FacilitiesManagers (in-app + email)
  private async notifyRoomBlocked(boardroom: Boardroom, block: BoardroomBlock, actorId: string): Promise<void> {
    const actor = await this.usersRepo.findOne({ where: { id: actorId } });
    const blockedByName = actor ? `${actor.firstName} ${actor.lastName}` : 'Facilities';

    const recipients = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name IN (:...roles)', { roles: ['Admin', 'SuperAdmin', 'FacilitiesManager'] })
      .andWhere('user.isActive = true')
      .getMany();

    const emailHtml = roomBlockedHtml({
      boardroomName: boardroom.name,
      startTime: block.startTime,
      endTime: block.endTime,
      reason: block.reason,
      blockedByName,
    });

    for (const user of recipients) {
      await this.notifications.notify({
        recipientId: user.id,
        title: 'Room blocked',
        message: `${boardroom.name} has been blocked from ${block.startTime.toLocaleDateString('en-ZA')} to ${block.endTime.toLocaleDateString('en-ZA')}. Reason: ${block.reason}`,
        type: NotificationType.RoomBlocked,
      });
      if (user.email) {
        void this.mail.enqueue({
          to: user.email,
          subject: `Room blocked: ${boardroom.name}`,
          html: emailHtml,
        });
      }
    }

    this.logger.log(`Room-blocked notifications sent for ${boardroom.name} to ${recipients.length} users`);
  }

  private async findOneEntity(id: string): Promise<BoardroomBlock> {
    const block = await this.repo.findOne({ where: { id }, relations: { boardroom: true, createdBy: true } });
    if (!block) throw new NotFoundException(`Block ${id} not found`);
    return block;
  }
}
