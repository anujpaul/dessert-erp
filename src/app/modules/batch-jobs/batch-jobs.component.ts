import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { BatchJobConfig, BatchJobType } from '../../core/models/erp.models';

type ViewMode = 'list' | 'create' | 'edit';

const JOB_TYPES: BatchJobType[] = [
  'ImportSalesOrder', 'ImportPurchaseOrder', 'ImportVendor', 'ImportProduct', 'ImportRetailTransaction',
  'ExportSalesOrder', 'ExportPurchaseOrder', 'ExportVendor', 'ExportProduct',
];

const CRON_PRESETS = [
  { label: 'Every 5 minutes',   value: '*/5 * * * *' },
  { label: 'Every 15 minutes',  value: '*/15 * * * *' },
  { label: 'Every 30 minutes',  value: '*/30 * * * *' },
  { label: 'Every hour',        value: '0 * * * *' },
  { label: 'Every 6 hours',     value: '0 */6 * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Custom…',           value: 'custom' },
];

@Component({
  selector: 'app-batch-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">⚙️ Batch Jobs</h1>
      <p class="page-sub">Recurring import &amp; export jobs — files read from / written to local folders</p>
    </div>
    <button class="btn-primary" *ngIf="view === 'list'" (click)="startCreate()">+ New Job</button>
  </div>

  <!-- ══════════════════════════ LIST ══════════════════════════ -->
  <div *ngIf="view === 'list'">
    <div *ngIf="jobs().length === 0" class="empty-state">
      <div class="empty-icon">⚙️</div>
      <p>No batch jobs configured yet.</p>
      <button class="btn-primary" (click)="startCreate()">Create your first job</button>
    </div>

    <div class="job-grid" *ngIf="jobs().length > 0">
      <div *ngFor="let j of jobs()" class="job-card" [class.disabled-card]="!j.isEnabled">
        <div class="job-card-header">
          <div class="job-name">
            <span class="job-icon">{{ typeIcon(j.jobType) }}</span>
            {{ j.name }}
          </div>
          <label class="toggle" [title]="j.isEnabled ? 'Disable job' : 'Enable job'">
            <input type="checkbox" [checked]="j.isEnabled" (change)="toggleEnabled(j)" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="job-meta">
          <span class="meta-badge type-badge">{{ j.jobType }}</span>
          <span class="meta-badge fmt-badge">{{ j.fileFormat }}</span>
          <span class="meta-badge cron-badge" title="Cron: {{ j.cronExpression }}">🕐 {{ cronLabel(j.cronExpression) }}</span>
        </div>

        <div class="storage-info" *ngIf="isImportJobType(j.jobType)">
          <span class="storage-icon">📂</span>
          <span class="storage-text" [title]="j.localInboxPath">{{ j.localInboxPath }}</span>
        </div>
        <div class="storage-info" *ngIf="!isImportJobType(j.jobType)">
          <span class="storage-icon">📁</span>
          <span class="storage-text" [title]="j.localExportPath ?? '(default)'">
            {{ j.localExportPath ?? '(default beside inbox)' }}
          </span>
        </div>

        <div class="run-status" [ngClass]="'run-' + j.lastRunStatus">
          <span class="run-icon">{{ runIcon(j.lastRunStatus) }}</span>
          <span class="run-label">{{ j.lastRunStatus }}</span>
          <span *ngIf="j.lastRunAt" class="run-time">{{ j.lastRunAt | date:'MMM d, HH:mm' }}</span>
          <span *ngIf="j.lastRunFilesProcessed > 0" class="run-detail">
            · {{ j.lastRunFilesProcessed }} file(s), {{ j.lastRunRowsPromoted }} rows
          </span>
        </div>

        <div *ngIf="j.lastRunMessage && j.lastRunStatus === 'Failed'" class="run-error">
          {{ j.lastRunMessage }}
        </div>

        <div *ngIf="j.autoConfirmSalesOrders" class="auto-confirm-badge">
          ✅ Auto-confirms sales orders after import
        </div>

        <div class="job-actions">
          <button class="btn-trigger" (click)="trigger(j)" [disabled]="triggering === j.id">
            {{ triggering === j.id ? '⏳ Queuing…' : '▶ Run Now' }}
          </button>
          <button class="btn-edit" (click)="startEdit(j)">✏️ Edit</button>
          <button class="btn-delete" (click)="deleteJob(j)">🗑</button>
        </div>

        <div *ngIf="triggerMsg[j.id]" class="trigger-msg">{{ triggerMsg[j.id] }}</div>
      </div>
    </div>

    <!-- Refresh bar -->
    <div class="refresh-bar">
      <button class="btn-ghost" (click)="load()">🔄 Refresh</button>
      <span class="muted" *ngIf="lastRefresh">Last refreshed {{ lastRefresh | date:'HH:mm:ss' }}</span>
    </div>
  </div>

  <!-- ══════════════════════════ CREATE / EDIT FORM ══════════════════════════ -->
  <div *ngIf="view === 'create' || view === 'edit'" class="form-card">
    <div class="form-header">
      <h2>{{ view === 'create' ? 'New Batch Job' : 'Edit — ' + form.name }}</h2>
      <button class="btn-ghost" (click)="cancelForm()">✕ Cancel</button>
    </div>

    <div class="form-section-title">📋 Job Configuration</div>
    <div class="form-grid-3">
      <div class="field">
        <label>Job Name *</label>
        <input [(ngModel)]="form.name" class="input" placeholder="e.g. Import Sales Orders" />
      </div>
      <div class="field">
        <label>Job Type *</label>
        <select [(ngModel)]="form.jobType" class="input" (change)="onJobTypeChange()">
          <option *ngFor="let t of jobTypes" [value]="t">{{ typeIcon(t) }} {{ t }}</option>
        </select>
      </div>
      <div class="field">
        <label>File Format *</label>
        <select [(ngModel)]="form.fileFormat" class="input">
          <option value="Xml">XML</option>
          <option value="Csv">CSV</option>
          <option value="Json">JSON</option>
        </select>
      </div>
    </div>

    <div class="form-section-title">🕐 Schedule</div>
    <div class="form-grid-2">
      <div class="field">
        <label>Preset</label>
        <select class="input" (change)="onPresetChange($event)">
          <option *ngFor="let p of cronPresets" [value]="p.value"
                  [selected]="selectedPreset === p.value">{{ p.label }}</option>
        </select>
      </div>
      <div class="field">
        <label>Cron Expression *</label>
        <input [(ngModel)]="form.cronExpression" class="input" placeholder="*/5 * * * *" />
        <span class="field-hint">{{ cronLabel(form.cronExpression) }}</span>
      </div>
    </div>

    <div class="form-section-title">📂 Local File System Paths</div>
    <div class="path-hint-box">
      💡 Enter paths <strong>relative to the Azure File Share root</strong> (e.g. <code>imports/sales-orders/inbox</code>).
      Folders are created automatically. Files are visible in Azure Storage Explorer under the <code>erp-files</code> share.
    </div>

    <!-- IMPORT paths -->
    <div *ngIf="isImportJob()" class="form-grid-1">
      <div class="field">
        <label>Inbox Folder *</label>
        <input [(ngModel)]="form.localInboxPath" class="input"
               placeholder="imports/sales-orders/inbox" />
        <span class="field-hint">The job picks up all .{{ form.fileFormat.toLowerCase() }} files from here in the Azure File Share.</span>
      </div>
      <div class="field">
        <label>Processed Folder *</label>
        <input [(ngModel)]="form.localProcessedPath" class="input"
               placeholder="imports/sales-orders/processed" />
        <span class="field-hint">Successfully imported files are moved here.</span>
      </div>
      <div class="field">
        <label>Error Folder *</label>
        <input [(ngModel)]="form.localErrorPath" class="input"
               placeholder="imports/sales-orders/errors" />
        <span class="field-hint">Files that fail processing are moved here for review.</span>
      </div>
    </div>

    <!-- EXPORT paths -->
    <div *ngIf="!isImportJob()" class="form-grid-1">
      <div class="field">
        <label>Export Folder *</label>
        <input [(ngModel)]="form.localExportPath" class="input"
               placeholder="exports/sales-orders" />
        <span class="field-hint">Generated export files will be written here.</span>
      </div>
      <div class="field">
        <label>Export File Name Pattern</label>
        <input [(ngModel)]="form.exportFileNamePattern" class="input"
               [placeholder]="'sales-orders-{date}.xml'" />
        <span class="field-hint">Use {{ '{' }}date{{ '}' }} for a UTC timestamp (yyyyMMdd_HHmmss). Defaults to entity-type-export-{{ '{' }}date{{ '}' }}.{{ form.fileFormat.toLowerCase() }}</span>
      </div>
    </div>

    <!-- Auto-confirm (only for SO import) -->
    <div *ngIf="form.jobType === 'ImportSalesOrder'" class="auto-confirm-section">
      <label class="checkbox-row">
        <input type="checkbox" [(ngModel)]="form.autoConfirmSalesOrders" />
        <span>
          <strong>Auto-confirm sales orders after import</strong>
          <span class="field-hint" style="display:block">
            After all validation checks pass and rows are promoted, the imported sales orders
            will automatically transition from <em>Draft → Confirmed</em> status.
          </span>
        </span>
      </label>
    </div>

    <div class="form-actions">
      <button class="btn-primary" (click)="saveForm()" [disabled]="saving">
        {{ saving ? '⏳ Saving…' : view === 'create' ? '✅ Create Job' : '✅ Save Changes' }}
      </button>
      <button class="btn-ghost" (click)="cancelForm()">Cancel</button>
    </div>

    <div *ngIf="formError" class="form-error">{{ formError }}</div>
  </div>
</div>
  `,
  styles: [`
    .page { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .page-sub   { color: #64748b; font-size: .875rem; margin-top: .25rem; }

    .btn-primary { padding: .5rem 1.25rem; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: .875rem; }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-ghost   { padding: .4rem .8rem; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: .8rem; }

    /* Job grid */
    .job-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; margin-bottom: 1rem; }
    .job-card  { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; transition: box-shadow .15s; }
    .job-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }
    .disabled-card { opacity: .65; }

    .job-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .75rem; }
    .job-name   { font-weight: 700; font-size: .95rem; color: #1e293b; display: flex; align-items: center; gap: .4rem; }
    .job-icon   { font-size: 1.1rem; }

    /* Toggle switch */
    .toggle { position: relative; display: inline-block; width: 40px; height: 22px; cursor: pointer; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; inset: 0; background: #d1d5db; border-radius: 22px; transition: .2s; }
    .slider:before { content: ''; position: absolute; height: 16px; width: 16px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .2s; }
    input:checked + .slider { background: #22c55e; }
    input:checked + .slider:before { transform: translateX(18px); }

    .job-meta { display: flex; gap: .4rem; flex-wrap: wrap; margin-bottom: .6rem; }
    .meta-badge { padding: .15rem .45rem; border-radius: 4px; font-size: .7rem; font-weight: 600; }
    .type-badge  { background: #ede9fe; color: #5b21b6; }
    .fmt-badge   { background: #fef3c7; color: #92400e; }
    .cron-badge  { background: #f0f9ff; color: #0369a1; }

    .storage-info { display: flex; align-items: center; gap: .4rem; font-size: .78rem; color: #64748b; margin-bottom: .6rem;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .storage-icon { flex-shrink: 0; }
    .storage-text { overflow: hidden; text-overflow: ellipsis; font-family: monospace; font-size: .72rem; }

    .run-status { display: flex; align-items: center; gap: .4rem; font-size: .78rem; padding: .4rem .6rem; border-radius: 6px; margin-bottom: .5rem; }
    .run-icon   { font-size: .9rem; }
    .run-label  { font-weight: 600; }
    .run-time   { color: #64748b; margin-left: auto; }
    .run-detail { color: #64748b; font-size: .73rem; }
    .run-Never         { background: #f8fafc; color: #64748b; }
    .run-Running       { background: #ede9fe; color: #5b21b6; }
    .run-Success       { background: #dcfce7; color: #166534; }
    .run-PartialSuccess{ background: #fef3c7; color: #92400e; }
    .run-Failed        { background: #fee2e2; color: #991b1b; }
    .run-NoFilesFound  { background: #f0f9ff; color: #0369a1; }

    .run-error { font-size: .75rem; color: #dc2626; background: #fef2f2; padding: .35rem .6rem; border-radius: 4px; margin-bottom: .5rem; }
    .auto-confirm-badge { font-size: .75rem; color: #166534; background: #dcfce7; padding: .3rem .6rem; border-radius: 4px; margin-bottom: .5rem; }

    .job-actions { display: flex; gap: .5rem; margin-top: .75rem; }
    .btn-trigger { padding: .35rem .8rem; background: #3b82f6; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: .8rem; font-weight: 600; }
    .btn-trigger:disabled { opacity: .6; cursor: not-allowed; }
    .btn-edit    { padding: .35rem .7rem; background: #f1f5f9; border: 1px solid #d1d5db; border-radius: 5px; cursor: pointer; font-size: .8rem; }
    .btn-delete  { padding: .35rem .6rem; background: #fee2e2; border: 1px solid #fecaca; border-radius: 5px; cursor: pointer; font-size: .8rem; color: #dc2626; }
    .trigger-msg { font-size: .75rem; color: #2563eb; margin-top: .35rem; }

    .refresh-bar { display: flex; gap: .75rem; align-items: center; margin-top: .5rem; }
    .muted { color: #94a3b8; font-size: .8rem; }

    /* Empty state */
    .empty-state { text-align: center; padding: 4rem 2rem; background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; }
    .empty-icon  { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state p { color: #64748b; margin-bottom: 1rem; }

    /* Form */
    .form-card { background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 1.75rem; }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .form-header h2 { font-size: 1.15rem; font-weight: 700; color: #0f172a; }
    .form-section-title { font-size: .8rem; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: .05em; margin: 1.25rem 0 .75rem; border-bottom: 1px solid #e0e7ff; padding-bottom: .4rem; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: .5rem; }
    .form-grid-1 { display: grid; grid-template-columns: 1fr; gap: .75rem; }
    .field { display: flex; flex-direction: column; }
    .field label { font-size: .8rem; font-weight: 600; color: #374151; margin-bottom: .3rem; }
    .field-hint { font-size: .73rem; color: #94a3b8; margin-top: .25rem; }
    .input { padding: .45rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; width: 100%; box-sizing: border-box; font-family: inherit; }
    .input:focus { outline: none; border-color: #6366f1; }

    .path-hint-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: .65rem 1rem; font-size: .78rem; color: #0369a1; margin-bottom: .75rem; }
    .path-hint-box code { background: #e0f2fe; padding: .1rem .35rem; border-radius: 3px; font-size: .75rem; }

    .auto-confirm-section { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem 1.25rem; margin: 1.25rem 0; }
    .checkbox-row { display: flex; gap: .75rem; align-items: flex-start; cursor: pointer; }
    .checkbox-row input { margin-top: 3px; accent-color: #16a34a; }
    .checkbox-row strong { display: block; font-size: .875rem; color: #166534; }

    .form-actions { display: flex; gap: .75rem; margin-top: 1.5rem; }
    .form-error { color: #dc2626; font-size: .85rem; margin-top: .75rem; background: #fef2f2; padding: .5rem .75rem; border-radius: 6px; }
  `]
})
export class BatchJobsComponent implements OnInit, OnDestroy {
  view: ViewMode = 'list';
  jobs = signal<BatchJobConfig[]>([]);
  jobTypes = JOB_TYPES;
  cronPresets = CRON_PRESETS;
  selectedPreset = '*/5 * * * *';
  lastRefresh: Date | null = null;
  triggering: string | null = null;
  triggerMsg: Record<string, string> = {};
  saving = false;
  formError = '';
  editingId: string | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  form = this.blankForm();

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
    this.refreshTimer = setInterval(() => this.load(), 30_000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  load() {
    this.api.getBatchJobs().subscribe(list => {
      this.jobs.set(list);
      this.lastRefresh = new Date();
    });
  }

  // ── Form helpers ───────────────────────────────────────────────────────────

  blankForm() {
    return {
      name: '',
      jobType: 'ImportSalesOrder' as BatchJobType,
      fileFormat: 'Xml',
      cronExpression: '*/5 * * * *',
      localInboxPath: '',
      localProcessedPath: '',
      localErrorPath: '',
      localExportPath: '',
      exportFileNamePattern: '',
      autoConfirmSalesOrders: false,
      isEnabled: true,
    };
  }

  isImportJob(): boolean {
    return this.form.jobType.startsWith('Import');
  }

  isImportJobType(jobType: string): boolean {
    return jobType.startsWith('Import');
  }

  onJobTypeChange() {
    // Suggest default folder structure based on entity type
    const entity = this.form.jobType
      .replace('Import', '').replace('Export', '')
      .replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');

    if (this.isImportJob()) {
      this.form.localInboxPath     = `imports/${entity}/inbox`;
      this.form.localProcessedPath = `imports/${entity}/processed`;
      this.form.localErrorPath     = `imports/${entity}/errors`;
    } else {
      this.form.localExportPath = `exports/${entity}s`;
    }
  }

  onPresetChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val !== 'custom') {
      this.form.cronExpression = val;
    }
    this.selectedPreset = val;
  }

  startCreate() {
    this.form      = this.blankForm();
    this.formError = '';
    this.editingId = null;
    this.view      = 'create';
  }

  startEdit(j: BatchJobConfig) {
    this.form = {
      name:                   j.name,
      jobType:                j.jobType,
      fileFormat:             j.fileFormat,
      cronExpression:         j.cronExpression,
      localInboxPath:         j.localInboxPath,
      localProcessedPath:     j.localProcessedPath,
      localErrorPath:         j.localErrorPath,
      localExportPath:        j.localExportPath ?? '',
      exportFileNamePattern:  j.exportFileNamePattern ?? '',
      autoConfirmSalesOrders: j.autoConfirmSalesOrders,
      isEnabled:              j.isEnabled,
    };
    this.formError = '';
    this.editingId = j.id;
    this.view      = 'edit';
  }

  cancelForm() { this.view = 'list'; }

  saveForm() {
    if (!this.form.name.trim()) {
      this.formError = 'Job Name is required.';
      return;
    }
    if (this.isImportJob() &&
        (!this.form.localInboxPath.trim() || !this.form.localProcessedPath.trim() || !this.form.localErrorPath.trim())) {
      this.formError = 'Inbox, Processed, and Error folder paths are required for import jobs.';
      return;
    }
    if (!this.isImportJob() && !this.form.localExportPath.trim()) {
      this.formError = 'Export Folder is required for export jobs.';
      return;
    }

    this.saving    = true;
    this.formError = '';

    const payload = {
      name:                   this.form.name,
      jobType:                this.form.jobType,
      fileFormat:             this.form.fileFormat,
      cronExpression:         this.form.cronExpression,
      localInboxPath:         this.form.localInboxPath,
      localProcessedPath:     this.form.localProcessedPath,
      localErrorPath:         this.form.localErrorPath,
      localExportPath:        this.form.localExportPath || null,
      exportFileNamePattern:  this.form.exportFileNamePattern || null,
      autoConfirmSalesOrders: this.form.autoConfirmSalesOrders,
      isEnabled:              this.form.isEnabled,
    };

    if (this.view === 'create') {
      this.api.createBatchJob(payload as any).subscribe({
        next: () => { this.saving = false; this.view = 'list'; this.load(); },
        error: err => { this.saving = false; this.formError = err.error?.error ?? 'Save failed.'; }
      });
    } else {
      this.api.updateBatchJob(this.editingId!, payload).subscribe({
        next: () => { this.saving = false; this.view = 'list'; this.load(); },
        error: err => { this.saving = false; this.formError = err.error?.error ?? 'Save failed.'; }
      });
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  toggleEnabled(j: BatchJobConfig) {
    const obs = j.isEnabled ? this.api.disableBatchJob(j.id) : this.api.enableBatchJob(j.id);
    obs.subscribe({ next: () => this.load(), error: () => this.load() });
  }

  trigger(j: BatchJobConfig) {
    this.triggering       = j.id;
    this.triggerMsg[j.id] = '';
    this.api.triggerBatchJob(j.id).subscribe({
      next: res => {
        this.triggering       = null;
        this.triggerMsg[j.id] = `✅ Queued (Hangfire job #${res.hangfireJobId})`;
        setTimeout(() => { this.triggerMsg[j.id] = ''; this.load(); }, 4000);
      },
      error: err => {
        this.triggering       = null;
        this.triggerMsg[j.id] = '❌ ' + (err.error?.error ?? 'Failed to trigger job.');
      }
    });
  }

  deleteJob(j: BatchJobConfig) {
    if (!confirm(`Delete batch job "${j.name}"? This cannot be undone.`)) return;
    this.api.deleteBatchJob(j.id).subscribe({ next: () => this.load() });
  }

  // ── Display helpers ────────────────────────────────────────────────────────

  typeIcon(type: string): string {
    if (type.startsWith('ImportSales'))    return '📥';
    if (type.startsWith('ImportPurchase')) return '📦';
    if (type.startsWith('ImportVendor'))  return '🏭';
    if (type.startsWith('ImportProduct')) return '🛍️';
    if (type.startsWith('Export'))        return '📤';
    return '⚙️';
  }

  runIcon(status: string): string {
    const m: Record<string, string> = {
      Never: '⭕', Running: '⚡', Success: '✅',
      PartialSuccess: '⚠️', Failed: '❌', NoFilesFound: '🔍'
    };
    return m[status] ?? '•';
  }

  cronLabel(cron: string): string {
    const preset = CRON_PRESETS.find(p => p.value === cron);
    return preset && preset.value !== 'custom' ? preset.label : cron;
  }
}
