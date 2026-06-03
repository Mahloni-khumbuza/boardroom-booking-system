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
import { ActorContext, BookingsService } from '../services/bookings.service';
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
  @ApiOperation({ summary: 'List bookings', operationId: 'listBookings' })
  @ApiOkResponse({ type: [BookingResponseDto] })
  findAll(@Query() query: BookingQueryDto, @Req() req: AuthedRequest): Promise<BookingResponseDto[]> {
    return this.service.findAll(query, actor(req));
  }

  @Get(':id')
  @Permissions('bookings:read')
  @ApiOperation({ summary: 'Get booking by ID', operationId: 'getBooking' })
  @ApiOkResponse({ type: BookingResponseDto })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthedRequest,
  ): Promise<BookingResponseDto> {
    return this.service.findOne(id, actor(req));
  }

  @Post()
  @Permissions('bookings:write')
  @ApiOperation({ summary: 'Create a booking', operationId: 'createBooking' })
  @ApiCreatedResponse({ type: BookingResponseDto })
  create(@Body() dto: CreateBookingDto, @Req() req: AuthedRequest): Promise<BookingResponseDto> {
    return this.service.create(dto, actor(req));
  }

  @Patch(':id')
  @Permissions('bookings:write')
  @ApiOperation({ summary: 'Update a booking', operationId: 'updateBooking' })
  @ApiOkResponse({ type: BookingResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBookingDto,
    @Req() req: AuthedRequest,
  ): Promise<BookingResponseDto> {
    return this.service.update(id, dto, actor(req));
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Permissions('bookings:approve')
  @ApiOperation({ summary: 'Approve a pending booking', operationId: 'approveBooking' })
  @ApiOkResponse({ type: BookingResponseDto })
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthedRequest,
  ): Promise<BookingResponseDto> {
    return this.service.approve(id, actor(req));
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @Permissions('bookings:approve')
  @ApiOperation({ summary: 'Mark a booking as completed', operationId: 'completeBooking' })
  @ApiOkResponse({ type: BookingResponseDto })
  complete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthedRequest,
  ): Promise<BookingResponseDto> {
    return this.service.complete(id, actor(req));
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Permissions('bookings:cancel')
  @ApiOperation({ summary: 'Cancel a booking', operationId: 'cancelBooking' })
  @ApiOkResponse({ type: BookingResponseDto })
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthedRequest,
  ): Promise<BookingResponseDto> {
    return this.service.cancel(id, actor(req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('bookings:delete')
  @ApiOperation({ summary: 'Permanently delete a booking', operationId: 'deleteBooking' })
  @ApiNoContentResponse()
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthedRequest,
  ): Promise<void> {
    return this.service.remove(id, actor(req));
  }
}
