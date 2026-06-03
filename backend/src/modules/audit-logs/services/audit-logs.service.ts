import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';

export interface AuditLogRecordInput {
  action: string;
  entity: string;
  entityId?: string | null;
  actorId?: string | null;
  metadata?: Record<string, unknown> | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async record(input: AuditLogRecordInput): Promise<AuditLog | null> {
    try {
      const entry = this.repo.create({
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        actorId: input.actorId ?? null,
        metadata: input.metadata ?? null,
        before: input.before ?? null,
        after: input.after ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      });
      return await this.repo.save(entry);
    } catch (err) {
      this.logger.warn(
        `Failed to write audit log "${input.action}" for ${input.entity}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return null;
    }
  }

  async findAll(
    query: AuditLogQueryDto = {},
  ): Promise<{ items: AuditLog[]; total: number; limit: number; offset: number }> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const where: Record<string, unknown> = {};
    if (query.entity) where['entity'] = query.entity;
    if (query.entityId) where['entityId'] = query.entityId;
    if (query.actorId) where['actorId'] = query.actorId;

    if (query.from && query.to) {
      where['createdAt'] = Between(new Date(query.from), new Date(query.to));
    } else if (query.from) {
      where['createdAt'] = MoreThanOrEqual(new Date(query.from));
    } else if (query.to) {
      where['createdAt'] = LessThanOrEqual(new Date(query.to));
    }

    const [items, total] = await this.repo.findAndCount({
      where,
      relations: { actor: true },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
    return { items, total, limit, offset };
  }
}
