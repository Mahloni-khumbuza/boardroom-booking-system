import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SendMailDto } from '../dto/send-mail.dto';
import { MAIL_QUEUE, MailJobName } from '../mail-queue.constants';

@Injectable()
export class MailQueueService {
  private readonly logger = new Logger(MailQueueService.name);

  constructor(@InjectQueue(MAIL_QUEUE) private readonly queue: Queue<SendMailDto>) {}

  async enqueue(dto: SendMailDto): Promise<void> {
    try {
      await this.queue.add(MailJobName.SEND, dto, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      });
    } catch (err) {
      this.logger.error(
        `Failed to enqueue mail job: ${dto.subject} → ${String(dto.to)}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
