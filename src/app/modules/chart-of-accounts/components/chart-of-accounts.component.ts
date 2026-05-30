import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Account, AccountType } from '../../../core/models/erp.models';

@Component({
  selector: 'app-chart-of-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="erp-module">
      <div class="module-header">
        <h2>Chart of Accounts</h2>
        <div class="header-actions">
          <select [(ngModel)]="filterType" (ngModelChange)="applyFilter()" class="filter-select">
            <option value="">All Types</option>
            <option *ngFor="let t of accountTypes" [value]="t.code">{{ t.name }}</option>
          </select>
          <button class="btn-primary" (click)="showForm = !showForm">
            {{ showForm ? 'Cancel' : '+ New Account' }}
          </button>
        </div>
      </div>

      <!-- Create Form -->
      <div class="card" *ngIf="showForm">
        <h3>Create Account</h3>
        <form [formGroup]="form" (ngSubmit)="onCreate()">
          <div class="form-grid">
            <div class="form-group">
              <label>Account Number</label>
              <input formControlName="accountNumber" placeholder="e.g. 1150" />
            </div>
            <div class="form-group">
              <label>Account Name</label>
              <input formControlName="name" placeholder="e.g. Bank Account" />
            </div>
            <div class="form-group">
              <label>Account Type</label>
              <select formControlName="accountTypeId">
                <option value="">-- Select --</option>
                <option *ngFor="let t of accountTypes" [value]="t.id">{{ t.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Parent Account (optional)</label>
              <select formControlName="parentAccountId">
                <option value="">-- None --</option>
                <option *ngFor="let a of headerAccounts" [value]="a.id">
                  {{ a.accountNumber }} - {{ a.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <input formControlName="description" placeholder="Optional description" />
            </div>
            <div class="form-group">
              <label>Currency</label>
              <input formControlName="currency" placeholder="USD" />
            </div>
          </div>
          <label class="checkbox-label">
            <input type="checkbox" formControlName="isHeaderAccount" />
            Header account (group / non-posting)
          </label>
          <button type="submit" class="btn-primary" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating...' : 'Create Account' }}
          </button>
        </form>
      </div>

      <!-- Accounts Table -->
      <div class="card">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Account #</th>
              <th>Name</th>
              <th>Type</th>
              <th>Level</th>
              <th>Currency</th>
              <th>Header</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of filteredAccounts" [style.padding-left]="(a.level - 1) * 16 + 'px'">
              <td>
                <span [style.margin-left]="(a.level - 1) * 12 + 'px'">
                  <strong *ngIf="a.isHeaderAccount">{{ a.accountNumber }}</strong>
                  <span *ngIf="!a.isHeaderAccount">{{ a.accountNumber }}</span>
                </span>
              </td>
              <td>{{ a.name }}</td>
              <td><span class="badge badge-type">{{ a.accountTypeName }}</span></td>
              <td>{{ a.level }}</td>
              <td>{{ a.currency }}</td>
              <td>{{ a.isHeaderAccount ? 'Yes' : '' }}</td>
              <td><span class="badge" [class]="'badge-' + a.status.toLowerCase()">{{ a.status }}</span></td>
              <td>
                <button class="btn-sm btn-danger" *ngIf="a.status === 'Active'"
                  (click)="onDeactivate(a.id)">Deactivate</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="!filteredAccounts.length" class="empty-state">No accounts found.</div>
      </div>
    </div>
  `,
  styles: [`
    .erp-module { padding:1.5rem; }
    .module-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .module-header h2 { margin:0; font-size:1.4rem; color:#1e293b; }
    .header-actions { display:flex; gap:.75rem; align-items:center; }
    .filter-select { border:1px solid #d1d5db; border-radius:4px; padding:.4rem .75rem; font-size:.875rem; }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:1.5rem; margin-bottom:1.5rem; }
    .card h3 { margin:0 0 1rem; }
    .form-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1rem; }
    .form-group { display:flex; flex-direction:column; gap:.3rem; }
    .form-group label { font-size:.75rem; font-weight:600; color:#6b7280; text-transform:uppercase; }
    .form-group input, .form-group select { border:1px solid #d1d5db; border-radius:4px; padding:.5rem .75rem; font-size:.875rem; }
    .checkbox-label { display:flex; align-items:center; gap:.5rem; margin-bottom:1rem; font-size:.875rem; }
    .erp-table { width:100%; border-collapse:collapse; font-size:.875rem; }
    .erp-table th { background:#f8fafc; padding:.6rem 1rem; text-align:left; font-size:.72rem; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e2e8f0; }
    .erp-table td { padding:.6rem 1rem; border-bottom:1px solid #f1f5f9; }
    .erp-table tr:hover td { background:#f8fafc; }
    .badge { padding:.2rem .6rem; border-radius:9999px; font-size:.7rem; font-weight:600; }
    .badge-active { background:#dcfce7; color:#166534; }
    .badge-inactive { background:#f1f5f9; color:#6b7280; }
    .badge-type { background:#dbeafe; color:#1e40af; }
    .btn-primary { background:#3b82f6; color:#fff; border:none; padding:.5rem 1.25rem; border-radius:4px; cursor:pointer; font-size:.875rem; }
    .btn-primary:hover { background:#2563eb; }
    .btn-sm { border:1px solid #e2e8f0; border-radius:4px; padding:.25rem .75rem; font-size:.8rem; cursor:pointer; background:#f1f5f9; }
    .btn-danger { background:#fee2e2; border-color:#fca5a5; color:#991b1b; }
    .empty-state { text-align:center; color:#9ca3af; padding:2rem; }
  `]
})
export class ChartOfAccountsComponent implements OnInit {
  accounts: Account[] = [];
  filteredAccounts: Account[] = [];
  accountTypes: AccountType[] = [];
  headerAccounts: Account[] = [];
  filterType = '';
  showForm = false;
  loading = false;
  form: FormGroup;

  constructor(private api: ApiService, private fb: FormBuilder) {
    this.form = this.fb.group({
      accountNumber: ['', Validators.required],
      name: ['', Validators.required],
      accountTypeId: ['', Validators.required],
      isHeaderAccount: [false],
      parentAccountId: [''],
      description: [''],
      currency: ['USD']
    });
  }

  ngOnInit() {
    this.api.getAccountTypes().subscribe(t => this.accountTypes = t);
    this.load();
  }

  load() {
    this.api.getAccounts().subscribe(accounts => {
      this.accounts = accounts;
      this.headerAccounts = accounts.filter(a => a.isHeaderAccount);
      this.applyFilter();
    });
  }

  applyFilter() {
    if (!this.filterType) {
      this.filteredAccounts = this.accounts;
    } else {
      const type = this.accountTypes.find(t => t.code === this.filterType);
      this.filteredAccounts = this.accounts.filter(a => a.accountTypeId === type?.id);
    }
  }

  onCreate() {
    if (this.form.invalid) return;
    this.loading = true;
    const val = this.form.value;
    if (!val.parentAccountId) delete val.parentAccountId;
    this.api.createAccount(val).subscribe({
      next: () => { this.load(); this.showForm = false; this.loading = false; this.form.reset({ currency: 'USD', isHeaderAccount: false }); },
      error: () => this.loading = false
    });
  }

  onDeactivate(id: string) {
    if (!confirm('Deactivate this account?')) return;
    this.api.deactivateAccount(id).subscribe(() => this.load());
  }
}
