import { Controller, ForbiddenException, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import {
  DashboardStatsDto,
  EmployeeDashboardStatsDto,
} from '../dto/dashboard-stats.dto';
import { DashboardService } from '../services/dashboard.service';

const ADMIN_ROLES = new Set(['SuperAdmin', 'Admin', 'FacilitiesManager']);

interface AuthedRequest {
  user: { sub: string; role: string | null };
}

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('admin')
  @Permissions('dashboard:read')
  @ApiOperation({ summary: 'Get admin dashboard stats', operationId: 'getAdminDashboard' })
  @ApiOkResponse({ type: DashboardStatsDto })
  getAdmin(@Req() req: AuthedRequest): Promise<DashboardStatsDto> {
    if (!req.user.role || !ADMIN_ROLES.has(req.user.role)) {
      throw new ForbiddenException('Admin-tier role required');
    }
    return this.service.getAdminStats();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get personal dashboard stats', operationId: 'getMyDashboard' })
  @ApiOkResponse({ type: EmployeeDashboardStatsDto })
  getMe(@Req() req: AuthedRequest): Promise<EmployeeDashboardStatsDto> {
    return this.service.getEmployeeStats(req.user.sub);
  }
}
