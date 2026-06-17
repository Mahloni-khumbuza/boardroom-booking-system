import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { MailService } from './mail.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
