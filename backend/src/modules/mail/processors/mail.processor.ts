import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from '../services/mail.service';
import { SendMailDto } from '../dto/send-mail.dto';
import { MAIL_QUEUE, MailJobName } from '../mail-queue.constants';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mail: MailService) {
    super();
  }

  async process(job: Job<SendMailDto>): Promise<void> {
    if (job.name === MailJobName.SEND) {
      this.logger.debug(`Processing mail job ${job.id}: ${job.data.subject} → ${String(job.data.to)}`);
      await this.mail.sendMail(job.data);
    }
  }
}
