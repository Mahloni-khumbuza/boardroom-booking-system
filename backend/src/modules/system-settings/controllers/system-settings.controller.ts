import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
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
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permission } from '../../../shared/constants/permissions';
import { CreateSystemSettingDto } from '../dto/create-system-setting.dto';
import { SystemSettingResponseDto } from '../dto/system-setting-response.dto';
import { UpdateSystemSettingDto } from '../dto/update-system-setting.dto';
import { SystemSettingsService } from '../services/system-settings.service';

interface AuthedRequest {
  user: { sub: string };
}

@ApiTags('system-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly service: SystemSettingsService) {}

  @Get()
  @Permissions(Permission.SETTINGS_READ)
  @ApiOperation({ summary: 'List all system settings', operationId: 'listSystemSettings' })
  @ApiOkResponse({ type: [SystemSettingResponseDto] })
  findAll(): Promise<SystemSettingResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @Permissions(Permission.SETTINGS_READ)
  @ApiOperation({ summary: 'Get system setting by ID', operationId: 'getSystemSetting' })
  @ApiOkResponse({ type: SystemSettingResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<SystemSettingResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions(Permission.SETTINGS_WRITE)
  @ApiOperation({ summary: 'Create a system setting', operationId: 'createSystemSetting' })
  @ApiCreatedResponse({ type: SystemSettingResponseDto })
  create(@Body() dto: CreateSystemSettingDto, @Req() req: AuthedRequest): Promise<SystemSettingResponseDto> {
    return this.service.create(dto, req.user.sub);
  }

  @Patch(':id')
  @Permissions(Permission.SETTINGS_WRITE)
  @ApiOperation({ summary: 'Update a system setting', operationId: 'updateSystemSetting' })
  @ApiOkResponse({ type: SystemSettingResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSystemSettingDto,
    @Req() req: AuthedRequest,
  ): Promise<SystemSettingResponseDto> {
    return this.service.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @Permissions(Permission.SETTINGS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a system setting', operationId: 'deleteSystemSetting' })
  @ApiNoContentResponse()
  remove(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: AuthedRequest): Promise<void> {
    return this.service.remove(id, req.user.sub);
  }
}
