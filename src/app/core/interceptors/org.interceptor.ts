import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OrgService } from '../services/org.service';

export const orgInterceptor: HttpInterceptorFn = (req, next) => {
  const orgService = inject(OrgService);
  const orgId = orgService.organizationId;

  if (!orgId || req.url.includes('/organizations')) {
    return next(req);
  }

  const modified = req.clone({
    setHeaders: { 'X-Organization-Id': orgId }
  });

  return next(modified);
};
