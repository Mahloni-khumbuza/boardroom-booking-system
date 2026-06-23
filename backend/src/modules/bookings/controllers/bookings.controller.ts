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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { RoleName } from '../../../shared/constants/role-name';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { BookingsService } from '../services/bookings.service';
import { BookingResponseDto, CalendarEventResponseDto } from '../dto/booking-response.dto';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { CancelBookingDto, RejectBookingDto } from '../dto/review-booking.dto';

type BookingReminderProcessingResponse = {
  windowMinutes: number;
  sent: number;
  failed: number;
  skipped: number;
};

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACILITIES_MANAGER)
  @ApiOperation({ summary: 'Get all bookings with optional filters', operationId: 'listBookings' })
  @ApiQuery({ name: 'status', required: false, example: 'APPROVED' })
  @ApiQuery({ name: 'boardroomId', required: false })
  @ApiOkResponse({ type: [BookingResponseDto] })
  findAll(@Query() query: Record<string, string>): Promise<BookingResponseDto[]> {
    return this.bookingsService.findAll(query);
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get bookings for the signed-in user', operationId: 'myBookings' })
  @ApiOkResponse({ type: [BookingResponseDto] })
  myBookings(@CurrentUser() user: User): Promise<BookingResponseDto[]> {
    return this.bookingsService.myBookings(user);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get booking events for calendar view', operationId: 'getCalendar' })
  @ApiQuery({ name: 'startDateTime', required: false })
  @ApiQuery({ name: 'endDateTime', required: false })
  @ApiOkResponse({ type: [CalendarEventResponseDto] })
  calendar(@Query() query: Record<string, string>): Promise<CalendarEventResponseDto[]> {
    return this.bookingsService.calendar(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID', operationId: 'getBooking' })
  @ApiOkResponse({ type: BookingResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<BookingResponseDto> {
    return this.bookingsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create booking', operationId: 'createBooking' })
  @ApiBody({ type: CreateBookingDto })
  @ApiCreatedResponse({
    type: BookingResponseDto,
    description: 'Booking created. Status is APPROVED or PENDING_APPROVAL depending on room rules.',
  })
  create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update booking', operationId: 'updateBooking' })
  @ApiBody({ type: UpdateBookingDto })
  @ApiOkResponse({ type: BookingResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBookingDto,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.update(id, dto, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking', operationId: 'cancelBooking' })
  @ApiBody({ type: CancelBookingDto })
  @ApiOkResponse({ type: BookingResponseDto })
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
    @Body() dto: CancelBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.cancel(id, user, dto?.reason);
  }

  @Patch(':id/approve')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACILITIES_MANAGER)
  @ApiOperation({ summary: 'Approve pending booking', operationId: 'approveBooking' })
  @ApiOkResponse({ type: BookingResponseDto })
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.approve(id, user);
  }

  @Patch(':id/reject')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACILITIES_MANAGER)
  @ApiOperation({ summary: 'Reject pending booking', operationId: 'rejectBooking' })
  @ApiBody({ type: RejectBookingDto })
  @ApiOkResponse({ type: BookingResponseDto })
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectBookingDto,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.reject(id, user, dto.reason);
  }

  @Patch(':id/complete')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACILITIES_MANAGER)
  @ApiOperation({ summary: 'Mark booking as completed', operationId: 'completeBooking' })
  @ApiOkResponse({ type: BookingResponseDto })
  complete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.complete(id, user);
  }

  @Patch(':id/no-show')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACILITIES_MANAGER)
  @ApiOperation({ summary: 'Mark booking as no-show', operationId: 'noShowBooking' })
  @ApiOkResponse({ type: BookingResponseDto })
  noShow(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.noShow(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete a cancelled booking', operationId: 'deleteBooking' })
  @ApiNoContentResponse()
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.bookingsService.remove(id, user);
  }

  @Post('send-reminders')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACILITIES_MANAGER)
  @ApiOperation({ summary: 'Send due booking reminder emails', operationId: 'sendReminders' })
  @ApiOkResponse({ description: 'Returns reminder processing counts.' })
  sendDueReminders(): Promise<BookingReminderProcessingResponse> {
    return this.bookingsService.sendDueReminders();
  }
}
