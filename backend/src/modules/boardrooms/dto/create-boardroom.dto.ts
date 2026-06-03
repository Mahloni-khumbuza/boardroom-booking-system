import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EquipmentStatus } from '../entities/boardroom.entity';

export class CreateBoardroomDto {
  @ApiProperty({ example: 'Maple Boardroom' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'Window-facing room on 3rd floor', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  @Max(1000)
  capacity: number;

  @ApiProperty({ example: 'Floor 3, East Wing', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ example: 'BR01', required: false, description: 'Short unique code for the room' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiProperty({ example: 'Level 3', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  floor?: string;

  @ApiProperty({ example: 'Head Office', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  building?: string;

  @ApiProperty({ required: false, description: 'URL to room image' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiProperty({ example: '08:00', required: false })
  @IsOptional()
  @IsString()
  openingTime?: string;

  @ApiProperty({ example: '18:00', required: false })
  @IsOptional()
  @IsString()
  closingTime?: string;

  @ApiProperty({ example: 15, required: false, description: 'Minimum booking duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(5)
  minimumBookingMinutes?: number;

  @ApiProperty({ example: 480, required: false, description: 'Maximum booking duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(15)
  maximumBookingMinutes?: number;

  @ApiProperty({ example: 0, required: false, description: 'Buffer before booking in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  bufferTimeBeforeMinutes?: number;

  @ApiProperty({ example: 0, required: false, description: 'Buffer after booking in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  bufferTimeAfterMinutes?: number;

  @ApiProperty({ type: [String], required: false, description: 'Amenity UUIDs' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  amenityIds?: string[];

  @ApiProperty({ enum: EquipmentStatus, required: false, default: EquipmentStatus.Ok })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  equipmentStatus?: EquipmentStatus;
}
