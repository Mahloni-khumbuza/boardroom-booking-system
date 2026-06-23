import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';

export class AmenityResponseDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty({ example: 'Projector' })
  name: string;

  @AutoMap()
  @ApiProperty({ nullable: true })
  description: string | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  icon: string | null;

  @AutoMap()
  @ApiProperty()
  createdAt: Date;

  @AutoMap()
  @ApiProperty()
  updatedAt: Date;
}
