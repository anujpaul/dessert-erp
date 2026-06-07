import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-approval-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1 class="page-title">Approval Inbox</h1>
      <p class="page-subtitle">Review and act on pending approval requests</p>
    </div>
    <div class="header-actions">
      <select [(ngModel)]="roleFilter" (ngModelChange)="load()" class="form-control" style="width:200px">
        <option value="">All Roles</option>
        <option value="FinanceManager">Finance Manager</option>
        <option value="Director">Director</option>
        <option value="CFO">CFO</option>
        <option value="Manager">Manager</option>
      </select>
      <button class="btn btn-secondary" (click)="load()">🔄 Refresh</button>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="stats-grid" style="grid-template-columns:repeat(5,1fr)">
    <div class="stat-card">
      <div class="stat-label">Total Pending</div>
      <div class="stat-value">{{ pending.length }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Expense Reports</div>
      <div class="stat-value">{{ countByType('ExpenseReport') }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">AP Invoices</div>
      <div class="stat-value">{{ countByType('APInvoice') }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Purchase Orders</div>
      <div class="stat-value">{{ countByType('PurchaseOrder') }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Other</div>
      <div class="stat-value">{{ countOther() }}</div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="card">
    <div class="tab-bar">
      <button class="tab-btn" [class.active]="activeTab==='pending'" (click)="activeTab='pending'">
        ⏳ Pending ({{ pending.length }})
      </button>
      <button class="tab-btn" [class.active]="activeTab==='history'" (click)="activeTab='history';loadHistory()">
        📋 History
      </button>
      <button class="tab-btn" [class.active]="activeTab==='templates'" (click)="activeTab='templates';loadTemplates()">
        ⚙️ Workflow Templates
      </button>
    </div>

    <!-- Pending Tab -->
    <div *ngIf="activeTab==='pending'" class="tab-content">
      <div *ngIf="loading" class="loading-state">Loading pending approvals…</div>
      <div *ngIf="!loading && pending.length===0" class="empty-state">
        <div style="font-size:3rem">✅</div>
        <p>No pending approvals. All caught up!</p>
      </div>
      <table *ngIf="!loading && pending.length>0" class="data-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Type</th>
            <th>Reference</th>
            <th>Amount</th>
            <th>Step</th>
            <th>Role Required</th>
            <th>Submitted By</th>
            <th>Submitted At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of pending">
            <td>
              <span class="badge" [ngClass]="docTypeClass(item.documentType)">
                {{ docTypeLabel(item.documentType) }}
              </span>
            </td>
            <td>{{ item.documentType }}</td>
            <td><strong>{{ item.documentRef }}</strong></td>
            <td>{{ item.documentAmount | currency }}</td>
            <td>{{ item.stepName }}</td>
            <td>
              <span *ngIf="item.approverRole" class="badge badge-info">{{ item.approverRole }}</span>
              <span *ngIf="!item.approverRole" class="text-muted">Any</span>
            </td>
            <td>{{ item.submittedBy }}</td>
            <td>{{ item.submittedAt | date:'short' }}</td>
            <td>
              <button class="btn btn-sm btn-success" (click)="openApprove(item)">✅ Approve</button>
              <button class="btn btn-sm btn-danger" (click)="openReject(item)" style="margin-left:4px">❌ Reject</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- History Tab -->
    <div *ngIf="activeTab==='history'" class="tab-content">
      <div class="filter-bar">
        <select [(ngModel)]="historyDocType" (ngModelChange)="loadHistory()" class="form-control" style="width:180px">
          <option value="">All Document Types</option>
          <option value="APInvoice">AP Invoice</option>
          <option value="PurchaseOrder">Purchase Order</option>
          <option value="ARInvoice">AR Invoice</option>
          <option value="SalesOrder">Sales Order</option>
          <option value="JournalEntry">Journal Entry</option>
          <option value="ExpenseReport">Expense Report</option>
        </select>
        <select [(ngModel)]="historyStatus" (ngModelChange)="loadHistory()" class="form-control" style="width:160px">
          <option value="">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Recalled">Recalled</option>
        </select>
      </div>
      <div *ngIf="loadingHistory" class="loading-state">Loading history…</div>
      <table *ngIf="!loadingHistory && history.length>0" class="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Reference</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Steps</th>
            <th>Submitted By</th>
            <th>Completed At</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let inst of history" (click)="selectedInstance=inst" style="cursor:pointer"
              [class.selected-row]="selectedInstance?.id===inst.id">
            <td>
              <span class="badge" [ngClass]="docTypeClass(inst.documentType)">
                {{ docTypeLabel(inst.documentType) }}
              </span>
            </td>
            <td><strong>{{ inst.documentRef }}</strong></td>
            <td>{{ inst.documentAmount | currency }}</td>
            <td>
              <span class="badge" [ngClass]="statusClass(inst.status)">{{ inst.status }}</span>
            </td>
            <td>{{ inst.steps?.length || 0 }} steps</td>
            <td>{{ inst.submittedBy }}</td>
            <td>{{ inst.completedAt | date:'short' }}</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="!loadingHistory && history.length===0" class="empty-state">No records found.</div>

      <!-- Step Detail Panel -->
      <div *ngIf="selectedInstance" class="detail-panel" style="margin-top:1rem">
        <h4 style="margin:0 0 .75rem">Steps for {{ selectedInstance.documentRef }}</h4>
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Step</th>
              <th>Role</th>
              <th>Decision</th>
              <th>Acted By</th>
              <th>Comments</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let step of selectedInstance.steps">
              <td>{{ step.stepOrder }}</td>
              <td>{{ step.stepName }}</td>
              <td>{{ step.approverRole || '—' }}</td>
              <td>
                <span class="badge" [ngClass]="decisionClass(step.decision)">{{ step.decision }}</span>
              </td>
              <td>{{ step.actedBy || '—' }}</td>
              <td>{{ step.actedByComments || '—' }}</td>
              <td>{{ step.actedAt | date:'short' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Templates Tab -->
    <div *ngIf="activeTab==='templates'" class="tab-content">
      <div class="filter-bar">
        <button class="btn btn-primary" (click)="openNewTemplate()">+ New Template</button>
      </div>
      <div *ngIf="loadingTemplates" class="loading-state">Loading templates…</div>
      <table *ngIf="!loadingTemplates && templates.length>0" class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Document Type</th>
            <th>Min Amount</th>
            <th>Steps</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of templates">
            <td><strong>{{ t.name }}</strong></td>
            <td>{{ docTypeLabel(t.documentType) }}</td>
            <td>{{ t.amountThreshold | currency }}</td>
            <td>{{ t.steps?.length || 0 }}</td>
            <td>
              <span class="badge" [class]="t.isActive ? 'badge-success' : 'badge-secondary'">
                {{ t.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-secondary" (click)="editTemplate(t)">✏️ Edit</button>
              <button class="btn btn-sm btn-danger" (click)="deleteTemplate(t.id)" style="margin-left:4px">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="!loadingTemplates && templates.length===0" class="empty-state">
        No workflow templates defined. Create one to enable approval routing.
      </div>
    </div>
  </div>
</div>

<!-- Approve Modal -->
<div class="modal-overlay" *ngIf="approveModal" (click)="approveModal=false">
  <div class="modal" (click)="$event.stopPropagation()">
    <h3 class="modal-title">✅ Approve — {{ approveItem?.documentRef }}</h3>
    <div class="form-group">
      <label class="form-label">Your Name / User ID</label>
      <input [(ngModel)]="approveBy" class="form-control" placeholder="e.g. john.doe" />
    </div>
    <div class="form-group">
      <label class="form-label">Comments (optional)</label>
      <textarea [(ngModel)]="approveComments" class="form-control" rows="3" placeholder="Add any comments…"></textarea>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" (click)="approveModal=false">Cancel</button>
      <button class="btn btn-success" (click)="submitApprove()" [disabled]="!approveBy">Approve</button>
    </div>
  </div>
</div>

<!-- Reject Modal -->
<div class="modal-overlay" *ngIf="rejectModal" (click)="rejectModal=false">
  <div class="modal" (click)="$event.stopPropagation()">
    <h3 class="modal-title">❌ Reject — {{ rejectItem?.documentRef }}</h3>
    <div class="form-group">
      <label class="form-label">Your Name / User ID</label>
      <input [(ngModel)]="rejectBy" class="form-control" placeholder="e.g. john.doe" />
    </div>
    <div class="form-group">
      <label class="form-label">Reason for Rejection *</label>
      <textarea [(ngModel)]="rejectReason" class="form-control" rows="3" placeholder="Explain why this is being rejected…"></textarea>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" (click)="rejectModal=false">Cancel</button>
      <button class="btn btn-danger" (click)="submitReject()" [disabled]="!rejectBy || !rejectReason">Reject</button>
    </div>
  </div>
</div>

<!-- Template Modal -->
<div class="modal-overlay" *ngIf="templateModal" (click)="templateModal=false">
  <div class="modal" style="max-width:680px" (click)="$event.stopPropagation()">
    <h3 class="modal-title">{{ editingTemplate?.id ? 'Edit' : 'New' }} Workflow Template</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
      <div class="form-group">
        <label class="form-label">Name *</label>
        <input [(ngModel)]="tplForm.name" class="form-control" placeholder="e.g. Large AP Invoice Approval" />
      </div>
      <div class="form-group">
        <label class="form-label">Document Type *</label>
        <select [(ngModel)]="tplForm.documentType" class="form-control">
          <option value="APInvoice">AP Invoice</option>
          <option value="PurchaseOrder">Purchase Order</option>
          <option value="ARInvoice">AR Invoice</option>
          <option value="SalesOrder">Sales Order</option>
          <option value="JournalEntry">Journal Entry</option>
          <option value="ExpenseReport">Expense Report</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Min Amount Threshold</label>
        <input [(ngModel)]="tplForm.amountThreshold" class="form-control" type="number" />
      </div>
      <div class="form-group" style="display:flex;align-items:flex-end;padding-bottom:.25rem">
        <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
          <input type="checkbox" [(ngModel)]="tplForm.isActive" /> Active
        </label>
      </div>
    </div>

    <div style="margin-top:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
        <strong>Approval Steps</strong>
        <button class="btn btn-sm btn-secondary" (click)="addStep()">+ Add Step</button>
      </div>
      <table class="data-table" *ngIf="tplForm.steps.length>0">
        <thead>
          <tr><th>#</th><th>Step Name</th><th>Approver Role</th><th>Description</th><th></th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let step of tplForm.steps; let i=index">
            <td>{{ step.stepOrder }}</td>
            <td><input [(ngModel)]="step.stepName" class="form-control form-control-sm" placeholder="Step name" /></td>
            <td><input [(ngModel)]="step.approverRole" class="form-control form-control-sm" placeholder="e.g. FinanceManager" /></td>
            <td><input [(ngModel)]="step.description" class="form-control form-control-sm" placeholder="Optional description" /></td>
            <td><button class="btn btn-sm btn-danger" (click)="removeStep(i)">×</button></td>
          </tr>
        </tbody>
      </table>
      <p *ngIf="tplForm.steps.length===0" class="text-muted" style="font-size:.85rem">No steps yet. Click "+ Add Step".</p>
    </div>

    <div class="modal-actions">
      <button class="btn btn-secondary" (click)="templateModal=false">Cancel</button>
      <button class="btn btn-primary" (click)="saveTemplate()" [disabled]="!tplForm.name">Save Template</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-title { margin: 0; font-size: 1.75rem; font-weight: 700; color: var(--text-primary); }
    .page-subtitle { margin: 0.25rem 0 0; color: var(--text-secondary); font-size: 0.9rem; }
    .header-actions { display: flex; gap: 0.75rem; align-items: center; }
    .stats-grid { display: grid; gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; }
    .stat-label { font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 0.5rem; }
    .stat-value { font-size: 2rem; font-weight: 700; color: var(--text-primary); }
    .card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; }
    .tab-bar { display: flex; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); }
    .tab-btn { padding: 0.875rem 1.25rem; border: none; background: none; cursor: pointer; color: var(--text-secondary); font-weight: 500; border-bottom: 3px solid transparent; transition: all .2s; }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); background: var(--card-bg); }
    .tab-content { padding: 1.25rem; }
    .filter-bar { display: flex; gap: 0.75rem; margin-bottom: 1rem; align-items: center; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .data-table th { padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: .05em; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); }
    .data-table td { padding: 0.75rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary); vertical-align: middle; }
    .data-table tr:hover td { background: var(--bg-secondary); }
    .selected-row td { background: rgba(99,102,241,.06) !important; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; }
    .badge-expense { background: #fef3c7; color: #92400e; }
    .badge-ap { background: #fee2e2; color: #991b1b; }
    .badge-po { background: #e0f2fe; color: #075985; }
    .badge-ar { background: #dcfce7; color: #166534; }
    .badge-so { background: #f0fdf4; color: #166534; }
    .badge-other { background: #f3f4f6; color: #4b5563; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-info { background: #e0f2fe; color: #075985; }
    .badge-secondary { background: #f3f4f6; color: #4b5563; }
    .badge-pending { background: #fef9c3; color: #713f12; }
    .badge-approved { background: #dcfce7; color: #166534; }
    .badge-rejected { background: #fee2e2; color: #991b1b; }
    .badge-recalled { background: #f3f4f6; color: #6b7280; }
    .badge-submitted { background: #e0f2fe; color: #0369a1; }
    .badge-underreview { background: #fef3c7; color: #92400e; }
    .loading-state { padding: 2rem; text-align: center; color: var(--text-secondary); }
    .empty-state { padding: 3rem; text-align: center; color: var(--text-secondary); }
    .detail-panel { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal { background: var(--card-bg); border-radius: 12px; padding: 1.5rem; width: 90%; max-width: 520px; }
    .modal-title { margin: 0 0 1.25rem; font-size: 1.1rem; font-weight: 700; }
    .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.25rem; }
    .form-group { margin-bottom: 1rem; }
    .form-label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.35rem; color: var(--text-secondary); }
    .form-control { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary); font-size: 0.875rem; box-sizing: border-box; }
    .form-control-sm { padding: 0.3rem 0.5rem; font-size: 0.8rem; }
    .btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.875rem; }
    .btn-sm { padding: 0.3rem 0.6rem; font-size: 0.8rem; }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); }
    .btn-success { background: #16a34a; color: #fff; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .text-muted { color: var(--text-secondary); }
  `]
})
export class ApprovalInboxComponent implements OnInit {
  activeTab = 'pending';

  // Pending
  pending: any[] = [];
  loading = false;
  roleFilter = '';

  // History
  history: any[] = [];
  loadingHistory = false;
  historyStatus = '';
  historyDocType = '';
  selectedInstance: any = null;

  // Templates
  templates: any[] = [];
  loadingTemplates = false;

  // Approve modal
  approveModal = false;
  approveItem: any = null;
  approveBy = '';
  approveComments = '';

  // Reject modal
  rejectModal = false;
  rejectItem: any = null;
  rejectBy = '';
  rejectReason = '';

  // Template modal
  templateModal = false;
  editingTemplate: any = null;
  tplForm: any = { name: '', documentType: 'APInvoice', amountThreshold: 0, isActive: true, steps: [] };

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getPendingApprovals(this.roleFilter || undefined).subscribe({
      next: (data) => { this.pending = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadHistory() {
    this.loadingHistory = true;
    this.selectedInstance = null;
    this.api.getWorkflowInstances(
      this.historyStatus || undefined,
      this.historyDocType || undefined
    ).subscribe({
      next: (data) => { this.history = data.filter(i => ['Approved','Rejected','Recalled'].includes(i.status)); this.loadingHistory = false; },
      error: () => { this.loadingHistory = false; }
    });
  }

  loadTemplates() {
    this.loadingTemplates = true;
    this.api.getWorkflowTemplates().subscribe({
      next: (data) => { this.templates = data; this.loadingTemplates = false; },
      error: () => { this.loadingTemplates = false; }
    });
  }

  countByType(type: string) { return this.pending.filter(p => p.documentType === type).length; }
  countOther() { return this.pending.filter(p => !['ExpenseReport','APInvoice','PurchaseOrder'].includes(p.documentType)).length; }

  docTypeLabel(t: string) {
    const map: Record<string,string> = {
      APInvoice: 'AP Invoice', PurchaseOrder: 'Purchase Order',
      ARInvoice: 'AR Invoice', SalesOrder: 'Sales Order',
      JournalEntry: 'Journal Entry', ExpenseReport: 'Expense Report'
    };
    return map[t] || t;
  }

  docTypeClass(t: string) {
    const map: Record<string,string> = {
      APInvoice: 'badge-ap', PurchaseOrder: 'badge-po',
      ARInvoice: 'badge-ar', SalesOrder: 'badge-so',
      ExpenseReport: 'badge-expense'
    };
    return map[t] || 'badge-other';
  }

  statusClass(s: string) {
    const map: Record<string,string> = {
      Approved: 'badge-approved', Rejected: 'badge-rejected',
      Recalled: 'badge-recalled', Submitted: 'badge-submitted',
      UnderReview: 'badge-underreview', Draft: 'badge-secondary'
    };
    return map[s] || 'badge-secondary';
  }

  decisionClass(d: string) {
    const map: Record<string,string> = {
      Pending: 'badge-pending', Approved: 'badge-approved',
      Rejected: 'badge-rejected', Skipped: 'badge-secondary'
    };
    return map[d] || 'badge-secondary';
  }

  openApprove(item: any) {
    this.approveItem = item;
    this.approveBy = '';
    this.approveComments = '';
    this.approveModal = true;
  }

  submitApprove() {
    if (!this.approveItem || !this.approveBy) return;
    this.api.approveWorkflowStep(
      this.approveItem.workflowInstanceId,
      this.approveItem.stepId,
      { approvedBy: this.approveBy, comments: this.approveComments }
    ).subscribe({
      next: () => { this.approveModal = false; this.load(); },
      error: (e) => alert('Error: ' + (e.error?.error || 'Failed to approve'))
    });
  }

  openReject(item: any) {
    this.rejectItem = item;
    this.rejectBy = '';
    this.rejectReason = '';
    this.rejectModal = true;
  }

  submitReject() {
    if (!this.rejectItem || !this.rejectBy || !this.rejectReason) return;
    this.api.rejectWorkflowStep(
      this.rejectItem.workflowInstanceId,
      this.rejectItem.stepId,
      { rejectedBy: this.rejectBy, reason: this.rejectReason }
    ).subscribe({
      next: () => { this.rejectModal = false; this.load(); },
      error: (e) => alert('Error: ' + (e.error?.error || 'Failed to reject'))
    });
  }

  openNewTemplate() {
    this.editingTemplate = null;
    this.tplForm = { name: '', documentType: 'APInvoice', amountThreshold: 0, isActive: true, steps: [] };
    this.templateModal = true;
  }

  editTemplate(t: any) {
    this.editingTemplate = t;
    this.tplForm = {
      name: t.name,
      documentType: t.documentType,
      amountThreshold: t.amountThreshold,
      isActive: t.isActive,
      steps: (t.steps || []).map((s: any) => ({ ...s }))
    };
    this.templateModal = true;
  }

  addStep() {
    const nextOrder = this.tplForm.steps.length + 1;
    this.tplForm.steps.push({ stepOrder: nextOrder, stepName: '', approverRole: '', description: '' });
  }

  removeStep(index: number) {
    this.tplForm.steps.splice(index, 1);
    this.tplForm.steps.forEach((s: any, i: number) => s.stepOrder = i + 1);
  }

  saveTemplate() {
    if (!this.tplForm.name) return;
    const req = {
      name: this.tplForm.name,
      documentType: this.tplForm.documentType,
      amountThreshold: this.tplForm.amountThreshold,
      isActive: this.tplForm.isActive,
      steps: this.tplForm.steps.map((s: any) => ({
        stepOrder: s.stepOrder,
        stepName: s.stepName,
        approverRole: s.approverRole || null,
        approverUserId: null,
        description: s.description || null
      }))
    };
    const call = this.editingTemplate?.id
      ? this.api.updateWorkflowTemplate(this.editingTemplate.id, req)
      : this.api.createWorkflowTemplate(req);
    call.subscribe({
      next: () => { this.templateModal = false; this.loadTemplates(); },
      error: (e) => alert('Error: ' + (e.error?.error || 'Failed to save'))
    });
  }

  deleteTemplate(id: string) {
    if (!confirm('Delete this workflow template?')) return;
    this.api.deleteWorkflowTemplate(id).subscribe({
      next: () => this.loadTemplates(),
      error: (e) => alert('Error: ' + (e.error?.error || 'Failed to delete'))
    });
  }
}
