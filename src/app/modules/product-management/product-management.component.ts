import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Category, Brand, ProductSummary, ProductDetail,
  ProductVariantDto, InventoryDto, Vendor
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
            <div class="form-row">
              <input class="form-control" [(ngModel)]="catForm.code"        placeholder="Code (e.g. A-01)" />
              <input class="form-control" [(ngModel)]="catForm.name"        placeholder="Name" />
            </div>
            <input class="form-control" [(ngModel)]="catForm.description" placeholder="Description (optional)" />
            <select class="form-control" [(ngModel)]="catForm.parentCategoryId">
              <option value="">— No Parent (top-level) —</option>
              @for (c of categories(); track c.id) {
                <option [value]="c.id">{{ c.name }}</option>
              }
            </select>
            <div class="form-row">
              <div style="flex:1">
                <label class="form-label">Default Tax Rate %
                  <span style="color:#6b7280;font-weight:400;font-size:.78rem">— applies to all products in this category</span>
                </label>
                <input class="form-control" type="number" min="0" max="100" step="0.01"
                  [(ngModel)]="catForm.taxRate" placeholder="e.g. 8.25" />
              </div>
              <div style="flex:1">
                <label class="form-label">Tax Code
                  <span style="color:#6b7280;font-weight:400;font-size:.78rem">— for future tax engine (optional)</span>
                </label>
                <input class="form-control" [(ngModel)]="catForm.taxCode"
                  placeholder="e.g. CLOTHING, FOOTWEAR, FOOD_EXEMPT" />
              </div>
            </div>
            <input class="form-control" type="number" [(ngModel)]="catForm.displayOrder" placeholder="Display Order" />
            <div class="form-actions">
              <button class="btn btn-primary" (click)="createCategory()">Save</button>
              <button class="btn btn-secondary" (click)="showCatForm=false">Cancel</button>
            </div>
          </div>
        }

        <table class="data-table">
          <thead><tr><th>Code</th><th>Name</th><th>Parent</th><th>Tax Rate</th><th>Tax Code</th><th>Order</th><th>Active</th><th></th></tr></thead>
          <tbody>
            @for (c of categories(); track c.id) {
              <tr>
                <td><code>{{ c.code }}</code></td>
                <td>{{ c.name }}</td>
                <td>{{ c.parentCategoryName ?? '—' }}</td>
                <td>
                  @if (c.taxRate > 0) {
                    <span style="font-weight:600;color:#059669">{{ c.taxRate }}%</span>
                  } @else {
                    <span style="color:#9ca3af">0%</span>
                  }
                </td>
                <td>
                  @if (c.taxCode) {
                    <code style="font-size:.75rem;background:#fef3c7;color:#92400e;padding:1px 5px;border-radius:3px">{{ c.taxCode }}</code>
                  } @else {
                    <span style="color:#9ca3af">—</span>
                  }
                </td>
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
              <tr><td colspan="8" class="empty-row">No categories found.</td></tr>
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
    <!-- Toolbar always visible -->
    <div class="toolbar">
      <input class="form-control search-input" [(ngModel)]="productSearch"
        (ngModelChange)="onProductSearch()" placeholder="Search name or SKU..." />
      <select class="form-control" style="max-width:160px" [(ngModel)]="productStatusFilter" (ngModelChange)="loadProducts()">
        <option value="">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Discontinued">Discontinued</option>
      </select>
      <select class="form-control" style="max-width:180px" [(ngModel)]="productCategoryFilter" (ngModelChange)="loadProducts()">
        <option value="">All Categories</option>
        @for (c of categories(); track c.id) {
          <option [value]="c.id">{{ c.name }}</option>
        }
      </select>
      <button class="btn btn-primary" (click)="showProductForm=!showProductForm">+ New Product</button>
    </div>

    <!-- New Product Form -->
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
          </div>
          <div style="font-size:.8rem;color:#6b7280;background:#f9fafb;border-radius:6px;padding:.5rem .75rem;margin-top:-.2rem">
            💡 Tax rate is inherited from the selected <b>category</b>. Go to the Categories tab to set it there.
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

    <!-- Master-Detail Split -->
    <div class="products-split">

      <!-- LEFT: Product List -->
      <div class="products-list-panel">
        @for (p of products(); track p.id) {
          <div class="product-row" [class.product-row-selected]="selectedProduct()?.id === p.id"
               (click)="openProduct(p.id)">
            <div class="product-row-main">
              <span class="product-row-name">{{ p.name }}</span>
              <span class="badge" [ngClass]="statusClass(p.status)" style="margin-left:auto;flex-shrink:0">{{ p.status }}</span>
            </div>
            <div class="product-row-meta">
              <code class="product-sku">{{ p.sku }}</code>
              <span class="product-meta-pill">{{ p.categoryName ?? 'No category' }}</span>
              <span class="product-meta-pill">{{ p.brandName ?? 'No brand' }}</span>
              <span class="product-meta-pill">{{ p.variantCount }} variant{{ p.variantCount === 1 ? '' : 's' }}</span>
              <span class="product-price">{{ p.basePrice | currency:'USD':'symbol':'1.2-2' }}</span>
            </div>
          </div>
        }
        @if (!products().length) {
          <div class="empty-panel">No products found.</div>
        }
      </div>

      <!-- RIGHT: Variant Detail Panel -->
      @if (selectedProduct()) {
        <div class="products-detail-panel">
          <!-- Detail Header -->
          <div class="detail-header">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap">
                <h3 class="detail-title">{{ selectedProduct()!.name }}</h3>
                <code style="font-size:.82rem;color:#6b7280">{{ selectedProduct()!.sku }}</code>
                <span class="badge" [ngClass]="statusClass(selectedProduct()!.status)">{{ selectedProduct()!.status }}</span>
              </div>
              <div style="font-size:.82rem;color:#6b7280;margin-top:.2rem">
                {{ selectedProduct()!.categoryName }} · {{ selectedProduct()!.brandName }} · {{ selectedProduct()!.genderTarget }}
              </div>
            </div>
            <div style="display:flex;gap:.5rem;flex-shrink:0">
              @if (selectedProduct()!.status === 'Active') {
                <button class="btn btn-sm btn-warn" (click)="changeStatus('Inactive')">Deactivate</button>
              } @else if (selectedProduct()!.status === 'Inactive') {
                <button class="btn btn-sm btn-primary" (click)="changeStatus('Active')">Activate</button>
              }
              <button class="btn btn-sm btn-secondary" (click)="closeProduct()">✕</button>
            </div>
          </div>

          <!-- Quick Info Strip -->
          <div class="info-strip">
            <div class="info-strip-item"><span class="info-strip-label">Base Price</span><span>{{ selectedProduct()!.basePrice | currency }}</span></div>
            <div class="info-strip-item"><span class="info-strip-label">Base Cost</span><span>{{ selectedProduct()!.baseCost | currency }}</span></div>
            <div class="info-strip-item">
              <span class="info-strip-label">Tax Rate</span>
              <span>
                {{ selectedProduct()!.effectiveTaxRate }}%
                @if (selectedProduct()!.taxRateOverride != null) {
                  <span style="font-size:.7rem;color:#d97706;margin-left:4px">(override)</span>
                } @else {
                  <span style="font-size:.7rem;color:#9ca3af;margin-left:4px">(from category)</span>
                }
              </span>
            </div>
            <div class="info-strip-item"><span class="info-strip-label">UOM</span><span>{{ selectedProduct()!.unitOfMeasure }}</span></div>
            <div class="info-strip-item">
              <span class="info-strip-label">Preferred Vendor</span>
              @if (!editingPreferredVendor) {
                <span style="display:flex;align-items:center;gap:.3rem">
                  <span>{{ selectedProduct()!.preferredVendorName || '—' }}</span>
                  <button class="btn btn-sm btn-secondary" style="font-size:.68rem;padding:.1rem .35rem" (click)="startEditPreferredVendor()">✏️</button>
                </span>
              } @else {
                <span style="display:flex;align-items:center;gap:.3rem">
                  <select class="form-control" style="padding:.2rem .4rem;font-size:.8rem" [(ngModel)]="preferredVendorId">
                    <option value="">— None —</option>
                    @for (v of vendors(); track v.id) { <option [value]="v.id">{{ v.name }}</option> }
                  </select>
                  <button class="btn btn-primary btn-sm" style="font-size:.72rem" (click)="savePreferredVendor()">Save</button>
                  <button class="btn btn-secondary btn-sm" style="font-size:.72rem" (click)="editingPreferredVendor=false">✕</button>
                </span>
              }
            </div>
          </div>

          <!-- Variants Section -->
          <div class="variants-section">
            <div class="variants-header">
              <span style="font-weight:600">Variants <span style="color:#6b7280;font-weight:400">({{ selectedProduct()!.variants.length }})</span></span>
              <button class="btn btn-primary btn-sm" (click)="showVariantForm=!showVariantForm">+ Add Variant</button>
            </div>

            @if (showVariantForm) {
              <div class="inline-form" style="margin-bottom:1rem">
                <div class="form-row">
                  <input class="form-control" [(ngModel)]="variantForm.size"     placeholder="Size (S, M, L, XL…)" />
                  <input class="form-control" [(ngModel)]="variantForm.color"    placeholder="Color (optional)" />
                  <input class="form-control" [(ngModel)]="variantForm.material" placeholder="Material (optional)" />
                </div>
                <div class="form-row">
                  <input class="form-control" [(ngModel)]="variantForm.barcode"           placeholder="Barcode (optional)" />
                  <input class="form-control" type="number" [(ngModel)]="variantForm.priceOverride" placeholder="Price Override" />
                  <input class="form-control" type="number" [(ngModel)]="variantForm.costOverride"  placeholder="Cost Override" />
                </div>
                <div class="form-row">
                  <input class="form-control" type="number" [(ngModel)]="variantForm.initialStock" placeholder="Initial Stock" />
                  <input class="form-control" type="number" [(ngModel)]="variantForm.reorderPoint"  placeholder="Reorder Point" />
                  <input class="form-control" [(ngModel)]="variantForm.location" placeholder="Bin/Location" />
                </div>
                <div class="form-actions">
                  <button class="btn btn-primary" (click)="addVariant()">Save Variant</button>
                  <button class="btn btn-secondary" (click)="showVariantForm=false">Cancel</button>
                </div>
              </div>
            }

            <table class="data-table">
              <thead>
                <tr>
                  <th>SKU</th><th>Size</th><th>Color</th><th>Material</th>
                  <th>Price</th><th>On Hand</th><th>Available</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (v of selectedProduct()!.variants; track v.id) {
                  <tr>
                    <td><code>{{ v.sku }}</code></td>
                    <td>{{ v.size || '—' }}</td>
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
        </div>
      } @else {
        <div class="detail-empty">
          <div style="font-size:2.5rem;margin-bottom:.75rem">👔</div>
          <div style="font-weight:600;color:#374151;margin-bottom:.25rem">Select a product</div>
          <div style="color:#9ca3af;font-size:.88rem">Click any product on the left to view its variants</div>
        </div>
      }
    </div>
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

    /* ── Products master-detail split ── */
    .products-split {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 1rem;
      align-items: start;
    }
    @media (max-width: 900px) {
      .products-split { grid-template-columns: 1fr; }
    }

    /* Left panel — product list */
    .products-list-panel {
      background: var(--card-bg, #fff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      overflow: hidden;
      max-height: calc(100vh - 260px);
      overflow-y: auto;
    }
    .product-row {
      padding: .65rem .9rem;
      border-bottom: 1px solid var(--border-color, #f3f4f6);
      cursor: pointer;
      transition: background .12s;
    }
    .product-row:last-child { border-bottom: none; }
    .product-row:hover { background: var(--hover-bg, #f9fafb); }
    .product-row-selected { background: #eff6ff !important; border-left: 3px solid #2563eb; }
    .product-row-main { display: flex; align-items: center; gap: .5rem; margin-bottom: .25rem; }
    .product-row-name { font-weight: 600; font-size: .9rem; color: var(--text-primary, #111); }
    .product-row-meta { display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; }
    .product-sku { font-size: .75rem; color: #6b7280; }
    .product-meta-pill {
      font-size: .72rem; color: #6b7280;
      background: #f3f4f6; border-radius: 9999px;
      padding: .05rem .4rem;
    }
    .product-price { font-size: .8rem; font-weight: 600; color: #059669; margin-left: auto; }
    .empty-panel { padding: 2.5rem 1rem; text-align: center; color: #9ca3af; font-size: .9rem; }

    /* Right panel — variant detail */
    .products-detail-panel {
      background: var(--card-bg, #fff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      overflow: hidden;
    }
    .detail-header {
      display: flex; align-items: flex-start; gap: .75rem;
      padding: .9rem 1rem; border-bottom: 1px solid var(--border-color, #e5e7eb);
      background: var(--surface-alt, #f8fafc);
    }
    .detail-title { font-size: 1.1rem; font-weight: 700; margin: 0; }
    .detail-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 300px; background: var(--card-bg, #fff);
      border: 1px dashed var(--border-color, #e5e7eb);
      border-radius: 8px; color: #9ca3af;
    }

    /* Info strip */
    .info-strip {
      display: flex; gap: 0; flex-wrap: wrap;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }
    .info-strip-item {
      display: flex; flex-direction: column; gap: .1rem;
      padding: .55rem 1rem; border-right: 1px solid var(--border-color, #e5e7eb);
      font-size: .85rem;
    }
    .info-strip-item:last-child { border-right: none; }
    .info-strip-label { font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; color: #9ca3af; font-weight: 600; }

    /* Variants section */
    .variants-section { padding: 1rem; }
    .variants-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: .75rem;
    }
  `]
})
export class ProductManagementComponent implements OnInit {
  activeTab = signal<Tab>('categories');

  // Categories
  categories = signal<Category[]>([]);
  showCatForm = false;
  catForm = { code: '', name: '', description: '', parentCategoryId: '', displayOrder: 0, taxRate: 0, taxCode: '' };

  // Brands
  brands = signal<Brand[]>([]);
  showBrandForm = false;
  brandForm = { code: '', name: '', country: '', website: '' };

  // Vendors (loaded for preferred vendor picker)
  vendors = signal<Vendor[]>([]);

  // Preferred vendor edit state
  editingPreferredVendor = false;
  preferredVendorId = '';

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
    basePrice: 0, baseCost: 0, unitOfMeasure: 'Each',
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
    this.api.getVendors().subscribe(v => this.vendors.set(v));
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
      displayOrder: this.catForm.displayOrder,
      taxRate: +this.catForm.taxRate || 0,
      taxCode: this.catForm.taxCode?.trim().toUpperCase() || null
    };
    this.api.createCategory(req).subscribe({
      next: () => {
        this.showCatForm = false;
        this.catForm = { code: '', name: '', description: '', parentCategoryId: '', displayOrder: 0, taxRate: 0, taxCode: '' };
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
      unitOfMeasure: this.productForm.unitOfMeasure,
      currency: this.productForm.currency,
      description: this.productForm.description || null,
      tags: this.productForm.tags || null
    };
    this.api.createProduct(req).subscribe({
      next: () => {
        this.showProductForm = false;
        this.productForm = { sku: '', name: '', categoryId: '', brandId: '', productType: 'Clothing', genderTarget: 'Unisex', basePrice: 0, baseCost: 0, unitOfMeasure: 'Each', currency: 'USD', description: '', tags: '' };
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

  startEditPreferredVendor() {
    const p = this.selectedProduct();
    this.preferredVendorId = p?.preferredVendorId ?? '';
    this.editingPreferredVendor = true;
  }

  savePreferredVendor() {
    const p = this.selectedProduct();
    if (!p) return;
    const vendorId = this.preferredVendorId || null;
    this.api.setPreferredVendor(p.id, vendorId).subscribe({
      next: () => {
        this.editingPreferredVendor = false;
        this.openProduct(p.id); // reload to get updated vendor name
      },
      error: err => alert('Error: ' + (err.error?.error ?? err.message))
    });
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
