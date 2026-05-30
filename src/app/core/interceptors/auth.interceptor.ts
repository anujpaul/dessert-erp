import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Skip auth endpoints themselves
  const isAuthUrl = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
  if (isAuthUrl) return next(req);

  const token = auth.accessToken;
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthUrl) {
        // Try refreshing
        const refreshObs = auth.refresh();
        if (refreshObs) {
          return refreshObs.pipe(
            switchMap(() => {
              const newToken = auth.accessToken;
              const retryReq = newToken
                ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
                : req;
              return next(retryReq);
            }),
            catchError(() => {
              router.navigate(['/login']);
              return throwError(() => err);
            })
          );
        } else {
          router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    })
  );
};
