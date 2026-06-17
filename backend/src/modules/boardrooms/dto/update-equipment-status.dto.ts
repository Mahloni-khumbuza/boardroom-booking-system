import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EquipmentStatus } from '../entities/boardroom.entity';

export class UpdateEquipmentStatusDto {
  @ApiProperty({ enum: EquipmentStatus, example: EquipmentStatus.NeedsAttention })
  @IsEnum(EquipmentStatus)
  equipmentStatus!: EquipmentStatus;
}
