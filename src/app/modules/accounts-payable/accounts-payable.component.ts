import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Vendor, VendorAddress, VendorContact, VendorLedger, PurchaseOrderSummary, PurchaseOrder, Receipt, APInvoice, APAgingReport, VariantLookup, ThreeWayMatchResult } from '../../core/models/erp.models';

type Tab = 'vendors' | 'purchaseorders' | 'invoices' | 'aging' | 'requisitions' | 'proposals' | 'creditnotes';

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

    <div *ngIf="showVendForm" class="form-card">
      <div class="form-title">{{ editVend ? 'Edit Vendor' : 'New Vendor' }}</div>
      <div class="form-grid">
        <div class="form-field"><label>Name *</label><input [(ngModel)]="vendForm.name" /></div>
        <div class="form-field"><label>Email</label><input [(ngModel)]="vendForm.email" type="email" /></div>
        <div class="form-field"><label>Phone</label><input [(ngModel)]="vendForm.phone" /></div>
        <div class="form-field"><label>Tax ID</label><input [(ngModel)]="vendForm.taxId" /></div>
        <div class="form-field"><label>Currency</label><input [(ngModel)]="vendForm.currency" /></div>
        <div class="form-field"><label>Payment Terms (days)</label><input type="number" [(ngModel)]="vendForm.paymentTermsDays" /></div>
        <div class="form-field" style="grid-column:1/-1"><label>Billing Address</label><input [(ngModel)]="vendForm.billingAddress" placeholder="Street, City, State, ZIP" /></div>
        <div class="form-field" style="grid-column:1/-1"><label>Remit-To / Shipping Address</label><input [(ngModel)]="vendForm.shippingAddress" placeholder="Same as billing if empty" /></div>
        <div class="form-field"><label>Bank Account Name</label><input [(ngModel)]="vendForm.bankAccountName" /></div>
        <div class="form-field"><label>Bank Account Number</label><input [(ngModel)]="vendForm.bankAccountNumber" /></div>
        <div class="form-field"><label>Bank Routing Number</label><input [(ngModel)]="vendForm.bankRoutingNumber" /></div>
        <div class="form-field"><label>Website</label><input [(ngModel)]="vendForm.website" /></div>
        <div class="form-field" style="grid-column:1/-1"><label>Notes</label><input [(ngModel)]="vendForm.notes" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="saveVendor()">{{ editVend ? 'Save Changes' : 'Create' }}</button>
        <button class="btn-ghost" (click)="showVendForm = false; editVend = null">Cancel</button>
      </div>
    </div>

    <div class="split">
      <div class="list-panel">
        <div *ngFor="let v of filteredVendors" class="list-row" [class.active]="selectedVend?.id === v.id" (click)="selectVendor(v)">
          <div class="row-main">
            <strong>{{ v.name }}</strong>
            <span class="badge" [class]="'badge-vend-' + v.status.toLowerCase()">{{ v.status }}</span>
          </div>
          <div class="row-sub">{{ v.vendorNumber }} · {{ v.email || 'No email' }}</div>
          <div class="row-sub" *ngIf="v.outstandingPayable > 0" style="color:#dc2626">Payable: {{ v.outstandingPayable | currency }}</div>
        </div>
        <div *ngIf="!filteredVendors.length" class="empty">No vendors.</div>
      </div>
      <div class="detail-panel" *ngIf="selectedVend">
        <div class="detail-header">
          <div class="detail-title">{{ selectedVend.name }}</div>
          <div class="action-row">
            <button class="btn-primary-sm" (click)="openEditVend(selectedVend)">✏️ Edit</button>
            <button class="btn-ghost-sm" (click)="loadVendLedger(selectedVend.id)">📒 Statement</button>
            <button class="btn-danger-sm" (click)="deleteVendor(selectedVend)">🗑 Delete</button>
          </div>
        </div>

        <!-- AP balance strip -->
        <div class="balance-strip">
          <div class="balance-cell">
            <span class="balance-label">Outstanding Payable</span>
            <span class="balance-val" [class.neg]="selectedVend.outstandingPayable > 0">{{ selectedVend.outstandingPayable | currency }}</span>
          </div>
          <div class="balance-cell">
            <span class="balance-label">Currency</span>
            <span class="balance-val">{{ selectedVend.currency }}</span>
          </div>
          <div class="balance-cell">
            <span class="balance-label">Payment Terms</span>
            <span class="balance-val">{{ selectedVend.paymentTermsDays }}d</span>
          </div>
          <div class="balance-cell">
            <span class="balance-label">Status</span>
            <span class="balance-val" style="font-size:.8rem"><span class="badge" [class]="'badge-vend-' + selectedVend.status.toLowerCase()">{{ selectedVend.status }}</span></span>
          </div>
        </div>

        <!-- Core info -->
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Vendor #</span><span>{{ selectedVend.vendorNumber }}</span></div>
          <div class="info-item"><span class="info-label">Email</span><span>{{ selectedVend.email || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Phone</span><span>{{ selectedVend.phone || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Tax ID</span><span>{{ selectedVend.taxId || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Since</span><span>{{ selectedVend.createdAt | date:'mediumDate' }}</span></div>
        </div>

        <!-- Addresses section -->
        <div class="section-header-row">
          <span class="sub-section-title">📍 Addresses</span>
          <button class="btn-primary-sm" (click)="openVendAddrForm()">+ Add</button>
        </div>
        <div class="inline-form" *ngIf="showVendAddrForm">
          <div class="form-grid-3">
            <div class="form-field"><label>Label *</label><input [(ngModel)]="vendAddrForm.label" placeholder="Head Office, Warehouse..." /></div>
            <div class="form-field"><label>Type</label>
              <select [(ngModel)]="vendAddrForm.addressType">
                <option value="Billing">Billing</option>
                <option value="RemitTo">Remit-To</option>
                <option value="Shipping">Shipping</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-field"><label>Country</label><input [(ngModel)]="vendAddrForm.country" /></div>
            <div class="form-field" style="grid-column:1/-1"><label>Line 1 *</label><input [(ngModel)]="vendAddrForm.line1" /></div>
            <div class="form-field" style="grid-column:1/-1"><label>Line 2</label><input [(ngModel)]="vendAddrForm.line2" /></div>
            <div class="form-field"><label>City *</label><input [(ngModel)]="vendAddrForm.city" /></div>
            <div class="form-field"><label>State</label><input [(ngModel)]="vendAddrForm.state" /></div>
            <div class="form-field"><label>Postal Code</label><input [(ngModel)]="vendAddrForm.postalCode" /></div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" (click)="saveVendAddr()">Save</button>
            <button class="btn-ghost-sm" (click)="cancelVendAddrForm()">Cancel</button>
          </div>
        </div>
        <div class="addr-cards-grid" *ngIf="vendAddresses.length">
          <div class="addr-card-full" *ngFor="let a of vendAddresses" [class.primary-card]="a.isPrimary">
            <div class="addr-card-head">
              <span class="addr-type-badge">{{ a.addressType }}</span>
              <span class="addr-label-text">{{ a.label }}</span>
              <span class="primary-badge" *ngIf="a.isPrimary">★ Primary</span>
            </div>
            <div class="addr-body">{{ a.singleLine }}</div>
            <div class="addr-actions">
              <button class="btn-ghost-sm" (click)="editVendAddr(a)">Edit</button>
              <button class="btn-ghost-sm" (click)="setPrimaryVendAddr(a.id)" *ngIf="!a.isPrimary">Set Primary</button>
              <button class="btn-ghost-sm danger" (click)="deleteVendAddr(a.id)">Delete</button>
            </div>
          </div>
        </div>
        <div class="empty muted" *ngIf="!vendAddresses.length && !showVendAddrForm">No addresses added yet.</div>

        <!-- Contacts section -->
        <div class="section-header-row" style="margin-top:12px">
          <span class="sub-section-title">👤 Contacts</span>
          <button class="btn-primary-sm" (click)="openVendContactForm()">+ Add</button>
        </div>
        <div class="inline-form" *ngIf="showVendContactForm">
          <div class="form-grid-3">
            <div class="form-field"><label>Name *</label><input [(ngModel)]="vendContactForm.name" /></div>
            <div class="form-field"><label>Title</label><input [(ngModel)]="vendContactForm.title" /></div>
            <div class="form-field"><label>Email</label><input [(ngModel)]="vendContactForm.email" type="email" /></div>
            <div class="form-field"><label>Phone</label><input [(ngModel)]="vendContactForm.phone" /></div>
            <div class="form-field"><label>Mobile</label><input [(ngModel)]="vendContactForm.mobile" /></div>
            <div class="form-field" style="grid-column:1/-1"><label>Notes</label><input [(ngModel)]="vendContactForm.notes" /></div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" (click)="saveVendContact()">Save</button>
            <button class="btn-ghost-sm" (click)="cancelVendContactForm()">Cancel</button>
          </div>
        </div>
        <div class="contacts-list" *ngIf="vendContacts.length">
          <div class="contact-row" *ngFor="let c of vendContacts" [class.primary-card]="c.isPrimary">
            <div class="contact-info">
              <span class="contact-name">{{ c.name }}</span>
              <span class="contact-title muted" *ngIf="c.title"> · {{ c.title }}</span>
              <span class="primary-badge" *ngIf="c.isPrimary">★</span>
            </div>
            <div class="contact-details">
              <span *ngIf="c.email">✉ {{ c.email }}</span>
              <span *ngIf="c.phone">📞 {{ c.phone }}</span>
              <span *ngIf="c.mobile">📱 {{ c.mobile }}</span>
            </div>
            <div class="addr-actions">
              <button class="btn-ghost-sm" (click)="editVendContact(c)">Edit</button>
              <button class="btn-ghost-sm" (click)="setPrimaryVendContact(c.id)" *ngIf="!c.isPrimary">Set Primary</button>
              <button class="btn-ghost-sm danger" (click)="deleteVendContact(c.id)">Delete</button>
            </div>
          </div>
        </div>
        <div class="empty muted" *ngIf="!vendContacts.length && !showVendContactForm">No contacts added yet.</div>

        <!-- Bank details -->
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Bank Account</span><span>{{ selectedVend.bankAccountName || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Account #</span><span>{{ selectedVend.bankAccountNumber || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Routing #</span><span>{{ selectedVend.bankRoutingNumber || '—' }}</span></div>
          <div class="info-item" *ngIf="selectedVend.website"><span class="info-label">Website</span><a [href]="selectedVend.website" target="_blank">{{ selectedVend.website }}</a></div>
        </div>
        <div *ngIf="selectedVend.notes" class="info-grid">
          <div class="info-item" style="grid-column:1/-1"><span class="info-label">Notes</span><span>{{ selectedVend.notes }}</span></div>
        </div>

        <!-- Vendor Ledger -->
        <div class="sub-section-header" (click)="toggleVendLedger()">
          <span class="sub-section-title">📒 Account Statement</span>
          <span class="toggle-icon">{{ showVendLedger ? '▲' : '▼' }}</span>
        </div>
        <div *ngIf="showVendLedger && vendLedger">
          <div class="ledger-summary">
            <span>Total Invoiced: <strong>{{ vendLedger.totalInvoiced | currency }}</strong></span>
            <span>Total Paid: <strong class="ok">{{ vendLedger.totalPaid | currency }}</strong></span>
            <span>Outstanding: <strong [class.neg]="vendLedger.outstandingPayable > 0">{{ vendLedger.outstandingPayable | currency }}</strong></span>
          </div>
          <table class="data-table">
            <thead><tr>
              <th>Type</th><th>Reference</th><th>Date</th>
              <th class="num">Debit (Out)</th><th class="num">Credit (In)</th>
              <th class="num">Balance</th><th>PO</th><th>Status</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let e of vendLedger.entries" [class.ledger-payment]="e.entryType === 'Payment'">
                <td><span class="badge" [class]="e.entryType === 'Payment' ? 'badge-ok' : 'badge-inv'">{{ e.entryType }}</span></td>
                <td>{{ e.reference }}</td>
                <td>{{ e.date | date:'MMM d, y' }}</td>
                <td class="num" [class.neg]="e.debit > 0">{{ e.debit > 0 ? (e.debit | currency) : '—' }}</td>
                <td class="num" [class.ok]="e.credit > 0">{{ e.credit > 0 ? (e.credit | currency) : '—' }}</td>
                <td class="num" [class.neg]="e.runningBalance > 0"><strong>{{ e.runningBalance | currency }}</strong></td>
                <td class="muted">{{ e.poNumber || '—' }}</td>
                <td>{{ e.status }}</td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="!vendLedger.entries.length" class="empty">No transactions yet.</div>
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
          <div class="row-main">
            <strong>{{ o.poNumber }}</strong>
            <span class="badge" [class]="'badge-po-' + o.status.toLowerCase()">{{ o.status }}</span>
          </div>
          <div class="row-sub">{{ o.vendorName }}</div>
          <div class="row-amounts">
            {{ o.orderDate | date:'MMM d, y' }} · {{ o.grandTotal | currency }}
            <span *ngIf="o.invoiceStatus !== 'NotInvoiced'" class="badge ml" [class]="'badge-inv-' + o.invoiceStatus.toLowerCase()">{{ o.invoiceStatus }}</span>
          </div>
        </div>
        <div *ngIf="!purchaseOrders.length" class="empty">No purchase orders.</div>
      </div>

      <div class="detail-panel" *ngIf="selectedPO">
        <div class="detail-header">
          <div class="detail-title">{{ selectedPO.poNumber }}</div>
          <div class="action-row">
            <!-- Send: only Draft -->
            <button *ngIf="selectedPO.status === 'Draft'" class="btn-primary-sm" (click)="sendPO()">📤 Send to Vendor</button>
            <!-- Receive: backend canReceive flag — works regardless of invoice state -->
            <button *ngIf="selectedPO.canReceive" class="btn-primary-sm" (click)="openReceiveForm()">📥 Receive Goods</button>
            <!-- Invoice: any received qty not yet fully invoiced -->
            <button *ngIf="hasReceivableToInvoice()" class="btn-primary-sm" (click)="generateAPInv()">🧾 Generate Invoice</button>
            <!-- Close: once fully invoiced -->
            <button *ngIf="selectedPO.invoiceStatus === 'FullyInvoiced' && selectedPO.status !== 'Closed'" class="btn-ghost-sm" (click)="closePO()">🔒 Close PO</button>
            <!-- Prepayment: can raise advance invoice any time PO is not cancelled/closed -->
            <button *ngIf="!['Closed','Cancelled'].includes(selectedPO.status)" class="btn-ghost-sm" (click)="openPrepayForm()">💳 Raise Prepayment</button>
            <!-- Cancel: only Draft/Sent with no invoices -->
            <button *ngIf="['Draft','Sent'].includes(selectedPO.status) && selectedPO.invoiceStatus === 'NotInvoiced'" class="btn-danger-sm" (click)="cancelPO()">✕ Cancel</button>
          </div>
        </div>

        <!-- ── Prepayment Invoice Form ── -->
        <div *ngIf="showPrepayForm" class="form-card">
          <div class="form-title">💳 Raise Prepayment Invoice</div>
          <div class="form-grid">
            <div class="form-field"><label>Vendor Invoice Ref *</label><input [(ngModel)]="prepayForm.vendorInvoiceRef" placeholder="PREPAY-001" /></div>
            <div class="form-field"><label>Invoice Date *</label><input type="date" [(ngModel)]="prepayForm.invoiceDate" /></div>
            <div class="form-field"><label>Due Date *</label><input type="date" [(ngModel)]="prepayForm.dueDate" /></div>
            <div class="form-field"><label>Prepayment Amount *</label><input type="number" [(ngModel)]="prepayForm.amount" min="0" step="0.01" /></div>
            <div class="form-field"><label>Tax on Prepayment</label><input type="number" [(ngModel)]="prepayForm.taxAmount" min="0" step="0.01" /></div>
            <div class="form-field" style="grid-column:1/-1"><label>Description</label><input [(ngModel)]="prepayForm.description" placeholder="Advance payment for…" /></div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" (click)="submitPrepay()">Create Prepayment</button>
            <button class="btn-ghost" (click)="showPrepayForm = false">Cancel</button>
          </div>
        </div>

        <!-- PO summary info -->
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Vendor</span><span>{{ selectedPO.vendorName }}</span></div>
          <div class="info-item">
            <span class="info-label">Receive Status</span>
            <span class="badge" [class]="'badge-po-' + selectedPO.status.toLowerCase()">{{ selectedPO.status }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Invoice Status</span>
            <span class="badge" [class]="'badge-inv-' + selectedPO.invoiceStatus.toLowerCase()">{{ selectedPO.invoiceStatus }}</span>
          </div>
          <div class="info-item"><span class="info-label">Order Date</span><span>{{ selectedPO.orderDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">Expected</span><span>{{ selectedPO.expectedDate ? (selectedPO.expectedDate | date:'mediumDate') : '—' }}</span></div>
          <div class="info-item"><span class="info-label">PO Value</span><span><strong>{{ selectedPO.grandTotal | currency }}</strong></span></div>
          <div class="info-item"><span class="info-label">Invoiced So Far</span><span [class.ok]="selectedPO.invoicedAmount > 0">{{ selectedPO.invoicedAmount | currency }}</span></div>
          <div class="info-item"><span class="info-label">Uninvoiced</span><span [class.warn]="(selectedPO.grandTotal - selectedPO.invoicedAmount) > 0">{{ (selectedPO.grandTotal - selectedPO.invoicedAmount) | currency }}</span></div>
        </div>

        <!-- Add line (Draft only) -->
        <div *ngIf="selectedPO.status === 'Draft'" class="form-card">
          <div class="form-title" style="font-size:.85rem">Add Line — Search Product</div>
          <div class="variant-search-row">
            <input [(ngModel)]="variantQuery" (input)="searchVariants()" placeholder="Search by SKU, name, color…" class="search-input" style="flex:1" />
            <span *ngIf="variantResults.length" class="result-count">{{ variantResults.length }} results</span>
          </div>
          <div *ngIf="variantResults.length" class="variant-results">
            <div *ngFor="let v of variantResults" class="variant-row"
                 [class.selected]="addLine.productVariantId === v.variantId"
                 (click)="selectVariant(v)">
              <div class="variant-main">
                <code>{{ v.sku }}</code>
                <span>{{ v.productName }}</span>
                <span class="variant-attrs">{{ variantAttrs(v) }}</span>
              </div>
              <div class="variant-meta">
                Cost: <strong>{{ v.effectiveCost | currency }}</strong> ·
                Stock: {{ v.quantityAvailable }}
                <span *ngIf="v.preferredVendorName" class="pref-badge">⭐ {{ v.preferredVendorName }}</span>
              </div>
            </div>
          </div>
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

        <!-- ── Receive Goods form ── -->
        <div *ngIf="showReceive" class="form-card">
          <div class="form-title">📥 Record Goods Receipt</div>
          <div class="form-grid" style="grid-template-columns:1fr 1fr; margin-bottom:.75rem">
            <div class="form-field">
              <label>Received Date</label>
              <input type="date" [(ngModel)]="receiveDate" />
            </div>
            <div class="form-field">
              <label>Notes / GRN Reference</label>
              <input [(ngModel)]="receiveNotes" placeholder="Optional notes…" />
            </div>
          </div>
          <table class="data-table">
            <thead><tr>
              <th>SKU</th><th>Description</th>
              <th class="num">Ordered</th><th class="num">Received</th>
              <th class="num">Outstanding</th><th class="num">Receive Now</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let l of selectedPO.lines; let i = index" [class.fully-rcvd]="l.isFullyReceived">
                <td><code>{{ l.productCode }}</code></td>
                <td>{{ l.description }}</td>
                <td class="num">{{ l.orderedQty }}</td>
                <td class="num" [class.ok]="l.isFullyReceived" [class.warn]="!l.isFullyReceived && l.receivedQty > 0">{{ l.receivedQty }}</td>
                <td class="num">{{ l.outstandingQty }}</td>
                <td class="num">
                  <input *ngIf="!l.isFullyReceived" type="number" [(ngModel)]="receiveQtys[i]"
                         min="0" [max]="l.outstandingQty" step="0.01"
                         style="width:80px;padding:.3rem;border:1px solid #d1d5db;border-radius:4px;text-align:right" />
                  <span *ngIf="l.isFullyReceived" class="badge badge-ok">✓ Full</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="form-actions" style="margin-top:.75rem">
            <button class="btn-primary" (click)="submitReceive()">Confirm Receipt</button>
            <button class="btn-ghost" (click)="showReceive = false">Cancel</button>
          </div>
        </div>

        <!-- ── Lines table ── -->
        <div class="sub-section-title">Order Lines</div>
        <table class="data-table">
          <thead><tr>
            <th>SKU</th><th>Description</th>
            <th class="num">Ordered</th><th class="num">Received</th><th class="num">Outstanding</th>
            <th class="num">Unit Cost</th><th class="num">Total</th><th></th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let l of selectedPO.lines">
              <td><code>{{ l.productCode }}</code></td>
              <td>{{ l.description }}</td>
              <td class="num">{{ l.orderedQty }}</td>
              <td class="num" [class.warn]="!l.isFullyReceived && l.receivedQty > 0" [class.ok]="l.isFullyReceived">{{ l.receivedQty }}</td>
              <td class="num" [class.warn]="l.outstandingQty > 0">{{ l.outstandingQty }}</td>
              <td class="num">{{ l.unitCost | currency }}</td>
              <td class="num"><strong>{{ l.lineTotal | currency }}</strong></td>
              <td><button *ngIf="selectedPO.status === 'Draft'" class="btn-xs btn-red" (click)="removePOLine(l.id)">✕</button></td>
            </tr>
          </tbody>
        </table>

        <!-- ── Receipt History ── -->
        <div class="sub-section-header" (click)="toggleReceiptHistory()">
          <span class="sub-section-title" style="margin:0">📋 Receipt History ({{ receipts.length }})</span>
          <span class="toggle-icon">{{ showReceiptHistory ? '▲' : '▼' }}</span>
        </div>
        <div *ngIf="showReceiptHistory">
          <div *ngIf="!receipts.length" class="empty" style="padding:.75rem">No receipts recorded yet.</div>
          <div *ngFor="let r of receipts" class="receipt-card">
            <div class="receipt-header">
              <strong>{{ r.receiptNumber }}</strong>
              <span class="muted">{{ r.receivedDate | date:'mediumDate' }}</span>
              <span *ngIf="r.notes" class="muted">· {{ r.notes }}</span>
            </div>
            <table class="data-table" style="margin-top:.5rem">
              <thead><tr><th>SKU</th><th>Description</th><th class="num">Qty Received</th></tr></thead>
              <tbody>
                <tr *ngFor="let rl of r.lines">
                  <td><code>{{ rl.productCode }}</code></td>
                  <td>{{ rl.description }}</td>
                  <td class="num ok">{{ rl.qty }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="sub-section-title" style="margin-top:1rem">Change History</div>
        <div *ngIf="!poHistory.length" class="empty" style="padding:.75rem">No changes recorded yet.</div>
        <table *ngIf="poHistory.length" class="data-table">
          <thead><tr><th>When</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
          <tbody>
            <tr *ngFor="let h of poHistory">
              <td>{{ h.occurredAt | date:'MMM d, y HH:mm' }}</td>
              <td>{{ h.username }}</td>
              <td><strong>{{ h.action }}</strong></td>
              <td class="muted">{{ auditDetails(h) }}</td>
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
          <div class="row-main">
            <strong>{{ inv.invoiceNumber }}</strong>
            <span class="badge" [class]="'badge-apinv-' + inv.status.toLowerCase()">{{ inv.status }}</span>
          </div>
          <div class="row-sub">{{ inv.vendorName }} · Ref: {{ inv.vendorInvoiceRef }}</div>
          <div class="row-amounts">
            Due {{ inv.dueDate | date:'MMM d' }} · {{ inv.outstandingAmount | currency }}
            <span *ngIf="inv.invoiceType === 'Prepayment'" class="badge badge-type-prepay ml">Prepayment</span>
            <span *ngIf="inv.matchStatus !== 'NotMatched'" class="badge ml" [class]="'badge-match-' + inv.matchStatus.toLowerCase()">{{ inv.matchStatus }}</span>
          </div>
        </div>
        <div *ngIf="!filteredAPInvoices.length" class="empty">No AP invoices.</div>
      </div>
      <div class="detail-panel" *ngIf="selectedAPInv">
        <div class="detail-header">
          <div>
            <div class="detail-title">{{ selectedAPInv.invoiceNumber }}</div>
            <div style="display:flex;gap:.4rem;margin-top:.35rem;flex-wrap:wrap">
              <span *ngIf="selectedAPInv.invoiceType === 'Prepayment'" class="badge badge-type-prepay">💳 Prepayment</span>
              <span class="badge" [class]="'badge-apinv-' + selectedAPInv.status.toLowerCase()">{{ selectedAPInv.status }}</span>
              <span *ngIf="selectedAPInv.matchStatus !== 'NotMatched'" class="badge" [class]="'badge-match-' + selectedAPInv.matchStatus.toLowerCase()">3WM: {{ selectedAPInv.matchStatus }}</span>
            </div>
          </div>
          <div class="action-row">
            <!-- 3WM: run match for PO-linked standard invoices not yet matched or already errored -->
            <button *ngIf="selectedAPInv.status === 'Draft' && selectedAPInv.invoiceType !== 'Prepayment' && selectedAPInv.purchaseOrderId"
                    class="btn-ghost-sm" (click)="runMatch(selectedAPInv.id)">🔍 Run Match</button>
            <!-- Bypass: shown when there's an exception -->
            <button *ngIf="selectedAPInv.status === 'Draft' && matchIsException(selectedAPInv)"
                    class="btn-ghost-sm" (click)="openBypassForm(selectedAPInv)">🔑 Bypass Exception</button>
            <!-- Apply prepayment: shown for standard Draft invoices linked to a PO -->
            <button *ngIf="selectedAPInv.status === 'Draft' && selectedAPInv.invoiceType !== 'Prepayment' && selectedAPInv.purchaseOrderId && !selectedAPInv.linkedPrepaymentInvoiceId"
                    class="btn-ghost-sm" (click)="openApplyPrepayPanel(selectedAPInv)">🔗 Apply Prepayment</button>
            <button *ngIf="selectedAPInv.status === 'Draft'" class="btn-primary-sm" (click)="approveAPInv(selectedAPInv.id)">✅ Approve</button>
            <button *ngIf="['Approved','Overdue'].includes(selectedAPInv.status)" class="btn-primary-sm" (click)="applyAPPayment(selectedAPInv)">💰 Pay</button>
            <button *ngIf="selectedAPInv.status !== 'Paid' && selectedAPInv.status !== 'Voided'" class="btn-danger-sm" (click)="voidAPInv(selectedAPInv.id)">🗑 Void</button>
          </div>
        </div>

        <!-- Core amounts info grid -->
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Vendor</span><span>{{ selectedAPInv.vendorName }}</span></div>
          <div class="info-item"><span class="info-label">PO</span><span>{{ selectedAPInv.poNumber || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Vendor Ref</span><span>{{ selectedAPInv.vendorInvoiceRef }}</span></div>
          <div class="info-item"><span class="info-label">Invoice Date</span><span>{{ selectedAPInv.invoiceDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">Due Date</span><span>{{ selectedAPInv.dueDate | date:'mediumDate' }}</span></div>
          <div class="info-item"><span class="info-label">Sub Total</span><span>{{ selectedAPInv.subTotal | currency }}</span></div>
          <div class="info-item"><span class="info-label">Tax</span><span>{{ selectedAPInv.taxAmount | currency }}</span></div>
          <div class="info-item"><span class="info-label">Total</span><span><strong>{{ selectedAPInv.totalAmount | currency }}</strong></span></div>
          <div class="info-item"><span class="info-label">Paid</span><span class="ok">{{ selectedAPInv.paidAmount | currency }}</span></div>
          <div class="info-item" *ngIf="selectedAPInv.prepaymentApplied > 0">
            <span class="info-label">Prepayment Applied</span>
            <span class="ok">{{ selectedAPInv.prepaymentApplied | currency }}</span>
          </div>
          <div class="info-item"><span class="info-label">Outstanding</span>
            <span [class.neg]="selectedAPInv.outstandingAmount > 0"><strong>{{ selectedAPInv.outstandingAmount | currency }}</strong></span>
          </div>
          <div class="info-item" *ngIf="selectedAPInv.daysOutstanding > 0">
            <span class="info-label">Days Outstanding</span>
            <span class="neg"><strong>{{ selectedAPInv.daysOutstanding }}d</strong></span>
          </div>
        </div>

        <!-- Linked prepayment info -->
        <div *ngIf="selectedAPInv.linkedPrepaymentInvoiceId" class="match-card match-card-ok" style="margin-bottom:.75rem">
          <strong>💳 Prepayment Applied</strong>
          <span style="margin-left:.5rem">{{ selectedAPInv.prepaymentApplied | currency }} offset from prepayment invoice.</span>
        </div>

        <!-- Three-Way Match status card -->
        <div *ngIf="selectedAPInv.matchStatus !== 'NotMatched' && selectedAPInv.invoiceType !== 'Prepayment'" class="match-card"
             [class.match-card-ok]="selectedAPInv.matchStatus === 'Matched' || selectedAPInv.matchStatus === 'Bypassed'"
             [class.match-card-warn]="matchIsException(selectedAPInv)">
          <div class="match-header">
            <strong>🔍 Three-Way Match: {{ selectedAPInv.matchStatus }}</strong>
            <span *ngIf="selectedAPInv.bypassReason" class="muted" style="margin-left:.5rem">Manager bypass: "{{ selectedAPInv.bypassReason }}"</span>
          </div>
          <div *ngIf="selectedAPInv.matchNotes" class="match-notes">{{ formatMatchNotes(selectedAPInv.matchNotes) }}</div>
        </div>

        <!-- Bypass exception form -->
        <div *ngIf="showBypassForm && bypassTarget?.id === selectedAPInv.id" class="form-card">
          <div class="form-title">🔑 Manager Bypass — Match Exception</div>
          <p style="font-size:.82rem;color:#64748b;margin-bottom:.75rem">Overriding a match exception requires a documented reason. This action is logged.</p>
          <div class="form-field"><label>Bypass Reason *</label>
            <input [(ngModel)]="bypassReason" placeholder="e.g. Price increase agreed verbally, PO amendment pending…" style="width:100%" />
          </div>
          <div class="form-actions" style="margin-top:.75rem">
            <button class="btn-primary" (click)="submitBypass()">Submit Bypass</button>
            <button class="btn-ghost" (click)="showBypassForm = false">Cancel</button>
          </div>
        </div>

        <!-- Apply prepayment panel -->
        <div *ngIf="showApplyPrepay && applyPrepayTarget?.id === selectedAPInv.id" class="form-card">
          <div class="form-title">🔗 Apply Prepayment Invoice</div>
          <div *ngIf="!availablePrepayments.length" class="muted" style="margin-bottom:.5rem">
            No approved prepayment invoices found for this vendor.
          </div>
          <table *ngIf="availablePrepayments.length" class="data-table" style="margin-bottom:.75rem">
            <thead><tr><th>Invoice</th><th>Ref</th><th class="num">Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let p of availablePrepayments">
                <td>{{ p.invoiceNumber }}</td>
                <td>{{ p.vendorInvoiceRef }}</td>
                <td class="num">{{ p.totalAmount | currency }}</td>
                <td><span class="badge" [class]="'badge-apinv-' + p.status.toLowerCase()">{{ p.status }}</span></td>
                <td><button class="btn-primary-sm" (click)="submitApplyPrepayment(p.id)">Apply</button></td>
              </tr>
            </tbody>
          </table>
          <div class="form-actions">
            <button class="btn-ghost" (click)="showApplyPrepay = false">Close</button>
          </div>
        </div>

        <!-- Payment form -->
        <div *ngIf="showAPPayForm && apPayTarget?.id === selectedAPInv.id" class="form-card">
          <div class="form-title">💰 Post Payment</div>
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

  <!-- ── PURCHASE REQUISITIONS ── -->
  <div *ngIf="activeTab === 'requisitions'" class="tab-content">
    <div class="toolbar">
      <select [(ngModel)]="prStatusFilter" class="filter-select" (ngModelChange)="loadRequisitions()">
        <option value="">All Statuses</option>
        <option *ngFor="let s of prStatuses" [value]="s">{{ s }}</option>
      </select>
      <button class="btn-primary" (click)="showCreatePR = true">+ New Requisition</button>
    </div>

    <!-- Create PR Form -->
    <div *ngIf="showCreatePR" class="form-card">
      <div class="form-title">New Purchase Requisition</div>
      <div class="form-grid">
        <div class="form-field"><label>Requested By</label><input [(ngModel)]="prForm.requestedBy" /></div>
        <div class="form-field"><label>Department</label><input [(ngModel)]="prForm.departmentCode" /></div>
        <div class="form-field"><label>Cost Center</label><input [(ngModel)]="prForm.costCenterCode" /></div>
        <div class="form-field"><label>Needed By Date</label><input type="date" [(ngModel)]="prForm.neededByDate" /></div>
        <div class="form-field"><label>Notes</label><input [(ngModel)]="prForm.notes" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createPR()">Create</button>
        <button class="btn-ghost" (click)="showCreatePR = false">Cancel</button>
      </div>
    </div>

    <!-- PR Detail Panel -->
    <div *ngIf="selectedPR" class="form-card">
      <div class="detail-header">
        <div>
          <div class="detail-title">{{ selectedPR.requisitionNumber }}</div>
          <span class="badge" [ngClass]="prBadgeClass(selectedPR.status)">{{ selectedPR.status }}</span>
        </div>
        <button class="btn-ghost-sm" (click)="selectedPR = null">✕ Close</button>
      </div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Requested By</span>{{ selectedPR.requestedBy }}</div>
        <div class="info-item"><span class="info-label">Department</span>{{ selectedPR.departmentCode || '—' }}</div>
        <div class="info-item"><span class="info-label">Cost Center</span>{{ selectedPR.costCenterCode || '—' }}</div>
        <div class="info-item"><span class="info-label">Needed By</span>{{ selectedPR.neededByDate | date:'mediumDate' }}</div>
        <div class="info-item"><span class="info-label">Total Est. Cost</span>{{ selectedPR.totalEstimatedCost | currency }}</div>
      </div>
      <!-- Add PR Line -->
      <div *ngIf="selectedPR.status === 'Draft'" class="inline-form">
        <div class="form-grid">
          <div class="form-field"><label>Description</label><input [(ngModel)]="prLineForm.description" /></div>
          <div class="form-field"><label>Qty</label><input type="number" [(ngModel)]="prLineForm.quantity" /></div>
          <div class="form-field"><label>UOM</label><input [(ngModel)]="prLineForm.unitOfMeasure" /></div>
          <div class="form-field"><label>Est. Unit Cost</label><input type="number" [(ngModel)]="prLineForm.estimatedUnitCost" /></div>
          <div class="form-field"><label>GL Account</label><input [(ngModel)]="prLineForm.glAccountCode" /></div>
        </div>
        <button class="btn-primary-sm" (click)="addPRLine()">+ Add Line</button>
      </div>
      <table *ngIf="selectedPR.lines?.length" class="data-table mt">
        <thead><tr><th>#</th><th>Description</th><th class="num">Qty</th><th>UOM</th><th class="num">Est. Unit Cost</th><th class="num">Est. Total</th></tr></thead>
        <tbody>
          <tr *ngFor="let l of selectedPR.lines">
            <td>{{ l.lineNumber }}</td>
            <td>{{ l.description }}</td>
            <td class="num">{{ l.quantity }}</td>
            <td>{{ l.unitOfMeasure }}</td>
            <td class="num">{{ l.estimatedUnitCost | currency }}</td>
            <td class="num">{{ l.estimatedTotalCost | currency }}</td>
          </tr>
        </tbody>
      </table>
      <div class="action-row mt">
        <button *ngIf="selectedPR.status === 'Draft'" class="btn-primary-sm" (click)="submitPR(selectedPR.id)">Submit for Approval</button>
        <button *ngIf="selectedPR.status === 'Submitted'" class="btn-primary-sm" (click)="approvePR(selectedPR.id)">Approve</button>
        <button *ngIf="selectedPR.status === 'Submitted'" class="btn-danger-sm" (click)="rejectPR(selectedPR.id)">Reject</button>
        <button *ngIf="selectedPR.status === 'Approved'" class="btn-primary-sm" (click)="convertPRtoPO(selectedPR.id)">Convert to PO</button>
        <button *ngIf="['Draft','Submitted'].includes(selectedPR.status)" class="btn-ghost-sm" (click)="cancelPR(selectedPR.id)">Cancel</button>
      </div>
    </div>

    <!-- PR List -->
    <table class="data-table mt">
      <thead><tr>
        <th>Number</th><th>Requested By</th><th>Department</th><th>Needed By</th>
        <th class="num">Est. Cost</th><th>Status</th><th>Lines</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let r of requisitions" style="cursor:pointer" (click)="selectPR(r.id)">
          <td><strong>{{ r.requisitionNumber }}</strong></td>
          <td>{{ r.requestedBy }}</td>
          <td>{{ r.departmentCode || '—' }}</td>
          <td>{{ r.neededByDate | date:'mediumDate' }}</td>
          <td class="num">{{ r.totalEstimatedCost | currency }}</td>
          <td><span class="badge" [ngClass]="prBadgeClass(r.status)">{{ r.status }}</span></td>
          <td>{{ r.lineCount }}</td>
        </tr>
      </tbody>
    </table>
    <div *ngIf="!requisitions.length" class="empty mt">No purchase requisitions found.</div>
  </div>

  <!-- ── PAYMENT PROPOSALS ── -->
  <div *ngIf="activeTab === 'proposals'" class="tab-content">
    <div class="toolbar">
      <button class="btn-primary" (click)="openCreateProposal()">+ New Payment Proposal</button>
      <button class="btn-ghost" (click)="loadProposals()">↺ Refresh</button>
    </div>

    <!-- Create Proposal Form -->
    <div *ngIf="showCreateProposal" class="form-card">
      <div class="form-title">New Payment Proposal</div>
      <div class="form-grid">
        <div class="form-field"><label>Proposal Date</label><input type="date" [(ngModel)]="proposalForm.proposalDate" /></div>
        <div class="form-field"><label>Payment Date</label><input type="date" [(ngModel)]="proposalForm.paymentDate" /></div>
        <div class="form-field"><label>Payment Method</label>
          <select [(ngModel)]="proposalForm.paymentMethod">
            <option>BankTransfer</option><option>Check</option><option>ACH</option><option>Wire</option>
          </select>
        </div>
        <div class="form-field"><label>Bank Account</label><input [(ngModel)]="proposalForm.bankAccount" /></div>
        <div class="form-field"><label>Notes</label><input [(ngModel)]="proposalForm.notes" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createProposal()">Create</button>
        <button class="btn-ghost" (click)="showCreateProposal = false">Cancel</button>
      </div>
    </div>

    <!-- Proposal Detail -->
    <div *ngIf="selectedProposal" class="form-card">
      <div class="detail-header">
        <div>
          <div class="detail-title">{{ selectedProposal.proposalNumber }}</div>
          <span class="badge" [ngClass]="proposalBadgeClass(selectedProposal.status)">{{ selectedProposal.status }}</span>
        </div>
        <button class="btn-ghost-sm" (click)="selectedProposal = null">✕ Close</button>
      </div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Proposal Date</span>{{ selectedProposal.proposalDate | date:'mediumDate' }}</div>
        <div class="info-item"><span class="info-label">Payment Date</span>{{ selectedProposal.paymentDate | date:'mediumDate' }}</div>
        <div class="info-item"><span class="info-label">Method</span>{{ selectedProposal.paymentMethod }}</div>
        <div class="info-item"><span class="info-label">Total</span>{{ selectedProposal.totalAmount | currency }}</div>
        <div class="info-item" *ngIf="selectedProposal.processedBy"><span class="info-label">Processed By</span>{{ selectedProposal.processedBy }}</div>
      </div>
      <!-- Add invoice line -->
      <div *ngIf="selectedProposal.status === 'Draft'" class="inline-form">
        <div class="form-grid">
          <div class="form-field"><label>Invoice ID</label><input [(ngModel)]="addInvoiceId" placeholder="Paste AP Invoice GUID" /></div>
        </div>
        <button class="btn-primary-sm" (click)="addProposalLine()">+ Add Invoice</button>
      </div>
      <table *ngIf="selectedProposal.lines?.length" class="data-table mt">
        <thead><tr><th>Invoice</th><th>Vendor</th><th>Due Date</th><th class="num">Amount</th><th>Payment</th></tr></thead>
        <tbody>
          <tr *ngFor="let l of selectedProposal.lines">
            <td>{{ l.invoiceNumber }}</td>
            <td>{{ l.vendorName }}</td>
            <td>{{ l.invoiceDueDate | date:'mediumDate' }}</td>
            <td class="num">{{ l.proposedAmount | currency }}</td>
            <td><span *ngIf="l.apPaymentId" class="badge badge-ok">Paid</span></td>
          </tr>
        </tbody>
      </table>
      <div class="action-row mt">
        <button *ngIf="selectedProposal.status === 'Draft'" class="btn-primary-sm" (click)="approveProposal(selectedProposal.id)">Approve</button>
        <button *ngIf="selectedProposal.status === 'Approved'" class="btn-primary-sm" (click)="processProposal(selectedProposal.id)">Process Payment Run</button>
        <button *ngIf="['Draft','Approved'].includes(selectedProposal.status)" class="btn-danger-sm" (click)="cancelProposal(selectedProposal.id)">Cancel</button>
      </div>
    </div>

    <!-- Proposals List -->
    <table class="data-table mt">
      <thead><tr>
        <th>Number</th><th>Proposal Date</th><th>Payment Date</th><th>Method</th>
        <th class="num">Total</th><th>Lines</th><th>Status</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let p of paymentProposals" style="cursor:pointer" (click)="selectProposal(p.id)">
          <td><strong>{{ p.proposalNumber }}</strong></td>
          <td>{{ p.proposalDate | date:'mediumDate' }}</td>
          <td>{{ p.paymentDate | date:'mediumDate' }}</td>
          <td>{{ p.paymentMethod }}</td>
          <td class="num">{{ p.totalAmount | currency }}</td>
          <td>{{ p.lineCount }}</td>
          <td><span class="badge" [ngClass]="proposalBadgeClass(p.status)">{{ p.status }}</span></td>
        </tr>
      </tbody>
    </table>
    <div *ngIf="!paymentProposals.length" class="empty mt">No payment proposals found.</div>
  </div>

  <!-- ── CREDIT NOTES ── -->
  <div *ngIf="activeTab === 'creditnotes'" class="tab-content">
    <div class="toolbar">
      <button class="btn-primary" (click)="openCreateCreditNote()">+ New Credit Note</button>
      <button class="btn-ghost" (click)="loadCreditNotes()">↺ Refresh</button>
    </div>

    <!-- Create CN Form -->
    <div *ngIf="showCreateCN" class="form-card">
      <div class="form-title">New Vendor Credit Note</div>
      <div class="form-grid">
        <div class="form-field"><label>Vendor ID</label><input [(ngModel)]="cnForm.vendorId" placeholder="Vendor GUID" /></div>
        <div class="form-field"><label>Credit Date</label><input type="date" [(ngModel)]="cnForm.creditDate" /></div>
        <div class="form-field"><label>Description</label><input [(ngModel)]="cnForm.description" /></div>
        <div class="form-field"><label>Sub Total</label><input type="number" [(ngModel)]="cnForm.subTotal" /></div>
        <div class="form-field"><label>Tax Amount</label><input type="number" [(ngModel)]="cnForm.taxAmount" /></div>
        <div class="form-field"><label>Reason</label>
          <select [(ngModel)]="cnForm.reason">
            <option>Return</option><option>PriceCorrection</option><option>Dispute</option><option>Overpayment</option><option>Other</option>
          </select>
        </div>
        <div class="form-field"><label>Vendor CN Ref</label><input [(ngModel)]="cnForm.vendorCNRef" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createCreditNote()">Create</button>
        <button class="btn-ghost" (click)="showCreateCN = false">Cancel</button>
      </div>
    </div>

    <!-- CN List -->
    <table class="data-table mt">
      <thead><tr>
        <th>Number</th><th>Vendor</th><th>Date</th><th>Reason</th>
        <th class="num">Total</th><th class="num">Available</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let c of creditNotes">
          <td><strong>{{ c.creditNoteNumber }}</strong></td>
          <td>{{ c.vendorName }}</td>
          <td>{{ c.creditDate | date:'mediumDate' }}</td>
          <td>{{ c.reason }}</td>
          <td class="num">{{ c.totalAmount | currency }}</td>
          <td class="num" [class.ok]="c.availableCredit > 0">{{ c.availableCredit | currency }}</td>
          <td><span class="badge" [ngClass]="cnBadgeClass(c.status)">{{ c.status }}</span></td>
          <td>
            <button *ngIf="c.status === 'Draft'" class="btn-xs" (click)="postCreditNote(c.id)">Post</button>
            <button *ngIf="c.status === 'Posted'" class="btn-xs" (click)="promptApplyCN(c)">Apply</button>
            <button *ngIf="['Draft','Posted'].includes(c.status)" class="btn-xs btn-red" (click)="voidCreditNote(c.id)">Void</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div *ngIf="!creditNotes.length" class="empty mt">No credit notes found.</div>
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
    .btn-ghost-sm { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; padding: .35rem .75rem; border-radius: 5px; cursor: pointer; font-size: .8rem; }
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
    .row-amounts { font-size: .75rem; color: #94a3b8; margin-top: .2rem; display: flex; align-items: center; gap: .35rem; flex-wrap: wrap; }
    .detail-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; overflow-y: auto; max-height: 80vh; }
    .empty-detail { display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: .875rem; min-height: 200px; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .detail-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .action-row { display: flex; gap: .5rem; flex-wrap: wrap; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: .75rem; background: #f8fafc; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .info-item { display: flex; flex-direction: column; gap: .2rem; font-size: .875rem; color: #0f172a; }
    .info-label { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; }
    .sub-section-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; margin: 1rem 0 .5rem; }
    .sub-section-header { display: flex; justify-content: space-between; align-items: center; margin: 1rem 0 .5rem; cursor: pointer; padding: .35rem 0; border-bottom: 1px solid #f1f5f9; }
    .sub-section-header:hover .sub-section-title { color: #475569; }
    .toggle-icon { font-size: .75rem; color: #94a3b8; }
    .receipt-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: .75rem 1rem; margin-bottom: .75rem; background: #fafafa; }
    .receipt-header { display: flex; gap: .75rem; align-items: center; font-size: .875rem; flex-wrap: wrap; }
    .data-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    .data-table th { background: #f8fafc; padding: .5rem .75rem; text-align: left; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: .55rem .75rem; border-bottom: 1px solid #f1f5f9; }
    .data-table tr:hover td { background: #f8fafc; }
    .data-table tr.fully-rcvd td { opacity: .6; }
    .total-row td { background: #f8fafc; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .neg { color: #dc2626; }
    .warn { color: #d97706; }
    .ok { color: #16a34a; }
    .mt { margin-top: 1rem; }
    .ml { margin-left: .25rem; }
    .muted { color: #94a3b8; font-size: .75rem; }
    .badge { display: inline-block; padding: .2rem .5rem; border-radius: 4px; font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    .badge-ok { background: #dcfce7; color: #166534; }
    .badge-vend-active { background: #dcfce7; color: #166534; }
    .badge-vend-inactive { background: #f1f5f9; color: #475569; }
    .badge-vend-onhold { background: #fef9c3; color: #92400e; }
    .badge-vend-blacklisted { background: #fee2e2; color: #dc2626; }
    .badge-po-draft { background: #f1f5f9; color: #475569; }
    .badge-po-sent { background: #dbeafe; color: #1d4ed8; }
    .badge-po-partiallyreceived { background: #fef9c3; color: #92400e; }
    .badge-po-fullyreceived { background: #dcfce7; color: #166534; }
    .badge-po-closed { background: #f1f5f9; color: #475569; }
    .badge-po-cancelled { background: #fee2e2; color: #dc2626; }
    .badge-inv-notinvoiced { background: #f1f5f9; color: #64748b; }
    .badge-inv-partiallyinvoiced { background: #fef9c3; color: #92400e; }
    .badge-inv-fullyinvoiced { background: #dcfce7; color: #166534; }
    .badge-apinv-draft { background: #f1f5f9; color: #475569; }
    .badge-apinv-approved { background: #dbeafe; color: #1d4ed8; }
    .badge-apinv-scheduled { background: #fef9c3; color: #92400e; }
    .badge-apinv-paid { background: #dcfce7; color: #166534; }
    .badge-apinv-overdue { background: #fee2e2; color: #dc2626; }
    .badge-apinv-voided { background: #f1f5f9; color: #94a3b8; }
    .empty { padding: 2rem; text-align: center; color: #94a3b8; font-size: .875rem; }
    code { font-family: monospace; background: #f1f5f9; padding: .1rem .3rem; border-radius: 3px; font-size: .8rem; }
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
    .badge-type-prepay { background: #f0f9ff; color: #0369a1; }
    .badge-match-matched { background: #dcfce7; color: #166534; }
    .badge-match-bypassed { background: #f0fdf4; color: #15803d; }
    .badge-match-qtyexception { background: #fef9c3; color: #92400e; }
    .badge-match-priceexception { background: #fff7ed; color: #c2410c; }
    .badge-match-fullexception { background: #fee2e2; color: #dc2626; }
    .match-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: .75rem 1rem; margin-bottom: .75rem; font-size: .875rem; }
    .match-card-ok { border-color: #86efac; background: #f0fdf4; }
    .match-card-warn { border-color: #fca5a5; background: #fff5f5; }
    .match-header { font-weight: 600; margin-bottom: .35rem; }
    .match-notes { color: #64748b; font-size: .8rem; font-family: monospace; white-space: pre-wrap; }

    /* Vendor profile */
    .balance-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:.75rem; background:#1e293b; border-radius:10px; padding:1rem 1.25rem; margin-bottom:1rem; }
    .balance-cell { display:flex; flex-direction:column; gap:.2rem; }
    .balance-label { font-size:.7rem; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; }
    .balance-val { font-size:1rem; font-weight:700; color:#f1f5f9; }
    .balance-val.neg { color:#f87171; }
    .balance-val.ok { color:#4ade80; }
    .addr-row { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; margin-bottom:1rem; }
    .addr-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:.75rem 1rem; }
    .addr-label { font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#64748b; margin-bottom:.35rem; }
    .addr-body { font-size:.85rem; color:#1e293b; line-height:1.5; }
    .sub-section-header { display:flex; justify-content:space-between; align-items:center; background:#f1f5f9; border-radius:8px; padding:.5rem .75rem; cursor:pointer; margin:.75rem 0 .4rem; user-select:none; }
    .sub-section-title { font-size:.85rem; font-weight:700; color:#334155; margin:0; }
    .toggle-icon { font-size:.75rem; color:#64748b; }
    .ledger-summary { display:flex; gap:1.5rem; font-size:.85rem; padding:.5rem 0; border-bottom:1px solid #e2e8f0; margin-bottom:.5rem; }
    .ledger-payment td { background:#f0fdf4; }
    .badge-ok { background:#dcfce7; color:#166534; }
    .badge-inv { background:#eff6ff; color:#1d4ed8; }
    .num { text-align:right; }
    .muted { color:#94a3b8; font-size:.8rem; }
    .btn-ghost-sm.danger { color:#ef4444; border-color:#fca5a5; }
    .btn-ghost-sm.danger:hover { background:#fef2f2; }
    .section-header-row { display:flex; justify-content:space-between; align-items:center; margin:.75rem 0 .4rem; }
    .inline-form { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; margin-bottom:.75rem; }
    .form-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:.6rem; }
    .addr-cards-grid { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; margin-bottom:.5rem; }
    .addr-card-full { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:.75rem; }
    .addr-card-full.primary-card { border-color:#1d4ed8; background:#eff6ff; }
    .addr-card-head { display:flex; gap:.5rem; align-items:center; margin-bottom:.4rem; flex-wrap:wrap; }
    .addr-type-badge { background:#e2e8f0; color:#475569; font-size:.65rem; font-weight:700; padding:.15rem .4rem; border-radius:4px; text-transform:uppercase; }
    .addr-label-text { font-weight:600; font-size:.85rem; color:#1e293b; flex:1; }
    .primary-badge { background:#dbeafe; color:#1d4ed8; font-size:.65rem; font-weight:700; padding:.15rem .4rem; border-radius:4px; }
    .addr-actions { display:flex; gap:.4rem; margin-top:.5rem; flex-wrap:wrap; }
    .contacts-list { display:flex; flex-direction:column; gap:.5rem; margin-bottom:.5rem; }
    .contact-row { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:.65rem .75rem; }
    .contact-row.primary-card { border-color:#1d4ed8; background:#eff6ff; }
    .contact-info { display:flex; align-items:center; gap:.4rem; margin-bottom:.3rem; flex-wrap:wrap; }
    .contact-name { font-weight:600; font-size:.9rem; color:#1e293b; }
    .contact-title { font-size:.8rem; }
    .contact-details { display:flex; gap:.8rem; font-size:.8rem; color:#475569; margin-bottom:.4rem; flex-wrap:wrap; }
  `]
})
export class AccountsPayableComponent implements OnInit {
  activeTab: Tab = 'vendors';
  tabs = [
    { id: 'vendors' as Tab, label: 'Vendors', icon: '🏭' },
    { id: 'purchaseorders' as Tab, label: 'Purchase Orders', icon: '📦' },
    { id: 'invoices' as Tab, label: 'AP Invoices', icon: '📄' },
    { id: 'requisitions' as Tab, label: 'Requisitions', icon: '📝' },
    { id: 'proposals' as Tab, label: 'Payment Proposals', icon: '💳' },
    { id: 'creditnotes' as Tab, label: 'Credit Notes', icon: '📋' },
    { id: 'aging' as Tab, label: 'Aging Report', icon: '📅' },
  ];

  poStatuses = ['Draft','Sent','PartiallyReceived','FullyReceived','Closed','Cancelled'];

  // Vendors
  vendors: Vendor[] = [];
  selectedVend: Vendor | null = null;
  vendSearch = '';
  showVendForm = false;
  editVend: Vendor | null = null;
  vendForm = { name:'', email:'', phone:'', taxId:'', paymentTermsDays: 30, currency:'USD',
             billingAddress:'', shippingAddress:'', bankAccountName:'', bankAccountNumber:'',
             bankRoutingNumber:'', website:'', notes:'' };
  vendLedger: VendorLedger | null = null;
  showVendLedger = false;

  // Vendor Addresses
  vendAddresses: any[] = [];
  showVendAddrForm = false;
  editingVendAddrId: string | null = null;
  vendAddrForm = { label:'', addressType:'Billing' as string, line1:'', line2:'', city:'', state:'', postalCode:'', country:'US' };

  // Vendor Contacts
  vendContacts: any[] = [];
  showVendContactForm = false;
  editingVendContactId: string | null = null;
  vendContactForm = { name:'', title:'', email:'', phone:'', mobile:'', notes:'' };

  // Purchase Orders
  purchaseOrders: PurchaseOrderSummary[] = [];
  selectedPO: PurchaseOrder | null = null;
  poHistory: any[] = [];
  poStatusFilter = '';
  showCreatePO = false;
  showReceive = false;
  receiveQtys: number[] = [];
  receiveDate: string = '';
  receiveNotes: string = '';
  receipts: Receipt[] = [];
  showReceiptHistory = false;
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

  // Prepayment + 3WM state
  showPrepayForm = false;
  prepayForm = { vendorInvoiceRef:'', invoiceDate:'', dueDate:'', amount: 0, taxAmount: 0, description:'' };
  showBypassForm = false;
  bypassTarget: APInvoice | null = null;
  bypassReason = '';
  showApplyPrepay = false;
  applyPrepayTarget: APInvoice | null = null;
  availablePrepayments: APInvoice[] = [];

  // ── Purchase Requisitions state ───────────────────────────────────────────
  prStatuses = ['Draft','Submitted','Approved','Rejected','Converted','Cancelled'];
  prStatusFilter = '';
  requisitions: any[] = [];
  selectedPR: any = null;
  showCreatePR = false;
  prForm = { requestedBy: '', departmentCode: '', costCenterCode: '', neededByDate: '', notes: '' };
  prLineForm = { description: '', quantity: 1, unitOfMeasure: 'EA', estimatedUnitCost: 0, glAccountCode: '' };

  // ── Payment Proposals state ───────────────────────────────────────────────
  paymentProposals: any[] = [];
  selectedProposal: any = null;
  showCreateProposal = false;
  addInvoiceId = '';
  proposalForm = { proposalDate: '', paymentDate: '', paymentMethod: 'BankTransfer', bankAccount: '', notes: '' };

  // ── Credit Notes state ────────────────────────────────────────────────────
  creditNotes: any[] = [];
  showCreateCN = false;
  cnForm = { vendorId: '', creditDate: '', description: '', subTotal: 0, taxAmount: 0, reason: 'Other', vendorCNRef: '' };

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

  setTab(t: Tab) {
    this.activeTab = t;
    if (t === 'requisitions' && !this.requisitions.length) this.loadRequisitions();
    if (t === 'proposals' && !this.paymentProposals.length) this.loadProposals();
    if (t === 'creditnotes' && !this.creditNotes.length) this.loadCreditNotes();
  }

  // ── Vendors ──────────────────────────────────────────────────────────────────

  openCreateVend() {
    this.editVend = null;
    this.vendForm = { name:'', email:'', phone:'', taxId:'', paymentTermsDays: 30, currency:'USD',
      billingAddress:'', shippingAddress:'', bankAccountName:'', bankAccountNumber:'',
      bankRoutingNumber:'', website:'', notes:'' };
    this.showVendForm = true;
  }

  openEditVend(v: Vendor) {
    this.editVend = v;
    this.vendForm = {
      name: v.name, email: v.email ?? '', phone: v.phone ?? '',
      taxId: v.taxId ?? '', paymentTermsDays: v.paymentTermsDays, currency: v.currency,
      billingAddress: v.billingAddress ?? '', shippingAddress: v.shippingAddress ?? '',
      bankAccountName: v.bankAccountName ?? '', bankAccountNumber: v.bankAccountNumber ?? '',
      bankRoutingNumber: v.bankRoutingNumber ?? '', website: v.website ?? '', notes: v.notes ?? ''
    };
    this.showVendForm = true;
  }

  selectVendor(v: Vendor) {
    this.selectedVend = v;
    this.vendLedger = null;
    this.showVendLedger = false;
    this.vendAddresses = [];
    this.vendContacts = [];
    this.showVendAddrForm = false;
    this.showVendContactForm = false;
    this.api.getVendorAddresses(v.id).subscribe(d => this.vendAddresses = d);
    this.api.getVendorContacts(v.id).subscribe(d => this.vendContacts = d);
  }

  loadVendLedger(id: string) {
    if (this.vendLedger?.vendorId === id) { this.showVendLedger = !this.showVendLedger; return; }
    this.api.getVendorLedger(id).subscribe(d => {
      this.vendLedger = d;
      this.showVendLedger = true;
    });
  }

  toggleVendLedger() { this.showVendLedger = !this.showVendLedger; }

  // ── Vendor Address CRUD ───────────────────────────────────────────────────
  openVendAddrForm() {
    this.editingVendAddrId = null;
    this.vendAddrForm = { label:'', addressType:'Billing', line1:'', line2:'', city:'', state:'', postalCode:'', country:'US' };
    this.showVendAddrForm = true;
  }

  editVendAddr(a: any) {
    this.editingVendAddrId = a.id;
    this.vendAddrForm = { label: a.label, addressType: a.addressType, line1: a.line1, line2: a.line2 ?? '',
      city: a.city, state: a.state ?? '', postalCode: a.postalCode ?? '', country: a.country };
    this.showVendAddrForm = true;
  }

  saveVendAddr() {
    if (!this.selectedVend || !this.vendAddrForm.label.trim() || !this.vendAddrForm.line1.trim() || !this.vendAddrForm.city.trim()) return;
    const req = { ...this.vendAddrForm };
    if (this.editingVendAddrId) {
      this.api.updateVendorAddress(this.selectedVend.id, this.editingVendAddrId, req).subscribe(d => {
        this.vendAddresses = this.vendAddresses.map(a => a.id === d.id ? d : a);
        this.cancelVendAddrForm();
      });
    } else {
      this.api.createVendorAddress(this.selectedVend.id, req).subscribe(d => {
        this.vendAddresses = [...this.vendAddresses, d];
        this.cancelVendAddrForm();
      });
    }
  }

  cancelVendAddrForm() { this.showVendAddrForm = false; this.editingVendAddrId = null; }

  deleteVendAddr(id: string) {
    if (!this.selectedVend || !confirm('Delete this address?')) return;
    this.api.deleteVendorAddress(this.selectedVend.id, id).subscribe(() => {
      this.vendAddresses = this.vendAddresses.filter(a => a.id !== id);
    });
  }

  setPrimaryVendAddr(id: string) {
    if (!this.selectedVend) return;
    this.api.setPrimaryVendorAddress(this.selectedVend.id, id).subscribe(() => {
      this.vendAddresses = this.vendAddresses.map(a => ({ ...a, isPrimary: a.id === id }));
    });
  }

  // ── Vendor Contact CRUD ───────────────────────────────────────────────────
  openVendContactForm() {
    this.editingVendContactId = null;
    this.vendContactForm = { name:'', title:'', email:'', phone:'', mobile:'', notes:'' };
    this.showVendContactForm = true;
  }

  editVendContact(c: any) {
    this.editingVendContactId = c.id;
    this.vendContactForm = { name: c.name, title: c.title ?? '', email: c.email ?? '',
      phone: c.phone ?? '', mobile: c.mobile ?? '', notes: c.notes ?? '' };
    this.showVendContactForm = true;
  }

  saveVendContact() {
    if (!this.selectedVend || !this.vendContactForm.name.trim()) return;
    const req = { ...this.vendContactForm };
    if (this.editingVendContactId) {
      this.api.updateVendorContact(this.selectedVend.id, this.editingVendContactId, req).subscribe(d => {
        this.vendContacts = this.vendContacts.map(c => c.id === d.id ? d : c);
        this.cancelVendContactForm();
      });
    } else {
      this.api.createVendorContact(this.selectedVend.id, req).subscribe(d => {
        this.vendContacts = [...this.vendContacts, d];
        this.cancelVendContactForm();
      });
    }
  }

  cancelVendContactForm() { this.showVendContactForm = false; this.editingVendContactId = null; }

  deleteVendContact(id: string) {
    if (!this.selectedVend || !confirm('Delete this contact?')) return;
    this.api.deleteVendorContact(this.selectedVend.id, id).subscribe(() => {
      this.vendContacts = this.vendContacts.filter(c => c.id !== id);
    });
  }

  setPrimaryVendContact(id: string) {
    if (!this.selectedVend) return;
    this.api.setPrimaryVendorContact(this.selectedVend.id, id).subscribe(() => {
      this.vendContacts = this.vendContacts.map(c => ({ ...c, isPrimary: c.id === id }));
    });
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
      error: (err: any) => alert('Cannot delete: ' + (err.error?.error ?? err.message))
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
      this.receipts = [];
      this.showReceiptHistory = false;
      this.clearLineForm();
    });
    this.api.getPurchaseOrderHistory(id).subscribe(d => this.poHistory = d);
  }

  auditDetails(entry: any): string {
    const raw = entry.newValues || entry.oldValues;
    if (!raw) return '';
    try {
      return Object.entries(JSON.parse(raw))
        .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
        .join(', ');
    } catch {
      return raw;
    }
  }

  toggleReceiptHistory() {
    this.showReceiptHistory = !this.showReceiptHistory;
    if (this.showReceiptHistory && this.selectedPO && !this.receipts.length) {
      this.loadReceipts();
    }
  }

  loadReceipts() {
    if (!this.selectedPO) return;
    this.api.getPOReceipts(this.selectedPO.id).subscribe(d => this.receipts = d);
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

  variantAttrs(v: VariantLookup): string {
    return [v.size, v.color, v.material].filter(Boolean).join(', ');
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
      error: (err: any) => alert('Error: ' + (err.error?.error ?? err.message))
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

  openReceiveForm() {
    this.receiveDate = new Date().toISOString().split('T')[0];
    this.receiveNotes = '';
    this.receiveQtys = (this.selectedPO?.lines ?? []).map(() => 0);
    this.showReceive = true;
  }

  /** True when there is received value not yet fully invoiced */
  hasReceivableToInvoice(): boolean {
    if (!this.selectedPO) return false;
    const receivedHasValue = this.selectedPO.lines.some(l => l.receivedQty > 0);
    return receivedHasValue && this.selectedPO.invoiceStatus !== 'FullyInvoiced';
  }

  submitReceive() {
    if (!this.selectedPO) return;
    const lines = this.selectedPO.lines
      .map((l, i) => ({ lineId: l.id, qty: this.receiveQtys[i] || 0 }))
      .filter(r => r.qty > 0);
    if (!lines.length) return;
    const req = {
      lines,
      receivedDate: this.receiveDate || undefined,
      notes: this.receiveNotes || undefined
    };
    this.api.recordReceipt(this.selectedPO.id, req).subscribe({
      next: () => {
        this.showReceive = false;
        this.receipts = [];          // force reload next time history is opened
        this.showReceiptHistory = false;
        this.selectPO(this.selectedPO!.id);
        this.loadPOs();
      },
      error: (err: any) => alert('Error: ' + (err.error?.error ?? err.message))
    });
  }

  cancelPO() {
    if (!this.selectedPO || !confirm('Cancel this purchase order?')) return;
    this.api.cancelPurchaseOrder(this.selectedPO.id).subscribe({
      next: () => { this.selectPO(this.selectedPO!.id); this.loadPOs(); },
      error: (err: any) => alert('Cannot cancel: ' + (err.error?.error ?? err.message))
    });
  }

  closePO() {
    if (!this.selectedPO || !confirm('Close this PO? No further receipts or invoices will be possible.')) return;
    this.api.closePurchaseOrder(this.selectedPO.id).subscribe({
      next: () => { this.selectPO(this.selectedPO!.id); this.loadPOs(); },
      error: (err: any) => alert('Cannot close: ' + (err.error?.error ?? err.message))
    });
  }

  generateAPInv() {
    if (!this.selectedPO) return;
    const ref = prompt('Enter vendor invoice reference number (e.g. INV-2026-001):');
    if (!ref) return;
    this.api.generateAPInvoice(this.selectedPO.id, ref).subscribe({
      next: () => {
        this.selectPO(this.selectedPO!.id);
        this.loadPOs();
        this.api.getAPInvoices().subscribe(d => this.apInvoices = d);
      },
      error: (err: any) => alert('Invoice failed: ' + (err.error?.error ?? err.message))
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
      error: (err: any) => alert('Failed: ' + (err.error?.message || err.message))
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

  // ── Prepayment Invoice ────────────────────────────────────────────────────────

  openPrepayForm() {
    if (!this.selectedPO) return;
    const today = new Date().toISOString().split('T')[0];
    this.prepayForm = { vendorInvoiceRef:'', invoiceDate: today, dueDate: today, amount: 0, taxAmount: 0, description: '' };
    this.showPrepayForm = true;
  }

  submitPrepay() {
    if (!this.selectedPO || !this.prepayForm.vendorInvoiceRef || !this.prepayForm.amount) return;
    const req = {
      vendorId: this.selectedPO.vendorId,
      purchaseOrderId: this.selectedPO.id,
      vendorInvoiceRef: this.prepayForm.vendorInvoiceRef,
      invoiceDate: this.prepayForm.invoiceDate,
      dueDate: this.prepayForm.dueDate,
      amount: this.prepayForm.amount,
      taxAmount: this.prepayForm.taxAmount,
      description: this.prepayForm.description
    };
    this.api.createPrepaymentInvoice(req).subscribe({
      next: () => {
        this.showPrepayForm = false;
        this.api.getAPInvoices().subscribe(d => this.apInvoices = d);
      },
      error: (err: any) => alert('Error: ' + (err.error?.error ?? err.message))
    });
  }

  // ── Three-Way Match ───────────────────────────────────────────────────────────

  matchIsException(inv: APInvoice): boolean {
    return ['QtyException','PriceException','FullException'].includes(inv.matchStatus);
  }

  runMatch(invoiceId: string) {
    this.api.runThreeWayMatch(invoiceId).subscribe({
      next: () => this.api.getAPInvoices().subscribe(d => {
        this.apInvoices = d;
        this.selectedAPInv = d.find(i => i.id === invoiceId) ?? null;
      }),
      error: (err: any) => alert('Match failed: ' + (err.error?.error ?? err.message))
    });
  }

  openBypassForm(inv: APInvoice) {
    this.bypassTarget = inv;
    this.bypassReason = '';
    this.showBypassForm = true;
  }

  submitBypass() {
    if (!this.bypassTarget || !this.bypassReason.trim()) { alert('A reason is required.'); return; }
    this.api.bypassMatch(this.bypassTarget.id, this.bypassReason).subscribe({
      next: () => {
        this.showBypassForm = false;
        const id = this.bypassTarget!.id;
        this.api.getAPInvoices().subscribe(d => {
          this.apInvoices = d;
          this.selectedAPInv = d.find(i => i.id === id) ?? null;
        });
      },
      error: (err: any) => alert('Bypass failed: ' + (err.error?.error ?? err.message))
    });
  }

  // ── Apply Prepayment ──────────────────────────────────────────────────────────

  openApplyPrepayPanel(inv: APInvoice) {
    this.applyPrepayTarget = inv;
    this.showApplyPrepay = true;
    // Load prepayment invoices for this vendor
    this.api.getAPInvoices(inv.vendorId).subscribe(all => {
      this.availablePrepayments = all.filter(i =>
        i.invoiceType === 'Prepayment' && i.id !== inv.id &&
        ['Draft','Approved'].includes(i.status));
    });
  }

  submitApplyPrepayment(prepaymentId: string) {
    if (!this.applyPrepayTarget) return;
    this.api.applyPrepayment(this.applyPrepayTarget.id, prepaymentId).subscribe({
      next: () => {
        this.showApplyPrepay = false;
        const id = this.applyPrepayTarget!.id;
        this.api.getAPInvoices().subscribe(d => {
          this.apInvoices = d;
          this.selectedAPInv = d.find(i => i.id === id) ?? null;
        });
      },
      error: (err: any) => alert('Apply prepayment failed: ' + (err.error?.error ?? err.message))
    });
  }

  // ── Purchase Requisitions ─────────────────────────────────────────────────

  loadRequisitions() {
    this.api.getRequisitions(this.prStatusFilter || undefined).subscribe(d => this.requisitions = d);
  }

  selectPR(id: string) {
    this.api.getRequisition(id).subscribe(d => this.selectedPR = d);
  }

  createPR() {
    const today = new Date().toISOString().split('T')[0];
    const req = { ...this.prForm, neededByDate: this.prForm.neededByDate || today };
    this.api.createRequisition(req).subscribe({
      next: pr => { this.showCreatePR = false; this.selectedPR = pr; this.loadRequisitions(); },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  addPRLine() {
    if (!this.selectedPR) return;
    this.api.addPRLine(this.selectedPR.id, this.prLineForm).subscribe({
      next: pr => { this.selectedPR = pr; this.prLineForm = { description: '', quantity: 1, unitOfMeasure: 'EA', estimatedUnitCost: 0, glAccountCode: '' }; },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  submitPR(id: string) {
    this.api.submitRequisition(id).subscribe({
      next: pr => { this.selectedPR = pr; this.loadRequisitions(); },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  approvePR(id: string) {
    const approvedBy = prompt('Approver name:') || 'manager';
    this.api.approveRequisition(id, approvedBy).subscribe({
      next: pr => { this.selectedPR = pr; this.loadRequisitions(); },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  rejectPR(id: string) {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    this.api.rejectRequisition(id, reason).subscribe({
      next: pr => { this.selectedPR = pr; this.loadRequisitions(); },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  convertPRtoPO(id: string) {
    const vendorId = prompt('Enter Vendor ID (GUID) for the PO:');
    if (!vendorId) return;
    const today = new Date().toISOString().split('T')[0];
    const req = { vendorId, orderDate: today };
    this.api.convertRequisitionToPO(id, req).subscribe({
      next: () => { this.loadRequisitions(); this.loadPOs(); alert('Purchase Order created from requisition!'); },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  cancelPR(id: string) {
    this.api.cancelRequisition(id).subscribe({
      next: () => { this.selectedPR = null; this.loadRequisitions(); },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  prBadgeClass(status: string) {
    const m: Record<string, string> = {
      Draft: 'badge-po-draft', Submitted: 'badge-po-sent', Approved: 'badge-po-fullyreceived',
      Rejected: 'badge-po-cancelled', Converted: 'badge-inv-fullyinvoiced', Cancelled: 'badge-po-closed'
    };
    return m[status] ?? 'badge-po-draft';
  }

  // ── Payment Proposals ─────────────────────────────────────────────────────

  loadProposals() {
    this.api.getPaymentProposals().subscribe(d => this.paymentProposals = d);
  }

  selectProposal(id: string) {
    this.api.getPaymentProposal(id).subscribe(d => this.selectedProposal = d);
  }

  openCreateProposal() {
    const today = new Date().toISOString().split('T')[0];
    this.proposalForm = { proposalDate: today, paymentDate: today, paymentMethod: 'BankTransfer', bankAccount: '', notes: '' };
    this.showCreateProposal = true;
  }

  createProposal() {
    this.api.createPaymentProposal(this.proposalForm).subscribe({
      next: p => { this.showCreateProposal = false; this.selectedProposal = p; this.loadProposals(); },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  addProposalLine() {
    if (!this.selectedProposal || !this.addInvoiceId.trim()) return;
    this.api.addProposalLine(this.selectedProposal.id, this.addInvoiceId.trim()).subscribe({
      next: (p: any) => { this.selectedProposal = p; this.addInvoiceId = ''; },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  approveProposal(id: string) {
    this.api.approvePaymentProposal(id).subscribe({
      next: (p: any) => { this.selectedProposal = p; this.loadProposals(); },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  processProposal(id: string) {
    const processedBy = prompt('Processed by:') || 'system';
    this.api.processPaymentProposal(id, { processedBy }).subscribe({
      next: (p: any) => { this.selectedProposal = p; this.loadProposals(); alert('Payment run completed!'); },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  cancelProposal(id: string) {
    this.api.cancelPaymentProposal(id).subscribe({
      next: () => { this.selectedProposal = null; this.loadProposals(); },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  proposalBadgeClass(status: string) {
    const m: Record<string, string> = {
      Draft: 'badge-po-draft', Approved: 'badge-apinv-approved',
      Processed: 'badge-po-fullyreceived', Cancelled: 'badge-po-cancelled'
    };
    return m[status] ?? 'badge-po-draft';
  }

  // ── Credit Notes ──────────────────────────────────────────────────────────

  loadCreditNotes() {
    this.api.getVendorCreditNotes().subscribe((d: any[]) => this.creditNotes = d);
  }

  openCreateCreditNote() {
    const today = new Date().toISOString().split('T')[0];
    this.cnForm = { vendorId: '', creditDate: today, description: '', subTotal: 0, taxAmount: 0, reason: 'Other', vendorCNRef: '' };
    this.showCreateCN = true;
  }

  createCreditNote() {
    this.api.createVendorCreditNote(this.cnForm).subscribe({
      next: () => { this.showCreateCN = false; this.loadCreditNotes(); },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  postCreditNote(id: string) {
    this.api.submitVendorCNForApproval(id).subscribe({
      next: () => this.loadCreditNotes(),
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  promptApplyCN(cn: any) {
    const invoiceId = prompt('Enter AP Invoice ID to apply this credit against:');
    if (!invoiceId) return;
    const amount = parseFloat(prompt(`Apply how much? (Available: ${cn.availableCredit})`) ?? '0');
    if (!amount) return;
    this.api.applyVendorCreditNote(cn.id, { apInvoiceId: invoiceId, amount }).subscribe({
      next: () => { this.loadCreditNotes(); alert('Credit applied!'); },
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  voidCreditNote(id: string) {
    if (!confirm('Void this credit note?')) return;
    this.api.voidVendorCreditNote(id).subscribe({
      next: () => this.loadCreditNotes(),
      error: (err: any) => alert('Failed: ' + (err.error?.error ?? err.message))
    });
  }

  cnBadgeClass(status: string) {
    const m: Record<string, string> = {
      Draft: 'badge-po-draft', Posted: 'badge-apinv-approved',
      Applied: 'badge-po-fullyreceived', Voided: 'badge-po-closed'
    };
    return m[status] ?? 'badge-po-draft';
  }

  /** Format match JSON notes into a readable summary string */
  formatMatchNotes(notes: string): string {
    try {
      const n = JSON.parse(notes);
      return [
        `GRN Received: ${this.formatCurrency(n.poReceivedValue)}`,
        `Previously Invoiced: ${this.formatCurrency(n.previouslyInvoiced)}`,
        `Uninvoiced Received: ${this.formatCurrency(n.uninvoicedReceived)}`,
        `Invoice Sub-Total: ${this.formatCurrency(n.invoiceSubTotal)}`,
        `Variance: ${n.variancePct}% (tolerance: ${n.tolerancePct}%)`,
        n.qtyException ? '⚠ Qty Exception: invoice exceeds received value' : '',
        n.priceException ? '⚠ Price Exception: variance exceeds tolerance' : '',
      ].filter(Boolean).join('\n');
    } catch { return notes; }
  }

  private formatCurrency(v: number): string {
    return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(v ?? 0);
  }
}
