export interface Amenity {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Boardroom {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  capacity: number;
  location: string | null;
  floor: string | null;
  building: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isBookable: boolean;
  requiresApproval: boolean;
  openingTime: string;
  closingTime: string;
  minimumBookingMinutes: number;
  maximumBookingMinutes: number;
  bufferTimeBeforeMinutes: number;
  bufferTimeAfterMinutes: number;
  equipmentStatus: string;
  amenities: Amenity[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardroomCreateRequest {
  name: string;
  code?: string;
  description?: string;
  capacity: number;
  location?: string;
  floor?: string;
  building?: string;
  imageUrl?: string;
  isActive?: boolean;
  isBookable?: boolean;
  requiresApproval?: boolean;
  openingTime?: string;
  closingTime?: string;
  minimumBookingMinutes?: number;
  maximumBookingMinutes?: number;
  bufferTimeBeforeMinutes?: number;
  bufferTimeAfterMinutes?: number;
  equipmentStatus?: string;
  amenityIds?: string[];
}

export type BoardroomUpdateRequest = Partial<BoardroomCreateRequest>;

export interface AmenityCreateRequest {
  name: string;
  description?: string;
  icon?: string;
}

export type AmenityUpdateRequest = Partial<AmenityCreateRequest>;
