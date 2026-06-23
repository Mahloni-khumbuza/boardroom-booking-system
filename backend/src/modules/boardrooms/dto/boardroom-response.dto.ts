import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { AmenityResponseDto } from '../../amenities/dto/amenity-response.dto';
import { EquipmentStatus } from '../entities/boardroom.entity';

export class BoardroomResponseDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty({ example: 'Maple Boardroom' })
  name: string;

  @AutoMap()
  @ApiProperty({ nullable: true })
  code: string | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  description: string | null;

  @AutoMap()
  @ApiProperty({ example: 12 })
  capacity: number;

  @AutoMap()
  @ApiProperty({ nullable: true })
  location: string | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  floor: string | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  building: string | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  imageUrl: string | null;

  @AutoMap()
  @ApiProperty()
  isActive: boolean;

  @AutoMap()
  @ApiProperty()
  isBookable: boolean;

  @AutoMap()
  @ApiProperty()
  requiresApproval: boolean;

  @AutoMap()
  @ApiProperty({ example: '08:00' })
  openingTime: string;

  @AutoMap()
  @ApiProperty({ example: '18:00' })
  closingTime: string;

  @AutoMap()
  @ApiProperty()
  minimumBookingMinutes: number;

  @AutoMap()
  @ApiProperty()
  maximumBookingMinutes: number;

  @AutoMap()
  @ApiProperty()
  bufferTimeBeforeMinutes: number;

  @AutoMap()
  @ApiProperty()
  bufferTimeAfterMinutes: number;

  @AutoMap()
  @ApiProperty({ enum: EquipmentStatus })
  equipmentStatus: EquipmentStatus;

  @AutoMap()
  @ApiProperty({ type: [AmenityResponseDto] })
  amenities: AmenityResponseDto[];

  @AutoMap()
  @ApiProperty()
  createdAt: Date;

  @AutoMap()
  @ApiProperty()
  updatedAt: Date;
}
