import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent implements AfterViewInit {
  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  loading = false;

  private readonly GOOGLE_CLIENT_ID = '281235908564-uih5e8998qdccbiqvnhajrrbur2vpusk.apps.googleusercontent.com';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngAfterViewInit(): void {
    google.accounts.id.initialize({
      client_id: this.GOOGLE_CLIENT_ID,
      callback: (response: any) => this.handleGoogleResponse(response)
    });

    google.accounts.id.renderButton(
      document.getElementById('googleBtn'),
      { theme: 'outline', size: 'large', width: 300, locale: 'fr' }
    );
  }

  handleGoogleResponse(response: any): void {
    this.loading = true;
    this.authService.googleLogin(response.credential).subscribe({
      next: () => {
        this.loading = false;
        this.redirectAfterLogin();
      },
      error: (err) => {
        this.loading = false;
        console.error('Google login failed', err);
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.redirectAfterLogin();
      },
      error: (err) => {
        this.loading = false;
        console.error('Login failed', err);
      }
    });
  }

  private redirectAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    const avocatId = this.route.snapshot.queryParams['avocatId'];

    if (returnUrl) {
      this.router.navigate([returnUrl], {
        queryParams: avocatId ? { avocatId } : {}
      });
    } else {
      this.authService.redirectByRole();
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}