import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { NotificationProfile } from './profiles/notification.profile';
import { ExpoPushService } from './services/expo-push.service';
import { FcmPushService } from './services/fcm-push.service';
import { PushTokensModule } from '../push-tokens/push-tokens.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), PushTokensModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationProfile, ExpoPushService, FcmPushService],
  exports: [NotificationsService, TypeOrmModule],
})
export class NotificationsModule {}
