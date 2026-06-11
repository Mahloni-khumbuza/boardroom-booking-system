import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permission } from '../../../shared/constants/permissions';
import type { JwtPayload } from '../../auth/services/auth.service';
import { NotificationsService } from '../services/notifications.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationResponseDto, UnreadCountResponseDto } from '../dto/notification-response.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @Permissions(Permission.NOTIFICATIONS_READ)
  @ApiOperation({ summary: 'List notifications for current user', operationId: 'listNotifications' })
  @ApiOkResponse({ type: [NotificationResponseDto] })
  list(@CurrentUser() user: JwtPayload): Promise<NotificationResponseDto[]> {
    return this.service.listForUser(user.sub);
  }

  @Get('unread-count')
  @Permissions(Permission.NOTIFICATIONS_READ)
  @ApiOperation({ summary: 'Get unread notification count', operationId: 'getUnreadCount' })
  @ApiOkResponse({ type: UnreadCountResponseDto })
  async unreadCount(@CurrentUser() user: JwtPayload): Promise<UnreadCountResponseDto> {
    return { unread: await this.service.countUnreadForUser(user.sub) };
  }

  @Post()
  @Permissions(Permission.NOTIFICATIONS_WRITE)
  @ApiOperation({ summary: 'Send a notification', operationId: 'createNotification' })
  @ApiCreatedResponse({ type: NotificationResponseDto })
  create(@Body() dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    return this.service.create(dto);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.NOTIFICATIONS_READ)
  @ApiOperation({ summary: 'Mark notification as read', operationId: 'markNotificationRead' })
  @ApiOkResponse({ type: NotificationResponseDto })
  markRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<NotificationResponseDto> {
    return this.service.markRead(id, user.sub);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.NOTIFICATIONS_READ)
  @ApiOperation({ summary: 'Mark all notifications as read', operationId: 'markAllNotificationsRead' })
  @ApiOkResponse({ schema: { properties: { updated: { type: 'number' } } } })
  markAllRead(@CurrentUser() user: JwtPayload): Promise<{ updated: number }> {
    return this.service.markAllRead(user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(Permission.NOTIFICATIONS_READ)
  @ApiOperation({ summary: 'Delete a notification', operationId: 'deleteNotification' })
  @ApiNoContentResponse()
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.service.remove(id, user.sub);
  }
}
