import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsService } from './services/audit-logs.service';
import { AuditLogsController } from './controllers/audit-logs.controller';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogsService],
  controllers: [AuditLogsController],
  exports: [TypeOrmModule],
})
export class AuditLogsModule {}
