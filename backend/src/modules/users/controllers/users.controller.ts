import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({ description: 'Returns the currently authenticated user.' })
  async me(@Req() req: { user: { sub: string } }) {
    const user = await this.usersService.findById(req.user.sub);
    if (!user) {
      return null;
    }
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }
}
