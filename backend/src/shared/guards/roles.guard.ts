import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtPayload } from '../../modules/auth/services/auth.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleName } from '../constants/role-name';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    if (!req.user?.role || !required.includes(req.user.role as RoleName)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
