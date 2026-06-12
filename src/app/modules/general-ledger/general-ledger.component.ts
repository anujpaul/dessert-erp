import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { FiscalCalendar, FiscalYear, FiscalPeriod, Account, AccountType, JournalEntry, TrialBalanceLine, Currency } from '../../core/models/erp.models';

type Tab = 'fiscal' | 'coa' | 'journal' | 'trial' | 'currencies';

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
      <p class="page-sub">Fiscal Calendar · Chart of Accounts · Journal Entries · Trial Balance · Currencies</p>
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
      <select class="filter-select" [ngModel]="selectedCalendar?.id" (ngModelChange)="selectCalendarById($event)">
        <option value="">Select fiscal calendar</option>
        <option *ngFor="let calendar of fiscalCalendars" [value]="calendar.id">
          {{ calendar.name }} ({{ calendar.calendarType }}){{ calendar.isDefault ? ' - Default' : '' }}
        </option>
      </select>
      <button class="btn-ghost" (click)="showCreateCalendar = !showCreateCalendar">+ New Calendar</button>
      <button class="btn-primary" (click)="showCreateFY = !showCreateFY" [disabled]="!selectedCalendar">+ New Fiscal Year</button>
    </div>

    <div *ngIf="showCreateCalendar" class="form-card">
      <div class="form-title">New Fiscal Calendar</div>
      <div class="form-grid">
        <div class="form-field"><label>Name</label><input [(ngModel)]="calendarForm.name" placeholder="Retail Calendar" /></div>
        <div class="form-field"><label>Description</label><input [(ngModel)]="calendarForm.description" placeholder="Calendar used by retail operations" /></div>
        <div class="form-field">
          <label>Calendar Type</label>
          <select [(ngModel)]="calendarForm.calendarType">
            <option *ngFor="let type of calendarTypes" [value]="type">{{ type }}</option>
          </select>
        </div>
        <div class="form-field">
          <label>Default Posting Calendar</label>
          <select [(ngModel)]="calendarForm.isDefault">
            <option [ngValue]="false">No</option>
            <option [ngValue]="true">Yes</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createCalendar()">Create Calendar</button>
        <button class="btn-ghost" (click)="showCreateCalendar = false">Cancel</button>
      </div>
    </div>

    <div *ngIf="selectedCalendar" class="calendar-summary">
      <div>
        <strong>{{ selectedCalendar.name }}</strong>
        <span>{{ selectedCalendar.calendarType }} · {{ selectedCalendar.fiscalYearCount }} fiscal year(s)</span>
      </div>
      <button *ngIf="!selectedCalendar.isDefault" class="btn-ghost btn-sm" (click)="setDefaultCalendar()">Set as Default</button>
      <span *ngIf="selectedCalendar.isDefault" class="badge badge-open">Default Posting Calendar</span>
    </div>

    <!-- Create FY Form -->
    <div *ngIf="showCreateFY && selectedCalendar" class="form-card">
      <div class="form-title">New Fiscal Year in {{ selectedCalendar.name }}</div>
      <div class="form-grid">
        <div class="form-field"><label>Name</label><input [(ngModel)]="fyForm.name" placeholder="FY2027" /></div>
        <div class="form-field"><label>Description</label><input [(ngModel)]="fyForm.description" placeholder="Fiscal Year 2027" /></div>
        <div class="form-field"><label>Start Date</label><input type="date" [(ngModel)]="fyForm.startDate" /></div>
        <div class="form-field"><label>End Date</label><input type="date" [(ngModel)]="fyForm.endDate" /></div>
        <div class="form-field">
          <label>Period Creation</label>
          <select [(ngModel)]="fyForm.autoGeneratePeriods" [disabled]="selectedCalendar.calendarType === 'Custom'">
            <option [ngValue]="true">Generate {{ selectedCalendar.calendarType }} periods</option>
            <option [ngValue]="false">Create periods manually</option>
          </select>
        </div>
      </div>
      <p style="font-size:.82rem;color:#6b7280;margin:.25rem 0 .75rem">
        Calendar pattern: <strong>{{ selectedCalendar.calendarType }}</strong>.
        Custom calendars use manually entered periods.
      </p>
      <div class="form-actions">
        <button class="btn-primary" (click)="createFY()">Create Fiscal Year</button>
        <button class="btn-ghost" (click)="showCreateFY = false">Cancel</button>
      </div>
    </div>

    <!-- FY List + Period Detail split -->
    <div class="split">
      <!-- LEFT: FY list -->
      <div class="list-panel">
        <div *ngFor="let fy of fiscalYears" class="list-row" [class.active]="selectedFY?.id === fy.id" (click)="selectFY(fy)">
          <div class="row-main">
            <strong>{{ fy.name }}</strong>
            <span class="badge" [class]="'badge-' + fy.status.toLowerCase()">{{ fy.status }}</span>
          </div>
          <div class="row-sub">{{ fy.startDate | date:'MMM d, y' }} → {{ fy.endDate | date:'MMM d, y' }} · {{ fy.periodCount }} period(s)</div>
        </div>
        <div *ngIf="!fiscalYears.length" class="empty">No fiscal years.</div>
      </div>

      <!-- RIGHT: Period Management -->
      <div class="detail-panel" *ngIf="selectedFY">
        <!-- FY header -->
        <div class="detail-header">
          <div class="detail-title">{{ selectedFY.name }}</div>
          <button *ngIf="selectedFY.status === 'Open'" class="btn-danger-sm" (click)="closeFY(selectedFY.id)">Close Year</button>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Status</span><span class="badge" [class]="'badge-' + selectedFY.status.toLowerCase()">{{ selectedFY.status }}</span></div>
          <div class="info-item"><span class="info-label">Start</span><span>{{ selectedFY.startDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">End</span><span>{{ selectedFY.endDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">Periods</span><span>{{ periods.length }}</span></div>
        </div>

        <!-- Period toolbar -->
        <div class="sub-section-title" style="display:flex;align-items:center;justify-content:space-between;margin-top:1rem">
          <span>Periods</span>
          <div style="display:flex;gap:.5rem" *ngIf="selectedFY.status === 'Open'">
            <!-- Generate dropdown -->
            <div style="position:relative" *ngIf="selectedFY.calendarType !== 'Custom'">
              <button class="btn-ghost btn-sm" (click)="showGenerateMenu = !showGenerateMenu">⚡ Generate ▾</button>
              <div *ngIf="showGenerateMenu" style="position:absolute;right:0;top:100%;background:var(--color-surface);border:1px solid var(--color-border);border-radius:6px;z-index:10;min-width:160px;box-shadow:0 4px 12px rgba(0,0,0,.15)">
                <button class="gen-menu-item" (click)="generatePeriods()">Generate {{ selectedFY.calendarType }} periods</button>
              </div>
            </div>
            <button class="btn-primary btn-sm" (click)="showAddPeriod = !showAddPeriod">+ Add Period</button>
          </div>
        </div>

        <!-- Add Period inline form -->
        <div *ngIf="showAddPeriod && selectedFY.status === 'Open'" class="form-card" style="margin:0 0 .75rem;padding:.75rem 1rem">
          <div class="form-grid" style="grid-template-columns:2fr 1fr 1fr">
            <div class="form-field">
              <label>Period Name</label>
              <input [(ngModel)]="periodForm.name" placeholder="e.g. January 2027" />
            </div>
            <div class="form-field">
              <label>Start Date</label>
              <input type="date" [(ngModel)]="periodForm.startDate" />
            </div>
            <div class="form-field">
              <label>End Date</label>
              <input type="date" [(ngModel)]="periodForm.endDate" />
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-primary btn-sm" (click)="addPeriod()">Save Period</button>
            <button class="btn-ghost btn-sm" (click)="showAddPeriod = false">Cancel</button>
          </div>
        </div>

        <!-- Period table -->
        <table class="data-table" *ngIf="periods.length">
          <thead>
            <tr><th>#</th><th>Name</th><th>Start</th><th>End</th><th>Days</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of periods">
              <td>{{ p.periodNumber }}</td>
              <td>
                <!-- Inline edit -->
                <span *ngIf="editingPeriodId !== p.id">{{ p.name }}</span>
                <input *ngIf="editingPeriodId === p.id" class="inline-edit-input" [(ngModel)]="editPeriodForm.name" />
              </td>
              <td>
                <span *ngIf="editingPeriodId !== p.id">{{ p.startDate | date:'MMM d, y' }}</span>
                <input *ngIf="editingPeriodId === p.id" type="date" class="inline-edit-input" [(ngModel)]="editPeriodForm.startDate" />
              </td>
              <td>
                <span *ngIf="editingPeriodId !== p.id">{{ p.endDate | date:'MMM d, y' }}</span>
                <input *ngIf="editingPeriodId === p.id" type="date" class="inline-edit-input" [(ngModel)]="editPeriodForm.endDate" />
              </td>
              <td>{{ dayCount(p.startDate, p.endDate) }}</td>
              <td><span class="badge" [class]="'badge-' + p.status.toLowerCase()">{{ p.status }}</span></td>
              <td style="display:flex;gap:.3rem;flex-wrap:nowrap">
                <ng-container *ngIf="p.status === 'Open' && selectedFY.status === 'Open'">
                  <!-- Editing row -->
                  <ng-container *ngIf="editingPeriodId === p.id">
                    <button class="btn-xs btn-primary" (click)="savePeriodEdit(p)">✓</button>
                    <button class="btn-xs" (click)="editingPeriodId = null">✕</button>
                  </ng-container>
                  <!-- Normal row -->
                  <ng-container *ngIf="editingPeriodId !== p.id">
                    <button class="btn-xs" (click)="startEditPeriod(p)" title="Edit">✏️</button>
                    <button class="btn-xs" (click)="closePeriod(p.id)" title="Close period">🔒</button>
                    <button class="btn-xs btn-danger-xs" (click)="deletePeriod(p)" title="Delete">🗑</button>
                  </ng-container>
                </ng-container>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="!periods.length" class="empty" style="margin-top:.5rem">
          No periods defined yet. Use "+ Add Period" to add one manually, or "⚡ Generate" to auto-fill.
        </div>
      </div>

      <div class="detail-panel empty-detail" *ngIf="!selectedFY">Select a fiscal year to manage its periods.</div>
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

  <!-- ── CURRENCIES ── -->
  <div *ngIf="activeTab === 'currencies'" class="tab-content">
    <div class="toolbar">
      <input [(ngModel)]="currSearch" placeholder="Search currencies…" class="search-input" />
      <label style="display:flex;align-items:center;gap:.4rem;font-size:.83rem;color:#64748b">
        <input type="checkbox" [(ngModel)]="currActiveOnly" (change)="loadCurrencies()" /> Active only
      </label>
      <button class="btn-primary" (click)="showCreateCurr = !showCreateCurr">+ Add Currency</button>
    </div>

    <!-- Create Form -->
    <div *ngIf="showCreateCurr" class="form-card">
      <div class="form-title">Add Currency</div>
      <div class="form-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
        <div class="form-field">
          <label>ISO Code</label>
          <input [(ngModel)]="currForm.code" placeholder="USD" maxlength="3" style="text-transform:uppercase" />
        </div>
        <div class="form-field">
          <label>Name</label>
          <input [(ngModel)]="currForm.name" placeholder="US Dollar" />
        </div>
        <div class="form-field">
          <label>Symbol</label>
          <input [(ngModel)]="currForm.symbol" placeholder="$" />
        </div>
        <div class="form-field">
          <label>Decimal Places</label>
          <input type="number" [(ngModel)]="currForm.decimalPlaces" min="0" max="4" />
        </div>
        <div class="form-field">
          <label>Exchange Rate (vs base)</label>
          <input type="number" [(ngModel)]="currForm.exchangeRate" min="0.0001" step="0.0001" />
        </div>
        <div class="form-field">
          <label>Numeric Code (ISO)</label>
          <input type="number" [(ngModel)]="currForm.numericCode" placeholder="840" />
        </div>
        <div class="form-field">
          <label>Country / Region</label>
          <input [(ngModel)]="currForm.country" placeholder="United States" />
        </div>
        <div class="form-field">
          <label>Set as Base?</label>
          <select [(ngModel)]="currForm.isBase">
            <option [ngValue]="false">No</option>
            <option [ngValue]="true">Yes — functional currency</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createCurrency()">Save</button>
        <button class="btn-ghost" (click)="showCreateCurr = false">Cancel</button>
      </div>
    </div>

    <!-- Currency Table -->
    <div class="split" style="grid-template-columns:1fr 380px">
      <!-- LEFT: list -->
      <div>
        <table class="data-table mt">
          <thead>
            <tr>
              <th>Code</th><th>Symbol</th><th>Name</th><th>Country</th>
              <th class="num">Exch. Rate</th><th>Dec</th><th>Numeric</th>
              <th>Base</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of filteredCurrencies" [class.active-row]="selectedCurr?.id === c.id" (click)="selectCurrency(c)" style="cursor:pointer">
              <td><code>{{ c.code }}</code></td>
              <td>{{ c.symbol }}</td>
              <td>{{ c.name }}</td>
              <td>{{ c.country ?? '—' }}</td>
              <td class="num">{{ c.isBase ? '1.000000' : c.exchangeRate.toFixed(6) }}</td>
              <td class="num">{{ c.decimalPlaces }}</td>
              <td class="num">{{ c.numericCode ?? '—' }}</td>
              <td>
                <span *ngIf="c.isBase" style="font-size:.75rem;background:#fef9c3;color:#92400e;padding:.15rem .4rem;border-radius:4px;font-weight:600">BASE</span>
              </td>
              <td>
                <span class="badge" [class]="c.isActive ? 'badge-active' : 'badge-inactive'">{{ c.isActive ? 'Active' : 'Inactive' }}</span>
              </td>
              <td style="white-space:nowrap">
                <button class="btn-xs" (click)="$event.stopPropagation(); activateCurrency(c)" *ngIf="!c.isActive" title="Activate">✓</button>
                <button class="btn-xs btn-danger-xs" (click)="$event.stopPropagation(); deactivateCurrency(c)" *ngIf="c.isActive && !c.isBase" title="Deactivate">✕</button>
                <button class="btn-xs" (click)="$event.stopPropagation(); startSetBase(c)" *ngIf="!c.isBase" title="Set as base">⭐</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="!filteredCurrencies.length" class="empty mt">No currencies found.</div>
      </div>

      <!-- RIGHT: detail / edit panel -->
      <div class="detail-panel" *ngIf="selectedCurr" style="height:fit-content">
        <div class="detail-header">
          <div class="detail-title">{{ selectedCurr.code }} — {{ selectedCurr.name }}</div>
          <span *ngIf="selectedCurr.isBase" style="font-size:.75rem;background:#fef9c3;color:#92400e;padding:.2rem .5rem;border-radius:4px;font-weight:600">BASE</span>
        </div>

        <div class="info-grid">
          <div class="info-item"><span class="info-label">Symbol</span><span>{{ selectedCurr.symbol }}</span></div>
          <div class="info-item"><span class="info-label">Decimal Places</span><span>{{ selectedCurr.decimalPlaces }}</span></div>
          <div class="info-item"><span class="info-label">Exchange Rate</span><span>{{ selectedCurr.isBase ? '1.000000' : selectedCurr.exchangeRate.toFixed(6) }}</span></div>
          <div class="info-item"><span class="info-label">Rate Updated</span><span>{{ selectedCurr.rateUpdatedAt ? (selectedCurr.rateUpdatedAt | date:'mediumDate') : 'Seed default' }}</span></div>
          <div class="info-item"><span class="info-label">Numeric Code</span><span>{{ selectedCurr.numericCode ?? '—' }}</span></div>
          <div class="info-item"><span class="info-label">Country</span><span>{{ selectedCurr.country ?? '—' }}</span></div>
        </div>

        <!-- Update Exchange Rate -->
        <div *ngIf="!selectedCurr.isBase" class="sub-section-title" style="margin-top:1rem">Update Exchange Rate</div>
        <div *ngIf="!selectedCurr.isBase" style="display:flex;gap:.5rem;align-items:flex-end">
          <div class="form-field" style="flex:1">
            <label>New Rate (1 {{ baseCurrency?.code ?? 'BASE' }} = ? {{ selectedCurr.code }})</label>
            <input type="number" [(ngModel)]="newRate" min="0.000001" step="0.0001" placeholder="1.0800" />
          </div>
          <button class="btn-primary btn-sm" (click)="updateExchangeRate()">Update</button>
        </div>

        <!-- Edit Details -->
        <div class="sub-section-title" style="margin-top:1rem">Edit Details</div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr">
          <div class="form-field"><label>Name</label><input [(ngModel)]="editCurrForm.name" /></div>
          <div class="form-field"><label>Symbol</label><input [(ngModel)]="editCurrForm.symbol" /></div>
          <div class="form-field"><label>Decimal Places</label><input type="number" [(ngModel)]="editCurrForm.decimalPlaces" min="0" max="4" /></div>
          <div class="form-field"><label>Numeric Code</label><input type="number" [(ngModel)]="editCurrForm.numericCode" /></div>
          <div class="form-field" style="grid-column:1/-1"><label>Country / Region</label><input [(ngModel)]="editCurrForm.country" /></div>
        </div>
        <div class="form-actions">
          <button class="btn-primary btn-sm" (click)="updateCurrency()">Save Changes</button>
        </div>
      </div>
      <div class="detail-panel empty-detail" *ngIf="!selectedCurr">Select a currency to view or edit.</div>
    </div>
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
    .btn-sm { padding: .35rem .75rem; font-size: .8rem; }
    .btn-danger-xs { border-color: #fecaca; color: #dc2626; background: #fff5f5; }

    .gen-menu-item { display: block; width: 100%; padding: .5rem .85rem; border: none; background: none; text-align: left; cursor: pointer; font-size: .83rem; color: #0f172a; white-space: nowrap; }
    .gen-menu-item:hover { background: #eff6ff; }

    .inline-edit-input { padding: .25rem .4rem; border: 1px solid #93c5fd; border-radius: 4px; font-size: .85rem; width: 100%; box-sizing: border-box; }

    .form-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; margin-bottom: 1rem; }
    .form-title { font-weight: 600; font-size: .95rem; color: #0f172a; margin-bottom: 1rem; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: .35rem; }
    .form-field label { font-size: .75rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: .04em; }
    .form-field input, .form-field select { padding: .45rem .6rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; }
    .form-actions { display: flex; gap: .5rem; }
    .calendar-summary { display:flex; justify-content:space-between; align-items:center; gap:1rem; padding:.75rem 1rem; margin-bottom:1rem; border:1px solid #bfdbfe; background:#eff6ff; border-radius:8px; }
    .calendar-summary > div { display:flex; flex-direction:column; gap:.15rem; }
    .calendar-summary strong { color:#0f172a; font-size:.9rem; }
    .calendar-summary span { color:#64748b; font-size:.78rem; }

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
    .active-row td { background: #eff6ff !important; }
  `]
})
export class GeneralLedgerComponent implements OnInit {
  activeTab: Tab = 'fiscal';
  tabs = [
    { id: 'fiscal' as Tab, label: 'Fiscal Calendar', icon: '📅' },
    { id: 'coa' as Tab, label: 'Chart of Accounts', icon: '📊' },
    { id: 'journal' as Tab, label: 'Journal Entries', icon: '📝' },
    { id: 'trial' as Tab, label: 'Trial Balance', icon: '⚖️' },
    { id: 'currencies' as Tab, label: 'Currencies', icon: '💱' },
  ];

  // Fiscal
  fiscalCalendars: FiscalCalendar[] = [];
  selectedCalendar: FiscalCalendar | null = null;
  fiscalYears: FiscalYear[] = [];
  selectedFY: FiscalYear | null = null;
  periods: FiscalPeriod[] = [];
  showCreateCalendar = false;
  showCreateFY = false;
  calendarTypes = ['Monthly', 'Quarterly', '4-4-5', '4-5-4', '5-4-4', 'Custom'];
  calendarForm = { name: '', description: '', calendarType: 'Monthly', isDefault: false };
  fyForm = { name: '', description: '', startDate: '', endDate: '', autoGeneratePeriods: true };

  // Period management
  showAddPeriod = false;
  showGenerateMenu = false;
  periodForm = { name: '', startDate: '', endDate: '' };
  editingPeriodId: string | null = null;
  editPeriodForm = { name: '', startDate: '', endDate: '' };

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

  // Currencies
  currencies: Currency[] = [];
  selectedCurr: Currency | null = null;
  baseCurrency: Currency | null = null;
  currSearch = '';
  currActiveOnly = false;
  showCreateCurr = false;
  currForm: any = { code: '', name: '', symbol: '', decimalPlaces: 2, exchangeRate: 1, isBase: false, numericCode: null, country: '' };
  editCurrForm: any = { name: '', symbol: '', decimalPlaces: 2, numericCode: null, country: '' };
  newRate = 1;
  get filteredCurrencies() {
    let list = this.currencies;
    if (this.currSearch) {
      const q = this.currSearch.toLowerCase();
      list = list.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.country ?? '').toLowerCase().includes(q));
    }
    return list;
  }

  get filteredAccounts() {
    if (!this.coaSearch) return this.accounts;
    const q = this.coaSearch.toLowerCase();
    return this.accounts.filter(a => a.accountNumber.includes(q) || a.name.toLowerCase().includes(q));
  }
  get postableAccounts() { return this.accounts.filter(a => !a.isHeaderAccount && a.status === 'Active'); }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadFiscalCalendars();
    this.api.getAccounts().subscribe(d => this.accounts = d);
    this.api.getAccountTypes().subscribe(d => this.accountTypes = d);
    this.loadAllPeriods();
    this.loadJournalEntries();
  }

  setTab(t: Tab) {
    this.activeTab = t;
    if (t === 'currencies' && !this.currencies.length) this.loadCurrencies();
  }

  selectFY(fy: FiscalYear) {
    this.selectedFY = fy;
    this.showAddPeriod = false;
    this.showGenerateMenu = false;
    this.editingPeriodId = null;
    this.api.getPeriods(fy.id).subscribe(d => this.periods = d);
  }

  loadFiscalCalendars(selectId?: string) {
    this.api.getFiscalCalendars().subscribe({
      next: calendars => {
        this.fiscalCalendars = calendars;
        const selected = calendars.find(c => c.id === selectId)
          ?? calendars.find(c => c.id === this.selectedCalendar?.id)
          ?? calendars.find(c => c.isDefault)
          ?? calendars[0]
          ?? null;
        this.selectCalendar(selected);
      },
      error: (err: any) => alert(err.error?.error ?? 'Failed to load fiscal calendars.')
    });
  }

  selectCalendar(calendar: FiscalCalendar | null) {
    this.selectedCalendar = calendar;
    this.selectedFY = null;
    this.periods = [];
    this.fiscalYears = [];
    if (!calendar) return;
    if (calendar.calendarType === 'Custom') this.fyForm.autoGeneratePeriods = false;
    this.api.getFiscalYears(calendar.id).subscribe({
      next: years => this.fiscalYears = years,
      error: (err: any) => alert(err.error?.error ?? 'Failed to load fiscal years.')
    });
  }

  selectCalendarById(id: string) {
    this.selectCalendar(this.fiscalCalendars.find(c => c.id === id) ?? null);
  }

  createCalendar() {
    this.api.createFiscalCalendar({ ...this.calendarForm }).subscribe({
      next: calendar => {
        this.showCreateCalendar = false;
        this.calendarForm = { name: '', description: '', calendarType: 'Monthly', isDefault: false };
        this.loadFiscalCalendars(calendar.id);
      },
      error: (err: any) => alert(err.error?.error ?? 'Failed to create fiscal calendar.')
    });
  }

  setDefaultCalendar() {
    if (!this.selectedCalendar || this.selectedCalendar.isDefault) return;
    this.api.setDefaultFiscalCalendar(this.selectedCalendar.id).subscribe({
      next: () => this.loadFiscalCalendars(this.selectedCalendar!.id),
      error: (err: any) => alert(err.error?.error ?? 'Failed to set the default calendar.')
    });
  }

  createFY() {
    if (!this.selectedCalendar) return;
    this.api.createFiscalYear({
      ...this.fyForm,
      fiscalCalendarId: this.selectedCalendar.id
    }).subscribe({
      next: d => {
        this.fiscalYears = [d, ...this.fiscalYears];
        this.showCreateFY = false;
        this.fyForm = {
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          autoGeneratePeriods: this.selectedCalendar!.calendarType !== 'Custom'
        };
        this.selectFY(d);
        this.selectedCalendar = {
          ...this.selectedCalendar!,
          fiscalYearCount: this.selectedCalendar!.fiscalYearCount + 1
        };
        this.fiscalCalendars = this.fiscalCalendars.map(c =>
          c.id === this.selectedCalendar!.id ? this.selectedCalendar! : c);
        this.loadAllPeriods();
      },
      error: (err: any) => alert(err.error?.error ?? 'Failed to create fiscal year.')
    });
  }

  addPeriod() {
    if (!this.selectedFY) return;
    this.api.createPeriod(this.selectedFY.id, this.periodForm).subscribe({
      next: (p: FiscalPeriod) => {
        this.periods = [...this.periods, p].sort((a, b) => a.periodNumber - b.periodNumber);
        this.updateFYPeriodCount();
        this.showAddPeriod = false;
        this.periodForm = { name: '', startDate: '', endDate: '' };
        this.loadAllPeriods();
      },
      error: (err: any) => alert(err.error?.error ?? 'Failed to add period.')
    });
  }

  generatePeriods() {
    if (!this.selectedFY) return;
    this.showGenerateMenu = false;
    const type = this.selectedFY.calendarType;
    if (!confirm('This will replace all existing periods with ' + type + ' periods. Continue?')) return;
    this.api.generatePeriods(this.selectedFY.id, type).subscribe({
      next: (periods: FiscalPeriod[]) => {
        this.periods = periods.sort((a, b) => a.periodNumber - b.periodNumber);
        this.updateFYPeriodCount();
        this.loadAllPeriods();
      },
      error: (err: any) => alert(err.error?.error ?? 'Failed to generate periods.')
    });
  }

  startEditPeriod(p: FiscalPeriod) {
    this.editingPeriodId = p.id;
    this.editPeriodForm = {
      name: p.name,
      startDate: p.startDate.split('T')[0],
      endDate: p.endDate.split('T')[0]
    };
  }

  savePeriodEdit(p: FiscalPeriod) {
    if (!this.selectedFY) return;
    this.api.updatePeriod(this.selectedFY.id, p.id, this.editPeriodForm).subscribe({
      next: (updated: FiscalPeriod) => {
        this.periods = this.periods.map(x => x.id === p.id ? updated : x);
        this.editingPeriodId = null;
        this.loadAllPeriods();
      },
      error: (err: any) => alert(err.error?.error ?? 'Failed to update period.')
    });
  }

  deletePeriod(p: FiscalPeriod) {
    if (!this.selectedFY) return;
    if (!confirm('Delete period "' + p.name + '"? This cannot be undone.')) return;
    this.api.deletePeriod(this.selectedFY.id, p.id).subscribe({
      next: () => {
        this.periods = this.periods.filter(x => x.id !== p.id);
        this.updateFYPeriodCount();
        this.loadAllPeriods();
      },
      error: (err: any) => alert(err.error?.error ?? 'Failed to delete period.')
    });
  }

  private updateFYPeriodCount() {
    if (this.selectedFY) {
      this.selectedFY = { ...this.selectedFY, periodCount: this.periods.length };
      this.fiscalYears = this.fiscalYears.map(y => y.id === this.selectedFY!.id ? this.selectedFY! : y);
    }
  }

  dayCount(start: string, end: string): number {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(ms / 86400000) + 1;
  }

  closeFY(id: string) {
    this.api.closeFiscalYear(id).subscribe(() => this.api.getFiscalYears(this.selectedCalendar?.id).subscribe(d => {
      this.fiscalYears = d;
      this.selectedFY = d.find((y: FiscalYear) => y.id === id) ?? null;
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
      const calls = years.map((y: FiscalYear) => this.api.getPeriods(y.id));
      if (!calls.length) return;
      let results: FiscalPeriod[] = [];
      let done = 0;
      calls.forEach((c: any) => c.subscribe((p: FiscalPeriod[]) => {
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

  // ── Currency methods ──────────────────────────────────────────────────────

  loadCurrencies() {
    this.api.getCurrencies(this.currActiveOnly).subscribe({
      next: (d: Currency[]) => {
        this.currencies = d;
        this.baseCurrency = d.find((c: Currency) => c.isBase) ?? null;
      },
      error: () => {}
    });
  }

  selectCurrency(c: Currency) {
    this.selectedCurr = c;
    this.newRate = c.exchangeRate;
    this.editCurrForm = {
      name: c.name,
      symbol: c.symbol,
      decimalPlaces: c.decimalPlaces,
      numericCode: c.numericCode ?? null,
      country: c.country ?? ''
    };
  }

  createCurrency() {
    this.api.createCurrency(this.currForm).subscribe({
      next: (d: Currency) => {
        this.currencies = [...this.currencies, d];
        if (d.isBase) this.baseCurrency = d;
        this.showCreateCurr = false;
        this.currForm = { code: '', name: '', symbol: '', decimalPlaces: 2, exchangeRate: 1, isBase: false, numericCode: null, country: '' };
      },
      error: (err: any) => alert(err.error?.error ?? 'Failed to create currency.')
    });
  }

  updateCurrency() {
    if (!this.selectedCurr) return;
    this.api.updateCurrency(this.selectedCurr.id, this.editCurrForm).subscribe({
      next: (d: Currency) => {
        this.currencies = this.currencies.map(c => c.id === d.id ? d : c);
        this.selectedCurr = d;
      },
      error: (err: any) => alert(err.error?.error ?? 'Failed to update currency.')
    });
  }

  updateExchangeRate() {
    if (!this.selectedCurr) return;
    this.api.updateCurrencyExchangeRate(this.selectedCurr.id, { exchangeRate: this.newRate }).subscribe({
      next: (d: Currency) => {
        this.currencies = this.currencies.map(c => c.id === d.id ? d : c);
        this.selectedCurr = d;
      },
      error: (err: any) => alert(err.error?.error ?? 'Failed to update rate.')
    });
  }

  startSetBase(c: Currency) {
    if (!confirm('Set ' + c.code + ' as the base (functional) currency? This will change all exchange rate calculations.')) return;
    this.api.setBaseCurrency(c.id).subscribe({
      next: (d: Currency) => {
        this.loadCurrencies();
        this.selectedCurr = d;
      },
      error: (err: any) => alert(err.error?.error ?? 'Failed to set base currency.')
    });
  }

  activateCurrency(c: Currency) {
    this.api.activateCurrency(c.id).subscribe({
      next: () => {
        const updated = { ...c, isActive: true };
        this.currencies = this.currencies.map(x => x.id === c.id ? updated : x);
        if (this.selectedCurr?.id === c.id) this.selectedCurr = updated;
      },
      error: (err: any) => alert(err.error?.error ?? 'Failed to activate.')
    });
  }

  deactivateCurrency(c: Currency) {
    this.api.deactivateCurrency(c.id).subscribe({
      next: () => {
        const updated = { ...c, isActive: false };
        this.currencies = this.currencies.map(x => x.id === c.id ? updated : x);
        if (this.selectedCurr?.id === c.id) this.selectedCurr = updated;
      },
      error: (err: any) => alert(err.error?.error ?? 'Failed to deactivate.')
    });
  }
}
