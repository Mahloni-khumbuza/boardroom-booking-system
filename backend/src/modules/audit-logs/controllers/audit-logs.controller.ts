import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permission } from '../../../shared/constants/permissions';
import { AuditLogsService } from '../services/audit-logs.service';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';
import { AuditLogResponseDto, PaginatedAuditLogResponseDto } from '../dto/audit-log-response.dto';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Permissions(Permission.AUDIT_LOGS_READ)
  @ApiOperation({ summary: 'List audit logs with optional filters', operationId: 'listAuditLogs' })
  @ApiOkResponse({ type: PaginatedAuditLogResponseDto })
  findAll(@Query() query: AuditLogQueryDto): Promise<PaginatedAuditLogResponseDto> {
    return this.auditLogsService.findAll(query);
  }

  @Get(':id')
  @Permissions(Permission.AUDIT_LOGS_READ)
  @ApiOperation({ summary: 'Get audit log by ID', operationId: 'getAuditLog' })
  @ApiOkResponse({ type: AuditLogResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<AuditLogResponseDto> {
    return this.auditLogsService.findOne(id);
  }
}
