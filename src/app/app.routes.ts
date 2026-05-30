import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./modules/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'general-ledger',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/general-ledger/general-ledger.component').then(m => m.GeneralLedgerComponent)
  },
  {
    path: 'accounts-receivable',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/accounts-receivable/accounts-receivable.component').then(m => m.AccountsReceivableComponent)
  },
  {
    path: 'accounts-payable',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/accounts-payable/accounts-payable.component').then(m => m.AccountsPayableComponent)
  },
  {
    path: 'product-management',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/product-management/product-management.component').then(m => m.ProductManagementComponent)
  },
  {
    path: 'system-admin',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/system-admin/system-admin.component').then(m => m.SystemAdminComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
