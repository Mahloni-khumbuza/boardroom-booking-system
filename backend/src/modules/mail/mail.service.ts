import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { SendMailDto } from './dto/send-mail.dto';

const MAX_RETRIES   = 3;
const RETRY_DELAY_MS = 2000;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly enabled: boolean;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AuditLog)
    private readonly auditLogs: Repository<AuditLog>,
  ) {
    const host   = config.get<string>('MAIL_HOST');
    const port   = config.get<number>('MAIL_PORT') ?? 587;
    const user   = config.get<string>('MAIL_USER');
    const pass   = config.get<string>('MAIL_PASS');
    const secure = config.get<string>('MAIL_SECURE') === 'true';
    this.from    = config.get<string>('MAIL_FROM') ?? 'Boardroom Booking <noreply@boardroom.local>';
    this.enabled = !!(host && user);

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    }
  }

  async sendMail(dto: SendMailDto): Promise<boolean> {
    if (!this.enabled) {
      this.logger.warn(`Mail not configured — skipping: ${dto.subject} → ${String(dto.to)}`);
      return false;
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.transporter.sendMail({
          from:    this.from,
          to:      Array.isArray(dto.to) ? dto.to.join(', ') : dto.to,
          subject: dto.subject,
          html:    dto.html,
          text:    dto.text ?? this.stripHtml(dto.html),
        });
        this.logger.log(`Mail sent (attempt ${attempt}): ${dto.subject} → ${String(dto.to)}`);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Mail delivery failed (attempt ${attempt}/${MAX_RETRIES}): ${message}`);
        if (attempt < MAX_RETRIES) {
          await this.delay(RETRY_DELAY_MS * attempt);
        } else {
          // Sprint requirement: record delivery failures for operational review
          this.logger.error(`Mail permanently failed after ${MAX_RETRIES} attempts: ${dto.subject} → ${String(dto.to)} — ${message}`);
          await this.recordFailure(dto, message);
        }
      }
    }
    return false;
  }

  private async recordFailure(dto: SendMailDto, errorMessage: string): Promise<void> {
    try {
      await this.auditLogs.save(
        this.auditLogs.create({
          action:   'mail.delivery_failed',
          entity:   'email',
          entityId: null,
          actorId:  null,
          metadata: {
            to:      dto.to,
            subject: dto.subject,
            error:   errorMessage,
            retries: MAX_RETRIES,
            failedAt: new Date().toISOString(),
          },
        }),
      );
    } catch (e) {
      // Do not throw — audit log failure must never break the primary flow
      this.logger.warn(`Failed to record mail failure in audit log: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
