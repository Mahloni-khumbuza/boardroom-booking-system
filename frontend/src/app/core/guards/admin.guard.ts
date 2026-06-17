import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../../features/auth/services/auth.service';

// Allows Admin role only. SuperAdmin is redirected to /superadmin.
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
  if (auth.isEmployee()) {
    return router.createUrlTree(['/employee/dashboard']);
  }
  if (!auth.isAdmin()) {
    return router.createUrlTree([auth.homePath()]);
  }
  return true;
};
