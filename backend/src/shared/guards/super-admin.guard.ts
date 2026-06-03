import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../../modules/auth/services/auth.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    if (req.user?.role !== 'SuperAdmin') {
      throw new ForbiddenException('SuperAdmin access required');
    }
    return true;
  }
}
