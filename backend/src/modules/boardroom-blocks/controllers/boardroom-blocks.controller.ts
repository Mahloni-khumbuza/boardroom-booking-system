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
import { BoardroomBlockQueryDto } from '../dto/boardroom-block-query.dto';
import { BoardroomBlockResponseDto } from '../dto/boardroom-block-response.dto';
import { CreateBoardroomBlockDto } from '../dto/create-boardroom-block.dto';
import { UpdateBoardroomBlockDto } from '../dto/update-boardroom-block.dto';
import { BoardroomBlocksService } from '../services/boardroom-blocks.service';

interface AuthedRequest {
  user: { sub: string };
}

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
  @ApiCreatedResponse({ type: BoardroomBlockResponseDto })
  create(
    @Body() dto: CreateBoardroomBlockDto,
    @Req() req: AuthedRequest,
  ): Promise<BoardroomBlockResponseDto> {
    return this.service.create(dto, req.user.sub);
  }

  @Patch(':id')
  @Permissions(Permission.BOARDROOM_BLOCKS_WRITE)
  @ApiOperation({ summary: 'Update a boardroom block', operationId: 'updateBoardroomBlock' })
  @ApiOkResponse({ type: BoardroomBlockResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBoardroomBlockDto,
    @Req() req: AuthedRequest,
  ): Promise<BoardroomBlockResponseDto> {
    return this.service.update(id, dto, req.user.sub);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.BOARDROOM_BLOCKS_WRITE)
  @ApiOperation({ summary: 'Activate a boardroom block', operationId: 'activateBoardroomBlock' })
  @ApiOkResponse({ type: BoardroomBlockResponseDto })
  activate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthedRequest,
  ): Promise<BoardroomBlockResponseDto> {
    return this.service.activate(id, req.user.sub);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.BOARDROOM_BLOCKS_WRITE)
  @ApiOperation({ summary: 'Deactivate a boardroom block', operationId: 'deactivateBoardroomBlock' })
  @ApiOkResponse({ type: BoardroomBlockResponseDto })
  deactivate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthedRequest,
  ): Promise<BoardroomBlockResponseDto> {
    return this.service.deactivate(id, req.user.sub);
  }

  @Delete(':id')
  @Permissions(Permission.BOARDROOM_BLOCKS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a boardroom block', operationId: 'deleteBoardroomBlock' })
  @ApiNoContentResponse()
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthedRequest,
  ): Promise<void> {
    return this.service.remove(id, req.user.sub);
  }
}
