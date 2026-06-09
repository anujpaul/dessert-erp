import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { OrgService } from '../../core/services/org.service';

@Component({
  selector: 'app-warehouse-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="wh-shell">

  <!-- ── Page Header ──────────────────────────────────────────────── -->
  <div class="page-header">
    <div class="page-title-row">
      <h1 class="page-title">Warehouse Management</h1>
      <div class="header-actions">
        <button class="btn-secondary" (click)="refresh()">↻ Refresh</button>
      </div>
    </div>
    <div class="tab-bar">
      <button [class.active]="tab==='warehouses'"  (click)="setTab('warehouses')">Warehouses</button>
      <button [class.active]="tab==='inbound'"     (click)="setTab('inbound')">Inbound Orders</button>
      <button [class.active]="tab==='outbound'"    (click)="setTab('outbound')">Outbound Orders</button>
      <button [class.active]="tab==='transfer'"    (click)="setTab('transfer')">Transfer / Distribution</button>
    </div>
  </div>

  <!-- ── Summary Cards ─────────────────────────────────────────────── -->
  <div class="summary-cards">
    <div class="card">
      <div class="card-value">{{ warehouses.length }}</div>
      <div class="card-label">Warehouses</div>
    </div>
    <div class="card info">
      <div class="card-value">{{ pendingInbound }}</div>
      <div class="card-label">Pending Inbound</div>
    </div>
    <div class="card warning">
      <div class="card-value">{{ pendingOutbound }}</div>
      <div class="card-label">Pending Outbound</div>
    </div>
    <div class="card success">
      <div class="card-value">{{ pendingTransfer }}</div>
      <div class="card-label">Pending Transfers</div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- WAREHOUSES TAB                                                 -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <div *ngIf="tab==='warehouses'">
    <div class="toolbar">
      <input class="search-box" [(ngModel)]="whSearch" placeholder="Search warehouses…">
      <button class="btn-primary" (click)="openNewWarehouse()">+ New Warehouse</button>
    </div>

    <table class="data-table">
      <thead><tr>
        <th>Code</th><th>Name</th><th>City</th><th>Country</th>
        <th>Locations</th><th>Default</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let w of filteredWarehouses">
          <td><strong>{{ w.code }}</strong></td>
          <td>{{ w.name }}</td>
          <td>{{ w.city || '—' }}</td>
          <td>{{ w.country || '—' }}</td>
          <td>{{ w.locationCount }}</td>
          <td><span *ngIf="w.isDefault" class="badge-success">Default</span></td>
          <td>
            <span [class]="w.isActive ? 'badge-success' : 'badge-neutral'">
              {{ w.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td>
            <button class="btn-link" (click)="viewLocations(w)">Locations</button>
            <button class="btn-link" (click)="editWarehouse(w)">Edit</button>
            <button class="btn-link danger" *ngIf="w.isActive" (click)="deactivateWarehouse(w)">Deactivate</button>
            <button class="btn-link success" *ngIf="!w.isActive" (click)="activateWarehouse(w)">Activate</button>
          </td>
        </tr>
        <tr *ngIf="filteredWarehouses.length===0">
          <td colspan="8" class="empty-state">No warehouses found.</td>
        </tr>
      </tbody>
    </table>

    <!-- Locations panel for selected warehouse -->
    <div *ngIf="selectedWarehouse" class="detail-panel">
      <div class="panel-header">
        <h3>Locations — {{ selectedWarehouse.name }}</h3>
        <button class="btn-primary sm" (click)="openNewLocation()">+ Add Location</button>
        <button class="btn-icon" (click)="selectedWarehouse=null">✕</button>
      </div>
      <table class="data-table">
        <thead><tr>
          <th>Code</th><th>Zone</th><th>Aisle</th><th>Bay</th><th>Level</th><th>Bin</th>
          <th>Pick</th><th>Receive</th><th>Status</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let loc of locations">
            <td><strong>{{ loc.code }}</strong></td>
            <td>{{ loc.zone || '—' }}</td>
            <td>{{ loc.aisle || '—' }}</td>
            <td>{{ loc.bay || '—' }}</td>
            <td>{{ loc.level || '—' }}</td>
            <td>{{ loc.bin || '—' }}</td>
            <td><span [class]="loc.isPickable ? 'badge-success' : 'badge-neutral'">{{ loc.isPickable ? '✓' : '✗' }}</span></td>
            <td><span [class]="loc.isReceivable ? 'badge-success' : 'badge-neutral'">{{ loc.isReceivable ? '✓' : '✗' }}</span></td>
            <td><span [class]="loc.isActive ? 'badge-success' : 'badge-neutral'">{{ loc.isActive ? 'Active' : 'Inactive' }}</span></td>
          </tr>
          <tr *ngIf="locations.length===0">
            <td colspan="9" class="empty-state">No locations. Add one above.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- INBOUND ORDERS TAB                                             -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <div *ngIf="tab==='inbound'">
    <div class="toolbar">
      <input class="search-box" [(ngModel)]="inSearch" placeholder="Search order # or vendor…">
      <select [(ngModel)]="inStatusFilter" (change)="applyInboundFilter()">
        <option value="">All Statuses</option>
        <option value="Draft">Draft</option>
        <option value="Confirmed">Confirmed</option>
        <option value="InTransit">In Transit</option>
        <option value="Receiving">Receiving</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>
      <button class="btn-primary" (click)="openNewInbound()">+ New Inbound Order</button>
    </div>

    <table class="data-table">
      <thead><tr>
        <th>Order #</th><th>Warehouse</th><th>Vendor</th>
        <th>Expected</th><th>Received</th><th>Lines</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let o of filteredInbound" [class.selected]="selectedInbound?.id===o.id">
          <td><strong>{{ o.orderNumber }}</strong></td>
          <td>{{ o.warehouseName }}</td>
          <td>{{ o.vendorName || '—' }}</td>
          <td>{{ o.expectedDate | date:'MMM d, y' }}</td>
          <td>{{ o.receivedDate ? (o.receivedDate | date:'MMM d, y') : '—' }}</td>
          <td>{{ o.lines?.length || 0 }}</td>
          <td><span [class]="statusClass(o.status)">{{ o.status }}</span></td>
          <td>
            <button class="btn-link" (click)="selectInbound(o)">View</button>
            <button class="btn-link success" *ngIf="o.status==='Draft'" (click)="confirmInbound(o)">Confirm</button>
            <button class="btn-link" *ngIf="o.status==='Confirmed'" (click)="inboundInTransit(o)">In Transit</button>
            <button class="btn-link" *ngIf="o.status==='InTransit'||o.status==='Confirmed'" (click)="startReceiving(o)">Receive</button>
            <button class="btn-link success" *ngIf="o.status==='Receiving'" (click)="completeInbound(o)">Complete</button>
            <button class="btn-link danger" *ngIf="o.status!=='Completed'&&o.status!=='Cancelled'" (click)="cancelInbound(o)">Cancel</button>
          </td>
        </tr>
        <tr *ngIf="filteredInbound.length===0">
          <td colspan="8" class="empty-state">No inbound orders found.</td>
        </tr>
      </tbody>
    </table>

    <!-- Inbound detail panel -->
    <div *ngIf="selectedInbound" class="detail-panel">
      <div class="panel-header">
        <h3>Order Lines — {{ selectedInbound.orderNumber }}</h3>
        <button class="btn-icon" (click)="selectedInbound=null">✕</button>
      </div>
      <table class="data-table">
        <thead><tr>
          <th>#</th><th>Product</th><th>SKU</th><th>Ordered</th><th>Received</th><th>UOM</th><th>Lot</th><th>Expiry</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let l of selectedInbound.lines">
            <td>{{ l.lineNumber }}</td>
            <td>{{ l.productName }}</td>
            <td>{{ l.productSku || '—' }}</td>
            <td>{{ l.orderedQuantity }}</td>
            <td>{{ l.receivedQuantity }}</td>
            <td>{{ l.unitOfMeasure }}</td>
            <td>{{ l.lotNumber || '—' }}</td>
            <td>{{ l.expiryDate ? (l.expiryDate | date:'MMM d, y') : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- OUTBOUND ORDERS TAB                                            -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <div *ngIf="tab==='outbound'">
    <div class="toolbar">
      <input class="search-box" [(ngModel)]="outSearch" placeholder="Search order # or customer…">
      <select [(ngModel)]="outStatusFilter" (change)="applyOutboundFilter()">
        <option value="">All Statuses</option>
        <option value="Draft">Draft</option>
        <option value="Confirmed">Confirmed</option>
        <option value="Picking">Picking</option>
        <option value="Packed">Packed</option>
        <option value="Shipped">Shipped</option>
        <option value="Delivered">Delivered</option>
        <option value="Cancelled">Cancelled</option>
      </select>
      <button class="btn-primary" (click)="openNewOutbound()">+ New Outbound Order</button>
    </div>

    <table class="data-table">
      <thead><tr>
        <th>Order #</th><th>Warehouse</th><th>Customer</th>
        <th>Requested</th><th>Shipped</th><th>Tracking</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let o of filteredOutbound" [class.selected]="selectedOutbound?.id===o.id">
          <td><strong>{{ o.orderNumber }}</strong></td>
          <td>{{ o.warehouseName }}</td>
          <td>{{ o.customerName || '—' }}</td>
          <td>{{ o.requestedDate | date:'MMM d, y' }}</td>
          <td>{{ o.shippedDate ? (o.shippedDate | date:'MMM d, y') : '—' }}</td>
          <td>{{ o.trackingNumber || '—' }}</td>
          <td><span [class]="statusClass(o.status)">{{ o.status }}</span></td>
          <td>
            <button class="btn-link" (click)="selectOutbound(o)">View</button>
            <button class="btn-link success" *ngIf="o.status==='Draft'" (click)="confirmOutbound(o)">Confirm</button>
            <button class="btn-link" *ngIf="o.status==='Confirmed'" (click)="startPicking(o)">Pick</button>
            <button class="btn-link" *ngIf="o.status==='Picking'" (click)="packOutbound(o)">Pack</button>
            <button class="btn-link" *ngIf="o.status==='Packed'" (click)="shipOutbound(o)">Ship</button>
            <button class="btn-link success" *ngIf="o.status==='Shipped'" (click)="deliverOutbound(o)">Delivered</button>
            <button class="btn-link danger" *ngIf="o.status!=='Shipped'&&o.status!=='Delivered'&&o.status!=='Cancelled'" (click)="cancelOutbound(o)">Cancel</button>
          </td>
        </tr>
        <tr *ngIf="filteredOutbound.length===0">
          <td colspan="8" class="empty-state">No outbound orders found.</td>
        </tr>
      </tbody>
    </table>

    <!-- Outbound detail panel -->
    <div *ngIf="selectedOutbound" class="detail-panel">
      <div class="panel-header">
        <h3>Order Lines — {{ selectedOutbound.orderNumber }}</h3>
        <button class="btn-icon" (click)="selectedOutbound=null">✕</button>
      </div>
      <table class="data-table">
        <thead><tr>
          <th>#</th><th>Product</th><th>SKU</th><th>Requested</th><th>Picked</th><th>Shipped</th><th>UOM</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let l of selectedOutbound.lines">
            <td>{{ l.lineNumber }}</td>
            <td>{{ l.productName }}</td>
            <td>{{ l.productSku || '—' }}</td>
            <td>{{ l.requestedQuantity }}</td>
            <td>{{ l.pickedQuantity }}</td>
            <td>{{ l.shippedQuantity }}</td>
            <td>{{ l.unitOfMeasure }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- TRANSFER / DISTRIBUTION TAB                                    -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <div *ngIf="tab==='transfer'">
    <div class="toolbar">
      <input class="search-box" [(ngModel)]="trSearch" placeholder="Search order #…">
      <select [(ngModel)]="trStatusFilter" (change)="applyTransferFilter()">
        <option value="">All Statuses</option>
        <option value="Draft">Draft</option>
        <option value="Confirmed">Confirmed</option>
        <option value="InTransit">In Transit</option>
        <option value="Receiving">Receiving</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>
      <button class="btn-primary" (click)="openNewTransfer()">+ New Transfer</button>
    </div>

    <table class="data-table">
      <thead><tr>
        <th>Order #</th><th>From Warehouse</th><th>To Warehouse</th>
        <th>Requested</th><th>Shipped</th><th>Received</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let o of filteredTransfer" [class.selected]="selectedTransfer?.id===o.id">
          <td><strong>{{ o.orderNumber }}</strong></td>
          <td>{{ o.fromWarehouseName }}</td>
          <td>{{ o.toWarehouseName }}</td>
          <td>{{ o.requestedDate | date:'MMM d, y' }}</td>
          <td>{{ o.shippedDate ? (o.shippedDate | date:'MMM d, y') : '—' }}</td>
          <td>{{ o.receivedDate ? (o.receivedDate | date:'MMM d, y') : '—' }}</td>
          <td><span [class]="statusClass(o.status)">{{ o.status }}</span></td>
          <td>
            <button class="btn-link" (click)="selectTransfer(o)">View</button>
            <button class="btn-link success" *ngIf="o.status==='Draft'" (click)="confirmTransfer(o)">Confirm</button>
            <button class="btn-link" *ngIf="o.status==='Confirmed'" (click)="shipTransfer(o)">Ship</button>
            <button class="btn-link" *ngIf="o.status==='InTransit'" (click)="startReceivingTransfer(o)">Receive</button>
            <button class="btn-link success" *ngIf="o.status==='Receiving'" (click)="completeTransfer(o)">Complete</button>
            <button class="btn-link danger" *ngIf="o.status!=='Completed'&&o.status!=='Cancelled'" (click)="cancelTransfer(o)">Cancel</button>
          </td>
        </tr>
        <tr *ngIf="filteredTransfer.length===0">
          <td colspan="8" class="empty-state">No transfer orders found.</td>
        </tr>
      </tbody>
    </table>

    <!-- Transfer detail panel -->
    <div *ngIf="selectedTransfer" class="detail-panel">
      <div class="panel-header">
        <h3>Transfer Lines — {{ selectedTransfer.orderNumber }}</h3>
        <button class="btn-icon" (click)="selectedTransfer=null">✕</button>
      </div>
      <table class="data-table">
        <thead><tr>
          <th>#</th><th>Product</th><th>SKU</th><th>Requested</th><th>Shipped</th><th>Received</th><th>UOM</th><th>Lot</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let l of selectedTransfer.lines">
            <td>{{ l.lineNumber }}</td>
            <td>{{ l.productName }}</td>
            <td>{{ l.productSku || '—' }}</td>
            <td>{{ l.requestedQuantity }}</td>
            <td>{{ l.shippedQuantity }}</td>
            <td>{{ l.receivedQuantity }}</td>
            <td>{{ l.unitOfMeasure }}</td>
            <td>{{ l.lotNumber || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── Warehouse Modal ───────────────────────────────────────────── -->
  <div class="modal-overlay" *ngIf="showWhModal" (click)="showWhModal=false">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>{{ editingWarehouse ? 'Edit Warehouse' : 'New Warehouse' }}</h3>
        <button class="btn-icon" (click)="showWhModal=false">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group" *ngIf="!editingWarehouse">
            <label>Code *</label>
            <input [(ngModel)]="whForm.code" placeholder="WH001">
          </div>
          <div class="form-group">
            <label>Name *</label>
            <input [(ngModel)]="whForm.name" placeholder="Main Warehouse">
          </div>
          <div class="form-group">
            <label>Address</label>
            <input [(ngModel)]="whForm.address" placeholder="123 Storage Blvd">
          </div>
          <div class="form-group">
            <label>City</label>
            <input [(ngModel)]="whForm.city" placeholder="Chicago">
          </div>
          <div class="form-group">
            <label>Country</label>
            <input [(ngModel)]="whForm.country" placeholder="US">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" (click)="showWhModal=false">Cancel</button>
        <button class="btn-primary" (click)="saveWarehouse()">
          {{ editingWarehouse ? 'Update' : 'Create' }}
        </button>
      </div>
    </div>
  </div>

  <!-- ── Location Modal ────────────────────────────────────────────── -->
  <div class="modal-overlay" *ngIf="showLocModal" (click)="showLocModal=false">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>Add Location — {{ selectedWarehouse?.name }}</h3>
        <button class="btn-icon" (click)="showLocModal=false">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group"><label>Code *</label><input [(ngModel)]="locForm.code" placeholder="A-01-01"></div>
          <div class="form-group"><label>Zone</label><input [(ngModel)]="locForm.zone" placeholder="A"></div>
          <div class="form-group"><label>Aisle</label><input [(ngModel)]="locForm.aisle" placeholder="01"></div>
          <div class="form-group"><label>Bay</label><input [(ngModel)]="locForm.bay" placeholder="01"></div>
          <div class="form-group"><label>Level</label><input [(ngModel)]="locForm.level" placeholder="3"></div>
          <div class="form-group"><label>Bin</label><input [(ngModel)]="locForm.bin" placeholder="B"></div>
        </div>
        <div class="form-row">
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="locForm.isPickable"> Pickable
          </label>
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="locForm.isReceivable"> Receivable
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" (click)="showLocModal=false">Cancel</button>
        <button class="btn-primary" (click)="saveLocation()">Add Location</button>
      </div>
    </div>
  </div>

  <!-- ── New Inbound Modal ─────────────────────────────────────────── -->
  <div class="modal-overlay" *ngIf="showInboundModal" (click)="showInboundModal=false">
    <div class="modal wide" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>New Inbound Order</h3>
        <button class="btn-icon" (click)="showInboundModal=false">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Order # *</label>
            <input [(ngModel)]="inboundForm.orderNumber" placeholder="INB-2026-001">
          </div>
          <div class="form-group">
            <label>Warehouse *</label>
            <select [(ngModel)]="inboundForm.warehouseId">
              <option value="">Select…</option>
              <option *ngFor="let w of warehouses" [value]="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Expected Date *</label>
            <input type="date" [(ngModel)]="inboundForm.expectedDate">
          </div>
          <div class="form-group">
            <label>Vendor Name</label>
            <input [(ngModel)]="inboundForm.vendorName" placeholder="Acme Suppliers">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" (click)="showInboundModal=false">Cancel</button>
        <button class="btn-primary" (click)="saveInbound()">Create</button>
      </div>
    </div>
  </div>

  <!-- ── New Outbound Modal ────────────────────────────────────────── -->
  <div class="modal-overlay" *ngIf="showOutboundModal" (click)="showOutboundModal=false">
    <div class="modal wide" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>New Outbound Order</h3>
        <button class="btn-icon" (click)="showOutboundModal=false">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Order # *</label>
            <input [(ngModel)]="outboundForm.orderNumber" placeholder="OUT-2026-001">
          </div>
          <div class="form-group">
            <label>Warehouse *</label>
            <select [(ngModel)]="outboundForm.warehouseId">
              <option value="">Select…</option>
              <option *ngFor="let w of warehouses" [value]="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Requested Date *</label>
            <input type="date" [(ngModel)]="outboundForm.requestedDate">
          </div>
          <div class="form-group">
            <label>Customer Name</label>
            <input [(ngModel)]="outboundForm.customerName" placeholder="Dessert Palace">
          </div>
          <div class="form-group full-width">
            <label>Ship To Address</label>
            <input [(ngModel)]="outboundForm.shipToAddress" placeholder="123 Main St, Chicago">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" (click)="showOutboundModal=false">Cancel</button>
        <button class="btn-primary" (click)="saveOutbound()">Create</button>
      </div>
    </div>
  </div>

  <!-- ── New Transfer Modal ────────────────────────────────────────── -->
  <div class="modal-overlay" *ngIf="showTransferModal" (click)="showTransferModal=false">
    <div class="modal wide" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>New Transfer Order</h3>
        <button class="btn-icon" (click)="showTransferModal=false">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Order # *</label>
            <input [(ngModel)]="transferForm.orderNumber" placeholder="TRF-2026-001">
          </div>
          <div class="form-group">
            <label>From Warehouse *</label>
            <select [(ngModel)]="transferForm.fromWarehouseId">
              <option value="">Select…</option>
              <option *ngFor="let w of warehouses" [value]="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>To Warehouse *</label>
            <select [(ngModel)]="transferForm.toWarehouseId">
              <option value="">Select…</option>
              <option *ngFor="let w of warehouses" [value]="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Requested Date *</label>
            <input type="date" [(ngModel)]="transferForm.requestedDate">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" (click)="showTransferModal=false">Cancel</button>
        <button class="btn-primary" (click)="saveTransfer()">Create</button>
      </div>
    </div>
  </div>

  <!-- ── Ship Outbound Modal ───────────────────────────────────────── -->
  <div class="modal-overlay" *ngIf="showShipModal" (click)="showShipModal=false">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>Ship Order — {{ shipTarget?.orderNumber }}</h3>
        <button class="btn-icon" (click)="showShipModal=false">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Shipped Date *</label>
            <input type="date" [(ngModel)]="shipForm.shippedDate">
          </div>
          <div class="form-group">
            <label>Tracking Number</label>
            <input [(ngModel)]="shipForm.trackingNumber" placeholder="1Z999AA1…">
          </div>
          <div class="form-group">
            <label>Carrier</label>
            <input [(ngModel)]="shipForm.carrier" placeholder="UPS, FedEx…">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" (click)="showShipModal=false">Cancel</button>
        <button class="btn-primary" (click)="confirmShip()">Ship</button>
      </div>
    </div>
  </div>

  <p class="error-msg" *ngIf="error">{{ error }}</p>
</div>

<style>
.wh-shell { padding: 0 24px 40px; }
.page-header { margin-bottom: 24px; }
.page-title-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.page-title { font-size:22px; font-weight:700; color:#1e293b; margin:0; }
.tab-bar { display:flex; gap:4px; border-bottom:2px solid #e2e8f0; }
.tab-bar button { padding:10px 18px; background:none; border:none; border-bottom:3px solid transparent;
  cursor:pointer; font-size:14px; font-weight:500; color:#64748b; margin-bottom:-2px; transition:.2s; }
.tab-bar button.active { color:#6366f1; border-bottom-color:#6366f1; }
.summary-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:16px; margin:20px 0; }
.card { background:#fff; border-radius:12px; padding:20px; text-align:center; border:1px solid #e2e8f0; }
.card.info    { border-left:4px solid #3b82f6; }
.card.warning { border-left:4px solid #f59e0b; }
.card.success { border-left:4px solid #10b981; }
.card.danger  { border-left:4px solid #ef4444; }
.card-value { font-size:28px; font-weight:800; color:#1e293b; }
.card-label { font-size:12px; color:#64748b; margin-top:4px; }
.toolbar { display:flex; gap:12px; align-items:center; margin-bottom:16px; }
.search-box { flex:1; padding:8px 12px; border:1px solid #e2e8f0; border-radius:8px; font-size:14px; }
.search-box:focus { outline:none; border-color:#6366f1; }
select { padding:8px 12px; border:1px solid #e2e8f0; border-radius:8px; font-size:14px; background:#fff; }
.btn-primary  { background:#6366f1; color:#fff; border:none; padding:9px 18px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; }
.btn-primary:hover { background:#4f46e5; }
.btn-primary.sm { padding:6px 12px; font-size:12px; }
.btn-secondary { background:#f1f5f9; color:#374151; border:none; padding:9px 18px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; }
.btn-link { background:none; border:none; color:#6366f1; cursor:pointer; font-size:13px; padding:2px 6px; }
.btn-link.danger  { color:#ef4444; }
.btn-link.success { color:#10b981; }
.btn-icon { background:none; border:none; cursor:pointer; font-size:18px; color:#94a3b8; }
.data-table { width:100%; border-collapse:collapse; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.06); }
.data-table th { background:#f8fafc; padding:10px 14px; text-align:left; font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.04em; }
.data-table td { padding:12px 14px; border-bottom:1px solid #f1f5f9; font-size:14px; color:#374151; }
.data-table tr:last-child td { border-bottom:none; }
.data-table tr.selected td { background:#eef2ff; }
.data-table tr:hover td { background:#f8fafc; }
.empty-state { text-align:center; color:#94a3b8; padding:32px; font-size:14px; }
.badge-success { background:#d1fae5; color:#065f46; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
.badge-neutral { background:#f1f5f9; color:#64748b; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
.badge-warning { background:#fef3c7; color:#92400e; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
.badge-info    { background:#dbeafe; color:#1e40af; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
.badge-danger  { background:#fee2e2; color:#991b1b; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
.detail-panel { margin-top:24px; background:#fff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; }
.panel-header { display:flex; align-items:center; gap:12px; padding:14px 18px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
.panel-header h3 { margin:0; font-size:15px; font-weight:600; flex:1; }
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; z-index:1000; }
.modal { background:#fff; border-radius:16px; width:520px; max-width:95vw; box-shadow:0 20px 40px rgba(0,0,0,.15); }
.modal.wide { width:680px; }
.modal-header { padding:20px 24px 16px; display:flex; align-items:center; border-bottom:1px solid #f1f5f9; }
.modal-header h3 { margin:0; font-size:16px; font-weight:700; flex:1; }
.modal-body { padding:20px 24px; max-height:60vh; overflow-y:auto; }
.modal-footer { padding:16px 24px; display:flex; justify-content:flex-end; gap:12px; border-top:1px solid #f1f5f9; }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.form-group { display:flex; flex-direction:column; gap:5px; }
.form-group.full-width { grid-column:1/-1; }
.form-group label { font-size:12px; font-weight:600; color:#374151; }
.form-group input, .form-group select { padding:8px 12px; border:1px solid #e2e8f0; border-radius:8px; font-size:14px; }
.form-group input:focus, .form-group select:focus { outline:none; border-color:#6366f1; }
.form-row { display:flex; gap:24px; margin-top:12px; }
.checkbox-label { display:flex; align-items:center; gap:8px; font-size:14px; cursor:pointer; }
.header-actions { display:flex; gap:8px; }
.error-msg { color:#ef4444; margin-top:12px; font-size:13px; }
</style>
  `,
})
export class WarehouseManagementComponent implements OnInit {
  tab: 'warehouses' | 'inbound' | 'outbound' | 'transfer' = 'warehouses';
  error = '';

  // Data
  warehouses:     any[] = [];
  locations:      any[] = [];
  inboundOrders:  any[] = [];
  outboundOrders: any[] = [];
  transferOrders: any[] = [];

  // Filtered views
  filteredWarehouses: any[] = [];
  filteredInbound:    any[] = [];
  filteredOutbound:   any[] = [];
  filteredTransfer:   any[] = [];

  // Search / filter state
  whSearch = '';
  inSearch = ''; inStatusFilter = '';
  outSearch = ''; outStatusFilter = '';
  trSearch = ''; trStatusFilter = '';

  // Selected for detail panel
  selectedWarehouse: any = null;
  selectedInbound:   any = null;
  selectedOutbound:  any = null;
  selectedTransfer:  any = null;

  // Modals
  showWhModal       = false;
  showLocModal      = false;
  showInboundModal  = false;
  showOutboundModal = false;
  showTransferModal = false;
  showShipModal     = false;

  editingWarehouse: any = null;
  shipTarget: any = null;

  // Forms
  whForm       = { code:'', name:'', address:'', city:'', country:'' };
  locForm      = { code:'', zone:'', aisle:'', bay:'', level:'', bin:'', isPickable:true, isReceivable:true };
  inboundForm  = { orderNumber:'', warehouseId:'', expectedDate:'', vendorName:'' };
  outboundForm = { orderNumber:'', warehouseId:'', requestedDate:'', customerName:'', shipToAddress:'' };
  transferForm = { orderNumber:'', fromWarehouseId:'', toWarehouseId:'', requestedDate:'' };
  shipForm     = { shippedDate:'', trackingNumber:'', carrier:'' };

  get pendingInbound()  { return this.inboundOrders.filter(o => !['Completed','Cancelled'].includes(o.status)).length; }
  get pendingOutbound() { return this.outboundOrders.filter(o => !['Delivered','Cancelled'].includes(o.status)).length; }
  get pendingTransfer() { return this.transferOrders.filter(o => !['Completed','Cancelled'].includes(o.status)).length; }

  private get orgId() { return this.orgService.organizationId || ''; }

  constructor(private api: ApiService, private orgService: OrgService) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.api.getWarehouses().subscribe({ next: d => { this.warehouses = d; this.applyWarehouseFilter(); }, error: () => {} });
    this.api.getInboundOrders(this.orgId).subscribe({ next: d => { this.inboundOrders = d; this.applyInboundFilter(); }, error: () => {} });
    this.api.getOutboundOrders(this.orgId).subscribe({ next: d => { this.outboundOrders = d; this.applyOutboundFilter(); }, error: () => {} });
    this.api.getTransferOrders(this.orgId).subscribe({ next: d => { this.transferOrders = d; this.applyTransferFilter(); }, error: () => {} });
  }

  refresh() { this.loadAll(); }

  setTab(t: typeof this.tab) {
    this.tab = t;
    this.selectedWarehouse = null;
    this.selectedInbound = null;
    this.selectedOutbound = null;
    this.selectedTransfer = null;
  }

  // ── Filter helpers ────────────────────────────────────────────────
  applyWarehouseFilter() {
    const q = this.whSearch.toLowerCase();
    this.filteredWarehouses = this.warehouses.filter(w =>
      !q || w.code.toLowerCase().includes(q) || w.name.toLowerCase().includes(q));
  }

  applyInboundFilter() {
    let list = this.inboundOrders;
    if (this.inStatusFilter) list = list.filter(o => o.status === this.inStatusFilter);
    const q = this.inSearch.toLowerCase();
    if (q) list = list.filter(o => o.orderNumber.toLowerCase().includes(q) || (o.vendorName||'').toLowerCase().includes(q));
    this.filteredInbound = list;
  }

  applyOutboundFilter() {
    let list = this.outboundOrders;
    if (this.outStatusFilter) list = list.filter(o => o.status === this.outStatusFilter);
    const q = this.outSearch.toLowerCase();
    if (q) list = list.filter(o => o.orderNumber.toLowerCase().includes(q) || (o.customerName||'').toLowerCase().includes(q));
    this.filteredOutbound = list;
  }

  applyTransferFilter() {
    let list = this.transferOrders;
    if (this.trStatusFilter) list = list.filter(o => o.status === this.trStatusFilter);
    const q = this.trSearch.toLowerCase();
    if (q) list = list.filter(o => o.orderNumber.toLowerCase().includes(q));
    this.filteredTransfer = list;
  }

  statusClass(status: string) {
    const m: Record<string,string> = {
      Draft:'badge-neutral', Confirmed:'badge-info', InTransit:'badge-warning',
      Receiving:'badge-warning', Picking:'badge-warning', Packed:'badge-warning',
      Completed:'badge-success', Delivered:'badge-success', Shipped:'badge-info',
      Cancelled:'badge-danger'
    };
    return m[status] ?? 'badge-neutral';
  }

  // ── Warehouse actions ─────────────────────────────────────────────
  openNewWarehouse() {
    this.editingWarehouse = null;
    this.whForm = { code:'', name:'', address:'', city:'', country:'' };
    this.showWhModal = true;
  }

  editWarehouse(w: any) {
    this.editingWarehouse = w;
    this.whForm = { code: w.code, name: w.name, address: w.address||'', city: w.city||'', country: w.country||'' };
    this.showWhModal = true;
  }

  saveWarehouse() {
    if (this.editingWarehouse) {
      this.api.updateWarehouse(this.editingWarehouse.id, this.whForm).subscribe({
        next: () => { this.showWhModal = false; this.loadAll(); },
        error: () => this.error = 'Failed to update warehouse.'
      });
    } else {
      this.api.createWarehouse(this.whForm).subscribe({
        next: () => { this.showWhModal = false; this.loadAll(); },
        error: e => this.error = e.error?.error ?? 'Failed to create warehouse.'
      });
    }
  }

  activateWarehouse(w: any)   { this.api.activateWarehouse(w.id).subscribe({ next: () => this.loadAll() }); }
  deactivateWarehouse(w: any) { this.api.deactivateWarehouse(w.id).subscribe({ next: () => this.loadAll() }); }

  viewLocations(w: any) {
    this.selectedWarehouse = w;
    this.api.getWarehouseLocations(w.id).subscribe({ next: d => this.locations = d, error: () => {} });
  }

  openNewLocation() { this.locForm = { code:'', zone:'', aisle:'', bay:'', level:'', bin:'', isPickable:true, isReceivable:true }; this.showLocModal = true; }

  saveLocation() {
    const body = { ...this.locForm, warehouseId: this.selectedWarehouse.id };
    this.api.createWarehouseLocation(body).subscribe({
      next: () => { this.showLocModal = false; this.viewLocations(this.selectedWarehouse); },
      error: () => this.error = 'Failed to create location.'
    });
  }

  // ── Inbound actions ───────────────────────────────────────────────
  openNewInbound()  { this.inboundForm = { orderNumber:'', warehouseId:'', expectedDate:'', vendorName:'' }; this.showInboundModal = true; }

  saveInbound() {
    const body = { ...this.inboundForm, organizationId: this.orgId, lines: [] };
    this.api.createInboundOrder(body).subscribe({
      next: () => { this.showInboundModal = false; this.loadAll(); },
      error: () => this.error = 'Failed to create inbound order.'
    });
  }

  selectInbound(o: any)   { this.selectedInbound = o; }
  confirmInbound(o: any)  { this.api.confirmInboundOrder(o.id).subscribe({ next: () => this.loadAll() }); }
  inboundInTransit(o: any){ this.api.inboundInTransit(o.id).subscribe({ next: () => this.loadAll() }); }
  startReceiving(o: any)  { this.api.startReceivingInbound(o.id).subscribe({ next: () => this.loadAll() }); }
  completeInbound(o: any) { this.api.completeInboundOrder(o.id).subscribe({ next: () => this.loadAll() }); }
  cancelInbound(o: any)   { if (confirm('Cancel this inbound order?')) this.api.cancelInboundOrder(o.id).subscribe({ next: () => this.loadAll() }); }

  // ── Outbound actions ──────────────────────────────────────────────
  openNewOutbound() { this.outboundForm = { orderNumber:'', warehouseId:'', requestedDate:'', customerName:'', shipToAddress:'' }; this.showOutboundModal = true; }

  saveOutbound() {
    const body = { ...this.outboundForm, organizationId: this.orgId, lines: [] };
    this.api.createOutboundOrder(body).subscribe({
      next: () => { this.showOutboundModal = false; this.loadAll(); },
      error: () => this.error = 'Failed to create outbound order.'
    });
  }

  selectOutbound(o: any)  { this.selectedOutbound = o; }
  confirmOutbound(o: any) { this.api.confirmOutboundOrder(o.id).subscribe({ next: () => this.loadAll() }); }
  startPicking(o: any)    { this.api.startPickingOutbound(o.id).subscribe({ next: () => this.loadAll() }); }
  packOutbound(o: any)    { this.api.packOutboundOrder(o.id).subscribe({ next: () => this.loadAll() }); }

  shipOutbound(o: any) {
    this.shipTarget = o;
    const today = new Date().toISOString().slice(0, 10);
    this.shipForm = { shippedDate: today, trackingNumber: '', carrier: '' };
    this.showShipModal = true;
  }

  confirmShip() {
    this.api.shipOutboundOrder(this.shipTarget.id, this.shipForm).subscribe({
      next: () => { this.showShipModal = false; this.loadAll(); },
      error: () => this.error = 'Failed to ship order.'
    });
  }

  deliverOutbound(o: any) { this.api.deliverOutboundOrder(o.id).subscribe({ next: () => this.loadAll() }); }
  cancelOutbound(o: any)  { if (confirm('Cancel this outbound order?')) this.api.cancelOutboundOrder(o.id).subscribe({ next: () => this.loadAll() }); }

  // ── Transfer actions ──────────────────────────────────────────────
  openNewTransfer() { this.transferForm = { orderNumber:'', fromWarehouseId:'', toWarehouseId:'', requestedDate:'' }; this.showTransferModal = true; }

  saveTransfer() {
    const body = { ...this.transferForm, organizationId: this.orgId, lines: [] };
    this.api.createTransferOrder(body).subscribe({
      next: () => { this.showTransferModal = false; this.loadAll(); },
      error: () => this.error = 'Failed to create transfer order.'
    });
  }

  selectTransfer(o: any)          { this.selectedTransfer = o; }
  confirmTransfer(o: any)         { this.api.confirmTransferOrder(o.id).subscribe({ next: () => this.loadAll() }); }
  shipTransfer(o: any)            { this.api.shipTransferOrder(o.id, new Date().toISOString()).subscribe({ next: () => this.loadAll() }); }
  startReceivingTransfer(o: any)  { this.api.startReceivingTransfer(o.id).subscribe({ next: () => this.loadAll() }); }
  completeTransfer(o: any)        { this.api.completeTransferOrder(o.id).subscribe({ next: () => this.loadAll() }); }
  cancelTransfer(o: any)          { if (confirm('Cancel this transfer order?')) this.api.cancelTransferOrder(o.id).subscribe({ next: () => this.loadAll() }); }
}
