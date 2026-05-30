import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { FiscalYear, FiscalPeriod } from '../../../core/models/erp.models';

@Component({
  selector: 'app-fiscal-calendar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="erp-module">
      <div class="module-header">
        <h2>Fiscal Calendar</h2>
        <button class="btn-primary" (click)="showForm = !showForm">
          {{ showForm ? 'Cancel' : '+ New Fiscal Year' }}
        </button>
      </div>

      <!-- Create Form -->
      <div class="card" *ngIf="showForm">
        <h3>Create Fiscal Year</h3>
        <form [formGroup]="form" (ngSubmit)="onCreate()">
          <div class="form-grid">
            <div class="form-group">
              <label>Name (e.g. FY2026)</label>
              <input formControlName="name" placeholder="FY2026" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <input formControlName="description" placeholder="Fiscal Year 2026" />
            </div>
            <div class="form-group">
              <label>Start Date</label>
              <input type="date" formControlName="startDate" />
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input type="date" formControlName="endDate" />
            </div>
          </div>
          <label class="checkbox-label">
            <input type="checkbox" formControlName="autoGeneratePeriods" />
            Auto-generate 12 monthly periods
          </label>
          <button type="submit" class="btn-primary" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating...' : 'Create Fiscal Year' }}
          </button>
        </form>
      </div>

      <!-- Fiscal Year List -->
      <div class="card">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Start</th>
              <th>End</th>
              <th>Periods</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let fy of fiscalYears" [class.selected]="selectedFY?.id === fy.id">
              <td><strong>{{ fy.name }}</strong></td>
              <td>{{ fy.startDate | date:'mediumDate' }}</td>
              <td>{{ fy.endDate | date:'mediumDate' }}</td>
              <td>{{ fy.periodCount }}</td>
              <td><span class="badge" [class]="'badge-' + fy.status.toLowerCase()">{{ fy.status }}</span></td>
              <td>
                <button class="btn-sm" (click)="loadPeriods(fy)">Periods</button>
                <button class="btn-sm btn-danger" *ngIf="fy.status === 'Open'"
                  (click)="onClose(fy.id)">Close</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="!fiscalYears.length" class="empty-state">No fiscal years configured yet.</div>
      </div>

      <!-- Period Detail -->
      <div class="card" *ngIf="selectedFY && periods.length">
        <h3>{{ selectedFY.name }} — Periods</h3>
        <table class="erp-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of periods">
              <td>{{ p.periodNumber }}</td>
              <td>{{ p.name }}</td>
              <td>{{ p.startDate | date:'mediumDate' }}</td>
              <td>{{ p.endDate | date:'mediumDate' }}</td>
              <td><span class="badge" [class]="'badge-' + p.status.toLowerCase()">{{ p.status }}</span></td>
              <td>
                <button class="btn-sm btn-danger" *ngIf="p.status === 'Open'"
                  (click)="onClosePeriod(p.id)">Close</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .erp-module { padding: 1.5rem; }
    .module-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .module-header h2 { margin:0; font-size:1.4rem; color:#1e293b; }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:1.5rem; margin-bottom:1.5rem; }
    .card h3 { margin:0 0 1rem; font-size:1rem; color:#374151; }
    .form-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:1rem; margin-bottom:1rem; }
    .form-group { display:flex; flex-direction:column; gap:.3rem; }
    .form-group label { font-size:.8rem; font-weight:600; color:#6b7280; text-transform:uppercase; }
    .form-group input { border:1px solid #d1d5db; border-radius:4px; padding:.5rem .75rem; font-size:.9rem; }
    .checkbox-label { display:flex; align-items:center; gap:.5rem; margin-bottom:1rem; font-size:.9rem; }
    .erp-table { width:100%; border-collapse:collapse; font-size:.875rem; }
    .erp-table th { background:#f8fafc; padding:.6rem 1rem; text-align:left; font-size:.75rem; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e2e8f0; }
    .erp-table td { padding:.65rem 1rem; border-bottom:1px solid #f1f5f9; }
    .erp-table tr:hover td { background:#f8fafc; }
    .erp-table tr.selected td { background:#eff6ff; }
    .badge { padding:.2rem .6rem; border-radius:9999px; font-size:.7rem; font-weight:600; }
    .badge-open { background:#dcfce7; color:#166534; }
    .badge-closed { background:#fee2e2; color:#991b1b; }
    .badge-onhold { background:#fef3c7; color:#92400e; }
    .btn-primary { background:#3b82f6; color:#fff; border:none; padding:.5rem 1.25rem; border-radius:4px; cursor:pointer; font-size:.875rem; }
    .btn-primary:hover { background:#2563eb; }
    .btn-primary:disabled { background:#9ca3af; cursor:not-allowed; }
    .btn-sm { background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:.25rem .75rem; font-size:.8rem; cursor:pointer; margin-right:.25rem; }
    .btn-sm:hover { background:#e2e8f0; }
    .btn-danger { background:#fee2e2; border-color:#fca5a5; color:#991b1b; }
    .btn-danger:hover { background:#fecaca; }
    .empty-state { text-align:center; color:#9ca3af; padding:2rem; font-size:.9rem; }
  `]
})
export class FiscalCalendarComponent implements OnInit {
  fiscalYears: FiscalYear[] = [];
  periods: FiscalPeriod[] = [];
  selectedFY: FiscalYear | null = null;
  showForm = false;
  loading = false;

  form: FormGroup;

  constructor(private api: ApiService, private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      calendarType: ['Gregorian'],
      autoGeneratePeriods: [true]
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.api.getFiscalYears().subscribe(years => this.fiscalYears = years);
  }

  loadPeriods(fy: FiscalYear) {
    this.selectedFY = fy;
    this.api.getPeriods(fy.id).subscribe(p => this.periods = p);
  }

  onCreate() {
    if (this.form.invalid) return;
    this.loading = true;
    this.api.createFiscalYear(this.form.value).subscribe({
      next: () => { this.load(); this.showForm = false; this.loading = false; this.form.reset({ calendarType: 'Gregorian', autoGeneratePeriods: true }); },
      error: () => this.loading = false
    });
  }

  onClose(id: string) {
    if (!confirm('Close this fiscal year? This cannot be undone.')) return;
    this.api.closeFiscalYear(id).subscribe(() => this.load());
  }

  onClosePeriod(id: string) {
    if (!confirm('Close this period?')) return;
    this.api.closePeriod(id).subscribe(() => this.loadPeriods(this.selectedFY!));
  }
}
