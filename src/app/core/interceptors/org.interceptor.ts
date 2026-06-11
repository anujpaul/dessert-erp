import { HttpInterceptorFn } from '@angular/common/http';

export const orgInterceptor: HttpInterceptorFn = (req, next) => {
  const orgId = sessionStorage.getItem('erp_active_org');

  if (!orgId || req.url.includes('/organizations')) {
    return next(req);
  }

  const modified = req.clone({
    setHeaders: { 'X-Organization-Id': orgId }
  });

  return next(modified);
};
