import { ApiProperty } from '@nestjs/swagger';
import { RoleResponseDto } from '../../roles/dto/role-response.dto';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'mahloni91@gmail.com' })
  email: string;

  @ApiProperty({ example: 'Mahloni' })
  firstName: string;

  @ApiProperty({ example: 'Khumbuza' })
  lastName: string;

  @ApiProperty({ nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ nullable: true })
  department: string | null;

  @ApiProperty({ nullable: true })
  jobTitle: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: RoleResponseDto, nullable: true })
  role: RoleResponseDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
