import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Campaign, LoyaltyProgram, CustomerLoyaltyAccount, Promotion, Coupon } from '../../core/models/erp.models';

@Component({
  selector: 'app-marketing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .module-header { background: linear-gradient(135deg,#6f42c1,#e83e8c); color:#fff; padding:24px 32px; border-radius:12px; margin-bottom:24px; }
    .module-header h1 { margin:0; font-size:1.8rem; font-weight:700; }
    .module-header p  { margin:4px 0 0; opacity:.85; }
    .tabs { display:flex; gap:4px; border-bottom:2px solid #e9ecef; margin-bottom:24px; }
    .tab  { padding:10px 20px; border:none; background:none; cursor:pointer; font-size:.95rem; color:#6c757d; border-bottom:3px solid transparent; margin-bottom:-2px; transition:all .2s; border-radius:6px 6px 0 0; }
    .tab.active { color:#6f42c1; border-bottom-color:#6f42c1; font-weight:600; background:#f8f0ff; }
    .tab:hover:not(.active) { background:#f8f9fa; color:#495057; }
    .card { background:#fff; border:1px solid #e9ecef; border-radius:10px; padding:20px; margin-bottom:16px; }
    .toolbar { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
    .btn { padding:8px 16px; border:none; border-radius:6px; cursor:pointer; font-size:.875rem; font-weight:500; transition:all .2s; }
    .btn-primary { background:#6f42c1; color:#fff; }
    .btn-primary:hover { background:#5a32a3; }
    .btn-success { background:#28a745; color:#fff; }
    .btn-success:hover { background:#218838; }
    .btn-outline { background:#fff; color:#6f42c1; border:1px solid #6f42c1; }
    .btn-outline:hover { background:#f8f0ff; }
    .btn-sm { padding:4px 10px; font-size:.8rem; }
    .btn-danger { background:#dc3545; color:#fff; }
    .btn-danger:hover { background:#c82333; }
    .btn-warning { background:#ffc107; color:#212529; }
    .table { width:100%; border-collapse:collapse; font-size:.9rem; }
    .table th { background:#f8f9fa; padding:10px 14px; text-align:left; font-weight:600; color:#495057; border-bottom:2px solid #e9ecef; }
    .table td { padding:10px 14px; border-bottom:1px solid #f0f0f0; vertical-align:top; }
    .table tr:hover td { background:#fafafa; }
    .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:.75rem; font-weight:600; }
    .badge-active   { background:#d4edda; color:#155724; }
    .badge-inactive { background:#f8d7da; color:#721c24; }
    .badge-draft    { background:#e2e3e5; color:#383d41; }
    .badge-scheduled{ background:#cce5ff; color:#004085; }
    .badge-expired  { background:#f8d7da; color:#721c24; }
    .badge-pct      { background:#d1ecf1; color:#0c5460; }
    .badge-fixed    { background:#d4edda; color:#155724; }
    .badge-bxgy     { background:#fff3cd; color:#856404; }
    .campaign-status-Draft     { background:#e2e3e5; color:#383d41; }
    .campaign-status-Scheduled { background:#cce5ff; color:#004085; }
    .campaign-status-Active    { background:#d4edda; color:#155724; }
    .campaign-status-Paused    { background:#fff3cd; color:#856404; }
    .campaign-status-Completed { background:#d1ecf1; color:#0c5460; }
    .campaign-status-Cancelled { background:#f8d7da; color:#721c24; }
    .tier-Bronze   { background:#f5deb3; color:#6d4c1c; }
    .tier-Silver   { background:#e0e0e0; color:#555; }
    .tier-Gold     { background:#fff3cd; color:#856404; }
    .tier-Platinum { background:#e3d2f7; color:#4a1e8a; }
    .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1000; display:flex; align-items:center; justify-content:center; }
    .modal { background:#fff; border-radius:12px; padding:28px; width:560px; max-width:95vw; max-height:90vh; overflow-y:auto; }
    .modal h3 { margin:0 0 20px; font-size:1.2rem; }
    .form-group { margin-bottom:16px; }
    .form-group label { display:block; font-size:.85rem; font-weight:600; color:#495057; margin-bottom:5px; }
    .form-control { width:100%; padding:8px 12px; border:1px solid #ced4da; border-radius:6px; font-size:.9rem; box-sizing:border-box; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .form-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:20px; }
    .progress-bar-wrapper { background:#f0f0f0; border-radius:8px; height:8px; margin-top:4px; }
    .progress-bar { background:linear-gradient(90deg,#6f42c1,#e83e8c); height:8px; border-radius:8px; transition:width .4s; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:14px; margin-bottom:20px; }
    .stat-card { background:#fff; border:1px solid #e9ecef; border-radius:8px; padding:16px; text-align:center; }
    .stat-card .val { font-size:1.6rem; font-weight:700; color:#6f42c1; }
    .stat-card .lbl { font-size:.8rem; color:#6c757d; margin-top:4px; }
    .empty { text-align:center; color:#aaa; padding:40px; font-size:.95rem; }
    .detail-panel { border-left:4px solid #6f42c1; padding-left:16px; margin-top:16px; }
    .section-title { font-weight:700; color:#6f42c1; font-size:.9rem; margin-bottom:10px; text-transform:uppercase; letter-spacing:.05em; }
    input[type=range] { width:100%; }
  `],
  template: `
<div class="module-header">
  <h1>📣 Marketing</h1>
  <p>Campaigns · Promotions · Coupons · Loyalty — Drive Growth Across Every Channel</p>
</div>

<div class="tabs">
  <button class="tab" [class.active]="tab==='campaigns'"  (click)="tab='campaigns';  loadCampaigns()">📣 Campaigns</button>
  <button class="tab" [class.active]="tab==='promotions'" (click)="tab='promotions'; loadPromotions()">🎉 Promotions</button>
  <button class="tab" [class.active]="tab==='coupons'"    (click)="tab='coupons';    loadCoupons()">🏷️ Coupons</button>
  <button class="tab" [class.active]="tab==='loyalty'"    (click)="tab='loyalty';    loadLoyalty()">⭐ Loyalty</button>
</div>

<!-- ── CAMPAIGNS ── -->
<div *ngIf="tab==='campaigns'">
  <div class="stats-grid">
    <div class="stat-card"><div class="val">{{campaigns.length}}</div><div class="lbl">Total Campaigns</div></div>
    <div class="stat-card"><div class="val">{{activeCampaigns}}</div><div class="lbl">Active</div></div>
    <div class="stat-card"><div class="val">{{totalReach | number}}</div><div class="lbl">Total Reach</div></div>
    <div class="stat-card"><div class="val">{{totalConversions | number}}</div><div class="lbl">Conversions</div></div>
    <div class="stat-card"><div class="val">{{totalSpend | currency}}</div><div class="lbl">Total Spend</div></div>
  </div>

  <div class="toolbar">
    <input class="form-control" style="max-width:260px" [(ngModel)]="campaignSearch" placeholder="Search campaigns…">
    <select class="form-control" style="max-width:160px" [(ngModel)]="campaignStatusFilter">
      <option value="">All Statuses</option>
      <option *ngFor="let s of campaignStatuses" [value]="s">{{s}}</option>
    </select>
    <button class="btn btn-primary" (click)="openNewCampaign()">+ New Campaign</button>
  </div>

  <div class="card" style="padding:0;overflow:hidden">
    <table class="table">
      <thead><tr>
        <th>Name</th><th>Type</th><th>Status</th><th>Audience</th>
        <th>Budget</th><th>Spend</th><th>Reach</th><th>Conversions</th><th>Actions</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let c of filteredCampaigns">
          <td><strong>{{c.name}}</strong><br><small class="text-muted">{{c.startDate | date:'mediumDate'}}{{c.endDate ? ' – ' + (c.endDate | date:'mediumDate') : ''}}</small></td>
          <td>{{c.type}}</td>
          <td><span class="badge" [ngClass]="'campaign-status-' + c.status">{{c.status}}</span></td>
          <td>{{c.targetAudience}}</td>
          <td>{{c.budget | currency}}</td>
          <td>
            {{c.actualSpend | currency}}
            <div class="progress-bar-wrapper" style="min-width:60px">
              <div class="progress-bar" [style.width]="budgetPct(c) + '%'"></div>
            </div>
          </td>
          <td>{{c.reachCount | number}}</td>
          <td>{{c.conversionCount | number}}</td>
          <td>
            <button *ngIf="c.status==='Draft'||c.status==='Paused'||c.status==='Scheduled'" class="btn btn-sm" style="background:#16a34a;color:#fff" (click)="setCampaignStatus(c,'Active')">▶ Activate</button>
            <button *ngIf="c.status==='Draft'" class="btn btn-sm" style="background:#f59e0b;color:#fff;margin-left:4px" (click)="setCampaignStatus(c,'Scheduled')">📅 Schedule</button>
            <button *ngIf="c.status==='Active'" class="btn btn-sm" style="background:#6b7280;color:#fff;margin-left:4px" (click)="setCampaignStatus(c,'Paused')">⏸ Pause</button>
            <button *ngIf="c.status==='Active'||c.status==='Paused'" class="btn btn-sm" style="background:#7c3aed;color:#fff;margin-left:4px" (click)="setCampaignStatus(c,'Completed')">✓ Complete</button>
            <button class="btn btn-outline btn-sm" style="margin-left:4px" (click)="editCampaign(c)">Edit</button>
            <button class="btn btn-sm" style="background:#eee;margin-left:4px" (click)="openMetrics(c)">Metrics</button>
            <button class="btn btn-danger btn-sm" style="margin-left:4px" (click)="deleteCampaign(c.id)">Delete</button>
          </td>
        </tr>
        <tr *ngIf="filteredCampaigns.length===0">
          <td colspan="9" class="empty">No campaigns yet. Create your first campaign!</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ── PROMOTIONS ── -->
<div *ngIf="tab==='promotions'">
  <div class="toolbar">
    <input class="form-control" style="max-width:260px" [(ngModel)]="promoSearch" placeholder="Search promotions…">
    <button class="btn btn-primary" (click)="openNewPromo()">+ New Promotion</button>
  </div>

  <div class="card" style="padding:0;overflow:hidden">
    <table class="table">
      <thead><tr>
        <th>Name</th><th>Type</th><th>Value</th><th>Status</th>
        <th>Min Order</th><th>Uses</th><th>Valid Window</th><th>Actions</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let p of filteredPromotions">
          <td><strong>{{p.name}}</strong><br><small class="text-muted" *ngIf="p.description">{{p.description}}</small></td>
          <td><span class="badge" [ngClass]="discountTypeBadge(p.discountType)">{{p.discountType}}</span></td>
          <td>{{discountLabel(p)}}</td>
          <td><span class="badge" [ngClass]="promoStatusBadge(p.status)">{{p.status}}</span></td>
          <td>{{p.minimumOrderAmount > 0 ? (p.minimumOrderAmount | currency) : '—'}}</td>
          <td>{{p.usedCount}}{{p.maxUsesTotal > 0 ? ' / ' + p.maxUsesTotal : ' (unlimited)'}}</td>
          <td><small>{{p.startDate | date:'mediumDate'}}{{p.endDate ? ' – ' + (p.endDate | date:'mediumDate') : ''}}</small></td>
          <td>
            <button class="btn btn-outline btn-sm" (click)="editPromo(p)">Edit</button>
            <button class="btn btn-sm" [style.background]="p.status==='Inactive'?'#d4edda':'#f8d7da'" style="margin-left:4px" (click)="togglePromo(p.id)">
              {{p.status === 'Inactive' ? 'Activate' : 'Deactivate'}}
            </button>
            <button class="btn btn-danger btn-sm" style="margin-left:4px" (click)="deletePromo(p.id)">Delete</button>
          </td>
        </tr>
        <tr *ngIf="filteredPromotions.length===0">
          <td colspan="8" class="empty">No promotions yet. Create your first promotion!</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ── COUPONS ── -->
<div *ngIf="tab==='coupons'">
  <div class="toolbar">
    <input class="form-control" style="max-width:260px" [(ngModel)]="couponSearch" placeholder="Search codes…">
    <select class="form-control" style="max-width:220px" [(ngModel)]="couponPromoFilter" (change)="loadCoupons()">
      <option value="">All Promotions</option>
      <option *ngFor="let p of promotions" [value]="p.id">{{p.name}}</option>
    </select>
    <button class="btn btn-primary" (click)="openNewCoupon()">+ Single Coupon</button>
    <button class="btn btn-outline" (click)="openBulkCoupons()">Bulk Generate</button>
  </div>

  <div class="card" style="padding:0;overflow:hidden">
    <table class="table">
      <thead><tr>
        <th>Code</th><th>Promotion</th><th>Status</th><th>Uses</th><th>Remaining</th><th>Expires</th><th>Actions</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let c of filteredCoupons">
          <td><code style="font-weight:700;color:#6f42c1">{{c.code}}</code></td>
          <td>{{c.promotionName}}</td>
          <td><span class="badge" [ngClass]="c.isActive ? 'badge-active' : 'badge-inactive'">{{c.isActive ? 'Active' : 'Inactive'}}</span></td>
          <td>{{c.usedCount}} / {{c.maxUses === 0 ? '∞' : c.maxUses}}</td>
          <td>{{c.maxUses === 0 ? '∞' : c.remainingUses}}</td>
          <td>{{c.expiresAt ? (c.expiresAt | date:'mediumDate') : '—'}}</td>
          <td>
            <button *ngIf="c.isActive" class="btn btn-danger btn-sm" (click)="deactivateCoupon(c.id)">Deactivate</button>
          </td>
        </tr>
        <tr *ngIf="filteredCoupons.length===0">
          <td colspan="7" class="empty">No coupons found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ── LOYALTY ── -->
<div *ngIf="tab==='loyalty'">
  <div class="toolbar">
    <button class="btn btn-primary" (click)="openNewLoyalty()">+ New Loyalty Program</button>
  </div>

  <div *ngFor="let lp of loyaltyPrograms" class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <h3 style="margin:0 0 4px">{{lp.name}}</h3>
        <p style="margin:0;color:#6c757d;font-size:.9rem">{{lp.description || 'No description'}}</p>
        <div style="margin-top:12px;display:flex;gap:24px;font-size:.9rem">
          <span>🪙 <strong>{{lp.pointsPerDollar}}</strong> pts / $1</span>
          <span>💵 $<strong>{{lp.dollarPerPoint}}</strong> / pt</span>
          <span>🎯 Min <strong>{{lp.redemptionThreshold}}</strong> pts to redeem</span>
        </div>
        <div style="margin-top:8px;display:flex;gap:16px;font-size:.85rem">
          <span style="background:#f5deb3;color:#6d4c1c;padding:2px 8px;border-radius:10px">🥉 Bronze</span>
          <span style="background:#e0e0e0;color:#555;padding:2px 8px;border-radius:10px">🥈 Silver {{lp.silverThreshold}} pts</span>
          <span style="background:#fff3cd;color:#856404;padding:2px 8px;border-radius:10px">🥇 Gold {{lp.goldThreshold}} pts</span>
          <span style="background:#e3d2f7;color:#4a1e8a;padding:2px 8px;border-radius:10px">💎 Platinum {{lp.platinumThreshold}} pts</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:flex-start">
        <span class="badge" [ngClass]="lp.isActive ? 'badge-active' : 'badge-inactive'">{{lp.isActive ? 'Active' : 'Inactive'}}</span>
        <button class="btn btn-outline btn-sm" (click)="editLoyalty(lp)">Edit</button>
        <button class="btn btn-sm" [style.background]="lp.isActive?'#f8d7da':'#d4edda'" (click)="toggleLoyalty(lp.id)">
          {{lp.isActive ? 'Deactivate' : 'Activate'}}
        </button>
        <button class="btn btn-primary btn-sm" (click)="selectProgram(lp)">View Members</button>
      </div>
    </div>

    <!-- Members table when selected -->
    <div *ngIf="selectedProgram?.id === lp.id" style="margin-top:20px">
      <div class="section-title">Members ({{loyaltyAccounts.length}})</div>
      <div class="toolbar" style="margin-bottom:12px">
        <button class="btn btn-success btn-sm" (click)="openEnroll(lp)">+ Enroll Customer</button>
      </div>
      <table class="table" style="font-size:.85rem">
        <thead><tr>
          <th>Customer</th><th>Tier</th><th>Total Pts</th><th>Available</th><th>Redeemed</th><th>Last Activity</th><th>Actions</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let a of loyaltyAccounts">
            <td>{{a.customerName}}<br><small class="text-muted">{{a.customerEmail}}</small></td>
            <td><span class="badge" [ngClass]="'tier-' + a.tier">{{a.tier}}</span></td>
            <td>{{a.totalPoints | number}}</td>
            <td>{{a.availablePoints | number}}</td>
            <td>{{a.redeemedPoints | number}}</td>
            <td>{{a.lastActivityAt ? (a.lastActivityAt | date:'mediumDate') : 'Never'}}</td>
            <td>
              <button class="btn btn-sm btn-success" (click)="openAward(lp, a)">Award</button>
              <button class="btn btn-sm btn-warning" style="margin-left:4px" (click)="openRedeem(lp, a)">Redeem</button>
            </td>
          </tr>
          <tr *ngIf="loyaltyAccounts.length===0">
            <td colspan="7" class="empty">No members yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div *ngIf="loyaltyPrograms.length===0" class="empty">No loyalty programs. Create one to start rewarding customers!</div>
</div>

<!-- ══════════════════════════════════════════════════════════════
     MODALS
     ══════════════════════════════════════════════════════════════ -->

<!-- Campaign Modal -->
<div class="modal-bg" *ngIf="showCampaignModal" (click.self)="showCampaignModal=false">
  <div class="modal">
    <h3>{{editingCampaignId ? 'Edit Campaign' : 'New Campaign'}}</h3>
    <div class="form-group">
      <label>Name *</label>
      <input class="form-control" [(ngModel)]="campaignForm.name" placeholder="Summer Sale 2026">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea class="form-control" [(ngModel)]="campaignForm.description" rows="2"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Type</label>
        <select class="form-control" [(ngModel)]="campaignForm.type">
          <option *ngFor="let t of campaignTypes" [value]="t">{{t}}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Target Audience</label>
        <select class="form-control" [(ngModel)]="campaignForm.targetAudience">
          <option *ngFor="let a of audienceTypes" [value]="a">{{a}}</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Start Date</label>
        <input class="form-control" type="date" [(ngModel)]="campaignForm.startDate">
      </div>
      <div class="form-group">
        <label>End Date</label>
        <input class="form-control" type="date" [(ngModel)]="campaignForm.endDate">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Budget ($)</label>
        <input class="form-control" type="number" [(ngModel)]="campaignForm.budget" min="0">
      </div>
      <div class="form-group">
        <label>Linked Promotion</label>
        <select class="form-control" [(ngModel)]="campaignForm.linkedPromotionId">
          <option value="">None</option>
          <option *ngFor="let p of promotions" [value]="p.id">{{p.name}}</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Tags (comma separated)</label>
      <input class="form-control" [(ngModel)]="campaignForm.tags" placeholder="email, summer, dessert">
    </div>
    <div class="form-actions">
      <button class="btn btn-outline" (click)="showCampaignModal=false">Cancel</button>
      <button class="btn btn-primary" (click)="saveCampaign()">Save Campaign</button>
    </div>
  </div>
</div>

<!-- Metrics Modal -->
<div class="modal-bg" *ngIf="showMetricsModal" (click.self)="showMetricsModal=false">
  <div class="modal">
    <h3>Record Metrics — {{metricsTarget?.name}}</h3>
    <div class="form-row">
      <div class="form-group"><label>Reach (impressions)</label>
        <input class="form-control" type="number" [(ngModel)]="metricsForm.reach" min="0"></div>
      <div class="form-group"><label>Conversions</label>
        <input class="form-control" type="number" [(ngModel)]="metricsForm.conversions" min="0"></div>
    </div>
    <div class="form-group"><label>Spend ($)</label>
      <input class="form-control" type="number" [(ngModel)]="metricsForm.spend" min="0" step="0.01"></div>
    <div class="form-actions">
      <button class="btn btn-outline" (click)="showMetricsModal=false">Cancel</button>
      <button class="btn btn-primary" (click)="saveMetrics()">Record</button>
    </div>
  </div>
</div>

<!-- Promotion Modal -->
<div class="modal-bg" *ngIf="showPromoModal" (click.self)="showPromoModal=false">
  <div class="modal">
    <h3>{{editingPromoId ? 'Edit Promotion' : 'New Promotion'}}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>Name *</label>
        <input class="form-control" [(ngModel)]="promoForm.name" placeholder="10% Off Everything">
      </div>
      <div class="form-group" *ngIf="!editingPromoId">
        <label>Discount Type</label>
        <select class="form-control" [(ngModel)]="promoForm.discountType">
          <option value="PercentageOff">Percentage Off</option>
          <option value="FixedAmountOff">Fixed Amount Off</option>
          <option value="BuyXGetY">Buy X Get Y</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea class="form-control" [(ngModel)]="promoForm.description" rows="2"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>{{promoForm.discountType === 'PercentageOff' ? 'Discount %' : promoForm.discountType === 'FixedAmountOff' ? 'Discount Amount ($)' : 'Free Item Discount %'}}</label>
        <input class="form-control" type="number" [(ngModel)]="promoForm.discountValue" min="0">
      </div>
      <div class="form-group">
        <label>Min Order Amount ($)</label>
        <input class="form-control" type="number" [(ngModel)]="promoForm.minimumOrderAmount" min="0">
      </div>
    </div>
    <div class="form-row" *ngIf="promoForm.discountType === 'BuyXGetY'">
      <div class="form-group">
        <label>Buy Quantity</label>
        <input class="form-control" type="number" [(ngModel)]="promoForm.buyQuantity" min="1">
      </div>
      <div class="form-group">
        <label>Get Quantity (free)</label>
        <input class="form-control" type="number" [(ngModel)]="promoForm.getQuantity" min="1">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Start Date</label>
        <input class="form-control" type="date" [(ngModel)]="promoForm.startDate">
      </div>
      <div class="form-group">
        <label>End Date</label>
        <input class="form-control" type="date" [(ngModel)]="promoForm.endDate">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Max Uses (0 = unlimited)</label>
        <input class="form-control" type="number" [(ngModel)]="promoForm.maxUsesTotal" min="0">
      </div>
      <div class="form-group">
        <label>Max Uses per Customer</label>
        <input class="form-control" type="number" [(ngModel)]="promoForm.maxUsesPerCustomer" min="0">
      </div>
    </div>
    <div class="form-group">
      <label><input type="checkbox" [(ngModel)]="promoForm.applyToAllProducts"> Apply to All Products</label>
    </div>
    <div class="form-group" *ngIf="!promoForm.applyToAllProducts">
      <label>Applicable SKUs (comma separated)</label>
      <input class="form-control" [(ngModel)]="promoForm.applicableSkus" placeholder="SKU001, SKU002">
    </div>
    <div class="form-actions">
      <button class="btn btn-outline" (click)="showPromoModal=false">Cancel</button>
      <button class="btn btn-primary" (click)="savePromo()">Save Promotion</button>
    </div>
  </div>
</div>

<!-- Coupon Modal -->
<div class="modal-bg" *ngIf="showCouponModal" (click.self)="showCouponModal=false">
  <div class="modal">
    <h3>New Coupon</h3>
    <div class="form-group">
      <label>Promotion *</label>
      <select class="form-control" [(ngModel)]="couponForm.promotionId">
        <option value="">Select promotion…</option>
        <option *ngFor="let p of promotions" [value]="p.id">{{p.name}}</option>
      </select>
    </div>
    <div class="form-group"><label>Code *</label>
      <input class="form-control" [(ngModel)]="couponForm.code" placeholder="SUMMER25" style="text-transform:uppercase">
    </div>
    <div class="form-row">
      <div class="form-group"><label>Max Uses (0 = unlimited)</label>
        <input class="form-control" type="number" [(ngModel)]="couponForm.maxUses" min="0">
      </div>
      <div class="form-group"><label>Expires At</label>
        <input class="form-control" type="date" [(ngModel)]="couponForm.expiresAt">
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-outline" (click)="showCouponModal=false">Cancel</button>
      <button class="btn btn-primary" (click)="saveCoupon()">Create Coupon</button>
    </div>
  </div>
</div>

<!-- Bulk Coupon Modal -->
<div class="modal-bg" *ngIf="showBulkModal" (click.self)="showBulkModal=false">
  <div class="modal">
    <h3>Bulk Generate Coupons</h3>
    <div class="form-group">
      <label>Promotion *</label>
      <select class="form-control" [(ngModel)]="bulkForm.promotionId">
        <option value="">Select promotion…</option>
        <option *ngFor="let p of promotions" [value]="p.id">{{p.name}}</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Prefix</label>
        <input class="form-control" [(ngModel)]="bulkForm.prefix" placeholder="SUMMER">
      </div>
      <div class="form-group"><label>Count</label>
        <input class="form-control" type="number" [(ngModel)]="bulkForm.count" min="1" max="500">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Max Uses per Code</label>
        <input class="form-control" type="number" [(ngModel)]="bulkForm.maxUses" min="0">
      </div>
      <div class="form-group"><label>Expires At</label>
        <input class="form-control" type="date" [(ngModel)]="bulkForm.expiresAt">
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-outline" (click)="showBulkModal=false">Cancel</button>
      <button class="btn btn-primary" (click)="saveBulk()">Generate {{bulkForm.count}} Coupons</button>
    </div>
  </div>
</div>

<!-- Loyalty Program Modal -->
<div class="modal-bg" *ngIf="showLoyaltyModal" (click.self)="showLoyaltyModal=false">
  <div class="modal">
    <h3>{{editingLoyaltyId ? 'Edit Loyalty Program' : 'New Loyalty Program'}}</h3>
    <div class="form-group"><label>Name *</label>
      <input class="form-control" [(ngModel)]="loyaltyForm.name" placeholder="Sweet Rewards">
    </div>
    <div class="form-group"><label>Description</label>
      <textarea class="form-control" [(ngModel)]="loyaltyForm.description" rows="2"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Points per $ Spent</label>
        <input class="form-control" type="number" [(ngModel)]="loyaltyForm.pointsPerDollar" step="0.1" min="0">
      </div>
      <div class="form-group"><label>$ Value per Point</label>
        <input class="form-control" type="number" [(ngModel)]="loyaltyForm.dollarPerPoint" step="0.001" min="0">
      </div>
    </div>
    <div class="form-group"><label>Min Points to Redeem</label>
      <input class="form-control" type="number" [(ngModel)]="loyaltyForm.redemptionThreshold" min="1">
    </div>
    <div class="section-title" style="margin-top:16px">Tier Thresholds (points)</div>
    <div class="form-row">
      <div class="form-group"><label>🥈 Silver</label>
        <input class="form-control" type="number" [(ngModel)]="loyaltyForm.silverThreshold" min="1">
      </div>
      <div class="form-group"><label>🥇 Gold</label>
        <input class="form-control" type="number" [(ngModel)]="loyaltyForm.goldThreshold" min="1">
      </div>
    </div>
    <div class="form-group"><label>💎 Platinum</label>
      <input class="form-control" type="number" [(ngModel)]="loyaltyForm.platinumThreshold" min="1">
    </div>
    <div class="form-actions">
      <button class="btn btn-outline" (click)="showLoyaltyModal=false">Cancel</button>
      <button class="btn btn-primary" (click)="saveLoyalty()">Save Program</button>
    </div>
  </div>
</div>

<!-- Enroll Customer Modal -->
<div class="modal-bg" *ngIf="showEnrollModal" (click.self)="showEnrollModal=false">
  <div class="modal">
    <h3>Enroll Customer — {{enrollTargetProgram?.name}}</h3>
    <div class="form-group"><label>Customer ID (GUID)</label>
      <input class="form-control" [(ngModel)]="enrollForm.customerId" placeholder="customer-uuid">
    </div>
    <div class="form-group"><label>Customer Name *</label>
      <input class="form-control" [(ngModel)]="enrollForm.customerName">
    </div>
    <div class="form-group"><label>Email</label>
      <input class="form-control" type="email" [(ngModel)]="enrollForm.customerEmail">
    </div>
    <div class="form-actions">
      <button class="btn btn-outline" (click)="showEnrollModal=false">Cancel</button>
      <button class="btn btn-primary" (click)="enrollCustomer()">Enroll</button>
    </div>
  </div>
</div>

<!-- Award Points Modal -->
<div class="modal-bg" *ngIf="showAwardModal" (click.self)="showAwardModal=false">
  <div class="modal">
    <h3>Award Points — {{awardTarget?.customerName}}</h3>
    <div class="form-group"><label>Points to Award</label>
      <input class="form-control" type="number" [(ngModel)]="awardPoints" min="1">
    </div>
    <div class="form-actions">
      <button class="btn btn-outline" (click)="showAwardModal=false">Cancel</button>
      <button class="btn btn-success" (click)="doAward()">Award Points</button>
    </div>
  </div>
</div>

<!-- Redeem Points Modal -->
<div class="modal-bg" *ngIf="showRedeemModal" (click.self)="showRedeemModal=false">
  <div class="modal">
    <h3>Redeem Points — {{redeemTarget?.customerName}}</h3>
    <p style="color:#6c757d">Available: <strong>{{redeemTarget?.availablePoints | number}}</strong> pts</p>
    <div class="form-group"><label>Points to Redeem</label>
      <input class="form-control" type="number" [(ngModel)]="redeemPoints" min="1" [max]="redeemTarget?.availablePoints ?? null">
    </div>
    <div class="form-actions">
      <button class="btn btn-outline" (click)="showRedeemModal=false">Cancel</button>
      <button class="btn btn-warning" (click)="doRedeem()">Redeem</button>
    </div>
  </div>
</div>
  `
})
export class MarketingComponent implements OnInit {
  tab = 'campaigns';

  // ── Data ──────────────────────────────────────────────────────────────────
  campaigns: Campaign[] = [];
  promotions: Promotion[] = [];
  coupons: Coupon[] = [];
  loyaltyPrograms: LoyaltyProgram[] = [];
  loyaltyAccounts: CustomerLoyaltyAccount[] = [];
  selectedProgram: LoyaltyProgram | null = null;

  // ── Filters ───────────────────────────────────────────────────────────────
  campaignSearch = ''; campaignStatusFilter = '';
  promoSearch = '';
  couponSearch = ''; couponPromoFilter = '';

  // ── Lookups ───────────────────────────────────────────────────────────────
  campaignTypes    = ['Email', 'SMS', 'Social', 'InStore', 'MultiChannel'];
  audienceTypes    = ['AllCustomers', 'NewCustomers', 'LoyaltyMembers', 'HighValue', 'Custom'];
  campaignStatuses = ['Draft', 'Scheduled', 'Active', 'Paused', 'Completed', 'Cancelled'];

  // ── Campaign Modal ────────────────────────────────────────────────────────
  showCampaignModal = false; editingCampaignId = '';
  campaignForm: any = this.defaultCampaignForm();

  // ── Metrics Modal ─────────────────────────────────────────────────────────
  showMetricsModal = false; metricsTarget: Campaign | null = null;
  metricsForm = { reach: 0, conversions: 0, spend: 0 };

  // ── Promo Modal ───────────────────────────────────────────────────────────
  showPromoModal = false; editingPromoId = '';
  promoForm: any = this.defaultPromoForm();

  // ── Coupon Modal ──────────────────────────────────────────────────────────
  showCouponModal = false;
  couponForm = { promotionId: '', code: '', maxUses: 1, expiresAt: '' };

  showBulkModal = false;
  bulkForm = { promotionId: '', prefix: 'COUP', count: 10, maxUses: 1, expiresAt: '' };

  // ── Loyalty Modals ────────────────────────────────────────────────────────
  showLoyaltyModal = false; editingLoyaltyId = '';
  loyaltyForm: any = this.defaultLoyaltyForm();

  showEnrollModal = false; enrollTargetProgram: LoyaltyProgram | null = null;
  enrollForm = { customerId: '', customerName: '', customerEmail: '' };

  showAwardModal = false; awardTarget: CustomerLoyaltyAccount | null = null;
  awardTargetProgram: LoyaltyProgram | null = null; awardPoints = 100;

  showRedeemModal = false; redeemTarget: CustomerLoyaltyAccount | null = null;
  redeemTargetProgram: LoyaltyProgram | null = null; redeemPoints = 100;

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadCampaigns(); this.loadPromotions(); }

  // ── Computed ───────────────────────────────────────────────────────────────
  get activeCampaigns() { return this.campaigns.filter(c => c.status === 'Active').length; }
  get totalReach() { return this.campaigns.reduce((s, c) => s + c.reachCount, 0); }
  get totalConversions() { return this.campaigns.reduce((s, c) => s + c.conversionCount, 0); }
  get totalSpend() { return this.campaigns.reduce((s, c) => s + c.actualSpend, 0); }

  get filteredCampaigns() {
    return this.campaigns.filter(c => {
      const q = this.campaignSearch.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.tags || '').toLowerCase().includes(q);
      const matchStatus = !this.campaignStatusFilter || c.status === this.campaignStatusFilter;
      return matchSearch && matchStatus;
    });
  }

  get filteredPromotions() {
    const q = this.promoSearch.toLowerCase();
    return this.promotions.filter(p => !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
  }

  get filteredCoupons() {
    const q = this.couponSearch.toLowerCase();
    return this.coupons.filter(c => !q || c.code.toLowerCase().includes(q) || c.promotionName.toLowerCase().includes(q));
  }

  budgetPct(c: Campaign) {
    if (c.budget <= 0) return 0;
    return Math.min(100, Math.round((c.actualSpend / c.budget) * 100));
  }

  // ── Loaders ────────────────────────────────────────────────────────────────
  loadCampaigns() {
    this.api.getCampaigns().subscribe({ next: d => this.campaigns = d, error: () => {} });
  }

  loadPromotions() {
    this.api.getMarketingPromotions().subscribe({ next: d => this.promotions = d, error: () => {} });
  }

  loadCoupons() {
    this.api.getMarketingCoupons(this.couponPromoFilter || undefined)
      .subscribe({ next: d => this.coupons = d, error: () => {} });
  }

  loadLoyalty() {
    this.api.getLoyaltyPrograms().subscribe({ next: d => this.loyaltyPrograms = d, error: () => {} });
  }

  // ── Campaign CRUD ─────────────────────────────────────────────────────────
  openNewCampaign() {
    this.editingCampaignId = '';
    this.campaignForm = this.defaultCampaignForm();
    this.showCampaignModal = true;
  }

  editCampaign(c: Campaign) {
    this.editingCampaignId = c.id;
    this.campaignForm = {
      name: c.name, description: c.description || '', type: c.type,
      targetAudience: c.targetAudience, startDate: c.startDate.substring(0, 10),
      endDate: c.endDate ? c.endDate.substring(0, 10) : '',
      budget: c.budget, linkedPromotionId: c.linkedPromotionId || '', tags: c.tags || ''
    };
    this.showCampaignModal = true;
  }

  saveCampaign() {
    const payload = {
      ...this.campaignForm,
      endDate: this.campaignForm.endDate || null,
      linkedPromotionId: this.campaignForm.linkedPromotionId || null
    };
    const obs = this.editingCampaignId
      ? this.api.updateCampaign(this.editingCampaignId, payload)
      : this.api.createCampaign(payload);
    obs.subscribe({ next: () => { this.showCampaignModal = false; this.loadCampaigns(); }, error: () => alert('Failed to save campaign.') });
  }

  setCampaignStatus(c: Campaign, status: string) {
    this.api.setCampaignStatus(c.id, status).subscribe({
      next: () => this.loadCampaigns(),
      error: () => alert('Failed to update campaign status.')
    });
  }

  deleteCampaign(id: string) {
    if (!confirm('Delete this campaign?')) return;
    this.api.deleteCampaign(id).subscribe({ next: () => this.loadCampaigns(), error: () => alert('Failed to delete.') });
  }

  openMetrics(c: Campaign) {
    this.metricsTarget = c;
    this.metricsForm = { reach: 0, conversions: 0, spend: 0 };
    this.showMetricsModal = true;
  }

  saveMetrics() {
    if (!this.metricsTarget) return;
    this.api.recordCampaignMetrics(this.metricsTarget.id, this.metricsForm)
      .subscribe({ next: () => { this.showMetricsModal = false; this.loadCampaigns(); }, error: () => alert('Failed.') });
  }

  // ── Promo CRUD ────────────────────────────────────────────────────────────
  openNewPromo() {
    this.editingPromoId = '';
    this.promoForm = this.defaultPromoForm();
    this.showPromoModal = true;
  }

  editPromo(p: Promotion) {
    this.editingPromoId = p.id;
    this.promoForm = {
      name: p.name, description: p.description || '', discountType: p.discountType,
      discountValue: p.discountValue, minimumOrderAmount: p.minimumOrderAmount,
      maxUsesTotal: p.maxUsesTotal, maxUsesPerCustomer: p.maxUsesPerCustomer,
      startDate: p.startDate.substring(0, 10), endDate: p.endDate ? p.endDate.substring(0, 10) : '',
      applyToAllProducts: p.applyToAllProducts, applicableSkus: p.applicableSkus || '',
      buyQuantity: p.buyQuantity || 2, getQuantity: p.getQuantity || 1
    };
    this.showPromoModal = true;
  }

  savePromo() {
    const payload = { ...this.promoForm, endDate: this.promoForm.endDate || null };
    const obs = this.editingPromoId
      ? this.api.updateMarketingPromotion(this.editingPromoId, payload)
      : this.api.createMarketingPromotion(payload);
    obs.subscribe({ next: () => { this.showPromoModal = false; this.loadPromotions(); }, error: () => alert('Failed to save promotion.') });
  }

  togglePromo(id: string) {
    this.api.toggleMarketingPromotion(id).subscribe({ next: () => this.loadPromotions(), error: () => alert('Failed.') });
  }

  deletePromo(id: string) {
    if (!confirm('Delete this promotion? Existing coupons will become orphaned.')) return;
    this.api.deleteMarketingPromotion(id).subscribe({ next: () => this.loadPromotions(), error: () => alert('Failed.') });
  }

  // ── Coupon CRUD ───────────────────────────────────────────────────────────
  openNewCoupon() { this.couponForm = { promotionId: '', code: '', maxUses: 1, expiresAt: '' }; this.showCouponModal = true; }
  openBulkCoupons() { this.bulkForm = { promotionId: '', prefix: 'COUP', count: 10, maxUses: 1, expiresAt: '' }; this.showBulkModal = true; }

  saveCoupon() {
    const payload = { ...this.couponForm, expiresAt: this.couponForm.expiresAt || null };
    this.api.createMarketingCoupon(payload)
      .subscribe({ next: () => { this.showCouponModal = false; this.loadCoupons(); }, error: () => alert('Failed to create coupon.') });
  }

  saveBulk() {
    const payload = { ...this.bulkForm, expiresAt: this.bulkForm.expiresAt || null };
    this.api.bulkCreateMarketingCoupons(payload)
      .subscribe({ next: (d) => { this.showBulkModal = false; this.loadCoupons(); alert(d.length + ' coupons created!'); }, error: () => alert('Failed.') });
  }

  deactivateCoupon(id: string) {
    this.api.deactivateMarketingCoupon(id).subscribe({ next: () => this.loadCoupons(), error: () => alert('Failed.') });
  }

  // ── Loyalty CRUD ──────────────────────────────────────────────────────────
  openNewLoyalty() { this.editingLoyaltyId = ''; this.loyaltyForm = this.defaultLoyaltyForm(); this.showLoyaltyModal = true; }

  editLoyalty(lp: LoyaltyProgram) {
    this.editingLoyaltyId = lp.id;
    this.loyaltyForm = { name: lp.name, description: lp.description || '',
      pointsPerDollar: lp.pointsPerDollar, dollarPerPoint: lp.dollarPerPoint,
      redemptionThreshold: lp.redemptionThreshold, silverThreshold: lp.silverThreshold,
      goldThreshold: lp.goldThreshold, platinumThreshold: lp.platinumThreshold };
    this.showLoyaltyModal = true;
  }

  saveLoyalty() {
    const obs = this.editingLoyaltyId
      ? this.api.updateLoyaltyProgram(this.editingLoyaltyId, this.loyaltyForm)
      : this.api.createLoyaltyProgram(this.loyaltyForm);
    obs.subscribe({ next: () => { this.showLoyaltyModal = false; this.loadLoyalty(); }, error: () => alert('Failed.') });
  }

  toggleLoyalty(id: string) {
    this.api.toggleLoyaltyProgram(id).subscribe({ next: () => this.loadLoyalty(), error: () => alert('Failed.') });
  }

  selectProgram(lp: LoyaltyProgram) {
    if (this.selectedProgram?.id === lp.id) { this.selectedProgram = null; return; }
    this.selectedProgram = lp;
    this.api.getLoyaltyAccounts(lp.id).subscribe({ next: d => this.loyaltyAccounts = d, error: () => {} });
  }

  openEnroll(lp: LoyaltyProgram) {
    this.enrollTargetProgram = lp;
    this.enrollForm = { customerId: '', customerName: '', customerEmail: '' };
    this.showEnrollModal = true;
  }

  enrollCustomer() {
    if (!this.enrollTargetProgram) return;
    this.api.enrollCustomer(this.enrollTargetProgram.id, this.enrollForm)
      .subscribe({ next: () => { this.showEnrollModal = false; this.selectProgram(this.selectedProgram!); this.loadLoyalty(); },
        error: (e) => alert(e.error || 'Failed to enroll.') });
  }

  openAward(lp: LoyaltyProgram, a: CustomerLoyaltyAccount) {
    this.awardTargetProgram = lp; this.awardTarget = a; this.awardPoints = 100; this.showAwardModal = true;
  }

  doAward() {
    if (!this.awardTargetProgram || !this.awardTarget) return;
    this.api.awardPoints(this.awardTargetProgram.id, { customerId: this.awardTarget.customerId, points: this.awardPoints })
      .subscribe({ next: () => { this.showAwardModal = false; this.selectProgram(this.selectedProgram!); },
        error: () => alert('Failed to award points.') });
  }

  openRedeem(lp: LoyaltyProgram, a: CustomerLoyaltyAccount) {
    this.redeemTargetProgram = lp; this.redeemTarget = a; this.redeemPoints = 100; this.showRedeemModal = true;
  }

  doRedeem() {
    if (!this.redeemTargetProgram || !this.redeemTarget) return;
    this.api.redeemPoints(this.redeemTargetProgram.id, { customerId: this.redeemTarget.customerId, points: this.redeemPoints })
      .subscribe({ next: () => { this.showRedeemModal = false; this.selectProgram(this.selectedProgram!); },
        error: (e) => alert(e.error || 'Failed to redeem points.') });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  discountLabel(p: Promotion) {
    if (p.discountType === 'PercentageOff')  return p.discountValue + '% off';
    if (p.discountType === 'FixedAmountOff') return '$' + p.discountValue + ' off';
    return 'Buy ' + p.buyQuantity + ' Get ' + p.getQuantity;
  }

  discountTypeBadge(t: string) {
    if (t === 'PercentageOff')  return 'badge badge-pct';
    if (t === 'FixedAmountOff') return 'badge badge-fixed';
    return 'badge badge-bxgy';
  }

  promoStatusBadge(s: string) {
    return 'badge badge-' + s.toLowerCase();
  }

  // ── Defaults ───────────────────────────────────────────────────────────────
  defaultCampaignForm() {
    return { name: '', description: '', type: 'Email', targetAudience: 'AllCustomers',
      startDate: new Date().toISOString().substring(0, 10), endDate: '',
      budget: 0, linkedPromotionId: '', tags: '' };
  }

  defaultPromoForm() {
    return { name: '', description: '', discountType: 'PercentageOff', discountValue: 10,
      minimumOrderAmount: 0, maxUsesTotal: 0, maxUsesPerCustomer: 0,
      startDate: new Date().toISOString().substring(0, 10), endDate: '',
      applyToAllProducts: true, applicableSkus: '', buyQuantity: 2, getQuantity: 1 };
  }

  defaultLoyaltyForm() {
    return { name: '', description: '', pointsPerDollar: 1, dollarPerPoint: 0.01,
      redemptionThreshold: 100, silverThreshold: 500, goldThreshold: 2000, platinumThreshold: 5000 };
  }
}
