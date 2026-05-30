import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Vendor, PurchaseOrderSummary, PurchaseOrder, APInvoice, APAgingReport, VariantLookup } from '../../core/models/erp.models';

type Tab = 'vendors' | 'purchaseorders' | 'invoices' | 'aging';

@Component({
  selector: 'app-accounts-payable',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">🧾 Accounts Payable</h1>
      <p class="page-sub">Vendors · Purchase Orders · Invoices · Aging</p>
    </div>
  </div>

  <div class="tabs">
    <button *ngFor="let t of tabs" class="tab" [class.active]="activeTab === t.id" (click)="setTab(t.id)">{{ t.icon }} {{ t.label }}</button>
  </div>

  <!-- ── VENDORS ── -->
  <div *ngIf="activeTab === 'vendors'" class="tab-content">
    <div class="toolbar">
      <input [(ngModel)]="vendSearch" placeholder="Search vendors…" class="search-input" />
      <button class="btn-primary" (click)="openCreateVend()">+ New Vendor</button>
    </div>

    <!-- Create / Edit vendor form -->
    <div *ngIf="showVendForm" class="form-card">
      <div class="form-title">{{ editVend ? 'Edit Vendor' : 'New Vendor' }}</div>
      <div class="form-grid">
        <div class="form-field"><label>Name *</label><input [(ngModel)]="vendForm.name" /></div>
        <div class="form-field"><label>Email</label><input [(ngModel)]="vendForm.email" type="email" /></div>
        <div class="form-field"><label>Phone</label><input [(ngModel)]="vendForm.phone" /></div>
        <div class="form-field"><label>Address</label><input [(ngModel)]="vendForm.address" /></div>
        <div class="form-field"><label>Tax ID</label><input [(ngModel)]="vendForm.taxId" /></div>
        <div class="form-field"><label>Currency</label><input [(ngModel)]="vendForm.currency" /></div>
        <div class="form-field"><label>Payment Terms (days)</label><input type="number" [(ngModel)]="vendForm.paymentTermsDays" /></div>
        <div class="form-field"><label>Bank Account Name</label><input [(ngModel)]="vendForm.bankAccountName" /></div>
        <div class="form-field"><label>Bank Account Number</label><input [(ngModel)]="vendForm.bankAccountNumber" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="saveVendor()">{{ editVend ? 'Save Changes' : 'Create' }}</button>
        <button class="btn-ghost" (click)="showVendForm = false; editVend = null">Cancel</button>
      </div>
    </div>

    <div class="split">
      <div class="list-panel">
        <div *ngFor="let v of filteredVendors" class="list-row" [class.active]="selectedVend?.id === v.id" (click)="selectedVend = v">
          <div class="row-main">
            <strong>{{ v.name }}</strong>
            <span class="badge" [class]="'badge-vend-' + v.status.toLowerCase()">{{ v.status }}</span>
          </div>
          <div class="row-sub">{{ v.vendorNumber }} · {{ v.email || 'No email' }}</div>
          <div class="row-sub">{{ v.currency }} · {{ v.paymentTermsDays }}d terms</div>
        </div>
        <div *ngIf="!filteredVendors.length" class="empty">No vendors.</div>
      </div>
      <div class="detail-panel" *ngIf="selectedVend">
        <div class="detail-header">
          <div class="detail-title">{{ selectedVend.name }}</div>
          <div class="action-row">
            <button class="btn-primary-sm" (click)="openEditVend(selectedVend)">✏️ Edit</button>
            <button class="btn-danger-sm" (click)="deleteVendor(selectedVend)">🗑 Delete</button>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Vendor #</span><span>{{ selectedVend.vendorNumber }}</span></div>
          <div class="info-item"><span class="info-label">Email</span><span>{{ selectedVend.email || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Phone</span><span>{{ selectedVend.phone || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Address</span><span>{{ selectedVend.address || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Tax ID</span><span>{{ selectedVend.taxId || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Currency</span><span>{{ selectedVend.currency }}</span></div>
          <div class="info-item"><span class="info-label">Payment Terms</span><span>{{ selectedVend.paymentTermsDays }} days</span></div>
          <div class="info-item"><span class="info-label">Bank Account</span><span>{{ selectedVend.bankAccountName || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Bank Acct #</span><span>{{ selectedVend.bankAccountNumber || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Status</span><span class="badge" [class]="'badge-vend-' + selectedVend.status.toLowerCase()">{{ selectedVend.status }}</span></div>
          <div class="info-item"><span class="info-label">Since</span><span>{{ selectedVend.createdAt | date:'mediumDate' }}</span></div>
        </div>
      </div>
      <div class="detail-panel empty-detail" *ngIf="!selectedVend">Select a vendor to view details.</div>
    </div>
  </div>

  <!-- ── PURCHASE ORDERS ── -->
  <div *ngIf="activeTab === 'purchaseorders'" class="tab-content">
    <div class="toolbar">
      <select [(ngModel)]="poStatusFilter" (change)="loadPOs()" class="filter-select">
        <option value="">All Statuses</option>
        <option *ngFor="let s of poStatuses" [value]="s">{{ s }}</option>
      </select>
      <button class="btn-primary" (click)="showCreatePO = true">+ New PO</button>
    </div>

    <div *ngIf="showCreatePO" class="form-card">
      <div class="form-title">New Purchase Order</div>
      <div class="form-grid">
        <div class="form-field">
          <label>Vendor *</label>
          <select [(ngModel)]="poForm.vendorId">
            <option value="">— select —</option>
            <option *ngFor="let v of vendors" [value]="v.id">{{ v.name }}</option>
          </select>
        </div>
        <div class="form-field"><label>Order Date *</label><input type="date" [(ngModel)]="poForm.orderDate" /></div>
        <div class="form-field"><label>Expected Date</label><input type="date" [(ngModel)]="poForm.expectedDate" /></div>
        <div class="form-field"><label>Currency</label><input [(ngModel)]="poForm.currency" /></div>
        <div class="form-field" style="grid-column:1/-1"><label>Description</label><input [(ngModel)]="poForm.description" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createPO()">Create</button>
        <button class="btn-ghost" (click)="showCreatePO = false">Cancel</button>
      </div>
    </div>

    <div class="split">
      <div class="list-panel">
        <div *ngFor="let o of purchaseOrders" class="list-row" [class.active]="selectedPO?.id === o.id" (click)="selectPO(o.id)">
          <div class="row-main"><strong>{{ o.poNumber }}</strong><span class="badge" [class]="'badge-po-' + o.status.toLowerCase()">{{ o.status }}</span></div>
          <div class="row-sub">{{ o.vendorName }}</div>
          <div class="row-amounts">{{ o.orderDate | date:'MMM d, y' }} · {{ o.grandTotal | currency }}</div>
        </div>
        <div *ngIf="!purchaseOrders.length" class="empty">No purchase orders.</div>
      </div>

      <div class="detail-panel" *ngIf="selectedPO">
        <div class="detail-header">
          <div class="detail-title">{{ selectedPO.poNumber }}</div>
          <div class="action-row">
            <button *ngIf="selectedPO.status === 'Draft'" class="btn-primary-sm" (click)="sendPO()">Send to Vendor</button>
            <button *ngIf="['Sent','PartiallyReceived'].includes(selectedPO.status)" class="btn-primary-sm" (click)="showReceive = true">Receive Goods</button>
            <button *ngIf="['FullyReceived','PartiallyReceived'].includes(selectedPO.status)" class="btn-primary-sm" (click)="generateAPInv()">Generate Invoice</button>
            <button *ngIf="['Draft','Sent'].includes(selectedPO.status)" class="btn-danger-sm" (click)="cancelPO()">Cancel</button>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Vendor</span><span>{{ selectedPO.vendorName }}</span></div>
          <div class="info-item"><span class="info-label">Status</span><span class="badge" [class]="'badge-po-' + selectedPO.status.toLowerCase()">{{ selectedPO.status }}</span></div>
          <div class="info-item"><span class="info-label">Order Date</span><span>{{ selectedPO.orderDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">Expected</span><span>{{ selectedPO.expectedDate ? (selectedPO.expectedDate | date:'mediumDate') : '—' }}</span></div>
          <div class="info-item"><span class="info-label">Sub Total</span><span>{{ selectedPO.subTotal | currency }}</span></div>
          <div class="info-item"><span class="info-label">Grand Total</span><span><strong>{{ selectedPO.grandTotal | currency }}</strong></span></div>
        </div>

        <!-- Add line (Draft only) — variant picker -->
        <div *ngIf="selectedPO.status === 'Draft'" class="form-card">
          <div class="form-title" style="font-size:.85rem">Add Line — Search Product</div>
          <div class="variant-search-row">
            <input [(ngModel)]="variantQuery" (input)="searchVariants()" placeholder="Search by SKU, name, color…" class="search-input" style="flex:1" />
            <span *ngIf="variantResults.length" class="result-count">{{ variantResults.length }} results</span>
          </div>
          <!-- Variant results -->
          <div *ngIf="variantResults.length" class="variant-results">
            <div *ngFor="let v of variantResults" class="variant-row"
                 [class.selected]="addLine.productVariantId === v.variantId"
                 (click)="selectVariant(v)">
              <div class="variant-main">
                <code>{{ v.sku }}</code>
                <span>{{ v.productName }}</span>
                <span class="variant-attrs">{{ [v.size, v.color, v.material] | join }}</span>
              </div>
              <div class="variant-meta">
                Cost: <strong>{{ v.effectiveCost | currency }}</strong> ·
                Stock: {{ v.quantityAvailable }}
                <span *ngIf="v.preferredVendorName" class="pref-badge">⭐ {{ v.preferredVendorName }}</span>
              </div>
            </div>
          </div>
          <!-- Filled line form after selecting a variant -->
          <div *ngIf="addLine.productVariantId" class="form-grid" style="grid-template-columns: repeat(auto-fill, minmax(130px,1fr)); margin-top:.75rem">
            <div class="form-field"><label>SKU</label><input [value]="addLine.productCode" readonly class="readonly" /></div>
            <div class="form-field"><label>Description</label><input [(ngModel)]="addLine.description" /></div>
            <div class="form-field"><label>UOM</label><input [(ngModel)]="addLine.unitOfMeasure" /></div>
            <div class="form-field"><label>Qty</label><input type="number" [(ngModel)]="addLine.quantity" min="0.01" step="0.01" /></div>
            <div class="form-field"><label>Unit Cost</label><input type="number" [(ngModel)]="addLine.unitCost" min="0" step="0.01" /></div>
            <div class="form-field"><label>Tax %</label><input type="number" [(ngModel)]="addLine.taxRate" min="0" step="0.01" /></div>
          </div>
          <div *ngIf="addLine.productVariantId" class="form-actions" style="margin-top:.75rem">
            <button class="btn-primary-sm" (click)="addPOLine()">Add Line</button>
            <button class="btn-ghost" style="font-size:.8rem;padding:.3rem .6rem" (click)="clearLineForm()">Clear</button>
          </div>
        </div>

        <!-- Receive form -->
        <div *ngIf="showReceive" class="form-card">
          <div class="form-title">Receive Goods</div>
          <table class="data-table">
            <thead><tr><th>SKU</th><th>Description</th><th class="num">Ordered</th><th class="num">Rcvd</th><th class="num">Receive Now</th></tr></thead>
            <tbody>
              <tr *ngFor="let l of selectedPO.lines; let i = index">
                <td><code>{{ l.productCode }}</code></td>
                <td>{{ l.description }}</td>
                <td class="num">{{ l.orderedQty }}</td>
                <td class="num">{{ l.receivedQty }}</td>
                <td class="num"><input type="number" [(ngModel)]="receiveQtys[i]" min="0" [max]="l.orderedQty - l.receivedQty" style="width:80px;padding:.3rem;border:1px solid #d1d5db;border-radius:4px;text-align:right" /></td>
              </tr>
            </tbody>
          </table>
          <div class="form-actions" style="margin-top:.75rem">
            <button class="btn-primary" (click)="submitReceive()">Confirm Receipt</button>
            <button class="btn-ghost" (click)="showReceive = false">Cancel</button>
          </div>
        </div>

        <div class="sub-section-title">Lines</div>
        <table class="data-table">
          <thead><tr><th>SKU</th><th>Description</th><th class="num">Ordered</th><th class="num">Received</th><th class="num">Unit Cost</th><th class="num">Total</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let l of selectedPO.lines">
              <td><code>{{ l.productCode }}</code></td>
              <td>{{ l.description }}</td>
              <td class="num">{{ l.orderedQty }}</td>
              <td class="num" [class.warn]="!l.isFullyReceived && l.receivedQty > 0" [class.ok]="l.isFullyReceived">{{ l.receivedQty }}</td>
              <td class="num">{{ l.unitCost | currency }}</td>
              <td class="num"><strong>{{ l.lineTotal | currency }}</strong></td>
              <td><button *ngIf="selectedPO.status === 'Draft'" class="btn-xs btn-red" (click)="removePOLine(l.id)">✕</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="detail-panel empty-detail" *ngIf="!selectedPO">Select a purchase order.</div>
    </div>
  </div>

  <!-- ── AP INVOICES ── -->
  <div *ngIf="activeTab === 'invoices'" class="tab-content">
    <div class="toolbar">
      <input [(ngModel)]="apInvSearch" placeholder="Search invoices…" class="search-input" />
      <button class="btn-primary" (click)="showCreateAPInv = true">+ New Invoice</button>
    </div>
    <div *ngIf="showCreateAPInv" class="form-card">
      <div class="form-title">New AP Invoice</div>
      <div class="form-grid">
        <div class="form-field"><label>Vendor</label>
          <select [(ngModel)]="apInvForm.vendorId">
            <option value="">— select —</option>
            <option *ngFor="let v of vendors" [value]="v.id">{{ v.name }}</option>
          </select>
        </div>
        <div class="form-field"><label>Vendor Invoice Ref</label><input [(ngModel)]="apInvForm.vendorInvoiceRef" /></div>
        <div class="form-field"><label>Invoice Date</label><input type="date" [(ngModel)]="apInvForm.invoiceDate" /></div>
        <div class="form-field"><label>Due Date</label><input type="date" [(ngModel)]="apInvForm.dueDate" /></div>
        <div class="form-field"><label>Sub Total</label><input type="number" [(ngModel)]="apInvForm.subTotal" /></div>
        <div class="form-field"><label>Tax Amount</label><input type="number" [(ngModel)]="apInvForm.taxAmount" /></div>
        <div class="form-field" style="grid-column:1/-1"><label>Description</label><input [(ngModel)]="apInvForm.description" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createAPInv()">Create</button>
        <button class="btn-ghost" (click)="showCreateAPInv = false">Cancel</button>
      </div>
    </div>
    <div class="split">
      <div class="list-panel">
        <div *ngFor="let inv of filteredAPInvoices" class="list-row" [class.active]="selectedAPInv?.id === inv.id" (click)="selectedAPInv = inv">
          <div class="row-main"><strong>{{ inv.invoiceNumber }}</strong><span class="badge" [class]="'badge-apinv-' + inv.status.toLowerCase()">{{ inv.status }}</span></div>
          <div class="row-sub">{{ inv.vendorName }} · Ref: {{ inv.vendorInvoiceRef }}</div>
          <div class="row-amounts">Due {{ inv.dueDate | date:'MMM d' }} · {{ inv.outstandingAmount | currency }}</div>
        </div>
        <div *ngIf="!filteredAPInvoices.length" class="empty">No AP invoices.</div>
      </div>
      <div class="detail-panel" *ngIf="selectedAPInv">
        <div class="detail-header">
          <div class="detail-title">{{ selectedAPInv.invoiceNumber }}</div>
          <div class="action-row">
            <button *ngIf="selectedAPInv.status === 'Draft'" class="btn-primary-sm" (click)="approveAPInv(selectedAPInv.id)">Approve</button>
            <button *ngIf="['Approved','Overdue'].includes(selectedAPInv.status)" class="btn-primary-sm" (click)="applyAPPayment(selectedAPInv)">Pay</button>
            <button *ngIf="selectedAPInv.status !== 'Paid' && selectedAPInv.status !== 'Voided'" class="btn-danger-sm" (click)="voidAPInv(selectedAPInv.id)">Void</button>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Vendor</span><span>{{ selectedAPInv.vendorName }}</span></div>
          <div class="info-item"><span class="info-label">Vendor Ref</span><span>{{ selectedAPInv.vendorInvoiceRef }}</span></div>
          <div class="info-item"><span class="info-label">Status</span><span class="badge" [class]="'badge-apinv-' + selectedAPInv.status.toLowerCase()">{{ selectedAPInv.status }}</span></div>
          <div class="info-item"><span class="info-label">Invoice Date</span><span>{{ selectedAPInv.invoiceDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">Due Date</span><span>{{ selectedAPInv.dueDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">Sub Total</span><span>{{ selectedAPInv.subTotal | currency }}</span></div>
          <div class="info-item"><span class="info-label">Tax</span><span>{{ selectedAPInv.taxAmount | currency }}</span></div>
          <div class="info-item"><span class="info-label">Total</span><span><strong>{{ selectedAPInv.totalAmount | currency }}</strong></span></div>
          <div class="info-item"><span class="info-label">Paid</span><span>{{ selectedAPInv.paidAmount | currency }}</span></div>
          <div class="info-item"><span class="info-label">Outstanding</span><span [class.neg]="selectedAPInv.outstandingAmount > 0"><strong>{{ selectedAPInv.outstandingAmount | currency }}</strong></span></div>
        </div>
        <div *ngIf="showAPPayForm && apPayTarget?.id === selectedAPInv.id" class="form-card">
          <div class="form-title">Post Payment</div>
          <div class="form-grid">
            <div class="form-field"><label>Amount</label><input type="number" [(ngModel)]="apPayForm.amount" /></div>
            <div class="form-field"><label>Date</label><input type="date" [(ngModel)]="apPayForm.paymentDate" /></div>
            <div class="form-field"><label>Method</label>
              <select [(ngModel)]="apPayForm.paymentMethod">
                <option>BankTransfer</option><option>Cash</option><option>Check</option>
              </select>
            </div>
            <div class="form-field"><label>Reference</label><input [(ngModel)]="apPayForm.reference" /></div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" (click)="submitAPPayment()">Post</button>
            <button class="btn-ghost" (click)="showAPPayForm = false">Cancel</button>
          </div>
        </div>
      </div>
      <div class="detail-panel empty-detail" *ngIf="!selectedAPInv">Select an invoice.</div>
    </div>
  </div>

  <!-- ── AGING ── -->
  <div *ngIf="activeTab === 'aging'" class="tab-content">
    <div class="toolbar"><button class="btn-primary" (click)="loadAPAging()">Refresh</button></div>
    <table *ngIf="apAgingReport.length" class="data-table mt">
      <thead><tr>
        <th>Vendor</th>
        <th class="num">Current</th>
        <th class="num">1–30 Days</th>
        <th class="num">31–60 Days</th>
        <th class="num">61–90 Days</th>
        <th class="num">90+ Days</th>
        <th class="num">Total</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let r of apAgingReport">
          <td><strong>{{ r.vendorName }}</strong><br><small class="muted">{{ r.vendorNumber }}</small></td>
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
          <td class="num"><strong>{{ apAgingTotals.current | currency }}</strong></td>
          <td class="num"><strong>{{ apAgingTotals.days1_30 | currency }}</strong></td>
          <td class="num"><strong>{{ apAgingTotals.days31_60 | currency }}</strong></td>
          <td class="num"><strong>{{ apAgingTotals.days61_90 | currency }}</strong></td>
          <td class="num"><strong>{{ apAgingTotals.over90 | currency }}</strong></td>
          <td class="num"><strong>{{ apAgingTotals.total | currency }}</strong></td>
        </tr>
      </tfoot>
    </table>
    <div *ngIf="!apAgingReport.length" class="empty mt">No outstanding AP. All clear! 🎉</div>
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
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: .35rem; }
    .form-field label { font-size: .75rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: .04em; }
    .form-field input, .form-field select { padding: .45rem .6rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; }
    .form-field input.readonly { background: #f1f5f9; color: #64748b; }
    .form-actions { display: flex; gap: .5rem; }
    .split { display: grid; grid-template-columns: 300px 1fr; gap: 1rem; }
    .list-panel { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #fff; max-height: 70vh; overflow-y: auto; }
    .list-row { padding: .75rem 1rem; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
    .list-row:last-child { border-bottom: none; }
    .list-row:hover { background: #f8fafc; }
    .list-row.active { background: #eff6ff; border-left: 3px solid #1d4ed8; }
    .row-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: .2rem; font-size: .875rem; }
    .row-sub { font-size: .75rem; color: #64748b; }
    .row-amounts { font-size: .75rem; color: #94a3b8; margin-top: .2rem; }
    .detail-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; overflow-y: auto; max-height: 80vh; }
    .empty-detail { display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: .875rem; min-height: 200px; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .detail-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .action-row { display: flex; gap: .5rem; flex-wrap: wrap; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: .75rem; background: #f8fafc; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .info-item { display: flex; flex-direction: column; gap: .2rem; font-size: .875rem; color: #0f172a; }
    .info-label { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; }
    .sub-section-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; margin: 1rem 0 .5rem; }
    .data-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    .data-table th { background: #f8fafc; padding: .5rem .75rem; text-align: left; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: .55rem .75rem; border-bottom: 1px solid #f1f5f9; }
    .data-table tr:hover td { background: #f8fafc; }
    .total-row td { background: #f8fafc; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .neg { color: #dc2626; }
    .warn { color: #d97706; }
    .ok { color: #16a34a; }
    .mt { margin-top: 1rem; }
    .muted { color: #94a3b8; font-size: .75rem; }
    .badge { display: inline-block; padding: .2rem .5rem; border-radius: 4px; font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    .badge-vend-active { background: #dcfce7; color: #166534; }
    .badge-vend-inactive { background: #f1f5f9; color: #475569; }
    .badge-vend-onhold { background: #fef9c3; color: #92400e; }
    .badge-vend-blacklisted { background: #fee2e2; color: #dc2626; }
    .badge-po-draft { background: #f1f5f9; color: #475569; }
    .badge-po-sent { background: #dbeafe; color: #1d4ed8; }
    .badge-po-partiallyreceived { background: #fef9c3; color: #92400e; }
    .badge-po-fullyreceived { background: #dcfce7; color: #166534; }
    .badge-po-invoiced { background: #e0f2fe; color: #0369a1; }
    .badge-po-closed { background: #f1f5f9; color: #475569; }
    .badge-po-cancelled { background: #fee2e2; color: #dc2626; }
    .badge-apinv-draft { background: #f1f5f9; color: #475569; }
    .badge-apinv-approved { background: #dbeafe; color: #1d4ed8; }
    .badge-apinv-scheduled { background: #fef9c3; color: #92400e; }
    .badge-apinv-paid { background: #dcfce7; color: #166534; }
    .badge-apinv-overdue { background: #fee2e2; color: #dc2626; }
    .badge-apinv-voided { background: #f1f5f9; color: #94a3b8; }
    .empty { padding: 2rem; text-align: center; color: #94a3b8; font-size: .875rem; }
    code { font-family: monospace; background: #f1f5f9; padding: .1rem .3rem; border-radius: 3px; font-size: .8rem; }
    /* Variant picker styles */
    .variant-search-row { display: flex; align-items: center; gap: .75rem; margin-bottom: .5rem; }
    .result-count { font-size: .75rem; color: #64748b; white-space: nowrap; }
    .variant-results { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: .75rem; max-height: 220px; overflow-y: auto; }
    .variant-row { padding: .6rem .85rem; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
    .variant-row:last-child { border-bottom: none; }
    .variant-row:hover { background: #f0f9ff; }
    .variant-row.selected { background: #eff6ff; border-left: 3px solid #1d4ed8; }
    .variant-main { display: flex; align-items: center; gap: .5rem; font-size: .85rem; flex-wrap: wrap; }
    .variant-attrs { color: #94a3b8; font-size: .75rem; }
    .variant-meta { font-size: .75rem; color: #64748b; margin-top: .2rem; }
    .pref-badge { background: #fef9c3; color: #92400e; border-radius: 4px; padding: .1rem .4rem; font-size: .7rem; font-weight: 600; margin-left: .35rem; }
  `]
})
export class AccountsPayableComponent implements OnInit {
  activeTab: Tab = 'vendors';
  tabs = [
    { id: 'vendors' as Tab, label: 'Vendors', icon: '🏭' },
    { id: 'purchaseorders' as Tab, label: 'Purchase Orders', icon: '📦' },
    { id: 'invoices' as Tab, label: 'AP Invoices', icon: '📄' },
    { id: 'aging' as Tab, label: 'Aging Report', icon: '📅' },
  ];

  poStatuses = ['Draft','Sent','PartiallyReceived','FullyReceived','Invoiced','Closed','Cancelled'];

  // Vendors
  vendors: Vendor[] = [];
  selectedVend: Vendor | null = null;
  vendSearch = '';
  showVendForm = false;
  editVend: Vendor | null = null;
  vendForm = { name:'', email:'', phone:'', address:'', taxId:'', paymentTermsDays: 30, currency:'USD', bankAccountName:'', bankAccountNumber:'' };

  // Purchase Orders
  purchaseOrders: PurchaseOrderSummary[] = [];
  selectedPO: PurchaseOrder | null = null;
  poStatusFilter = '';
  showCreatePO = false;
  showReceive = false;
  receiveQtys: number[] = [];
  poForm = { vendorId:'', orderDate:'', expectedDate:'', description:'', currency:'USD' };

  // Variant picker for PO line
  variantQuery = '';
  variantResults: VariantLookup[] = [];
  private variantSearchTimer: any;
  addLine = { productVariantId:'', productCode:'', description:'', unitOfMeasure:'Each', quantity: 1, unitCost: 0, taxRate: 0 };

  // AP Invoices
  apInvoices: APInvoice[] = [];
  selectedAPInv: APInvoice | null = null;
  apInvSearch = '';
  showCreateAPInv = false;
  apInvForm = { vendorId:'', vendorInvoiceRef:'', invoiceDate:'', dueDate:'', subTotal: 0, taxAmount: 0, description:'' };
  showAPPayForm = false;
  apPayTarget: APInvoice | null = null;
  apPayForm = { amount: 0, paymentDate:'', paymentMethod:'BankTransfer', reference:'' };

  apAgingReport: APAgingReport[] = [];
  get apAgingTotals() {
    return {
      current: this.apAgingReport.reduce((s,r) => s + r.current, 0),
      days1_30: this.apAgingReport.reduce((s,r) => s + r.days1_30, 0),
      days31_60: this.apAgingReport.reduce((s,r) => s + r.days31_60, 0),
      days61_90: this.apAgingReport.reduce((s,r) => s + r.days61_90, 0),
      over90: this.apAgingReport.reduce((s,r) => s + r.over90, 0),
      total: this.apAgingReport.reduce((s,r) => s + r.total, 0),
    };
  }

  get filteredVendors() {
    const q = this.vendSearch.toLowerCase();
    return this.vendors.filter(v => !q || v.name.toLowerCase().includes(q) || v.vendorNumber.includes(q));
  }
  get filteredAPInvoices() {
    const q = this.apInvSearch.toLowerCase();
    return this.apInvoices.filter(i => !q || i.invoiceNumber.toLowerCase().includes(q) || i.vendorName.toLowerCase().includes(q));
  }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getVendors().subscribe(d => this.vendors = d);
    this.loadPOs();
    this.api.getAPInvoices().subscribe(d => this.apInvoices = d);
    this.loadAPAging();
  }

  setTab(t: Tab) { this.activeTab = t; }

  // ── Vendors ──────────────────────────────────────────────────────────────────

  openCreateVend() {
    this.editVend = null;
    this.vendForm = { name:'', email:'', phone:'', address:'', taxId:'', paymentTermsDays: 30, currency:'USD', bankAccountName:'', bankAccountNumber:'' };
    this.showVendForm = true;
  }

  openEditVend(v: Vendor) {
    this.editVend = v;
    this.vendForm = {
      name: v.name, email: v.email ?? '', phone: v.phone ?? '', address: v.address ?? '',
      taxId: v.taxId ?? '', paymentTermsDays: v.paymentTermsDays, currency: v.currency,
      bankAccountName: v.bankAccountName ?? '', bankAccountNumber: v.bankAccountNumber ?? ''
    };
    this.showVendForm = true;
  }

  saveVendor() {
    if (!this.vendForm.name.trim()) return;
    if (this.editVend) {
      this.api.updateVendor(this.editVend.id, this.vendForm).subscribe(updated => {
        this.vendors = this.vendors.map(v => v.id === updated.id ? updated : v);
        if (this.selectedVend?.id === updated.id) this.selectedVend = updated;
        this.showVendForm = false;
        this.editVend = null;
      });
    } else {
      this.api.createVendor(this.vendForm).subscribe(d => {
        this.vendors = [...this.vendors, d];
        this.showVendForm = false;
        this.selectedVend = d;
      });
    }
  }

  deleteVendor(v: Vendor) {
    if (!confirm(`Delete vendor "${v.name}"? This cannot be undone.`)) return;
    this.api.deleteVendor(v.id).subscribe({
      next: () => {
        this.vendors = this.vendors.filter(x => x.id !== v.id);
        if (this.selectedVend?.id === v.id) this.selectedVend = null;
      },
      error: err => alert('Cannot delete: ' + (err.error?.error ?? err.message))
    });
  }

  // ── Purchase Orders ───────────────────────────────────────────────────────────

  loadPOs() {
    this.api.getPurchaseOrders(this.poStatusFilter || undefined).subscribe(d => this.purchaseOrders = d);
  }

  selectPO(id: string) {
    this.api.getPurchaseOrder(id).subscribe(d => {
      this.selectedPO = d;
      this.receiveQtys = d.lines.map(() => 0);
      this.showReceive = false;
      this.clearLineForm();
    });
  }

  createPO() {
    if (!this.poForm.vendorId || !this.poForm.orderDate) return;
    this.api.createPurchaseOrder(this.poForm).subscribe(d => {
      this.loadPOs();
      this.selectedPO = d;
      this.receiveQtys = [];
      this.showCreatePO = false;
      this.poForm = { vendorId:'', orderDate:'', expectedDate:'', description:'', currency:'USD' };
    });
  }

  // Variant search with debounce
  searchVariants() {
    clearTimeout(this.variantSearchTimer);
    if (!this.variantQuery.trim()) { this.variantResults = []; return; }
    this.variantSearchTimer = setTimeout(() => {
      this.api.searchVariants(this.variantQuery).subscribe(r => this.variantResults = r);
    }, 300);
  }

  selectVariant(v: VariantLookup) {
    const variantDesc = [v.size, v.color, v.material].filter(Boolean).join(', ');
    this.addLine = {
      productVariantId: v.variantId,
      productCode: v.sku,
      description: `${v.productName}${variantDesc ? ' — ' + variantDesc : ''}`,
      unitOfMeasure: v.unitOfMeasure,
      quantity: 1,
      unitCost: v.effectiveCost,
      taxRate: v.taxRate
    };
  }

  clearLineForm() {
    this.variantQuery = '';
    this.variantResults = [];
    this.addLine = { productVariantId:'', productCode:'', description:'', unitOfMeasure:'Each', quantity: 1, unitCost: 0, taxRate: 0 };
  }

  addPOLine() {
    if (!this.selectedPO || !this.addLine.productVariantId) return;
    this.api.addPOLine(this.selectedPO.id, this.addLine).subscribe({
      next: d => {
        this.selectedPO = d;
        this.receiveQtys = d.lines.map(() => 0);
        this.clearLineForm();
      },
      error: err => alert('Error: ' + (err.error?.error ?? err.message))
    });
  }

  removePOLine(lineId: string) {
    if (!this.selectedPO) return;
    this.api.removePOLine(this.selectedPO.id, lineId).subscribe(() => this.selectPO(this.selectedPO!.id));
  }

  sendPO() {
    if (!this.selectedPO) return;
    this.api.sendPurchaseOrder(this.selectedPO.id).subscribe(() => this.selectPO(this.selectedPO!.id));
  }

  submitReceive() {
    if (!this.selectedPO) return;
    const receipts = this.selectedPO.lines
      .map((l, i) => ({ lineId: l.id, receivedQty: this.receiveQtys[i] || 0 }))
      .filter(r => r.receivedQty > 0);
    if (!receipts.length) return;
    this.api.receiveGoods(this.selectedPO.id, receipts).subscribe(() => {
      this.showReceive = false;
      this.selectPO(this.selectedPO!.id);
    });
  }

  cancelPO() {
    if (!this.selectedPO || !confirm('Cancel this purchase order?')) return;
    this.api.cancelPurchaseOrder(this.selectedPO.id).subscribe(() => this.selectPO(this.selectedPO!.id));
  }

  generateAPInv() {
    if (!this.selectedPO) return;
    const ref = prompt('Enter vendor invoice reference number:');
    if (!ref) return;
    this.api.generateAPInvoice(this.selectedPO.id, ref).subscribe(() => {
      this.selectPO(this.selectedPO!.id);
      this.api.getAPInvoices().subscribe(d => this.apInvoices = d);
    });
  }

  // ── AP Invoices ───────────────────────────────────────────────────────────────

  createAPInv() {
    this.api.createAPInvoice(this.apInvForm).subscribe({
      next: () => {
        this.api.getAPInvoices().subscribe(d => this.apInvoices = d);
        this.showCreateAPInv = false;
        this.apInvForm = { vendorId:'', vendorInvoiceRef:'', invoiceDate:'', dueDate:'', subTotal: 0, taxAmount: 0, description:'' };
      },
      error: err => alert('Failed: ' + (err.error?.message || err.message))
    });
  }

  approveAPInv(id: string) {
    this.api.approveAPInvoice(id).subscribe(() => this.api.getAPInvoices().subscribe(d => {
      this.apInvoices = d;
      this.selectedAPInv = d.find(i => i.id === id) || null;
    }));
  }

  voidAPInv(id: string) {
    this.api.voidAPInvoice(id).subscribe(() => this.api.getAPInvoices().subscribe(d => {
      this.apInvoices = d;
      this.selectedAPInv = d.find(i => i.id === id) || null;
    }));
  }

  applyAPPayment(inv: APInvoice) {
    this.apPayTarget = inv;
    this.apPayForm = { amount: inv.outstandingAmount, paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'BankTransfer', reference: '' };
    this.showAPPayForm = true;
  }

  submitAPPayment() {
    if (!this.apPayTarget) return;
    const req = { vendorId: this.apPayTarget.vendorId, apInvoiceId: this.apPayTarget.id, ...this.apPayForm };
    this.api.createAPPayment(req).subscribe(() => {
      this.showAPPayForm = false;
      this.api.getAPInvoices().subscribe(d => {
        this.apInvoices = d;
        this.selectedAPInv = d.find(i => i.id === this.apPayTarget!.id) || null;
      });
      this.loadAPAging();
    });
  }

  loadAPAging() {
    this.api.getAPAgingReport().subscribe(d => this.apAgingReport = d);
  }
}
