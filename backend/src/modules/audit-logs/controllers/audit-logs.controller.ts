import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('audit-logs')
@Controller('audit-logs')
export class AuditLogsController {}
