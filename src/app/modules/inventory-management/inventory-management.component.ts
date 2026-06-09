import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="inv-shell">

  <!-- ── Page Header ──────────────────────────────────────────────────── -->
  <div class="page-header">
    <div class="page-title-row">
      <h1 class="page-title">Inventory Management</h1>
      <div class="header-actions">
        <button class="btn-secondary" (click)="loadAll()">↻ Refresh</button>
      </div>
    </div>

    <!-- Tab bar -->
    <div class="tab-bar">
      <button [class.active]="activeTab==='items'"       (click)="activeTab='items'">Stock Items</button>
      <button [class.active]="activeTab==='transactions'" (click)="activeTab='transactions';loadRecentTxns()">Recent Transactions</button>
      <button [class.active]="activeTab==='low-stock'"   (click)="activeTab='low-stock';loadLowStock()">Low Stock</button>
      <button [class.active]="activeTab==='valuation'"   (click)="activeTab='valuation';loadValuation()">Valuation</button>
    </div>
  </div>

  <!-- ── Summary Cards ─────────────────────────────────────────────────── -->
  <div class="summary-cards" *ngIf="summary">
    <div class="card">
      <div class="card-value">{{ summary.totalSkus | number }}</div>
      <div class="card-label">Total SKUs</div>
    </div>
    <div class="card warning" (click)="filterItems('low-stock')">
      <div class="card-value">{{ summary.lowStockCount | number }}</div>
      <div class="card-label">Low Stock</div>
    </div>
    <div class="card danger" (click)="filterItems('out-of-stock')">
      <div class="card-value">{{ summary.outOfStockCount | number }}</div>
      <div class="card-label">Out of Stock</div>
    </div>
    <div class="card info" (click)="filterItems('on-order')">
      <div class="card-value">{{ summary.onOrderLines | number }}</div>
      <div class="card-label">SKUs On Order</div>
    </div>
    <div class="card success">
      <div class="card-value">{{ summary.totalStockValue | currency }}</div>
      <div class="card-label">Total Stock Value</div>
    </div>
  </div>

  <!-- ── STOCK ITEMS TAB ───────────────────────────────────────────────── -->
  <div *ngIf="activeTab==='items'">

    <!-- Toolbar -->
    <div class="toolbar">
      <input class="search-box" [(ngModel)]="searchTerm" (ngModelChange)="onSearch()"
             placeholder="Search by SKU or product name…" />
      <select class="filter-select" [(ngModel)]="filterMode" (change)="onFilterChange()">
        <option value="">All Items</option>
        <option value="low-stock">Low Stock</option>
        <option value="out-of-stock">Out of Stock</option>
        <option value="on-order">On Order</option>
      </select>
      <select class="filter-select" [(ngModel)]="categoryFilter" (change)="onFilterChange()">
        <option value="">All Categories</option>
        <option *ngFor="let option of filterOptions.categories" [value]="option">{{ option }}</option>
      </select>
      <select class="filter-select" [(ngModel)]="brandFilter" (change)="onFilterChange()">
        <option value="">All Brands</option>
        <option *ngFor="let option of filterOptions.brands" [value]="option">{{ option }}</option>
      </select>
      <select class="filter-select" [(ngModel)]="locationFilter" (change)="onFilterChange()">
        <option value="">All Locations</option>
        <option *ngFor="let option of filterOptions.locations" [value]="option">{{ option }}</option>
      </select>
      <select class="filter-select" [(ngModel)]="sortBy" (change)="onFilterChange()">
        <option value="sku">Sort: SKU</option>
        <option value="product">Sort: Product</option>
        <option value="onHand">Sort: On Hand</option>
        <option value="available">Sort: Available</option>
        <option value="value">Sort: Value</option>
      </select>
      <button class="btn-secondary" (click)="descending=!descending; onFilterChange()">
        {{ descending ? 'Descending' : 'Ascending' }}
      </button>
    </div>

    <!-- Items Table -->
    <div class="table-wrapper">
      <table class="inv-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th>Category</th>
            <th class="num-col">On Hand</th>
            <th class="num-col">Reserved</th>
            <th class="num-col">On Order</th>
            <th class="num-col">Available</th>
            <th class="num-col">Reorder Pt</th>
            <th class="num-col">Avg Cost</th>
            <th class="num-col">Value</th>
            <th class="num-col">Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of items" [class.row-danger]="item.isOutOfStock"
              [class.row-warning]="item.needsReorder && !item.isOutOfStock">
            <td class="sku-cell" (click)="selectItem(item)">{{ item.sku }}</td>
            <td>
              <div class="product-name">{{ item.productName }}</div>
              <div class="variant-desc" *ngIf="item.variantDescription">{{ item.variantDescription }}</div>
            </td>
            <td>{{ item.category || '—' }}</td>
            <td class="num-col">{{ item.onHand | number:'1.0-2' }}</td>
            <td class="num-col muted">{{ item.reserved | number:'1.0-2' }}</td>
            <td class="num-col">
              <span *ngIf="item.onOrder > 0" class="on-order-badge">{{ item.onOrder | number:'1.0-2' }}</span>
              <span *ngIf="item.onOrder === 0" class="muted">—</span>
            </td>
            <td class="num-col" [class.text-danger]="item.available <= 0">
              {{ item.available | number:'1.0-2' }}
            </td>
            <td class="num-col muted">{{ item.reorderPoint | number:'1.0-2' }}</td>
            <td class="num-col">{{ item.averageCost | currency }}</td>
            <td class="num-col">{{ item.stockValue | currency }}</td>
            <td class="num-col">
              <span class="status-chip" [class.chip-danger]="item.isOutOfStock"
                    [class.chip-warning]="item.needsReorder && !item.isOutOfStock"
                    [class.chip-ok]="!item.needsReorder && !item.isOutOfStock">
                {{ item.isOutOfStock ? 'Out of Stock' : item.needsReorder ? 'Low Stock' : 'OK' }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-xs" (click)="openAdjust(item)">Adjust</button>
                <button class="btn-xs btn-outline" (click)="openThresholds(item)">⚙</button>
                <button class="btn-xs btn-ghost" (click)="viewTransactions(item)">Ledger</button>
              </div>
            </td>
          </tr>
          <tr *ngIf="items.length === 0">
            <td colspan="12" class="empty-row">No inventory records found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <span>{{ totalCount | number }} items</span>
      <button class="btn-secondary" (click)="changePage(page - 1)" [disabled]="page <= 1">Previous</button>
      <span>Page {{ page }} of {{ totalPages || 1 }}</span>
      <button class="btn-secondary" (click)="changePage(page + 1)" [disabled]="page >= totalPages">Next</button>
      <select class="filter-select" [(ngModel)]="pageSize" (change)="changePageSize()">
        <option [ngValue]="25">25 per page</option>
        <option [ngValue]="50">50 per page</option>
        <option [ngValue]="100">100 per page</option>
        <option [ngValue]="200">200 per page</option>
      </select>
    </div>

    <!-- Detail Panel (selected item) -->
    <div class="detail-panel" *ngIf="selectedItem">
      <div class="detail-header">
        <div>
          <strong>{{ selectedItem.sku }}</strong> — {{ selectedItem.productName }}
          <span class="detail-variant" *ngIf="selectedItem.variantDescription">
            ({{ selectedItem.variantDescription }})
          </span>
        </div>
        <button class="btn-ghost btn-sm" (click)="selectedItem = null">✕ Close</button>
      </div>

      <!-- Quantity Grid -->
      <div class="qty-grid">
        <div class="qty-tile">
          <div class="qty-val">{{ selectedItem.onHand | number:'1.0-2' }}</div>
          <div class="qty-lbl">On Hand</div>
        </div>
        <div class="qty-tile">
          <div class="qty-val">{{ selectedItem.reserved | number:'1.0-2' }}</div>
          <div class="qty-lbl">Reserved</div>
        </div>
        <div class="qty-tile accent-blue">
          <div class="qty-val">{{ selectedItem.onOrder | number:'1.0-2' }}</div>
          <div class="qty-lbl">On Order</div>
        </div>
        <div class="qty-tile accent-green">
          <div class="qty-val">{{ selectedItem.available | number:'1.0-2' }}</div>
          <div class="qty-lbl">Available</div>
        </div>
        <div class="qty-tile">
          <div class="qty-val">{{ selectedItem.projected | number:'1.0-2' }}</div>
          <div class="qty-lbl">Projected</div>
        </div>
        <div class="qty-tile accent-amber">
          <div class="qty-val">{{ selectedItem.stockValue | currency }}</div>
          <div class="qty-lbl">Stock Value</div>
        </div>
      </div>

      <!-- Meta row -->
      <div class="detail-meta">
        <span>Location: <strong>{{ selectedItem.location || '—' }}</strong></span>
        <span>Avg Cost: <strong>{{ selectedItem.averageCost | currency }}</strong></span>
        <span>Reorder Pt: <strong>{{ selectedItem.reorderPoint }}</strong></span>
        <span>Last Received: <strong>{{ selectedItem.lastReceivedDate ? (selectedItem.lastReceivedDate | date:'mediumDate') : '—' }}</strong></span>
        <span>Last Count: <strong>{{ selectedItem.lastCountDate ? (selectedItem.lastCountDate | date:'mediumDate') : '—' }}</strong></span>
      </div>

      <!-- Transaction history for this SKU -->
      <div class="txn-section">
        <div class="section-label">Transaction History</div>
        <div class="txn-loading" *ngIf="txnsLoading">Loading…</div>
        <table class="txn-table" *ngIf="itemTransactions.length > 0">
          <thead>
            <tr>
              <th>Date</th><th>Type</th><th>Qty</th><th>Unit Cost</th><th>Balance</th><th>Reference</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of itemTransactions">
              <td>{{ t.transactionDate | date:'MMM d, y HH:mm' }}</td>
              <td><span class="txn-type" [class]="'txn-'+txnClass(t.transactionType)">{{ formatTxnType(t.transactionType) }}</span></td>
              <td [class.text-success]="t.quantity > 0" [class.text-danger]="t.quantity < 0">
                {{ t.quantity > 0 ? '+' : '' }}{{ t.quantity | number:'1.0-2' }}
              </td>
              <td>{{ t.unitCost | currency }}</td>
              <td>{{ t.balanceAfter | number:'1.0-2' }}</td>
              <td class="muted">{{ t.referenceNumber || '—' }}</td>
              <td class="muted">{{ t.notes || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="empty-row" *ngIf="!txnsLoading && itemTransactions.length === 0">No transactions yet.</div>
      </div>
    </div>
  </div>

  <!-- ── RECENT TRANSACTIONS TAB ───────────────────────────────────────── -->
  <div *ngIf="activeTab==='transactions'">
    <div class="table-wrapper">
      <table class="inv-table">
        <thead>
          <tr>
            <th>Date</th><th>SKU</th><th>Type</th><th class="num-col">Qty</th>
            <th class="num-col">Unit Cost</th><th class="num-col">Balance After</th>
            <th>Reference</th><th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of recentTransactions">
            <td>{{ t.transactionDate | date:'MMM d, y HH:mm' }}</td>
            <td class="sku-cell">{{ t.sku }}</td>
            <td><span class="txn-type" [class]="'txn-'+txnClass(t.transactionType)">{{ formatTxnType(t.transactionType) }}</span></td>
            <td class="num-col" [class.text-success]="t.quantity > 0" [class.text-danger]="t.quantity < 0">
              {{ t.quantity > 0 ? '+' : '' }}{{ t.quantity | number:'1.0-2' }}
            </td>
            <td class="num-col">{{ t.unitCost | currency }}</td>
            <td class="num-col">{{ t.balanceAfter | number:'1.0-2' }}</td>
            <td class="muted">{{ t.referenceNumber || '—' }}</td>
            <td class="muted">{{ t.notes || '—' }}</td>
          </tr>
          <tr *ngIf="recentTransactions.length === 0">
            <td colspan="8" class="empty-row">No transactions recorded yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── LOW STOCK TAB ─────────────────────────────────────────────────── -->
  <div *ngIf="activeTab==='low-stock'">
    <div class="table-wrapper">
      <table class="inv-table">
        <thead>
          <tr>
            <th>SKU</th><th>Product</th><th class="num-col">On Hand</th>
            <th class="num-col">Reorder Pt</th><th class="num-col">On Order</th>
            <th class="num-col">Shortfall</th><th>Preferred Vendor</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of lowStockItems"
              [class.row-danger]="item.onHand <= 0">
            <td class="sku-cell">{{ item.sku }}</td>
            <td>
              <div>{{ item.productName }}</div>
              <div class="variant-desc" *ngIf="item.variantDescription">{{ item.variantDescription }}</div>
            </td>
            <td class="num-col" [class.text-danger]="item.onHand <= 0">{{ item.onHand | number:'1.0-2' }}</td>
            <td class="num-col muted">{{ item.reorderPoint | number:'1.0-2' }}</td>
            <td class="num-col">
              <span *ngIf="item.onOrder > 0" class="on-order-badge">{{ item.onOrder | number:'1.0-2' }}</span>
              <span *ngIf="item.onOrder === 0" class="muted">—</span>
            </td>
            <td class="num-col text-danger">
              {{ (item.reorderPoint - item.onHand - item.onOrder) > 0 ? (item.reorderPoint - item.onHand - item.onOrder | number:'1.0-2') : '—' }}
            </td>
            <td class="muted">{{ item.preferredVendorName || '—' }}</td>
          </tr>
          <tr *ngIf="lowStockItems.length === 0">
            <td colspan="7" class="empty-row">✓ All items are above their reorder points.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── VALUATION TAB ─────────────────────────────────────────────────── -->
  <div *ngIf="activeTab==='valuation'">
    <div class="table-wrapper">
      <table class="inv-table valuation-table">
        <thead>
          <tr>
            <th>Category</th>
            <th class="num-col">SKUs</th>
            <th class="num-col">Total On Hand</th>
            <th class="num-col">Total Value</th>
            <th class="num-col">% of Total</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of valuationRows">
            <td><strong>{{ row.category }}</strong></td>
            <td class="num-col">{{ row.skuCount | number }}</td>
            <td class="num-col">{{ row.totalOnHand | number:'1.0-2' }}</td>
            <td class="num-col"><strong>{{ row.totalValue | currency }}</strong></td>
            <td class="num-col">
              <div class="val-bar-wrap">
                <div class="val-bar" [style.width]="valuationPct(row) + '%'"></div>
                <span class="val-pct">{{ valuationPct(row) | number:'1.0-1' }}%</span>
              </div>
            </td>
          </tr>
          <tr class="total-row" *ngIf="valuationRows.length > 0">
            <td><strong>TOTAL</strong></td>
            <td class="num-col">{{ totalSkus | number }}</td>
            <td class="num-col"></td>
            <td class="num-col"><strong>{{ totalValue | currency }}</strong></td>
            <td class="num-col"></td>
          </tr>
          <tr *ngIf="valuationRows.length === 0">
            <td colspan="5" class="empty-row">No valuation data available.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</div>

<!-- ── ADJUST STOCK MODAL ─────────────────────────────────────────────────── -->
<div class="modal-backdrop" *ngIf="showAdjustModal" (click)="closeModals()">
  <div class="modal-box" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <span>Adjust Stock — {{ adjustTarget?.sku }}</span>
      <button class="btn-ghost" (click)="closeModals()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <label>Adjustment Type</label>
        <select [(ngModel)]="adjustForm.adjustmentType">
          <option value="AdjustmentIn">Stock In (found / received / opening)</option>
          <option value="AdjustmentOut">Stock Out (write-off / damage / shrinkage)</option>
        </select>
      </div>
      <div class="form-row">
        <label>Quantity</label>
        <input type="number" [(ngModel)]="adjustForm.quantity" min="0.01" step="0.01" placeholder="e.g. 10" />
        <small class="form-hint">Always enter a positive number. Direction is set by Adjustment Type above.</small>
      </div>
      <div class="form-row">
        <label>Unit Cost</label>
        <input type="number" [(ngModel)]="adjustForm.unitCost" min="0" step="0.01" placeholder="0.00" />
      </div>
      <div class="form-row">
        <label>Notes</label>
        <textarea [(ngModel)]="adjustForm.notes" rows="2" placeholder="Reason for adjustment…"></textarea>
      </div>
      <div class="current-stock-row">
        Current On Hand: <strong>{{ adjustTarget?.onHand | number:'1.0-2' }}</strong>
        &nbsp;→&nbsp; After:
        <strong [class.text-danger]="projectedAfterAdj < 0">
          {{ projectedAfterAdj | number:'1.0-2' }}
        </strong>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" (click)="closeModals()">Cancel</button>
      <button class="btn-primary" (click)="submitAdjust()"
              [disabled]="!adjustForm.quantity || adjustForm.quantity <= 0 || adjusting">
        {{ adjusting ? 'Saving…' : 'Save Adjustment' }}
      </button>
    </div>
  </div>
</div>

<!-- ── THRESHOLDS MODAL ───────────────────────────────────────────────────── -->
<div class="modal-backdrop" *ngIf="showThresholdsModal" (click)="closeModals()">
  <div class="modal-box" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <span>Reorder Settings — {{ thresholdTarget?.sku }}</span>
      <button class="btn-ghost" (click)="closeModals()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-grid-2">
        <div class="form-row">
          <label>Reorder Point</label>
          <input type="number" [(ngModel)]="thresholdForm.reorderPoint" min="0" step="1" />
          <small class="form-hint">Alert when OnHand drops to this level.</small>
        </div>
        <div class="form-row">
          <label>Minimum Stock</label>
          <input type="number" [(ngModel)]="thresholdForm.minimumStock" min="0" step="1" />
        </div>
        <div class="form-row">
          <label>Maximum Stock</label>
          <input type="number" [(ngModel)]="thresholdForm.maximumStock" min="0" step="1" />
        </div>
        <div class="form-row">
          <label>Bin / Location</label>
          <input type="text" [(ngModel)]="thresholdForm.location" placeholder="e.g. A-12-3" />
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" (click)="closeModals()">Cancel</button>
      <button class="btn-primary" (click)="submitThresholds()" [disabled]="savingThresholds">
        {{ savingThresholds ? 'Saving…' : 'Save Settings' }}
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .inv-shell { padding: 24px; max-width: 1400px; margin: 0 auto; }

    /* ── Header ── */
    .page-header { margin-bottom: 20px; }
    .page-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .page-title { font-size: 22px; font-weight: 700; color: var(--text-primary, #111); margin: 0; }
    .header-actions { display: flex; gap: 8px; }

    /* ── Tab Bar ── */
    .tab-bar { display: flex; gap: 0; border-bottom: 2px solid var(--border, #e5e7eb); }
    .tab-bar button {
      background: none; border: none; padding: 8px 20px; font-size: 14px; font-weight: 500;
      color: var(--text-secondary, #6b7280); cursor: pointer; border-bottom: 2px solid transparent;
      margin-bottom: -2px; transition: color .15s, border-color .15s;
    }
    .tab-bar button.active { color: #6366f1; border-color: #6366f1; }
    .tab-bar button:hover:not(.active) { color: var(--text-primary, #111); }

    /* ── Summary Cards ── */
    .summary-cards {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px;
    }
    .card {
      background: var(--surface, #fff); border: 1px solid var(--border, #e5e7eb);
      border-radius: 10px; padding: 16px 20px; cursor: pointer; transition: box-shadow .15s;
    }
    .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .card-value { font-size: 24px; font-weight: 700; color: var(--text-primary, #111); }
    .card-label { font-size: 12px; color: var(--text-secondary, #6b7280); margin-top: 2px; }
    .card.warning .card-value { color: #d97706; }
    .card.danger .card-value  { color: #dc2626; }
    .card.info .card-value    { color: #2563eb; }
    .card.success .card-value { color: #16a34a; }

    /* ── Toolbar ── */
    .toolbar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
    .search-box { flex: 1; max-width: 340px; padding: 8px 12px; border: 1px solid var(--border, #e5e7eb); border-radius: 6px; font-size: 14px; }
    .filter-select { padding: 8px 12px; border: 1px solid var(--border, #e5e7eb); border-radius: 6px; font-size: 14px; }
    .pagination { display:flex; align-items:center; justify-content:flex-end; gap:10px; margin-top:12px; font-size:13px; color:var(--text-secondary, #6b7280); }
    .pagination button:disabled { opacity:.5; cursor:not-allowed; }

    /* ── Table ── */
    .table-wrapper { overflow-x: auto; background: var(--surface, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 10px; }
    .inv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .inv-table th {
      background: var(--surface-alt, #f9fafb); padding: 10px 12px;
      text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase;
      letter-spacing: .5px; color: var(--text-secondary, #6b7280);
      border-bottom: 1px solid var(--border, #e5e7eb);
    }
    .inv-table td { padding: 10px 12px; border-bottom: 1px solid var(--border-light, #f3f4f6); vertical-align: middle; }
    .inv-table tbody tr:last-child td { border-bottom: none; }
    .inv-table tbody tr:hover { background: var(--surface-alt, #f9fafb); }
    .num-col { text-align: right; }
    .row-danger { background: #fff5f5 !important; }
    .row-warning { background: #fffbeb !important; }
    .total-row td { font-weight: 600; background: var(--surface-alt, #f9fafb); border-top: 2px solid var(--border, #e5e7eb); }

    /* ── Cell helpers ── */
    .sku-cell { font-family: monospace; font-weight: 600; color: #6366f1; cursor: pointer; }
    .sku-cell:hover { text-decoration: underline; }
    .product-name { font-weight: 500; }
    .variant-desc { font-size: 11px; color: var(--text-secondary, #6b7280); }
    .muted { color: var(--text-secondary, #6b7280); }
    .empty-row { text-align: center; color: var(--text-secondary, #6b7280); padding: 32px; }
    .text-danger { color: #dc2626 !important; }
    .text-success { color: #16a34a !important; }

    /* ── Status chips ── */
    .status-chip { padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
    .chip-ok      { background: #dcfce7; color: #15803d; }
    .chip-warning { background: #fef9c3; color: #b45309; }
    .chip-danger  { background: #fee2e2; color: #b91c1c; }

    /* ── On Order badge ── */
    .on-order-badge { background: #dbeafe; color: #1d4ed8; padding: 2px 7px; border-radius: 9999px; font-size: 11px; font-weight: 600; }

    /* ── Action buttons ── */
    .action-btns { display: flex; gap: 4px; }
    .btn-xs { padding: 3px 8px; font-size: 12px; border-radius: 4px; cursor: pointer; border: 1px solid #6366f1; background: #6366f1; color: #fff; }
    .btn-xs.btn-outline { background: transparent; color: #6366f1; }
    .btn-xs.btn-ghost { background: transparent; border-color: transparent; color: var(--text-secondary, #6b7280); }
    .btn-xs:hover { opacity: .85; }

    /* ── Transaction type chips ── */
    .txn-type { padding: 2px 7px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
    .txn-in      { background: #dcfce7; color: #15803d; }
    .txn-out     { background: #fee2e2; color: #b91c1c; }
    .txn-order   { background: #dbeafe; color: #1d4ed8; }
    .txn-neutral { background: #f3f4f6; color: #374151; }

    /* ── Detail Panel ── */
    .detail-panel { margin-top: 24px; background: var(--surface, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 10px; overflow: hidden; }
    .detail-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: var(--surface-alt, #f9fafb); border-bottom: 1px solid var(--border, #e5e7eb); font-size: 14px; }
    .detail-variant { color: var(--text-secondary, #6b7280); }

    .qty-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1px; background: var(--border, #e5e7eb); border-bottom: 1px solid var(--border, #e5e7eb); }
    .qty-tile { background: var(--surface, #fff); padding: 16px; text-align: center; }
    .qty-tile.accent-blue { background: #eff6ff; }
    .qty-tile.accent-green { background: #f0fdf4; }
    .qty-tile.accent-amber { background: #fffbeb; }
    .qty-val { font-size: 22px; font-weight: 700; color: var(--text-primary, #111); }
    .qty-lbl { font-size: 11px; color: var(--text-secondary, #6b7280); margin-top: 2px; }

    .detail-meta { display: flex; gap: 24px; padding: 12px 20px; font-size: 13px; color: var(--text-secondary, #6b7280); border-bottom: 1px solid var(--border-light, #f3f4f6); flex-wrap: wrap; }
    .detail-meta span strong { color: var(--text-primary, #111); }

    .txn-section { padding: 16px 20px; }
    .section-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: var(--text-secondary, #6b7280); margin-bottom: 12px; }
    .txn-loading { color: var(--text-secondary, #6b7280); font-size: 13px; }
    .txn-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .txn-table th { padding: 6px 10px; background: var(--surface-alt, #f9fafb); text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; color: var(--text-secondary, #6b7280); border-bottom: 1px solid var(--border, #e5e7eb); }
    .txn-table td { padding: 7px 10px; border-bottom: 1px solid var(--border-light, #f3f4f6); }

    /* ── Valuation bar ── */
    .val-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .val-bar { height: 8px; background: #6366f1; border-radius: 4px; min-width: 2px; }
    .val-pct { font-size: 12px; color: var(--text-secondary, #6b7280); }

    /* ── Buttons ── */
    .btn-primary { padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-secondary { padding: 8px 18px; background: transparent; border: 1px solid var(--border, #e5e7eb); border-radius: 6px; cursor: pointer; font-size: 14px; color: var(--text-primary, #111); }
    .btn-ghost { background: none; border: none; cursor: pointer; color: var(--text-secondary, #6b7280); font-size: 13px; padding: 4px 8px; }
    .btn-sm { font-size: 13px; padding: 5px 10px; }

    /* ── Modals ── */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-box { background: var(--surface, #fff); border-radius: 12px; width: 480px; max-width: 95vw; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; font-weight: 600; font-size: 15px; border-bottom: 1px solid var(--border, #e5e7eb); }
    .modal-body { padding: 20px; }
    .modal-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 20px; border-top: 1px solid var(--border, #e5e7eb); }

    .form-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
    .form-row label { font-size: 12px; font-weight: 600; color: var(--text-secondary, #6b7280); text-transform: uppercase; letter-spacing: .4px; }
    .form-row input, .form-row select, .form-row textarea { padding: 8px 12px; border: 1px solid var(--border, #e5e7eb); border-radius: 6px; font-size: 14px; width: 100%; box-sizing: border-box; }
    .form-hint { font-size: 11px; color: var(--text-secondary, #6b7280); }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .current-stock-row { background: var(--surface-alt, #f9fafb); padding: 10px 14px; border-radius: 6px; font-size: 14px; margin-top: 4px; }
  `]
})
export class InventoryManagementComponent implements OnInit {
  activeTab = 'items';

  summary: any = null;
  items: any[] = [];
  recentTransactions: any[] = [];
  lowStockItems: any[] = [];
  valuationRows: any[] = [];

  searchTerm = '';
  filterMode = '';
  categoryFilter = '';
  brandFilter = '';
  locationFilter = '';
  sortBy = 'sku';
  descending = false;
  filterOptions = { categories: [] as string[], brands: [] as string[], locations: [] as string[] };
  page = 1;
  pageSize = 50;
  totalCount = 0;
  totalPages = 0;
  private inventorySearchTimer: any;

  selectedItem: any = null;
  itemTransactions: any[] = [];
  txnsLoading = false;

  // Adjust modal
  showAdjustModal = false;
  adjustTarget: any = null;
  adjustForm = { quantity: 0, adjustmentType: 'AdjustmentIn', unitCost: 0, notes: '' };
  adjusting = false;

  // Thresholds modal
  showThresholdsModal = false;
  thresholdTarget: any = null;
  thresholdForm = { reorderPoint: 0, minimumStock: 0, maximumStock: 100, location: '' };
  savingThresholds = false;

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.api.getInventorySummary().subscribe(s => this.summary = s);
    this.api.getInventoryFilterOptions().subscribe(o => this.filterOptions = o);
    this.loadItems();
  }

  loadItems() {
    this.api.getInventoryItems({
      search: this.searchTerm || undefined,
      filter: this.filterMode || undefined,
      category: this.categoryFilter || undefined,
      brand: this.brandFilter || undefined,
      location: this.locationFilter || undefined,
      sortBy: this.sortBy,
      descending: this.descending,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe(d => {
      this.items = d.items;
      this.totalCount = d.totalCount;
      this.totalPages = d.totalPages;
    });
  }

  onSearch() {
    clearTimeout(this.inventorySearchTimer);
    this.inventorySearchTimer = setTimeout(() => {
      this.page = 1;
      this.loadItems();
    }, 300);
  }
  onFilterChange() { this.page = 1; this.loadItems(); }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.loadItems();
  }

  changePageSize() {
    this.page = 1;
    this.loadItems();
  }

  filterItems(filter: string) {
    this.activeTab = 'items';
    this.filterMode = filter;
    this.page = 1;
    this.loadItems();
  }

  selectItem(item: any) {
    this.selectedItem = item;
    this.itemTransactions = [];
    this.txnsLoading = true;
    this.api.getInventoryTransactions(item.productVariantId, 50)
      .subscribe({ next: d => { this.itemTransactions = d; this.txnsLoading = false; },
                   error: () => { this.txnsLoading = false; } });
  }

  viewTransactions(item: any) {
    this.selectItem(item);
    // Scroll to detail panel
    setTimeout(() => {
      document.querySelector('.detail-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  loadRecentTxns() {
    this.api.getRecentInventoryTransactions(100).subscribe(d => this.recentTransactions = d);
  }

  loadLowStock() {
    this.api.getLowStockItems().subscribe(d => this.lowStockItems = d);
  }

  loadValuation() {
    this.api.getStockValuation().subscribe(d => this.valuationRows = d);
  }

  get totalValue() { return this.valuationRows.reduce((s, r) => s + r.totalValue, 0); }
  get totalSkus()  { return this.valuationRows.reduce((s, r) => s + r.skuCount, 0); }

  valuationPct(row: any) {
    return this.totalValue > 0 ? Math.min(100, (row.totalValue / this.totalValue) * 100) : 0;
  }

  // ── Adjust Stock ──────────────────────────────────────────────────────────
  openAdjust(item: any) {
    this.adjustTarget = item;
    this.adjustForm = { quantity: 0, adjustmentType: 'AdjustmentIn', unitCost: item.averageCost, notes: '' };
    this.showAdjustModal = true;
  }

  get projectedAfterAdj(): number {
    if (!this.adjustTarget) return 0;
    const delta = this.adjustForm.adjustmentType === 'AdjustmentIn'
      ? this.adjustForm.quantity
      : -this.adjustForm.quantity;
    return this.adjustTarget.onHand + delta;
  }

  submitAdjust() {
    if (!this.adjustTarget) return;
    this.adjusting = true;
    const payload = {
      quantity: this.adjustForm.adjustmentType === 'AdjustmentIn'
        ? Math.abs(this.adjustForm.quantity)
        : -Math.abs(this.adjustForm.quantity),
      adjustmentType: this.adjustForm.adjustmentType,
      unitCost: this.adjustForm.unitCost,
      notes: this.adjustForm.notes,
      createdBy: 'User'
    };
    this.api.adjustStock(this.adjustTarget.id, payload).subscribe({
      next: updated => {
        // Refresh the row in the list
        const idx = this.items.findIndex(i => i.id === updated.id);
        if (idx >= 0) this.items[idx] = updated;
        if (this.selectedItem?.id === updated.id) {
          this.selectedItem = updated;
          this.viewTransactions(updated);
        }
        this.api.getInventorySummary().subscribe(s => this.summary = s);
        this.closeModals();
        this.adjusting = false;
      },
      error: () => { this.adjusting = false; }
    });
  }

  // ── Thresholds ─────────────────────────────────────────────────────────────
  openThresholds(item: any) {
    this.thresholdTarget = item;
    this.thresholdForm = {
      reorderPoint: item.reorderPoint,
      minimumStock: item.minimumStock,
      maximumStock: item.maximumStock,
      location: item.location || ''
    };
    this.showThresholdsModal = true;
  }

  submitThresholds() {
    if (!this.thresholdTarget) return;
    this.savingThresholds = true;
    this.api.updateInventoryThresholds(this.thresholdTarget.id, this.thresholdForm).subscribe({
      next: updated => {
        const idx = this.items.findIndex(i => i.id === updated.id);
        if (idx >= 0) this.items[idx] = updated;
        if (this.selectedItem?.id === updated.id) this.selectedItem = updated;
        this.closeModals();
        this.savingThresholds = false;
      },
      error: () => { this.savingThresholds = false; }
    });
  }

  closeModals() {
    this.showAdjustModal = false;
    this.showThresholdsModal = false;
    this.adjustTarget = null;
    this.thresholdTarget = null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatTxnType(type: string): string {
    const map: Record<string, string> = {
      'OpeningBalance':      'Opening',
      'PurchaseOrderPlaced': 'PO Placed',
      'PurchaseOrderClosed': 'PO Closed',
      'PurchaseReceipt':     'PO Receipt',
      'PurchaseReturn':      'Vendor Return',
      'SaleCommit':          'SO Commit',
      'SaleUncommit':        'SO Uncommit',
      'SaleShipment':        'Sale Ship',
      'SaleReturn':          'Sale Return',
      'AdjustmentIn':        'Adj In',
      'AdjustmentOut':       'Adj Out',
      'TransferOut':         'Transfer Out',
      'TransferIn':          'Transfer In',
    };
    return map[type] ?? type;
  }

  txnClass(type: string): string {
    const incoming = ['PurchaseReceipt','SaleReturn','AdjustmentIn','TransferIn','OpeningBalance'];
    const outgoing = ['SaleShipment','PurchaseReturn','AdjustmentOut','TransferOut'];
    const order    = ['PurchaseOrderPlaced','PurchaseOrderClosed','SaleCommit','SaleUncommit'];
    if (incoming.includes(type)) return 'in';
    if (outgoing.includes(type)) return 'out';
    if (order.includes(type))    return 'order';
    return 'neutral';
  }
}
