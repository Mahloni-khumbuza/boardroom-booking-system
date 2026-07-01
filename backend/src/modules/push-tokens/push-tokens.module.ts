import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushToken } from './entities/push-token.entity';
import { PushTokensController } from './controllers/push-tokens.controller';
import { PushTokensService } from './services/push-tokens.service';

@Module({
  imports: [TypeOrmModule.forFeature([PushToken])],
  controllers: [PushTokensController],
  providers: [PushTokensService],
  exports: [PushTokensService],
})
export class PushTokensModule {}
