import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../modules/permissions/entities/permission.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { SeederService } from './seeds/seeder.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: Number(configService.getOrThrow<string>('DB_PORT')),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize:
          configService.get<string>('DB_SYNCHRONIZE', 'true').toLowerCase() === 'true',
        logging:
          configService.get<string>('DB_LOGGING', 'false').toLowerCase() === 'true',
      }),
    }),
    TypeOrmModule.forFeature([Permission, Role, User]),
  ],
  providers: [SeederService],
})
export class DatabaseModule {}
