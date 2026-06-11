import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrgService } from './core/services/org.service';
import { ApiService } from './core/services/api.service';
import { AuthService } from './core/services/auth.service';
import { PERMISSIONS } from './core/security/permissions';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' }, { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' }, { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' }, { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CHF', name: 'Swiss Franc' }, { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' }, { code: 'MXN', name: 'Mexican Peso' },
  { code: 'BRL', name: 'Brazilian Real' }, { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'AED', name: 'UAE Dirham' }, { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'QAR', name: 'Qatari Riyal' }, { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'ZAR', name: 'South African Rand' }, { code: 'TRY', name: 'Turkish Lira' },
  { code: 'NOK', name: 'Norwegian Krone' }, { code: 'SEK', name: 'Swedish Krona' },
  { code: 'DKK', name: 'Danish Krone' }, { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' }, { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'ILS', name: 'Israeli Shekel' }, { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'KES', name: 'Kenyan Shilling' }, { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'GHS', name: 'Ghanaian Cedi' }, { code: 'PLN', name: 'Polish Zloty' },
];

interface NavGroup {
  label: string;
  icon: string;
  permission: string;
  items: { label: string; route: string; icon: string; permission?: string }[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  template: `
<div class="shell">
  <nav class="sidebar" [class.collapsed]="collapsed()" *ngIf="auth.isLoggedIn()">

    <div class="brand">
      <span class="brand-icon">🍰</span>
      <div class="brand-text">
        <div class="brand-name">Dessert ERP</div>
        <div class="brand-ver">v2.0</div>
      </div>
      <button class="collapse-btn" (click)="collapsed.set(!collapsed())" title="Toggle sidebar">
        {{ collapsed() ? '›' : '‹' }}
      </button>
    </div>

    <div class="org-switcher" *ngIf="!collapsed()">
      <div class="org-label">Organization</div>
      <div class="org-select-wrap">
        <select class="org-select" [ngModel]="orgService.activeId()"
          (ngModelChange)="switchOrg($event)">
          <option *ngFor="let o of orgService.orgs()" [value]="o.id">
            {{ o.code }} — {{ o.name }}
          </option>
        </select>
      </div>
      <button class="org-new-btn" *ngIf="auth.hasPermission(permissions.systemSettingsManage)"
        (click)="showNewOrg = !showNewOrg">+ New Organization</button>
    </div>
    <div class="org-icon-hint" *ngIf="collapsed()" [title]="orgService.activeOrg()?.name ?? ''">🏢</div>

    <div class="org-form" *ngIf="showNewOrg && !collapsed()">
      <input class="org-input" [(ngModel)]="newOrgCode" placeholder="Code (e.g. CORP02)" maxlength="20" />
      <input class="org-input" [(ngModel)]="newOrgName" placeholder="Organization name" />
      <select class="org-input org-select-input" [(ngModel)]="newOrgCurrency">
        <option *ngFor="let c of currencies" [value]="c.code">{{ c.code }} — {{ c.name }}</option>
      </select>
      <div class="org-form-btns">
        <button class="org-save-btn" (click)="createOrg()">Create</button>
        <button class="org-cancel-btn" (click)="showNewOrg = false">Cancel</button>
      </div>
    </div>

    <div class="nav-body">
      <a routerLink="/dashboard" routerLinkActive="active" class="nav-single">
        <span class="ni">📊</span>
        <span class="nl">Dashboard</span>
      </a>

      <ng-container *ngFor="let g of visibleNavGroups(); let gi = index">
        <div class="nav-group">
          <button class="group-toggle" (click)="toggleGroup(gi)" [class.open]="openGroups[gi]">
            <span class="ni">{{ g.icon }}</span>
            <span class="nl">{{ g.label }}</span>
            <span class="chevron">{{ openGroups[gi] ? '▾' : '▸' }}</span>
          </button>
          <div class="group-items" [class.show]="openGroups[gi]">
            <a *ngFor="let item of g.items"
              [routerLink]="item.route"
              routerLinkActive="active"
              class="nav-item">
              <span class="ni-sub">{{ item.icon }}</span>
              <span class="nl">{{ item.label }}</span>
            </a>
          </div>
        </div>
      </ng-container>

      <a *ngIf="auth.hasRole('Admin') && auth.hasPermission(permissions.systemAccess)"
        routerLink="/system-admin" routerLinkActive="active" class="nav-single">
        <span class="ni">⚙️</span>
        <span class="nl">System Admin</span>
      </a>
    </div>

    <div class="sidebar-footer" *ngIf="!collapsed()">
      <div class="user-info">
        <span class="status-dot"></span>
        <span class="nl user-name">{{ auth.user()?.username ?? 'Not logged in' }}</span>
      </div>
      <button class="logout-btn" (click)="logout()" title="Logout">⏻</button>
    </div>
    <div class="sidebar-footer" *ngIf="collapsed()">
      <button class="logout-btn" (click)="logout()" title="Logout">⏻</button>
    </div>
  </nav>

  <main class="main" [class.full-page]="!auth.isLoggedIn()">
    <router-outlet />
  </main>
</div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :host { display: block; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .shell { display: flex; height: 100vh; background: #f0f4f8; }

    .sidebar {
      width: 240px; min-width: 240px;
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
      color: #cbd5e1; display: flex; flex-direction: column;
      transition: width .2s, min-width .2s; overflow: hidden;
    }
    .sidebar.collapsed { width: 56px; min-width: 56px; }
    .sidebar.collapsed .nl, .sidebar.collapsed .brand-text,
    .sidebar.collapsed .chevron, .sidebar.collapsed .org-switcher,
    .sidebar.collapsed .org-form { display: none; }
    .sidebar.collapsed .brand-icon { margin: 0 auto; }
    .sidebar.collapsed .brand { justify-content: center; }
    .sidebar.collapsed .nav-single, .sidebar.collapsed .group-toggle { justify-content: center; }
    .sidebar.collapsed .group-items { display: none !important; }

    .brand {
      display: flex; align-items: center; gap: .6rem;
      padding: 1rem .75rem .875rem; border-bottom: 1px solid #334155; min-height: 60px;
    }
    .brand-icon { font-size: 1.6rem; flex-shrink: 0; }
    .brand-text { flex: 1; overflow: hidden; }
    .brand-name { font-weight: 700; font-size: .9rem; color: #f1f5f9; white-space: nowrap; }
    .brand-ver { font-size: .65rem; color: #64748b; }
    .collapse-btn {
      background: none; border: none; color: #64748b;
      font-size: 1rem; cursor: pointer; padding: .2rem .3rem; border-radius: 4px; flex-shrink: 0;
    }
    .collapse-btn:hover { background: #334155; color: #94a3b8; }

    .org-switcher {
      padding: .6rem .75rem .5rem; border-bottom: 1px solid #334155;
      display: flex; flex-direction: column; gap: .3rem;
    }
    .org-label { font-size: .6rem; text-transform: uppercase; letter-spacing: .08em; color: #475569; }
    .org-select {
      width: 100%; background: #1e3a5f; border: 1px solid #334155; color: #93c5fd;
      border-radius: 4px; padding: .3rem .5rem; font-size: .78rem; cursor: pointer;
      appearance: none; -webkit-appearance: none;
    }
    .org-select:focus { outline: none; border-color: #3b82f6; }
    .org-new-btn {
      background: none; border: 1px dashed #334155; color: #475569;
      border-radius: 4px; padding: .25rem .4rem; font-size: .7rem;
      cursor: pointer; width: 100%; text-align: center; transition: all .15s;
    }
    .org-new-btn:hover { border-color: #3b82f6; color: #60a5fa; }
    .org-icon-hint {
      text-align: center; padding: .5rem 0; font-size: 1.1rem;
      border-bottom: 1px solid #334155; cursor: default;
    }

    .org-form {
      padding: .5rem .75rem; border-bottom: 1px solid #334155;
      display: flex; flex-direction: column; gap: .3rem;
    }
    .org-input {
      background: #0f172a; border: 1px solid #334155; color: #e2e8f0;
      border-radius: 4px; padding: .3rem .5rem; font-size: .78rem; width: 100%;
    }
    .org-input:focus { outline: none; border-color: #3b82f6; }
    .org-input::placeholder { color: #475569; }
    .org-select-input { appearance: none; -webkit-appearance: none; cursor: pointer; }
    .org-form-btns { display: flex; gap: .3rem; }
    .org-save-btn {
      flex: 1; background: #1d4ed8; border: none; color: #fff;
      border-radius: 4px; padding: .3rem; font-size: .75rem; cursor: pointer;
    }
    .org-save-btn:hover { background: #2563eb; }
    .org-cancel-btn {
      background: none; border: 1px solid #334155; color: #64748b;
      border-radius: 4px; padding: .3rem .5rem; font-size: .75rem; cursor: pointer;
    }

    .nav-body { flex: 1; overflow-y: auto; padding: .5rem 0; }
    .nav-body::-webkit-scrollbar { width: 4px; }
    .nav-body::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

    .nav-single {
      display: flex; align-items: center; gap: .6rem; padding: .55rem .75rem;
      color: #94a3b8; text-decoration: none; font-size: .85rem;
      border-left: 3px solid transparent; transition: all .15s;
    }
    .nav-single:hover { background: #334155; color: #e2e8f0; }
    .nav-single.active { background: #1d4ed8; color: #fff; border-left-color: #60a5fa; }

    .group-toggle {
      width: 100%; display: flex; align-items: center; gap: .6rem; padding: .55rem .75rem;
      background: none; border: none; border-left: 3px solid transparent;
      color: #94a3b8; font-size: .85rem; cursor: pointer; transition: all .15s; text-align: left;
    }
    .group-toggle:hover { background: #334155; color: #e2e8f0; }
    .group-toggle.open { color: #e2e8f0; }
    .chevron { margin-left: auto; font-size: .7rem; }

    .group-items { display: none; }
    .group-items.show { display: block; }
    .nav-item {
      display: flex; align-items: center; gap: .5rem;
      padding: .45rem .75rem .45rem 2rem; color: #64748b; text-decoration: none;
      font-size: .82rem; border-left: 3px solid transparent; transition: all .15s;
    }
    .nav-item:hover { background: #1e3a5f; color: #93c5fd; }
    .nav-item.active { background: #1e3a5f; color: #60a5fa; border-left-color: #3b82f6; }

    .ni { font-size: 1rem; flex-shrink: 0; }
    .ni-sub { font-size: .85rem; flex-shrink: 0; }
    .nl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .sidebar-footer {
      padding: .6rem .75rem; border-top: 1px solid #334155;
      display: flex; align-items: center; gap: .5rem; font-size: .72rem; color: #475569;
    }
    .user-info { flex: 1; display: flex; align-items: center; gap: .5rem; overflow: hidden; }
    .user-name { color: #94a3b8; }
    .status-dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; flex-shrink: 0; }
    .logout-btn {
      background: none; border: none; color: #475569; cursor: pointer;
      font-size: 1rem; padding: .15rem .3rem; border-radius: 4px;
    }
    .logout-btn:hover { background: #7f1d1d; color: #fca5a5; }

    .main { flex: 1; overflow-y: auto; }
    .main.full-page { width: 100%; }
  `]
})
export class AppComponent {
  readonly permissions = PERMISSIONS;
  collapsed  = signal(false);
  openGroups: boolean[] = [true, true, true, true];
  currencies = CURRENCIES;

  showNewOrg     = false;
  newOrgCode     = '';
  newOrgName     = '';
  newOrgCurrency = 'USD';

  navGroups: NavGroup[] = [
    { label: 'General Ledger', icon: '📒', permission: PERMISSIONS.glAccess,
      items: [{ label: 'Overview', route: '/general-ledger', icon: '📋' }] },
    { label: 'Accounts Receivable', icon: '💰', permission: PERMISSIONS.arAccess,
      items: [{ label: 'Overview', route: '/accounts-receivable', icon: '📋' }] },
    { label: 'Accounts Payable', icon: '🧾', permission: PERMISSIONS.apAccess,
      items: [{ label: 'Overview', route: '/accounts-payable', icon: '📋' }] },
    { label: 'Product Management', icon: '🛍️', permission: PERMISSIONS.productAccess,
      items: [{ label: 'Catalog & Inventory', route: '/product-management', icon: '📦' }] },
    { label: 'Data Management', icon: '📂', permission: PERMISSIONS.dataAccess,
      items: [
        { label: 'Import / Export', route: '/data-management', icon: '🔄' },
        { label: 'Batch Jobs',      route: '/batch-jobs',      icon: '⚙️' }
      ] },
    { label: 'OmniChannel', icon: '🌐', permission: PERMISSIONS.omniChannelAccess,
      items: [{ label: 'Orders & Fulfillment', route: '/omnichannel', icon: '🛒' }] },
    { label: 'Marketing', icon: '📣', permission: PERMISSIONS.marketingAccess,
      items: [
        { label: 'Campaigns & Loyalty', route: '/marketing',          icon: '🎯' },
        { label: 'Trade Agreements',    route: '/trade-agreements',   icon: '📋' }
      ] },
    { label: 'Inventory', icon: '📦', permission: PERMISSIONS.inventoryAccess,
      items: [
        { label: 'Inventory Management', route: '/inventory-management',  icon: '🗃️' },
        { label: 'Warehouse Management', route: '/warehouse-management',  icon: '🏭' }
      ] },
    { label: 'Approvals & Expenses', icon: '✅', permission: PERMISSIONS.workflowAccess,
      items: [
        { label: 'Approval Inbox', route: '/approval-inbox', icon: '📥',
          permission: PERMISSIONS.workflowAccess },
        { label: 'Expense Management', route: '/expense-management', icon: '💳',
          permission: PERMISSIONS.expenseAccess }
      ] },
    { label: 'Cash & Bank', icon: '🏦', permission: PERMISSIONS.cashBankAccess,
      items: [
        { label: 'Cash & Bank Management', route: '/cash-bank', icon: '💰' }
      ] },
    { label: 'Fixed Assets', icon: '📦', permission: PERMISSIONS.fixedAssetsAccess,
      items: [
        { label: 'Fixed Assets', route: '/fixed-assets', icon: '🏭' }
      ] }
  ];

  readonly visibleNavGroups = computed<NavGroup[]>(() =>
    this.navGroups
      .filter(group =>
        this.auth.hasPermission(group.permission) ||
        group.items.some(item => !!item.permission && this.auth.hasPermission(item.permission)))
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.permission
            ? this.auth.hasPermission(item.permission)
            : this.auth.hasPermission(group.permission))
      }))
      .filter(group => group.items.length > 0)
  );

  constructor(
    public  orgService: OrgService,
    public  auth: AuthService,
    private api: ApiService,
    private router: Router
  ) {}

  toggleGroup(i: number) { this.openGroups[i] = !this.openGroups[i]; }
  logout() { this.auth.logout(); }

  switchOrg(id: string) {
    this.orgService.setActive(id);
    this.router.navigate(['/dashboard']);
  }

  createOrg() {
    if (!this.newOrgCode.trim() || !this.newOrgName.trim()) return;
    this.api.createOrganization({
      code: this.newOrgCode.trim(),
      name: this.newOrgName.trim(),
      baseCurrency: this.newOrgCurrency.trim() || 'USD',
      fiscalYearStartMonth: 1
    }).subscribe({
      next: org => {
        this.orgService.loadOrgs();
        this.orgService.setActive(org.id);
        this.showNewOrg = false;
        this.newOrgCode = '';
        this.newOrgName = '';
        this.newOrgCurrency = 'USD';
      },
      error: err => alert('Failed to create organization: ' + (err.error?.error ?? err.message))
    });
  }
}
