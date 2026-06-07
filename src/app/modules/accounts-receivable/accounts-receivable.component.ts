import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Customer, CustomerAddress, CustomerContact, CustomerLedger, SalesOrderSummary, SalesOrder, ARInvoice, ARAgingReport, VariantLookup } from '../../core/models/erp.models';

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
      <button class="btn-primary" (click)="openCreateCust()">+ New Customer</button>
    </div>

    <div *ngIf="showCustForm" class="form-card">
      <div class="form-title">{{ editCust ? 'Edit Customer' : 'New Customer' }}</div>
      <div class="form-grid">
        <div class="form-field"><label>Name *</label><input [(ngModel)]="custForm.name" /></div>
        <div class="form-field"><label>Email</label><input [(ngModel)]="custForm.email" type="email" /></div>
        <div class="form-field"><label>Phone</label><input [(ngModel)]="custForm.phone" /></div>
        <div class="form-field"><label>Currency</label><input [(ngModel)]="custForm.currency" /></div>
        <div class="form-field"><label>Payment Terms (days)</label><input type="number" [(ngModel)]="custForm.paymentTermsDays" /></div>
        <div class="form-field"><label>Credit Limit</label><input type="number" [(ngModel)]="custForm.creditLimit" /></div>
        <div class="form-field" style="grid-column:1/-1"><label>Billing Address</label><input [(ngModel)]="custForm.billingAddress" placeholder="Street, City, State, ZIP" /></div>
        <div class="form-field" style="grid-column:1/-1"><label>Shipping Address</label><input [(ngModel)]="custForm.shippingAddress" placeholder="Same as billing if empty" /></div>
        <div class="form-field"><label>Website</label><input [(ngModel)]="custForm.website" /></div>
        <div class="form-field" style="grid-column:1/-1"><label>Notes</label><input [(ngModel)]="custForm.notes" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="saveCustomer()">{{ editCust ? 'Save Changes' : 'Create' }}</button>
        <button class="btn-ghost" (click)="showCustForm = false; editCust = null">Cancel</button>
      </div>
    </div>

    <div class="split">
      <div class="list-panel">
        <div *ngFor="let c of filteredCustomers" class="list-row" [class.active]="selectedCust?.id === c.id" (click)="selectCustomer(c)">
          <div class="row-main"><strong>{{ c.name }}</strong><span class="badge" [class]="'badge-' + c.status.toLowerCase()">{{ c.status }}</span></div>
          <div class="row-sub">{{ c.customerNumber }} · {{ c.email || 'No email' }}</div>
          <div class="row-sub" *ngIf="c.outstandingBalance > 0" style="color:#dc2626">Balance: {{ c.outstandingBalance | currency }}</div>
        </div>
        <div *ngIf="!filteredCustomers.length" class="empty">No customers.</div>
      </div>

      <div class="detail-panel" *ngIf="selectedCust">
        <div class="detail-header">
          <div class="detail-title">{{ selectedCust.name }}</div>
          <div class="action-row">
            <button class="btn-primary-sm" (click)="openEditCust(selectedCust)">✏️ Edit</button>
            <button class="btn-ghost-sm" (click)="loadCustLedger(selectedCust.id)">📒 Statement</button>
          </div>
        </div>

        <!-- Balance strip -->
        <div class="balance-strip">
          <div class="balance-cell">
            <span class="balance-label">Outstanding</span>
            <span class="balance-val" [class.neg]="selectedCust.outstandingBalance > 0">{{ selectedCust.outstandingBalance | currency }}</span>
          </div>
          <div class="balance-cell">
            <span class="balance-label">Credit Limit</span>
            <span class="balance-val">{{ selectedCust.creditLimit | currency }}</span>
          </div>
          <div class="balance-cell">
            <span class="balance-label">Available</span>
            <span class="balance-val" [class.ok]="selectedCust.creditAvailable > 0">{{ selectedCust.creditAvailable | currency }}</span>
          </div>
          <div class="balance-cell">
            <span class="balance-label">Terms</span>
            <span class="balance-val">{{ selectedCust.paymentTermsDays }}d</span>
          </div>
        </div>

        <!-- Core info -->
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Customer #</span><span>{{ selectedCust.customerNumber }}</span></div>
          <div class="info-item"><span class="info-label">Email</span><span>{{ selectedCust.email || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Phone</span><span>{{ selectedCust.phone || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Currency</span><span>{{ selectedCust.currency }}</span></div>
          <div class="info-item"><span class="info-label">Status</span><span class="badge" [class]="'badge-' + selectedCust.status.toLowerCase()">{{ selectedCust.status }}</span></div>
          <div class="info-item"><span class="info-label">Since</span><span>{{ selectedCust.createdAt | date:'mediumDate' }}</span></div>
        </div>

        <!-- Addresses section -->
        <div class="section-header-row">
          <span class="sub-section-title">📍 Addresses</span>
          <button class="btn-primary-sm" (click)="openAddressForm()">+ Add Address</button>
        </div>

        <!-- Address form (inline) -->
        <div class="inline-form" *ngIf="showAddrForm">
          <div class="form-grid-3">
            <div class="form-field"><label>Label *</label><input [(ngModel)]="addrForm.label" placeholder="Head Office, Warehouse..." /></div>
            <div class="form-field"><label>Type</label>
              <select [(ngModel)]="addrForm.addressType">
                <option value="Billing">Billing</option>
                <option value="Shipping">Shipping</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-field"><label>Country</label><input [(ngModel)]="addrForm.country" placeholder="US" /></div>
            <div class="form-field" style="grid-column:1/-1"><label>Line 1 *</label><input [(ngModel)]="addrForm.line1" /></div>
            <div class="form-field" style="grid-column:1/-1"><label>Line 2</label><input [(ngModel)]="addrForm.line2" /></div>
            <div class="form-field"><label>City *</label><input [(ngModel)]="addrForm.city" /></div>
            <div class="form-field"><label>State</label><input [(ngModel)]="addrForm.state" /></div>
            <div class="form-field"><label>Postal Code</label><input [(ngModel)]="addrForm.postalCode" /></div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" (click)="saveAddress()">Save</button>
            <button class="btn-ghost-sm" (click)="cancelAddressForm()">Cancel</button>
          </div>
        </div>

        <div class="addr-cards-grid" *ngIf="custAddresses.length">
          <div class="addr-card-full" *ngFor="let a of custAddresses" [class.primary-card]="a.isPrimary">
            <div class="addr-card-head">
              <span class="addr-type-badge">{{ a.addressType }}</span>
              <span class="addr-label-text">{{ a.label }}</span>
              <span class="primary-badge" *ngIf="a.isPrimary">★ Primary</span>
            </div>
            <div class="addr-body">{{ a.singleLine }}</div>
            <div class="addr-actions">
              <button class="btn-ghost-sm" (click)="editAddress(a)">Edit</button>
              <button class="btn-ghost-sm" (click)="setPrimaryAddress(a.id)" *ngIf="!a.isPrimary">Set Primary</button>
              <button class="btn-ghost-sm danger" (click)="deleteAddress(a.id)">Delete</button>
            </div>
          </div>
        </div>
        <div class="empty muted" *ngIf="!custAddresses.length && !showAddrForm">No addresses added yet.</div>

        <!-- Contacts section -->
        <div class="section-header-row" style="margin-top:12px">
          <span class="sub-section-title">👤 Contacts</span>
          <button class="btn-primary-sm" (click)="openContactForm()">+ Add Contact</button>
        </div>

        <!-- Contact form (inline) -->
        <div class="inline-form" *ngIf="showContactForm">
          <div class="form-grid-3">
            <div class="form-field"><label>Name *</label><input [(ngModel)]="contactForm.name" /></div>
            <div class="form-field"><label>Title</label><input [(ngModel)]="contactForm.title" placeholder="AP Manager, Sales Rep..." /></div>
            <div class="form-field"><label>Email</label><input [(ngModel)]="contactForm.email" type="email" /></div>
            <div class="form-field"><label>Phone</label><input [(ngModel)]="contactForm.phone" /></div>
            <div class="form-field"><label>Mobile</label><input [(ngModel)]="contactForm.mobile" /></div>
            <div class="form-field" style="grid-column:1/-1"><label>Notes</label><input [(ngModel)]="contactForm.notes" /></div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" (click)="saveContact()">Save</button>
            <button class="btn-ghost-sm" (click)="cancelContactForm()">Cancel</button>
          </div>
        </div>

        <div class="contacts-list" *ngIf="custContacts.length">
          <div class="contact-row" *ngFor="let c of custContacts" [class.primary-card]="c.isPrimary">
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
              <button class="btn-ghost-sm" (click)="editContact(c)">Edit</button>
              <button class="btn-ghost-sm" (click)="setPrimaryContact(c.id)" *ngIf="!c.isPrimary">Set Primary</button>
              <button class="btn-ghost-sm danger" (click)="deleteContact(c.id)">Delete</button>
            </div>
          </div>
        </div>
        <div class="empty muted" *ngIf="!custContacts.length && !showContactForm">No contacts added yet.</div>

        <div class="info-grid" *ngIf="selectedCust.website || selectedCust.notes">
          <div class="info-item" *ngIf="selectedCust.website"><span class="info-label">Website</span><a [href]="selectedCust.website" target="_blank">{{ selectedCust.website }}</a></div>
          <div class="info-item" *ngIf="selectedCust.notes" style="grid-column:1/-1"><span class="info-label">Notes</span><span>{{ selectedCust.notes }}</span></div>
        </div>

        <!-- Account Statement ledger -->
        <div class="sub-section-header" (click)="toggleCustLedger()">
          <span class="sub-section-title">📒 Account Statement</span>
          <span class="toggle-icon">{{ showCustLedger ? '▲' : '▼' }}</span>
        </div>
        <div *ngIf="showCustLedger && custLedger">
          <div class="ledger-summary">
            <span>Total Invoiced: <strong>{{ custLedger.totalInvoiced | currency }}</strong></span>
            <span>Total Paid: <strong class="ok">{{ custLedger.totalPaid | currency }}</strong></span>
            <span>Outstanding: <strong [class.neg]="custLedger.outstandingBalance > 0">{{ custLedger.outstandingBalance | currency }}</strong></span>
          </div>
          <table class="data-table">
            <thead><tr>
              <th>Type</th><th>Reference</th><th>Date</th>
              <th class="num">Debit</th><th class="num">Credit</th>
              <th class="num">Balance</th><th>Order</th><th>Status</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let e of custLedger.entries" [class.ledger-payment]="e.entryType === 'Payment'">
                <td><span class="badge" [class]="e.entryType === 'Payment' ? 'badge-ok' : 'badge-inv'">{{ e.entryType }}</span></td>
                <td>{{ e.reference }}</td>
                <td>{{ e.date | date:'MMM d, y' }}</td>
                <td class="num" [class.neg]="e.debit > 0">{{ e.debit > 0 ? (e.debit | currency) : '—' }}</td>
                <td class="num" [class.ok]="e.credit > 0">{{ e.credit > 0 ? (e.credit | currency) : '—' }}</td>
                <td class="num" [class.neg]="e.runningBalance > 0"><strong>{{ e.runningBalance | currency }}</strong></td>
                <td class="muted">{{ e.salesOrderNumber || '—' }}</td>
                <td>{{ e.status }}</td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="!custLedger.entries.length" class="empty">No transactions yet.</div>
        </div>
      </div>

      <div class="detail-panel empty-detail" *ngIf="!selectedCust">Select a customer to view details.</div>
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

        <!-- ── Customer picker with inline quick-create ── -->
        <div class="form-field" style="position:relative">
          <label>Customer</label>
          <div style="display:flex;gap:6px;align-items:center">
            <div style="position:relative;flex:1">
              <input [(ngModel)]="custSearchInSO" (ngModelChange)="onCustSearchInSO()"
                (focus)="showCustDropdown=true" (blur)="hideCustDropdown()"
                [placeholder]="soForm.customerId ? selectedSOCustomerName : 'Search customer…'"
                style="width:100%;padding:.45rem .7rem;border:1px solid #d1d5db;border-radius:6px;font-size:.9rem" />
              <div *ngIf="showCustDropdown && custDropdownOptions.length" class="variant-dropdown" style="top:100%;z-index:50">
                <div *ngFor="let c of custDropdownOptions" class="variant-option" (mousedown)="selectSOCustomer(c)">
                  <strong>{{ c.name }}</strong>
                  <span style="color:#6b7280;font-size:.8rem;margin-left:6px">{{ c.customerNumber }}</span>
                </div>
                <div class="variant-option" style="border-top:1px solid #e5e7eb;color:#6366f1;font-weight:600;font-size:.85rem"
                  (mousedown)="showInlineNewCust=true;showCustDropdown=false">
                  + Not listed? Create new customer
                </div>
              </div>
              <div *ngIf="showCustDropdown && !custDropdownOptions.length && custSearchInSO.trim().length === 1" class="variant-dropdown" style="top:100%;z-index:50">
                <div class="variant-option" style="color:#9ca3af;font-style:italic">Type at least 2 characters to search…</div>
              </div>
              <div *ngIf="showCustDropdown && !custDropdownOptions.length && custSearchInSO.trim().length >= 2" class="variant-dropdown" style="top:100%;z-index:50">
                <div class="variant-option" style="color:#6b7280">No customers found</div>
                <div class="variant-option" style="color:#6366f1;font-weight:600"
                  (mousedown)="showInlineNewCust=true;showCustDropdown=false">
                  + Create "{{ custSearchInSO }}" as new customer
                </div>
              </div>
            </div>
            <button *ngIf="soForm.customerId" class="btn-ghost-sm" (click)="clearSOCustomer()" title="Change customer">✕</button>
          </div>

          <!-- Inline quick-create customer form -->
          <div *ngIf="showInlineNewCust" style="margin-top:10px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
            <div style="font-size:.8rem;font-weight:700;color:#374151;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">New Customer</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div class="form-field" style="margin:0"><label style="font-size:.75rem">Name *</label><input [(ngModel)]="inlineCustForm.name" [value]="custSearchInSO" /></div>
              <div class="form-field" style="margin:0"><label style="font-size:.75rem">Email</label><input [(ngModel)]="inlineCustForm.email" type="email" /></div>
              <div class="form-field" style="margin:0"><label style="font-size:.75rem">Phone</label><input [(ngModel)]="inlineCustForm.phone" /></div>
              <div class="form-field" style="margin:0"><label style="font-size:.75rem">Currency</label><input [(ngModel)]="inlineCustForm.currency" /></div>
              <div class="form-field" style="margin:0"><label style="font-size:.75rem">Payment Terms (days)</label><input type="number" [(ngModel)]="inlineCustForm.paymentTermsDays" /></div>
              <div class="form-field" style="margin:0"><label style="font-size:.75rem">Credit Limit</label><input type="number" [(ngModel)]="inlineCustForm.creditLimit" /></div>
            </div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <button class="btn-primary-sm" (click)="createCustomerInline()">✓ Create & Select</button>
              <button class="btn-ghost-sm" (click)="showInlineNewCust=false">Cancel</button>
            </div>
            <div *ngIf="inlineCustError" style="color:#dc2626;font-size:.8rem;margin-top:6px">{{ inlineCustError }}</div>
          </div>
        </div>

        <div class="form-field"><label>Order Date</label><input type="date" [(ngModel)]="soForm.orderDate" /></div>
        <div class="form-field"><label>Requested Ship Date</label><input type="date" [(ngModel)]="soForm.requestedShipDate" /></div>
        <div class="form-field"><label>Customer PO Ref</label><input [(ngModel)]="soForm.customerRef" /></div>
        <div class="form-field"><label>Description</label><input [(ngModel)]="soForm.description" /></div>
        <div class="form-field"><label>Currency</label><input [(ngModel)]="soForm.currency" /></div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="createSO()">Create</button>
        <button class="btn-ghost" (click)="showCreateSO=false;showInlineNewCust=false">Cancel</button>
      </div>
    </div>
    <div class="split">
      <div class="list-panel">
        <div *ngFor="let o of salesOrders" class="list-row" [class.active]="selectedOrder?.id === o.id" (click)="selectOrder(o.id)">
          <div class="row-main">
            <strong>{{ o.orderNumber }}</strong>
            <span class="badge" [class]="'badge-so-' + o.status.toLowerCase()">{{ o.status }}</span>
            <span *ngIf="o.isExported" class="badge badge-exported" [title]="'Exported ' + (o.exportedAt | date:'MMM d, HH:mm')">✓ Exported</span>
          </div>
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
            <button *ngIf="selectedOrder.isExported" class="btn-ghost-sm" (click)="resetExport(selectedOrder)" title="Mark this order for re-export on the next batch run">↩ Re-Export</button>
          </div>
          <div *ngIf="selectedOrder.isExported" class="export-badge">
            ✓ Exported {{ selectedOrder.exportedAt | date:'MMM d, y HH:mm' }}
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
          <span *ngIf="appliedCoupon?.discountType === 'PercentageOff'" style="font-size:.78rem;color:#16a34a;font-weight:600">
            {{ appliedCoupon!.discountValue }}% off will apply
          </span>
        </div>

        <!-- Coupon code (Draft only) -->
        <div *ngIf="selectedOrder.status === 'Draft'" style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
          <span style="font-size:.8rem;font-weight:600;color:#6b7280;text-transform:uppercase">Coupon Code</span>
          <input [(ngModel)]="couponCodeInput" placeholder="Enter promo code…"
            style="padding:.35rem .7rem;border:1px solid #d1d5db;border-radius:6px;font-size:.9rem;width:180px;text-transform:uppercase"
            (keyup.enter)="applyCoupon()" />
          <button class="btn-primary-sm" (click)="applyCoupon()" [disabled]="!couponCodeInput.trim()">Apply</button>
          <span *ngIf="appliedCoupon" style="color:#16a34a;font-size:.85rem;font-weight:600">
            ✓ {{appliedCoupon.promotionName}} — {{couponDiscountLabel}} off each line
          </span>
          <button *ngIf="appliedCoupon" (click)="removeCoupon()" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.85rem">✕ Remove</button>
          <span *ngIf="couponError" style="color:#dc3545;font-size:.85rem">{{couponError}}</span>
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
    .btn-ghost-sm { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: .35rem .75rem; border-radius: 5px; cursor: pointer; font-size: .8rem; }
    .badge-exported { background: #d1fae5; color: #065f46; font-size: .68rem; }
    .export-badge { font-size: .78rem; color: #065f46; background: #d1fae5; border-radius: 5px; padding: .25rem .6rem; margin-top: .4rem; display: inline-block; }
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
    /* Customer profile */
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
    .btn-primary-sm { background:#3b82f6; color:#fff; border:none; padding:.3rem .7rem; border-radius:6px; cursor:pointer; font-size:.8rem; }
    .btn-ghost-sm { background:transparent; border:1px solid #cbd5e1; color:#475569; padding:.3rem .7rem; border-radius:6px; cursor:pointer; font-size:.8rem; }
    .btn-primary-sm:hover { background:#2563eb; }
    .btn-ghost-sm:hover { background:#f1f5f9; }
    .btn-ghost-sm.danger { color:#ef4444; border-color:#fca5a5; }
    .btn-ghost-sm.danger:hover { background:#fef2f2; }
    .section-header-row { display:flex; justify-content:space-between; align-items:center; margin:.75rem 0 .4rem; }
    .inline-form { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; margin-bottom:.75rem; }
    .form-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:.6rem; }
    .form-actions { display:flex; gap:.5rem; margin-top:.75rem; }
    .addr-cards-grid { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; margin-bottom:.5rem; }
    .addr-card-full { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:.75rem; }
    .addr-card-full.primary-card { border-color:#3b82f6; background:#eff6ff; }
    .addr-card-head { display:flex; gap:.5rem; align-items:center; margin-bottom:.4rem; flex-wrap:wrap; }
    .addr-type-badge { background:#e2e8f0; color:#475569; font-size:.65rem; font-weight:700; padding:.15rem .4rem; border-radius:4px; text-transform:uppercase; }
    .addr-label-text { font-weight:600; font-size:.85rem; color:#1e293b; flex:1; }
    .primary-badge { background:#dbeafe; color:#1d4ed8; font-size:.65rem; font-weight:700; padding:.15rem .4rem; border-radius:4px; }
    .addr-actions { display:flex; gap:.4rem; margin-top:.5rem; flex-wrap:wrap; }
    .contacts-list { display:flex; flex-direction:column; gap:.5rem; margin-bottom:.5rem; }
    .contact-row { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:.65rem .75rem; }
    .contact-row.primary-card { border-color:#3b82f6; background:#eff6ff; }
    .contact-info { display:flex; align-items:center; gap:.4rem; margin-bottom:.3rem; flex-wrap:wrap; }
    .contact-name { font-weight:600; font-size:.9rem; color:#1e293b; }
    .contact-title { font-size:.8rem; }
    .contact-details { display:flex; gap:.8rem; font-size:.8rem; color:#475569; margin-bottom:.4rem; flex-wrap:wrap; }
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
  showCustForm = false;
  editCust: Customer | null = null;
  custForm = { name:'', email:'', phone:'', currency:'USD', paymentTermsDays: 30, creditLimit: 10000,
               billingAddress:'', shippingAddress:'', website:'', notes:'' };
  custLedger: CustomerLedger | null = null;
  showCustLedger = false;

  // Address management
  custAddresses: any[] = [];
  showAddrForm = false;
  editingAddrId: string | null = null;
  addrForm = { label:'', addressType:'Billing' as string, line1:'', line2:'', city:'', state:'', postalCode:'', country:'US' };

  // Contact management
  custContacts: any[] = [];
  showContactForm = false;
  editingContactId: string | null = null;
  contactForm = { name:'', title:'', email:'', phone:'', mobile:'', notes:'' };

  salesOrders: SalesOrderSummary[] = [];
  selectedOrder: SalesOrder | null = null;
  soStatusFilter = '';
  showCreateSO = false;
  soForm = { customerId:'', orderDate:'', requestedShipDate:'', customerRef:'', description:'', currency:'USD' };

  // Customer search-dropdown inside SO form
  custSearchInSO = '';
  custDropdownOptions: Customer[] = [];
  showCustDropdown = false;
  showInlineNewCust = false;
  inlineCustForm = { name:'', email:'', phone:'', currency:'USD', paymentTermsDays: 30, creditLimit: 10000 };
  inlineCustError = '';

  get selectedSOCustomerName(): string {
    return this.customers.find(c => c.id === this.soForm.customerId)?.name ?? '';
  }

  private custSearchTimer: any;

  onCustSearchInSO() {
    const q = this.custSearchInSO.trim();
    this.custDropdownOptions = [];

    if (q.length < 2) {
      // Don't search until at least 2 chars — avoids loading 1M records
      this.showCustDropdown = q.length > 0; // show "type more" hint if 1 char
      return;
    }

    // Debounce — wait 300ms after user stops typing before hitting the API
    clearTimeout(this.custSearchTimer);
    this.custSearchTimer = setTimeout(() => {
      const lower = q.toLowerCase();
      // Search locally if customers are already loaded (< ~500 records typical for SMB)
      // For large datasets the backend search endpoint would be called here instead
      this.custDropdownOptions = this.customers
        .filter(c => c.name.toLowerCase().includes(lower) || c.customerNumber.toLowerCase().includes(lower))
        .slice(0, 10);
      this.showCustDropdown = true;
    }, 300);
  }

  selectSOCustomer(c: Customer) {
    this.soForm.customerId = c.id;
    this.custSearchInSO = c.name;
    this.showCustDropdown = false;
    this.soForm.currency = c.currency;
  }

  clearSOCustomer() {
    this.soForm.customerId = '';
    this.custSearchInSO = '';
    this.custDropdownOptions = [];
  }

  hideCustDropdown() {
    // Delay to allow mousedown on dropdown options to fire first
    setTimeout(() => { this.showCustDropdown = false; }, 200);
  }

  createCustomerInline() {
    if (!this.inlineCustForm.name.trim()) { this.inlineCustError = 'Name is required.'; return; }
    this.inlineCustError = '';
    this.api.createCustomer(this.inlineCustForm).subscribe({
      next: (c: Customer) => {
        this.customers = [...this.customers, c];
        this.selectSOCustomer(c);
        this.showInlineNewCust = false;
        this.inlineCustForm = { name:'', email:'', phone:'', currency:'USD', paymentTermsDays: 30, creditLimit: 10000 };
      },
      error: () => { this.inlineCustError = 'Failed to create customer.'; }
    });
  }

  // Variant search for SO line picker
  variantSearchQuery = '';
  variantResults: VariantLookup[] = [];
  selectedVariant: VariantLookup | null = null;
  addLineQty = 1;
  couponCodeInput = '';
  appliedCoupon: { code: string; promotionName: string; discountType: string; discountValue: number } | null = null;
  couponError = '';
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

  private blankCustForm() {
    return { name:'', email:'', phone:'', currency:'USD', paymentTermsDays: 30, creditLimit: 10000,
             billingAddress:'', shippingAddress:'', website:'', notes:'' };
  }

  openCreateCust() {
    this.editCust = null;
    this.custForm = this.blankCustForm();
    this.showCustForm = true;
  }

  selectCustomer(c: Customer) {
    this.selectedCust = c;
    this.custLedger = null;
    this.showCustLedger = false;
    this.custAddresses = [];
    this.custContacts = [];
    this.showAddrForm = false;
    this.showContactForm = false;
    this.api.getCustomerAddresses(c.id).subscribe(d => this.custAddresses = d);
    this.api.getCustomerContacts(c.id).subscribe(d => this.custContacts = d);
  }

  openEditCust(c: Customer) {
    this.editCust = c;
    this.custForm = {
      name: c.name, email: c.email ?? '', phone: c.phone ?? '', currency: c.currency,
      paymentTermsDays: c.paymentTermsDays, creditLimit: c.creditLimit,
      billingAddress: c.billingAddress ?? '', shippingAddress: c.shippingAddress ?? '',
      website: c.website ?? '', notes: c.notes ?? ''
    };
    this.showCustForm = true;
  }

  saveCustomer() {
    if (!this.custForm.name.trim()) return;
    if (this.editCust) {
      this.api.updateCustomer(this.editCust.id, this.custForm).subscribe(updated => {
        this.customers = this.customers.map(c => c.id === updated.id ? updated : c);
        if (this.selectedCust?.id === updated.id) this.selectedCust = updated;
        this.showCustForm = false;
        this.editCust = null;
      });
    } else {
      this.api.createCustomer(this.custForm).subscribe(d => {
        this.customers = [...this.customers, d];
        this.showCustForm = false;
        this.selectedCust = d;
      });
    }
  }

  loadCustLedger(id: string) {
    if (this.custLedger?.customerId === id) { this.showCustLedger = !this.showCustLedger; return; }
    this.api.getCustomerLedger(id).subscribe(d => {
      this.custLedger = d;
      this.showCustLedger = true;
    });
  }

  toggleCustLedger() { this.showCustLedger = !this.showCustLedger; }

  // ── Address CRUD ──────────────────────────────────────────────────────────
  openAddressForm() {
    this.editingAddrId = null;
    this.addrForm = { label:'', addressType:'Billing', line1:'', line2:'', city:'', state:'', postalCode:'', country:'US' };
    this.showAddrForm = true;
  }

  editAddress(a: any) {
    this.editingAddrId = a.id;
    this.addrForm = { label: a.label, addressType: a.addressType, line1: a.line1, line2: a.line2 ?? '',
      city: a.city, state: a.state ?? '', postalCode: a.postalCode ?? '', country: a.country };
    this.showAddrForm = true;
  }

  saveAddress() {
    if (!this.selectedCust || !this.addrForm.label.trim() || !this.addrForm.line1.trim() || !this.addrForm.city.trim()) return;
    const req = { ...this.addrForm };
    if (this.editingAddrId) {
      this.api.updateCustomerAddress(this.selectedCust.id, this.editingAddrId, req).subscribe(d => {
        this.custAddresses = this.custAddresses.map(a => a.id === d.id ? d : a);
        this.cancelAddressForm();
      });
    } else {
      this.api.createCustomerAddress(this.selectedCust.id, req).subscribe(d => {
        this.custAddresses = [...this.custAddresses, d];
        this.cancelAddressForm();
      });
    }
  }

  cancelAddressForm() { this.showAddrForm = false; this.editingAddrId = null; }

  deleteAddress(id: string) {
    if (!this.selectedCust || !confirm('Delete this address?')) return;
    this.api.deleteCustomerAddress(this.selectedCust.id, id).subscribe(() => {
      this.custAddresses = this.custAddresses.filter(a => a.id !== id);
    });
  }

  setPrimaryAddress(id: string) {
    if (!this.selectedCust) return;
    this.api.setPrimaryCustomerAddress(this.selectedCust.id, id).subscribe(() => {
      this.custAddresses = this.custAddresses.map(a => ({ ...a, isPrimary: a.id === id }));
    });
  }

  // ── Contact CRUD ──────────────────────────────────────────────────────────
  openContactForm() {
    this.editingContactId = null;
    this.contactForm = { name:'', title:'', email:'', phone:'', mobile:'', notes:'' };
    this.showContactForm = true;
  }

  editContact(c: any) {
    this.editingContactId = c.id;
    this.contactForm = { name: c.name, title: c.title ?? '', email: c.email ?? '',
      phone: c.phone ?? '', mobile: c.mobile ?? '', notes: c.notes ?? '' };
    this.showContactForm = true;
  }

  saveContact() {
    if (!this.selectedCust || !this.contactForm.name.trim()) return;
    const req = { ...this.contactForm };
    if (this.editingContactId) {
      this.api.updateCustomerContact(this.selectedCust.id, this.editingContactId, req).subscribe(d => {
        this.custContacts = this.custContacts.map(c => c.id === d.id ? d : c);
        this.cancelContactForm();
      });
    } else {
      this.api.createCustomerContact(this.selectedCust.id, req).subscribe(d => {
        this.custContacts = [...this.custContacts, d];
        this.cancelContactForm();
      });
    }
  }

  cancelContactForm() { this.showContactForm = false; this.editingContactId = null; }

  deleteContact(id: string) {
    if (!this.selectedCust || !confirm('Delete this contact?')) return;
    this.api.deleteCustomerContact(this.selectedCust.id, id).subscribe(() => {
      this.custContacts = this.custContacts.filter(c => c.id !== id);
    });
  }

  setPrimaryContact(id: string) {
    if (!this.selectedCust) return;
    this.api.setPrimaryCustomerContact(this.selectedCust.id, id).subscribe(() => {
      this.custContacts = this.custContacts.map(c => ({ ...c, isPrimary: c.id === id }));
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
      this.showInlineNewCust = false;
      this.custSearchInSO = '';
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
    // If a coupon is active and it's a percentage discount, apply it to the new line too
    const discountPct = (this.appliedCoupon?.discountType === 'PercentageOff')
      ? this.appliedCoupon.discountValue
      : 0;
    this.api.addSalesOrderLine(this.selectedOrder.id, {
      productVariantId: this.selectedVariant.variantId,
      quantity: this.addLineQty,
      discountPct
    }).subscribe(d => {
      this.selectedOrder = d;
      this.clearVariant();
      this.addLineQty = 1;
    });
  }

  get couponDiscountLabel(): string {
    if (!this.appliedCoupon) return '';
    if (this.appliedCoupon.discountType === 'PercentageOff')
      return this.appliedCoupon.discountValue + '%';
    if (this.appliedCoupon.discountType === 'FixedAmountOff')
      return '$' + this.appliedCoupon.discountValue;
    return 'Buy ' + this.appliedCoupon.discountValue + ' get free';
  }

  applyCoupon() {
    const code = this.couponCodeInput.trim().toUpperCase();
    if (!code || !this.selectedOrder) return;
    this.couponError = '';
    const orderAmount = this.selectedOrder.grandTotal;
    this.api.validateMarketingCoupon(code, orderAmount).subscribe({
      next: (result) => {
        if (!result.isValid) {
          this.couponError = result.message || 'Invalid coupon.';
          return;
        }
        this.appliedCoupon = { code, promotionName: result.promotionName || '', discountType: result.discountType || '', discountValue: result.discountValue };
        this.couponCodeInput = '';
        this.couponError = '';
      },
      error: () => { this.couponError = 'Failed to validate coupon.'; }
    });
  }

  loadAging() {
    this.api.getARAgingReport().subscribe(d => this.agingReport = d);
  }

  issueInv(id: string) {
    this.api.issueInvoice(id).subscribe(() => {
      this.api.getARInvoices().subscribe(d => {
        this.arInvoices = d;
        this.selectedInv = d.find(i => i.id === id) || null;
      });
    });
  }

  applyPayment(inv: any) {
    this.paymentTarget = inv;
    this.paymentForm = { amount: inv.outstandingAmount, paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'BankTransfer', reference: '' };
    this.showPaymentForm = true;
  }

  voidInv(id: string) {
    if (!confirm('Void this invoice?')) return;
    this.api.voidARInvoice(id).subscribe(() => {
      this.api.getARInvoices().subscribe(d => {
        this.arInvoices = d;
        this.selectedInv = d.find(i => i.id === id) || null;
      });
    });
  }

  submitPayment() {
    if (!this.paymentTarget) return;
    const req = {
      arInvoiceId: this.paymentTarget.id,
      customerId: this.paymentTarget.customerId,
      amount: this.paymentForm.amount,
      paymentDate: this.paymentForm.paymentDate,
      paymentMethod: this.paymentForm.paymentMethod,
      reference: this.paymentForm.reference
    };
    this.api.createARPayment(req).subscribe(() => {
      this.showPaymentForm = false;
      this.paymentTarget = null;
      this.api.getARInvoices().subscribe(d => this.arInvoices = d);
    });
  }

  soAction(action: 'confirm' | 'picking' | 'cancel') {
    if (!this.selectedOrder) return;
    const id = this.selectedOrder.id;
    let obs$;
    if (action === 'confirm') obs$ = this.api.confirmSalesOrder(id);
    else if (action === 'picking') obs$ = this.api.startPicking(id);
    else obs$ = this.api.cancelSalesOrder(id);
    obs$.subscribe(() => this.api.getSalesOrder(id).subscribe(d => this.selectedOrder = d));
  }

  soShip() {
    if (!this.selectedOrder) return;
    const trackingNumber = prompt('Tracking number (optional):') || '';
    this.api.shipSalesOrder(this.selectedOrder.id, { trackingNumber }).subscribe(() =>
      this.api.getSalesOrder(this.selectedOrder!.id).subscribe(d => this.selectedOrder = d)
    );
  }

  soGenerateInvoice() {
    if (!this.selectedOrder) return;
    this.api.generateARInvoice(this.selectedOrder.id).subscribe(() => {
      this.api.getARInvoices().subscribe(d => this.arInvoices = d);
    });
  }

  resetExport(order: any) {
    this.api.resetExport('SalesOrder', [order.id]).subscribe(() =>
      this.loadSalesOrders()
    );
  }

  removeCoupon() {
    this.appliedCoupon = null;
  }

  removeSOLine(lineId: string) {
    if (!this.selectedOrder) return;
    this.api.removeSalesOrderLine(this.selectedOrder.id, lineId).subscribe(() => this.api.getSalesOrder(this.selectedOrder!.id).subscribe(d => this.selectedOrder = d));
  }
}
