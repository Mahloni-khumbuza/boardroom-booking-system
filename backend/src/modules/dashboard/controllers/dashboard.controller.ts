import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Permission } from '../../../shared/constants/permissions';
import { RoleName } from '../../../shared/constants/role-name';
import type { JwtPayload } from '../../auth/services/auth.service';
import { DashboardService } from '../services/dashboard.service';
import { DashboardStatsDto, EmployeeDashboardStatsDto } from '../dto/dashboard-stats.dto';
import {
  BookingsByDepartmentDto,
  CancellationReportDto,
  PeakHourDto,
  ReportingQueryDto,
  RoomUsageRankDto,
  RoomUtilisationDto,
} from '../dto/reporting.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('admin')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACILITIES_MANAGER)
  @Permissions(Permission.DASHBOARD_READ)
  @ApiOperation({ summary: 'Get admin dashboard stats', operationId: 'getAdminDashboard' })
  @ApiOkResponse({ type: DashboardStatsDto })
  getAdmin(): Promise<DashboardStatsDto> {
    return this.service.getAdminStats();
  }

  @Get('me')
  @Permissions(Permission.DASHBOARD_READ)
  @ApiOperation({ summary: 'Get personal dashboard stats', operationId: 'getMyDashboard' })
  @ApiOkResponse({ type: EmployeeDashboardStatsDto })
  getMe(@CurrentUser() user: JwtPayload): Promise<EmployeeDashboardStatsDto> {
    return this.service.getEmployeeStats(user.sub);
  }

  @Get('reports/utilisation')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACILITIES_MANAGER)
  @Permissions(Permission.DASHBOARD_READ)
  @ApiOperation({ summary: 'Room utilisation report', operationId: 'getUtilisationReport' })
  @ApiOkResponse({ type: [RoomUtilisationDto] })
  getUtilisation(@Query() query: ReportingQueryDto): Promise<RoomUtilisationDto[]> {
    return this.service.getRoomUtilisation(query);
  }

  @Get('reports/by-department')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACILITIES_MANAGER)
  @Permissions(Permission.DASHBOARD_READ)
  @ApiOperation({ summary: 'Bookings grouped by department', operationId: 'getBookingsByDepartment' })
  @ApiOkResponse({ type: [BookingsByDepartmentDto] })
  getByDepartment(@Query() query: ReportingQueryDto): Promise<BookingsByDepartmentDto[]> {
    return this.service.getBookingsByDepartment(query);
  }

  @Get('reports/peak-hours')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACILITIES_MANAGER)
  @Permissions(Permission.DASHBOARD_READ)
  @ApiOperation({ summary: 'Peak booking hours', operationId: 'getPeakHours' })
  @ApiOkResponse({ type: [PeakHourDto] })
  getPeakHours(@Query() query: ReportingQueryDto): Promise<PeakHourDto[]> {
    return this.service.getPeakHours(query);
  }

  @Get('reports/most-used')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACILITIES_MANAGER)
  @Permissions(Permission.DASHBOARD_READ)
  @ApiOperation({ summary: 'Most-used boardrooms', operationId: 'getMostUsedRooms' })
  @ApiOkResponse({ type: [RoomUsageRankDto] })
  getMostUsed(@Query() query: ReportingQueryDto): Promise<RoomUsageRankDto[]> {
    return this.service.getMostUsedRooms(query);
  }

  @Get('reports/least-used')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACILITIES_MANAGER)
  @Permissions(Permission.DASHBOARD_READ)
  @ApiOperation({ summary: 'Least-used boardrooms', operationId: 'getLeastUsedRooms' })
  @ApiOkResponse({ type: [RoomUsageRankDto] })
  getLeastUsed(@Query() query: ReportingQueryDto): Promise<RoomUsageRankDto[]> {
    return this.service.getLeastUsedRooms(query);
  }

  @Get('reports/cancellations')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACILITIES_MANAGER)
  @Permissions(Permission.DASHBOARD_READ)
  @ApiOperation({ summary: 'Cancellation and no-show report', operationId: 'getCancellationReport' })
  @ApiOkResponse({ type: CancellationReportDto })
  getCancellations(@Query() query: ReportingQueryDto): Promise<CancellationReportDto> {
    return this.service.getCancellationReport(query);
  }
}
