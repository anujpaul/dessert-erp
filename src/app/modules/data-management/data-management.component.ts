import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import {
  ImportJob, ImportJobRow, RowResult, RetailStatement, RetailSettlement, RetailStaging
} from '../../core/models/erp.models';

type Tab = 'import' | 'retail' | 'export' | 'history';
type ImportMode = 'immediate' | 'staged';

const ENTITY_TYPES = ['Vendor', 'Product', 'SalesOrder', 'PurchaseOrder', 'RetailTransaction'];
const FILE_FORMATS  = ['Csv', 'Json', 'Xml'];

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">📂 Data Management</h1>
      <p class="page-sub">Import · Export · Job History</p>
    </div>
  </div>

  <div class="tabs">
    <button class="tab" [class.active]="activeTab === 'import'"  (click)="setTab('import')">⬆️ Import</button>
    <button class="tab" [class.active]="activeTab === 'retail'" (click)="setTab('retail')">Retail Statements</button>
    <button class="tab" [class.active]="activeTab === 'export'"  (click)="setTab('export')">⬇️ Export</button>
    <button class="tab" [class.active]="activeTab === 'history'" (click)="setTab('history')">📋 History</button>
  </div>

  <!-- ═══════════════════════════════ IMPORT ═══════════════════════════════ -->
  <div *ngIf="activeTab === 'import'" class="tab-content">
    <div class="card">
      <div class="card-title">Import Data from File</div>

      <div class="form-grid">
        <div class="field">
          <label>Entity Type</label>
          <select [(ngModel)]="importEntityType" (ngModelChange)="onEntityTypeChange($event)" class="select-input">
            <option *ngFor="let e of entityTypes" [value]="e">{{ entityIcon(e) }} {{ e }}</option>
          </select>
        </div>
        <div class="field">
          <label>File Format</label>
          <select [(ngModel)]="importFileFormat" class="select-input">
            <option *ngFor="let f of fileFormats" [value]="f">{{ f }}</option>
          </select>
        </div>
      </div>

      <!-- Import mode -->
      <div class="mode-toggle">
        <label class="mode-opt" [class.active]="importMode === 'immediate'" (click)="importMode = 'immediate'">
          <span class="mode-radio"></span>
          <div>
            <strong>Immediate</strong>
            <span class="mode-desc">Stage + validate + promote in one step (best for small files)</span>
          </div>
        </label>
        <label class="mode-opt" [class.active]="importMode === 'staged'" (click)="importMode = 'staged'">
          <span class="mode-radio"></span>
          <div>
            <strong>Stage &amp; Review</strong>
            <span class="mode-desc">Stage rows first, review errors, then promote (best for large files &amp; data quality checks)</span>
          </div>
        </label>
      </div>

      <div class="template-row" *ngIf="importEntityType !== 'RetailTransaction'">
        <span class="muted">Need a template? </span>
        <button class="btn-link" (click)="downloadTemplate()">⬇️ Download {{ importEntityType }} {{ importFileFormat }} template</button>
      </div>

      <!-- Drop zone -->
      <div class="drop-zone" [class.drag-over]="dragging"
           (dragover)="$event.preventDefault(); dragging = true"
           (dragleave)="dragging = false"
           (drop)="onDrop($event)">
        <div *ngIf="!selectedFile">
          <p>🗂️ Drag &amp; drop your {{ formatLabel() }} file here</p>
          <p class="muted">or</p>
          <label class="btn-primary-sm" style="cursor:pointer">
            Browse File
            <input type="file" [accept]="fileAccept()" (change)="onFileSelect($event)" style="display:none" />
          </label>
        </div>
        <div *ngIf="selectedFile" class="file-selected">
          <span class="file-icon">📄</span>
          <span>{{ selectedFile.name }}</span>
          <button class="btn-ghost" (click)="clearFile()">✕ Remove</button>
        </div>
      </div>

      <div *ngIf="detectedImportType" class="template-row">
        <span class="muted">{{ detectedImportType }}</span>
      </div>

      <div class="import-actions">
        <button class="btn-primary" (click)="runImport()" [disabled]="!selectedFile || importing">
          {{ importing ? '⏳ Processing…' : importMode === 'immediate' ? '⬆️ Import Now' : '📤 Stage for Review' }}
        </button>
      </div>

      <!-- Staged job review panel -->
      <div *ngIf="stagedJob && importMode === 'staged' && stagedJob.status !== 'Completed'" class="staged-panel">
        <div class="staged-header">
          <span class="staged-title">📊 Staging Complete — Review Before Applying</span>
        </div>
        <div class="staged-stats">
          <div class="stat-box stat-total">
            <span class="stat-num">{{ stagedJob.stagedRows }}</span>
            <span class="stat-label">Staged</span>
          </div>
          <div class="stat-box stat-valid">
            <span class="stat-num">{{ stagedJob.validRows }}</span>
            <span class="stat-label">Valid</span>
          </div>
          <div class="stat-box stat-invalid">
            <span class="stat-num">{{ stagedJob.invalidRows }}</span>
            <span class="stat-label">Invalid</span>
          </div>
        </div>

        <!-- Invalid rows list -->
        <div *ngIf="stagedJob.invalidRows > 0" class="invalid-rows">
          <div class="invalid-title">⚠️ Rows with errors ({{ stagedJob.invalidRows }} will be skipped):</div>
          <div *ngIf="loadingRows" class="muted-center">Loading rows…</div>
          <div class="row-result-list" *ngIf="!loadingRows && stagedRows.length">
            <div *ngFor="let r of invalidStagedRows()" class="row-result row-err">
              <span class="row-num">Row {{ r.rowNumber }}</span>
              <span class="err-msg">{{ r.errorMessage }}</span>
            </div>
          </div>
        </div>

        <div class="promote-actions">
          <button class="btn-promote" (click)="promote()" [disabled]="promoting || stagedJob.validRows === 0">
            {{ promoting ? '⏳ Promoting…' : '✅ Promote ' + stagedJob.validRows + ' Valid Rows' }}
          </button>
          <button class="btn-ghost" (click)="clearFile()">Cancel</button>
        </div>
      </div>

      <!-- Result panel (after immediate or after promote) -->
      <div *ngIf="lastJob && (importMode === 'immediate' || lastJob.status === 'Completed' || lastJob.status === 'PartialSuccess' || lastJob.status === 'Failed')"
           class="result-panel"
           [class.result-success]="lastJob.status === 'Completed'"
           [class.result-partial]="lastJob.status === 'PartialSuccess'"
           [class.result-error]="lastJob.status === 'Failed'">
        <div class="result-header">
          <span class="result-icon">{{ statusIcon(lastJob.status) }}</span>
          <strong>{{ lastJob.status }}</strong>
          <span class="muted">· {{ lastJob.promotedRows }} promoted, {{ lastJob.invalidRows }} invalid of {{ lastJob.stagedRows || lastJob.totalRows }} rows</span>
        </div>
        <div *ngIf="lastJob.errorSummary" class="error-summary">{{ lastJob.errorSummary }}</div>
      </div>

      <!-- Row results (immediate mode) -->
      <div *ngIf="rowResults.length && importMode === 'immediate'" class="row-results">
        <div class="row-results-title">Row Results
          <span class="badge-green">{{ successCount }} OK</span>
          <span class="badge-red">{{ failCount }} Errors</span>
        </div>
        <div class="row-result-list">
          <div *ngFor="let r of rowResults" class="row-result" [class.row-ok]="r.success" [class.row-err]="!r.success">
            <span class="row-num">Row {{ r.row }}</span>
            <span *ngIf="r.success" class="ok-mark">✓</span>
            <span *ngIf="!r.success" class="err-msg">✗ {{ r.error }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════ EXPORT ═══════════════════════════════ -->
  <div *ngIf="activeTab === 'retail'" class="tab-content">
    <div class="card">
      <div class="card-title">Retail Transaction Staging</div>
      <button class="btn-primary" (click)="loadRetail()">Refresh</button>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Transaction</th><th>Source</th><th>Store / Date</th><th>Lines</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let s of retailStaging()">
              <td><strong>{{ s.transactionNumber }}</strong><br><span class="muted">{{ s.currency }}</span></td>
              <td>{{ s.sourceFile }}</td>
              <td>{{ s.storeCode }}<br><span class="muted">{{ s.businessDate | date:'mediumDate' }}</span></td>
              <td>{{ s.lineCount }}<br><span class="muted">{{ s.matchedLines }} matched, {{ s.unmatchedLines }} unmatched</span></td>
              <td>{{ s.grandTotal | currency:s.currency }}</td>
              <td>{{ s.status }}<div class="error-summary" *ngIf="s.validationMessage">{{ s.validationMessage }}</div></td>
              <td><button class="btn-link" *ngIf="s.status === 'Valid'" (click)="promoteStaged(s)">Promote</button></td>
            </tr>
            <tr *ngIf="retailStaging().length === 0"><td colspan="7" class="muted-center">No staged retail transactions found.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Retail Statement Posting</div>
      <button class="btn-primary" (click)="loadRetail()">Refresh</button>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Statement</th><th>Store / Date</th><th>Transactions</th><th>Net Sales</th><th>Tax</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let s of retailStatements()">
              <td><strong>{{ s.statementNumber }}</strong><br><span class="muted">{{ s.currency }}</span></td>
              <td>{{ s.storeName }}<br><span class="muted">{{ s.businessDate | date:'mediumDate' }}</span></td>
              <td>{{ s.transactionCount }}</td>
              <td>{{ s.netSales - s.discountTotal | currency:s.currency }}</td>
              <td>{{ s.taxTotal | currency:s.currency }}</td>
              <td>{{ s.grandTotal | currency:s.currency }}</td>
              <td>{{ s.status }}<div class="error-summary" *ngIf="s.postingError">{{ s.postingError }}</div></td>
              <td><button class="btn-link" *ngIf="s.status !== 'Posted'" (click)="postStatement(s)">Post</button></td>
            </tr>
            <tr *ngIf="retailStatements().length === 0"><td colspan="8" class="muted-center">No retail statements found.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Tender Settlements</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Statement</th><th>Method</th><th>Amount</th><th>Processor Ref</th><th>Status</th></tr></thead>
          <tbody>
            <tr *ngFor="let s of retailSettlements()">
              <td>{{ s.statementNumber }}</td><td>{{ s.paymentMethod }}</td>
              <td>{{ s.amount | currency:s.currency }}</td><td>{{ s.processorReference || '—' }}</td><td>{{ s.status }}</td>
            </tr>
            <tr *ngIf="retailSettlements().length === 0"><td colspan="5" class="muted-center">No tender settlements found.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div *ngIf="activeTab === 'export'" class="tab-content">
    <div class="card">
      <div class="card-title">Export Data to File</div>
      <p class="muted" style="margin-bottom:1.25rem">Download all records for the selected entity in CSV, JSON, or XML format.</p>

      <div class="export-grid">
        <div *ngFor="let e of entityTypes" class="export-card">
          <div class="export-entity-name">{{ entityIcon(e) }} {{ e }}</div>
          <div class="export-actions">
            <button class="btn-export" (click)="runExport(e, 'Csv')">⬇️ CSV</button>
            <button class="btn-export" (click)="runExport(e, 'Json')">⬇️ JSON</button>
            <button class="btn-export btn-export-xml" (click)="runExport(e, 'Xml')">⬇️ XML</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════ HISTORY ══════════════════════════════ -->
  <div *ngIf="activeTab === 'history'" class="tab-content">
    <div class="toolbar">
      <button class="btn-ghost" (click)="loadJobs()">🔄 Refresh</button>
    </div>

    <div *ngIf="selectedHistoryJob" class="detail-panel">
      <div class="detail-header">
        <strong>{{ selectedHistoryJob.entityType }} — {{ selectedHistoryJob.fileName }}</strong>
        <button class="btn-ghost" (click)="selectedHistoryJob = null; historyRows = []">✕ Close</button>
      </div>
      <div class="staged-stats" style="margin-bottom:.75rem">
        <div class="stat-box stat-total"><span class="stat-num">{{ selectedHistoryJob.stagedRows }}</span><span class="stat-label">Staged</span></div>
        <div class="stat-box stat-valid"><span class="stat-num">{{ selectedHistoryJob.validRows }}</span><span class="stat-label">Valid</span></div>
        <div class="stat-box stat-invalid"><span class="stat-num">{{ selectedHistoryJob.invalidRows }}</span><span class="stat-label">Invalid</span></div>
        <div class="stat-box stat-promoted"><span class="stat-num">{{ selectedHistoryJob.promotedRows }}</span><span class="stat-label">Promoted</span></div>
      </div>
      <div *ngIf="historyRows.length" class="row-result-list">
        <div *ngFor="let r of historyRows" class="row-result"
             [class.row-ok]="r.status === 'Promoted' || r.status === 'Valid'"
             [class.row-err]="r.status === 'Invalid'">
          <span class="row-num">Row {{ r.rowNumber }}</span>
          <span class="status-mini" [ngClass]="'status-mini-' + r.status">{{ r.status }}</span>
          <span *ngIf="r.errorMessage" class="err-msg">{{ r.errorMessage }}</span>
        </div>
      </div>
      <div *ngIf="!historyRows.length && !loadingRows" class="muted-center">No row details available.</div>
      <div *ngIf="loadingRows" class="muted-center">Loading…</div>
    </div>

    <table class="data-table" *ngIf="jobs().length">
      <thead>
        <tr>
          <th>Created</th>
          <th>Entity</th>
          <th>Format</th>
          <th>File</th>
          <th>Source</th>
          <th>Status</th>
          <th class="num">Staged</th>
          <th class="num" style="color:#16a34a">Valid</th>
          <th class="num" style="color:#dc2626">Invalid</th>
          <th class="num" style="color:#2563eb">Promoted</th>
          <th>Completed</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let j of jobs()" (click)="selectHistoryJob(j)" style="cursor:pointer">
          <td>{{ j.createdAt | date:'MMM d, HH:mm' }}</td>
          <td>{{ entityIcon(j.entityType) }} {{ j.entityType }}</td>
          <td><span class="format-badge" [ngClass]="'fmt-' + j.fileFormat">{{ j.fileFormat }}</span></td>
          <td class="file-cell" [title]="j.fileName">{{ j.fileName }}</td>
          <td><span class="source-badge">{{ j.triggeredBy }}</span></td>
          <td><span class="status-badge" [ngClass]="statusClass(j.status)">{{ statusIcon(j.status) }} {{ j.status }}</span></td>
          <td class="num">{{ j.stagedRows || j.totalRows }}</td>
          <td class="num ok-num">{{ j.validRows }}</td>
          <td class="num err-num">{{ j.invalidRows > 0 ? j.invalidRows : '' }}</td>
          <td class="num promoted-num">{{ j.promotedRows }}</td>
          <td>{{ j.completedAt | date:'HH:mm:ss' }}</td>
          <td><button class="btn-ghost" style="font-size:.7rem" (click)="$event.stopPropagation(); selectHistoryJob(j)">Details</button></td>
        </tr>
      </tbody>
    </table>
    <div *ngIf="!jobs().length" class="empty mt">No import jobs yet.</div>
  </div>
</div>
  `,
  styles: [`
    .page { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .page-title  { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .page-sub    { color: #64748b; font-size: .875rem; margin-top: .25rem; }

    .tabs { display: flex; gap: .5rem; margin-bottom: 1.25rem; }
    .tab  { padding: .5rem 1rem; border: none; border-radius: 6px; background: #e2e8f0;
            color: #475569; cursor: pointer; font-size: .875rem; font-weight: 500; }
    .tab.active { background: #3b82f6; color: #fff; }

    .card { background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 1.5rem; margin-bottom: 1rem; }
    .card-title { font-weight: 700; font-size: 1rem; color: #0f172a; margin-bottom: 1.25rem; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .field label { display: block; font-size: .8rem; font-weight: 600; color: #374151; margin-bottom: .3rem; }
    .select-input { width: 100%; padding: .45rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; }

    /* Mode toggle */
    .mode-toggle { display: flex; gap: .75rem; margin-bottom: 1rem; }
    .mode-opt { display: flex; gap: .75rem; align-items: flex-start; padding: .75rem 1rem; border: 2px solid #e2e8f0;
                border-radius: 8px; cursor: pointer; flex: 1; transition: border-color .15s; }
    .mode-opt.active { border-color: #3b82f6; background: #eff6ff; }
    .mode-radio { width: 14px; height: 14px; border: 2px solid #d1d5db; border-radius: 50%; margin-top: 3px; flex-shrink: 0; }
    .mode-opt.active .mode-radio { border-color: #3b82f6; background: #3b82f6; }
    .mode-opt strong { display: block; font-size: .85rem; color: #1e293b; }
    .mode-desc { font-size: .75rem; color: #64748b; margin-top: 2px; display: block; }

    .template-row { font-size: .8rem; color: #64748b; margin-bottom: 1rem; }
    .btn-link { background: none; border: none; color: #3b82f6; cursor: pointer; font-size: .8rem; text-decoration: underline; }

    .drop-zone {
      border: 2px dashed #d1d5db; border-radius: 10px; padding: 2rem 1rem;
      text-align: center; color: #64748b; margin-bottom: 1rem; transition: border-color .2s;
    }
    .drop-zone.drag-over { border-color: #3b82f6; background: #eff6ff; }
    .drop-zone p { margin: .3rem 0; font-size: .9rem; }
    .muted { color: #94a3b8; font-size: .8rem; }
    .muted-center { text-align: center; color: #94a3b8; padding: 1rem; font-size: .8rem; }
    .file-selected { display: flex; align-items: center; gap: .75rem; justify-content: center; }
    .file-icon { font-size: 1.5rem; }

    .import-actions { display: flex; gap: .75rem; margin-bottom: 1rem; }
    .btn-primary { padding: .5rem 1.25rem; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: .875rem; }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-ghost { padding: .4rem .8rem; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: .8rem; }
    .btn-primary-sm { padding: .4rem .9rem; background: #3b82f6; color: #fff; border: none; border-radius: 6px; font-size: .8rem; font-weight: 600; }
    .btn-promote { padding: .5rem 1.25rem; background: #16a34a; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: .875rem; }
    .btn-promote:disabled { opacity: .6; cursor: not-allowed; }

    /* Staged panel */
    .staged-panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin-top: 1rem; }
    .staged-header { margin-bottom: 1rem; }
    .staged-title { font-weight: 600; font-size: .9rem; color: #1e293b; }
    .staged-stats { display: flex; gap: .75rem; margin-bottom: 1rem; }
    .stat-box { flex: 1; padding: .75rem; border-radius: 8px; text-align: center; }
    .stat-total    { background: #e0f2fe; }
    .stat-valid    { background: #dcfce7; }
    .stat-invalid  { background: #fee2e2; }
    .stat-promoted { background: #dbeafe; }
    .stat-num   { display: block; font-size: 1.4rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: .7rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .invalid-title { font-size: .8rem; font-weight: 600; color: #92400e; margin-bottom: .5rem; }
    .promote-actions { display: flex; gap: .75rem; margin-top: 1rem; }
    .invalid-rows { margin-bottom: .75rem; }

    .result-panel { padding: 1rem; border-radius: 8px; margin-top: 1rem; border: 1px solid; }
    .result-success { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
    .result-partial  { background: #fffbeb; border-color: #fde68a; color: #92400e; }
    .result-error    { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    .result-header   { display: flex; align-items: center; gap: .5rem; }
    .result-icon     { font-size: 1.2rem; }
    .error-summary   { font-size: .8rem; margin-top: .5rem; color: inherit; opacity: .8; }

    .row-results { margin-top: 1rem; }
    .row-results-title { font-weight: 600; font-size: .85rem; color: #374151; margin-bottom: .5rem; display: flex; align-items: center; gap: .5rem; }
    .row-result-list { max-height: 260px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 6px; }
    .row-result { display: flex; align-items: center; gap: .75rem; padding: .35rem .75rem; font-size: .8rem; border-bottom: 1px solid #f1f5f9; }
    .row-ok { background: #f0fdf4; } .row-err { background: #fef2f2; }
    .row-num { color: #94a3b8; font-variant-numeric: tabular-nums; min-width: 3.5rem; flex-shrink: 0; }
    .ok-mark { color: #16a34a; } .err-msg { color: #dc2626; flex: 1; }

    /* Export */
    .export-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .export-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; text-align: center; }
    .export-entity-name { font-weight: 600; font-size: .9rem; color: #1e293b; margin-bottom: .75rem; }
    .export-actions { display: flex; gap: .5rem; justify-content: center; flex-wrap: wrap; }
    .btn-export { padding: .35rem .7rem; background: #f1f5f9; border: 1px solid #d1d5db; border-radius: 5px; cursor: pointer; font-size: .8rem; color: #374151; }
    .btn-export:hover { background: #e2e8f0; }
    .btn-export-xml { background: #fef3c7; border-color: #fde68a; color: #92400e; }
    .btn-export-xml:hover { background: #fde68a; }

    /* History */
    .toolbar { display: flex; gap: .75rem; margin-bottom: 1rem; }
    .data-table { width: 100%; border-collapse: collapse; font-size: .8rem; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
    .data-table th { padding: .55rem .65rem; background: #f8fafc; color: #475569; text-align: left; font-weight: 600; border-bottom: 1px solid #e2e8f0; font-size: .75rem; }
    .data-table td { padding: .5rem .65rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .data-table tr:hover td { background: #f8fafc; }
    .num { text-align: right; }
    .ok-num { color: #16a34a; } .err-num { color: #dc2626; } .promoted-num { color: #2563eb; }
    .file-cell { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #64748b; font-size: .73rem; }

    .format-badge { border-radius: 4px; padding: .1rem .4rem; font-size: .7rem; font-weight: 600; }
    .fmt-Csv  { background: #e0f2fe; color: #0369a1; }
    .fmt-Json { background: #dcfce7; color: #166534; }
    .fmt-Xml  { background: #fef3c7; color: #92400e; }
    .source-badge { background: #f3f4f6; color: #374151; border-radius: 4px; padding: .1rem .4rem; font-size: .7rem; }
    .status-badge { padding: .2rem .5rem; border-radius: 4px; font-size: .75rem; font-weight: 600; }
    .status-Completed      { background: #dcfce7; color: #166534; }
    .status-PartialSuccess { background: #fef3c7; color: #92400e; }
    .status-Failed         { background: #fee2e2; color: #991b1b; }
    .status-Queued         { background: #e0f2fe; color: #075985; }
    .status-Processing     { background: #ede9fe; color: #5b21b6; }

    .badge-green { background: #dcfce7; color: #166534; border-radius: 4px; padding: .1rem .4rem; font-size: .75rem; }
    .badge-red   { background: #fee2e2; color: #991b1b; border-radius: 4px; padding: .1rem .4rem; font-size: .75rem; }
    .empty.mt { margin-top: 2rem; text-align: center; color: #94a3b8; }

    /* Detail panel (history drilldown) */
    .detail-panel { background: #fff; border: 1px solid #3b82f6; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .status-mini { font-size: .7rem; font-weight: 600; padding: .1rem .35rem; border-radius: 3px; flex-shrink: 0; }
    .status-mini-Promoted { background: #dbeafe; color: #1d4ed8; }
    .status-mini-Valid    { background: #dcfce7; color: #166534; }
    .status-mini-Invalid  { background: #fee2e2; color: #991b1b; }
    .status-mini-Pending  { background: #f3f4f6; color: #374151; }
    .status-mini-Skipped  { background: #fef3c7; color: #92400e; }
  `]
})
export class DataManagementComponent implements OnInit {
  activeTab: Tab = 'import';
  entityTypes = ENTITY_TYPES;
  fileFormats  = FILE_FORMATS;

  // Import state
  importEntityType = 'Vendor';
  importFileFormat = 'Csv';
  importMode: ImportMode = 'immediate';
  selectedFile: File | null = null;
  detectedImportType = '';
  dragging  = false;
  importing = false;
  promoting = false;
  lastJob:   ImportJob | null = null;
  stagedJob: ImportJob | null = null;
  rowResults: RowResult[] = [];
  stagedRows: ImportJobRow[] = [];
  loadingRows = false;

  // History state
  jobs = signal<ImportJob[]>([]);
  retailStatements = signal<RetailStatement[]>([]);
  retailSettlements = signal<RetailSettlement[]>([]);
  retailStaging = signal<RetailStaging[]>([]);
  selectedHistoryJob: ImportJob | null = null;
  historyRows: ImportJobRow[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadJobs(); }

  setTab(t: Tab) {
    this.activeTab = t;
    if (t === 'history') this.loadJobs();
    if (t === 'retail') this.loadRetail();
  }

  loadJobs() {
    this.api.getImportJobs().subscribe(list => this.jobs.set(list));
  }

  loadRetail() {
    this.api.getRetailStaging().subscribe(rows => this.retailStaging.set(rows));
    this.api.getRetailStatements().subscribe(rows => this.retailStatements.set(rows));
    this.api.getRetailSettlements().subscribe(rows => this.retailSettlements.set(rows));
  }

  postStatement(statement: RetailStatement) {
    this.api.postRetailStatement(statement.id).subscribe({
      next: () => this.loadRetail(),
      error: err => alert('Posting failed: ' + (err.error?.error ?? err.message))
    });
  }

  promoteStaged(staging: RetailStaging) {
    this.api.promoteRetailStaging(staging.id, true).subscribe({
      next: () => this.loadRetail(),
      error: err => alert('Promotion failed: ' + (err.error?.error ?? err.message))
    });
  }

  // ── File helpers ───────────────────────────────────────────────────────────

  fileAccept(): string {
    if (this.importEntityType !== 'RetailTransaction') return '.csv,.json,.xml';
    switch (this.importFileFormat) {
      case 'Json': return '.json';
      case 'Xml':  return '.xml';
      default:     return '.csv';
    }
  }

  formatLabel(): string {
    return this.importFileFormat.toUpperCase();
  }

  onEntityTypeChange(entityType: string) {
    if (entityType === 'RetailTransaction') {
      this.importFileFormat = 'Xml';
      this.importMode = 'immediate';
    }
  }

  async onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) await this.selectFile(input.files[0]);
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) await this.selectFile(file);
  }

  private async selectFile(file: File) {
    this.selectedFile = file;
    this.detectedImportType = '';

    if (!file.name.toLowerCase().endsWith('.xml')) return;

    const sample = await file.slice(0, 128 * 1024).text();
    const isRetailPosLog =
      /<(?:[\w.-]+:)?TransactionDomainSpecific\b/i.test(sample) &&
      /\bTypeCode\s*=\s*["']RetailTransaction["']/i.test(sample);

    if (isRetailPosLog) {
      this.importEntityType = 'RetailTransaction';
      this.importFileFormat = 'Xml';
      this.importMode = 'immediate';
      this.detectedImportType =
        'Retail POSLog detected. It will be imported and posted as a retail transaction.';
    }
  }

  clearFile() {
    this.selectedFile = null;
    this.detectedImportType = '';
    this.lastJob      = null;
    this.stagedJob    = null;
    this.rowResults   = [];
    this.stagedRows   = [];
  }

  // ── Import ─────────────────────────────────────────────────────────────────

  runImport() {
    if (!this.selectedFile || this.importing) return;
    this.importing  = true;
    this.lastJob    = null;
    this.stagedJob  = null;
    this.rowResults = [];
    this.stagedRows = [];

    if (this.importEntityType === 'RetailTransaction') {
      if (this.importFileFormat !== 'Xml') {
        alert('Retail transaction POSLog imports require XML format.');
        this.importing = false;
        return;
      }
      const promoteNow = this.importMode === 'immediate';
      this.api.uploadRetailPosLog(this.selectedFile, promoteNow).subscribe({
        next: result => {
          if ('status' in result) {
            alert(`Retail transaction ${result.transactionNumber} staged with status ${result.status}.`);
          } else {
            const lineResult =
              `${result.matchedLines} inventory line(s) matched, ${result.unmatchedLines} unmatched`;
            alert(result.duplicate
              ? `Transaction ${result.transactionNumber} was already promoted.`
              : `Retail transaction ${result.transactionNumber} staged, promoted, and posted. ${lineResult}.`);
          }
          this.importing = false;
          this.clearFile();
          this.loadRetail();
        },
        error: err => {
          alert('Retail import failed: ' +
            (err.error?.error ?? err.error?.validationMessage ?? err.message));
          this.importing = false;
        }
      });
      return;
    }

    if (this.importMode === 'immediate') {
      this.api.uploadImport(this.selectedFile, this.importEntityType, this.importFileFormat).subscribe({
        next: res => {
          this.lastJob   = res.job;
          this.rowResults = res.rowResults ?? [];
          this.importing  = false;
          this.loadJobs();
        },
        error: err => {
          alert('Import failed: ' + (err.error?.error ?? err.message));
          this.importing = false;
        }
      });
    } else {
      // Stage + validate only
      this.api.stageImport(this.selectedFile, this.importEntityType, this.importFileFormat).subscribe({
        next: res => {
          this.stagedJob = res.job;
          this.importing = false;
          this.loadStagedRows(res.job.id);
        },
        error: err => {
          alert('Staging failed: ' + (err.error?.error ?? err.message));
          this.importing = false;
        }
      });
    }
  }

  private loadStagedRows(jobId: string) {
    this.loadingRows = true;
    this.api.getImportJobRows(jobId).subscribe({
      next: rows => { this.stagedRows = rows; this.loadingRows = false; },
      error: ()  => { this.loadingRows = false; }
    });
  }

  promote() {
    if (!this.stagedJob || this.promoting) return;
    this.promoting = true;
    this.api.promoteImport(this.stagedJob.id).subscribe({
      next: res => {
        this.lastJob   = res.job;
        this.stagedJob = res.job;
        this.promoting = false;
        this.loadJobs();
      },
      error: err => {
        alert('Promote failed: ' + (err.error?.error ?? err.message));
        this.promoting = false;
      }
    });
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  runExport(entityType: string, fileFormat: string) {
    this.api.exportData(entityType, fileFormat).subscribe({
      next: res => {
        const ext = fileFormat === 'Json' ? 'json' : fileFormat === 'Xml' ? 'xml' : 'csv';
        const cd  = res.headers.get('content-disposition') ?? '';
        const match = cd.match(/filename[^;=\n]*=([^;\n]*)/);
        const fileName = match?.[1]?.trim().replace(/['"]/g, '')
          ?? `${entityType.toLowerCase()}_export.${ext}`;
        this.triggerDownload(res.body!, fileName);
      },
      error: () => alert('Export failed. Please try again.')
    });
  }

  downloadTemplate() {
    this.api.downloadTemplate(this.importEntityType, this.importFileFormat).subscribe({
      next: res => {
        const ext = this.importFileFormat === 'Json' ? 'json'
                  : this.importFileFormat === 'Xml'  ? 'xml' : 'csv';
        const fileName = `${this.importEntityType.toLowerCase()}_template.${ext}`;
        this.triggerDownload(res.body!, fileName);
      },
      error: () => alert('Could not download template.')
    });
  }

  private triggerDownload(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── History drilldown ──────────────────────────────────────────────────────

  selectHistoryJob(job: ImportJob) {
    this.selectedHistoryJob = job;
    this.historyRows        = [];
    this.loadingRows        = true;
    this.api.getImportJobRows(job.id).subscribe({
      next: rows => { this.historyRows = rows; this.loadingRows = false; },
      error: ()  => { this.loadingRows = false; }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  invalidStagedRows(): ImportJobRow[] {
    return this.stagedRows.filter(r => r.status === 'Invalid');
  }

  statusIcon(status: string): string {
    const map: Record<string, string> = {
      Completed: '✅', PartialSuccess: '⚠️', Failed: '❌', Queued: '⏳', Processing: '⚡'
    };
    return map[status] ?? '•';
  }

  statusClass(status: string): Record<string, boolean> {
    return { [`status-${status}`]: true };
  }

  entityIcon(e: string): string {
    const map: Record<string, string> = {
      Vendor: '🏭', Product: '🛍️', SalesOrder: '📦', PurchaseOrder: '🧾'
    };
    return map[e] ?? '📄';
  }

  get successCount(): number { return this.rowResults.filter(r =>  r.success).length; }
  get failCount():    number { return this.rowResults.filter(r => !r.success).length; }
}
