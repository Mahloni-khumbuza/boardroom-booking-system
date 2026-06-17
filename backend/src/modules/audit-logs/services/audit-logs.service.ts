import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';
import { AuditLogResponseDto, PaginatedAuditLogResponseDto } from '../dto/audit-log-response.dto';

export interface RecordInput {
  action: string;
  entity: string;
  entityId?: string | null;
  actorId?: string | null;
  metadata?: Record<string, unknown> | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async record(input: RecordInput): Promise<void> {
    try {
      const log = this.repo.create({
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        actorId: input.actorId ?? null,
        metadata: { ...input.metadata, before: input.before ?? undefined, after: input.after ?? undefined },
      });
      await this.repo.save(log);
    } catch (error) {
      this.logger.warn(
        `Failed to persist audit log "${input.action}" for ${input.entity}/${input.entityId ?? 'N/A'}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async findAll(query: AuditLogQueryDto = {}): Promise<PaginatedAuditLogResponseDto> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const qb = this.repo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.actor', 'actor')
      .orderBy('log.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (query.action) qb.andWhere('log.action ILIKE :action', { action: `%${query.action}%` });
    if (query.entity) qb.andWhere('log.entity = :entity', { entity: query.entity });
    if (query.entityId) qb.andWhere('log.entityId = :entityId', { entityId: query.entityId });
    if (query.actorId) qb.andWhere('log.actorId = :actorId', { actorId: query.actorId });
    if (query.from) qb.andWhere('log.createdAt >= :from', { from: new Date(query.from) });
    if (query.to) qb.andWhere('log.createdAt <= :to', { to: new Date(query.to) });

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((log) => this.toDto(log)),
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string): Promise<AuditLogResponseDto> {
    const log = await this.repo.findOne({ where: { id }, relations: { actor: true } });
    if (!log) throw new NotFoundException(`Audit log ${id} not found`);
    return this.toDto(log);
  }

  private toDto(log: AuditLog): AuditLogResponseDto {
    return {
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      metadata: log.metadata,
      actor: log.actor
        ? {
            id: log.actor.id,
            email: log.actor.email,
            firstName: log.actor.firstName,
            lastName: log.actor.lastName,
          }
        : null,
      createdAt: log.createdAt,
    };
  }
}
