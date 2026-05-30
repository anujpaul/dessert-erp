import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Category, Brand, ProductSummary, ProductDetail,
  ProductVariantDto, InventoryDto
} from '../../core/models/erp.models';

type Tab = 'categories' | 'brands' | 'products' | 'inventory';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1 class="page-title">Product Management</h1>
    <p class="page-subtitle">Catalog · Brands · Variants · Inventory</p>
  </div>

  <!-- Tabs -->
  <div class="tab-bar">
    <button class="tab-btn" [class.active]="activeTab()==='categories'" (click)="setTab('categories')">Categories</button>
    <button class="tab-btn" [class.active]="activeTab()==='brands'"     (click)="setTab('brands')">Brands</button>
    <button class="tab-btn" [class.active]="activeTab()==='products'"   (click)="setTab('products')">Products</button>
    <button class="tab-btn" [class.active]="activeTab()==='inventory'"  (click)="setTab('inventory')">
      Inventory
      @if (reorderCount() > 0) {
        <span class="badge badge-warn">{{ reorderCount() }}</span>
      }
    </button>
  </div>

  <!-- ── CATEGORIES TAB ─────────────────────────────────────────────────── -->
  @if (activeTab() === 'categories') {
    <div class="section-row">
      <div class="card" style="flex:1">
        <div class="card-header">
          <span>Categories</span>
          <button class="btn btn-primary btn-sm" (click)="showCatForm=!showCatForm">+ New</button>
        </div>

        @if (showCatForm) {
          <div class="inline-form">
            <input class="form-control" [(ngModel)]="catForm.code"        placeholder="Code (e.g. CLOTHING)" />
            <input class="form-control" [(ngModel)]="catForm.name"        placeholder="Name" />
            <input class="form-control" [(ngModel)]="catForm.description" placeholder="Description (optional)" />
            <select class="form-control" [(ngModel)]="catForm.parentCategoryId">
              <option value="">— No Parent —</option>
              @for (c of categories(); track c.id) {
                <option [value]="c.id">{{ c.name }}</option>
              }
            </select>
            <input class="form-control" type="number" [(ngModel)]="catForm.displayOrder" placeholder="Display Order" />
            <div class="form-actions">
              <button class="btn btn-primary" (click)="createCategory()">Save</button>
              <button class="btn btn-secondary" (click)="showCatForm=false">Cancel</button>
            </div>
          </div>
        }

        <table class="data-table">
          <thead><tr><th>Code</th><th>Name</th><th>Parent</th><th>Order</th><th>Active</th><th></th></tr></thead>
          <tbody>
            @for (c of categories(); track c.id) {
              <tr>
                <td><code>{{ c.code }}</code></td>
                <td>{{ c.name }}</td>
                <td>{{ c.parentCategoryName ?? '—' }}</td>
                <td>{{ c.displayOrder }}</td>
                <td><span class="badge" [class.badge-green]="c.isActive" [class.badge-gray]="!c.isActive">{{ c.isActive ? 'Yes' : 'No' }}</span></td>
                <td>
                  @if (canDelete()) {
                    <button class="btn-icon-danger" title="Delete category"
                      (click)="deleteCategory(c.id, c.name)">🗑</button>
                  }
                </td>
              </tr>
            }
            @if (!categories().length) {
              <tr><td colspan="6" class="empty-row">No categories found.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  }

  <!-- ── BRANDS TAB ──────────────────────────────────────────────────────── -->
  @if (activeTab() === 'brands') {
    <div class="section-row">
      <div class="card" style="flex:1">
        <div class="card-header">
          <span>Brands</span>
          <button class="btn btn-primary btn-sm" (click)="showBrandForm=!showBrandForm">+ New</button>
        </div>

        @if (showBrandForm) {
          <div class="inline-form">
            <input class="form-control" [(ngModel)]="brandForm.code"    placeholder="Code (e.g. DULUTH)" />
            <input class="form-control" [(ngModel)]="brandForm.name"    placeholder="Brand Name" />
            <input class="form-control" [(ngModel)]="brandForm.country" placeholder="Country (optional)" />
            <input class="form-control" [(ngModel)]="brandForm.website" placeholder="Website (optional)" />
            <div class="form-actions">
              <button class="btn btn-primary" (click)="createBrand()">Save</button>
              <button class="btn btn-secondary" (click)="showBrandForm=false">Cancel</button>
            </div>
          </div>
        }

        <table class="data-table">
          <thead><tr><th>Code</th><th>Name</th><th>Country</th><th>Website</th><th>Active</th><th></th></tr></thead>
          <tbody>
            @for (b of brands(); track b.id) {
              <tr>
                <td><code>{{ b.code }}</code></td>
                <td>{{ b.name }}</td>
                <td>{{ b.country ?? '—' }}</td>
                <td>{{ b.website ?? '—' }}</td>
                <td><span class="badge" [class.badge-green]="b.isActive" [class.badge-gray]="!b.isActive">{{ b.isActive ? 'Yes' : 'No' }}</span></td>
                <td>
                  @if (canDelete()) {
                    <button class="btn-icon-danger" title="Delete brand"
                      (click)="deleteBrand(b.id, b.name)">🗑</button>
                  }
                </td>
              </tr>
            }
            @if (!brands().length) {
              <tr><td colspan="6" class="empty-row">No brands found.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  }

  <!-- ── PRODUCTS TAB ────────────────────────────────────────────────────── -->
  @if (activeTab() === 'products') {
    @if (!selectedProduct()) {
      <!-- Product List -->
      <div class="toolbar">
        <input class="form-control search-input" [(ngModel)]="productSearch"
          (ngModelChange)="onProductSearch()" placeholder="Search SKU or name..." />
        <select class="form-control" [(ngModel)]="productStatusFilter" (ngModelChange)="loadProducts()">
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Discontinued">Discontinued</option>
        </select>
        <select class="form-control" [(ngModel)]="productCategoryFilter" (ngModelChange)="loadProducts()">
          <option value="">All Categories</option>
          @for (c of categories(); track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>
        <button class="btn btn-primary" (click)="showProductForm=!showProductForm">+ New Product</button>
      </div>

      @if (showProductForm) {
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header"><span>New Product</span></div>
          <div class="inline-form">
            <div class="form-row">
              <input class="form-control" [(ngModel)]="productForm.sku"  placeholder="Base SKU (e.g. DLT-JACKET)" />
              <input class="form-control" [(ngModel)]="productForm.name" placeholder="Product Name" />
            </div>
            <div class="form-row">
              <select class="form-control" [(ngModel)]="productForm.categoryId">
                <option value="">— Category —</option>
                @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
              </select>
              <select class="form-control" [(ngModel)]="productForm.brandId">
                <option value="">— Brand —</option>
                @for (b of brands(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
              </select>
            </div>
            <div class="form-row">
              <select class="form-control" [(ngModel)]="productForm.productType">
                <option value="Clothing">Clothing</option>
                <option value="Footwear">Footwear</option>
                <option value="Accessory">Accessory</option>
                <option value="Food">Food</option>
                <option value="PersonalCare">Personal Care</option>
                <option value="Other">Other</option>
              </select>
              <select class="form-control" [(ngModel)]="productForm.genderTarget">
                <option value="Unisex">Unisex</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
                <option value="None">None</option>
              </select>
            </div>
            <div class="form-row">
              <input class="form-control" type="number" [(ngModel)]="productForm.basePrice" placeholder="Base Price" />
              <input class="form-control" type="number" [(ngModel)]="productForm.baseCost"  placeholder="Base Cost" />
              <input class="form-control" type="number" [(ngModel)]="productForm.taxRate"   placeholder="Tax Rate %" />
            </div>
            <div class="form-row">
              <input class="form-control" [(ngModel)]="productForm.unitOfMeasure" placeholder="UOM (e.g. Each)" />
              <input class="form-control" [(ngModel)]="productForm.currency"      placeholder="Currency (USD)" />
            </div>
            <textarea class="form-control" [(ngModel)]="productForm.description" placeholder="Short description" rows="2"></textarea>
            <input class="form-control" [(ngModel)]="productForm.tags" placeholder="Tags (comma-separated)" />
            <div class="form-actions">
              <button class="btn btn-primary" (click)="createProduct()">Save Product</button>
              <button class="btn btn-secondary" (click)="showProductForm=false">Cancel</button>
            </div>
          </div>
        </div>
      }

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>SKU</th><th>Name</th><th>Category</th><th>Brand</th>
              <th>Type</th><th>Base Price</th><th>Variants</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of products(); track p.id) {
              <tr>
                <td><code>{{ p.sku }}</code></td>
                <td>{{ p.name }}</td>
                <td>{{ p.categoryName ?? '—' }}</td>
                <td>{{ p.brandName ?? '—' }}</td>
                <td>{{ p.productType }}</td>
                <td>{{ p.basePrice | currency:'USD':'symbol':'1.2-2' }}</td>
                <td>{{ p.variantCount }}</td>
                <td><span class="badge" [ngClass]="statusClass(p.status)">{{ p.status }}</span></td>
                <td>
                  <button class="btn btn-sm btn-secondary" (click)="openProduct(p.id)">Edit ›</button>
                </td>
              </tr>
            }
            @if (!products().length) {
              <tr><td colspan="9" class="empty-row">No products found.</td></tr>
            }
          </tbody>
        </table>
      </div>

    } @else {
      <!-- Product Detail / Variant Editor -->
      <div class="back-bar">
        <button class="btn btn-secondary btn-sm" (click)="closeProduct()">← Back to Products</button>
        <h2 style="margin:0 1rem">{{ selectedProduct()!.name }} <code style="font-size:.85rem">{{ selectedProduct()!.sku }}</code></h2>
        <span class="badge" [ngClass]="statusClass(selectedProduct()!.status)">{{ selectedProduct()!.status }}</span>
        @if (selectedProduct()!.status === 'Active') {
          <button class="btn btn-sm btn-warn" style="margin-left:auto" (click)="changeStatus('Inactive')">Deactivate</button>
        } @else if (selectedProduct()!.status === 'Inactive') {
          <button class="btn btn-sm btn-primary" style="margin-left:auto" (click)="changeStatus('Active')">Activate</button>
        }
      </div>

      <div class="section-row">
        <!-- Variants List -->
        <div class="card" style="flex:2">
          <div class="card-header">
            <span>Variants</span>
            <button class="btn btn-primary btn-sm" (click)="showVariantForm=!showVariantForm">+ Add Variant</button>
          </div>

          @if (showVariantForm) {
            <div class="inline-form">
              <div class="form-row">
                <input class="form-control" [(ngModel)]="variantForm.size"     placeholder="Size (S, M, L, XL, 10oz…)" />
                <input class="form-control" [(ngModel)]="variantForm.color"    placeholder="Color (optional)" />
                <input class="form-control" [(ngModel)]="variantForm.material" placeholder="Material (optional)" />
              </div>
              <div class="form-row">
                <input class="form-control" [(ngModel)]="variantForm.barcode"      placeholder="Barcode (optional)" />
                <input class="form-control" type="number" [(ngModel)]="variantForm.priceOverride" placeholder="Price Override (leave blank = base)" />
                <input class="form-control" type="number" [(ngModel)]="variantForm.costOverride"  placeholder="Cost Override" />
              </div>
              <div class="form-row">
                <input class="form-control" type="number" [(ngModel)]="variantForm.initialStock" placeholder="Initial Stock Qty" />
                <input class="form-control" type="number" [(ngModel)]="variantForm.reorderPoint"  placeholder="Reorder Point" />
                <input class="form-control" [(ngModel)]="variantForm.location" placeholder="Bin/Location (optional)" />
              </div>
              <div class="form-actions">
                <button class="btn btn-primary" (click)="addVariant()">Save Variant</button>
                <button class="btn btn-secondary" (click)="showVariantForm=false">Cancel</button>
              </div>
            </div>
          }

          <table class="data-table">
            <thead>
              <tr><th>SKU</th><th>Size</th><th>Color</th><th>Material</th><th>Price</th><th>QOH</th><th>Available</th><th>Status</th></tr>
            </thead>
            <tbody>
              @for (v of selectedProduct()!.variants; track v.id) {
                <tr>
                  <td><code>{{ v.sku }}</code></td>
                  <td>{{ v.size }}</td>
                  <td>{{ v.color ?? '—' }}</td>
                  <td>{{ v.material ?? '—' }}</td>
                  <td>{{ v.effectivePrice | currency:'USD':'symbol':'1.2-2' }}</td>
                  <td>{{ v.quantityOnHand }}</td>
                  <td>{{ v.quantityAvailable }}</td>
                  <td><span class="badge" [ngClass]="statusClass(v.status)">{{ v.status }}</span></td>
                </tr>
              }
              @if (!selectedProduct()!.variants.length) {
                <tr><td colspan="8" class="empty-row">No variants yet — add one above.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Product Info Card -->
        <div class="card" style="flex:1;align-self:start">
          <div class="card-header"><span>Product Info</span></div>
          <dl class="info-list">
            <dt>Category</dt><dd>{{ selectedProduct()!.categoryName ?? '—' }}</dd>
            <dt>Brand</dt><dd>{{ selectedProduct()!.brandName ?? '—' }}</dd>
            <dt>Type</dt><dd>{{ selectedProduct()!.productType }}</dd>
            <dt>Gender</dt><dd>{{ selectedProduct()!.genderTarget }}</dd>
            <dt>UOM</dt><dd>{{ selectedProduct()!.unitOfMeasure }}</dd>
            <dt>Base Price</dt><dd>{{ selectedProduct()!.basePrice | currency }}</dd>
            <dt>Base Cost</dt><dd>{{ selectedProduct()!.baseCost | currency }}</dd>
            <dt>Tax Rate</dt><dd>{{ selectedProduct()!.taxRate }}%</dd>
            <dt>Tags</dt><dd>{{ selectedProduct()!.tags || '—' }}</dd>
            <dt>Description</dt><dd>{{ selectedProduct()!.description || '—' }}</dd>
          </dl>
        </div>
      </div>
    }
  }

  <!-- ── INVENTORY TAB ───────────────────────────────────────────────────── -->
  @if (activeTab() === 'inventory') {
    <div class="toolbar">
      <label class="toggle-label">
        <input type="checkbox" [(ngModel)]="showNeedsReorder" (ngModelChange)="loadInventory()" />
        Show only reorder-needed
      </label>
      <span class="spacer"></span>
      @if (selectedInventoryVariant()) {
        <button class="btn btn-secondary btn-sm" (click)="clearInventorySelection()">Clear selection</button>
      }
    </div>

    <div class="section-row" style="align-items:flex-start">
      <!-- Inventory Table -->
      <div class="card" style="flex:2">
        <table class="data-table">
          <thead>
            <tr>
              <th>SKU</th><th>Product</th><th>Category</th>
              <th>On Hand</th><th>Reserved</th><th>Available</th>
              <th>Reorder Pt</th><th>Location</th><th>Reorder?</th>
            </tr>
          </thead>
          <tbody>
            @for (inv of inventory(); track inv.id) {
              <tr [class.selected-row]="selectedInventoryVariant()===inv.productVariantId"
                  (click)="selectInventoryVariant(inv)" style="cursor:pointer">
                <td><code>{{ inv.variantSku }}</code></td>
                <td>{{ inv.productName }}</td>
                <td>{{ inv.categoryName ?? '—' }}</td>
                <td>{{ inv.quantityOnHand }}</td>
                <td>{{ inv.quantityReserved }}</td>
                <td>{{ inv.quantityAvailable }}</td>
                <td>{{ inv.reorderPoint }}</td>
                <td>{{ inv.location ?? '—' }}</td>
                <td>
                  @if (inv.needsReorder) {
                    <span class="badge badge-warn">⚠ Reorder</span>
                  }
                </td>
              </tr>
            }
            @if (!inventory().length) {
              <tr><td colspan="9" class="empty-row">No inventory records found.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Inventory Actions Panel -->
      @if (selectedInventoryVariant()) {
        <div class="card" style="flex:1;min-width:280px">
          <div class="card-header"><span>Adjust Inventory</span></div>
          <div class="inline-form">
            <label class="form-label">Adjustment (+ or –)</label>
            <input class="form-control" type="number" [(ngModel)]="invAdjDelta" placeholder="e.g. 10 or -5" />
            <input class="form-control" [(ngModel)]="invAdjReason" placeholder="Reason (e.g. Received PO)" />
            <button class="btn btn-primary" (click)="adjustInventory()">Apply Adjustment</button>

            <hr style="margin:1rem 0">

            <label class="form-label">Set On-Hand Count</label>
            <input class="form-control" type="number" [(ngModel)]="invSetQty" placeholder="Physical count qty" />
            <button class="btn btn-secondary" (click)="setInventory()">Set Count</button>

            <hr style="margin:1rem 0">

            <label class="form-label">Thresholds</label>
            <input class="form-control" type="number" [(ngModel)]="invThresholds.reorderPoint"  placeholder="Reorder Point" />
            <input class="form-control" type="number" [(ngModel)]="invThresholds.minimumStock"  placeholder="Min Stock" />
            <input class="form-control" type="number" [(ngModel)]="invThresholds.maximumStock"  placeholder="Max Stock" />
            <button class="btn btn-secondary" (click)="updateThresholds()">Save Thresholds</button>
          </div>
        </div>
      }
    </div>
  }
</div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; }
    .page-header { margin-bottom: 1.5rem; }
    .page-title { font-size: 1.75rem; font-weight: 700; margin: 0 0 .25rem; }
    .page-subtitle { color: var(--text-secondary, #666); margin: 0; }

    .tab-bar { display: flex; gap: .5rem; margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-color, #e5e7eb); padding-bottom: .5rem; }
    .tab-btn { background: none; border: none; padding: .5rem 1rem; cursor: pointer; border-radius: 6px 6px 0 0; font-size: .9rem; color: var(--text-secondary, #666); }
    .tab-btn.active { background: var(--primary, #2563eb); color: #fff; }

    .section-row { display: flex; gap: 1rem; }
    .card { background: var(--card-bg, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .card-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; margin-bottom: 1rem; }

    .toolbar { display: flex; gap: .75rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 200px; }
    .spacer { flex: 1; }
    .back-bar { display: flex; align-items: center; gap: .75rem; margin-bottom: 1rem; flex-wrap: wrap; }

    .inline-form { display: flex; flex-direction: column; gap: .6rem; padding: 1rem; background: var(--surface-alt, #f9fafb); border-radius: 6px; margin-bottom: 1rem; }
    .form-row { display: flex; gap: .6rem; }
    .form-row .form-control { flex: 1; }
    .form-actions { display: flex; gap: .5rem; }
    .form-label { font-size: .85rem; font-weight: 500; margin-bottom: .25rem; }
    .form-control { padding: .45rem .75rem; border: 1px solid var(--border-color, #d1d5db); border-radius: 6px; font-size: .9rem; width: 100%; box-sizing: border-box; background: var(--input-bg, #fff); color: var(--text-primary, #111); }
    textarea.form-control { resize: vertical; }

    .data-table { width: 100%; border-collapse: collapse; font-size: .88rem; }
    .data-table th { text-align: left; padding: .5rem .75rem; background: var(--surface-alt, #f3f4f6); border-bottom: 2px solid var(--border-color, #e5e7eb); font-weight: 600; white-space: nowrap; }
    .data-table td { padding: .5rem .75rem; border-bottom: 1px solid var(--border-color, #e5e7eb); }
    .data-table tr:hover td { background: var(--hover-bg, #f9fafb); }
    .selected-row td { background: var(--selected-bg, #eff6ff) !important; }
    .empty-row { text-align: center; color: var(--text-secondary, #9ca3af); padding: 2rem !important; }

    .btn { padding: .45rem .9rem; border: none; border-radius: 6px; cursor: pointer; font-size: .88rem; font-weight: 500; }
    .btn-primary   { background: var(--primary, #2563eb); color: #fff; }
    .btn-secondary { background: var(--surface-alt, #e5e7eb); color: var(--text-primary, #374151); }
    .btn-warn      { background: #ef4444; color: #fff; }
    .btn-sm        { padding: .3rem .7rem; font-size: .82rem; }

    .badge { display: inline-block; padding: .15rem .55rem; border-radius: 9999px; font-size: .75rem; font-weight: 600; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-gray  { background: #f3f4f6; color: #6b7280; }
    .badge-warn  { background: #fef3c7; color: #92400e; }
    .badge-blue  { background: #dbeafe; color: #1e40af; }
    .badge-red   { background: #fee2e2; color: #991b1b; }

    .toggle-label { display: flex; align-items: center; gap: .4rem; cursor: pointer; font-size: .9rem; }

    .info-list { display: grid; grid-template-columns: 1fr 2fr; gap: .4rem .5rem; margin: 0; font-size: .88rem; }
    dt { font-weight: 600; color: var(--text-secondary, #6b7280); }
    dd { margin: 0; }
  `]
})
export class ProductManagementComponent implements OnInit {
  activeTab = signal<Tab>('categories');

  // Categories
  categories = signal<Category[]>([]);
  showCatForm = false;
  catForm = { code: '', name: '', description: '', parentCategoryId: '', displayOrder: 0 };

  // Brands
  brands = signal<Brand[]>([]);
  showBrandForm = false;
  brandForm = { code: '', name: '', country: '', website: '' };

  // Products
  products = signal<ProductSummary[]>([]);
  selectedProduct = signal<ProductDetail | null>(null);
  showProductForm = false;
  productSearch = '';
  productStatusFilter = '';
  productCategoryFilter = '';
  productForm = {
    sku: '', name: '', categoryId: '', brandId: '',
    productType: 'Clothing', genderTarget: 'Unisex',
    basePrice: 0, baseCost: 0, taxRate: 8, unitOfMeasure: 'Each',
    currency: 'USD', description: '', tags: ''
  };

  // Variants
  showVariantForm = false;
  variantForm = {
    size: '', color: '', material: '', barcode: '',
    priceOverride: null as number | null,
    costOverride: null as number | null,
    initialStock: 0, reorderPoint: 5, location: ''
  };

  // Inventory
  inventory = signal<InventoryDto[]>([]);
  showNeedsReorder = false;
  selectedInventoryVariant = signal<string | null>(null);
  invAdjDelta = 0;
  invAdjReason = '';
  invSetQty = 0;
  invThresholds = { reorderPoint: 0, minimumStock: 0, maximumStock: 0 };

  reorderCount = computed(() => this.inventory().filter(i => i.needsReorder).length);

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.loadCategories();
    this.loadBrands();
    this.loadProducts();
    this.loadInventory();
  }

  setTab(t: Tab) {
    this.activeTab.set(t);
    if (t === 'categories') this.loadCategories();
    if (t === 'brands') this.loadBrands();
    if (t === 'products') this.loadProducts();
    if (t === 'inventory') this.loadInventory();
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  loadCategories() {
    this.api.getCategories().subscribe(list => this.categories.set(list));
  }

  createCategory() {
    const req = {
      code: this.catForm.code.trim().toUpperCase(),
      name: this.catForm.name.trim(),
      description: this.catForm.description || null,
      parentCategoryId: this.catForm.parentCategoryId || null,
      displayOrder: this.catForm.displayOrder
    };
    this.api.createCategory(req).subscribe({
      next: () => {
        this.showCatForm = false;
        this.catForm = { code: '', name: '', description: '', parentCategoryId: '', displayOrder: 0 };
        this.loadCategories();
      },
      error: err => alert('Error: ' + (err.error?.title ?? err.message))
    });
  }

  // ── Role guards ────────────────────────────────────────────────────────────

  canDelete(): boolean {
    return this.auth.hasAnyRole('Admin', 'Manager');
  }

  deleteCategory(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    this.api.deleteCategory(id).subscribe({
      next: () => this.loadCategories(),
      error: err => alert('Error: ' + (err.error?.error ?? err.error?.title ?? err.message))
    });
  }

  deleteBrand(id: string, name: string) {
    if (!confirm(`Delete brand "${name}"? This cannot be undone.`)) return;
    this.api.deleteBrand(id).subscribe({
      next: () => this.loadBrands(),
      error: err => alert('Error: ' + (err.error?.error ?? err.error?.title ?? err.message))
    });
  }

  // ── Brands ─────────────────────────────────────────────────────────────────

  loadBrands() {
    this.api.getBrands().subscribe(list => this.brands.set(list));
  }

  createBrand() {
    const req = {
      code: this.brandForm.code.trim().toUpperCase(),
      name: this.brandForm.name.trim(),
      country: this.brandForm.country || null,
      website: this.brandForm.website || null
    };
    this.api.createBrand(req).subscribe({
      next: () => {
        this.showBrandForm = false;
        this.brandForm = { code: '', name: '', country: '', website: '' };
        this.loadBrands();
      },
      error: err => alert('Error: ' + (err.error?.title ?? err.message))
    });
  }

  // ── Products ───────────────────────────────────────────────────────────────

  loadProducts() {
    this.api.getProducts({
      categoryId: this.productCategoryFilter || undefined,
      status: this.productStatusFilter || undefined,
      search: this.productSearch || undefined
    }).subscribe(list => this.products.set(list));
  }

  onProductSearch() {
    // debounce via simple timeout if needed — for now immediate
    this.loadProducts();
  }

  createProduct() {
    const req = {
      sku: this.productForm.sku.trim().toUpperCase(),
      name: this.productForm.name.trim(),
      categoryId: this.productForm.categoryId || null,
      brandId: this.productForm.brandId || null,
      productType: this.productForm.productType,
      genderTarget: this.productForm.genderTarget,
      basePrice: +this.productForm.basePrice,
      baseCost: +this.productForm.baseCost,
      taxRate: +this.productForm.taxRate,
      unitOfMeasure: this.productForm.unitOfMeasure,
      currency: this.productForm.currency,
      description: this.productForm.description || null,
      tags: this.productForm.tags || null
    };
    this.api.createProduct(req).subscribe({
      next: () => {
        this.showProductForm = false;
        this.productForm = { sku: '', name: '', categoryId: '', brandId: '', productType: 'Clothing', genderTarget: 'Unisex', basePrice: 0, baseCost: 0, taxRate: 8, unitOfMeasure: 'Each', currency: 'USD', description: '', tags: '' };
        this.loadProducts();
      },
      error: err => alert('Error: ' + (err.error?.title ?? err.message))
    });
  }

  openProduct(id: string) {
    this.api.getProduct(id).subscribe(p => this.selectedProduct.set(p));
  }

  closeProduct() {
    this.selectedProduct.set(null);
    this.showVariantForm = false;
    this.loadProducts();
  }

  changeStatus(status: string) {
    const p = this.selectedProduct();
    if (!p) return;
    this.api.changeProductStatus(p.id, status).subscribe(() => this.openProduct(p.id));
  }

  // ── Variants ───────────────────────────────────────────────────────────────

  addVariant() {
    const p = this.selectedProduct();
    if (!p) return;
    const req = {
      size: this.variantForm.size.trim(),
      color: this.variantForm.color || null,
      material: this.variantForm.material || null,
      barcode: this.variantForm.barcode || null,
      priceOverride: this.variantForm.priceOverride,
      costOverride: this.variantForm.costOverride,
      initialStock: +this.variantForm.initialStock,
      reorderPoint: +this.variantForm.reorderPoint,
      location: this.variantForm.location || null
    };
    this.api.addVariant(p.id, req).subscribe({
      next: () => {
        this.showVariantForm = false;
        this.variantForm = { size: '', color: '', material: '', barcode: '', priceOverride: null, costOverride: null, initialStock: 0, reorderPoint: 5, location: '' };
        this.openProduct(p.id);
        this.loadInventory();
      },
      error: err => alert('Error: ' + (err.error?.title ?? err.message))
    });
  }

  // ── Inventory ──────────────────────────────────────────────────────────────

  loadInventory() {
    this.api.getInventory(this.showNeedsReorder).subscribe(list => {
      this.inventory.set(list);
    });
  }

  selectInventoryVariant(inv: InventoryDto) {
    this.selectedInventoryVariant.set(inv.productVariantId);
    this.invThresholds = {
      reorderPoint: inv.reorderPoint,
      minimumStock: inv.minimumStock,
      maximumStock: inv.maximumStock
    };
  }

  clearInventorySelection() {
    this.selectedInventoryVariant.set(null);
    this.invAdjDelta = 0;
    this.invAdjReason = '';
    this.invSetQty = 0;
  }

  adjustInventory() {
    const id = this.selectedInventoryVariant();
    if (!id) return;
    this.api.adjustInventory(id, { delta: +this.invAdjDelta, reason: this.invAdjReason }).subscribe({
      next: () => { this.invAdjDelta = 0; this.invAdjReason = ''; this.loadInventory(); },
      error: err => alert('Error: ' + (err.error?.title ?? err.message))
    });
  }

  setInventory() {
    const id = this.selectedInventoryVariant();
    if (!id) return;
    this.api.setInventory(id, { quantity: +this.invSetQty, countDate: new Date().toISOString() }).subscribe({
      next: () => { this.invSetQty = 0; this.loadInventory(); },
      error: err => alert('Error: ' + (err.error?.title ?? err.message))
    });
  }

  updateThresholds() {
    const id = this.selectedInventoryVariant();
    if (!id) return;
    this.api.updateThresholds(id, this.invThresholds).subscribe({
      next: () => this.loadInventory(),
      error: err => alert('Error: ' + (err.error?.title ?? err.message))
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  statusClass(status: string): Record<string, boolean> {
    return {
      'badge-green': status === 'Active',
      'badge-gray':  status === 'Inactive',
      'badge-red':   status === 'Discontinued'
    };
  }
}
    this.invAdjDelta = 0;
    this.invAdjReason = '';
    this.invSetQty = 0;
  }

  adjustInventory() {
    const id = this.selectedInventoryVariant();
    if (!id) return;
    this.api.adjustInventory(id, { delta: +this.invAdjDelta, reason: this.invAdjReason }).subscribe({
      next: () => { this.invAdjDelta = 0; this.invAdjReason = ''; this.loadInventory(); },
      error: err => alert('Error: ' + (err.error?.title ?? err.message))
    });
  }

  setInventory() {
    const id = this.selectedInventoryVariant();
    if (!id) return;
    this.api.setInventory(id, { quantity: +this.invSetQty, countDate: new Date().toISOString() }).subscribe({
      next: () => { this.invSetQty = 0; this.loadInventory(); },
      error: err => alert('Error: ' + (err.error?.title ?? err.message))
    });
  }

  updateThresholds() {
    const id = this.selectedInventoryVariant();
    if (!id) return;
    this.api.updateThresholds(id, this.invThresholds).subscribe({
      next: () => this.loadInventory(),
      error: err => alert('Error: ' + (err.error?.title ?? err.message))
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  statusClass(status: string): Record<string, boolean> {
    return {
      'badge-green': status === 'Active',
      'badge-gray':  status === 'Inactive',
      'badge-red':   status === 'Discontinued'
    };
  }
}
