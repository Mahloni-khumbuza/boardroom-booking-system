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
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { ActorContext, BookingsService } from '../services/bookings.service';
import { Booking } from '../entities/booking.entity';
import { BookingQueryDto } from '../dto/booking-query.dto';
import { BookingResponseDto } from '../dto/booking-response.dto';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';

interface AuthedRequest {
  user: { sub: string; role: string | null };
}

function actor(req: AuthedRequest): ActorContext {
  return { id: req.user.sub, role: req.user.role };
}

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Get()
  @Permissions('bookings:read')
  @ApiOkResponse({ type: [BookingResponseDto] })
  findAll(@Query() query: BookingQueryDto, @Req() req: AuthedRequest): Promise<Booking[]> {
    return this.service.findAll(query, actor(req));
  }

  @Get(':id')
  @Permissions('bookings:read')
  @ApiOkResponse({ type: BookingResponseDto })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthedRequest,
  ): Promise<Booking> {
    return this.service.findOne(id, actor(req));
  }

  @Post()
  @Permissions('bookings:write')
  @ApiCreatedResponse({ type: BookingResponseDto })
  create(@Body() dto: CreateBookingDto, @Req() req: AuthedRequest): Promise<Booking> {
    return this.service.create(dto, actor(req));
  }

  @Patch(':id')
  @Permissions('bookings:write')
  @ApiOkResponse({ type: BookingResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBookingDto,
    @Req() req: AuthedRequest,
  ): Promise<Booking> {
    return this.service.update(id, dto, actor(req));
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Permissions('bookings:approve')
  @ApiOkResponse({ type: BookingResponseDto })
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthedRequest,
  ): Promise<Booking> {
    return this.service.approve(id, actor(req));
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Permissions('bookings:cancel')
  @ApiOkResponse({ type: BookingResponseDto })
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthedRequest,
  ): Promise<Booking> {
    return this.service.cancel(id, actor(req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('bookings:delete')
  @ApiNoContentResponse()
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthedRequest,
  ): Promise<void> {
    return this.service.remove(id, actor(req));
  }
}
