import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-expense-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1 class="page-title">Expense Management</h1>
      <p class="page-subtitle">Submit, review, and approve employee expense reports</p>
    </div>
    <button class="btn btn-primary" (click)="openNewReport()">+ New Expense Report</button>
  </div>

  <!-- Summary Cards -->
  <div class="stats-grid" style="grid-template-columns:repeat(5,1fr)">
    <div class="stat-card">
      <div class="stat-label">Total Reports</div>
      <div class="stat-value">{{ reports.length }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Draft</div>
      <div class="stat-value text-muted">{{ countByStatus('Draft') }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pending Approval</div>
      <div class="stat-value text-warning">{{ countByStatus('Submitted') + countByStatus('UnderReview') }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Approved</div>
      <div class="stat-value text-success">{{ countByStatus('Approved') }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Value</div>
      <div class="stat-value">{{ totalValue() | currency }}</div>
    </div>
  </div>

  <!-- Main Panel -->
  <div class="main-layout">
    <!-- Report List (left) -->
    <div class="card list-card">
      <div class="card-header">
        <div class="filter-bar">
          <select [(ngModel)]="statusFilter" (ngModelChange)="loadReports()" class="form-control" style="width:160px">
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="UnderReview">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Paid">Paid</option>
          </select>
          <button class="btn btn-secondary btn-sm" (click)="loadReports()">🔄</button>
        </div>
      </div>
      <div *ngIf="loading" class="loading-state">Loading…</div>
      <div class="report-list" *ngIf="!loading">
        <div *ngFor="let r of reports"
             class="report-item"
             [class.active]="selectedReport?.id === r.id"
             (click)="selectReport(r)">
          <div class="report-item-header">
            <span class="report-number">{{ r.reportNumber }}</span>
            <span class="badge" [ngClass]="statusClass(r.status)">{{ r.status }}</span>
          </div>
          <div class="report-employee">{{ r.employeeName }}</div>
          <div class="report-meta">
            <span>{{ r.purpose }}</span>
            <strong>{{ r.totalAmount | currency }}</strong>
          </div>
          <div class="report-dates">{{ r.periodStart | date:'MMM d' }} – {{ r.periodEnd | date:'MMM d, y' }}</div>
        </div>
        <div *ngIf="reports.length===0" class="empty-state">No expense reports found.</div>
      </div>
    </div>

    <!-- Report Detail (right) -->
    <div class="card detail-card" *ngIf="selectedReport">
      <div class="card-header detail-header">
        <div>
          <h3 style="margin:0;font-size:1.1rem">{{ selectedReport.reportNumber }} — {{ selectedReport.purpose }}</h3>
          <div style="color:var(--text-secondary);font-size:.85rem;margin-top:.25rem">
            {{ selectedReport.employeeName }} · {{ selectedReport.department || 'No Department' }}
          </div>
        </div>
        <div class="detail-actions">
          <span class="badge badge-lg" [ngClass]="statusClass(selectedReport.status)">{{ selectedReport.status }}</span>
          <span class="badge badge-lg" [ngClass]="approvalStatusClass(selectedReport.approvalStatus)">{{ selectedReport.approvalStatus }}</span>
        </div>
      </div>

      <!-- Tab bar inside detail -->
      <div class="tab-bar">
        <button class="tab-btn" [class.active]="detailTab==='info'" (click)="detailTab='info'">📄 Details</button>
        <button class="tab-btn" [class.active]="detailTab==='lines'" (click)="detailTab='lines'">🧾 Lines ({{ selectedReport.lines?.length || 0 }})</button>
        <button class="tab-btn" [class.active]="detailTab==='workflow'" (click)="detailTab='workflow';loadWorkflowForReport()">🔄 Workflow</button>
      </div>

      <!-- Details Tab -->
      <div *ngIf="detailTab==='info'" class="tab-content">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div><span class="info-label">Employee</span><div>{{ selectedReport.employeeName }}</div></div>
          <div><span class="info-label">Email</span><div>{{ selectedReport.employeeEmail || '—' }}</div></div>
          <div><span class="info-label">Department</span><div>{{ selectedReport.department || '—' }}</div></div>
          <div><span class="info-label">Currency</span><div>{{ selectedReport.currency }}</div></div>
          <div><span class="info-label">Period</span><div>{{ selectedReport.periodStart | date:'mediumDate' }} – {{ selectedReport.periodEnd | date:'mediumDate' }}</div></div>
          <div><span class="info-label">Created</span><div>{{ selectedReport.createdAt | date:'short' }}</div></div>
          <div><span class="info-label">Total Amount</span><div><strong>{{ selectedReport.totalAmount | currency }}</strong></div></div>
          <div><span class="info-label">Approved Amount</span><div>{{ selectedReport.approvedAmount | currency }}</div></div>
          <div><span class="info-label">Paid Amount</span><div>{{ selectedReport.paidAmount | currency }}</div></div>
          <div><span class="info-label">Submitted By</span><div>{{ selectedReport.submittedBy || '—' }}</div></div>
          <div *ngIf="selectedReport.rejectedReason"><span class="info-label">Rejection Reason</span><div class="text-danger">{{ selectedReport.rejectedReason }}</div></div>
        </div>

        <!-- Action Buttons -->
        <div class="action-bar" style="margin-top:1.25rem">
          <button class="btn btn-secondary" (click)="editReport()" *ngIf="selectedReport.status==='Draft'">✏️ Edit</button>
          <button class="btn btn-primary" (click)="openSubmitModal()" *ngIf="selectedReport.status==='Draft'">📤 Submit for Approval</button>
          <button class="btn btn-success" (click)="openApproveModal()" *ngIf="selectedReport.status==='Submitted' || selectedReport.status==='UnderReview'">✅ Approve</button>
          <button class="btn btn-danger" (click)="openRejectModal()" *ngIf="selectedReport.status==='Submitted' || selectedReport.status==='UnderReview'">❌ Reject</button>
          <button class="btn btn-secondary" (click)="openPaidModal()" *ngIf="selectedReport.status==='Approved'">💰 Mark Paid</button>
          <button class="btn btn-danger" (click)="deleteReport()" *ngIf="selectedReport.status==='Draft'" style="margin-left:auto">🗑️ Delete</button>
        </div>
      </div>

      <!-- Lines Tab -->
      <div *ngIf="detailTab==='lines'" class="tab-content">
        <div style="display:flex;justify-content:flex-end;margin-bottom:.75rem">
          <button class="btn btn-secondary btn-sm" (click)="openAddLine()" *ngIf="selectedReport.status==='Draft'">+ Add Line</button>
        </div>
        <table class="data-table" *ngIf="selectedReport.lines?.length > 0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Merchant</th>
              <th>Amount</th>
              <th>Receipt</th>
              <th *ngIf="selectedReport.status==='Draft'">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let line of selectedReport.lines">
              <td>{{ line.expenseDate | date:'mediumDate' }}</td>
              <td>{{ line.categoryName }}</td>
              <td>{{ line.description }}</td>
              <td>{{ line.merchant || '—' }}</td>
              <td><strong>{{ line.amount | currency }}</strong></td>
              <td>
                <a *ngIf="line.receiptUrl" [href]="line.receiptUrl" target="_blank" class="btn btn-sm btn-secondary">📎 View</a>
                <span *ngIf="!line.receiptUrl" class="text-muted">No receipt</span>
              </td>
              <td *ngIf="selectedReport.status==='Draft'">
                <button class="btn btn-sm btn-secondary" (click)="openEditLine(line)">✏️</button>
                <button class="btn btn-sm btn-danger" (click)="deleteLine(line.id)" style="margin-left:4px">🗑️</button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align:right;font-weight:600">Total:</td>
              <td><strong>{{ selectedReport.totalAmount | currency }}</strong></td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
        <div *ngIf="!selectedReport.lines || selectedReport.lines.length===0" class="empty-state">
          No expense lines yet. Click "+ Add Line" to add expenses.
        </div>
      </div>

      <!-- Workflow Tab -->
      <div *ngIf="detailTab==='workflow'" class="tab-content">
        <div *ngIf="!workflowInstance && !loadingWorkflow" class="empty-state">
          <p>No workflow instance for this report.</p>
          <p class="text-muted" style="font-size:.85rem">Submit the report to start the approval process.</p>
        </div>
        <div *ngIf="loadingWorkflow" class="loading-state">Loading workflow…</div>
        <div *ngIf="workflowInstance">
          <div style="display:flex;gap:1rem;margin-bottom:1rem;flex-wrap:wrap">
            <div class="info-chip">Status: <strong>{{ workflowInstance.status }}</strong></div>
            <div class="info-chip">Step: <strong>{{ workflowInstance.currentStepIndex + 1 }} / {{ workflowInstance.totalSteps }}</strong></div>
            <div class="info-chip">Submitted by: <strong>{{ workflowInstance.submittedBy }}</strong></div>
            <div *ngIf="workflowInstance.rejectedReason" class="info-chip text-danger">
              Rejected: {{ workflowInstance.rejectedReason }}
            </div>
          </div>
          <div class="workflow-steps">
            <div *ngFor="let step of workflowInstance.steps; let i=index" class="workflow-step" [ngClass]="stepStateClass(step)">
              <div class="step-number">{{ step.stepOrder }}</div>
              <div class="step-body">
                <div class="step-name">{{ step.stepName }}</div>
                <div *ngIf="step.approverRole" class="step-meta">Role: {{ step.approverRole }}</div>
                <div class="step-decision">
                  <span class="badge" [ngClass]="decisionClass(step.decision)">{{ step.decision }}</span>
                  <span *ngIf="step.actedBy"> — {{ step.actedBy }}</span>
                  <span *ngIf="step.actedAt"> · {{ step.actedAt | date:'short' }}</span>
                </div>
                <div *ngIf="step.actedByComments" class="step-comments">{{ step.actedByComments }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Placeholder when no report selected -->
    <div class="card detail-card no-selection" *ngIf="!selectedReport">
      <div style="font-size:3rem">📋</div>
      <p>Select an expense report to view details</p>
    </div>
  </div>
</div>

<!-- New Report Modal -->
<div class="modal-overlay" *ngIf="newReportModal" (click)="newReportModal=false">
  <div class="modal" (click)="$event.stopPropagation()">
    <h3 class="modal-title">{{ editingReportId ? 'Edit' : 'New' }} Expense Report</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
      <div class="form-group" style="grid-column:1/-1">
        <label class="form-label">Employee Name *</label>
        <input [(ngModel)]="reportForm.employeeName" class="form-control" placeholder="Full name" />
      </div>
      <div class="form-group">
        <label class="form-label">Employee Email</label>
        <input [(ngModel)]="reportForm.employeeEmail" class="form-control" type="email" placeholder="email@company.com" />
      </div>
      <div class="form-group">
        <label class="form-label">Department</label>
        <input [(ngModel)]="reportForm.department" class="form-control" placeholder="e.g. Finance" />
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label class="form-label">Purpose *</label>
        <input [(ngModel)]="reportForm.purpose" class="form-control" placeholder="e.g. Client entertainment — Q2 2026" />
      </div>
      <div class="form-group">
        <label class="form-label">Period Start *</label>
        <input [(ngModel)]="reportForm.periodStart" class="form-control" type="date" />
      </div>
      <div class="form-group">
        <label class="form-label">Period End *</label>
        <input [(ngModel)]="reportForm.periodEnd" class="form-control" type="date" />
      </div>
      <div class="form-group">
        <label class="form-label">Currency</label>
        <select [(ngModel)]="reportForm.currency" class="form-control">
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="CAD">CAD</option>
        </select>
      </div>
      <div class="form-group" *ngIf="editingReportId">
        <label class="form-label">Notes</label>
        <input [(ngModel)]="reportForm.notes" class="form-control" placeholder="Optional notes" />
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" (click)="newReportModal=false">Cancel</button>
      <button class="btn btn-primary" (click)="saveReport()" [disabled]="!reportForm.employeeName || !reportForm.purpose">
        {{ editingReportId ? 'Update' : 'Create' }} Report
      </button>
    </div>
  </div>
</div>

<!-- Add/Edit Line Modal -->
<div class="modal-overlay" *ngIf="lineModal" (click)="lineModal=false">
  <div class="modal" (click)="$event.stopPropagation()">
    <h3 class="modal-title">{{ editingLineId ? 'Edit' : 'Add' }} Expense Line</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
      <div class="form-group">
        <label class="form-label">Category *</label>
        <select [(ngModel)]="lineForm.categoryId" class="form-control">
          <option value="">Select category…</option>
          <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Date *</label>
        <input [(ngModel)]="lineForm.expenseDate" class="form-control" type="date" />
      </div>
      <div class="form-group">
        <label class="form-label">Amount *</label>
        <input [(ngModel)]="lineForm.amount" class="form-control" type="number" step="0.01" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="form-label">Merchant</label>
        <input [(ngModel)]="lineForm.merchant" class="form-control" placeholder="Vendor / merchant name" />
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label class="form-label">Description *</label>
        <input [(ngModel)]="lineForm.description" class="form-control" placeholder="What was this expense for?" />
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label class="form-label">Receipt URL</label>
        <input [(ngModel)]="lineForm.receiptUrl" class="form-control" placeholder="https://…" />
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" (click)="lineModal=false">Cancel</button>
      <button class="btn btn-primary" (click)="saveLine()"
              [disabled]="!lineForm.categoryId || !lineForm.expenseDate || !lineForm.amount || !lineForm.description">
        {{ editingLineId ? 'Update' : 'Add' }} Line
      </button>
    </div>
  </div>
</div>

<!-- Submit Modal -->
<div class="modal-overlay" *ngIf="submitModal" (click)="submitModal=false">
  <div class="modal" (click)="$event.stopPropagation()">
    <h3 class="modal-title">📤 Submit for Approval</h3>
    <p style="color:var(--text-secondary);margin-bottom:1rem">
      Submit <strong>{{ selectedReport?.reportNumber }}</strong> ({{ selectedReport?.totalAmount | currency }}) for approval?
    </p>
    <div class="form-group">
      <label class="form-label">Submitted By *</label>
      <input [(ngModel)]="submitBy" class="form-control" placeholder="Your name or user ID" />
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" (click)="submitModal=false">Cancel</button>
      <button class="btn btn-primary" (click)="submitReport()" [disabled]="!submitBy">Submit</button>
    </div>
  </div>
</div>

<!-- Approve Modal -->
<div class="modal-overlay" *ngIf="approveModal" (click)="approveModal=false">
  <div class="modal" (click)="$event.stopPropagation()">
    <h3 class="modal-title">✅ Approve Report</h3>
    <div class="form-group">
      <label class="form-label">Approved By *</label>
      <input [(ngModel)]="approveBy" class="form-control" placeholder="Your name or user ID" />
    </div>
    <div class="form-group">
      <label class="form-label">Comments</label>
      <textarea [(ngModel)]="approveComments" class="form-control" rows="3" placeholder="Optional approval notes…"></textarea>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" (click)="approveModal=false">Cancel</button>
      <button class="btn btn-success" (click)="approveReport()" [disabled]="!approveBy">Approve</button>
    </div>
  </div>
</div>

<!-- Reject Modal -->
<div class="modal-overlay" *ngIf="rejectModal" (click)="rejectModal=false">
  <div class="modal" (click)="$event.stopPropagation()">
    <h3 class="modal-title">❌ Reject Report</h3>
    <div class="form-group">
      <label class="form-label">Rejected By *</label>
      <input [(ngModel)]="rejectBy" class="form-control" placeholder="Your name or user ID" />
    </div>
    <div class="form-group">
      <label class="form-label">Reason *</label>
      <textarea [(ngModel)]="rejectReason" class="form-control" rows="3" placeholder="Explain why this is being rejected…"></textarea>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" (click)="rejectModal=false">Cancel</button>
      <button class="btn btn-danger" (click)="rejectReport()" [disabled]="!rejectBy || !rejectReason">Reject</button>
    </div>
  </div>
</div>

<!-- Mark Paid Modal -->
<div class="modal-overlay" *ngIf="paidModal" (click)="paidModal=false">
  <div class="modal" (click)="$event.stopPropagation()">
    <h3 class="modal-title">💰 Mark as Paid</h3>
    <p style="color:var(--text-secondary);margin-bottom:1rem">
      Total approved: <strong>{{ selectedReport?.approvedAmount | currency }}</strong>
    </p>
    <div class="form-group">
      <label class="form-label">Amount Paid *</label>
      <input [(ngModel)]="paidAmount" class="form-control" type="number" step="0.01" />
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" (click)="paidModal=false">Cancel</button>
      <button class="btn btn-primary" (click)="markPaid()" [disabled]="!paidAmount">Mark Paid</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1600px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-title { margin: 0; font-size: 1.75rem; font-weight: 700; color: var(--text-primary); }
    .page-subtitle { margin: 0.25rem 0 0; color: var(--text-secondary); font-size: 0.9rem; }
    .stats-grid { display: grid; gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; }
    .stat-label { font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 0.5rem; }
    .stat-value { font-size: 2rem; font-weight: 700; color: var(--text-primary); }
    .text-success { color: #16a34a; }
    .text-warning { color: #d97706; }
    .text-muted { color: var(--text-secondary); }
    .text-danger { color: #dc2626; }
    .main-layout { display: grid; grid-template-columns: 340px 1fr; gap: 1rem; align-items: start; }
    .card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; }
    .list-card { display: flex; flex-direction: column; max-height: calc(100vh - 260px); }
    .detail-card { min-height: 400px; }
    .no-selection { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; color: var(--text-secondary); gap: 0.5rem; }
    .card-header { padding: 0.875rem 1rem; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); }
    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .detail-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end; }
    .filter-bar { display: flex; gap: 0.5rem; align-items: center; }
    .report-list { overflow-y: auto; flex: 1; }
    .report-item { padding: 0.875rem 1rem; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background .15s; }
    .report-item:hover { background: var(--bg-secondary); }
    .report-item.active { background: rgba(99,102,241,.08); border-left: 3px solid var(--accent); }
    .report-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
    .report-number { font-weight: 700; font-size: 0.85rem; color: var(--accent); }
    .report-employee { font-weight: 600; font-size: 0.9rem; margin-bottom: 0.15rem; }
    .report-meta { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); }
    .report-dates { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem; }
    .tab-bar { display: flex; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); }
    .tab-btn { padding: 0.75rem 1rem; border: none; background: none; cursor: pointer; color: var(--text-secondary); font-weight: 500; font-size: 0.85rem; border-bottom: 3px solid transparent; transition: all .2s; }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); background: var(--card-bg); }
    .tab-content { padding: 1.25rem; }
    .info-label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .04em; display: block; margin-bottom: 0.2rem; }
    .info-chip { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 10px; font-size: 0.8rem; }
    .action-bar { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .data-table th { padding: 0.5rem 0.625rem; text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: .05em; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); }
    .data-table td { padding: 0.625rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
    .data-table tfoot td { border-top: 2px solid var(--border-color); border-bottom: none; }
    .workflow-steps { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.5rem; }
    .workflow-step { display: flex; gap: 1rem; padding: 0.875rem; border-radius: 8px; border: 1px solid var(--border-color); }
    .workflow-step.step-approved { border-left: 4px solid #16a34a; }
    .workflow-step.step-rejected { border-left: 4px solid #dc2626; }
    .workflow-step.step-pending { border-left: 4px solid #d97706; }
    .workflow-step.step-skipped { border-left: 4px solid #9ca3af; }
    .step-number { width: 2rem; height: 2rem; border-radius: 50%; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
    .step-body { flex: 1; }
    .step-name { font-weight: 600; margin-bottom: 0.2rem; }
    .step-meta { font-size: 0.8rem; color: var(--text-secondary); }
    .step-decision { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; margin-top: 0.25rem; }
    .step-comments { font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem; font-style: italic; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; }
    .badge-lg { font-size: 0.8rem; padding: 4px 12px; }
    .badge-draft { background: #f3f4f6; color: #4b5563; }
    .badge-submitted { background: #e0f2fe; color: #0369a1; }
    .badge-underreview { background: #fef3c7; color: #92400e; }
    .badge-approved { background: #dcfce7; color: #166534; }
    .badge-rejected { background: #fee2e2; color: #991b1b; }
    .badge-paid { background: #d1fae5; color: #065f46; }
    .badge-pending { background: #fef9c3; color: #713f12; }
    .badge-skipped { background: #f3f4f6; color: #6b7280; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-secondary { background: #f3f4f6; color: #4b5563; }
    .loading-state { padding: 2rem; text-align: center; color: var(--text-secondary); }
    .empty-state { padding: 2rem; text-align: center; color: var(--text-secondary); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal { background: var(--card-bg); border-radius: 12px; padding: 1.5rem; width: 90%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
    .modal-title { margin: 0 0 1.25rem; font-size: 1.1rem; font-weight: 700; }
    .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.25rem; }
    .form-group { margin-bottom: 0.875rem; }
    .form-label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.3rem; color: var(--text-secondary); }
    .form-control { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary); font-size: 0.875rem; box-sizing: border-box; }
    .btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.875rem; transition: opacity .15s; }
    .btn-sm { padding: 0.3rem 0.6rem; font-size: 0.8rem; }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); }
    .btn-success { background: #16a34a; color: #fff; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
  `]
})
export class ExpenseManagementComponent implements OnInit {
  reports: any[] = [];
  categories: any[] = [];
  loading = false;
  statusFilter = '';
  selectedReport: any = null;
  detailTab = 'info';
  workflowInstance: any = null;
  loadingWorkflow = false;

  // Modals
  newReportModal = false;
  lineModal = false;
  submitModal = false;
  approveModal = false;
  rejectModal = false;
  paidModal = false;

  // Form state
  editingReportId: string | null = null;
  editingLineId: string | null = null;
  reportForm: any = { employeeName: '', employeeEmail: '', department: '', purpose: '', periodStart: '', periodEnd: '', currency: 'USD', notes: '' };
  lineForm: any = { categoryId: '', expenseDate: '', amount: '', description: '', merchant: '', receiptUrl: '' };
  submitBy = '';
  approveBy = '';
  approveComments = '';
  rejectBy = '';
  rejectReason = '';
  paidAmount: number | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadReports();
    this.api.getExpenseCategories().subscribe({ next: (d) => this.categories = d });
  }

  loadReports() {
    this.loading = true;
    this.api.getExpenseReports(this.statusFilter || undefined).subscribe({
      next: (d) => { this.reports = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  selectReport(r: any) {
    this.detailTab = 'info';
    this.workflowInstance = null;
    this.api.getExpenseReport(r.id).subscribe({ next: (d) => this.selectedReport = d });
  }

  countByStatus(s: string) { return this.reports.filter(r => r.status === s || r.approvalStatus === s).length; }
  totalValue() { return this.reports.reduce((sum, r) => sum + r.totalAmount, 0); }

  statusClass(s: string) {
    const map: Record<string,string> = {
      Draft: 'badge-draft', Submitted: 'badge-submitted',
      UnderReview: 'badge-underreview', Approved: 'badge-approved',
      Rejected: 'badge-rejected', Paid: 'badge-paid'
    };
    return map[s] || 'badge-secondary';
  }

  approvalStatusClass(s: string) {
    const map: Record<string,string> = {
      NotRequired: 'badge-secondary', Draft: 'badge-draft',
      Submitted: 'badge-submitted', UnderReview: 'badge-underreview',
      Approved: 'badge-approved', Rejected: 'badge-rejected', Recalled: 'badge-secondary'
    };
    return map[s] || 'badge-secondary';
  }

  stepStateClass(step: any) {
    const map: Record<string,string> = {
      Approved: 'step-approved', Rejected: 'step-rejected',
      Pending: 'step-pending', Skipped: 'step-skipped'
    };
    return map[step.decision] || '';
  }

  decisionClass(d: string) {
    const map: Record<string,string> = {
      Pending: 'badge-pending', Approved: 'badge-approved',
      Rejected: 'badge-rejected', Skipped: 'badge-skipped'
    };
    return map[d] || 'badge-secondary';
  }

  // ── Report CRUD ──────────────────────────────────────────────────────────
  openNewReport() {
    this.editingReportId = null;
    this.reportForm = { employeeName: '', employeeEmail: '', department: '', purpose: '', periodStart: '', periodEnd: '', currency: 'USD', notes: '' };
    this.newReportModal = true;
  }

  editReport() {
    if (!this.selectedReport) return;
    this.editingReportId = this.selectedReport.id;
    this.reportForm = {
      employeeName: this.selectedReport.employeeName,
      employeeEmail: this.selectedReport.employeeEmail || '',
      department: this.selectedReport.department || '',
      purpose: this.selectedReport.purpose,
      periodStart: this.selectedReport.periodStart,
      periodEnd: this.selectedReport.periodEnd,
      currency: this.selectedReport.currency,
      notes: this.selectedReport.notes || ''
    };
    this.newReportModal = true;
  }

  saveReport() {
    if (this.editingReportId) {
      this.api.updateExpenseReport(this.editingReportId, {
        purpose: this.reportForm.purpose,
        periodStart: this.reportForm.periodStart,
        periodEnd: this.reportForm.periodEnd,
        department: this.reportForm.department,
        notes: this.reportForm.notes
      }).subscribe({
        next: () => { this.newReportModal = false; this.loadReports(); this.selectReport({ id: this.editingReportId }); },
        error: (e) => alert('Error: ' + (e.error?.error || 'Failed'))
      });
    } else {
      this.api.createExpenseReport(this.reportForm).subscribe({
        next: (r) => { this.newReportModal = false; this.loadReports(); this.selectReport(r); },
        error: (e) => alert('Error: ' + (e.error?.error || 'Failed'))
      });
    }
  }

  deleteReport() {
    if (!this.selectedReport || !confirm('Delete this report?')) return;
    this.api.deleteExpenseReport(this.selectedReport.id).subscribe({
      next: () => { this.selectedReport = null; this.loadReports(); }
    });
  }

  // ── Lines ────────────────────────────────────────────────────────────────
  openAddLine() {
    this.editingLineId = null;
    this.lineForm = { categoryId: '', expenseDate: new Date().toISOString().slice(0, 10), amount: '', description: '', merchant: '', receiptUrl: '' };
    this.lineModal = true;
  }

  openEditLine(line: any) {
    this.editingLineId = line.id;
    this.lineForm = {
      categoryId: line.categoryId,
      expenseDate: line.expenseDate,
      amount: line.amount,
      description: line.description,
      merchant: line.merchant || '',
      receiptUrl: line.receiptUrl || ''
    };
    this.lineModal = true;
  }

  saveLine() {
    if (!this.selectedReport) return;
    const req = { ...this.lineForm, amount: parseFloat(this.lineForm.amount) };
    const call = this.editingLineId
      ? this.api.updateExpenseLine(this.selectedReport.id, this.editingLineId, req)
      : this.api.addExpenseLine(this.selectedReport.id, req);
    call.subscribe({
      next: (r) => { this.lineModal = false; this.selectedReport = r; },
      error: (e) => alert('Error: ' + (e.error?.error || 'Failed'))
    });
  }

  deleteLine(lineId: string) {
    if (!this.selectedReport || !confirm('Remove this expense line?')) return;
    this.api.deleteExpenseLine(this.selectedReport.id, lineId).subscribe({
      next: (r) => this.selectedReport = r,
      error: (e) => alert('Error: ' + (e.error?.error || 'Failed'))
    });
  }

  // ── Workflow Actions ─────────────────────────────────────────────────────
  openSubmitModal() { this.submitBy = ''; this.submitModal = true; }
  openApproveModal() { this.approveBy = ''; this.approveComments = ''; this.approveModal = true; }
  openRejectModal() { this.rejectBy = ''; this.rejectReason = ''; this.rejectModal = true; }
  openPaidModal() { this.paidAmount = this.selectedReport?.approvedAmount || null; this.paidModal = true; }

  submitReport() {
    if (!this.selectedReport || !this.submitBy) return;
    this.api.submitExpenseReport(this.selectedReport.id, this.submitBy).subscribe({
      next: (r) => { this.submitModal = false; this.selectedReport = r; this.loadReports(); },
      error: (e) => alert('Error: ' + (e.error?.error || 'Failed to submit'))
    });
  }

  approveReport() {
    if (!this.selectedReport || !this.approveBy) return;
    this.api.approveExpenseReport(this.selectedReport.id, { approvedBy: this.approveBy, comments: this.approveComments }).subscribe({
      next: (r) => { this.approveModal = false; this.selectedReport = r; this.loadReports(); },
      error: (e) => alert('Error: ' + (e.error?.error || 'Failed to approve'))
    });
  }

  rejectReport() {
    if (!this.selectedReport || !this.rejectBy || !this.rejectReason) return;
    this.api.rejectExpenseReport(this.selectedReport.id, { rejectedBy: this.rejectBy, reason: this.rejectReason }).subscribe({
      next: (r) => { this.rejectModal = false; this.selectedReport = r; this.loadReports(); },
      error: (e) => alert('Error: ' + (e.error?.error || 'Failed to reject'))
    });
  }

  markPaid() {
    if (!this.selectedReport || !this.paidAmount) return;
    this.api.markExpensePaid(this.selectedReport.id, { amount: this.paidAmount }).subscribe({
      next: (r) => { this.paidModal = false; this.selectedReport = r; this.loadReports(); },
      error: (e) => alert('Error: ' + (e.error?.error || 'Failed'))
    });
  }

  loadWorkflowForReport() {
    if (!this.selectedReport?.workflowInstanceId) return;
    this.loadingWorkflow = true;
    this.api.getWorkflowInstance(this.selectedReport.workflowInstanceId).subscribe({
      next: (d) => { this.workflowInstance = d; this.loadingWorkflow = false; },
      error: () => { this.loadingWorkflow = false; }
    });
  }
}
