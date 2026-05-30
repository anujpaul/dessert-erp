import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { FiscalYear, FiscalPeriod, Account, AccountType, JournalEntry, TrialBalanceLine } from '../../core/models/erp.models';

type Tab = 'fiscal' | 'coa' | 'journal' | 'trial';

@Component({
  selector: 'app-general-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
<div class="page">
  <!-- Header -->
  <div class="page-header">
    <div>
      <h1 class="page-title">📒 General Ledger</h1>
      <p class="page-sub">Fiscal Calendar · Chart of Accounts · Journal Entries · Trial Balance</p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button *ngFor="let t of tabs" class="tab" [class.active]="activeTab === t.id" (click)="setTab(t.id)">
      {{ t.icon }} {{ t.label }}
    </button>
  </div>

  <!-- ── FISCAL CALENDAR ── -->
  <div *ngIf="activeTab === 'fiscal'" class="tab-content">
    <div class="toolbar">
      <button class="btn-primary" (click)="showCreateFY = true">+ New Fiscal Year</button>
    </div>

    <!-- Create FY Form -->
    <div *ngIf="showCreateFY" class="form-card">
      <div class="form-title">New Fiscal Year</div>
      <div class="form-grid">
        <div class="form-field"><label>Name</label><input [(ngModel)]="fyForm.name" placeholder="FY2027" /></div>
        <div class="form-field"><label>Description</label><input [(ngModel)]="fyForm.description" placeholder="Fiscal Year 2027" /></div>
        <div class="form-field"><label>Start Date</label><input type="date" [(ngModel)]="fyForm.startDate" /></div>
        <div class="form-field"><label>End Date</label><input type="date" [(ngModel)]="fyForm.endDate" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createFY()">Create</button>
        <button class="btn-ghost" (click)="showCreateFY = false">Cancel</button>
      </div>
    </div>

    <!-- FY List -->
    <div class="split">
      <div class="list-panel">
        <div *ngFor="let fy of fiscalYears" class="list-row" [class.active]="selectedFY?.id === fy.id" (click)="selectFY(fy)">
          <div class="row-main">
            <strong>{{ fy.name }}</strong>
            <span class="badge" [class]="'badge-' + fy.status.toLowerCase()">{{ fy.status }}</span>
          </div>
          <div class="row-sub">{{ fy.startDate | date:'MMM d, y' }} → {{ fy.endDate | date:'MMM d, y' }} · {{ fy.periodCount }} periods</div>
        </div>
        <div *ngIf="!fiscalYears.length" class="empty">No fiscal years.</div>
      </div>

      <div class="detail-panel" *ngIf="selectedFY">
        <div class="detail-header">
          <div class="detail-title">{{ selectedFY.name }}</div>
          <button *ngIf="selectedFY.status === 'Open'" class="btn-danger-sm" (click)="closeFY(selectedFY.id)">Close Year</button>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Status</span><span class="badge" [class]="'badge-' + selectedFY.status.toLowerCase()">{{ selectedFY.status }}</span></div>
          <div class="info-item"><span class="info-label">Start</span><span>{{ selectedFY.startDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">End</span><span>{{ selectedFY.endDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">Periods</span><span>{{ selectedFY.periodCount }}</span></div>
        </div>
        <div class="sub-section-title">Periods</div>
        <table class="data-table">
          <thead><tr><th>#</th><th>Name</th><th>Start</th><th>End</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let p of periods">
              <td>{{ p.periodNumber }}</td>
              <td>{{ p.name }}</td>
              <td>{{ p.startDate | date:'MMM d' }}</td>
              <td>{{ p.endDate | date:'MMM d' }}</td>
              <td><span class="badge" [class]="'badge-' + p.status.toLowerCase()">{{ p.status }}</span></td>
              <td><button *ngIf="p.status === 'Open'" class="btn-xs" (click)="closePeriod(p.id)">Close</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="detail-panel empty-detail" *ngIf="!selectedFY">Select a fiscal year to view periods.</div>
    </div>
  </div>

  <!-- ── CHART OF ACCOUNTS ── -->
  <div *ngIf="activeTab === 'coa'" class="tab-content">
    <div class="toolbar">
      <input [(ngModel)]="coaSearch" placeholder="Search accounts…" class="search-input" />
      <button class="btn-primary" (click)="showCreateAccount = true">+ New Account</button>
    </div>

    <div *ngIf="showCreateAccount" class="form-card">
      <div class="form-title">New Account</div>
      <div class="form-grid">
        <div class="form-field"><label>Account Number</label><input [(ngModel)]="acctForm.accountNumber" placeholder="1130" /></div>
        <div class="form-field"><label>Name</label><input [(ngModel)]="acctForm.name" placeholder="Petty Cash" /></div>
        <div class="form-field">
          <label>Account Type</label>
          <select [(ngModel)]="acctForm.accountTypeId">
            <option value="">— select —</option>
            <option *ngFor="let t of accountTypes" [value]="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div class="form-field">
          <label>Header Account?</label>
          <select [(ngModel)]="acctForm.isHeaderAccount">
            <option [ngValue]="false">No — postable</option>
            <option [ngValue]="true">Yes — header only</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createAccount()">Create</button>
        <button class="btn-ghost" (click)="showCreateAccount = false">Cancel</button>
      </div>
    </div>

    <table class="data-table mt">
      <thead><tr><th>Number</th><th>Name</th><th>Type</th><th>Nature</th><th>Status</th><th>Header</th></tr></thead>
      <tbody>
        <tr *ngFor="let a of filteredAccounts">
          <td><code>{{ a.accountNumber }}</code></td>
          <td [style.padding-left]="(a.level * 12) + 'px'">
            <strong *ngIf="a.isHeaderAccount">{{ a.name }}</strong>
            <span *ngIf="!a.isHeaderAccount">{{ a.name }}</span>
          </td>
          <td>{{ a.accountTypeName }}</td>
          <td>{{ a.accountNumber[0] <= '3' ? (a.accountNumber[0] === '1' ? 'Debit' : a.accountNumber[0] === '2' ? 'Credit' : 'Credit') : (a.accountNumber[0] === '4' || a.accountNumber[0] === '5' ? (a.accountNumber[0] === '4' ? 'Credit' : 'Debit') : 'Debit') }}</td>
          <td><span class="badge" [class]="'badge-' + a.status.toLowerCase()">{{ a.status }}</span></td>
          <td>{{ a.isHeaderAccount ? '✓' : '' }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ── JOURNAL ENTRIES ── -->
  <div *ngIf="activeTab === 'journal'" class="tab-content">
    <div class="toolbar">
      <select [(ngModel)]="jeFilterPeriod" (change)="loadJournalEntries()" class="filter-select">
        <option value="">All Periods</option>
        <option *ngFor="let p of allPeriods" [value]="p.id">{{ p.name }}</option>
      </select>
      <button class="btn-primary" (click)="showCreateJE = true">+ New Entry</button>
    </div>

    <div *ngIf="showCreateJE" class="form-card">
      <div class="form-title">New Journal Entry</div>
      <div class="form-grid">
        <div class="form-field"><label>Date</label><input type="date" [(ngModel)]="jeForm.entryDate" /></div>
        <div class="form-field">
          <label>Period</label>
          <select [(ngModel)]="jeForm.fiscalPeriodId">
            <option value="">— select —</option>
            <option *ngFor="let p of allPeriods" [value]="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="form-field"><label>Reference</label><input [(ngModel)]="jeForm.reference" placeholder="INV-001" /></div>
        <div class="form-field"><label>Description</label><input [(ngModel)]="jeForm.description" placeholder="Monthly rent expense" /></div>
      </div>
      <div class="sub-section-title">Lines</div>
      <table class="data-table">
        <thead><tr><th>Account</th><th>Description</th><th>Debit</th><th>Credit</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let l of jeForm.lines; let i = index">
            <td>
              <select [(ngModel)]="l.accountId" style="width:100%">
                <option value="">— select —</option>
                <option *ngFor="let a of postableAccounts" [value]="a.id">{{ a.accountNumber }} {{ a.name }}</option>
              </select>
            </td>
            <td><input [(ngModel)]="l.description" style="width:100%" /></td>
            <td><input type="number" [(ngModel)]="l.debit" style="width:90px" min="0" (change)="l.credit=0" /></td>
            <td><input type="number" [(ngModel)]="l.credit" style="width:90px" min="0" (change)="l.debit=0" /></td>
            <td><button class="btn-xs btn-red" (click)="removeJELine(i)">✕</button></td>
          </tr>
        </tbody>
      </table>
      <div class="je-totals">
        <button class="btn-ghost" (click)="addJELine()">+ Add Line</button>
        <span>DR: <strong>{{ jeDebitTotal | currency }}</strong> &nbsp; CR: <strong>{{ jeCreditTotal | currency }}</strong></span>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createJE()">Save Draft</button>
        <button class="btn-ghost" (click)="showCreateJE = false">Cancel</button>
      </div>
    </div>

    <div class="split">
      <div class="list-panel">
        <div *ngFor="let je of journalEntries" class="list-row" [class.active]="selectedJE?.id === je.id" (click)="selectedJE = je">
          <div class="row-main">
            <strong>{{ je.entryNumber }}</strong>
            <span class="badge" [class]="'badge-' + je.status.toLowerCase()">{{ je.status }}</span>
          </div>
          <div class="row-sub">{{ je.entryDate | date:'mediumDate' }} · {{ je.description }}</div>
          <div class="row-amounts">
            <span>DR {{ je.totalDebit | currency }}</span>
          </div>
        </div>
        <div *ngIf="!journalEntries.length" class="empty">No journal entries.</div>
      </div>

      <div class="detail-panel" *ngIf="selectedJE">
        <div class="detail-header">
          <div class="detail-title">{{ selectedJE.entryNumber }}</div>
          <div class="action-row">
            <button *ngIf="selectedJE.status === 'Draft'" class="btn-primary-sm" (click)="postJE(selectedJE.id)">Post</button>
            <button *ngIf="selectedJE.status === 'Posted'" class="btn-danger-sm" (click)="voidJE(selectedJE.id)">Void</button>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Date</span><span>{{ selectedJE.entryDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">Period</span><span>{{ selectedJE.fiscalPeriodName }}</span></div>
          <div class="info-item"><span class="info-label">Reference</span><span>{{ selectedJE.reference }}</span></div>
          <div class="info-item"><span class="info-label">Status</span><span class="badge" [class]="'badge-' + selectedJE.status.toLowerCase()">{{ selectedJE.status }}</span></div>
        </div>
        <div class="sub-section-title">Lines</div>
        <table class="data-table">
          <thead><tr><th>Account</th><th>Description</th><th class="num">Debit</th><th class="num">Credit</th></tr></thead>
          <tbody>
            <tr *ngFor="let l of selectedJE.lines">
              <td><code>{{ l.accountNumber }}</code> {{ l.accountName }}</td>
              <td>{{ l.description }}</td>
              <td class="num">{{ l.debit > 0 ? (l.debit | currency) : '' }}</td>
              <td class="num">{{ l.credit > 0 ? (l.credit | currency) : '' }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="2"><strong>Total</strong></td>
              <td class="num"><strong>{{ selectedJE.totalDebit | currency }}</strong></td>
              <td class="num"><strong>{{ selectedJE.totalCredit | currency }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="detail-panel empty-detail" *ngIf="!selectedJE">Select an entry to view details.</div>
    </div>
  </div>

  <!-- ── TRIAL BALANCE ── -->
  <div *ngIf="activeTab === 'trial'" class="tab-content">
    <div class="toolbar">
      <select [(ngModel)]="tbPeriodId" class="filter-select">
        <option value="">— Select Period —</option>
        <option *ngFor="let p of allPeriods" [value]="p.id">{{ p.name }}</option>
      </select>
      <button class="btn-primary" (click)="loadTrialBalance()" [disabled]="!tbPeriodId">Run</button>
    </div>
    <table *ngIf="trialBalance.length" class="data-table mt">
      <thead><tr><th>Account #</th><th>Account Name</th><th>Type</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th></tr></thead>
      <tbody>
        <tr *ngFor="let t of trialBalance">
          <td><code>{{ t.accountNumber }}</code></td>
          <td>{{ t.accountName }}</td>
          <td>{{ t.accountType }}</td>
          <td class="num">{{ t.totalDebit | currency }}</td>
          <td class="num">{{ t.totalCredit | currency }}</td>
          <td class="num" [class.neg]="t.balance < 0">{{ t.balance | currency }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="3"><strong>Total</strong></td>
          <td class="num"><strong>{{ tbTotalDebit | currency }}</strong></td>
          <td class="num"><strong>{{ tbTotalCredit | currency }}</strong></td>
          <td class="num"><strong>{{ tbTotalBalance | currency }}</strong></td>
        </tr>
      </tfoot>
    </table>
    <div *ngIf="!trialBalance.length && tbPeriodId" class="empty mt">No posted entries in this period.</div>
  </div>
</div>
  `,
  styles: [`
    .page { padding: 1.5rem; }
    .page-header { margin-bottom: 1.25rem; }
    .page-title { font-size: 1.4rem; font-weight: 700; color: #0f172a; }
    .page-sub { color: #64748b; font-size: .8rem; margin-top: .2rem; }

    .tabs { display: flex; gap: .25rem; border-bottom: 2px solid #e2e8f0; margin-bottom: 1.25rem; }
    .tab { padding: .6rem 1.1rem; border: none; background: none; cursor: pointer; font-size: .875rem; color: #64748b; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all .15s; }
    .tab:hover { color: #1e40af; }
    .tab.active { color: #1d4ed8; font-weight: 600; border-bottom-color: #1d4ed8; }

    .toolbar { display: flex; gap: .75rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
    .search-input { padding: .45rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; flex: 1; min-width: 200px; }
    .filter-select { padding: .45rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; }

    .btn-primary { background: #1d4ed8; color: #fff; border: none; padding: .5rem 1rem; border-radius: 6px; cursor: pointer; font-size: .875rem; font-weight: 500; }
    .btn-primary:hover { background: #1e40af; }
    .btn-primary:disabled { opacity: .5; cursor: default; }
    .btn-ghost { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; padding: .5rem 1rem; border-radius: 6px; cursor: pointer; font-size: .875rem; }
    .btn-primary-sm { background: #1d4ed8; color: #fff; border: none; padding: .35rem .75rem; border-radius: 5px; cursor: pointer; font-size: .8rem; }
    .btn-danger-sm { background: #fee2e2; color: #dc2626; border: none; padding: .35rem .75rem; border-radius: 5px; cursor: pointer; font-size: .8rem; }
    .btn-xs { padding: .2rem .5rem; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 4px; cursor: pointer; font-size: .75rem; }
    .btn-red { border-color: #fecaca; color: #dc2626; }

    .form-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; margin-bottom: 1rem; }
    .form-title { font-weight: 600; font-size: .95rem; color: #0f172a; margin-bottom: 1rem; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: .35rem; }
    .form-field label { font-size: .75rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: .04em; }
    .form-field input, .form-field select { padding: .45rem .6rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; }
    .form-actions { display: flex; gap: .5rem; }

    .split { display: grid; grid-template-columns: 300px 1fr; gap: 1rem; }
    .list-panel { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #fff; height: fit-content; }
    .list-row { padding: .75rem 1rem; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background .1s; }
    .list-row:last-child { border-bottom: none; }
    .list-row:hover { background: #f8fafc; }
    .list-row.active { background: #eff6ff; border-left: 3px solid #1d4ed8; }
    .row-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: .2rem; font-size: .875rem; }
    .row-sub { font-size: .75rem; color: #64748b; }
    .row-amounts { font-size: .75rem; color: #94a3b8; margin-top: .2rem; }

    .detail-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; }
    .empty-detail { display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: .875rem; min-height: 200px; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .detail-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .action-row { display: flex; gap: .5rem; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: .75rem; background: #f8fafc; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .info-item { display: flex; flex-direction: column; gap: .2rem; font-size: .875rem; color: #0f172a; }
    .info-label { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; }
    .sub-section-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; margin: 1rem 0 .5rem; }

    .data-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    .data-table th { background: #f8fafc; padding: .5rem .75rem; text-align: left; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: .55rem .75rem; border-bottom: 1px solid #f1f5f9; color: #0f172a; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f8fafc; }
    .total-row td { background: #f8fafc; font-size: .875rem; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .neg { color: #dc2626; }
    .mt { margin-top: 1rem; }

    .je-totals { display: flex; justify-content: space-between; align-items: center; padding: .75rem 0; font-size: .875rem; color: #475569; }

    .badge { display: inline-block; padding: .2rem .5rem; border-radius: 4px; font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    .badge-open { background: #dcfce7; color: #166534; }
    .badge-closed { background: #f1f5f9; color: #475569; }
    .badge-onhold { background: #fef9c3; color: #92400e; }
    .badge-draft { background: #f1f5f9; color: #475569; }
    .badge-posted { background: #dcfce7; color: #166534; }
    .badge-voided { background: #fee2e2; color: #dc2626; }
    .badge-active { background: #dcfce7; color: #166534; }
    .badge-inactive { background: #f1f5f9; color: #475569; }

    .empty { padding: 2rem; text-align: center; color: #94a3b8; font-size: .875rem; }
    code { font-family: monospace; background: #f1f5f9; padding: .1rem .3rem; border-radius: 3px; font-size: .8rem; }
  `]
})
export class GeneralLedgerComponent implements OnInit {
  activeTab: Tab = 'fiscal';
  tabs = [
    { id: 'fiscal' as Tab, label: 'Fiscal Calendar', icon: '📅' },
    { id: 'coa' as Tab, label: 'Chart of Accounts', icon: '📊' },
    { id: 'journal' as Tab, label: 'Journal Entries', icon: '📝' },
    { id: 'trial' as Tab, label: 'Trial Balance', icon: '⚖️' },
  ];

  // Fiscal
  fiscalYears: FiscalYear[] = [];
  selectedFY: FiscalYear | null = null;
  periods: FiscalPeriod[] = [];
  showCreateFY = false;
  fyForm = { name: '', description: '', startDate: '', endDate: '' };

  // COA
  accounts: Account[] = [];
  accountTypes: AccountType[] = [];
  coaSearch = '';
  showCreateAccount = false;
  acctForm = { accountNumber: '', name: '', accountTypeId: '', isHeaderAccount: false };

  // Journal
  journalEntries: JournalEntry[] = [];
  selectedJE: JournalEntry | null = null;
  jeFilterPeriod = '';
  showCreateJE = false;
  jeForm = { entryDate: '', fiscalPeriodId: '', description: '', reference: '', lines: [] as any[] };
  allPeriods: FiscalPeriod[] = [];

  // Trial Balance
  trialBalance: TrialBalanceLine[] = [];
  tbPeriodId = '';
  get tbTotalDebit() { return this.trialBalance.reduce((s, t) => s + t.totalDebit, 0); }
  get tbTotalCredit() { return this.trialBalance.reduce((s, t) => s + t.totalCredit, 0); }
  get tbTotalBalance() { return this.trialBalance.reduce((s, t) => s + t.balance, 0); }
  get jeDebitTotal() { return this.jeForm.lines.reduce((s, l) => s + (+l.debit || 0), 0); }
  get jeCreditTotal() { return this.jeForm.lines.reduce((s, l) => s + (+l.credit || 0), 0); }
  get filteredAccounts() {
    if (!this.coaSearch) return this.accounts;
    const q = this.coaSearch.toLowerCase();
    return this.accounts.filter(a => a.accountNumber.includes(q) || a.name.toLowerCase().includes(q));
  }
  get postableAccounts() { return this.accounts.filter(a => !a.isHeaderAccount && a.status === 'Active'); }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getFiscalYears().subscribe(d => this.fiscalYears = d);
    this.api.getAccounts().subscribe(d => this.accounts = d);
    this.api.getAccountTypes().subscribe(d => this.accountTypes = d);
    this.loadAllPeriods();
    this.loadJournalEntries();
  }

  setTab(t: Tab) { this.activeTab = t; }

  selectFY(fy: FiscalYear) {
    this.selectedFY = fy;
    this.api.getPeriods(fy.id).subscribe(d => this.periods = d);
  }

  createFY() {
    this.api.createFiscalYear({ ...this.fyForm, autoGeneratePeriods: true }).subscribe(d => {
      this.fiscalYears = [d, ...this.fiscalYears];
      this.showCreateFY = false;
      this.fyForm = { name: '', description: '', startDate: '', endDate: '' };
      this.loadAllPeriods();
    });
  }

  closeFY(id: string) {
    this.api.closeFiscalYear(id).subscribe(() => this.api.getFiscalYears().subscribe(d => {
      this.fiscalYears = d;
      this.selectedFY = d.find(y => y.id === id) || null;
    }));
  }

  closePeriod(id: string) {
    this.api.closePeriod(id).subscribe(() => {
      if (this.selectedFY) this.api.getPeriods(this.selectedFY.id).subscribe(d => this.periods = d);
    });
  }

  createAccount() {
    this.api.createAccount({ ...this.acctForm }).subscribe(d => {
      this.accounts = [...this.accounts, d].sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));
      this.showCreateAccount = false;
      this.acctForm = { accountNumber: '', name: '', accountTypeId: '', isHeaderAccount: false };
    });
  }

  loadAllPeriods() {
    this.api.getFiscalYears().subscribe(years => {
      const calls = years.map(y => this.api.getPeriods(y.id));
      if (!calls.length) return;
      let results: FiscalPeriod[] = [];
      let done = 0;
      calls.forEach(c => c.subscribe(p => {
        results = [...results, ...p];
        done++;
        if (done === calls.length) this.allPeriods = results.sort((a, b) => a.name.localeCompare(b.name));
      }));
    });
  }

  loadJournalEntries() {
    this.api.getJournalEntries(this.jeFilterPeriod || undefined).subscribe(d => this.journalEntries = d);
  }

  addJELine() { this.jeForm.lines.push({ accountId: '', description: '', debit: 0, credit: 0 }); }
  removeJELine(i: number) { this.jeForm.lines.splice(i, 1); }

  createJE() {
    const req = { ...this.jeForm, journalType: 'General', currency: 'USD' };
    this.api.createJournalEntry(req).subscribe(d => {
      this.journalEntries = [d, ...this.journalEntries];
      this.showCreateJE = false;
      this.jeForm = { entryDate: '', fiscalPeriodId: '', description: '', reference: '', lines: [] };
    });
  }

  postJE(id: string) {
    this.api.postJournalEntry(id).subscribe(() => this.loadJournalEntries());
  }

  voidJE(id: string) {
    this.api.voidJournalEntry(id).subscribe(() => this.loadJournalEntries());
  }

  loadTrialBalance() {
    if (!this.tbPeriodId) return;
    this.api.getTrialBalance(this.tbPeriodId).subscribe(d => this.trialBalance = d);
  }
}
