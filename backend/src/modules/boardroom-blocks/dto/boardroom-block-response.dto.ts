import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';

export class BlockBoardroomDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty()
  name: string;
}

export class BlockUserDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty()
  firstName: string;

  @AutoMap()
  @ApiProperty()
  lastName: string;
}

export class BoardroomBlockResponseDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty({ type: BlockBoardroomDto, nullable: true })
  boardroom: BlockBoardroomDto | null;

  @AutoMap()
  @ApiProperty()
  startTime: Date;

  @AutoMap()
  @ApiProperty()
  endTime: Date;

  @AutoMap()
  @ApiProperty()
  reason: string;

  @AutoMap()
  @ApiProperty()
  isActive: boolean;

  @AutoMap()
  @ApiProperty({ type: BlockUserDto, nullable: true })
  createdBy: BlockUserDto | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  createdById: string | null;

  @AutoMap()
  @ApiProperty()
  createdAt: Date;

  @AutoMap()
  @ApiProperty()
  updatedAt: Date;
}
