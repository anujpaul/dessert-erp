import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Customer, SalesOrderSummary, SalesOrder, ARInvoice, ARAgingReport, VariantLookup } from '../../core/models/erp.models';

type Tab = 'customers' | 'salesorders' | 'invoices' | 'aging';

@Component({
  selector: 'app-accounts-receivable',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">💰 Accounts Receivable</h1>
      <p class="page-sub">Customers · Sales Orders · Invoices · Aging</p>
    </div>
  </div>

  <div class="tabs">
    <button *ngFor="let t of tabs" class="tab" [class.active]="activeTab === t.id" (click)="setTab(t.id)">{{ t.icon }} {{ t.label }}</button>
  </div>

  <!-- ── CUSTOMERS ── -->
  <div *ngIf="activeTab === 'customers'" class="tab-content">
    <div class="toolbar">
      <input [(ngModel)]="custSearch" placeholder="Search customers…" class="search-input" />
      <button class="btn-primary" (click)="showCreateCust = true">+ New Customer</button>
    </div>
    <div *ngIf="showCreateCust" class="form-card">
      <div class="form-title">New Customer</div>
      <div class="form-grid">
        <div class="form-field"><label>Name</label><input [(ngModel)]="custForm.name" /></div>
        <div class="form-field"><label>Email</label><input [(ngModel)]="custForm.email" /></div>
        <div class="form-field"><label>Phone</label><input [(ngModel)]="custForm.phone" /></div>
        <div class="form-field"><label>Payment Terms (days)</label><input type="number" [(ngModel)]="custForm.paymentTermsDays" /></div>
        <div class="form-field"><label>Credit Limit</label><input type="number" [(ngModel)]="custForm.creditLimit" /></div>
        <div class="form-field"><label>Currency</label><input [(ngModel)]="custForm.currency" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createCustomer()">Create</button>
        <button class="btn-ghost" (click)="showCreateCust = false">Cancel</button>
      </div>
    </div>
    <div class="split">
      <div class="list-panel">
        <div *ngFor="let c of filteredCustomers" class="list-row" [class.active]="selectedCust?.id === c.id" (click)="selectedCust = c">
          <div class="row-main"><strong>{{ c.name }}</strong><span class="badge" [class]="'badge-' + c.status.toLowerCase()">{{ c.status }}</span></div>
          <div class="row-sub">{{ c.customerNumber }} · {{ c.email || 'No email' }}</div>
        </div>
        <div *ngIf="!filteredCustomers.length" class="empty">No customers.</div>
      </div>
      <div class="detail-panel" *ngIf="selectedCust">
        <div class="detail-header"><div class="detail-title">{{ selectedCust.name }}</div></div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Customer #</span><span>{{ selectedCust.customerNumber }}</span></div>
          <div class="info-item"><span class="info-label">Email</span><span>{{ selectedCust.email || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Phone</span><span>{{ selectedCust.phone || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Currency</span><span>{{ selectedCust.currency }}</span></div>
          <div class="info-item"><span class="info-label">Payment Terms</span><span>{{ selectedCust.paymentTermsDays }} days</span></div>
          <div class="info-item"><span class="info-label">Credit Limit</span><span>{{ selectedCust.creditLimit | currency }}</span></div>
          <div class="info-item"><span class="info-label">Status</span><span class="badge" [class]="'badge-' + selectedCust.status.toLowerCase()">{{ selectedCust.status }}</span></div>
          <div class="info-item"><span class="info-label">Since</span><span>{{ selectedCust.createdAt | date:'mediumDate' }}</span></div>
        </div>
      </div>
      <div class="detail-panel empty-detail" *ngIf="!selectedCust">Select a customer.</div>
    </div>
  </div>

  <!-- ── SALES ORDERS ── -->
  <div *ngIf="activeTab === 'salesorders'" class="tab-content">
    <div class="toolbar">
      <select [(ngModel)]="soStatusFilter" (change)="loadSalesOrders()" class="filter-select">
        <option value="">All Statuses</option>
        <option *ngFor="let s of soStatuses" [value]="s">{{ s }}</option>
      </select>
      <button class="btn-primary" (click)="showCreateSO = true">+ New Order</button>
    </div>
    <div *ngIf="showCreateSO" class="form-card">
      <div class="form-title">New Sales Order</div>
      <div class="form-grid">
        <div class="form-field">
          <label>Customer</label>
          <select [(ngModel)]="soForm.customerId">
            <option value="">— select —</option>
            <option *ngFor="let c of customers" [value]="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="form-field"><label>Order Date</label><input type="date" [(ngModel)]="soForm.orderDate" /></div>
        <div class="form-field"><label>Requested Ship Date</label><input type="date" [(ngModel)]="soForm.requestedShipDate" /></div>
        <div class="form-field"><label>Customer PO Ref</label><input [(ngModel)]="soForm.customerRef" /></div>
        <div class="form-field"><label>Description</label><input [(ngModel)]="soForm.description" /></div>
        <div class="form-field"><label>Currency</label><input [(ngModel)]="soForm.currency" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createSO()">Create</button>
        <button class="btn-ghost" (click)="showCreateSO = false">Cancel</button>
      </div>
    </div>
    <div class="split">
      <div class="list-panel">
        <div *ngFor="let o of salesOrders" class="list-row" [class.active]="selectedOrder?.id === o.id" (click)="selectOrder(o.id)">
          <div class="row-main"><strong>{{ o.orderNumber }}</strong><span class="badge" [class]="'badge-so-' + o.status.toLowerCase()">{{ o.status }}</span></div>
          <div class="row-sub">{{ o.customerName }}</div>
          <div class="row-amounts">{{ o.orderDate | date:'MMM d, y' }} · {{ o.grandTotal | currency }}</div>
        </div>
        <div *ngIf="!salesOrders.length" class="empty">No orders.</div>
      </div>
      <div class="detail-panel" *ngIf="selectedOrder">
        <div class="detail-header">
          <div class="detail-title">{{ selectedOrder.orderNumber }}</div>
          <div class="action-row">
            <button *ngIf="selectedOrder.status === 'Draft'" class="btn-primary-sm" (click)="soAction('confirm')">Confirm</button>
            <button *ngIf="selectedOrder.status === 'Confirmed'" class="btn-primary-sm" (click)="soAction('picking')">Start Picking</button>
            <button *ngIf="selectedOrder.status === 'Picking'" class="btn-primary-sm" (click)="soShip()">Ship</button>
            <button *ngIf="selectedOrder.status === 'Shipped'" class="btn-primary-sm" (click)="soGenerateInvoice()">Generate Invoice</button>
            <button *ngIf="['Draft','Confirmed','Picking'].includes(selectedOrder.status)" class="btn-danger-sm" (click)="soAction('cancel')">Cancel</button>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Customer</span><span>{{ selectedOrder.customerName }}</span></div>
          <div class="info-item"><span class="info-label">Status</span><span class="badge" [class]="'badge-so-' + selectedOrder.status.toLowerCase()">{{ selectedOrder.status }}</span></div>
          <div class="info-item"><span class="info-label">Order Date</span><span>{{ selectedOrder.orderDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">Ship Date</span><span>{{ selectedOrder.requestedShipDate ? (selectedOrder.requestedShipDate | date:'mediumDate') : '—' }}</span></div>
          <div class="info-item"><span class="info-label">PO Ref</span><span>{{ selectedOrder.customerRef || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Currency</span><span>{{ selectedOrder.currency }}</span></div>
        </div>

        <!-- Add line (Draft only) — variant search picker -->
        <div *ngIf="selectedOrder.status === 'Draft'" class="add-line-row">
          <input class="filter-select" [(ngModel)]="variantSearchQuery"
            (ngModelChange)="searchVariants()"
            placeholder="Search SKU or product name…" style="flex:2" />
          <div *ngIf="variantResults.length" class="variant-dropdown">
            <div *ngFor="let v of variantResults" class="variant-option" (click)="selectVariant(v)">
              <strong>{{ v.sku }}</strong> — {{ v.productName }}
              <span *ngIf="v.size || v.color || v.material"> · {{ variantAttrs(v) }}</span>
              <span class="variant-price">{{ v.effectivePrice | currency }}</span>
              <span class="variant-qty">({{ v.quantityAvailable }} avail)</span>
            </div>
          </div>
          <div *ngIf="selectedVariant" class="selected-variant-chip">
            {{ selectedVariant.sku }} · {{ selectedVariant.productName }}
            <button (click)="clearVariant()" style="background:none;border:none;cursor:pointer;color:#ef4444">✕</button>
          </div>
          <input type="number" [(ngModel)]="addLineQty" min="1" placeholder="Qty" style="width:70px;padding:.4rem;border:1px solid #d1d5db;border-radius:6px" />
          <button class="btn-primary-sm" (click)="addSOLine()" [disabled]="!selectedVariant">Add</button>
        </div>

        <div class="sub-section-title">Order Lines</div>
        <table class="data-table">
          <thead><tr><th>Product</th><th>UOM</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Discount</th><th class="num">Tax</th><th class="num">Total</th><th *ngIf="selectedOrder.status === 'Draft'"></th></tr></thead>
          <tbody>
            <tr *ngFor="let l of selectedOrder.lines">
              <td><code>{{ l.sku }}</code> {{ l.productName }}<span *ngIf="l.variantDescription" style="color:#6b7280;margin-left:.3rem">· {{ l.variantDescription }}</span></td>
              <td>{{ l.unitOfMeasure }}</td>
              <td class="num">{{ l.quantity }}</td>
              <td class="num">{{ l.unitPrice | currency }}</td>
              <td class="num">{{ l.discountPct }}%</td>
              <td class="num">{{ l.taxAmount | currency }}</td>
              <td class="num"><strong>{{ l.lineTotal | currency }}</strong></td>
              <td *ngIf="selectedOrder.status === 'Draft'"><button class="btn-xs btn-red" (click)="removeSOLine(l.id)">✕</button></td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="5"><strong>Grand Total</strong></td>
              <td class="num"><strong>{{ selectedOrder.taxTotal | currency }}</strong></td>
              <td class="num"><strong>{{ selectedOrder.grandTotal | currency }}</strong></td>
              <td *ngIf="selectedOrder.status === 'Draft'"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="detail-panel empty-detail" *ngIf="!selectedOrder">Select a sales order.</div>
    </div>
  </div>

  <!-- ── INVOICES ── -->
  <div *ngIf="activeTab === 'invoices'" class="tab-content">
    <div class="toolbar">
      <input [(ngModel)]="invSearch" placeholder="Search invoices…" class="search-input" />
    </div>
    <div class="split">
      <div class="list-panel">
        <div *ngFor="let inv of filteredInvoices" class="list-row" [class.active]="selectedInv?.id === inv.id" (click)="selectedInv = inv">
          <div class="row-main"><strong>{{ inv.invoiceNumber }}</strong><span class="badge" [class]="'badge-inv-' + inv.status.toLowerCase()">{{ inv.status }}</span></div>
          <div class="row-sub">{{ inv.customerName }} · Due {{ inv.dueDate | date:'MMM d' }}</div>
          <div class="row-amounts">Outstanding: {{ inv.outstandingAmount | currency }}</div>
        </div>
        <div *ngIf="!filteredInvoices.length" class="empty">No invoices.</div>
      </div>
      <div class="detail-panel" *ngIf="selectedInv">
        <div class="detail-header">
          <div class="detail-title">{{ selectedInv.invoiceNumber }}</div>
          <div class="action-row">
            <button *ngIf="selectedInv.status === 'Draft'" class="btn-primary-sm" (click)="issueInv(selectedInv.id)">Issue</button>
            <button *ngIf="['Issued','PartiallyPaid','Overdue'].includes(selectedInv.status)" class="btn-primary-sm" (click)="applyPayment(selectedInv)">Apply Payment</button>
            <button *ngIf="selectedInv.status !== 'FullyPaid' && selectedInv.status !== 'Voided'" class="btn-danger-sm" (click)="voidInv(selectedInv.id)">Void</button>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Customer</span><span>{{ selectedInv.customerName }}</span></div>
          <div class="info-item"><span class="info-label">Status</span><span class="badge" [class]="'badge-inv-' + selectedInv.status.toLowerCase()">{{ selectedInv.status }}</span></div>
          <div class="info-item"><span class="info-label">Invoice Date</span><span>{{ selectedInv.invoiceDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">Due Date</span><span>{{ selectedInv.dueDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">Sub Total</span><span>{{ selectedInv.subTotal | currency }}</span></div>
          <div class="info-item"><span class="info-label">Tax</span><span>{{ selectedInv.taxAmount | currency }}</span></div>
          <div class="info-item"><span class="info-label">Total</span><span><strong>{{ selectedInv.totalAmount | currency }}</strong></span></div>
          <div class="info-item"><span class="info-label">Paid</span><span>{{ selectedInv.paidAmount | currency }}</span></div>
          <div class="info-item"><span class="info-label">Outstanding</span><span [class.neg]="selectedInv.outstandingAmount > 0"><strong>{{ selectedInv.outstandingAmount | currency }}</strong></span></div>
          <div class="info-item"><span class="info-label">Days Outstanding</span><span [class.neg]="selectedInv.daysOutstanding > 0">{{ selectedInv.daysOutstanding }} days</span></div>
        </div>
        <!-- Payment form -->
        <div *ngIf="showPaymentForm && paymentTarget?.id === selectedInv.id" class="form-card">
          <div class="form-title">Apply Payment</div>
          <div class="form-grid">
            <div class="form-field"><label>Amount</label><input type="number" [(ngModel)]="paymentForm.amount" [max]="selectedInv.outstandingAmount" /></div>
            <div class="form-field"><label>Date</label><input type="date" [(ngModel)]="paymentForm.paymentDate" /></div>
            <div class="form-field">
              <label>Method</label>
              <select [(ngModel)]="paymentForm.paymentMethod">
                <option>BankTransfer</option><option>Cash</option><option>CreditCard</option><option>Check</option>
              </select>
            </div>
            <div class="form-field"><label>Reference</label><input [(ngModel)]="paymentForm.reference" /></div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" (click)="submitPayment()">Post Payment</button>
            <button class="btn-ghost" (click)="showPaymentForm = false">Cancel</button>
          </div>
        </div>
      </div>
      <div class="detail-panel empty-detail" *ngIf="!selectedInv">Select an invoice.</div>
    </div>
  </div>

  <!-- ── AGING REPORT ── -->
  <div *ngIf="activeTab === 'aging'" class="tab-content">
    <div class="toolbar">
      <button class="btn-primary" (click)="loadAging()">Refresh</button>
    </div>
    <table *ngIf="agingReport.length" class="data-table mt">
      <thead>
        <tr>
          <th>Customer</th>
          <th class="num">Current</th>
          <th class="num">1–30 Days</th>
          <th class="num">31–60 Days</th>
          <th class="num">61–90 Days</th>
          <th class="num">90+ Days</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of agingReport">
          <td><strong>{{ r.customerName }}</strong><br><small class="muted">{{ r.customerNumber }}</small></td>
          <td class="num">{{ r.current | currency }}</td>
          <td class="num" [class.warn]="r.days1_30 > 0">{{ r.days1_30 | currency }}</td>
          <td class="num" [class.warn]="r.days31_60 > 0">{{ r.days31_60 | currency }}</td>
          <td class="num" [class.neg]="r.days61_90 > 0">{{ r.days61_90 | currency }}</td>
          <td class="num" [class.neg]="r.over90 > 0">{{ r.over90 | currency }}</td>
          <td class="num"><strong>{{ r.total | currency }}</strong></td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td><strong>Total</strong></td>
          <td class="num"><strong>{{ agingTotals.current | currency }}</strong></td>
          <td class="num"><strong>{{ agingTotals.days1_30 | currency }}</strong></td>
          <td class="num"><strong>{{ agingTotals.days31_60 | currency }}</strong></td>
          <td class="num"><strong>{{ agingTotals.days61_90 | currency }}</strong></td>
          <td class="num"><strong>{{ agingTotals.over90 | currency }}</strong></td>
          <td class="num"><strong>{{ agingTotals.total | currency }}</strong></td>
        </tr>
      </tfoot>
    </table>
    <div *ngIf="!agingReport.length" class="empty mt">No outstanding invoices. AR is clean! 🎉</div>
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
    .toolbar { display: flex; gap: .75rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
    .search-input { padding: .45rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; flex: 1; min-width: 200px; }
    .filter-select { padding: .45rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; }
    .btn-primary { background: #1d4ed8; color: #fff; border: none; padding: .5rem 1rem; border-radius: 6px; cursor: pointer; font-size: .875rem; font-weight: 500; }
    .btn-primary:hover { background: #1e40af; }
    .btn-ghost { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; padding: .5rem 1rem; border-radius: 6px; cursor: pointer; font-size: .875rem; }
    .btn-primary-sm { background: #1d4ed8; color: #fff; border: none; padding: .35rem .75rem; border-radius: 5px; cursor: pointer; font-size: .8rem; }
    .btn-danger-sm { background: #fee2e2; color: #dc2626; border: none; padding: .35rem .75rem; border-radius: 5px; cursor: pointer; font-size: .8rem; }
    .btn-xs { padding: .2rem .5rem; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 4px; cursor: pointer; font-size: .75rem; }
    .btn-red { border-color: #fecaca; color: #dc2626; }
    .form-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; margin-bottom: 1rem; }
    .form-title { font-weight: 600; font-size: .95rem; color: #0f172a; margin-bottom: 1rem; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: .35rem; }
    .form-field label { font-size: .75rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: .04em; }
    .form-field input, .form-field select { padding: .45rem .6rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; }
    .form-actions { display: flex; gap: .5rem; }
    .split { display: grid; grid-template-columns: 300px 1fr; gap: 1rem; }
    .list-panel { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #fff; }
    .list-row { padding: .75rem 1rem; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
    .list-row:last-child { border-bottom: none; }
    .list-row:hover { background: #f8fafc; }
    .list-row.active { background: #eff6ff; border-left: 3px solid #1d4ed8; }
    .row-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: .2rem; font-size: .875rem; }
    .row-sub { font-size: .75rem; color: #64748b; }
    .row-amounts { font-size: .75rem; color: #94a3b8; margin-top: .2rem; }
    .detail-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; }
    .empty-detail { display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: .875rem; min-height: 200px; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .detail-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .action-row { display: flex; gap: .5rem; flex-wrap: wrap; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: .75rem; background: #f8fafc; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .info-item { display: flex; flex-direction: column; gap: .2rem; font-size: .875rem; color: #0f172a; }
    .info-label { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; }
    .sub-section-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; margin: 1rem 0 .5rem; }
    .add-line-row { display: flex; gap: .5rem; align-items: center; margin-bottom: .75rem; flex-wrap: wrap; }
    .data-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    .data-table th { background: #f8fafc; padding: .5rem .75rem; text-align: left; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: .55rem .75rem; border-bottom: 1px solid #f1f5f9; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f8fafc; }
    .total-row td { background: #f8fafc; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .neg { color: #dc2626; }
    .warn { color: #d97706; }
    .mt { margin-top: 1rem; }
    .muted { color: #94a3b8; font-size: .75rem; }
    .badge { display: inline-block; padding: .2rem .5rem; border-radius: 4px; font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    .badge-active { background: #dcfce7; color: #166534; }
    .badge-inactive { background: #f1f5f9; color: #475569; }
    .badge-onhold { background: #fef9c3; color: #92400e; }
    .badge-blacklisted { background: #fee2e2; color: #dc2626; }
    .badge-so-draft { background: #f1f5f9; color: #475569; }
    .badge-so-confirmed { background: #dbeafe; color: #1d4ed8; }
    .badge-so-picking { background: #fef9c3; color: #92400e; }
    .badge-so-shipped { background: #e0f2fe; color: #0369a1; }
    .badge-so-invoiced { background: #f0fdf4; color: #166534; }
    .badge-so-closed { background: #f1f5f9; color: #475569; }
    .badge-so-cancelled { background: #fee2e2; color: #dc2626; }
    .badge-inv-draft { background: #f1f5f9; color: #475569; }
    .badge-inv-issued { background: #dbeafe; color: #1d4ed8; }
    .badge-inv-partiallypaid { background: #fef9c3; color: #92400e; }
    .badge-inv-fullypaid { background: #dcfce7; color: #166534; }
    .badge-inv-overdue { background: #fee2e2; color: #dc2626; }
    .badge-inv-voided { background: #f1f5f9; color: #94a3b8; }
    .empty { padding: 2rem; text-align: center; color: #94a3b8; font-size: .875rem; }
    code { font-family: monospace; background: #f1f5f9; padding: .1rem .3rem; border-radius: 3px; font-size: .8rem; }
    .variant-dropdown { position: absolute; z-index: 100; background: #fff; border: 1px solid #d1d5db; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,.1); max-height: 220px; overflow-y: auto; min-width: 380px; margin-top: .25rem; }
    .variant-option { padding: .5rem .75rem; cursor: pointer; font-size: .85rem; border-bottom: 1px solid #f1f5f9; }
    .variant-option:hover { background: #eff6ff; }
    .variant-price { margin-left: .5rem; font-weight: 600; color: #2563eb; }
    .variant-qty { margin-left: .35rem; color: #6b7280; font-size: .8rem; }
    .selected-variant-chip { display: inline-flex; align-items: center; gap: .35rem; background: #dbeafe; color: #1e40af; padding: .3rem .6rem; border-radius: 9999px; font-size: .82rem; font-weight: 500; }
    .add-line-row { position: relative; }
  `]
})
export class AccountsReceivableComponent implements OnInit {
  activeTab: Tab = 'customers';
  tabs = [
    { id: 'customers' as Tab, label: 'Customers', icon: '👥' },
    { id: 'salesorders' as Tab, label: 'Sales Orders', icon: '🛒' },
    { id: 'invoices' as Tab, label: 'Invoices', icon: '📄' },
    { id: 'aging' as Tab, label: 'Aging Report', icon: '📅' },
  ];

  soStatuses = ['Draft','Confirmed','Picking','Shipped','Invoiced','Closed','Cancelled'];

  customers: Customer[] = [];
  selectedCust: Customer | null = null;
  custSearch = '';
  showCreateCust = false;
  custForm = { name:'', email:'', phone:'', paymentTermsDays: 30, creditLimit: 10000, currency: 'USD' };

  salesOrders: SalesOrderSummary[] = [];
  selectedOrder: SalesOrder | null = null;
  soStatusFilter = '';
  showCreateSO = false;
  soForm = { customerId:'', orderDate:'', requestedShipDate:'', customerRef:'', description:'', currency:'USD' };

  // Variant search for SO line picker
  variantSearchQuery = '';
  variantResults: VariantLookup[] = [];
  selectedVariant: VariantLookup | null = null;
  addLineQty = 1;
  private searchTimer: any;

  arInvoices: ARInvoice[] = [];
  selectedInv: ARInvoice | null = null;
  invSearch = '';
  showPaymentForm = false;
  paymentTarget: ARInvoice | null = null;
  paymentForm = { amount: 0, paymentDate: '', paymentMethod: 'BankTransfer', reference: '' };

  agingReport: ARAgingReport[] = [];
  get agingTotals() {
    return {
      current: this.agingReport.reduce((s,r) => s + r.current, 0),
      days1_30: this.agingReport.reduce((s,r) => s + r.days1_30, 0),
      days31_60: this.agingReport.reduce((s,r) => s + r.days31_60, 0),
      days61_90: this.agingReport.reduce((s,r) => s + r.days61_90, 0),
      over90: this.agingReport.reduce((s,r) => s + r.over90, 0),
      total: this.agingReport.reduce((s,r) => s + r.total, 0),
    };
  }

  get filteredCustomers() {
    const q = this.custSearch.toLowerCase();
    return this.customers.filter(c => !q || c.name.toLowerCase().includes(q) || c.customerNumber.includes(q));
  }
  get filteredInvoices() {
    const q = this.invSearch.toLowerCase();
    return this.arInvoices.filter(i => !q || i.invoiceNumber.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q));
  }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getCustomers().subscribe(d => this.customers = d);
    this.loadSalesOrders();
    this.api.getARInvoices().subscribe(d => this.arInvoices = d);
    this.loadAging();
  }

  setTab(t: Tab) { this.activeTab = t; }

  createCustomer() {
    this.api.createCustomer(this.custForm).subscribe(d => {
      this.customers = [...this.customers, d];
      this.showCreateCust = false;
      this.custForm = { name:'', email:'', phone:'', paymentTermsDays: 30, creditLimit: 10000, currency: 'USD' };
    });
  }

  loadSalesOrders() {
    this.api.getSalesOrders(this.soStatusFilter || undefined).subscribe(d => this.salesOrders = d);
  }

  selectOrder(id: string) {
    this.api.getSalesOrder(id).subscribe(d => this.selectedOrder = d);
  }

  createSO() {
    this.api.createSalesOrder(this.soForm).subscribe(d => {
      this.loadSalesOrders();
      this.selectedOrder = d;
      this.showCreateSO = false;
      this.soForm = { customerId:'', orderDate:'', requestedShipDate:'', customerRef:'', description:'', currency:'USD' };
    });
  }

  searchVariants() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const q = this.variantSearchQuery.trim();
    if (q.length < 2) { this.variantResults = []; return; }
    this.searchTimer = setTimeout(() => {
      this.api.searchVariants(q).subscribe(r => this.variantResults = r);
    }, 250);
  }

  variantAttrs(v: VariantLookup): string {
    return [v.size, v.color, v.material].filter(Boolean).join(', ');
  }

  selectVariant(v: VariantLookup) {
    this.selectedVariant = v;
    this.variantSearchQuery = '';
    this.variantResults = [];
  }

  clearVariant() {
    this.selectedVariant = null;
    this.variantSearchQuery = '';
    this.variantResults = [];
  }

  addSOLine() {
    if (!this.selectedOrder || !this.selectedVariant) return;
    this.api.addSalesOrderLine(this.selectedOrder.id, {
      productVariantId: this.selectedVariant.variantId,
      quantity: this.addLineQty
    }).subscribe(d => {
      this.selectedOrder = d;
      this.clearVariant();
      this.addLineQty = 1;
    });
  }

  removeSOLine(lineId: string) {
    if (!this.selectedOrder) return;
    this.api.removeSalesOrderLine(this.selectedOrder.id, lineId).subscribe(() => this.selectOrder(this.selectedOrder!.id));
  }

  soAction(action: string) {
    if (!this.selectedOrder) return;
    const id = this.selectedOrder.id;
    const obs = action === 'confirm' ? this.api.confirmSalesOrder(id)
      : action === 'picking' ? this.api.startPicking(id)
      : this.api.cancelSalesOrder(id);
    obs.subscribe(() => this.selectOrder(id));
  }

  soShip() {
    if (!this.selectedOrder) return;
    const shipDate = new Date().toISOString().split('T')[0];
    this.api.shipSalesOrder(this.selectedOrder.id, { shipDate }).subscribe(() => this.selectOrder(this.selectedOrder!.id));
  }

  soGenerateInvoice() {
    if (!this.selectedOrder) return;
    this.api.generateARInvoice(this.selectedOrder.id).subscribe(() => {
      this.selectOrder(this.selectedOrder!.id);
      this.api.getARInvoices().subscribe(d => this.arInvoices = d);
    });
  }

  issueInv(id: string) {
    this.api.issueInvoice(id).subscribe(() => this.api.getARInvoices().subscribe(d => {
      this.arInvoices = d;
      this.selectedInv = d.find(i => i.id === id) || null;
    }));
  }

  voidInv(id: string) {
    this.api.voidARInvoice(id).subscribe(() => this.api.getARInvoices().subscribe(d => {
      this.arInvoices = d;
      this.selectedInv = d.find(i => i.id === id) || null;
    }));
  }

  applyPayment(inv: ARInvoice) {
    this.paymentTarget = inv;
    this.paymentForm = { amount: inv.outstandingAmount, paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'BankTransfer', reference: '' };
    this.showPaymentForm = true;
  }

  submitPayment() {
    if (!this.paymentTarget) return;
    const req = { customerId: this.paymentTarget.customerId, arInvoiceId: this.paymentTarget.id, ...this.paymentForm };
    this.api.createARPayment(req).subscribe(() => {
      this.showPaymentForm = false;
      this.api.getARInvoices().subscribe(d => {
        this.arInvoices = d;
        this.selectedInv = d.find(i => i.id === this.paymentTarget!.id) || null;
      });
      this.loadAging();
    });
  }

  loadAging() {
    this.api.getARAgingReport().subscribe(d => this.agingReport = d);
  }
}
