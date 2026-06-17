import { ApiProperty } from '@nestjs/swagger';
import { BoardroomBlock } from '../entities/boardroom-block.entity';

export class BlockBoardroomDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class BlockUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;
}

export class BoardroomBlockResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: BlockBoardroomDto, nullable: true })
  boardroom: BlockBoardroomDto | null;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: BlockUserDto, nullable: true })
  createdBy: BlockUserDto | null;

  @ApiProperty({ nullable: true })
  createdById: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(block: BoardroomBlock): BoardroomBlockResponseDto {
    const dto = new BoardroomBlockResponseDto();
    dto.id = block.id;
    dto.boardroom = block.boardroom
      ? { id: block.boardroom.id, name: block.boardroom.name }
      : null;
    dto.startTime = block.startTime;
    dto.endTime = block.endTime;
    dto.reason = block.reason;
    dto.isActive = block.isActive;
    dto.createdBy = block.createdBy
      ? { id: block.createdBy.id, firstName: block.createdBy.firstName, lastName: block.createdBy.lastName }
      : null;
    dto.createdById = block.createdById;
    dto.createdAt = block.createdAt;
    dto.updatedAt = block.updatedAt;
    return dto;
  }

  static collection(blocks: BoardroomBlock[]): BoardroomBlockResponseDto[] {
    return blocks.map(BoardroomBlockResponseDto.fromEntity);
  }
}
