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
import type { JwtPayload } from '../../auth/services/auth.service';
import { BoardroomBlocksService } from '../services/boardroom-blocks.service';
import { BoardroomBlockQueryDto } from '../dto/boardroom-block-query.dto';
import { BoardroomBlockResponseDto } from '../dto/boardroom-block-response.dto';
import { CreateBoardroomBlockDto } from '../dto/create-boardroom-block.dto';
import { UpdateBoardroomBlockDto } from '../dto/update-boardroom-block.dto';

@ApiTags('boardroom-blocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('boardroom-blocks')
export class BoardroomBlocksController {
  constructor(private readonly service: BoardroomBlocksService) {}

  @Get()
  @Permissions(Permission.BOARDROOM_BLOCKS_READ)
  @ApiOperation({ summary: 'List boardroom blocks', operationId: 'listBoardroomBlocks' })
  @ApiOkResponse({ type: [BoardroomBlockResponseDto] })
  findAll(@Query() query: BoardroomBlockQueryDto): Promise<BoardroomBlockResponseDto[]> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions(Permission.BOARDROOM_BLOCKS_READ)
  @ApiOperation({ summary: 'Get boardroom block by ID', operationId: 'getBoardroomBlock' })
  @ApiOkResponse({ type: BoardroomBlockResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<BoardroomBlockResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions(Permission.BOARDROOM_BLOCKS_WRITE)
  @ApiOperation({ summary: 'Create a boardroom block', operationId: 'createBoardroomBlock' })
  @ApiBody({ type: CreateBoardroomBlockDto })
  @ApiCreatedResponse({ type: BoardroomBlockResponseDto })
  create(
    @Body() dto: CreateBoardroomBlockDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BoardroomBlockResponseDto> {
    return this.service.create(dto, user.sub);
  }

  @Patch(':id')
  @Permissions(Permission.BOARDROOM_BLOCKS_WRITE)
  @ApiOperation({ summary: 'Update a boardroom block', operationId: 'updateBoardroomBlock' })
  @ApiBody({ type: UpdateBoardroomBlockDto })
  @ApiOkResponse({ type: BoardroomBlockResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBoardroomBlockDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BoardroomBlockResponseDto> {
    return this.service.update(id, dto, user.sub);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.BOARDROOM_BLOCKS_WRITE)
  @ApiOperation({ summary: 'Activate a boardroom block', operationId: 'activateBoardroomBlock' })
  @ApiOkResponse({ type: BoardroomBlockResponseDto })
  activate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<BoardroomBlockResponseDto> {
    return this.service.activate(id, user.sub);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.BOARDROOM_BLOCKS_WRITE)
  @ApiOperation({ summary: 'Deactivate a boardroom block', operationId: 'deactivateBoardroomBlock' })
  @ApiOkResponse({ type: BoardroomBlockResponseDto })
  deactivate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<BoardroomBlockResponseDto> {
    return this.service.deactivate(id, user.sub);
  }

  @Delete(':id')
  @Permissions(Permission.BOARDROOM_BLOCKS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a boardroom block', operationId: 'deleteBoardroomBlock' })
  @ApiNoContentResponse()
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.service.remove(id, user.sub);
  }
}
