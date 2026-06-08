import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { OrgService } from '../../core/services/org.service';

@Component({
  selector: 'app-fixed-assets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="module-container">
  <div class="module-header">
    <h1>📦 Fixed Assets</h1>
    <div class="header-actions">
      <button class="btn-primary" (click)="openCreateModal()">+ New Asset</button>
      <button class="btn-secondary" (click)="runBulkDepr()">▶ Run Depreciation</button>
    </div>
  </div>

  <!-- Stats bar -->
  <div class="stats-bar" *ngIf="stats">
    <div class="stat-card">
      <div class="stat-label">Total Assets</div>
      <div class="stat-value">{{ stats.totalAssets }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Active</div>
      <div class="stat-value green">{{ stats.activeAssets }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Fully Depreciated</div>
      <div class="stat-value orange">{{ stats.fullyDepreciatedAssets }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Cost</div>
      <div class="stat-value">{{ stats.totalAcquisitionCost | number:'1.0-0' }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Net Book Value</div>
      <div class="stat-value">{{ stats.totalNetBookValue | number:'1.0-0' }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Acc. Depreciation</div>
      <div class="stat-value red">{{ stats.totalAccumulatedDepreciation | number:'1.0-0' }}</div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button [class.active]="tab==='assets'" (click)="tab='assets'">Assets</button>
    <button [class.active]="tab==='disposals'" (click)="tab='disposals'; loadDisposals()">Disposals</button>
    <button [class.active]="tab==='transfers'" (click)="tab='transfers'; loadTransfers()">Transfers</button>
  </div>

  <!-- ── Assets Tab ── -->
  <div *ngIf="tab==='assets'">
    <div class="filter-bar">
      <select [(ngModel)]="filterCategory" (change)="loadAssets()">
        <option value="">All Categories</option>
        <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
      </select>
      <select [(ngModel)]="filterStatus" (change)="loadAssets()">
        <option value="">All Statuses</option>
        <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
      </select>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th><th>Name</th><th>Category</th><th>Status</th>
            <th>Acquisition Date</th><th>Cost</th><th>Acc. Depr.</th>
            <th>Net Book Value</th><th>Method</th><th>Location</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let a of assets">
            <td><strong>{{ a.assetCode }}</strong></td>
            <td>{{ a.assetName }}</td>
            <td><span class="badge">{{ a.category }}</span></td>
            <td><span [class]="statusClass(a.status)">{{ a.status }}</span></td>
            <td>{{ a.acquisitionDate | date:'mediumDate' }}</td>
            <td>{{ a.acquisitionCost | number:'1.2-2' }}</td>
            <td class="red">{{ a.accumulatedDepreciation | number:'1.2-2' }}</td>
            <td><strong>{{ a.netBookValue | number:'1.2-2' }}</strong></td>
            <td>{{ a.depreciationMethod }}</td>
            <td>{{ a.location || '—' }}</td>
            <td class="actions">
              <button class="btn-sm" (click)="viewDetail(a)">Detail</button>
              <button class="btn-sm btn-warn" (click)="openDeprModal(a)" *ngIf="a.status === 'Active'">Depreciate</button>
              <button class="btn-sm btn-danger" (click)="openDisposeModal(a)" *ngIf="a.status !== 'Disposed'">Dispose</button>
            </td>
          </tr>
          <tr *ngIf="assets.length === 0">
            <td colspan="11" class="empty-state">No assets found. Click "+ New Asset" to get started.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── Disposals Tab ── -->
  <div *ngIf="tab==='disposals'">
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Asset Code</th><th>Asset Name</th><th>Disposal Date</th>
            <th>Type</th><th>Proceeds</th><th>NBV at Disposal</th>
            <th>Gain / Loss</th><th>Disposed By</th><th>Buyer</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let d of disposals">
            <td>{{ d.assetCode }}</td>
            <td>{{ d.assetName }}</td>
            <td>{{ d.disposalDate | date:'mediumDate' }}</td>
            <td><span class="badge">{{ d.disposalType }}</span></td>
            <td>{{ d.disposalProceeds | number:'1.2-2' }}</td>
            <td>{{ d.netBookValueAtDisposal | number:'1.2-2' }}</td>
            <td [class]="d.gainLoss >= 0 ? 'green' : 'red'">{{ d.gainLoss | number:'1.2-2' }}</td>
            <td>{{ d.disposedBy }}</td>
            <td>{{ d.buyerName || '—' }}</td>
          </tr>
          <tr *ngIf="disposals.length === 0">
            <td colspan="9" class="empty-state">No disposals recorded.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── Transfers Tab ── -->
  <div *ngIf="tab==='transfers'">
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Asset Code</th><th>Asset Name</th><th>Transfer Date</th>
            <th>From</th><th>To</th><th>Transferred By</th><th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of transfers">
            <td>{{ t.assetCode }}</td>
            <td>{{ t.assetName }}</td>
            <td>{{ t.transferDate | date:'mediumDate' }}</td>
            <td>{{ t.fromLocation }}</td>
            <td>{{ t.toLocation }}</td>
            <td>{{ t.transferredBy }}</td>
            <td>{{ t.notes || '—' }}</td>
          </tr>
          <tr *ngIf="transfers.length === 0">
            <td colspan="7" class="empty-state">No transfers recorded.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ══ Asset Detail Panel ══ -->
  <div class="side-panel" *ngIf="selectedAsset">
    <div class="panel-header">
      <h3>{{ selectedAsset.assetCode }} — {{ selectedAsset.assetName }}</h3>
      <button (click)="selectedAsset = null">✕</button>
    </div>
    <div class="panel-body">
      <div class="info-grid">
        <label>Category</label><span>{{ selectedAsset.category }}</span>
        <label>Status</label><span [class]="statusClass(selectedAsset.status)">{{ selectedAsset.status }}</span>
        <label>Acquisition Date</label><span>{{ selectedAsset.acquisitionDate | date:'mediumDate' }}</span>
        <label>Acquisition Cost</label><span>{{ selectedAsset.acquisitionCost | number:'1.2-2' }}</span>
        <label>Salvage Value</label><span>{{ selectedAsset.salvageValue | number:'1.2-2' }}</span>
        <label>Useful Life</label><span>{{ selectedAsset.usefulLifeYears }} years</span>
        <label>Depr. Method</label><span>{{ selectedAsset.depreciationMethod }}</span>
        <label>Acc. Depreciation</label><span class="red">{{ selectedAsset.accumulatedDepreciation | number:'1.2-2' }}</span>
        <label>Net Book Value</label><span><strong>{{ selectedAsset.netBookValue | number:'1.2-2' }}</strong></span>
        <label>Location</label><span>{{ selectedAsset.location || '—' }}</span>
        <label>Serial #</label><span>{{ selectedAsset.serialNumber || '—' }}</span>
        <label>Supplier</label><span>{{ selectedAsset.supplier || '—' }}</span>
        <label>PO Ref</label><span>{{ selectedAsset.purchaseOrderRef || '—' }}</span>
      </div>

      <div class="section-divider">Depreciation History ({{ selectedAsset.depreciationEntries?.length || 0 }} entries)</div>
      <div class="table-container" style="max-height:220px;overflow-y:auto" *ngIf="selectedAsset.depreciationEntries?.length">
        <table class="data-table compact">
          <thead><tr><th>Date</th><th>Amount</th><th>NBV After</th><th>Ref</th><th>By</th></tr></thead>
          <tbody>
            <tr *ngFor="let d of selectedAsset.depreciationEntries">
              <td>{{ d.date | date:'mediumDate' }}</td>
              <td>{{ d.amount | number:'1.2-2' }}</td>
              <td>{{ d.runningNBV | number:'1.2-2' }}</td>
              <td>{{ d.reference || '—' }}</td>
              <td>{{ d.postedBy }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section-divider">Maintenance ({{ selectedAsset.maintenanceRecords?.length || 0 }})</div>
      <div class="table-container" style="max-height:180px;overflow-y:auto" *ngIf="selectedAsset.maintenanceRecords?.length">
        <table class="data-table compact">
          <thead><tr><th>Date</th><th>Type</th><th>Cost</th><th>Capitalised</th><th>Vendor</th></tr></thead>
          <tbody>
            <tr *ngFor="let m of selectedAsset.maintenanceRecords">
              <td>{{ m.maintenanceDate | date:'mediumDate' }}</td>
              <td>{{ m.maintenanceType }}</td>
              <td>{{ m.cost | number:'1.2-2' }}</td>
              <td>{{ m.capitalizeCost ? 'Yes' : 'No' }}</td>
              <td>{{ m.vendor || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="panel-actions">
        <button class="btn-secondary" (click)="loadSchedule(selectedAsset)">View Depr. Schedule</button>
        <button class="btn-secondary" (click)="openTransferModal(selectedAsset)">Transfer</button>
        <button class="btn-secondary" (click)="openMaintenanceModal(selectedAsset)">Add Maintenance</button>
      </div>
    </div>
  </div>

  <!-- Depreciation Schedule Modal -->
  <div class="modal-overlay" *ngIf="showSchedule && schedule.length">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h3>Depreciation Schedule</h3>
        <button (click)="showSchedule=false">✕</button>
      </div>
      <div class="modal-body" style="max-height:500px;overflow-y:auto">
        <table class="data-table compact">
          <thead>
            <tr><th>#</th><th>Year</th><th>Month</th><th>Depreciation</th><th>Acc. Depr.</th><th>NBV</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of schedule.slice(0, 120)">
              <td>{{ r.period }}</td>
              <td>{{ r.year }}</td>
              <td>{{ r.month }}</td>
              <td>{{ r.depreciationAmount | number:'1.2-2' }}</td>
              <td>{{ r.accumulatedDepreciation | number:'1.2-2' }}</td>
              <td>{{ r.netBookValue | number:'1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" (click)="showSchedule=false">Close</button>
      </div>
    </div>
  </div>

  <!-- Create Asset Modal -->
  <div class="modal-overlay" *ngIf="showCreateModal">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h3>New Fixed Asset</h3>
        <button (click)="showCreateModal=false">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group"><label>Asset Code *</label><input [(ngModel)]="newAsset.assetCode" placeholder="FA-00001"></div>
          <div class="form-group"><label>Asset Name *</label><input [(ngModel)]="newAsset.assetName" placeholder="e.g. Delivery Truck"></div>
          <div class="form-group"><label>Category *</label>
            <select [(ngModel)]="newAsset.category">
              <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group"><label>Acquisition Date *</label><input type="date" [(ngModel)]="newAsset.acquisitionDate"></div>
          <div class="form-group"><label>Acquisition Cost *</label><input type="number" [(ngModel)]="newAsset.acquisitionCost" min="0" step="0.01"></div>
          <div class="form-group"><label>Salvage Value</label><input type="number" [(ngModel)]="newAsset.salvageValue" min="0" step="0.01"></div>
          <div class="form-group"><label>Depreciation Method</label>
            <select [(ngModel)]="newAsset.depreciationMethod">
              <option *ngFor="let m of deprMethods" [value]="m">{{ m }}</option>
            </select>
          </div>
          <div class="form-group"><label>Useful Life (Years)</label><input type="number" [(ngModel)]="newAsset.usefulLifeYears" min="0" max="100"></div>
          <div class="form-group"><label>Depr. Start Date</label><input type="date" [(ngModel)]="newAsset.depreciationStartDate"></div>
          <div class="form-group"><label>Location</label><input [(ngModel)]="newAsset.location" placeholder="e.g. Warehouse A"></div>
          <div class="form-group"><label>Serial Number</label><input [(ngModel)]="newAsset.serialNumber"></div>
          <div class="form-group"><label>Supplier</label><input [(ngModel)]="newAsset.supplier"></div>
          <div class="form-group"><label>PO Reference</label><input [(ngModel)]="newAsset.purchaseOrderRef"></div>
          <div class="form-group form-full"><label>Description</label><textarea [(ngModel)]="newAsset.description" rows="2"></textarea></div>
        </div>
        <div class="error-msg" *ngIf="createError">{{ createError }}</div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" (click)="showCreateModal=false">Cancel</button>
        <button class="btn-primary" (click)="createAsset()" [disabled]="creating">{{ creating ? 'Creating…' : 'Create Asset' }}</button>
      </div>
    </div>
  </div>

  <!-- Depreciate Modal -->
  <div class="modal-overlay" *ngIf="showDeprModal">
    <div class="modal">
      <div class="modal-header">
        <h3>Run Depreciation — {{ deprTarget?.assetCode }}</h3>
        <button (click)="showDeprModal=false">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group"><label>Period (months)</label><input type="number" [(ngModel)]="deprForm.periodMonths" min="1" max="12"></div>
        <div class="form-group"><label>Posted By</label><input [(ngModel)]="deprForm.postedBy"></div>
        <div class="form-group"><label>Reference (e.g. FY2026-M06)</label><input [(ngModel)]="deprForm.reference"></div>
        <div *ngIf="deprTarget?.depreciationMethod === 'UnitsOfProduction'" class="form-group">
          <label>Units Produced</label><input type="number" [(ngModel)]="deprForm.unitsProduced" min="0">
        </div>
        <div class="error-msg" *ngIf="deprError">{{ deprError }}</div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" (click)="showDeprModal=false">Cancel</button>
        <button class="btn-primary" (click)="submitDepreciation()" [disabled]="deprLoading">{{ deprLoading ? 'Posting…' : 'Post Depreciation' }}</button>
      </div>
    </div>
  </div>

  <!-- Dispose Modal -->
  <div class="modal-overlay" *ngIf="showDisposeModal">
    <div class="modal">
      <div class="modal-header">
        <h3>Dispose Asset — {{ disposeTarget?.assetCode }}</h3>
        <button (click)="showDisposeModal=false">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group"><label>Disposal Date</label><input type="date" [(ngModel)]="disposeForm.disposalDate"></div>
        <div class="form-group"><label>Disposal Type</label>
          <select [(ngModel)]="disposeForm.disposalType">
            <option>Sale</option><option>Scrap</option><option>Donation</option><option>Write-off</option>
          </select>
        </div>
        <div class="form-group"><label>Proceeds</label><input type="number" [(ngModel)]="disposeForm.disposalProceeds" min="0" step="0.01"></div>
        <div class="form-group"><label>Disposed By</label><input [(ngModel)]="disposeForm.disposedBy"></div>
        <div class="form-group"><label>Buyer / Counterparty</label><input [(ngModel)]="disposeForm.buyerName"></div>
        <div class="form-group"><label>Reason</label><textarea [(ngModel)]="disposeForm.reason" rows="2"></textarea></div>
        <div class="error-msg" *ngIf="disposeError">{{ disposeError }}</div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" (click)="showDisposeModal=false">Cancel</button>
        <button class="btn-danger" (click)="submitDisposal()" [disabled]="disposeLoading">{{ disposeLoading ? 'Processing…' : 'Confirm Disposal' }}</button>
      </div>
    </div>
  </div>

  <!-- Transfer Modal -->
  <div class="modal-overlay" *ngIf="showTransferModal">
    <div class="modal">
      <div class="modal-header">
        <h3>Transfer Asset — {{ transferTarget?.assetCode }}</h3>
        <button (click)="showTransferModal=false">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group"><label>Transfer Date</label><input type="date" [(ngModel)]="transferForm.transferDate"></div>
        <div class="form-group"><label>To Location *</label><input [(ngModel)]="transferForm.toLocation"></div>
        <div class="form-group"><label>To Department</label><input [(ngModel)]="transferForm.toDepartment"></div>
        <div class="form-group"><label>Transferred By *</label><input [(ngModel)]="transferForm.transferredBy"></div>
        <div class="form-group"><label>Notes</label><textarea [(ngModel)]="transferForm.notes" rows="2"></textarea></div>
        <div class="error-msg" *ngIf="transferError">{{ transferError }}</div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" (click)="showTransferModal=false">Cancel</button>
        <button class="btn-primary" (click)="submitTransfer()" [disabled]="transferLoading">{{ transferLoading ? 'Transferring…' : 'Transfer' }}</button>
      </div>
    </div>
  </div>

  <!-- Maintenance Modal -->
  <div class="modal-overlay" *ngIf="showMaintenanceModal">
    <div class="modal">
      <div class="modal-header">
        <h3>Add Maintenance — {{ maintenanceTarget?.assetCode }}</h3>
        <button (click)="showMaintenanceModal=false">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group"><label>Maintenance Date</label><input type="date" [(ngModel)]="maintenanceForm.maintenanceDate"></div>
        <div class="form-group"><label>Type</label>
          <select [(ngModel)]="maintenanceForm.maintenanceType">
            <option>Routine</option><option>Repair</option><option>Overhaul</option><option>Upgrade</option>
          </select>
        </div>
        <div class="form-group"><label>Cost</label><input type="number" [(ngModel)]="maintenanceForm.cost" min="0" step="0.01"></div>
        <div class="form-group form-full">
          <label>
            <input type="checkbox" [(ngModel)]="maintenanceForm.capitalizeCost">
            Capitalise cost (add to asset value)
          </label>
        </div>
        <div class="form-group"><label>Vendor</label><input [(ngModel)]="maintenanceForm.vendor"></div>
        <div class="form-group"><label>Performed By</label><input [(ngModel)]="maintenanceForm.performedBy"></div>
        <div class="form-group"><label>Next Due Date</label><input type="date" [(ngModel)]="maintenanceForm.nextMaintenanceDue"></div>
        <div class="form-group form-full"><label>Description</label><textarea [(ngModel)]="maintenanceForm.description" rows="2"></textarea></div>
        <div class="error-msg" *ngIf="maintenanceError">{{ maintenanceError }}</div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" (click)="showMaintenanceModal=false">Cancel</button>
        <button class="btn-primary" (click)="submitMaintenance()" [disabled]="maintenanceLoading">{{ maintenanceLoading ? 'Saving…' : 'Save' }}</button>
      </div>
    </div>
  </div>

</div>
  `,
  styles: [`
    .module-container { padding: 24px; }
    .module-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .module-header h1 { margin:0; font-size:1.6rem; }
    .header-actions { display:flex; gap:8px; }
    .stats-bar { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
    .stat-card { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:12px 16px; min-width:120px; }
    .stat-label { font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px; }
    .stat-value { font-size:1.2rem; font-weight:600; }
    .tabs { display:flex; gap:4px; margin-bottom:16px; border-bottom:2px solid var(--border); }
    .tabs button { padding:8px 20px; border:none; background:none; cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; color:var(--text-secondary); }
    .tabs button.active { border-bottom-color:var(--primary); color:var(--primary); font-weight:600; }
    .filter-bar { display:flex; gap:8px; margin-bottom:12px; }
    .filter-bar select { padding:6px 10px; border:1px solid var(--border); border-radius:6px; background:var(--surface); }
    .table-container { overflow-x:auto; }
    .data-table { width:100%; border-collapse:collapse; font-size:0.85rem; }
    .data-table th { background:var(--surface); padding:10px 12px; text-align:left; font-weight:600; border-bottom:2px solid var(--border); }
    .data-table td { padding:10px 12px; border-bottom:1px solid var(--border); vertical-align:middle; }
    .data-table.compact th, .data-table.compact td { padding:6px 10px; }
    .data-table tr:hover td { background:var(--hover); }
    .badge { background:var(--surface); border:1px solid var(--border); padding:2px 8px; border-radius:12px; font-size:0.75rem; }
    .status-active { color:#16a34a; font-weight:600; }
    .status-fullyDepreciated { color:#d97706; font-weight:600; }
    .status-disposed { color:#6b7280; }
    .status-impaired { color:#dc2626; font-weight:600; }
    .status-underMaintenance { color:#2563eb; }
    .status-inactive { color:#9ca3af; }
    .green { color:#16a34a; }
    .red { color:#dc2626; }
    .orange { color:#d97706; }
    .actions { display:flex; gap:6px; flex-wrap:wrap; }
    .btn-primary { background:var(--primary); color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:500; }
    .btn-secondary { background:var(--surface); border:1px solid var(--border); padding:8px 16px; border-radius:6px; cursor:pointer; }
    .btn-danger { background:#dc2626; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; }
    .btn-sm { padding:4px 10px; border-radius:4px; border:1px solid var(--border); background:var(--surface); cursor:pointer; font-size:0.8rem; }
    .btn-warn { border-color:#d97706; color:#d97706; }
    .btn-danger { background:#dc2626; color:white; border:none; }
    .empty-state { text-align:center; color:var(--text-secondary); padding:32px; }
    .side-panel { position:fixed; right:0; top:60px; bottom:0; width:480px; background:var(--background); border-left:1px solid var(--border); overflow-y:auto; z-index:200; box-shadow:-4px 0 16px rgba(0,0,0,.1); }
    .panel-header { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid var(--border); }
    .panel-header h3 { margin:0; font-size:1rem; }
    .panel-header button { background:none; border:none; cursor:pointer; font-size:1.2rem; }
    .panel-body { padding:20px; }
    .info-grid { display:grid; grid-template-columns:140px 1fr; gap:8px 12px; margin-bottom:16px; font-size:0.875rem; }
    .info-grid label { color:var(--text-secondary); }
    .section-divider { font-weight:600; font-size:0.8rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.05em; margin:16px 0 8px; border-top:1px solid var(--border); padding-top:12px; }
    .panel-actions { display:flex; gap:8px; margin-top:16px; flex-wrap:wrap; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal { background:var(--background); border-radius:12px; width:520px; max-height:90vh; overflow-y:auto; }
    .modal-lg { width:720px; }
    .modal-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid var(--border); }
    .modal-header h3 { margin:0; }
    .modal-header button { background:none; border:none; cursor:pointer; font-size:1.2rem; }
    .modal-body { padding:20px 24px; }
    .modal-footer { display:flex; justify-content:flex-end; gap:8px; padding:16px 24px; border-top:1px solid var(--border); }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .form-full { grid-column:1/-1; }
    .form-group { display:flex; flex-direction:column; gap:4px; }
    .form-group label { font-size:0.8rem; font-weight:500; color:var(--text-secondary); }
    .form-group input, .form-group select, .form-group textarea { border:1px solid var(--border); border-radius:6px; padding:8px; background:var(--surface); font-size:0.875rem; width:100%; box-sizing:border-box; }
    .error-msg { color:#dc2626; font-size:0.85rem; margin-top:8px; }
  `]
})
export class FixedAssetsComponent implements OnInit {
  tab = 'assets';
  assets: any[] = [];
  disposals: any[] = [];
  transfers: any[] = [];
  stats: any = null;
  selectedAsset: any = null;
  schedule: any[] = [];
  showSchedule = false;

  filterCategory = '';
  filterStatus = '';

  categories = ['Land','Buildings','Machinery','Vehicles','Furniture','ComputerEquipment',
                 'IntangibleAssets','LeaseholdImprovements','OfficeEquipment','Other'];
  statuses = ['Active','UnderMaintenance','FullyDepreciated','Disposed','Impaired','Inactive'];
  deprMethods = ['StraightLine','DecliningBalance','DoubleDecliningBalance',
                  'UnitsOfProduction','SumOfYearsDigits','None'];

  // Create
  showCreateModal = false;
  creating = false;
  createError = '';
  newAsset: any = {};

  // Depreciation
  showDeprModal = false;
  deprTarget: any = null;
  deprLoading = false;
  deprError = '';
  deprForm: any = { periodMonths: 1, postedBy: 'System', reference: '', unitsProduced: null };

  // Dispose
  showDisposeModal = false;
  disposeTarget: any = null;
  disposeLoading = false;
  disposeError = '';
  disposeForm: any = {};

  // Transfer
  showTransferModal = false;
  transferTarget: any = null;
  transferLoading = false;
  transferError = '';
  transferForm: any = {};

  // Maintenance
  showMaintenanceModal = false;
  maintenanceTarget: any = null;
  maintenanceLoading = false;
  maintenanceError = '';
  maintenanceForm: any = {};

  constructor(private api: ApiService, private orgSvc: OrgService) {}

  ngOnInit() {
    this.loadAssets();
    this.loadStats();
  }

  loadAssets() {
    this.api.getFixedAssets(this.filterCategory || undefined, this.filterStatus || undefined)
      .subscribe({ next: d => this.assets = d, error: () => {} });
  }

  loadStats() {
    this.api.getFixedAssetStats().subscribe({ next: d => this.stats = d, error: () => {} });
  }

  loadDisposals() {
    this.api.getAssetDisposals().subscribe({ next: d => this.disposals = d, error: () => {} });
  }

  loadTransfers() {
    this.api.getAssetTransfers().subscribe({ next: d => this.transfers = d, error: () => {} });
  }

  viewDetail(a: any) {
    this.api.getFixedAsset(a.id).subscribe({ next: d => this.selectedAsset = d });
  }

  loadSchedule(a: any) {
    this.api.getDepreciationSchedule(a.id).subscribe({
      next: d => { this.schedule = d; this.showSchedule = true; }
    });
  }

  statusClass(s: string) {
    const map: any = {
      'Active': 'status-active', 'FullyDepreciated': 'status-fullyDepreciated',
      'Disposed': 'status-disposed', 'Impaired': 'status-impaired',
      'UnderMaintenance': 'status-underMaintenance', 'Inactive': 'status-inactive'
    };
    return map[s] || '';
  }

  openCreateModal() {
    const today = new Date().toISOString().slice(0, 10);
    this.newAsset = {
      assetCode: '', assetName: '', description: '', category: 'Machinery',
      acquisitionDate: today, acquisitionCost: 0, salvageValue: 0,
      depreciationMethod: 'StraightLine', usefulLifeYears: 5,
      depreciationStartDate: today, location: '', serialNumber: '', supplier: '', purchaseOrderRef: ''
    };
    this.createError = '';
    this.showCreateModal = true;
  }

  createAsset() {
    if (!this.newAsset.assetCode || !this.newAsset.assetName) {
      this.createError = 'Asset Code and Name are required.'; return;
    }
    this.creating = true; this.createError = '';
    this.api.createFixedAsset(this.newAsset).subscribe({
      next: () => {
        this.creating = false; this.showCreateModal = false;
        this.loadAssets(); this.loadStats();
      },
      error: (e: any) => { this.creating = false; this.createError = e?.error?.error || 'Error creating asset.'; }
    });
  }

  openDeprModal(a: any) {
    this.deprTarget = a;
    this.deprForm = { periodMonths: 1, postedBy: 'System', reference: '', unitsProduced: null };
    this.deprError = '';
    this.showDeprModal = true;
  }

  submitDepreciation() {
    this.deprLoading = true; this.deprError = '';
    this.api.runDepreciation(this.deprTarget.id, this.deprForm).subscribe({
      next: () => {
        this.deprLoading = false; this.showDeprModal = false;
        this.loadAssets(); this.loadStats();
        if (this.selectedAsset?.id === this.deprTarget.id) this.viewDetail(this.deprTarget);
      },
      error: (e: any) => { this.deprLoading = false; this.deprError = e?.error?.error || 'Error posting depreciation.'; }
    });
  }

  runBulkDepr() {
    const ref = prompt('Reference (e.g. FY2026-M06):');
    if (ref === null) return;
    this.api.runBulkDepreciation({ postedBy: 'System', reference: ref, periodMonths: 1 }).subscribe({
      next: (r: any) => { alert(r.messages?.[0] || 'Done'); this.loadAssets(); this.loadStats(); },
      error: (e: any) => alert(e?.error?.error || 'Error running bulk depreciation.')
    });
  }

  openDisposeModal(a: any) {
    const today = new Date().toISOString().slice(0, 10);
    this.disposeTarget = a;
    this.disposeForm = { disposalDate: today, disposalType: 'Sale', disposalProceeds: 0, disposedBy: '', buyerName: '', reason: '' };
    this.disposeError = '';
    this.showDisposeModal = true;
  }

  submitDisposal() {
    this.disposeLoading = true; this.disposeError = '';
    this.api.disposeAsset(this.disposeTarget.id, this.disposeForm).subscribe({
      next: () => {
        this.disposeLoading = false; this.showDisposeModal = false;
        this.loadAssets(); this.loadStats();
        if (this.selectedAsset?.id === this.disposeTarget.id) this.selectedAsset = null;
      },
      error: (e: any) => { this.disposeLoading = false; this.disposeError = e?.error?.error || 'Error processing disposal.'; }
    });
  }

  openTransferModal(a: any) {
    const today = new Date().toISOString().slice(0, 10);
    this.transferTarget = a;
    this.transferForm = { assetId: a.id, transferDate: today, toLocation: '', toDepartment: '', transferredBy: '', notes: '' };
    this.transferError = '';
    this.showTransferModal = true;
  }

  submitTransfer() {
    this.transferLoading = true; this.transferError = '';
    this.api.createAssetTransfer(this.transferForm).subscribe({
      next: () => {
        this.transferLoading = false; this.showTransferModal = false;
        this.loadAssets();
        if (this.selectedAsset?.id === this.transferTarget.id) this.viewDetail(this.transferTarget);
      },
      error: (e: any) => { this.transferLoading = false; this.transferError = e?.error?.error || 'Error creating transfer.'; }
    });
  }

  openMaintenanceModal(a: any) {
    const today = new Date().toISOString().slice(0, 10);
    this.maintenanceTarget = a;
    this.maintenanceForm = { assetId: a.id, maintenanceDate: today, maintenanceType: 'Routine', cost: 0, capitalizeCost: false, vendor: '', performedBy: '', description: '', nextMaintenanceDue: '' };
    this.maintenanceError = '';
    this.showMaintenanceModal = true;
  }

  submitMaintenance() {
    this.maintenanceLoading = true; this.maintenanceError = '';
    const payload = { ...this.maintenanceForm, nextMaintenanceDue: this.maintenanceForm.nextMaintenanceDue || null };
    this.api.addAssetMaintenance(payload).subscribe({
      next: () => {
        this.maintenanceLoading = false; this.showMaintenanceModal = false;
        this.loadAssets(); this.loadStats();
        if (this.selectedAsset?.id === this.maintenanceTarget.id) this.viewDetail(this.maintenanceTarget);
      },
      error: (e: any) => { this.maintenanceLoading = false; this.maintenanceError = e?.error?.error || 'Error saving maintenance.'; }
    });
  }
}
