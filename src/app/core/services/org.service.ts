import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface OrgDto { id: string; code: string; name: string; baseCurrency: string; status: string; }

const STORAGE_KEY = 'erp_active_org';

@Injectable({ providedIn: 'root' })
export class OrgService {
  private _orgs    = signal<OrgDto[]>([]);
  private _activeId = signal<string | null>(sessionStorage.getItem(STORAGE_KEY));
  private _loaded  = false;

  orgs     = this._orgs.asReadonly();
  activeId = this._activeId.asReadonly();
  activeOrg = computed(() => this._orgs().find(o => o.id === this._activeId()) ?? null);

  get organizationId(): string | null { return this._activeId(); }

  constructor(private http: HttpClient) {
    if (sessionStorage.getItem('erp_access_token')) {
      this.loadOrgs();
    }
  }

  loadOrgs() {
    this.http.get<OrgDto[]>(`${environment.apiUrl}/organizations`).subscribe({
      next: orgs => {
        this._orgs.set(orgs);
        this._loaded = true;
        // Auto-select first org if none stored or stored id no longer exists
        const storedStillExists = orgs.some(o => o.id === this._activeId());
        if ((!this._activeId() || !storedStillExists) && orgs.length > 0) {
          this.setActive(orgs[0].id);
        }
      },
      error: () => {}
    });
  }

  reloadIfEmpty() {
    if (!this._loaded || this._orgs().length === 0) {
      this.loadOrgs();
    }
  }

  setActive(id: string) {
    this._activeId.set(id);
    sessionStorage.setItem(STORAGE_KEY, id);
  }
}
