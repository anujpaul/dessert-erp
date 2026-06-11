import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = route => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);

  const permission = route.data?.['permission'] as string | undefined;
  const role = route.data?.['role'] as string | undefined;
  const hasAccess = (!role || auth.hasRole(role)) &&
    (!permission || auth.hasPermission(permission));
  return hasAccess
    ? true
    : router.createUrlTree(['/dashboard']);
};
