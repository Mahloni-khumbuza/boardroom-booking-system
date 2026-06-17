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
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permission } from '../../../shared/constants/permissions';
import { AmenitiesService } from '../services/amenities.service';
import { AmenityResponseDto } from '../dto/amenity-response.dto';
import { CreateAmenityDto } from '../dto/create-amenity.dto';
import { UpdateAmenityDto } from '../dto/update-amenity.dto';

@ApiTags('amenities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get()
  @Permissions(Permission.AMENITIES_READ)
  @ApiOperation({ summary: 'List all amenities', operationId: 'listAmenities' })
  @ApiOkResponse({ type: [AmenityResponseDto] })
  findAll(): Promise<AmenityResponseDto[]> {
    return this.amenitiesService.findAll();
  }

  @Get(':id')
  @Permissions(Permission.AMENITIES_READ)
  @ApiOperation({ summary: 'Get amenity by ID', operationId: 'getAmenity' })
  @ApiOkResponse({ type: AmenityResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<AmenityResponseDto> {
    return this.amenitiesService.findOne(id);
  }

  @Post()
  @Permissions(Permission.AMENITIES_WRITE)
  @ApiOperation({ summary: 'Create an amenity', operationId: 'createAmenity' })
  @ApiBody({ type: CreateAmenityDto })
  @ApiCreatedResponse({ type: AmenityResponseDto })
  create(@Body() dto: CreateAmenityDto): Promise<AmenityResponseDto> {
    return this.amenitiesService.create(dto);
  }

  @Patch(':id')
  @Permissions(Permission.AMENITIES_WRITE)
  @ApiOperation({ summary: 'Update an amenity', operationId: 'updateAmenity' })
  @ApiBody({ type: UpdateAmenityDto })
  @ApiOkResponse({ type: AmenityResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAmenityDto,
  ): Promise<AmenityResponseDto> {
    return this.amenitiesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.AMENITIES_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an amenity', operationId: 'deleteAmenity' })
  @ApiNoContentResponse()
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.amenitiesService.remove(id);
  }
}
