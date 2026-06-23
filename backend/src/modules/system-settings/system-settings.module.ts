import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { SystemSettingsController } from './controllers/system-settings.controller';
import { SystemSettingsService } from './services/system-settings.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { SystemSettingProfile } from './profiles/system-setting.profile';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting]), AuditLogsModule],
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService, SystemSettingProfile],
  exports: [SystemSettingsService, TypeOrmModule],
})
export class SystemSettingsModule {}
