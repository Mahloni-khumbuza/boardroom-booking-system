import { Amenity } from '../../boardrooms/models/boardroom.model';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

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
  startTime: string;
  endTime: string;
  attendeeCount: number;
  status: BookingStatus;
  boardroom: BookingBoardroom;
  bookedBy: BookingActor | null;
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

export interface BookingQuery {
  status?: BookingStatus;
  boardroomId?: string;
  bookedById?: string;
  mine?: boolean;
  from?: string;
  to?: string;
}
