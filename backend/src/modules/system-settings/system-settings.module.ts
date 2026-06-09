import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from './entities/system-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting])],
  exports: [TypeOrmModule],
})
export class SystemSettingsModule {}
