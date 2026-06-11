import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrgService } from '../../core/services/org.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-logo">
          <span class="logo-icon"></span>
          <h1>Dessert ERP</h1>
          <p>Enterprise Resource Planning</p>
        </div>

        <form (ngSubmit)="login()" #f="ngForm">
          <div class="field">
            <label>Username</label>
            <input type="text" [(ngModel)]="username" name="username"
                   required autocomplete="username" [disabled]="loading()" />
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password"
                   required autocomplete="current-password" [disabled]="loading()" />
          </div>

          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <button type="submit" class="btn-login" [disabled]="loading() || !f.valid">
            @if (loading()) { <span class="spinner"></span> Signing in… }
            @else { Sign In }
          </button>
        </form>

        <p class="hint">Default: <strong>admin</strong> / <strong>Admin&#64;123!</strong></p>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap {
      min-height: 100vh; display: flex; align-items: center;
      justify-content: center; background: #0f172a;
    }
    .login-card {
      background: #1e293b; border-radius: 12px; padding: 40px;
      width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,.5);
    }
    .login-logo { text-align: center; margin-bottom: 32px; }
    .logo-icon  { 
      width: 48px; 
      height: 48px; 
      display: block; 
      margin: 0 auto 8px; 
      background: url('/favicon.ico') no-repeat center center;
      background-size: contain;
    }
    h1          { color: #f1f5f9; font-size: 24px; margin: 0 0 4px; }
    p           { color: #94a3b8; font-size: 13px; margin: 0; }
    .field      { margin-bottom: 16px; }
    label       { display: block; color: #94a3b8; font-size: 12px; margin-bottom: 6px; }
    input       {
      width: 100%; padding: 10px 12px; border-radius: 6px;
      border: 1px solid #334155; background: #0f172a;
      color: #f1f5f9; font-size: 14px; box-sizing: border-box;
    }
    input:focus { outline: none; border-color: #6366f1; }
    .error-msg  {
      background: #450a0a; color: #fca5a5; border-radius: 6px;
      padding: 10px 12px; font-size: 13px; margin-bottom: 16px;
    }
    .btn-login  {
      width: 100%; padding: 12px; background: #6366f1; color: #fff;
      border: none; border-radius: 6px; font-size: 15px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-login:hover:not(:disabled) { background: #4f46e5; }
    .btn-login:disabled { opacity: .6; cursor: default; }
    .spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .hint { color: #475569; font-size: 12px; text-align: center; margin: 20px 0 0; }
    .hint strong { color: #94a3b8; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading  = signal(false);
  error    = signal('');

  constructor(private auth: AuthService, private router: Router, private org: OrgService) {}

  login() {
    if (!this.username || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.login({ username: this.username, password: this.password })
      .subscribe({
        next: () => { this.org.reloadIfEmpty(); this.router.navigate(['/dashboard']); },
        error: (err) => {
          this.error.set(err?.error?.error ?? 'Login failed. Please try again.');
          this.loading.set(false);
        }
      });
  }
}
