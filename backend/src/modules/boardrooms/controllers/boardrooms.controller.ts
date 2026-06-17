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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
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
import { User } from '../../users/entities/user.entity';
import { BoardroomsService } from '../services/boardrooms.service';
import { BoardroomQueryDto } from '../dto/boardroom-query.dto';
import { BoardroomResponseDto } from '../dto/boardroom-response.dto';
import { CreateBoardroomDto } from '../dto/create-boardroom.dto';
import { UpdateBoardroomDto } from '../dto/update-boardroom.dto';
import { UpdateEquipmentStatusDto } from '../dto/update-equipment-status.dto';
import { AvailabilityQueryDto, AvailabilityResponseDto } from '../dto/availability-query.dto';

@ApiTags('boardrooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('boardrooms')
export class BoardroomsController {
  constructor(private readonly boardroomsService: BoardroomsService) {}

  @Get()
  @Permissions(Permission.BOARDROOMS_READ)
  @ApiOperation({ summary: 'List all boardrooms', operationId: 'listBoardrooms' })
  @ApiOkResponse({ type: [BoardroomResponseDto] })
  findAll(@Query() query: BoardroomQueryDto): Promise<BoardroomResponseDto[]> {
    return this.boardroomsService.findAll(query);
  }

  @Get(':id')
  @Permissions(Permission.BOARDROOMS_READ)
  @ApiOperation({ summary: 'Get boardroom by ID', operationId: 'getBoardroom' })
  @ApiOkResponse({ type: BoardroomResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<BoardroomResponseDto> {
    return this.boardroomsService.findOne(id);
  }

  @Get(':id/availability')
  @Permissions(Permission.BOARDROOMS_READ)
  @ApiOperation({ summary: 'Get boardroom availability for a date', operationId: 'getBoardroomAvailability' })
  @ApiOkResponse({ description: 'Available time slots for the given date.' })
  getAvailability(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: AvailabilityQueryDto,
  ): Promise<AvailabilityResponseDto> {
    return this.boardroomsService.getAvailability(id, query);
  }

  @Post()
  @Permissions(Permission.BOARDROOMS_WRITE)
  @ApiOperation({ summary: 'Create a boardroom', operationId: 'createBoardroom' })
  @ApiBody({ type: CreateBoardroomDto })
  @ApiCreatedResponse({ type: BoardroomResponseDto })
  create(@Body() dto: CreateBoardroomDto, @CurrentUser() user: User): Promise<BoardroomResponseDto> {
    return this.boardroomsService.create(dto, user?.id);
  }

  @Patch(':id')
  @Permissions(Permission.BOARDROOMS_WRITE)
  @ApiOperation({ summary: 'Update a boardroom', operationId: 'updateBoardroom' })
  @ApiBody({ type: UpdateBoardroomDto })
  @ApiOkResponse({ type: BoardroomResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBoardroomDto,
    @CurrentUser() user: User,
  ): Promise<BoardroomResponseDto> {
    return this.boardroomsService.update(id, dto, user?.id);
  }

  @Patch(':id/equipment-status')
  @Permissions(Permission.ROOMS_EQUIPMENT)
  @ApiOperation({ summary: 'Update boardroom equipment status (Facilities Manager)', operationId: 'updateEquipmentStatus' })
  @ApiBody({ type: UpdateEquipmentStatusDto })
  @ApiOkResponse({ type: BoardroomResponseDto })
  updateEquipmentStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEquipmentStatusDto,
    @CurrentUser() user: User,
  ): Promise<BoardroomResponseDto> {
    return this.boardroomsService.update(id, { equipmentStatus: dto.equipmentStatus }, user?.id);
  }

  @Delete(':id')
  @Permissions(Permission.BOARDROOMS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a boardroom', operationId: 'deleteBoardroom' })
  @ApiNoContentResponse()
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User): Promise<void> {
    return this.boardroomsService.remove(id, user?.id);
  }
}
