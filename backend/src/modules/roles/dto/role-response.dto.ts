import { ApiProperty } from '@nestjs/swagger';
import { PermissionResponseDto } from '../../permissions/dto/permission-response.dto';
import { Role } from '../entities/role.entity';

export class RoleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Admin' })
  name: string;

  @ApiProperty({ nullable: true, example: 'Manages rooms and bookings' })
  description: string | null;

  @ApiProperty({ type: [PermissionResponseDto] })
  permissions: PermissionResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(role: Role): RoleResponseDto {
    const dto = new RoleResponseDto();
    dto.id = role.id;
    dto.name = role.name;
    dto.description = role.description ?? null;
    dto.permissions = (role.permissions ?? []).map(PermissionResponseDto.fromEntity);
    dto.createdAt = role.createdAt;
    dto.updatedAt = role.updatedAt;
    return dto;
  }
}
