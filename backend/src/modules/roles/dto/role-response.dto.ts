import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { PermissionResponseDto } from '../../permissions/dto/permission-response.dto';

export class RoleResponseDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty({ example: 'Admin' })
  name: string;

  @AutoMap()
  @ApiProperty({ nullable: true, example: 'Manages rooms and bookings' })
  description: string | null;

  @AutoMap()
  @ApiProperty({ type: [PermissionResponseDto] })
  permissions: PermissionResponseDto[];

  @AutoMap()
  @ApiProperty()
  createdAt: Date;

  @AutoMap()
  @ApiProperty()
  updatedAt: Date;
}
