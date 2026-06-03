import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../../features/auth/services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout();
        void router.navigateByUrl('/login');
        toast.error('Your session has expired. Please sign in again.');
      } else if (err.status === 0) {
        toast.error('Cannot reach the server. Please check your connection.');
      } else if (err.status >= 500) {
        toast.error('A server error occurred. Please try again shortly.');
      }
      // Re-throw so individual components can handle their own 400/409 messages
      return throwError(() => err);
    })
  );
};
