import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UserProfile } from './profiles/user.profile';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [UsersService, UserProfile],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
