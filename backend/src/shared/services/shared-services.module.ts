import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from '../../modules/system-settings/entities/system-setting.entity';
import { SettingsCacheService } from './settings-cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting])],
  providers: [SettingsCacheService],
  exports: [SettingsCacheService],
})
export class SharedServicesModule {}
