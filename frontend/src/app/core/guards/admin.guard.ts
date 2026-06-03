import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../../features/auth/services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.isSuperAdmin()) {
    return router.createUrlTree(['/superadmin/dashboard']);
  }
  if (auth.isFacilitiesManager()) {
    return router.createUrlTree(['/facilities/dashboard']);
  }
  if (!auth.isAdmin()) {
    return router.createUrlTree(['/employee/dashboard']);
  }
  return true;
};
