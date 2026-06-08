import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { OrgService } from '../../core/services/org.service';

type Tab = 'accounts' | 'transactions' | 'reconciliation' | 'journals';

@Component({
  selector: 'app-cash-bank',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="module-container">
  <div class="module-header">
    <h1>💰 Cash & Bank Management</h1>
    <div class="tab-bar">
      <button *ngFor="let t of tabs" class="tab-btn"
        [class.active]="activeTab === t.id"
        (click)="setTab(t.id)">{{ t.label }}</button>
    </div>
  </div>

  <!-- ── BANK ACCOUNTS ──────────────────────────────────────────── -->
  <div *ngIf="activeTab === 'accounts'" class="tab-content">
    <div class="toolbar">
      <input [(ngModel)]="acctSearch" placeholder="Search accounts…" class="search-input" />
      <button class="btn-primary" (click)="showCreateAcct = !showCreateAcct">+ New Account</button>
    </div>

    <div *ngIf="showCreateAcct" class="form-card">
      <div class="form-title">New Bank Account</div>
      <div class="form-grid">
        <div class="form-field"><label>Account Code *</label>
          <input [(ngModel)]="acctForm.accountCode" placeholder="e.g. BANK-USD-01" /></div>
        <div class="form-field"><label>Account Name *</label>
          <input [(ngModel)]="acctForm.accountName" placeholder="Chase Checking" /></div>
        <div class="form-field"><label>Type</label>
          <select [(ngModel)]="acctForm.accountType">
            <option *ngFor="let t of acctTypes" [value]="t">{{ t }}</option>
          </select></div>
        <div class="form-field"><label>Currency</label>
          <select [(ngModel)]="acctForm.currency">
            <option *ngFor="let c of currencies" [value]="c.code">{{ c.code }} – {{ c.name }}</option>
          </select></div>
        <div class="form-field"><label>Bank Name</label>
          <input [(ngModel)]="acctForm.bankName" /></div>
        <div class="form-field"><label>Branch</label>
          <input [(ngModel)]="acctForm.bankBranch" /></div>
        <div class="form-field"><label>Routing #</label>
          <input [(ngModel)]="acctForm.routingNumber" /></div>
        <div class="form-field"><label>Account #</label>
          <input [(ngModel)]="acctForm.accountNumber" /></div>
        <div class="form-field"><label>IBAN</label>
          <input [(ngModel)]="acctForm.iban" /></div>
        <div class="form-field"><label>SWIFT/BIC</label>
          <input [(ngModel)]="acctForm.swiftCode" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createAccount()" [disabled]="!acctForm.accountCode || !acctForm.accountName">Create</button>
        <button class="btn-secondary" (click)="showCreateAcct = false">Cancel</button>
      </div>
    </div>

    <div class="list-panel">
      <div *ngFor="let a of filteredAccounts" class="list-row"
        [class.active]="selectedAcct?.id === a.id"
        (click)="selectAccount(a)">
        <div class="row-icon">🏦</div>
        <div class="row-body">
          <strong>{{ a.accountCode }}</strong> — {{ a.accountName }}
          <div class="row-meta">{{ a.accountType }} · {{ a.currency }} · <span [class]="statusClass(a.accountStatus)">{{ a.accountStatus }}</span></div>
        </div>
        <div class="row-amounts">{{ a.currentBalance | number:'1.2-2' }} {{ a.currency }}</div>
      </div>
      <div *ngIf="!filteredAccounts.length" class="empty">No bank accounts found.</div>
    </div>

    <div *ngIf="selectedAcct" class="detail-panel">
      <div class="detail-title">{{ selectedAcct.accountName }}</div>
      <div class="detail-badge" [class]="statusClass(selectedAcct.accountStatus)">{{ selectedAcct.accountStatus }}</div>

      <div class="info-grid">
        <div class="info-item"><span class="info-label">Code</span><span>{{ selectedAcct.accountCode }}</span></div>
        <div class="info-item"><span class="info-label">Type</span><span>{{ selectedAcct.accountType }}</span></div>
        <div class="info-item"><span class="info-label">Currency</span><span>{{ selectedAcct.currency }}</span></div>
        <div class="info-item"><span class="info-label">Balance</span><span class="amount">{{ selectedAcct.currentBalance | number:'1.2-2' }}</span></div>
        <div class="info-item"><span class="info-label">Last Reconciled</span><span>{{ selectedAcct.lastReconciledBalance | number:'1.2-2' }}</span></div>
        <div class="info-item"><span class="info-label">Reconciled At</span><span>{{ (selectedAcct.lastReconciledAt | date:'mediumDate') || '—' }}</span></div>
        <div class="info-item"><span class="info-label">Bank</span><span>{{ selectedAcct.bankName || '—' }}</span></div>
        <div class="info-item"><span class="info-label">Routing #</span><span>{{ selectedAcct.routingNumber || '—' }}</span></div>
        <div class="info-item"><span class="info-label">Account #</span><span>{{ selectedAcct.accountNumberMasked || '—' }}</span></div>
        <div class="info-item"><span class="info-label">IBAN</span><span>{{ selectedAcct.iban || '—' }}</span></div>
        <div class="info-item"><span class="info-label">SWIFT</span><span>{{ selectedAcct.swiftCode || '—' }}</span></div>
      </div>

      <div class="action-row mt">
        <button class="btn-success" *ngIf="selectedAcct.accountStatus !== 'Active'"
          (click)="toggleAcctStatus(selectedAcct, true)">Activate</button>
        <button class="btn-danger" *ngIf="selectedAcct.accountStatus === 'Active'"
          (click)="toggleAcctStatus(selectedAcct, false)">Deactivate</button>
        <button class="btn-secondary"
          (click)="filterTxByAccount(selectedAcct)">View Transactions</button>
        <button class="btn-secondary"
          (click)="startReconciliation(selectedAcct)">Reconcile</button>
      </div>
    </div>
  </div>

  <!-- ── TRANSACTIONS ────────────────────────────────────────────── -->
  <div *ngIf="activeTab === 'transactions'" class="tab-content">
    <div class="toolbar">
      <input [(ngModel)]="txSearch" placeholder="Search transactions…" class="search-input" />
      <select [(ngModel)]="txAccountFilter" (change)="loadTransactions()" class="filter-select">
        <option value="">All Accounts</option>
        <option *ngFor="let a of accounts" [value]="a.id">{{ a.accountCode }}</option>
      </select>
      <select [(ngModel)]="txStatusFilter" (change)="loadTransactions()" class="filter-select">
        <option value="">All Statuses</option>
        <option *ngFor="let s of txStatuses" [value]="s">{{ s }}</option>
      </select>
      <button class="btn-primary" (click)="showCreateTx = !showCreateTx">+ New Transaction</button>
    </div>

    <div *ngIf="showCreateTx" class="form-card">
      <div class="form-title">New Transaction</div>
      <div class="form-grid">
        <div class="form-field"><label>Account *</label>
          <select [(ngModel)]="txForm.bankAccountId">
            <option value="">— select —</option>
            <option *ngFor="let a of accounts" [value]="a.id">{{ a.accountCode }} – {{ a.accountName }}</option>
          </select></div>
        <div class="form-field"><label>Date *</label>
          <input type="date" [(ngModel)]="txForm.transactionDate" /></div>
        <div class="form-field"><label>Type *</label>
          <select [(ngModel)]="txForm.transactionType">
            <option *ngFor="let t of txTypes" [value]="t">{{ t }}</option>
          </select></div>
        <div class="form-field"><label>Amount *</label>
          <input type="number" [(ngModel)]="txForm.amount" placeholder="Positive = deposit, Negative = withdrawal" /></div>
        <div class="form-field col-span-2"><label>Description *</label>
          <input [(ngModel)]="txForm.description" /></div>
        <div class="form-field"><label>Reference</label>
          <input [(ngModel)]="txForm.reference" placeholder="Cheque #, wire ref…" /></div>
        <div class="form-field"><label>Counterparty</label>
          <input [(ngModel)]="txForm.counterpartyName" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createTransaction()"
          [disabled]="!txForm.bankAccountId || !txForm.amount || !txForm.description">Create</button>
        <button class="btn-secondary" (click)="showCreateTx = false">Cancel</button>
      </div>
    </div>

    <div class="list-panel">
      <div *ngFor="let t of filteredTransactions" class="list-row"
        [class.active]="selectedTx?.id === t.id" (click)="selectedTx = t">
        <div class="row-icon">{{ t.amount >= 0 ? '⬆️' : '⬇️' }}</div>
        <div class="row-body">
          <strong>{{ t.transactionNumber }}</strong> — {{ t.description }}
          <div class="row-meta">{{ t.transactionDate | date:'mediumDate' }} · {{ t.transactionType }} · <span [class]="statusClass(t.transactionStatus)">{{ t.transactionStatus }}</span></div>
        </div>
        <div class="row-amounts" [class.positive]="t.amount >= 0" [class.negative]="t.amount < 0">
          {{ t.amount | number:'1.2-2' }}
        </div>
      </div>
      <div *ngIf="!filteredTransactions.length" class="empty">No transactions found.</div>
    </div>

    <div *ngIf="selectedTx" class="detail-panel">
      <div class="detail-title">{{ selectedTx.transactionNumber }}</div>
      <div class="detail-badge" [class]="statusClass(selectedTx.transactionStatus)">{{ selectedTx.transactionStatus }}</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Date</span><span>{{ selectedTx.transactionDate | date:'mediumDate' }}</span></div>
        <div class="info-item"><span class="info-label">Type</span><span>{{ selectedTx.transactionType }}</span></div>
        <div class="info-item"><span class="info-label">Amount</span>
          <span [class.positive]="selectedTx.amount >= 0" [class.negative]="selectedTx.amount < 0">{{ selectedTx.amount | number:'1.2-2' }}</span></div>
        <div class="info-item"><span class="info-label">Reference</span><span>{{ selectedTx.reference || '—' }}</span></div>
        <div class="info-item"><span class="info-label">Counterparty</span><span>{{ selectedTx.counterpartyName || '—' }}</span></div>
        <div class="info-item"><span class="info-label">Posted By</span><span>{{ selectedTx.postedBy || '—' }}</span></div>
        <div class="info-item"><span class="info-label">Posted At</span><span>{{ (selectedTx.postedAt | date:'medium') || '—' }}</span></div>
      </div>
      <div class="action-row mt" *ngIf="selectedTx.transactionStatus === 'Draft'">
        <button class="btn-success" (click)="postTransaction(selectedTx)">Post</button>
        <button class="btn-danger" (click)="voidTransaction(selectedTx)">Void</button>
      </div>
      <div class="action-row mt" *ngIf="selectedTx.transactionStatus === 'Posted'">
        <button class="btn-danger" (click)="voidTransaction(selectedTx)">Void</button>
      </div>
    </div>
  </div>

  <!-- ── RECONCILIATION ─────────────────────────────────────────── -->
  <div *ngIf="activeTab === 'reconciliation'" class="tab-content">
    <div class="toolbar">
      <select [(ngModel)]="reconAccountFilter" (change)="loadReconciliations()" class="filter-select">
        <option value="">All Accounts</option>
        <option *ngFor="let a of accounts" [value]="a.id">{{ a.accountCode }}</option>
      </select>
      <button class="btn-primary" (click)="showCreateRecon = !showCreateRecon">+ New Reconciliation</button>
    </div>

    <div *ngIf="showCreateRecon" class="form-card">
      <div class="form-title">New Bank Reconciliation</div>
      <div class="form-grid">
        <div class="form-field"><label>Account *</label>
          <select [(ngModel)]="reconForm.bankAccountId">
            <option value="">— select —</option>
            <option *ngFor="let a of accounts" [value]="a.id">{{ a.accountCode }} – {{ a.accountName }}</option>
          </select></div>
        <div class="form-field"><label>Statement Start *</label>
          <input type="date" [(ngModel)]="reconForm.statementStartDate" /></div>
        <div class="form-field"><label>Statement End *</label>
          <input type="date" [(ngModel)]="reconForm.statementEndDate" /></div>
        <div class="form-field"><label>Opening Balance *</label>
          <input type="number" [(ngModel)]="reconForm.statementOpeningBalance" /></div>
        <div class="form-field"><label>Closing Balance *</label>
          <input type="number" [(ngModel)]="reconForm.statementClosingBalance" /></div>
        <div class="form-field"><label>Notes</label>
          <input [(ngModel)]="reconForm.notes" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createReconciliation()"
          [disabled]="!reconForm.bankAccountId">Start</button>
        <button class="btn-secondary" (click)="showCreateRecon = false">Cancel</button>
      </div>
    </div>

    <div class="list-panel">
      <div *ngFor="let r of reconciliations" class="list-row"
        [class.active]="selectedRecon?.id === r.id" (click)="selectReconciliation(r.id)">
        <div class="row-icon">🔍</div>
        <div class="row-body">
          <strong>{{ r.reconciliationNumber }}</strong> — {{ r.accountName }}
          <div class="row-meta">{{ r.statementStartDate | date:'mediumDate' }} → {{ r.statementEndDate | date:'mediumDate' }} · <span [class]="statusClass(r.status)">{{ r.status }}</span></div>
        </div>
        <div class="row-amounts" [class.negative]="r.difference !== 0">
          Diff: {{ r.difference | number:'1.2-2' }}
        </div>
      </div>
      <div *ngIf="!reconciliations.length" class="empty">No reconciliations found.</div>
    </div>

    <div *ngIf="selectedRecon" class="detail-panel">
      <div class="detail-title">{{ selectedRecon.reconciliationNumber }}</div>
      <div class="detail-badge" [class]="statusClass(selectedRecon.status)">{{ selectedRecon.status }}</div>

      <div class="info-grid">
        <div class="info-item"><span class="info-label">Statement Open</span><span>{{ selectedRecon.statementOpeningBalance | number:'1.2-2' }}</span></div>
        <div class="info-item"><span class="info-label">Statement Close</span><span>{{ selectedRecon.statementClosingBalance | number:'1.2-2' }}</span></div>
        <div class="info-item"><span class="info-label">System Open</span><span>{{ selectedRecon.systemOpeningBalance | number:'1.2-2' }}</span></div>
        <div class="info-item"><span class="info-label">Reconciled</span><span>{{ selectedRecon.reconciledAmount | number:'1.2-2' }}</span></div>
        <div class="info-item"><span class="info-label">Difference</span>
          <span [class.negative]="selectedRecon.difference !== 0" [class.positive]="selectedRecon.difference === 0">
            {{ selectedRecon.difference | number:'1.2-2' }}
          </span></div>
      </div>

      <div *ngIf="selectedRecon.status === 'InProgress'" class="sub-section">
        <div class="sub-section-title">Transactions to Match</div>
        <div *ngFor="let t of unreconciled" class="list-row small-row">
          <input type="checkbox" [checked]="reconChecked[t.id]"
            (change)="toggleReconcile(t, $any($event.target).checked)" />
          <div class="row-body">
            <span>{{ t.transactionNumber }} — {{ t.description }}</span>
            <div class="row-meta">{{ t.transactionDate | date:'mediumDate' }} · {{ t.transactionType }}</div>
          </div>
          <div class="row-amounts" [class.positive]="t.amount >= 0" [class.negative]="t.amount < 0">
            {{ t.amount | number:'1.2-2' }}
          </div>
        </div>
        <div *ngIf="!unreconciled.length" class="empty">No unreconciled posted transactions for this account.</div>
      </div>

      <div class="action-row mt" *ngIf="selectedRecon.status === 'InProgress'">
        <button class="btn-success" (click)="completeReconciliation(selectedRecon)"
          [disabled]="selectedRecon.difference !== 0">Complete (Diff = 0)</button>
        <button class="btn-danger" (click)="cancelReconciliation(selectedRecon)">Cancel</button>
      </div>
    </div>
  </div>

  <!-- ── CASH JOURNALS ──────────────────────────────────────────── -->
  <div *ngIf="activeTab === 'journals'" class="tab-content">
    <div class="toolbar">
      <input [(ngModel)]="jnlSearch" placeholder="Search journals…" class="search-input" />
      <select [(ngModel)]="jnlStatusFilter" (change)="loadJournals()" class="filter-select">
        <option value="">All Statuses</option>
        <option value="Draft">Draft</option>
        <option value="Posted">Posted</option>
        <option value="Voided">Voided</option>
      </select>
      <button class="btn-primary" (click)="showCreateJnl = !showCreateJnl">+ New Journal</button>
    </div>

    <div *ngIf="showCreateJnl" class="form-card">
      <div class="form-title">New Cash Journal</div>
      <div class="form-grid">
        <div class="form-field"><label>Account *</label>
          <select [(ngModel)]="jnlForm.bankAccountId">
            <option value="">— select —</option>
            <option *ngFor="let a of accounts" [value]="a.id">{{ a.accountCode }} ({{ a.accountType }})</option>
          </select></div>
        <div class="form-field"><label>Date *</label>
          <input type="date" [(ngModel)]="jnlForm.journalDate" /></div>
        <div class="form-field col-span-2"><label>Description *</label>
          <input [(ngModel)]="jnlForm.description" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createJournal()"
          [disabled]="!jnlForm.bankAccountId || !jnlForm.description">Create</button>
        <button class="btn-secondary" (click)="showCreateJnl = false">Cancel</button>
      </div>
    </div>

    <div class="list-panel">
      <div *ngFor="let j of filteredJournals" class="list-row"
        [class.active]="selectedJnl?.id === j.id" (click)="selectJournal(j.id)">
        <div class="row-icon">📔</div>
        <div class="row-body">
          <strong>{{ j.journalNumber }}</strong> — {{ j.description }}
          <div class="row-meta">{{ j.journalDate | date:'mediumDate' }} · <span [class]="statusClass(j.status)">{{ j.status }}</span></div>
        </div>
        <div class="row-amounts">Dr {{ j.totalDebits | number:'1.2-2' }} / Cr {{ j.totalCredits | number:'1.2-2' }}</div>
      </div>
      <div *ngIf="!filteredJournals.length" class="empty">No cash journals found.</div>
    </div>

    <div *ngIf="selectedJnl" class="detail-panel">
      <div class="detail-title">{{ selectedJnl.journalNumber }}</div>
      <div class="detail-badge" [class]="statusClass(selectedJnl.status)">{{ selectedJnl.status }}</div>

      <div class="info-grid">
        <div class="info-item"><span class="info-label">Account</span><span>{{ selectedJnl.accountName }}</span></div>
        <div class="info-item"><span class="info-label">Date</span><span>{{ selectedJnl.journalDate | date:'mediumDate' }}</span></div>
        <div class="info-item"><span class="info-label">Total Debits</span><span>{{ selectedJnl.totalDebits | number:'1.2-2' }}</span></div>
        <div class="info-item"><span class="info-label">Total Credits</span><span>{{ selectedJnl.totalCredits | number:'1.2-2' }}</span></div>
        <div class="info-item"><span class="info-label">Balance</span>
          <span [class.negative]="selectedJnl.totalDebits !== selectedJnl.totalCredits">
            {{ (selectedJnl.totalDebits - selectedJnl.totalCredits) | number:'1.2-2' }}
            {{ selectedJnl.totalDebits === selectedJnl.totalCredits ? '✅' : '⚠️' }}
          </span></div>
      </div>

      <div class="sub-section">
        <div class="sub-section-title">Journal Lines</div>
        <table class="data-table" *ngIf="selectedJnl.lines?.length">
          <thead><tr><th>GL Account</th><th>Description</th><th>Debit</th><th>Credit</th><th *ngIf="selectedJnl.status === 'Draft'"></th></tr></thead>
          <tbody>
            <tr *ngFor="let l of selectedJnl.lines">
              <td>{{ l.glAccountId | slice:0:8 }}…</td>
              <td>{{ l.description }}</td>
              <td class="amount">{{ l.debit | number:'1.2-2' }}</td>
              <td class="amount">{{ l.credit | number:'1.2-2' }}</td>
              <td *ngIf="selectedJnl.status === 'Draft'">
                <button class="btn-sm-danger" (click)="removeJournalLine(selectedJnl, l)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="!selectedJnl.lines?.length" class="empty">No lines yet.</div>

        <div *ngIf="selectedJnl.status === 'Draft'" class="add-line-form">
          <input [(ngModel)]="lineForm.description" placeholder="Description" class="line-input" />
          <input type="number" [(ngModel)]="lineForm.debit" placeholder="Debit" class="line-input-sm" />
          <input type="number" [(ngModel)]="lineForm.credit" placeholder="Credit" class="line-input-sm" />
          <input [(ngModel)]="lineForm.reference" placeholder="Reference" class="line-input" />
          <button class="btn-secondary" (click)="addJournalLine(selectedJnl)">+ Add Line</button>
        </div>
      </div>

      <div class="action-row mt" *ngIf="selectedJnl.status === 'Draft'">
        <button class="btn-success" (click)="postJournal(selectedJnl)"
          [disabled]="selectedJnl.totalDebits !== selectedJnl.totalCredits || !selectedJnl.lines?.length">
          Post Journal
        </button>
        <button class="btn-danger" (click)="voidJournal(selectedJnl)">Delete Draft</button>
      </div>
      <div class="action-row mt" *ngIf="selectedJnl.status === 'Posted'">
        <button class="btn-danger" (click)="voidJournal(selectedJnl)">Void</button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .module-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .module-header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; }
    .tab-bar { display: flex; gap: 4px; border-bottom: 2px solid var(--border); margin-bottom: 20px; }
    .tab-btn { padding: 8px 18px; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; color: var(--text-secondary); }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
    .tab-content { display: flex; flex-direction: column; gap: 16px; }
    .toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 200px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text); }
    .filter-select { padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text); }
    .form-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 20px; }
    .form-title { font-weight: 600; font-size: 1rem; margin-bottom: 14px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .col-span-2 { grid-column: span 2; }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field label { font-size: 0.78rem; color: var(--text-secondary); }
    .form-field input, .form-field select { padding: 7px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--text); }
    .form-actions { display: flex; gap: 10px; }
    .list-panel { display: flex; flex-direction: column; gap: 6px; max-height: 400px; overflow-y: auto; }
    .list-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: background 0.15s; background: var(--surface); }
    .list-row:hover, .list-row.active { background: var(--primary-light, #e8f0fe); border-color: var(--primary); }
    .small-row { padding: 6px 10px; }
    .row-icon { font-size: 1.3rem; }
    .row-body { flex: 1; }
    .row-body strong { font-size: 0.9rem; }
    .row-meta { font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px; }
    .row-amounts { font-size: 0.9rem; font-weight: 600; white-space: nowrap; }
    .empty { color: var(--text-secondary); font-style: italic; padding: 20px; text-align: center; }
    .detail-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 20px; }
    .detail-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; }
    .detail-badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 0.78rem; font-weight: 600; margin-bottom: 14px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-bottom: 12px; }
    .info-item { display: flex; flex-direction: column; gap: 2px; }
    .info-label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .action-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .mt { margin-top: 12px; }
    .sub-section { margin-top: 16px; }
    .sub-section-title { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .data-table th, .data-table td { padding: 7px 10px; border-bottom: 1px solid var(--border); text-align: left; }
    .data-table th { font-weight: 600; color: var(--text-secondary); font-size: 0.8rem; }
    .data-table td.amount { text-align: right; font-variant-numeric: tabular-nums; }
    .add-line-form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 10px; }
    .line-input { flex: 1; min-width: 150px; padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--text); }
    .line-input-sm { width: 100px; padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--text); }
    .btn-primary { padding: 8px 18px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .btn-secondary { padding: 8px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; color: var(--text); }
    .btn-success { padding: 8px 18px; background: #16a34a; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .btn-danger { padding: 8px 18px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .btn-sm-danger { padding: 3px 8px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .btn-primary:disabled, .btn-success:disabled { opacity: 0.5; cursor: not-allowed; }
    .positive { color: #16a34a; }
    .negative { color: #dc2626; }
    .amount { font-variant-numeric: tabular-nums; }
    .status-active, .status-completed, .status-posted { background: #dcfce7; color: #166534; }
    .status-inactive, .status-voided, .status-cancelled { background: #f3f4f6; color: #6b7280; }
    .status-frozen, .status-pending, .status-draft, .status-inprogress { background: #fef9c3; color: #854d0e; }
  `]
})
export class CashBankComponent implements OnInit {
  activeTab: Tab = 'accounts';
  tabs = [
    { id: 'accounts'       as Tab, label: '🏦 Accounts' },
    { id: 'transactions'   as Tab, label: '💸 Transactions' },
    { id: 'reconciliation' as Tab, label: '🔍 Reconciliation' },
    { id: 'journals'       as Tab, label: '📔 Cash Journals' },
  ];

  // ── Accounts ──────────────────────────────────────────────────────────────
  accounts: any[] = [];
  selectedAcct: any = null;
  acctSearch = '';
  showCreateAcct = false;
  acctTypes = ['Checking','Savings','CreditCard','PettyCash','Other'];
  currencies: any[] = [];
  acctForm: any = { accountCode:'', accountName:'', accountType:'Checking', currency:'USD',
    bankName:'', bankBranch:'', routingNumber:'', accountNumber:'', iban:'', swiftCode:'' };

  get filteredAccounts() {
    const q = this.acctSearch.toLowerCase();
    return this.accounts.filter(a =>
      a.accountCode.toLowerCase().includes(q) || a.accountName.toLowerCase().includes(q));
  }

  // ── Transactions ──────────────────────────────────────────────────────────
  transactions: any[] = [];
  selectedTx: any = null;
  txSearch = '';
  txAccountFilter = '';
  txStatusFilter = '';
  showCreateTx = false;
  txTypes = ['Deposit','Withdrawal','Transfer','BankFee','Interest','ARReceipt','APPayment','Other'];
  txStatuses = ['Draft','Posted','Voided','Reconciled'];
  txForm: any = { bankAccountId:'', transactionDate: new Date().toISOString().slice(0,10),
    transactionType:'Deposit', amount: 0, description:'', reference:'', counterpartyName:'' };

  get filteredTransactions() {
    const q = this.txSearch.toLowerCase();
    return this.transactions.filter(t =>
      t.transactionNumber.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.counterpartyName || '').toLowerCase().includes(q));
  }

  // ── Reconciliation ────────────────────────────────────────────────────────
  reconciliations: any[] = [];
  selectedRecon: any = null;
  reconAccountFilter = '';
  showCreateRecon = false;
  unreconciled: any[] = [];
  reconChecked: Record<string, boolean> = {};
  reconForm: any = { bankAccountId:'', statementStartDate:'', statementEndDate:'',
    statementOpeningBalance: 0, statementClosingBalance: 0, notes:'' };

  // ── Cash Journals ─────────────────────────────────────────────────────────
  journals: any[] = [];
  selectedJnl: any = null;
  jnlSearch = '';
  jnlStatusFilter = '';
  showCreateJnl = false;
  jnlForm: any = { bankAccountId:'', journalDate: new Date().toISOString().slice(0,10), description:'' };
  lineForm: any = { glAccountId:'', description:'', debit: 0, credit: 0, reference:'' };
  glAccounts: any[] = [];

  get filteredJournals() {
    const q = this.jnlSearch.toLowerCase();
    return this.journals.filter(j =>
      j.journalNumber.toLowerCase().includes(q) || j.description.toLowerCase().includes(q));
  }

  constructor(private api: ApiService, private orgService: OrgService) {}

  ngOnInit() {
    this.loadAccounts();
    this.api.getCurrencies().subscribe({ next: r => this.currencies = r, error: () => {} });
    this.api.getAccounts().subscribe({ next: r => this.glAccounts = r, error: () => {} });
  }

  setTab(t: Tab) {
    this.activeTab = t;
    if (t === 'transactions' && !this.transactions.length) this.loadTransactions();
    if (t === 'reconciliation' && !this.reconciliations.length) this.loadReconciliations();
    if (t === 'journals' && !this.journals.length) this.loadJournals();
  }

  // ── Account methods ───────────────────────────────────────────────────────
  loadAccounts() {
    this.api.getBankAccounts().subscribe({ next: r => this.accounts = r, error: () => {} });
  }

  selectAccount(a: any) {
    this.selectedAcct = a;
  }

  createAccount() {
    this.api.createBankAccount(this.acctForm).subscribe({
      next: r => {
        this.accounts.unshift(r);
        this.selectedAcct = r;
        this.showCreateAcct = false;
        this.acctForm = { accountCode:'', accountName:'', accountType:'Checking', currency:'USD',
          bankName:'', bankBranch:'', routingNumber:'', accountNumber:'', iban:'', swiftCode:'' };
      },
      error: (err: any) => alert(err.error?.error || 'Failed to create account')
    });
  }

  toggleAcctStatus(a: any, activate: boolean) {
    const call = activate ? this.api.activateBankAccount(a.id) : this.api.deactivateBankAccount(a.id);
    call.subscribe({ next: () => this.loadAccounts(), error: () => {} });
  }

  filterTxByAccount(a: any) {
    this.txAccountFilter = a.id;
    this.setTab('transactions');
    this.loadTransactions();
  }

  startReconciliation(a: any) {
    this.reconForm.bankAccountId = a.id;
    this.showCreateRecon = true;
    this.setTab('reconciliation');
  }

  // ── Transaction methods ───────────────────────────────────────────────────
  loadTransactions() {
    this.api.getBankTransactions(this.txAccountFilter || undefined, this.txStatusFilter || undefined)
      .subscribe({ next: r => this.transactions = r, error: () => {} });
  }

  createTransaction() {
    this.api.createBankTransaction(this.txForm).subscribe({
      next: r => {
        this.transactions.unshift(r);
        this.selectedTx = r;
        this.showCreateTx = false;
      },
      error: (err: any) => alert(err.error?.error || 'Failed to create transaction')
    });
  }

  postTransaction(t: any) {
    const user = this.orgService.activeOrg()?.name || 'System';
    this.api.postBankTransaction(t.id, { postedBy: user }).subscribe({
      next: r => { Object.assign(t, r); this.selectedTx = r; this.loadAccounts(); },
      error: (err: any) => alert(err.error?.error || 'Failed to post')
    });
  }

  voidTransaction(t: any) {
    if (!confirm('Void this transaction?')) return;
    this.api.voidBankTransaction(t.id).subscribe({
      next: () => { this.loadTransactions(); this.selectedTx = null; this.loadAccounts(); },
      error: (err: any) => alert(err.error?.error || 'Failed to void')
    });
  }

  // ── Reconciliation methods ────────────────────────────────────────────────
  loadReconciliations() {
    this.api.getReconciliations(this.reconAccountFilter || undefined)
      .subscribe({ next: r => this.reconciliations = r, error: () => {} });
  }

  createReconciliation() {
    this.api.createReconciliation(this.reconForm).subscribe({
      next: r => {
        this.reconciliations.unshift(r);
        this.selectReconciliation(r.id);
        this.showCreateRecon = false;
      },
      error: (err: any) => alert(err.error?.error || 'Failed to create reconciliation')
    });
  }

  selectReconciliation(id: string) {
    this.api.getReconciliation(id).subscribe({
      next: r => {
        this.selectedRecon = r;
        if (r.status === 'InProgress') this.loadUnreconciled(r.bankAccountId);
      },
      error: () => {}
    });
  }

  loadUnreconciled(bankAccountId: string) {
    this.api.getBankTransactions(bankAccountId, 'Posted').subscribe({
      next: r => { this.unreconciled = r; this.reconChecked = {}; },
      error: () => {}
    });
  }

  toggleReconcile(t: any, checked: boolean) {
    this.reconChecked[t.id] = checked;
    this.api.reconcileTransaction(this.selectedRecon.id,
      { transactionId: t.id, isReconciled: checked }).subscribe({
      next: r => this.selectedRecon = r,
      error: (err: any) => alert(err.error?.error || 'Failed to reconcile')
    });
  }

  completeReconciliation(r: any) {
    const user = this.orgService.activeOrg()?.name || 'System';
    this.api.completeReconciliation(r.id, { completedBy: user }).subscribe({
      next: res => { this.selectedRecon = res; this.loadReconciliations(); this.loadAccounts(); },
      error: (err: any) => alert(err.error?.error || 'Failed to complete')
    });
  }

  cancelReconciliation(r: any) {
    if (!confirm('Cancel this reconciliation?')) return;
    this.api.cancelReconciliation(r.id).subscribe({
      next: () => { this.selectedRecon = null; this.loadReconciliations(); },
      error: () => {}
    });
  }

  // ── Cash Journal methods ──────────────────────────────────────────────────
  loadJournals() {
    this.api.getCashJournals(undefined, this.jnlStatusFilter || undefined)
      .subscribe({ next: r => this.journals = r, error: () => {} });
  }

  createJournal() {
    this.api.createCashJournal(this.jnlForm).subscribe({
      next: r => {
        this.journals.unshift(r);
        this.selectedJnl = r;
        this.showCreateJnl = false;
      },
      error: (err: any) => alert(err.error?.error || 'Failed to create journal')
    });
  }

  selectJournal(id: string) {
    this.api.getCashJournal(id).subscribe({
      next: r => this.selectedJnl = r,
      error: () => {}
    });
  }

  addJournalLine(j: any) {
    if (!this.lineForm.description) return;
    const glAcct = this.glAccounts[0]; // default first GL account if none picked
    const payload = {
      glAccountId: this.lineForm.glAccountId || (glAcct?.id ?? '00000000-0000-0000-0000-000000000000'),
      description: this.lineForm.description,
      debit: this.lineForm.debit || 0,
      credit: this.lineForm.credit || 0,
      reference: this.lineForm.reference || null
    };
    this.api.addCashJournalLine(j.id, payload).subscribe({
      next: r => { this.selectedJnl = r; this.lineForm = { glAccountId:'', description:'', debit:0, credit:0, reference:'' }; },
      error: (err: any) => alert(err.error?.error || 'Failed to add line')
    });
  }

  removeJournalLine(j: any, l: any) {
    this.api.removeCashJournalLine(j.id, l.id).subscribe({
      next: () => this.selectJournal(j.id),
      error: () => {}
    });
  }

  postJournal(j: any) {
    const user = this.orgService.activeOrg()?.name || 'System';
    this.api.postCashJournal(j.id, { postedBy: user }).subscribe({
      next: r => { this.selectedJnl = r; this.loadJournals(); this.loadAccounts(); },
      error: (err: any) => alert(err.error?.error || 'Failed to post journal')
    });
  }

  voidJournal(j: any) {
    if (!confirm('Void this journal?')) return;
    this.api.voidCashJournal(j.id).subscribe({
      next: () => { this.selectedJnl = null; this.loadJournals(); },
      error: (err: any) => alert(err.error?.error || 'Failed to void')
    });
  }

  statusClass(s: string) {
    const map: Record<string, string> = {
      Active: 'status-active', Completed: 'status-completed', Posted: 'status-posted',
      Inactive: 'status-inactive', Voided: 'status-voided', Cancelled: 'status-cancelled',
      Frozen: 'status-frozen', Draft: 'status-draft', InProgress: 'status-inprogress',
    };
    return map[s] ?? 'status-draft';
  }
}
