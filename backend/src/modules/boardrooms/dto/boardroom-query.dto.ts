import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class BoardroomQueryDto {
  @ApiPropertyOptional({ description: 'Only return active boardrooms' })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' || value === true ? true : value === 'false' || value === false ? false : value,
  )
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Minimum capacity required', example: 10 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  minCapacity?: number;

  @ApiPropertyOptional({ description: 'Filter by location (partial, case-insensitive)', example: 'Floor 2' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    description: 'Only return boardrooms that have ALL of these amenity IDs',
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : undefined))
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  amenityIds?: string[];
}
