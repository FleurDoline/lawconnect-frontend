import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterResponse {
  email: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:8081/api/auth';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, password })
      .pipe(tap(res => this.storeSession(res)));
  }

  register(payload: { prenom: string; nom: string; email: string; password: string; role: string }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, payload);
  }

  verifyOtp(email: string, code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/verify-otp`, { email, code })
      .pipe(tap(res => this.storeSession(res)));
  }

  resendOtp(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/resend-otp`, { email });
  }

  googleLogin(idToken: string, role?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/google`, { idToken, role })
      .pipe(tap(res => this.storeSession(res)));
  }

  private storeSession(res: AuthResponse): void {
    if (!this.isBrowser) return;
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
  }

  private getPayload(): any | null {
    if (!this.isBrowser) return null;

    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      ));
    } catch (e) {
      console.error('Failed to decode token', e);
      return null;
    }
  }

  getRole(): string | null {
    const payload = this.getPayload();
    if (!payload) return null;
    const rawRole: string = payload.roles || '';
    return rawRole.replace('ROLE_', '');
  }

  getFullName(): string | null {
    const payload = this.getPayload();
    return payload?.fullName || null;
  }

  getEmail(): string | null {
    const payload = this.getPayload();
    return payload?.sub || null;
  }

  getUserId(): number | null {
    const payload = this.getPayload();
    return payload?.userId ?? null;
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    return !!localStorage.getItem('accessToken');
  }

  isClient(): boolean {
    return this.getRole() === 'CLIENT';
  }

  redirectByRole(): void {
    const role = this.getRole();
    if (role === 'AVOCAT') {
      this.router.navigate(['/avocat/dashboard']);
    } else if (role === 'CLIENT') {
      this.router.navigate(['/client/dashboard']);
    } else if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  logout(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.router.navigate(['/']);
  }

  changePassword(userId: number, currentPassword: string, newPassword: string, confirmPassword: string): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}/users/${userId}/password`,
      { currentPassword, newPassword, confirmPassword }
    );
  }
  
}