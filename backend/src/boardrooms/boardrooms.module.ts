import { Module } from '@nestjs/common';
import { BoardroomsService } from './boardrooms.service';
import { BoardroomsController } from './boardrooms.controller';

@Module({
  providers: [BoardroomsService],
  controllers: [BoardroomsController]
})
export class BoardroomsModule {}
