import { ApiProperty } from '@nestjs/swagger';
import { AmenityResponseDto } from '../../amenities/dto/amenity-response.dto';
import { Boardroom, EquipmentStatus } from '../entities/boardroom.entity';

export class BoardroomResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Maple Boardroom' })
  name: string;

  @ApiProperty({ nullable: true })
  code: string | null;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 12 })
  capacity: number;

  @ApiProperty({ nullable: true })
  location: string | null;

  @ApiProperty({ nullable: true })
  floor: string | null;

  @ApiProperty({ nullable: true })
  building: string | null;

  @ApiProperty({ nullable: true })
  imageUrl: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isBookable: boolean;

  @ApiProperty()
  requiresApproval: boolean;

  @ApiProperty({ example: '08:00' })
  openingTime: string;

  @ApiProperty({ example: '18:00' })
  closingTime: string;

  @ApiProperty()
  minimumBookingMinutes: number;

  @ApiProperty()
  maximumBookingMinutes: number;

  @ApiProperty()
  bufferTimeBeforeMinutes: number;

  @ApiProperty()
  bufferTimeAfterMinutes: number;

  @ApiProperty({ enum: EquipmentStatus })
  equipmentStatus: EquipmentStatus;

  @ApiProperty({ type: [AmenityResponseDto] })
  amenities: AmenityResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(room: Boardroom): BoardroomResponseDto {
    const dto = new BoardroomResponseDto();
    dto.id = room.id;
    dto.name = room.name;
    dto.code = room.code;
    dto.description = room.description;
    dto.capacity = room.capacity;
    dto.location = room.location;
    dto.floor = room.floor;
    dto.building = room.building;
    dto.imageUrl = room.imageUrl;
    dto.isActive = room.isActive;
    dto.isBookable = room.isBookable;
    dto.requiresApproval = room.requiresApproval;
    dto.openingTime = room.openingTime;
    dto.closingTime = room.closingTime;
    dto.minimumBookingMinutes = room.minimumBookingMinutes;
    dto.maximumBookingMinutes = room.maximumBookingMinutes;
    dto.bufferTimeBeforeMinutes = room.bufferTimeBeforeMinutes;
    dto.bufferTimeAfterMinutes = room.bufferTimeAfterMinutes;
    dto.equipmentStatus = room.equipmentStatus;
    dto.amenities = (room.amenities ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
    dto.createdAt = room.createdAt;
    dto.updatedAt = room.updatedAt;
    return dto;
  }

  static collection(rooms: Boardroom[]): BoardroomResponseDto[] {
    return rooms.map(BoardroomResponseDto.fromEntity);
  }
}
