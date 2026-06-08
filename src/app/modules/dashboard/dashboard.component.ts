import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { OrgService } from '../../core/services/org.service';
import { forkJoin, Subscription } from 'rxjs';

interface KpiCard { label: string; value: string; sub: string; icon: string; color: string; route: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  template: `
<div class="page">
  <!-- Header -->
  <div class="page-header">
    <div>
      <h1 class="page-title">Dashboard</h1>
      <p class="page-sub">{{ today | date:'EEEE, MMMM d, y' }} &nbsp;·&nbsp; Dessert ERP v2.0</p>
    </div>
    <div *ngIf="activeOrgName" class="org-pill">🏢 {{ activeOrgName }}</div>
  </div>

  <!-- KPI Row -->
  <div class="kpi-grid">
    <div *ngFor="let k of kpis" class="kpi-card" [routerLink]="k.route">
      <div class="kpi-icon" [style.background]="k.color + '22'" [style.color]="k.color">{{ k.icon }}</div>
      <div class="kpi-body">
        <div class="kpi-value">{{ loading ? '…' : k.value }}</div>
        <div class="kpi-label">{{ k.label }}</div>
        <div class="kpi-sub">{{ k.sub }}</div>
      </div>
    </div>
  </div>

  <!-- Module Cards -->
  <div class="section-title">Modules</div>
  <div class="module-grid">
    <a class="mod-card" routerLink="/general-ledger">
      <div class="mod-icon">📒</div>
      <div class="mod-body">
        <div class="mod-name">General Ledger</div>
        <div class="mod-desc">Fiscal calendar, chart of accounts, journal entries, trial balance</div>
      </div>
      <span class="mod-arrow">›</span>
    </a>
    <a class="mod-card" routerLink="/accounts-receivable">
      <div class="mod-icon">💰</div>
      <div class="mod-body">
        <div class="mod-name">Accounts Receivable</div>
        <div class="mod-desc">Customers, products, sales orders, invoices, payments & aging</div>
      </div>
      <span class="mod-arrow">›</span>
    </a>
    <a class="mod-card" routerLink="/accounts-payable">
      <div class="mod-icon">🧾</div>
      <div class="mod-body">
        <div class="mod-name">Accounts Payable</div>
        <div class="mod-desc">Vendors, purchase orders, invoices, payments & aging</div>
      </div>
      <span class="mod-arrow">›</span>
    </a>
  </div>

  <!-- Loading overlay -->
  <div *ngIf="loading" class="loading-bar"></div>
</div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1200px; }
    .page-header { margin-bottom: 2rem; display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: .75rem; }
    .page-title { font-size: 1.6rem; font-weight: 700; color: #0f172a; }
    .page-sub { color: #64748b; font-size: .875rem; margin-top: .25rem; }
    .org-pill { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: .35rem .85rem; border-radius: 20px; font-size: .8rem; font-weight: 600; align-self: center; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2.5rem; }
    .kpi-card {
      background: #fff; border-radius: 12px; padding: 1.25rem;
      display: flex; align-items: flex-start; gap: 1rem;
      box-shadow: 0 1px 4px #0001; border: 1px solid #e2e8f0;
      cursor: pointer; transition: box-shadow .15s, transform .15s;
      text-decoration: none; color: inherit;
    }
    .kpi-card:hover { box-shadow: 0 4px 16px #0002; transform: translateY(-2px); }
    .kpi-icon { font-size: 1.6rem; width: 52px; height: 52px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-value { font-size: 1.4rem; font-weight: 700; color: #0f172a; line-height: 1.2; }
    .kpi-label { font-size: .8rem; font-weight: 600; color: #475569; margin-top: .2rem; }
    .kpi-sub { font-size: .75rem; color: #94a3b8; margin-top: .1rem; }

    .section-title { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 1rem; }

    .module-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
    .mod-card {
      background: #fff; border-radius: 12px; padding: 1.25rem 1.5rem;
      display: flex; align-items: center; gap: 1rem;
      border: 1px solid #e2e8f0; box-shadow: 0 1px 4px #0001;
      text-decoration: none; color: inherit;
      cursor: pointer; transition: box-shadow .15s, border-color .15s;
    }
    .mod-card:hover { border-color: #3b82f6; box-shadow: 0 4px 16px #3b82f610; }
    .mod-icon { font-size: 1.75rem; flex-shrink: 0; }
    .mod-body { flex: 1; }
    .mod-name { font-weight: 600; font-size: .95rem; color: #0f172a; }
    .mod-desc { font-size: .8rem; color: #64748b; margin-top: .2rem; line-height: 1.4; }
    .mod-arrow { font-size: 1.2rem; color: #cbd5e1; }

    .loading-bar {
      position: fixed; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      animation: slide 1s infinite;
    }
    @keyframes slide { 0% { transform: scaleX(0); transform-origin: left; } 50% { transform: scaleX(1); transform-origin: left; } 51% { transform-origin: right; } 100% { transform: scaleX(0); transform-origin: right; } }
  `]
})
export class DashboardComponent implements OnDestroy {
  today = new Date();
  loading = true;
  activeOrgName = '';

  kpis: KpiCard[] = [
    { label: 'AR Outstanding',    value: '—', sub: 'Unpaid invoices',            icon: '💰', color: '#10b981', route: '/accounts-receivable' },
    { label: 'Open Sales Orders', value: '—', sub: 'Draft + Confirmed + Picking', icon: '🛒', color: '#3b82f6', route: '/accounts-receivable' },
    { label: 'AP Due',            value: '—', sub: 'Unpaid vendor invoices',      icon: '🧾', color: '#f59e0b', route: '/accounts-payable'   },
    { label: 'Open POs',          value: '—', sub: 'Draft + Sent + Receiving',    icon: '📦', color: '#8b5cf6', route: '/accounts-payable'   },
    { label: 'Customers',         value: '—', sub: 'Active accounts',             icon: '👥', color: '#06b6d4', route: '/accounts-receivable' },
    { label: 'Vendors',           value: '—', sub: 'Active suppliers',            icon: '🏭', color: '#ec4899', route: '/accounts-payable'   },
  ];

  private kpiSub: Subscription | null = null;

  constructor(private api: ApiService, private orgService: OrgService) {
    // effect() runs immediately and re-runs whenever orgService.activeId() changes.
    // Each org switch cancels any in-flight request and fires fresh API calls.
    effect(() => {
      const orgId = this.orgService.activeId();          // <-- signal read: tracks changes
      this.activeOrgName = this.orgService.activeOrg()?.name ?? '';
      this.loadKpis();                                   // reload data for new org
    });
  }

  ngOnDestroy() {
    this.kpiSub?.unsubscribe();
  }

  private loadKpis() {
    // Cancel any previous in-flight batch
    this.kpiSub?.unsubscribe();
    this.loading = true;
    // Reset values while loading
    this.kpis.forEach(k => k.value = '—');

    this.kpiSub = forkJoin({
      arInvoices:    this.api.getARInvoices(),
      salesOrders:   this.api.getSalesOrders(),
      apInvoices:    this.api.getAPInvoices(),
      purchaseOrders: this.api.getPurchaseOrders(),
      customers:     this.api.getCustomers(),
      vendors:       this.api.getVendors(),
    }).subscribe({
      next: (data) => {
        const arOutstanding = data.arInvoices
          .filter(i => ['Issued','PartiallyPaid','Overdue'].includes(i.status))
          .reduce((s, i) => s + i.outstandingAmount, 0);

        const openSO = data.salesOrders
          .filter(o => ['Draft','Confirmed','Picking'].includes(o.status)).length;

        const apDue = data.apInvoices
          .filter(i => ['Approved','Scheduled','Overdue'].includes(i.status))
          .reduce((s, i) => s + i.outstandingAmount, 0);

        const openPO = data.purchaseOrders
          .filter(o => ['Draft','Sent','PartiallyReceived'].includes(o.status)).length;

        this.kpis[0].value = '$' + arOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        this.kpis[1].value = openSO.toString();
        this.kpis[2].value = '$' + apDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        this.kpis[3].value = openPO.toString();
        this.kpis[4].value = data.customers.filter((c: any) => c.status === 'Active').length.toString();
        this.kpis[5].value = data.vendors.filter((v: any) => v.status === 'Active').length.toString();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
