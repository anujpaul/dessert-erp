import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { PERMISSIONS } from '../../core/security/permissions';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { OrgService } from '../../core/services/org.service';

interface KpiCard {
  label: string;
  value: string;
  sub: string;
  code: string;
  color: string;
  route: string;
  permission: string;
}

interface DashboardModule {
  id: string;
  name: string;
  description: string;
  code: string;
  route: string;
  permission: string;
  adminOnly?: boolean;
}

const DASHBOARD_MODULES: DashboardModule[] = [
  { id: 'gl', name: 'General Ledger', description: 'Accounts, journals, fiscal periods and financial reporting', code: 'GL', route: '/general-ledger', permission: PERMISSIONS.glAccess },
  { id: 'ar', name: 'Accounts Receivable', description: 'Customers, sales orders, invoices, payments and aging', code: 'AR', route: '/accounts-receivable', permission: PERMISSIONS.arAccess },
  { id: 'ap', name: 'Accounts Payable', description: 'Vendors, purchase orders, invoices, payments and aging', code: 'AP', route: '/accounts-payable', permission: PERMISSIONS.apAccess },
  { id: 'product', name: 'Product Management', description: 'Products, variants, categories, brands and pricing', code: 'PM', route: '/product-management', permission: PERMISSIONS.productAccess },
  { id: 'inventory', name: 'Inventory Management', description: 'Stock balances, reservations, transactions and adjustments', code: 'IM', route: '/inventory-management', permission: PERMISSIONS.inventoryAccess },
  { id: 'warehouse', name: 'Warehouse Management', description: 'Warehouses, locations, receipts, picks and transfers', code: 'WM', route: '/warehouse-management', permission: PERMISSIONS.inventoryAccess },
  { id: 'data', name: 'Data Management', description: 'Imports, exports, staging and recurring batch jobs', code: 'DM', route: '/data-management', permission: PERMISSIONS.dataAccess },
  { id: 'omnichannel', name: 'OmniChannel', description: 'Channel orders, fulfillment and retail operations', code: 'OC', route: '/omnichannel', permission: PERMISSIONS.omniChannelAccess },
  { id: 'marketing', name: 'Marketing', description: 'Campaigns, loyalty programs and trade agreements', code: 'MK', route: '/marketing', permission: PERMISSIONS.marketingAccess },
  { id: 'approvals', name: 'Approval Inbox', description: 'Review and act on pending workflow approvals', code: 'WF', route: '/approval-inbox', permission: PERMISSIONS.workflowAccess },
  { id: 'expenses', name: 'Expense Management', description: 'Expense reports, review and reimbursement workflows', code: 'EX', route: '/expense-management', permission: PERMISSIONS.expenseAccess },
  { id: 'cash-bank', name: 'Cash & Bank', description: 'Bank accounts, transactions, reconciliation and cash journals', code: 'CB', route: '/cash-bank', permission: PERMISSIONS.cashBankAccess },
  { id: 'fixed-assets', name: 'Fixed Assets', description: 'Asset acquisition, depreciation, transfers and disposal', code: 'FA', route: '/fixed-assets', permission: PERMISSIONS.fixedAssetsAccess },
  { id: 'system-admin', name: 'System Administration', description: 'Users, roles, permissions, audit history and settings', code: 'SA', route: '/system-admin', permission: PERMISSIONS.systemAccess, adminOnly: true }
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">{{ today | date:'EEEE, MMMM d, y' }} · Dessert ERP v2.0</p>
        </div>
        <div *ngIf="activeOrgName" class="org-pill">{{ activeOrgName }}</div>
      </header>

      <div class="kpi-grid">
        <div *ngFor="let kpi of visibleKpis()" class="kpi-card" [routerLink]="kpi.route">
          <div class="kpi-code" [style.background]="kpi.color + '18'" [style.color]="kpi.color">
            {{ kpi.code }}
          </div>
          <div>
            <div class="kpi-value">{{ loading ? '...' : kpi.value }}</div>
            <div class="kpi-label">{{ kpi.label }}</div>
            <div class="kpi-sub">{{ kpi.sub }}</div>
          </div>
        </div>
      </div>

      <section class="module-section">
        <div class="section-heading">
          <div>
            <h2>Favorites</h2>
            <p>Your pinned modules</p>
          </div>
        </div>

        <div *ngIf="favoriteModules().length; else noFavorites" class="module-grid">
          <ng-container *ngFor="let module of favoriteModules(); trackBy: trackModule">
            <ng-container *ngTemplateOutlet="moduleCard; context: { $implicit: module }"></ng-container>
          </ng-container>
        </div>
        <ng-template #noFavorites>
          <div class="empty-favorites">Select the star on any module to add it here.</div>
        </ng-template>
      </section>

      <section class="module-section">
        <div class="section-heading">
          <div>
            <h2>All Modules</h2>
            <p>{{ accessibleModules().length }} available based on your access</p>
          </div>
        </div>

        <div class="module-grid">
          <ng-container *ngFor="let module of accessibleModules(); trackBy: trackModule">
            <ng-container *ngTemplateOutlet="moduleCard; context: { $implicit: module }"></ng-container>
          </ng-container>
        </div>
      </section>

      <ng-template #moduleCard let-module>
        <div class="module-card" [routerLink]="module.route">
          <div class="module-code">{{ module.code }}</div>
          <div class="module-copy">
            <div class="module-name">{{ module.name }}</div>
            <div class="module-description">{{ module.description }}</div>
          </div>
          <button
            type="button"
            class="favorite-button"
            [class.selected]="isFavorite(module.id)"
            [attr.aria-label]="isFavorite(module.id)
              ? 'Remove ' + module.name + ' from favorites'
              : 'Add ' + module.name + ' to favorites'"
            [title]="isFavorite(module.id) ? 'Remove from favorites' : 'Add to favorites'"
            (click)="toggleFavorite(module.id, $event)">
            {{ isFavorite(module.id) ? '★' : '☆' }}
          </button>
          <span class="module-arrow">›</span>
        </div>
      </ng-template>

      <div *ngIf="loading" class="loading-bar"></div>
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1280px; }
    .page-header {
      margin-bottom: 2rem; display: flex; align-items: flex-start;
      justify-content: space-between; flex-wrap: wrap; gap: .75rem;
    }
    .page-title { font-size: 1.6rem; font-weight: 700; color: #0f172a; margin: 0; }
    .page-sub { color: #64748b; font-size: .875rem; margin: .25rem 0 0; }
    .org-pill {
      background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
      padding: .35rem .85rem; border-radius: 20px; font-size: .8rem; font-weight: 600;
    }

    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 1rem; margin-bottom: 2.5rem;
    }
    .kpi-card {
      background: #fff; border-radius: 8px; padding: 1.15rem;
      display: flex; align-items: flex-start; gap: .9rem;
      box-shadow: 0 1px 4px #0001; border: 1px solid #e2e8f0;
      cursor: pointer; transition: box-shadow .15s, transform .15s;
    }
    .kpi-card:hover { box-shadow: 0 4px 16px #0002; transform: translateY(-2px); }
    .kpi-code {
      width: 44px; height: 44px; border-radius: 7px; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
      font-size: .75rem; font-weight: 800;
    }
    .kpi-value { font-size: 1.3rem; font-weight: 700; color: #0f172a; line-height: 1.2; }
    .kpi-label { font-size: .8rem; font-weight: 600; color: #475569; margin-top: .2rem; }
    .kpi-sub { font-size: .75rem; color: #94a3b8; margin-top: .1rem; }

    .module-section { margin-bottom: 2rem; }
    .section-heading { margin-bottom: 1rem; }
    .section-heading h2 {
      margin: 0; font-size: .8rem; text-transform: uppercase;
      letter-spacing: .08em; color: #475569;
    }
    .section-heading p { margin: .2rem 0 0; color: #94a3b8; font-size: .75rem; }
    .module-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(285px, 1fr)); gap: 1rem;
    }
    .module-card {
      min-height: 96px; background: #fff; border-radius: 8px; padding: 1.1rem 1.2rem;
      display: flex; align-items: center; gap: .9rem; border: 1px solid #e2e8f0;
      box-shadow: 0 1px 4px #0001; cursor: pointer;
      transition: box-shadow .15s, border-color .15s;
    }
    .module-card:hover { border-color: #3b82f6; box-shadow: 0 4px 16px #3b82f610; }
    .module-code {
      width: 42px; height: 42px; flex: 0 0 42px; border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      background: #e0e7ff; color: #3730a3; font-size: .75rem; font-weight: 800;
    }
    .module-copy { flex: 1; min-width: 0; }
    .module-name { font-weight: 600; font-size: .92rem; color: #0f172a; }
    .module-description { color: #64748b; font-size: .76rem; line-height: 1.4; margin-top: .2rem; }
    .module-arrow { color: #cbd5e1; font-size: 1.2rem; }
    .favorite-button {
      width: 32px; height: 32px; flex: 0 0 32px; border: none; border-radius: 6px;
      background: transparent; color: #94a3b8; font-size: 1.35rem;
      display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
    }
    .favorite-button:hover { background: #fef9c3; color: #ca8a04; }
    .favorite-button.selected { color: #eab308; }
    .empty-favorites {
      border: 1px dashed #cbd5e1; border-radius: 8px; padding: 1.2rem;
      color: #64748b; background: #f8fafc; text-align: center; font-size: .84rem;
    }
    .loading-bar {
      position: fixed; top: 0; left: 0; right: 0; height: 3px;
      background: #3b82f6; animation: slide 1s infinite;
    }
    @keyframes slide {
      0% { transform: scaleX(0); transform-origin: left; }
      50% { transform: scaleX(1); transform-origin: left; }
      51% { transform-origin: right; }
      100% { transform: scaleX(0); transform-origin: right; }
    }
    @media (max-width: 640px) {
      .page { padding: 1rem; }
      .module-grid, .kpi-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnDestroy {
  today = new Date();
  loading = true;
  activeOrgName = '';

  readonly kpis: KpiCard[] = [
    { label: 'AR Outstanding', value: '—', sub: 'Unpaid invoices', code: 'AR', color: '#10b981', route: '/accounts-receivable', permission: PERMISSIONS.arAccess },
    { label: 'Open Sales Orders', value: '—', sub: 'Draft + Confirmed + Picking', code: 'SO', color: '#3b82f6', route: '/accounts-receivable', permission: PERMISSIONS.arAccess },
    { label: 'AP Due', value: '—', sub: 'Unpaid vendor invoices', code: 'AP', color: '#f59e0b', route: '/accounts-payable', permission: PERMISSIONS.apAccess },
    { label: 'Open POs', value: '—', sub: 'Draft + Sent + Receiving', code: 'PO', color: '#8b5cf6', route: '/accounts-payable', permission: PERMISSIONS.apAccess },
    { label: 'Customers', value: '—', sub: 'Active accounts', code: 'CU', color: '#06b6d4', route: '/accounts-receivable', permission: PERMISSIONS.arAccess },
    { label: 'Vendors', value: '—', sub: 'Active suppliers', code: 'VE', color: '#ec4899', route: '/accounts-payable', permission: PERMISSIONS.apAccess }
  ];

  private kpiSub: Subscription | null = null;
  private loadedOrgId: string | null = null;
  private favoriteIds = signal<Set<string>>(new Set());

  readonly accessibleModules = computed(() =>
    DASHBOARD_MODULES.filter(module =>
      this.auth.hasPermission(module.permission) &&
      (!module.adminOnly || this.auth.hasRole('Admin')))
  );

  readonly favoriteModules = computed(() => {
    const favorites = this.favoriteIds();
    return this.accessibleModules().filter(module => favorites.has(module.id));
  });

  readonly visibleKpis = computed(() =>
    this.kpis.filter(kpi => this.auth.hasPermission(kpi.permission))
  );

  constructor(
    private api: ApiService,
    private orgService: OrgService,
    private auth: AuthService
  ) {
    this.favoriteIds.set(this.loadFavorites());

    effect(() => {
      const orgId = this.orgService.activeId();
      this.activeOrgName = this.orgService.activeOrg()?.name ?? '';

      if (!orgId || orgId === this.loadedOrgId) return;

      this.loadedOrgId = orgId;
      this.loadKpis();
    });
  }

  ngOnDestroy() {
    this.kpiSub?.unsubscribe();
  }

  trackModule(_index: number, module: DashboardModule) {
    return module.id;
  }

  isFavorite(moduleId: string) {
    return this.favoriteIds().has(moduleId);
  }

  toggleFavorite(moduleId: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const next = new Set(this.favoriteIds());
    if (next.has(moduleId)) next.delete(moduleId);
    else next.add(moduleId);

    this.favoriteIds.set(next);
    localStorage.setItem(this.favoritesStorageKey(), JSON.stringify([...next]));
  }

  private loadKpis() {
    this.kpiSub?.unsubscribe();
    this.loading = true;
    this.kpis.forEach(kpi => kpi.value = '—');

    this.kpiSub = forkJoin({
      arInvoices: this.auth.hasPermission(PERMISSIONS.arAccess) ? this.api.getARInvoices() : of([]),
      salesOrders: this.auth.hasPermission(PERMISSIONS.arAccess) ? this.api.getSalesOrders() : of([]),
      apInvoices: this.auth.hasPermission(PERMISSIONS.apAccess) ? this.api.getAPInvoices() : of([]),
      purchaseOrders: this.auth.hasPermission(PERMISSIONS.apAccess) ? this.api.getPurchaseOrders() : of([]),
      customers: this.auth.hasPermission(PERMISSIONS.arAccess) ? this.api.getCustomers() : of([]),
      vendors: this.auth.hasPermission(PERMISSIONS.apAccess) ? this.api.getVendors() : of([])
    }).subscribe({
      next: data => {
        const arOutstanding = data.arInvoices
          .filter(invoice => ['Issued', 'PartiallyPaid', 'Overdue'].includes(invoice.status))
          .reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
        const openSalesOrders = data.salesOrders
          .filter(order => ['Draft', 'Confirmed', 'Picking'].includes(order.status)).length;
        const apDue = data.apInvoices
          .filter(invoice => ['Approved', 'Scheduled', 'Overdue'].includes(invoice.status))
          .reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
        const openPurchaseOrders = data.purchaseOrders
          .filter(order => ['Draft', 'Sent', 'PartiallyReceived'].includes(order.status)).length;

        this.kpis[0].value = '$' + arOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        this.kpis[1].value = openSalesOrders.toString();
        this.kpis[2].value = '$' + apDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        this.kpis[3].value = openPurchaseOrders.toString();
        this.kpis[4].value = data.customers.filter(customer => customer.status === 'Active').length.toString();
        this.kpis[5].value = data.vendors.filter(vendor => vendor.status === 'Active').length.toString();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private loadFavorites(): Set<string> {
    try {
      const saved = JSON.parse(localStorage.getItem(this.favoritesStorageKey()) ?? '[]');
      return new Set(Array.isArray(saved) ? saved.filter(id => typeof id === 'string') : []);
    } catch {
      return new Set();
    }
  }

  private favoritesStorageKey() {
    return `erp_dashboard_favorites_${this.auth.user()?.id ?? 'anonymous'}`;
  }
}
