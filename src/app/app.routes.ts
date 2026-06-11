import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { PERMISSIONS } from './core/security/permissions';

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
    data: { permission: PERMISSIONS.glAccess },
    loadComponent: () => import('./modules/general-ledger/general-ledger.component').then(m => m.GeneralLedgerComponent)
  },
  {
    path: 'accounts-receivable',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.arAccess },
    loadComponent: () => import('./modules/accounts-receivable/accounts-receivable.component').then(m => m.AccountsReceivableComponent)
  },
  {
    path: 'accounts-payable',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.apAccess },
    loadComponent: () => import('./modules/accounts-payable/accounts-payable.component').then(m => m.AccountsPayableComponent)
  },
  {
    path: 'product-management',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.productAccess },
    loadComponent: () => import('./modules/product-management/product-management.component').then(m => m.ProductManagementComponent)
  },
  {
    path: 'system-admin',
    canActivate: [authGuard],
    data: { role: 'Admin', permission: PERMISSIONS.systemAccess },
    loadComponent: () => import('./modules/system-admin/system-admin.component').then(m => m.SystemAdminComponent)
  },
  {
    path: 'data-management',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.dataAccess },
    loadComponent: () => import('./modules/data-management/data-management.component').then(m => m.DataManagementComponent)
  },
  {
    path: 'batch-jobs',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.dataAccess },
    loadComponent: () => import('./modules/batch-jobs/batch-jobs.component').then(m => m.BatchJobsComponent)
  },
  {
    path: 'omnichannel',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.omniChannelAccess },
    loadComponent: () => import('./modules/omnichannel/omnichannel.component').then(m => m.OmniChannelComponent)
  },
  {
    path: 'marketing',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.marketingAccess },
    loadComponent: () => import('./modules/marketing/marketing.component').then(m => m.MarketingComponent)
  },
  {
    path: 'trade-agreements',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.marketingAccess },
    loadComponent: () => import('./modules/trade-agreements/trade-agreements.component').then(m => m.TradeAgreementsComponent)
  },
  {
    path: 'inventory-management',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.inventoryAccess },
    loadComponent: () => import('./modules/inventory-management/inventory-management.component').then(m => m.InventoryManagementComponent)
  },
  {
    path: 'approval-inbox',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.workflowAccess },
    loadComponent: () => import('./modules/approval-inbox/approval-inbox.component').then(m => m.ApprovalInboxComponent)
  },
  {
    path: 'expense-management',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.expenseAccess },
    loadComponent: () => import('./modules/expense-management/expense-management.component').then(m => m.ExpenseManagementComponent)
  },
  {
    path: 'warehouse-management',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.inventoryAccess },
    loadComponent: () => import('./modules/warehouse-management/warehouse-management.component').then(m => m.WarehouseManagementComponent)
  },
  {
    path: 'cash-bank',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.cashBankAccess },
    loadComponent: () => import('./modules/cash-bank/cash-bank.component').then(m => m.CashBankComponent)
  },
  {
    path: 'fixed-assets',
    canActivate: [authGuard],
    data: { permission: PERMISSIONS.fixedAssetsAccess },
    loadComponent: () => import('./modules/fixed-assets/fixed-assets.component').then(m => m.FixedAssetsComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
