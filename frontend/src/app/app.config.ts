import { APP_INITIALIZER, ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { WebPushService } from './core/firebase/web-push.service';
import { AuthService } from './features/auth/services/auth.service';

function initWebPush(): () => Promise<void> {
  return () => {
    const auth = inject(AuthService);
    const push = inject(WebPushService);
    if (auth.isAuthenticated()) {
      return push.init(auth.role() ?? 'Employee');
    }
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initWebPush,
      deps: [],
      multi: true,
    },
  ]
};
