import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface PriceAgreement {
  id: string; name: string; notes?: string;
  level: 'Product' | 'Variant';
  productId?: string; productName?: string;
  variantId?: string; variantSku?: string;
  priceType: 'SalesPrice' | 'Cost';
  value: number; currency: string;
  startDate: string; endDate: string;
  isActive: boolean; priority: number;
}

interface VariantSuggestion {
  variantId: string; variantSku: string; productName: string;
  size?: string; color?: string; material?: string;
  currentBasePrice: number; currentBaseCost: number;
  agreedSalesPrice?: number; agreedCost?: number;
  salesPriceAgreementName?: string; costAgreementName?: string;
}

interface Product { id: string; name: string; sku: string; categoryId: string; }
interface ProductVariant { variantId: string; sku: string; size?: string; color?: string; material?: string; }

@Component({
  selector: 'app-trade-agreements',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">📋 Trade Agreements</h1>
      <p class="page-sub">Set Sales Price and Cost by Item or SKU — with date validity</p>
    </div>
  </div>

  <!-- ── Toolbar ── -->
  <div class="toolbar">
    <select class="filter-select" [(ngModel)]="filterProductId" (change)="loadAgreements()">
      <option value="">All Products</option>
      @for (p of products; track p.id) {
        <option [value]="p.id">{{ p.name }}</option>
      }
    </select>
    <select class="filter-select" [(ngModel)]="filterActive" (change)="loadAgreements()">
      <option value="">All Statuses</option>
      <option value="true">Active Only</option>
    </select>
    <button class="btn-primary" (click)="openNew()">+ New Agreement</button>
    <button class="btn-ghost" style="margin-left:8px" (click)="openBulk()">⚡ Bulk Set by Product</button>
  </div>

  <!-- ── Agreements Table ── -->
  <div class="card">
    <table class="tbl">
      <thead>
        <tr>
          <th>Name</th>
          <th>Level</th>
          <th>Item / SKU</th>
          <th>Type</th>
          <th>Value</th>
          <th>Valid From</th>
          <th>Valid To</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @for (a of agreements; track a.id) {
          <tr>
            <td>{{ a.name }}</td>
            <td>
              <span class="level-pill" [style.background]="a.level==='Variant' ? '#ede9fe' : '#dbeafe'"
                    [style.color]="a.level==='Variant' ? '#6d28d9' : '#1d4ed8'">
                {{ a.level === 'Variant' ? 'SKU' : 'Item' }}
              </span>
            </td>
            <td>
              @if (a.level === 'Variant') {
                <code>{{ a.variantSku }}</code>
                <span style="color:#6b7280;font-size:.8rem;margin-left:4px">({{ a.productName }})</span>
              } @else {
                {{ a.productName }}
              }
            </td>
            <td>
              <span class="type-pill" [class.type-sales]="a.priceType==='SalesPrice'" [class.type-cost]="a.priceType==='Cost'">
                {{ a.priceType === 'SalesPrice' ? 'Sales Price' : 'Cost' }}
              </span>
            </td>
            <td class="num">{{ a.value | currency:a.currency }}</td>
            <td>{{ a.startDate | date:'mediumDate' }}</td>
            <td>{{ a.endDate | date:'mediumDate' }}</td>
            <td>
              <span class="status-pill" [class.active]="a.isActive" [class.inactive]="!a.isActive">
                {{ a.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td style="white-space:nowrap">
              <button class="btn-sm" (click)="editAgreement(a)">Edit</button>
              <button class="btn-sm btn-del" (click)="deleteAgreement(a.id)" style="margin-left:4px">Delete</button>
            </td>
          </tr>
        }
        @if (!agreements.length) {
          <tr><td colspan="9" class="empty">No agreements found.</td></tr>
        }
      </tbody>
    </table>
  </div>

  <!-- ── New/Edit Modal ── -->
  @if (showModal) {
    <div class="overlay" (click)="closeModal()"></div>
    <div class="modal">
      <div class="modal-header">
        <h2>{{ editId ? 'Edit' : 'New' }} Price Agreement</h2>
        <button class="close-btn" (click)="closeModal()">✕</button>
      </div>
      <div class="modal-body">

        <div class="field-group">
          <label>Agreement Name *</label>
          <input class="inp" [(ngModel)]="form.name" placeholder="e.g. Spring 2026 Pricing" />
        </div>

        <!-- Level -->
        <div class="field-row">
          <div class="field-group">
            <label>Level *</label>
            <select class="inp" [(ngModel)]="form.level" (change)="onLevelChange()">
              <option value="Product">Item (applies to all SKUs)</option>
              <option value="Variant">SKU (specific variant)</option>
            </select>
          </div>
          <div class="field-group">
            <label>Price Type *</label>
            <select class="inp" [(ngModel)]="form.priceType">
              <option value="SalesPrice">Sales Price</option>
              <option value="Cost">Cost</option>
            </select>
          </div>
        </div>

        <!-- Product picker (always shown) -->
        <div class="field-group">
          <label>Product (Item) *</label>
          <select class="inp" [(ngModel)]="form.productId" (change)="onProductChange()">
            <option value="">— Select Product —</option>
            @for (p of products; track p.id) {
              <option [value]="p.id">{{ p.name }} <span style="color:#9ca3af">({{ p.sku }})</span></option>
            }
          </select>
        </div>

        <!-- Variant picker (only when level = Variant) -->
        @if (form.level === 'Variant' && form.productId) {
          <div class="field-group">
            <label>SKU (Variant) *</label>
            @if (suggestions.length) {
              <select class="inp" [(ngModel)]="form.variantId">
                <option value="">— Select SKU —</option>
                @for (v of suggestions; track v.variantId) {
                  <option [value]="v.variantId">
                    {{ v.variantSku }} — {{ variantLabel(v) }}
                    (Base: {{ v.currentBasePrice | currency }} / Cost: {{ v.currentBaseCost | currency }})
                  </option>
                }
              </select>
            } @else {
              <div class="hint">Loading SKUs…</div>
            }
          </div>
        }

        <!-- Value + Currency -->
        <div class="field-row">
          <div class="field-group">
            <label>{{ form.priceType === 'SalesPrice' ? 'Sales Price' : 'Cost' }} *</label>
            <input class="inp" type="number" min="0" step="0.01" [(ngModel)]="form.value"
              [placeholder]="form.priceType === 'SalesPrice' ? 'e.g. 49.99' : 'e.g. 22.50'" />
          </div>
          <div class="field-group" style="flex:0 0 100px">
            <label>Currency</label>
            <input class="inp" [(ngModel)]="form.currency" placeholder="USD" maxlength="3" />
          </div>
        </div>

        <!-- Dates -->
        <div class="field-row">
          <div class="field-group">
            <label>Valid From</label>
            <input class="inp" type="date" [(ngModel)]="form.startDate" />
          </div>
          <div class="field-group">
            <label>Valid To</label>
            <input class="inp" type="date" [(ngModel)]="form.endDate" />
          </div>
        </div>

        @if (editId) {
          <div class="field-group">
            <label>
              <input type="checkbox" [(ngModel)]="form.isActive" style="margin-right:6px" />
              Active
            </label>
          </div>
        }

        <div class="field-group">
          <label>Notes</label>
          <input class="inp" [(ngModel)]="form.notes" placeholder="Optional notes" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" (click)="closeModal()">Cancel</button>
        <button class="btn-primary" (click)="save()"
          [disabled]="!form.name || !form.productId || !form.value">
          {{ editId ? 'Update' : 'Create' }}
        </button>
      </div>
    </div>
  }

  <!-- ── Bulk Apply Modal ── -->
  @if (showBulkModal) {
    <div class="overlay" (click)="showBulkModal=false"></div>
    <div class="modal" style="max-width:700px">
      <div class="modal-header">
        <h2>⚡ Bulk Set Prices by Product</h2>
        <button class="close-btn" (click)="showBulkModal=false">✕</button>
      </div>
      <div class="modal-body">
        <p class="hint-text">Set the same Sales Price or Cost for all SKUs of a product in one shot.
          A separate agreement is created/updated per SKU.</p>

        <div class="field-row">
          <div class="field-group">
            <label>Product *</label>
            <select class="inp" [(ngModel)]="bulk.productId" (change)="loadBulkSuggestions()">
              <option value="">— Select Product —</option>
              @for (p of products; track p.id) {
                <option [value]="p.id">{{ p.name }}</option>
              }
            </select>
          </div>
          <div class="field-group">
            <label>Price Type *</label>
            <select class="inp" [(ngModel)]="bulk.priceType" (change)="loadBulkSuggestions()">
              <option value="SalesPrice">Sales Price</option>
              <option value="Cost">Cost</option>
            </select>
          </div>
        </div>

        <div class="field-row">
          <div class="field-group">
            <label>Agreement Name *</label>
            <input class="inp" [(ngModel)]="bulk.name" placeholder="e.g. Spring 2026 Cost" />
          </div>
          <div class="field-group">
            <label>{{ bulk.priceType === 'SalesPrice' ? 'Sales Price' : 'Cost' }} for All SKUs *</label>
            <input class="inp" type="number" min="0" step="0.01" [(ngModel)]="bulk.value" />
          </div>
        </div>

        <div class="field-row">
          <div class="field-group">
            <label>Valid From</label>
            <input class="inp" type="date" [(ngModel)]="bulk.startDate" />
          </div>
          <div class="field-group">
            <label>Valid To</label>
            <input class="inp" type="date" [(ngModel)]="bulk.endDate" />
          </div>
        </div>

        <!-- Preview table -->
        @if (bulkSuggestions.length) {
          <div style="margin-top:1rem">
            <div style="font-weight:600;font-size:.88rem;margin-bottom:.5rem;color:#374151">
              Preview — {{ bulkSuggestions.length }} SKU(s)
            </div>
            <table class="tbl tbl-sm">
              <thead>
                <tr>
                  <th>SKU</th><th>Size / Color / Material</th>
                  <th>Current Base Price</th><th>Current Cost</th>
                  <th>New {{ bulk.priceType === 'SalesPrice' ? 'Sales Price' : 'Cost' }}</th>
                </tr>
              </thead>
              <tbody>
                @for (v of bulkSuggestions; track v.variantId) {
                  <tr>
                    <td><code>{{ v.variantSku }}</code></td>
                    <td style="color:#6b7280;font-size:.8rem">{{ variantLabel(v) }}</td>
                    <td class="num">{{ v.currentBasePrice | currency }}</td>
                    <td class="num">{{ v.currentBaseCost | currency }}</td>
                    <td class="num" style="color:#059669;font-weight:600">
                      {{ bulk.value | currency:'USD':'symbol':'1.2-2' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (bulkMsg) {
          <div class="success-msg">✓ {{ bulkMsg }}</div>
        }
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" (click)="showBulkModal=false">Close</button>
        <button class="btn-primary" (click)="applyBulk()"
          [disabled]="!bulk.productId || !bulk.name || !bulk.value">
          Apply to All SKUs
        </button>
      </div>
    </div>
  }

  <!-- ── Effective Price Lookup ── -->
  <div class="card" style="margin-top:1rem">
    <div class="card-header">🔍 Check Effective Price for a SKU</div>
    <div class="lookup-row">
      <div class="field-group" style="flex:1">
        <label>Product</label>
        <select class="inp" [(ngModel)]="lookupProductId" (change)="loadLookupSuggestions()">
          <option value="">— Select Product —</option>
          @for (p of products; track p.id) {
            <option [value]="p.id">{{ p.name }}</option>
          }
        </select>
      </div>
      <div class="field-group" style="flex:1">
        <label>SKU</label>
        <select class="inp" [(ngModel)]="lookupVariantId" [disabled]="!lookupSuggestions.length">
          <option value="">— Select SKU —</option>
          @for (v of lookupSuggestions; track v.variantId) {
            <option [value]="v.variantId">{{ v.variantSku }} — {{ variantLabel(v) }}</option>
          }
        </select>
      </div>
      <button class="btn-primary" style="align-self:flex-end" (click)="checkEffectivePrice()"
        [disabled]="!lookupVariantId">Check</button>
    </div>

    @if (effectivePrice) {
      <div class="effective-result">
        <div class="eff-row">
          <div class="eff-card">
            <div class="eff-label">Sales Price</div>
            <div class="eff-value">
              {{ (effectivePrice.agreedSalesPrice ?? effectivePrice.basePrice) | currency }}
            </div>
            <div class="eff-source">
              @if (effectivePrice.agreedSalesPrice != null) {
                <span class="eff-agreed">✓ Agreement: {{ effectivePrice.salesPriceAgreementName }}
                  ({{ effectivePrice.salesPriceLevel }})</span>
              } @else {
                <span class="eff-base">↑ Using base price</span>
              }
            </div>
          </div>
          <div class="eff-card">
            <div class="eff-label">Cost</div>
            <div class="eff-value">
              {{ (effectivePrice.agreedCost ?? effectivePrice.baseCost) | currency }}
            </div>
            <div class="eff-source">
              @if (effectivePrice.agreedCost != null) {
                <span class="eff-agreed">✓ Agreement: {{ effectivePrice.costAgreementName }}
                  ({{ effectivePrice.costLevel }})</span>
              } @else {
                <span class="eff-base">↑ Using base cost</span>
              }
            </div>
          </div>
          <div class="eff-card">
            <div class="eff-label">Margin</div>
            <div class="eff-value" [style.color]="margin() >= 0 ? '#059669' : '#dc2626'">
              {{ margin() | currency }} ({{ marginPct() }}%)
            </div>
            <div class="eff-source eff-base">Sales Price − Cost</div>
          </div>
        </div>
      </div>
    }
  </div>
</div>
  `,
  styles: [`
    .page { padding: 1.5rem; }
    .page-header { margin-bottom: 1.25rem; }
    .page-title { font-size: 1.6rem; font-weight: 700; margin: 0 0 .2rem; }
    .page-sub { color: #6b7280; margin: 0; font-size: .9rem; }

    .toolbar { display: flex; align-items: center; gap: .6rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .filter-select { padding: .4rem .65rem; border: 1px solid #d1d5db; border-radius: 6px;
      font-size: .88rem; background: #fff; min-width: 160px; }

    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
      padding: 1rem; margin-bottom: 1rem; }
    .card-header { font-weight: 600; font-size: .95rem; margin-bottom: .75rem; color: #111827; }

    .tbl { width: 100%; border-collapse: collapse; font-size: .875rem; }
    .tbl th { text-align: left; padding: .5rem .75rem; background: #f9fafb;
      border-bottom: 2px solid #e5e7eb; font-weight: 600; white-space: nowrap; color: #374151; }
    .tbl td { padding: .5rem .75rem; border-bottom: 1px solid #f3f4f6; }
    .tbl tr:hover td { background: #fafafa; }
    .tbl-sm th, .tbl-sm td { padding: .35rem .6rem; font-size: .82rem; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .empty { text-align: center; color: #9ca3af; padding: 2rem !important; }

    .level-pill { display: inline-block; padding: .15rem .5rem; border-radius: 9999px;
      font-size: .75rem; font-weight: 600; }
    .type-pill { display: inline-block; padding: .15rem .5rem; border-radius: 9999px;
      font-size: .75rem; font-weight: 600; }
    .type-sales { background: #d1fae5; color: #065f46; }
    .type-cost  { background: #fef3c7; color: #92400e; }
    .status-pill { display: inline-block; padding: .15rem .5rem; border-radius: 9999px;
      font-size: .75rem; font-weight: 600; }
    .status-pill.active   { background: #d1fae5; color: #065f46; }
    .status-pill.inactive { background: #f3f4f6; color: #6b7280; }

    .btn-sm { padding: .2rem .55rem; font-size: .8rem; border: 1px solid #d1d5db;
      border-radius: 5px; cursor: pointer; background: #fff; color: #374151; }
    .btn-sm:hover { background: #f3f4f6; }
    .btn-del { border-color: #fca5a5; background: #fee2e2; color: #dc2626; }
    .btn-del:hover { background: #fecaca; }
    .btn-primary { padding: .45rem 1rem; background: #4f46e5; color: #fff;
      border: none; border-radius: 6px; cursor: pointer; font-size: .875rem; font-weight: 500; }
    .btn-primary:disabled { opacity: .5; cursor: default; }
    .btn-ghost { padding: .45rem 1rem; background: #fff; color: #374151;
      border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: .875rem; }

    /* Modal */
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 99; }
    .modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      background: #fff; border-radius: 10px; width: min(580px, 96vw);
      max-height: 88vh; display: flex; flex-direction: column; z-index: 100;
      box-shadow: 0 20px 60px rgba(0,0,0,.2); overflow: hidden; }
    .modal-header { display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem; border-bottom: 1px solid #e5e7eb; }
    .modal-header h2 { margin: 0; font-size: 1.1rem; font-weight: 700; }
    .close-btn { background: none; border: none; font-size: 1.1rem; cursor: pointer;
      color: #6b7280; padding: .2rem .4rem; border-radius: 4px; }
    .close-btn:hover { background: #f3f4f6; }
    .modal-body { padding: 1.25rem; overflow-y: auto; flex: 1;
      display: flex; flex-direction: column; gap: .8rem; }
    .modal-footer { padding: .75rem 1.25rem; border-top: 1px solid #e5e7eb;
      display: flex; justify-content: flex-end; gap: .6rem; }

    .field-group { display: flex; flex-direction: column; gap: .3rem; flex: 1; }
    .field-group label { font-size: .82rem; font-weight: 600; color: #374151; }
    .field-row { display: flex; gap: .75rem; }
    .inp { padding: .42rem .7rem; border: 1px solid #d1d5db; border-radius: 6px;
      font-size: .88rem; width: 100%; box-sizing: border-box; }
    .inp:focus { outline: none; border-color: #6366f1; }
    .hint { font-size: .82rem; color: #9ca3af; font-style: italic; }
    .hint-text { font-size: .85rem; color: #6b7280; margin: 0 0 .5rem; }
    .success-msg { margin-top: .75rem; padding: .6rem .9rem; background: #d1fae5;
      color: #065f46; border-radius: 6px; font-size: .88rem; font-weight: 500; }

    /* Effective price lookup */
    .lookup-row { display: flex; gap: .75rem; align-items: flex-end; flex-wrap: wrap; margin-bottom: 1rem; }
    .effective-result { border-top: 1px solid #e5e7eb; padding-top: 1rem; }
    .eff-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .eff-card { flex: 1; min-width: 160px; background: #f9fafb; border: 1px solid #e5e7eb;
      border-radius: 8px; padding: .75rem 1rem; }
    .eff-label { font-size: .75rem; text-transform: uppercase; letter-spacing: .06em;
      color: #9ca3af; font-weight: 600; margin-bottom: .2rem; }
    .eff-value { font-size: 1.4rem; font-weight: 700; color: #111827; margin-bottom: .25rem; }
    .eff-source { font-size: .78rem; }
    .eff-agreed { color: #059669; }
    .eff-base   { color: #6b7280; }
    code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: .8rem; }
  `]
})
export class TradeAgreementsComponent implements OnInit {
  agreements: PriceAgreement[] = [];
  products: Product[] = [];
  suggestions: VariantSuggestion[] = [];
  bulkSuggestions: VariantSuggestion[] = [];
  lookupSuggestions: VariantSuggestion[] = [];
  effectivePrice: any = null;

  filterProductId = '';
  filterActive = '';
  showModal = false;
  showBulkModal = false;
  editId = '';
  bulkMsg = '';
  lookupProductId = '';
  lookupVariantId = '';

  form = this.defaultForm();
  bulk = this.defaultBulk();

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadProducts();
    this.loadAgreements();
  }

  defaultForm() {
    const today = new Date().toISOString().split('T')[0];
    return {
      name: '', notes: '',
      level: 'Product' as 'Product' | 'Variant',
      productId: '', variantId: '',
      priceType: 'SalesPrice' as 'SalesPrice' | 'Cost',
      value: 0, currency: 'USD',
      startDate: today, endDate: '2159-12-31',
      isActive: true
    };
  }

  defaultBulk() {
    const today = new Date().toISOString().split('T')[0];
    return {
      name: '', productId: '',
      priceType: 'SalesPrice' as 'SalesPrice' | 'Cost',
      value: 0, currency: 'USD',
      startDate: today, endDate: '2159-12-31'
    };
  }

  loadProducts() {
    this.api.getProducts().subscribe((d: any) => this.products = d);
  }

  loadAgreements() {
    const params: any = {};
    if (this.filterProductId) params.productId = this.filterProductId;
    if (this.filterActive === 'true') params.activeOnly = true;
    this.api.getPriceAgreements(params).subscribe(d => this.agreements = d as PriceAgreement[]);
  }

  loadSuggestions() {
    if (!this.form.productId) return;
    this.api.getPriceAgreementSuggestions(this.form.productId)
      .subscribe(d => this.suggestions = d as VariantSuggestion[]);
  }

  loadBulkSuggestions() {
    if (!this.bulk.productId) return;
    this.api.getPriceAgreementSuggestions(this.bulk.productId)
      .subscribe(d => this.bulkSuggestions = d as VariantSuggestion[]);
  }

  loadLookupSuggestions() {
    this.lookupVariantId = '';
    this.effectivePrice = null;
    if (!this.lookupProductId) { this.lookupSuggestions = []; return; }
    this.api.getPriceAgreementSuggestions(this.lookupProductId)
      .subscribe(d => this.lookupSuggestions = d as VariantSuggestion[]);
  }

  onLevelChange() {
    this.form.variantId = '';
    this.suggestions = [];
    if (this.form.level === 'Variant' && this.form.productId) this.loadSuggestions();
  }

  onProductChange() {
    this.form.variantId = '';
    this.suggestions = [];
    if (this.form.level === 'Variant') this.loadSuggestions();
  }

  openNew() {
    this.editId = '';
    this.form = this.defaultForm();
    this.suggestions = [];
    this.showModal = true;
  }

  openBulk() {
    this.bulk = this.defaultBulk();
    this.bulkSuggestions = [];
    this.bulkMsg = '';
    this.showBulkModal = true;
  }

  editAgreement(a: PriceAgreement) {
    this.editId = a.id;
    this.form = {
      name: a.name, notes: a.notes ?? '',
      level: a.level,
      productId: a.productId ?? '', variantId: a.variantId ?? '',
      priceType: a.priceType, value: a.value, currency: a.currency,
      startDate: a.startDate.split('T')[0],
      endDate: a.endDate.split('T')[0],
      isActive: a.isActive
    };
    // Load suggestions if editing a Variant-level agreement
    if (a.level === 'Variant' && a.productId) this.loadSuggestions();
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.editId = ''; }

  save() {
    if (!this.form.name.trim() || !this.form.productId) return;
    const payload: any = {
      name: this.form.name,
      notes: this.form.notes || null,
      level: this.form.level,
      priceType: this.form.priceType,
      value: +this.form.value,
      currency: this.form.currency,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      productId: this.form.productId || null,
      variantId: this.form.level === 'Variant' ? (this.form.variantId || null) : null,
    };

    const obs = this.editId
      ? this.api.updatePriceAgreement(this.editId, { ...payload, isActive: this.form.isActive })
      : this.api.createPriceAgreement(payload);

    obs.subscribe({
      next: () => { this.closeModal(); this.loadAgreements(); },
      error: (e: any) => alert(e?.error?.error || 'Failed to save.')
    });
  }

  deleteAgreement(id: string) {
    if (!confirm('Delete this price agreement?')) return;
    this.api.deletePriceAgreement(id).subscribe({ next: () => this.loadAgreements() });
  }

  applyBulk() {
    if (!this.bulk.productId || !this.bulk.name || !this.bulk.value) return;
    const payload = {
      name: this.bulk.name,
      level: 'Variant',
      priceType: this.bulk.priceType,
      value: +this.bulk.value,
      currency: this.bulk.currency,
      startDate: this.bulk.startDate,
      endDate: this.bulk.endDate
    };
    this.api.bulkApplyPriceAgreement(this.bulk.productId, payload).subscribe({
      next: (r: any) => { this.bulkMsg = r.message; this.loadAgreements(); },
      error: (e: any) => alert(e?.error?.error || 'Failed.')
    });
  }

  checkEffectivePrice() {
    if (!this.lookupVariantId) return;
    this.api.getEffectivePrice(this.lookupVariantId).subscribe(d => this.effectivePrice = d);
  }

  variantLabel(v: VariantSuggestion): string {
    return [v.size, v.color, v.material].filter(x => !!x).join(' / ');
  }

  margin(): number {
    if (!this.effectivePrice) return 0;
    const sp   = this.effectivePrice.agreedSalesPrice ?? this.effectivePrice.basePrice;
    const cost = this.effectivePrice.agreedCost       ?? this.effectivePrice.baseCost;
    return Math.round((sp - cost) * 100) / 100;
  }

  marginPct(): string {
    if (!this.effectivePrice) return '0.0';
    const sp = this.effectivePrice.agreedSalesPrice ?? this.effectivePrice.basePrice;
    if (!sp) return '0.0';
    return ((this.margin() / sp) * 100).toFixed(1);
  }
}
