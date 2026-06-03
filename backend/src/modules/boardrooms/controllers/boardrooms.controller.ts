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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { BoardroomQueryDto } from '../dto/boardroom-query.dto';
import { BoardroomResponseDto } from '../dto/boardroom-response.dto';
import { CreateBoardroomDto } from '../dto/create-boardroom.dto';
import { UpdateBoardroomDto } from '../dto/update-boardroom.dto';
import { EquipmentStatus } from '../entities/boardroom.entity';
import { BoardroomsService } from '../services/boardrooms.service';

class UpdateEquipmentStatusDto {
  @ApiProperty({ enum: EquipmentStatus })
  @IsEnum(EquipmentStatus)
  equipmentStatus: EquipmentStatus;
}

@ApiTags('boardrooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('boardrooms')
export class BoardroomsController {
  constructor(private readonly boardroomsService: BoardroomsService) {}

  @Get()
  @Permissions('boardrooms:read')
  @ApiOperation({ summary: 'List all boardrooms', operationId: 'listBoardrooms' })
  @ApiOkResponse({ type: [BoardroomResponseDto] })
  findAll(@Query() query: BoardroomQueryDto): Promise<BoardroomResponseDto[]> {
    return this.boardroomsService.findAll(query);
  }

  @Get(':id')
  @Permissions('boardrooms:read')
  @ApiOperation({ summary: 'Get boardroom by ID', operationId: 'getBoardroom' })
  @ApiOkResponse({ type: BoardroomResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<BoardroomResponseDto> {
    return this.boardroomsService.findOne(id);
  }

  @Post()
  @Permissions('boardrooms:write')
  @ApiOperation({ summary: 'Create a boardroom', operationId: 'createBoardroom' })
  @ApiCreatedResponse({ type: BoardroomResponseDto })
  create(@Body() dto: CreateBoardroomDto): Promise<BoardroomResponseDto> {
    return this.boardroomsService.create(dto);
  }

  @Patch(':id')
  @Permissions('boardrooms:write')
  @ApiOperation({ summary: 'Update a boardroom', operationId: 'updateBoardroom' })
  @ApiOkResponse({ type: BoardroomResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBoardroomDto,
  ): Promise<BoardroomResponseDto> {
    return this.boardroomsService.update(id, dto);
  }

  @Patch(':id/equipment-status')
  @Permissions('rooms:equipment')
  @ApiOperation({ summary: 'Update room equipment status', operationId: 'updateEquipmentStatus' })
  @ApiOkResponse({ type: BoardroomResponseDto })
  updateEquipmentStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEquipmentStatusDto,
  ): Promise<BoardroomResponseDto> {
    return this.boardroomsService.update(id, { equipmentStatus: dto.equipmentStatus });
  }

  @Delete(':id')
  @Permissions('boardrooms:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a boardroom', operationId: 'deleteBoardroom' })
  @ApiNoContentResponse()
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.boardroomsService.remove(id);
  }
}
