import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import {
  RetailStore, POSTransactionSummary, POSTransaction,
  Promotion, Coupon, RetailSummary
} from '../../core/models/erp.models';

type Tab = 'summary' | 'stores' | 'transactions' | 'promotions' | 'coupons';

@Component({
  selector: 'app-retail',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">🌐 OmniChannel</h1>
      <p class="page-sub">In-Store · Online · Marketplace · Wholesale — Unified Order Management</p>
    </div>
  </div>

  <div class="tabs">
    <button *ngFor="let t of tabs" class="tab" [class.active]="activeTab === t.id" (click)="setTab(t.id)">
      {{ t.icon }} {{ t.label }}
    </button>
  </div>

  <!-- ── SUMMARY ── -->
  <div *ngIf="activeTab === 'summary'" class="tab-content">
    <div *ngIf="summary" class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">Total Transactions</div><div class="kpi-value">{{ summary.totalTransactions }}</div></div>
      <div class="kpi-card"><div class="kpi-label">Processed</div><div class="kpi-value success">{{ summary.processedTransactions }}</div></div>
      <div class="kpi-card"><div class="kpi-label">Failed</div><div class="kpi-value danger">{{ summary.failedTransactions }}</div></div>
      <div class="kpi-card"><div class="kpi-label">Total Revenue</div><div class="kpi-value">{{ summary.totalRevenue | currency }}</div></div>
      <div class="kpi-card"><div class="kpi-label">Total Discounts</div><div class="kpi-value">{{ summary.totalDiscounts | currency }}</div></div>
      <div class="kpi-card"><div class="kpi-label">Total Tax</div><div class="kpi-value">{{ summary.totalTax | currency }}</div></div>
      <div class="kpi-card"><div class="kpi-label">Items Sold</div><div class="kpi-value">{{ summary.totalItemsSold }}</div></div>
      <div class="kpi-card"><div class="kpi-label">Top Store</div><div class="kpi-value">{{ summary.topStore }}</div></div>
    </div>
    <p *ngIf="!summary" class="empty">Loading summary…</p>
  </div>

  <!-- ── STORES ── -->
  <div *ngIf="activeTab === 'stores'" class="tab-content">
    <div class="toolbar">
      <input [(ngModel)]="storeSearch" placeholder="Search stores…" class="search-input" />
      <button class="btn-primary" (click)="openCreateStore()">+ New Store</button>
    </div>

    <div *ngIf="showStoreForm" class="form-card">
      <div class="form-title">{{ editStore ? 'Edit Store' : 'New Store' }}</div>
      <div class="form-grid">
        <div class="form-field" *ngIf="!editStore"><label>Store Code *</label><input [(ngModel)]="storeForm.storeCode" /></div>
        <div class="form-field"><label>Name *</label><input [(ngModel)]="storeForm.name" /></div>
        <div class="form-field"><label>Address</label><input [(ngModel)]="storeForm.address" /></div>
        <div class="form-field"><label>Phone</label><input [(ngModel)]="storeForm.phone" /></div>
        <div class="form-field"><label>Manager Name</label><input [(ngModel)]="storeForm.managerName" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="saveStore()">{{ editStore ? 'Save' : 'Create' }}</button>
        <button class="btn-ghost" (click)="showStoreForm = false; editStore = null">Cancel</button>
      </div>
    </div>

    <table class="data-table" *ngIf="filteredStores.length > 0">
      <thead><tr><th>Code</th><th>Name</th><th>Manager</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        <tr *ngFor="let s of filteredStores">
          <td><strong>{{ s.storeCode }}</strong></td>
          <td>{{ s.name }}</td>
          <td>{{ s.managerName || '—' }}</td>
          <td>{{ s.phone || '—' }}</td>
          <td><span class="badge" [class]="s.isActive ? 'badge-success' : 'badge-muted'">{{ s.isActive ? 'Active' : 'Inactive' }}</span></td>
          <td>
            <button class="btn-sm" (click)="openEditStore(s)">Edit</button>
            <button class="btn-sm" (click)="toggleStore(s)">{{ s.isActive ? 'Deactivate' : 'Activate' }}</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p *ngIf="filteredStores.length === 0" class="empty">No stores found.</p>
  </div>

  <!-- ── TRANSACTIONS ── -->
  <div *ngIf="activeTab === 'transactions'" class="tab-content">
    <div class="toolbar">
      <select [(ngModel)]="txChannelFilter" (ngModelChange)="loadTransactions()" class="search-input" style="width:150px">
        <option value="">All Channels</option>
        <option value="InStore">🏪 In-Store</option>
        <option value="Online">🌐 Online</option>
        <option value="Marketplace">📦 Marketplace</option>
        <option value="Wholesale">🏭 Wholesale</option>
      </select>
      <select [(ngModel)]="txStatusFilter" (ngModelChange)="loadTransactions()" class="search-input" style="width:150px">
        <option value="">All Statuses</option>
        <option value="Pending">Pending</option>
        <option value="Processed">Processed</option>
        <option value="Failed">Failed</option>
        <option value="Voided">Voided</option>
      </select>
    </div>

    <div class="split">
      <div class="list-panel">
        <div *ngFor="let t of transactions" class="list-row"
             [class.active]="selectedTx?.id === t.id" (click)="loadTxDetail(t.id)">
          <div class="row-main">
            <strong>{{ t.transactionNumber }}</strong>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              <span class="badge" [class]="channelClass(t.channel)">{{ channelIcon(t.channel) }} {{ t.channel }}</span>
              <span class="badge" [class]="txStatusClass(t.status)">{{ t.status }}</span>
            </div>
          </div>
          <div class="row-sub">{{ t.storeName }} · {{ t.transactionDate | date:'short' }} · {{ t.grandTotal | currency }}</div>
          <div class="row-sub" *ngIf="t.customerName">👤 {{ t.customerName }}</div>
          <div class="row-sub" *ngIf="t.channel !== 'InStore'">
            <span class="badge" [class]="fulfillmentClass(t.fulfillmentStatus)">{{ fulfillmentIcon(t.fulfillmentStatus) }} {{ t.fulfillmentStatus }}</span>
          </div>
        </div>
        <p *ngIf="transactions.length === 0" class="empty">No transactions.</p>
      </div>

      <div class="detail-panel" *ngIf="selectedTx">
        <div class="detail-header">
          <h3>{{ selectedTx.transactionNumber }}</h3>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <span class="badge" [class]="channelClass(selectedTx.channel)">{{ channelIcon(selectedTx.channel) }} {{ selectedTx.channel }}</span>
            <span class="badge" [class]="txStatusClass(selectedTx.status)">{{ selectedTx.status }}</span>
            <button class="btn-sm danger" *ngIf="selectedTx.status === 'Processed' || selectedTx.status === 'Pending'" (click)="voidTx(selectedTx.id)">Void</button>
          </div>
        </div>

        <!-- Fulfillment progress for non-in-store orders -->
        <div *ngIf="selectedTx.channel !== 'InStore'" class="fulfillment-bar">
          <div class="fulfillment-label">Fulfillment</div>
          <div class="fulfillment-steps">
            <div *ngFor="let step of fulfillmentSteps" class="f-step"
                 [class.done]="isFulfillmentDone(selectedTx.fulfillmentStatus, step)"
                 [class.current]="selectedTx.fulfillmentStatus === step"
                 (click)="setFulfillment(selectedTx.id, step)">
              {{ fulfillmentStepIcon(step) }} {{ step }}
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-row"><span>Store</span><span>{{ selectedTx.storeName }}</span></div>
          <div class="detail-row" *ngIf="selectedTx.cashierName"><span>Cashier</span><span>{{ selectedTx.cashierName }}</span></div>
          <div class="detail-row"><span>Date</span><span>{{ selectedTx.transactionDate | date:'medium' }}</span></div>
          <div class="detail-row"><span>Type</span><span>{{ selectedTx.transactionType }}</span></div>
          <div class="detail-row"><span>Currency</span><span>{{ selectedTx.currency }}</span></div>
          <div class="detail-row" *ngIf="selectedTx.couponCode"><span>Coupon</span><span>{{ selectedTx.couponCode }} ({{ selectedTx.couponDiscount | currency }} off)</span></div>
        </div>

        <!-- Customer info for online/delivery orders -->
        <div class="detail-section" *ngIf="selectedTx.customerName || selectedTx.deliveryAddress">
          <strong>Customer / Delivery</strong>
          <div class="detail-row" *ngIf="selectedTx.customerName"><span>Name</span><span>{{ selectedTx.customerName }}</span></div>
          <div class="detail-row" *ngIf="selectedTx.customerEmail"><span>Email</span><span>{{ selectedTx.customerEmail }}</span></div>
          <div class="detail-row" *ngIf="selectedTx.customerPhone"><span>Phone</span><span>{{ selectedTx.customerPhone }}</span></div>
          <div class="detail-row" *ngIf="selectedTx.deliveryAddress"><span>Address</span><span>{{ selectedTx.deliveryAddress }}</span></div>
          <div class="detail-row" *ngIf="selectedTx.externalOrderRef"><span>Ext. Order Ref</span><span><code>{{ selectedTx.externalOrderRef }}</code></span></div>
          <div class="detail-row" *ngIf="selectedTx.channelNotes"><span>Notes</span><span>{{ selectedTx.channelNotes }}</span></div>
        </div>
        <table class="data-table">
          <thead><tr><th>SKU</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Disc</th><th>Tax</th><th>Total</th><th>Return?</th></tr></thead>
          <tbody>
            <tr *ngFor="let l of selectedTx.lines">
              <td>{{ l.sku }}</td>
              <td>{{ l.productName }}</td>
              <td>{{ l.quantity }}</td>
              <td>{{ l.unitPrice | currency }}</td>
              <td>{{ l.discountAmount | currency }}</td>
              <td>{{ l.taxAmount | currency }}</td>
              <td><strong>{{ l.lineTotal | currency }}</strong></td>
              <td>{{ l.isReturn ? '↩️' : '' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="totals-box">
          <div class="detail-row"><span>SubTotal</span><span>{{ selectedTx.subTotal | currency }}</span></div>
          <div class="detail-row"><span>Discounts</span><span>-{{ selectedTx.discountTotal | currency }}</span></div>
          <div class="detail-row"><span>Tax</span><span>{{ selectedTx.taxTotal | currency }}</span></div>
          <div class="detail-row grand"><span>Grand Total</span><span>{{ selectedTx.grandTotal | currency }}</span></div>
          <div class="detail-row"><span>Tendered</span><span>{{ selectedTx.tenderedAmount | currency }}</span></div>
          <div class="detail-row"><span>Change</span><span>{{ selectedTx.changeAmount | currency }}</span></div>
        </div>
        <div class="detail-section" *ngIf="selectedTx.payments.length > 0">
          <strong>Payments</strong>
          <div class="detail-row" *ngFor="let p of selectedTx.payments">
            <span>{{ p.paymentMethod }}</span><span>{{ p.amount | currency }} {{ p.reference ? '('+p.reference+')' : '' }}</span>
          </div>
        </div>
        <div *ngIf="selectedTx.processingError" class="error-box">⚠️ {{ selectedTx.processingError }}</div>
      </div>
    </div>
  </div>

  <!-- ── PROMOTIONS ── -->
  <div *ngIf="activeTab === 'promotions'" class="tab-content">
    <div class="toolbar">
      <button class="btn-primary" (click)="openCreatePromo()">+ New Promotion</button>
    </div>

    <div *ngIf="showPromoForm" class="form-card">
      <div class="form-title">{{ editPromo ? 'Edit Promotion' : 'New Promotion' }}</div>
      <div class="form-grid">
        <div class="form-field"><label>Name *</label><input [(ngModel)]="promoForm.name" /></div>
        <div class="form-field">
          <label>Discount Type *</label>
          <select [(ngModel)]="promoForm.discountType">
            <option value="PercentageOff">Percentage Off</option>
            <option value="FixedAmountOff">Fixed Amount Off</option>
            <option value="BuyXGetY">Buy X Get Y</option>
          </select>
        </div>
        <div class="form-field"><label>Discount Value *</label><input type="number" step="0.01" [(ngModel)]="promoForm.discountValue" /></div>
        <div class="form-field"><label>Start Date *</label><input type="date" [(ngModel)]="promoForm.startDate" /></div>
        <div class="form-field"><label>End Date</label><input type="date" [(ngModel)]="promoForm.endDate" /></div>
        <div class="form-field"><label>Min Order Amount</label><input type="number" step="0.01" [(ngModel)]="promoForm.minimumOrderAmount" /></div>
        <div class="form-field"><label>Max Total Uses (0=unlimited)</label><input type="number" [(ngModel)]="promoForm.maxUsesTotal" /></div>
        <div class="form-field" *ngIf="promoForm.discountType === 'BuyXGetY'">
          <label>Buy Quantity</label><input type="number" [(ngModel)]="promoForm.buyQuantity" />
        </div>
        <div class="form-field" *ngIf="promoForm.discountType === 'BuyXGetY'">
          <label>Get Quantity</label><input type="number" [(ngModel)]="promoForm.getQuantity" />
        </div>
        <div class="form-field"><label>Applicable SKUs (comma-separated, blank=all)</label><input [(ngModel)]="promoForm.applicableSkus" placeholder="SKU1,SKU2 or leave blank for all" /></div>
        <div class="form-field"><label>Description</label><input [(ngModel)]="promoForm.description" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="savePromo()">{{ editPromo ? 'Save' : 'Create' }}</button>
        <button class="btn-ghost" (click)="showPromoForm = false; editPromo = null">Cancel</button>
      </div>
    </div>

    <table class="data-table" *ngIf="promotions.length > 0">
      <thead><tr><th>Name</th><th>Type</th><th>Value</th><th>Start</th><th>End</th><th>Uses</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        <tr *ngFor="let p of promotions">
          <td><strong>{{ p.name }}</strong></td>
          <td>{{ discountTypeLabel(p.discountType) }}</td>
          <td>{{ discountValueLabel(p) }}</td>
          <td>{{ p.startDate | date:'shortDate' }}</td>
          <td>{{ p.endDate ? (p.endDate | date:'shortDate') : '—' }}</td>
          <td>{{ p.usedCount }}{{ p.maxUsesTotal ? '/'+p.maxUsesTotal : '' }}</td>
          <td><span class="badge" [class]="promoStatusClass(p.status)">{{ p.status }}</span></td>
          <td>
            <button class="btn-sm" (click)="openEditPromo(p)">Edit</button>
            <button class="btn-sm" (click)="togglePromo(p)">{{ p.status === 'Active' ? 'Deactivate' : 'Activate' }}</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p *ngIf="promotions.length === 0" class="empty">No promotions yet.</p>
  </div>

  <!-- ── COUPONS ── -->
  <div *ngIf="activeTab === 'coupons'" class="tab-content">
    <div class="toolbar">
      <select [(ngModel)]="couponPromoFilter" (ngModelChange)="loadCoupons()" class="search-input" style="width:220px">
        <option value="">All Promotions</option>
        <option *ngFor="let p of promotions" [value]="p.id">{{ p.name }}</option>
      </select>
      <button class="btn-primary" (click)="openCreateCoupon()">+ New Coupon</button>
      <button class="btn-secondary" (click)="openBulkCoupon()">⚡ Bulk Generate</button>
    </div>

    <!-- Single coupon form -->
    <div *ngIf="showCouponForm" class="form-card">
      <div class="form-title">New Coupon</div>
      <div class="form-grid">
        <div class="form-field">
          <label>Promotion *</label>
          <select [(ngModel)]="couponForm.promotionId">
            <option value="">— Select —</option>
            <option *ngFor="let p of promotions" [value]="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="form-field"><label>Code *</label><input [(ngModel)]="couponForm.code" /></div>
        <div class="form-field"><label>Max Uses (0=unlimited)</label><input type="number" [(ngModel)]="couponForm.maxUses" /></div>
        <div class="form-field"><label>Expires At</label><input type="date" [(ngModel)]="couponForm.expiresAt" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="saveCoupon()">Create</button>
        <button class="btn-ghost" (click)="showCouponForm = false">Cancel</button>
      </div>
    </div>

    <!-- Bulk coupon form -->
    <div *ngIf="showBulkCouponForm" class="form-card">
      <div class="form-title">Bulk Generate Coupons</div>
      <div class="form-grid">
        <div class="form-field">
          <label>Promotion *</label>
          <select [(ngModel)]="bulkForm.promotionId">
            <option value="">— Select —</option>
            <option *ngFor="let p of promotions" [value]="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="form-field"><label>Count *</label><input type="number" [(ngModel)]="bulkForm.count" /></div>
        <div class="form-field"><label>Code Prefix</label><input [(ngModel)]="bulkForm.prefix" placeholder="e.g. SUMMER" /></div>
        <div class="form-field"><label>Max Uses Each</label><input type="number" [(ngModel)]="bulkForm.maxUsesEach" /></div>
        <div class="form-field"><label>Expires At</label><input type="date" [(ngModel)]="bulkForm.expiresAt" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="saveBulkCoupons()">Generate</button>
        <button class="btn-ghost" (click)="showBulkCouponForm = false">Cancel</button>
      </div>
    </div>

    <!-- Coupon validator -->
    <div class="form-card" style="margin-bottom:16px">
      <div class="form-title">🔍 Validate Coupon</div>
      <div style="display:flex;gap:12px;align-items:flex-end">
        <div class="form-field" style="flex:1"><label>Code</label><input [(ngModel)]="validateCode" /></div>
        <div class="form-field" style="flex:1"><label>Order Amount</label><input type="number" step="0.01" [(ngModel)]="validateAmount" /></div>
        <button class="btn-secondary" (click)="doValidate()">Validate</button>
      </div>
      <div *ngIf="validateResult" class="validate-result" [class]="validateResult.isValid ? 'valid' : 'invalid'">
        <strong>{{ validateResult.isValid ? '✅ Valid' : '❌ Invalid' }}</strong> — {{ validateResult.message }}
        <span *ngIf="validateResult.isValid">
          · {{ validateResult.promotionName }} · Discount: {{ validateResult.discountAmount | currency }}
          · Remaining Uses: {{ validateResult.remainingUses }}
        </span>
      </div>
    </div>

    <table class="data-table" *ngIf="coupons.length > 0">
      <thead><tr><th>Code</th><th>Promotion</th><th>Uses</th><th>Remaining</th><th>Expires</th><th>Active</th><th>Actions</th></tr></thead>
      <tbody>
        <tr *ngFor="let c of coupons">
          <td><code>{{ c.code }}</code></td>
          <td>{{ c.promotionName }}</td>
          <td>{{ c.usedCount }}/{{ c.maxUses || '∞' }}</td>
          <td>{{ c.remainingUses === 2147483647 ? '∞' : c.remainingUses }}</td>
          <td>{{ c.expiresAt ? (c.expiresAt | date:'shortDate') : '—' }}</td>
          <td><span class="badge" [class]="c.isActive ? 'badge-success' : 'badge-muted'">{{ c.isActive ? 'Yes' : 'No' }}</span></td>
          <td><button class="btn-sm danger" *ngIf="c.isActive" (click)="deactivateCoupon(c.id)">Deactivate</button></td>
        </tr>
      </tbody>
    </table>
    <p *ngIf="coupons.length === 0" class="empty">No coupons found.</p>
  </div>
</div>

  `,
  styles: [`
    .page { padding: 1.5rem; }
    .page-header { margin-bottom: 1.25rem; }
    .page-title { font-size: 1.4rem; font-weight: 700; color: #0f172a; }
    .page-sub { color: #64748b; font-size: .8rem; margin-top: .2rem; }
    .tabs { display: flex; gap: .25rem; border-bottom: 2px solid #e2e8f0; margin-bottom: 1.25rem; }
    .tab { padding: .6rem 1.1rem; border: none; background: none; cursor: pointer; font-size: .875rem; color: #64748b; border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tab:hover { color: #1e40af; }
    .tab.active { color: #1d4ed8; font-weight: 600; border-bottom-color: #1d4ed8; }
    .tab-content { animation: fadeIn .15s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
    .toolbar { display: flex; gap: .75rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
    .search-input { padding: .45rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; min-width: 180px; }
    .btn-primary { background: #1d4ed8; color: #fff; border: none; padding: .5rem 1rem; border-radius: 6px; cursor: pointer; font-size: .875rem; font-weight: 500; }
    .btn-primary:hover { background: #1e40af; }
    .btn-secondary { background: #f8fafc; color: #1d4ed8; border: 1px solid #bfdbfe; padding: .5rem 1rem; border-radius: 6px; cursor: pointer; font-size: .875rem; font-weight: 500; }
    .btn-ghost { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; padding: .5rem 1rem; border-radius: 6px; cursor: pointer; font-size: .875rem; }
    .btn-sm { padding: .3rem .65rem; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 5px; cursor: pointer; font-size: .78rem; margin-left: .4rem; }
    .btn-sm.danger { border-color: #fecaca; color: #dc2626; }
    .btn-sm:hover { background: #f1f5f9; }
    .form-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; margin-bottom: 1rem; }
    .form-title { font-weight: 600; font-size: .95rem; color: #0f172a; margin-bottom: 1rem; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: .35rem; }
    .form-field label { font-size: .72rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: .04em; }
    .form-field input, .form-field select { padding: .45rem .65rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; background: #fff; }
    .form-field input:focus, .form-field select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
    .form-actions { display: flex; gap: .5rem; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 1rem; margin-top: .5rem; }
    .kpi-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.1rem 1.25rem; }
    .kpi-label { font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; margin-bottom: .4rem; }
    .kpi-value { font-size: 1.6rem; font-weight: 700; color: #0f172a; }
    .kpi-value.success { color: #16a34a; }
    .kpi-value.danger  { color: #dc2626; }
    .split { display: grid; grid-template-columns: 300px 1fr; gap: 1rem; align-items: start; }
    .list-panel { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #fff; max-height: 70vh; overflow-y: auto; }
    .list-row { padding: .75rem 1rem; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
    .list-row:last-child { border-bottom: none; }
    .list-row:hover { background: #f8fafc; }
    .list-row.active { background: #eff6ff; border-left: 3px solid #1d4ed8; }
    .row-main { display: flex; justify-content: space-between; align-items: center; font-size: .875rem; }
    .row-sub { font-size: .75rem; color: #64748b; margin-top: .15rem; }
    .detail-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; max-height: 80vh; overflow-y: auto; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .detail-header h3 { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
    .detail-section { margin: .75rem 0; padding-top: .75rem; border-top: 1px solid #f1f5f9; }
    .detail-section strong { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; display: block; margin-bottom: .4rem; }
    .detail-row { display: flex; justify-content: space-between; padding: .3rem 0; font-size: .85rem; color: #374151; }
    .detail-row.grand { font-weight: 700; font-size: .95rem; padding-top: .5rem; border-top: 1px solid #e2e8f0; margin-top: .25rem; }
    .totals-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: .75rem 1rem; margin-top: .75rem; }
    .error-box { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: .75rem 1rem; margin-top: .75rem; font-size: .8rem; color: #be123c; }
    .validate-result { margin-top: .75rem; padding: .75rem 1rem; border-radius: 8px; font-size: .85rem; }
    .validate-result.valid   { background: #f0fdf4; border: 1px solid #86efac; color: #166534; }
    .validate-result.invalid { background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; }
    .data-table { width: 100%; border-collapse: collapse; font-size: .875rem; margin-top: .5rem; }
    .data-table th { background: #f8fafc; padding: .5rem .75rem; text-align: left; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: .55rem .75rem; border-bottom: 1px solid #f1f5f9; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f8fafc; }
    .badge { display: inline-block; padding: .2rem .5rem; border-radius: 4px; font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-muted   { background: #f1f5f9; color: #475569; }
    .badge-warning { background: #fef9c3; color: #92400e; }
    .badge-danger  { background: #fee2e2; color: #dc2626; }
    .badge-info    { background: #dbeafe; color: #1d4ed8; }
    .empty { padding: 2.5rem; text-align: center; color: #94a3b8; font-size: .875rem; }
    code { font-family: monospace; background: #f1f5f9; padding: .15rem .4rem; border-radius: 4px; font-size: .8rem; }
    .badge-channel-instore     { background: #e0f2fe; color: #0369a1; }
    .badge-channel-online      { background: #ede9fe; color: #6d28d9; }
    .badge-channel-marketplace { background: #fef3c7; color: #92400e; }
    .badge-channel-wholesale   { background: #dcfce7; color: #166534; }
    .badge-ff-pending    { background: #f1f5f9; color: #475569; }
    .badge-ff-ready      { background: #fef9c3; color: #92400e; }
    .badge-ff-dispatched { background: #dbeafe; color: #1d4ed8; }
    .badge-ff-delivered  { background: #dcfce7; color: #166534; }
    .badge-ff-cancelled  { background: #fee2e2; color: #dc2626; }
    .fulfillment-bar { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: .75rem 1rem; margin-bottom: .75rem; }
    .fulfillment-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; margin-bottom: .5rem; }
    .fulfillment-steps { display: flex; gap: .4rem; flex-wrap: wrap; }
    .f-step { padding: .35rem .75rem; border-radius: 20px; font-size: .78rem; cursor: pointer; border: 1px solid #e2e8f0; background: #fff; color: #64748b; transition: .15s; }
    .f-step:hover { border-color: #93c5fd; color: #1d4ed8; }
    .f-step.done    { background: #dcfce7; border-color: #86efac; color: #166534; }
    .f-step.current { background: #1d4ed8; border-color: #1d4ed8; color: #fff; font-weight: 600; }
  `]
})
export class OmniChannelComponent implements OnInit {
  activeTab: Tab = 'summary';
  tabs = [
    { id: 'summary' as Tab,      label: 'Summary',      icon: '📊' },
    { id: 'stores' as Tab,       label: 'Stores',       icon: '🏪' },
    { id: 'transactions' as Tab, label: 'Transactions',  icon: '🧾' },
    { id: 'promotions' as Tab,   label: 'Promotions',   icon: '🎉' },
    { id: 'coupons' as Tab,      label: 'Coupons',      icon: '🏷️' },
  ];

  summary: RetailSummary | null = null;

  stores: RetailStore[] = [];
  storeSearch = '';
  showStoreForm = false;
  editStore: RetailStore | null = null;
  storeForm: any = {};

  transactions: POSTransactionSummary[] = [];
  txStatusFilter  = '';
  txChannelFilter = '';
  selectedTx: POSTransaction | null = null;
  fulfillmentSteps = ['Pending', 'Ready', 'Dispatched', 'Delivered'];

  promotions: Promotion[] = [];
  showPromoForm = false;
  editPromo: Promotion | null = null;
  promoForm: any = {};

  coupons: Coupon[] = [];
  couponPromoFilter = '';
  showCouponForm = false;
  showBulkCouponForm = false;
  couponForm: any = { maxUses: 1 };
  bulkForm: any = { count: 10, maxUsesEach: 1 };

  validateCode = '';
  validateAmount = 0;
  validateResult: any = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadSummary();
    this.loadStores();
    this.loadTransactions();
    this.loadPromotions();
    this.loadCoupons();
  }

  setTab(tab: Tab) { this.activeTab = tab; }

  // ── Summary ──────────────────────────────────────────────────────────────────
  loadSummary() {
    this.api.getRetailSummary().subscribe(s => this.summary = s);
  }

  // ── Stores ───────────────────────────────────────────────────────────────────
  loadStores() { this.api.getRetailStores().subscribe(s => this.stores = s); }

  get filteredStores() {
    const q = this.storeSearch.toLowerCase();
    return this.stores.filter(s => !q || s.name.toLowerCase().includes(q) || s.storeCode.toLowerCase().includes(q));
  }

  openCreateStore() { this.storeForm = { storeCode:'', name:'', address:'', phone:'', managerName:'' }; this.editStore = null; this.showStoreForm = true; }
  openEditStore(s: RetailStore) { this.editStore = s; this.storeForm = { name: s.name, address: s.address, phone: s.phone, managerName: s.managerName }; this.showStoreForm = true; }

  saveStore() {
    if (this.editStore) {
      this.api.updateRetailStore(this.editStore.id, this.storeForm).subscribe(() => { this.showStoreForm = false; this.editStore = null; this.loadStores(); });
    } else {
      this.api.createRetailStore(this.storeForm).subscribe(() => { this.showStoreForm = false; this.loadStores(); });
    }
  }

  toggleStore(s: RetailStore) {
    this.api.toggleRetailStore(s.id, !s.isActive).subscribe(() => this.loadStores());
  }

  // ── Transactions ─────────────────────────────────────────────────────────────
  loadTransactions() {
    this.api.getTransactions(1, 100, this.txStatusFilter || undefined).subscribe(t => this.transactions = t);
  }

  loadTxDetail(id: string) {
    this.api.getTransaction(id).subscribe(t => this.selectedTx = t);
  }

  voidTx(id: string) {
    if (!confirm('Void this transaction?')) return;
    this.api.voidTransaction(id).subscribe(() => { this.loadTransactions(); if (this.selectedTx?.id === id) this.selectedTx = null; });
  }

  txStatusClass(s: string) {
    return { 'Processed': 'badge-success', 'Pending': 'badge-warning', 'Failed': 'badge-danger', 'Voided': 'badge-muted' }[s] ?? 'badge-info';
  }

  channelClass(c: string) {
    return { 'InStore': 'badge-channel-instore', 'Online': 'badge-channel-online',
             'Marketplace': 'badge-channel-marketplace', 'Wholesale': 'badge-channel-wholesale' }[c] ?? 'badge-muted';
  }

  channelIcon(c: string) {
    return { 'InStore': '🏪', 'Online': '🌐', 'Marketplace': '📦', 'Wholesale': '🏭' }[c] ?? '';
  }

  fulfillmentClass(f: string) {
    return { 'Pending': 'badge-ff-pending', 'Ready': 'badge-ff-ready',
             'Dispatched': 'badge-ff-dispatched', 'Delivered': 'badge-ff-delivered',
             'Cancelled': 'badge-ff-cancelled' }[f] ?? 'badge-muted';
  }

  fulfillmentIcon(f: string) {
    return { 'Pending': '⏳', 'Ready': '✅', 'Dispatched': '🚚', 'Delivered': '🎉', 'Cancelled': '❌' }[f] ?? '';
  }

  fulfillmentStepIcon(f: string) {
    return { 'Pending': '⏳', 'Ready': '✅', 'Dispatched': '🚚', 'Delivered': '🎉' }[f] ?? '';
  }

  isFulfillmentDone(current: string, step: string) {
    const order = ['Pending', 'Ready', 'Dispatched', 'Delivered'];
    return order.indexOf(current) > order.indexOf(step);
  }

  setFulfillment(id: string, status: string) {
    this.api.updateFulfillmentStatus(id, status).subscribe(() => {
      if (this.selectedTx) this.loadTxDetail(this.selectedTx.id);
      this.loadTransactions();
    });
  }

  // ── Promotions ────────────────────────────────────────────────────────────────
  loadPromotions() { this.api.getPromotions().subscribe(p => this.promotions = p); }

  openCreatePromo() {
    this.promoForm = { name:'', discountType:'PercentageOff', discountValue:0, startDate:'', endDate:'', minimumOrderAmount:0, maxUsesTotal:0, applicableSkus:'', description:'' };
    this.editPromo = null; this.showPromoForm = true;
  }
  openEditPromo(p: Promotion) {
    this.editPromo = p;
    this.promoForm = { name:p.name, discountType:p.discountType, discountValue:p.discountValue,
      startDate: p.startDate.substring(0,10), endDate: p.endDate?.substring(0,10) ?? '',
      minimumOrderAmount:p.minimumOrderAmount, maxUsesTotal:p.maxUsesTotal,
      buyQuantity:p.buyQuantity, getQuantity:p.getQuantity,
      applicableSkus:p.applicableSkus ?? '', description:p.description ?? '' };
    this.showPromoForm = true;
  }

  savePromo() {
    const req = { ...this.promoForm, applyToAllProducts: !this.promoForm.applicableSkus };
    if (this.editPromo) {
      this.api.updatePromotion(this.editPromo.id, req).subscribe(() => { this.showPromoForm = false; this.editPromo = null; this.loadPromotions(); });
    } else {
      this.api.createPromotion(req).subscribe(() => { this.showPromoForm = false; this.loadPromotions(); });
    }
  }

  togglePromo(p: Promotion) {
    this.api.togglePromotion(p.id, p.status !== 'Active').subscribe(() => this.loadPromotions());
  }

  discountTypeLabel(t: string) {
    return { 'PercentageOff':'% Off', 'FixedAmountOff':'Fixed Off', 'BuyXGetY':'Buy X Get Y' }[t] ?? t;
  }

  discountValueLabel(p: Promotion) {
    if (p.discountType === 'PercentageOff') return p.discountValue + '%';
    if (p.discountType === 'FixedAmountOff') return '$' + p.discountValue;
    return 'Buy ' + p.buyQuantity + ' Get ' + p.getQuantity;
  }

  promoStatusClass(s: string) {
    return { 'Active':'badge-success', 'Inactive':'badge-muted', 'Expired':'badge-danger', 'Scheduled':'badge-info' }[s] ?? 'badge-muted';
  }

  // ── Coupons ───────────────────────────────────────────────────────────────────
  loadCoupons() {
    this.api.getCoupons(this.couponPromoFilter || undefined).subscribe(c => this.coupons = c);
  }

  openCreateCoupon() { this.couponForm = { promotionId:'', code:'', maxUses:1, expiresAt:'' }; this.showCouponForm = true; }
  openBulkCoupon()   { this.bulkForm  = { promotionId:'', count:10, prefix:'', maxUsesEach:1, expiresAt:'' }; this.showBulkCouponForm = true; }

  saveCoupon() {
    this.api.createCoupon(this.couponForm).subscribe(() => { this.showCouponForm = false; this.loadCoupons(); });
  }

  saveBulkCoupons() {
    this.api.bulkCreateCoupons(this.bulkForm).subscribe(() => { this.showBulkCouponForm = false; this.loadCoupons(); });
  }

  deactivateCoupon(id: string) {
    this.api.deactivateCoupon(id).subscribe(() => this.loadCoupons());
  }

  doValidate() {
    this.api.validateCoupon({ code: this.validateCode, orderAmount: this.validateAmount })
      .subscribe(r => this.validateResult = r);
  }
}
