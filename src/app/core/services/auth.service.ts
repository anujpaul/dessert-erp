import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginRequest  { username: string; password: string; }
export interface UserInfo {
  id: string; username: string; email: string; fullName: string;
  status: string; lastLoginAt: string | null;
  roles: string[]; organizationId: string; createdAt: string;
}
export interface LoginResponse {
  accessToken: string; refreshToken: string; expiresAt: string; user: UserInfo;
}

const ACCESS_KEY  = 'erp_access_token';
const REFRESH_KEY = 'erp_refresh_token';
const USER_KEY    = 'erp_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl;

  private _user   = signal<UserInfo | null>(this.loadUser());
  private _token  = signal<string | null>(sessionStorage.getItem(ACCESS_KEY));

  readonly user        = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => !!this._user());
  readonly roles       = computed(() => this._user()?.roles ?? []);

  constructor(private http: HttpClient, private router: Router) {}

  get accessToken(): string | null { return this._token(); }

  login(req: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, req).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  refresh() {
    const refreshToken = sessionStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return null;
    return this.http.post<LoginResponse>(`${this.base}/auth/refresh`, { refreshToken }).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  logout() {
    this.http.post(`${this.base}/auth/logout`, {}).subscribe({ error: () => {} });
    this.clearSession();
    this.router.navigate(['/login']);
  }

  hasRole(role: string) { return this.roles().includes(role); }

  hasAnyRole(...roles: string[]) { return roles.some(r => this.roles().includes(r)); }

  private handleAuthResponse(res: LoginResponse) {
    sessionStorage.setItem(ACCESS_KEY,  res.accessToken);
    sessionStorage.setItem(REFRESH_KEY, res.refreshToken);
    sessionStorage.setItem(USER_KEY,    JSON.stringify(res.user));
    this._token.set(res.accessToken);
    this._user.set(res.user);
  }

  private clearSession() {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  private loadUser(): UserInfo | null {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
