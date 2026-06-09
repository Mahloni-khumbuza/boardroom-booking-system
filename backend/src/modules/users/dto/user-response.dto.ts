import { ApiProperty } from '@nestjs/swagger';
import { RoleResponseDto } from '../../roles/dto/role-response.dto';
import { User } from '../entities/user.entity';

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

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.phoneNumber = user.phoneNumber ?? null;
    dto.department = user.department ?? null;
    dto.jobTitle = user.jobTitle ?? null;
    dto.isActive = user.isActive;
    dto.role = user.role ? RoleResponseDto.fromEntity(user.role) : null;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
