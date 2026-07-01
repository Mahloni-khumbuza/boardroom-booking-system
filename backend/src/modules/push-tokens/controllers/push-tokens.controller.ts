import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/services/auth.service';
import { PushTokensService } from '../services/push-tokens.service';
import { RegisterTokenDto } from '../dto/register-token.dto';
import { RemoveTokenDto } from '../dto/remove-token.dto';

@ApiTags('push-tokens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('push-tokens')
export class PushTokensController {
  constructor(private readonly service: PushTokensService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register or refresh a push token for the current user', operationId: 'registerPushToken' })
  @ApiOkResponse({ schema: { properties: { id: { type: 'string' } } } })
  register(
    @Body() dto: RegisterTokenDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ id: string }> {
    return this.service.register(user.sub, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a push token (call on logout)', operationId: 'removePushToken' })
  @ApiNoContentResponse()
  remove(
    @Body() dto: RemoveTokenDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.service.remove(user.sub, dto.token);
  }

  @Delete('all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove all push tokens for the current user', operationId: 'removeAllPushTokens' })
  @ApiNoContentResponse()
  removeAll(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.service.removeAllForUser(user.sub);
  }
}
