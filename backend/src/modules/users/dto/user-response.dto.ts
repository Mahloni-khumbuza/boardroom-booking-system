import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { RoleResponseDto } from '../../roles/dto/role-response.dto';

export class UserResponseDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty({ example: 'mahloni91@gmail.com' })
  email: string;

  @AutoMap()
  @ApiProperty({ example: 'Mahloni' })
  firstName: string;

  @AutoMap()
  @ApiProperty({ example: 'Khumbuza' })
  lastName: string;

  @AutoMap()
  @ApiProperty({ nullable: true })
  phoneNumber: string | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  department: string | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  jobTitle: string | null;

  @AutoMap()
  @ApiProperty({ example: true })
  isActive: boolean;

  @AutoMap()
  @ApiProperty({ type: RoleResponseDto, nullable: true })
  role: RoleResponseDto | null;

  @AutoMap()
  @ApiProperty()
  createdAt: Date;

  @AutoMap()
  @ApiProperty()
  updatedAt: Date;
}
