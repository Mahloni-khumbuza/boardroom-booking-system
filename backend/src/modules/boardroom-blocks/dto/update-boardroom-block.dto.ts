import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateBoardroomBlockDto } from './create-boardroom-block.dto';

export class UpdateBoardroomBlockDto extends PartialType(
  OmitType(CreateBoardroomBlockDto, ['boardroomId'] as const),
) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
