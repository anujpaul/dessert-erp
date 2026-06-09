import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface UserDto {
  id: string; username: string; email: string; fullName: string;
  status: string; lastLoginAt: string | null; roles: string[]; createdAt: string;
}
interface RoleDto {
  id: string; name: string; description: string; isSystemRole: boolean;
  permissions: { module: string; action: string }[];
}
interface AuditLog {
  id: string; username: string; module: string; action: string;
  entityId: string | null; entityType: string | null;
  oldValues: string | null; newValues: string | null;
  ipAddress: string | null; occurredAt: string;
}
interface OrgSettings {
  id: string; code: string; name: string; logoUrl: string | null;
  baseCurrency: string; defaultCurrency: string; timezone: string | null;
  taxId: string | null; address: string | null; phone: string | null; email: string | null;
  moneyDecimalPlaces: number; moneyRoundingMethod: string; moneyRoundingLevel: string;
}
interface OrgSummary {
  id: string; code: string; name: string; baseCurrency: string;
  status: string; createdAt: string;
}

const MODULES  = ['GL','AR','AP','PM','SysAdmin'];
const ACTIONS  = ['Read','Write','Delete','Approve'];

const CURRENCIES: { code: string; name: string }[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'QAR', name: 'Qatari Riyal' },
  { code: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'BDT', name: 'Bangladeshi Taka' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'RON', name: 'Romanian Leu' },
  { code: 'RUB', name: 'Russian Ruble' },
  { code: 'UAH', name: 'Ukrainian Hryvnia' },
  { code: 'ILS', name: 'Israeli Shekel' },
  { code: 'CLP', name: 'Chilean Peso' },
  { code: 'COP', name: 'Colombian Peso' },
  { code: 'PEN', name: 'Peruvian Sol' },
  { code: 'ARS', name: 'Argentine Peso' },
];

const TIMEZONES: { zone: string; label: string }[] = [
  // Americas
  { zone: 'America/New_York',      label: '(UTC-05:00) Eastern Time — New York' },
  { zone: 'America/Chicago',       label: '(UTC-06:00) Central Time — Chicago' },
  { zone: 'America/Denver',        label: '(UTC-07:00) Mountain Time — Denver' },
  { zone: 'America/Phoenix',       label: '(UTC-07:00) Mountain Time — Phoenix (no DST)' },
  { zone: 'America/Los_Angeles',   label: '(UTC-08:00) Pacific Time — Los Angeles' },
  { zone: 'America/Anchorage',     label: '(UTC-09:00) Alaska Time' },
  { zone: 'Pacific/Honolulu',      label: '(UTC-10:00) Hawaii Time' },
  { zone: 'America/Toronto',       label: '(UTC-05:00) Eastern Time — Toronto' },
  { zone: 'America/Vancouver',     label: '(UTC-08:00) Pacific Time — Vancouver' },
  { zone: 'America/Sao_Paulo',     label: '(UTC-03:00) Brasília Time' },
  { zone: 'America/Mexico_City',   label: '(UTC-06:00) Central Time — Mexico City' },
  { zone: 'America/Bogota',        label: '(UTC-05:00) Colombia Time' },
  { zone: 'America/Lima',          label: '(UTC-05:00) Peru Time' },
  { zone: 'America/Buenos_Aires',  label: '(UTC-03:00) Argentina Time' },
  { zone: 'America/Santiago',      label: '(UTC-04:00) Chile Time' },
  // Europe
  { zone: 'UTC',                   label: '(UTC+00:00) UTC' },
  { zone: 'Europe/London',         label: '(UTC+00:00) GMT — London' },
  { zone: 'Europe/Dublin',         label: '(UTC+00:00) Irish Standard Time — Dublin' },
  { zone: 'Europe/Lisbon',         label: '(UTC+00:00) Western European — Lisbon' },
  { zone: 'Europe/Paris',          label: '(UTC+01:00) Central European — Paris' },
  { zone: 'Europe/Berlin',         label: '(UTC+01:00) Central European — Berlin' },
  { zone: 'Europe/Amsterdam',      label: '(UTC+01:00) Central European — Amsterdam' },
  { zone: 'Europe/Brussels',       label: '(UTC+01:00) Central European — Brussels' },
  { zone: 'Europe/Madrid',         label: '(UTC+01:00) Central European — Madrid' },
  { zone: 'Europe/Rome',           label: '(UTC+01:00) Central European — Rome' },
  { zone: 'Europe/Warsaw',         label: '(UTC+01:00) Central European — Warsaw' },
  { zone: 'Europe/Stockholm',      label: '(UTC+01:00) Central European — Stockholm' },
  { zone: 'Europe/Zurich',         label: '(UTC+01:00) Central European — Zurich' },
  { zone: 'Europe/Athens',         label: '(UTC+02:00) Eastern European — Athens' },
  { zone: 'Europe/Helsinki',       label: '(UTC+02:00) Eastern European — Helsinki' },
  { zone: 'Europe/Bucharest',      label: '(UTC+02:00) Eastern European — Bucharest' },
  { zone: 'Europe/Kiev',           label: '(UTC+02:00) Eastern European — Kyiv' },
  { zone: 'Europe/Moscow',         label: '(UTC+03:00) Moscow Time' },
  { zone: 'Europe/Istanbul',       label: '(UTC+03:00) Turkey Time — Istanbul' },
  // Middle East & Africa
  { zone: 'Asia/Dubai',            label: '(UTC+04:00) Gulf Standard Time — Dubai' },
  { zone: 'Asia/Riyadh',           label: '(UTC+03:00) Arabia Standard Time — Riyadh' },
  { zone: 'Asia/Kuwait',           label: '(UTC+03:00) Arabia Standard Time — Kuwait' },
  { zone: 'Asia/Qatar',            label: '(UTC+03:00) Arabia Standard Time — Doha' },
  { zone: 'Asia/Bahrain',          label: '(UTC+03:00) Arabia Standard Time — Bahrain' },
  { zone: 'Asia/Jerusalem',        label: '(UTC+02:00) Israel Standard Time' },
  { zone: 'Africa/Cairo',          label: '(UTC+02:00) Eastern European — Cairo' },
  { zone: 'Africa/Nairobi',        label: '(UTC+03:00) East Africa Time — Nairobi' },
  { zone: 'Africa/Lagos',          label: '(UTC+01:00) West Africa Time — Lagos' },
  { zone: 'Africa/Johannesburg',   label: '(UTC+02:00) South Africa Standard Time' },
  { zone: 'Africa/Accra',          label: '(UTC+00:00) Ghana Mean Time — Accra' },
  // Asia Pacific
  { zone: 'Asia/Karachi',          label: '(UTC+05:00) Pakistan Standard Time' },
  { zone: 'Asia/Kolkata',          label: '(UTC+05:30) India Standard Time' },
  { zone: 'Asia/Dhaka',            label: '(UTC+06:00) Bangladesh Standard Time' },
  { zone: 'Asia/Bangkok',          label: '(UTC+07:00) Indochina Time — Bangkok' },
  { zone: 'Asia/Jakarta',          label: '(UTC+07:00) Western Indonesia Time' },
  { zone: 'Asia/Ho_Chi_Minh',      label: '(UTC+07:00) Indochina Time — Ho Chi Minh' },
  { zone: 'Asia/Kuala_Lumpur',     label: '(UTC+08:00) Malaysia Time' },
  { zone: 'Asia/Singapore',        label: '(UTC+08:00) Singapore Time' },
  { zone: 'Asia/Manila',           label: '(UTC+08:00) Philippine Time' },
  { zone: 'Asia/Shanghai',         label: '(UTC+08:00) China Standard Time' },
  { zone: 'Asia/Hong_Kong',        label: '(UTC+08:00) Hong Kong Time' },
  { zone: 'Asia/Taipei',           label: '(UTC+08:00) Taipei Standard Time' },
  { zone: 'Asia/Tokyo',            label: '(UTC+09:00) Japan Standard Time' },
  { zone: 'Asia/Seoul',            label: '(UTC+09:00) Korea Standard Time' },
  { zone: 'Australia/Sydney',      label: '(UTC+10:00) Australian Eastern — Sydney' },
  { zone: 'Australia/Melbourne',   label: '(UTC+10:00) Australian Eastern — Melbourne' },
  { zone: 'Australia/Brisbane',    label: '(UTC+10:00) Australian Eastern — Brisbane (no DST)' },
  { zone: 'Australia/Perth',       label: '(UTC+08:00) Australian Western — Perth' },
  { zone: 'Pacific/Auckland',      label: '(UTC+12:00) New Zealand Standard Time' },
];

@Component({
  selector: 'app-system-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="sa-page">
  <div class="page-header">
    <h2>⚙️ System Administration</h2>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button *ngFor="let t of tabs" class="tab" [class.active]="activeTab()===t" (click)="activeTab.set(t)">
      {{ tabLabel(t) }}
    </button>
  </div>

  <!-- ── USERS ── -->
  <div *ngIf="activeTab()==='users'" class="tab-content">
    <div class="section-header">
      <span>{{ users().length }} users</span>
      <button class="btn-primary" (click)="showCreateUser = true">+ New User</button>
    </div>

    <!-- Create User Form -->
    <div class="modal-overlay" *ngIf="showCreateUser" (click)="showCreateUser=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Create User</h3>
        <div class="form-grid">
          <label>Username<input [(ngModel)]="newUser.username" /></label>
          <label>Email<input [(ngModel)]="newUser.email" type="email" /></label>
          <label>Full Name<input [(ngModel)]="newUser.fullName" /></label>
          <label>Password<input [(ngModel)]="newUser.password" type="password" /></label>
        </div>
        <div class="field-full">
          <label>Roles</label>
          <div class="checkbox-list">
            <label *ngFor="let r of roles()" class="checkbox-item">
              <input type="checkbox" [checked]="newUserRoles.includes(r.id)"
                (change)="toggleNewUserRole(r.id, $event)" />
              {{ r.name }}
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="showCreateUser=false">Cancel</button>
          <button class="btn-primary" (click)="createUser()">Create</button>
        </div>
      </div>
    </div>

    <table class="erp-table">
      <thead><tr>
        <th>Username</th><th>Full Name</th><th>Email</th>
        <th>Status</th><th>Roles</th><th>Last Login</th><th>Actions</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let u of users()">
          <td><strong>{{ u.username }}</strong></td>
          <td>{{ u.fullName }}</td>
          <td>{{ u.email }}</td>
          <td><span class="badge" [class]="'badge-'+u.status.toLowerCase()">{{ u.status }}</span></td>
          <td>{{ u.roles.join(', ') }}</td>
          <td>{{ u.lastLoginAt ? (u.lastLoginAt | date:'short') : 'Never' }}</td>
          <td class="actions">
            <button class="icon-btn" *ngIf="u.status !== 'Active'"   (click)="activateUser(u.id)" title="Activate">✅</button>
            <button class="icon-btn" *ngIf="u.status === 'Active'"   (click)="deactivateUser(u.id)" title="Deactivate">⏸</button>
            <button class="icon-btn" (click)="openResetPw(u)" title="Reset Password">🔑</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Reset PW Modal -->
    <div class="modal-overlay" *ngIf="resetPwUser" (click)="resetPwUser=null">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Reset Password — {{ resetPwUser?.username }}</h3>
        <label>New Password<input [(ngModel)]="newPassword" type="password" /></label>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="resetPwUser=null">Cancel</button>
          <button class="btn-primary" (click)="resetPassword()">Reset</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── ROLES ── -->
  <div *ngIf="activeTab()==='roles'" class="tab-content">
    <div class="section-header">
      <span>{{ roles().length }} roles</span>
      <button class="btn-primary" (click)="openCreateRole()">+ New Role</button>
    </div>

    <!-- Role editor modal -->
    <div class="modal-overlay" *ngIf="editingRole" (click)="editingRole=null">
      <div class="modal modal-lg" (click)="$event.stopPropagation()">
        <h3>{{ editingRole.id ? 'Edit Role' : 'Create Role' }} — {{ editingRole.name || '(new)' }}</h3>
        <div class="form-grid">
          <label>Name<input [(ngModel)]="editingRole.name" /></label>
          <label>Description<input [(ngModel)]="editingRole.description" /></label>
        </div>
        <h4 style="margin-top:16px;color:#94a3b8">Permissions</h4>
        <table class="perm-matrix">
          <thead>
            <tr>
              <th>Module</th>
              <th *ngFor="let a of actions">{{ a }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of modules">
              <td>{{ m }}</td>
              <td *ngFor="let a of actions">
                <input type="checkbox"
                  [checked]="hasEditPerm(m, a)"
                  (change)="toggleEditPerm(m, a, $event)" />
              </td>
            </tr>
          </tbody>
        </table>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="editingRole=null">Cancel</button>
          <button class="btn-primary" (click)="saveRole()">Save</button>
        </div>
      </div>
    </div>

    <div class="role-cards">
      <div class="role-card" *ngFor="let r of roles()">
        <div class="role-card-header">
          <strong>{{ r.name }}</strong>
          <span class="badge badge-system" *ngIf="r.isSystemRole">System</span>
          <button class="icon-btn" (click)="openEditRole(r)">✏️</button>
          <button class="icon-btn" *ngIf="!r.isSystemRole" (click)="deleteRole(r.id)">🗑️</button>
        </div>
        <p class="role-desc">{{ r.description }}</p>
        <div class="perm-chips">
          <span class="chip" *ngFor="let p of r.permissions">{{ p.module }}:{{ p.action }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ── AUDIT LOG ── -->
  <div *ngIf="activeTab()==='audit'" class="tab-content">
    <div class="section-header">
      <div class="filter-row">
        <input [(ngModel)]="auditModule" placeholder="Module (GL, AR…)" (keyup.enter)="loadAudit()" />
        <input [(ngModel)]="auditFrom" type="datetime-local" (change)="loadAudit()" />
        <input [(ngModel)]="auditTo" type="datetime-local" (change)="loadAudit()" />
        <button class="btn-secondary" (click)="loadAudit()">Filter</button>
      </div>
    </div>
    <table class="erp-table">
      <thead><tr>
        <th>Time</th><th>User</th><th>Module</th><th>Action</th>
        <th>Entity</th><th>IP</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let log of auditLogs()">
          <td>{{ log.occurredAt | date:'short' }}</td>
          <td>{{ log.username }}</td>
          <td>{{ log.module }}</td>
          <td>{{ log.action }}</td>
          <td>{{ log.entityType }}{{ log.entityId ? ' #'+log.entityId.slice(0,8) : '' }}</td>
          <td>{{ log.ipAddress }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ── ORG SETTINGS ── -->
  <div *ngIf="activeTab()==='org'" class="tab-content">
    <div *ngIf="orgSettings()" class="settings-form">
      <h3>Organization Settings</h3>

      <div class="settings-section">
        <div class="settings-section-label">Identity</div>
        <div class="form-grid">
          <label>Organization Code (read-only)
            <input [value]="orgSettings()!.code" readonly class="readonly" />
          </label>
          <label>Legal Name
            <input [(ngModel)]="orgForm.name" />
          </label>
          <label>Tax / VAT ID
            <input [(ngModel)]="orgForm.taxId" placeholder="e.g. XX-1234567" />
          </label>
          <label>Logo URL
            <input [(ngModel)]="orgForm.logoUrl" placeholder="https://…" />
          </label>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-label">Finance &amp; Locale</div>
        <div class="form-grid">
          <label>Base / Accounting Currency (read-only)
            <input [value]="orgSettings()!.baseCurrency" readonly class="readonly" />
          </label>
          <label>Reporting / Display Currency
            <select [(ngModel)]="orgForm.defaultCurrency" class="form-select">
              <option *ngFor="let c of currencies" [value]="c.code">
                {{ c.code }} — {{ c.name }}
              </option>
            </select>
          </label>
          <label class="full">Timezone
            <select [(ngModel)]="orgForm.timezone" class="form-select">
              <option value="">— Select timezone —</option>
              <option *ngFor="let tz of timezones" [value]="tz.zone">
                {{ tz.label }}
              </option>
            </select>
          </label>
          <label>Money Decimal Places
            <select [(ngModel)]="orgForm.moneyDecimalPlaces" class="form-select">
              <option [ngValue]="0">0 (whole amounts)</option>
              <option [ngValue]="1">1 decimal place</option>
              <option [ngValue]="2">2 decimal places</option>
              <option [ngValue]="3">3 decimal places</option>
              <option [ngValue]="4">4 decimal places</option>
            </select>
          </label>
          <label>Midpoint Rounding
            <select [(ngModel)]="orgForm.moneyRoundingMethod" class="form-select">
              <option value="HalfUp">Half up (0.005 becomes 0.01)</option>
              <option value="Bankers">Banker's / half to even</option>
            </select>
          </label>
          <label class="full">Rounding Stage
            <select [(ngModel)]="orgForm.moneyRoundingLevel" class="form-select">
              <option value="Line">Round each order line</option>
              <option value="Document">Round only document totals</option>
            </select>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-label">Contact</div>
        <div class="form-grid">
          <label>Email
            <input [(ngModel)]="orgForm.email" type="email" placeholder="info@company.com" />
          </label>
          <label>Phone
            <input [(ngModel)]="orgForm.phone" placeholder="+1-555-0100" />
          </label>
          <label class="full">Address
            <input [(ngModel)]="orgForm.address" placeholder="Street, City, State ZIP" />
          </label>
        </div>
      </div>

      <div class="form-footer">
        <button class="btn-primary" (click)="saveOrgSettings()">Save Changes</button>
        <span class="save-msg" *ngIf="orgSaved">✓ Saved successfully</span>
      </div>
    </div>
    <div *ngIf="!orgSettings()" class="empty-state">Loading organization settings…</div>
  </div>

  <!-- ── ORGANIZATIONS ── -->
  <div *ngIf="activeTab()==='orgs'" class="tab-content">
    <div class="section-header">
      <span>{{ allOrgs().length }} organizations</span>
    </div>
    <table class="erp-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Currency</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let o of allOrgs()">
          <td><code>{{ o.code }}</code></td>
          <td>{{ o.name }}</td>
          <td>{{ o.baseCurrency }}</td>
          <td>
            <span class="badge"
              [class.badge-active]="o.status === 'Active'"
              [class.badge-inactive]="o.status === 'Suspended'"
              [class.badge-locked]="o.status === 'Pending'">
              {{ o.status }}
            </span>
          </td>
          <td>{{ o.createdAt | date:'mediumDate' }}</td>
          <td>
            <div class="actions">
              <button *ngIf="o.status !== 'Active'" class="icon-btn" title="Activate"
                (click)="activateOrg(o.id, o.name)">✅</button>
              <button *ngIf="o.status === 'Active'" class="icon-btn" title="Suspend"
                (click)="suspendOrg(o.id, o.name)">⏸</button>
              <button *ngIf="o.code !== 'DEFAULT' && o.code !== 'DEMO01'" class="icon-btn" title="Delete"
                style="color:#dc2626"
                (click)="deleteOrg(o.id, o.name)">🗑</button>
            </div>
          </td>
        </tr>
        <tr *ngIf="!allOrgs().length">
          <td colspan="6" class="empty-state">No organizations found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
  `,
  styles: [`
    .sa-page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 20px; }
    h2 { font-size: 22px; color: #1e293b; }

    .tabs { display: flex; gap: 4px; border-bottom: 2px solid #e2e8f0; margin-bottom: 24px; }
    .tab {
      padding: 10px 20px; border: none; background: none;
      font-size: 14px; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px;
    }
    .tab.active { color: #6366f1; border-bottom-color: #6366f1; font-weight: 600; }

    .tab-content { }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-row input { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }

    .erp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .erp-table th { background: #f8fafc; padding: 10px 12px; text-align: left; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
    .erp-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .erp-table tr:hover td { background: #f8fafc; }

    .actions { display: flex; gap: 4px; }
    .icon-btn { background: none; border: none; cursor: pointer; font-size: 14px; padding: 3px 5px; border-radius: 4px; }
    .icon-btn:hover { background: #f1f5f9; }

    .badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-active   { background: #dcfce7; color: #15803d; }
    .badge-inactive { background: #fee2e2; color: #991b1b; }
    .badge-locked   { background: #fef3c7; color: #92400e; }
    .badge-system   { background: #ede9fe; color: #6d28d9; }

    .btn-primary   { padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }
    .btn-primary:hover { background: #4f46e5; }
    .btn-secondary { padding: 8px 16px; background: #f1f5f9; color: #374151; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; cursor: pointer; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 999; }
    .modal { background: #fff; border-radius: 12px; padding: 28px; min-width: 440px; max-width: 640px; }
    .modal-lg { min-width: 640px; }
    .modal h3 { font-size: 16px; margin-bottom: 16px; color: #1e293b; }
    .modal h4 { font-size: 13px; color: #64748b; margin-bottom: 8px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-grid label, .field-full label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #64748b; }
    .form-grid input, .field-full input, .modal input { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }
    .checkbox-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
    .checkbox-item { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #374151; }

    /* Permissions matrix */
    .perm-matrix { width: 100%; border-collapse: collapse; font-size: 13px; }
    .perm-matrix th, .perm-matrix td { padding: 6px 12px; text-align: center; border: 1px solid #e2e8f0; }
    .perm-matrix th:first-child, .perm-matrix td:first-child { text-align: left; }

    /* Role cards */
    .role-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .role-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
    .role-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .role-card-header strong { flex: 1; color: #1e293b; }
    .role-desc { font-size: 12px; color: #64748b; margin-bottom: 10px; }
    .perm-chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .chip { background: #ede9fe; color: #6d28d9; padding: 2px 7px; border-radius: 10px; font-size: 11px; }

    /* Settings form */
    .settings-form { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; max-width: 760px; }
    .settings-form h3 { font-size: 16px; color: #1e293b; margin-bottom: 20px; }
    .settings-section { margin-bottom: 24px; }
    .settings-section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9; }
    .settings-form .form-grid { grid-template-columns: 1fr 1fr; }
    .settings-form .full { grid-column: 1 / -1; }
    input.readonly { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
    .form-select {
      padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px;
      font-size: 13px; background: #fff; color: #1e293b; width: 100%;
      appearance: none; -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 10px center;
      padding-right: 28px;
    }
    .form-select:focus { outline: none; border-color: #6366f1; }
    .form-footer { margin-top: 20px; display: flex; align-items: center; gap: 12px; }
    .save-msg { font-size: 13px; color: #16a34a; font-weight: 600; }
    .empty-state { color: #94a3b8; font-size: 14px; padding: 40px; text-align: center; }
  `]
})
export class SystemAdminComponent implements OnInit {
  private base = environment.apiUrl;

  tabs       = ['users','roles','audit','org','orgs'] as const;
  activeTab  = signal<'users'|'roles'|'audit'|'org'|'orgs'>('users');
  modules    = MODULES;
  actions    = ACTIONS;
  currencies = CURRENCIES;
  timezones  = TIMEZONES;

  users     = signal<UserDto[]>([]);
  roles     = signal<RoleDto[]>([]);
  auditLogs = signal<AuditLog[]>([]);
  orgSettings = signal<OrgSettings | null>(null);
  allOrgs   = signal<OrgSummary[]>([]);

  showCreateUser = false;
  newUser        = { username: '', email: '', fullName: '', password: '' };
  newUserRoles: string[] = [];

  resetPwUser: UserDto | null = null;
  newPassword = '';

  editingRole: any = null;

  auditModule = '';
  auditFrom   = '';
  auditTo     = '';

  orgForm: Partial<OrgSettings> = {};
  orgSaved = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
    this.loadAudit();
    this.loadOrgSettings();
    this.loadAllOrgs();
  }

  tabLabel(t: string) {
    return { users: '👤 Users', roles: '🔑 Roles', audit: '📋 Audit Log', org: '🏢 Org Settings', orgs: '🏛 Organizations' }[t] ?? t;
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  loadUsers() {
    this.http.get<UserDto[]>(`${this.base}/sysadmin/users`)
      .subscribe({ next: d => this.users.set(d), error: () => {} });
  }

  createUser() {
    const body = { ...this.newUser, roleIds: this.newUserRoles };
    this.http.post<UserDto>(`${this.base}/sysadmin/users`, body).subscribe({
      next: () => { this.loadUsers(); this.showCreateUser = false; this.resetNewUserForm(); },
      error: e => alert(e.error?.error ?? 'Failed to create user')
    });
  }

  toggleNewUserRole(id: string, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    this.newUserRoles = checked
      ? [...this.newUserRoles, id]
      : this.newUserRoles.filter(r => r !== id);
  }

  activateUser(id: string) {
    this.http.post(`${this.base}/sysadmin/users/${id}/activate`, {}).subscribe(() => this.loadUsers());
  }
  deactivateUser(id: string) {
    this.http.post(`${this.base}/sysadmin/users/${id}/deactivate`, {}).subscribe(() => this.loadUsers());
  }

  openResetPw(u: UserDto) { this.resetPwUser = u; this.newPassword = ''; }
  resetPassword() {
    if (!this.resetPwUser) return;
    this.http.post(`${this.base}/sysadmin/users/reset-password`,
      { userId: this.resetPwUser.id, newPassword: this.newPassword }).subscribe({
      next: () => { this.resetPwUser = null; },
      error: e => alert(e.error?.error ?? 'Failed')
    });
  }

  resetNewUserForm() {
    this.newUser = { username: '', email: '', fullName: '', password: '' };
    this.newUserRoles = [];
  }

  // ── Roles ──────────────────────────────────────────────────────────────────
  loadRoles() {
    this.http.get<RoleDto[]>(`${this.base}/sysadmin/roles`)
      .subscribe({ next: d => this.roles.set(d), error: () => {} });
  }

  openCreateRole() {
    this.editingRole = { id: '', name: '', description: '', permissions: [] };
  }
  openEditRole(r: RoleDto) {
    this.editingRole = { id: r.id, name: r.name, description: r.description,
      permissions: r.permissions.map(p => ({ module: p.module, action: p.action })) };
  }

  hasEditPerm(m: string, a: string) {
    return this.editingRole?.permissions?.some((p: any) => p.module === m && p.action === a) ?? false;
  }
  toggleEditPerm(m: string, a: string, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    if (checked) {
      this.editingRole.permissions = [...this.editingRole.permissions, { module: m, action: a }];
    } else {
      this.editingRole.permissions = this.editingRole.permissions
        .filter((p: any) => !(p.module === m && p.action === a));
    }
  }

  saveRole() {
    const body = { name: this.editingRole.name, description: this.editingRole.description,
      permissions: this.editingRole.permissions };
    const req$ = this.editingRole.id
      ? this.http.put(`${this.base}/sysadmin/roles/${this.editingRole.id}`, body)
      : this.http.post(`${this.base}/sysadmin/roles`, body);
    req$.subscribe({
      next: () => { this.loadRoles(); this.editingRole = null; },
      error: e => alert(e.error?.error ?? 'Failed')
    });
  }

  deleteRole(id: string) {
    if (!confirm('Delete this role?')) return;
    this.http.delete(`${this.base}/sysadmin/roles/${id}`).subscribe({
      next: () => this.loadRoles(),
      error: e => alert(e.error?.error ?? 'Failed')
    });
  }

  // ── Audit Log ──────────────────────────────────────────────────────────────
  loadAudit() {
    let url = `${this.base}/sysadmin/audit-log?`;
    if (this.auditModule) url += `module=${this.auditModule}&`;
    if (this.auditFrom)   url += `from=${encodeURIComponent(this.auditFrom)}&`;
    if (this.auditTo)     url += `to=${encodeURIComponent(this.auditTo)}&`;
    this.http.get<AuditLog[]>(url).subscribe({ next: d => this.auditLogs.set(d), error: () => {} });
  }

  // ── Org Settings ───────────────────────────────────────────────────────────
  loadOrgSettings() {
    this.http.get<OrgSettings>(`${this.base}/sysadmin/org-settings`)
      .subscribe({ next: d => { this.orgSettings.set(d); this.orgForm = { ...d }; }, error: () => {} });
  }

  saveOrgSettings() {
    const body = {
      name:            this.orgForm.name,
      logoUrl:         this.orgForm.logoUrl,
      defaultCurrency: this.orgForm.defaultCurrency,
      timezone:        this.orgForm.timezone,
      taxId:           this.orgForm.taxId,
      address:         this.orgForm.address,
      phone:           this.orgForm.phone,
      email:           this.orgForm.email,
      moneyDecimalPlaces: this.orgForm.moneyDecimalPlaces,
      moneyRoundingMethod: this.orgForm.moneyRoundingMethod,
      moneyRoundingLevel: this.orgForm.moneyRoundingLevel,
    };
    this.http.put<OrgSettings>(`${this.base}/sysadmin/org-settings`, body).subscribe({
      next: d => {
        this.orgSettings.set(d);
        this.orgForm = { ...d };
        this.orgSaved = true;
        setTimeout(() => this.orgSaved = false, 2500);
      },
      error: e => alert(e.error?.error ?? 'Failed to save settings')
    });
  }

  // ── Organizations (Admin management) ───────────────────────────────────────
  loadAllOrgs() {
    this.http.get<OrgSummary[]>(`${this.base}/organizations`)
      .subscribe({ next: d => this.allOrgs.set(d), error: () => {} });
  }

  suspendOrg(id: string, name: string) {
    if (!confirm(`Suspend organization "${name}"?`)) return;
    this.http.post(`${this.base}/organizations/${id}/suspend`, {}).subscribe({
      next: () => this.loadAllOrgs(),
      error: e => alert(e.error?.error ?? 'Failed')
    });
  }

  activateOrg(id: string, name: string) {
    if (!confirm(`Activate organization "${name}"?`)) return;
    this.http.post(`${this.base}/organizations/${id}/activate`, {}).subscribe({
      next: () => this.loadAllOrgs(),
      error: e => alert(e.error?.error ?? 'Failed')
    });
  }

  deleteOrg(id: string, name: string) {
    if (!confirm(`Permanently delete organization "${name}"? This cannot be undone.`)) return;
    this.http.delete(`${this.base}/organizations/${id}`).subscribe({
      next: () => this.loadAllOrgs(),
      error: e => alert(e.error?.error ?? 'Failed')
    });
  }
}
