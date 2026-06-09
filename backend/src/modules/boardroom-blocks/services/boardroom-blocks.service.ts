import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AuditLogsService } from '../../audit-logs/services/audit-logs.service';
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';
import { BoardroomBlock } from '../entities/boardroom-block.entity';
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
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findAll(query: BoardroomBlockQueryDto = {}): Promise<BoardroomBlock[]> {
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
      return await this.repo.find({
        where,
        relations: { boardroom: true },
        order: { startTime: 'ASC' },
        take: 500,
      });
    } catch (err) { return this.rethrow(err, 'findAll blocks'); }
  }

  async findOne(id: string): Promise<BoardroomBlock> {
    try {
      const block = await this.repo.findOne({ where: { id }, relations: { boardroom: true } });
      if (!block) throw new NotFoundException(`Block ${id} not found`);
      return block;
    } catch (err) { return this.rethrow(err, 'findOne block'); }
  }

  async create(dto: CreateBoardroomBlockDto, actorId: string): Promise<BoardroomBlock> {
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
      return this.findOne(saved.id);
    } catch (err) { return this.rethrow(err, 'create block'); }
  }

  async update(id: string, dto: UpdateBoardroomBlockDto, actorId: string): Promise<BoardroomBlock> {
    try {
      const block = await this.findOne(id);
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
      return this.findOne(id);
    } catch (err) { return this.rethrow(err, 'update block'); }
  }

  async activate(id: string, actorId: string): Promise<BoardroomBlock> {
    try {
      const block = await this.findOne(id);
      if (block.isActive) return block;
      block.isActive = true;
      await this.repo.save(block);
      await this.auditLogs.record({ action: 'boardroom_block.activated', entity: 'boardroom_block', entityId: id, actorId });
      return this.findOne(id);
    } catch (err) { return this.rethrow(err, 'activate block'); }
  }

  async deactivate(id: string, actorId: string): Promise<BoardroomBlock> {
    try {
      const block = await this.findOne(id);
      if (!block.isActive) return block;
      block.isActive = false;
      await this.repo.save(block);
      await this.auditLogs.record({ action: 'boardroom_block.deactivated', entity: 'boardroom_block', entityId: id, actorId });
      return this.findOne(id);
    } catch (err) { return this.rethrow(err, 'deactivate block'); }
  }

  async remove(id: string, actorId: string): Promise<void> {
    try {
      const block = await this.findOne(id);
      await this.repo.delete(block.id);
      await this.auditLogs.record({
        action: 'boardroom_block.removed',
        entity: 'boardroom_block',
        entityId: id,
        actorId,
        metadata: { reason: block.reason, boardroomId: block.boardroomId },
      });
    } catch (err) { return this.rethrow(err, 'remove block'); }
  }

  async findOverlapping(boardroomId: string, start: Date, end: Date): Promise<BoardroomBlock | null> {
    try {
      return await this.repo
        .createQueryBuilder('blk')
        .where('blk.boardroomId = :boardroomId', { boardroomId })
        .andWhere('blk.isActive = true')
        .andWhere('blk.startTime < :end AND blk.endTime > :start', { start, end })
        .getOne();
    } catch (err) { return this.rethrow(err, 'findOverlapping block'); }
  }

  private rethrow(err: unknown, context: string): never {
    if (err instanceof BadRequestException || err instanceof NotFoundException) throw err;
    this.logger.error(`Unexpected error in ${context}`, err instanceof Error ? err.stack : String(err));
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
