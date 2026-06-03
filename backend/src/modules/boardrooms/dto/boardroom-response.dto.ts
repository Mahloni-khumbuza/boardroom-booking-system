import { ApiProperty } from '@nestjs/swagger';
import { AmenityResponseDto } from '../../amenities/dto/amenity-response.dto';
import { EquipmentStatus } from '../entities/boardroom.entity';

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

  @ApiProperty({ enum: EquipmentStatus, example: EquipmentStatus.Ok })
  equipmentStatus: EquipmentStatus;

  @ApiProperty({ type: [AmenityResponseDto] })
  amenities: AmenityResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
