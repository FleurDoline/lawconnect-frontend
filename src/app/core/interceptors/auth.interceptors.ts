import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

    console.log('🌐 Interceptor - Request URL:', req.url);
    console.log('🌐 Interceptor - Method:', req.method);

    if (!isBrowser) {
      return next.handle(req);
    }

    // Check all possible token keys
    const token = localStorage.getItem('accessToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('jwt');

    console.log('🔑 Interceptor - Token found:', !!token);
    
    if (token) {
      // Log the full token for debugging (remove in production)
      console.log('🔑 Interceptor - Full token:', token);
      console.log('🔑 Interceptor - Token first 20 chars:', token.substring(0, 20) + '...');
      console.log('🔑 Interceptor - Token length:', token.length);
      
      // Try to decode if JWT
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('🔑 Token payload:', payload);
          const expDate = new Date(payload.exp * 1000);
          console.log('🔑 Token expires:', expDate);
          console.log('🔑 Is token expired?', expDate < new Date());
        }
      } catch(e) {
        console.log('🔑 Token is not a JWT or invalid format');
      }

      const headersConfig: Record<string, string> = {
  Authorization: `Bearer ${token}`
};

// Ne pas forcer Content-Type pour les uploads de fichiers (FormData)
// Le navigateur doit définir lui-même le boundary du multipart/form-data
if (!(req.body instanceof FormData)) {
  headersConfig['Content-Type'] = 'application/json';
}

const cloned = req.clone({
  setHeaders: headersConfig
});
      
      // Log the headers being sent
      console.log('✅ Headers being sent:', cloned.headers.keys());
      
      return next.handle(cloned).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('❌ API Error in interceptor:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message,
            error: error.error
          });
          
          // If 401, redirect to login
          if (error.status === 401) {
            console.warn('⚠️ Unauthorized - Redirecting to login');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('token');
            localStorage.removeItem('jwt');
            this.router.navigate(['/login']);
          }
          
          return throwError(() => error);
        })
      );
    }

    console.warn('⚠️ Interceptor - No token found');
    return next.handle(req);
  }
}