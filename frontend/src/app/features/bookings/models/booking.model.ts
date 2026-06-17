import { Amenity } from '../../boardrooms/models/boardroom.model';

export type BookingStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export interface BookingBoardroom {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
}

export interface BookingActor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Booking {
  id: string;
  title: string;
  description: string | null;
  startDateTime: string;
  endDateTime: string;
  attendeeCount: number;
  status: BookingStatus;
  meetingType: string;
  requiresCatering: boolean;
  cateringNotes: string | null;
  requiresSetup: boolean;
  setupNotes: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  rejectionReason: string | null;
  boardroom: BookingBoardroom;
  bookedByUser: BookingActor | null;
  approvedByUser: BookingActor | null;
  approvedAt: string | null;
  rejectedByUser: BookingActor | null;
  rejectedAt: string | null;
  requestedAmenities: Amenity[];
  createdAt: string;
  updatedAt: string;
}

export interface BookingCreateRequest {
  title: string;
  description?: string;
  boardroomId: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  meetingType?: string;
  requiresCatering?: boolean;
  cateringNotes?: string;
  requiresSetup?: boolean;
  setupNotes?: string;
  requestedAmenityIds?: string[];
}

export interface BookingUpdateRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  attendeeCount?: number;
  requestedAmenityIds?: string[];
}

export interface RejectBookingRequest {
  reason: string;
}

export interface CancelBookingRequest {
  reason?: string;
}

export interface BookingQuery {
  status?: BookingStatus;
  boardroomId?: string;
  bookedById?: string;
  mine?: boolean;
  from?: string;
  to?: string;
}
