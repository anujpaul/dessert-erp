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
  {
    path: 'data-management',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/data-management/data-management.component').then(m => m.DataManagementComponent)
  },
  {
    path: 'batch-jobs',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/batch-jobs/batch-jobs.component').then(m => m.BatchJobsComponent)
  },
  {
    path: 'omnichannel',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/omnichannel/omnichannel.component').then(m => m.OmniChannelComponent)
  },
  {
    path: 'marketing',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/marketing/marketing.component').then(m => m.MarketingComponent)
  },
  {
    path: 'trade-agreements',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/trade-agreements/trade-agreements.component').then(m => m.TradeAgreementsComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
