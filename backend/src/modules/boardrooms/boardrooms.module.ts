import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardroomsService } from './services/boardrooms.service';
import { BoardroomsController } from './controllers/boardrooms.controller';
import { Boardroom } from './entities/boardroom.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Boardroom])],
  providers: [BoardroomsService],
  controllers: [BoardroomsController],
  exports: [TypeOrmModule],
})
export class BoardroomsModule {}
