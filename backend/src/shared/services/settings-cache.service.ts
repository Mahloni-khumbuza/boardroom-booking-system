import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../../modules/system-settings/entities/system-setting.entity';

@Injectable()
export class SettingsCacheService {
  private readonly logger = new Logger(SettingsCacheService.name);
  private readonly cache = new Map<string, { value: string | null; fetchedAt: number }>();
  private readonly ttlMs = 60_000;

  constructor(
    @InjectRepository(SystemSetting)
    private readonly repo: Repository<SystemSetting>,
  ) {}

  async getString(key: string, fallback: string): Promise<string> {
    const raw = await this.fetchRaw(key);
    return raw ?? fallback;
  }

  async getNumber(key: string, fallback: number): Promise<number> {
    const raw = await this.fetchRaw(key);
    if (raw === null) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  async getBoolean(key: string, fallback: boolean): Promise<boolean> {
    const raw = await this.fetchRaw(key);
    if (raw === null) return fallback;
    return ['true', 'yes', '1'].includes(raw.toLowerCase());
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  private async fetchRaw(key: string): Promise<string | null> {
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && now - cached.fetchedAt < this.ttlMs) return cached.value;

    try {
      const setting = await this.repo.findOne({ where: { key } });
      const value = setting?.value ?? null;
      this.cache.set(key, { value, fetchedAt: now });
      return value;
    } catch (err) {
      this.logger.warn(`Failed to fetch setting "${key}": ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }
}
