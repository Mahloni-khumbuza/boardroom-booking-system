import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';
import { BoardroomBlock } from '../entities/boardroom-block.entity';
import { BoardroomBlockQueryDto } from '../dto/boardroom-block-query.dto';
import { CreateBoardroomBlockDto } from '../dto/create-boardroom-block.dto';
import { UpdateBoardroomBlockDto } from '../dto/update-boardroom-block.dto';

@Injectable()
export class BoardroomBlocksService {
  constructor(
    @InjectRepository(BoardroomBlock)
    private readonly repo: Repository<BoardroomBlock>,
    @InjectRepository(Boardroom)
    private readonly boardroomsRepo: Repository<Boardroom>,
  ) {}

  findAll(query: BoardroomBlockQueryDto = {}): Promise<BoardroomBlock[]> {
    const where: Record<string, unknown> = {};
    if (query.boardroomId) where['boardroomId'] = query.boardroomId;
    if (query.from && query.to) {
      where['startTime'] = Between(new Date(query.from), new Date(query.to));
    } else if (query.from) {
      where['endTime'] = MoreThanOrEqual(new Date(query.from));
    } else if (query.to) {
      where['startTime'] = LessThanOrEqual(new Date(query.to));
    }
    return this.repo.find({
      where,
      relations: { boardroom: true },
      order: { startTime: 'ASC' },
      take: 500,
    });
  }

  async findOne(id: string): Promise<BoardroomBlock> {
    const block = await this.repo.findOne({
      where: { id },
      relations: { boardroom: true },
    });
    if (!block) throw new NotFoundException(`Block ${id} not found`);
    return block;
  }

  async create(dto: CreateBoardroomBlockDto, actorId: string): Promise<BoardroomBlock> {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end time');
    }
    if (end <= start) {
      throw new BadRequestException('endTime must be after startTime');
    }
    const boardroom = await this.boardroomsRepo.findOne({ where: { id: dto.boardroomId } });
    if (!boardroom) {
      throw new BadRequestException(`Boardroom ${dto.boardroomId} not found`);
    }
    const block = this.repo.create({
      boardroomId: boardroom.id,
      startTime: start,
      endTime: end,
      reason: dto.reason.trim(),
      createdById: actorId,
    });
    const saved = await this.repo.save(block);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateBoardroomBlockDto): Promise<BoardroomBlock> {
    const block = await this.findOne(id);
    const start = dto.startTime ? new Date(dto.startTime) : block.startTime;
    const end = dto.endTime ? new Date(dto.endTime) : block.endTime;
    if (end <= start) {
      throw new BadRequestException('endTime must be after startTime');
    }
    if (dto.reason !== undefined) block.reason = dto.reason.trim();
    block.startTime = start;
    block.endTime = end;
    await this.repo.save(block);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Block ${id} not found`);
    }
  }

  /**
   * Returns the first active block on `boardroomId` that overlaps [start, end), if any.
   */
  async findOverlapping(
    boardroomId: string,
    start: Date,
    end: Date,
  ): Promise<BoardroomBlock | null> {
    return this.repo
      .createQueryBuilder('blk')
      .where('blk.boardroomId = :boardroomId', { boardroomId })
      .andWhere('blk.isActive = true')
      .andWhere('blk.startTime < :end AND blk.endTime > :start', { start, end })
      .getOne();
  }
}
