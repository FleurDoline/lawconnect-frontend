import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class SignupComponent implements OnInit, AfterViewInit {
  prenom = '';
  nom = '';
  email = '';
  password = '';
  confirmPassword = '';
  acceptTerms = false;
  showPassword = false;
  loading = false;
  errorMessage = '';
  role: 'CLIENT' | 'AVOCAT' = 'CLIENT';
  roleLockedByUrl = false;

  private readonly GOOGLE_CLIENT_ID = '281235908564-uih5e8998qdccbiqvnhajrrbur2vpusk.apps.googleusercontent.com';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['role'] === 'avocat') {
        this.role = 'AVOCAT';
        this.roleLockedByUrl = true;
      } else if (params['role'] === 'client') {
        this.role = 'CLIENT';
        this.roleLockedByUrl = true;
      }
    });
  }

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
    this.errorMessage = '';
    this.loading = true;
    this.authService.googleLogin(response.credential, this.role).subscribe({
      next: () => {
        this.loading = false;
        this.authService.redirectByRole();
      },
      error: (err) => {
        this.loading = false;
        console.error('Google signup failed', err);
        this.errorMessage = this.extractErrorMessage(err, 'Erreur lors de la connexion avec Google');
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.prenom || !this.nom || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (!this.acceptTerms) {
      this.errorMessage = 'Veuillez accepter les conditions d\'utilisation.';
      return;
    }

    this.loading = true;

    this.authService.register({
     prenom: this.prenom,
     nom: this.nom,
     email: this.email,
     password: this.password,
     role: this.role
   }).subscribe({
    next: () => {
      this.loading = false;
      this.router.navigate(['/auth/verify-otp'], {
        queryParams: { email: this.email }
      });
    },
  error: (err) => {
    this.loading = false;
    console.error('Register failed', err);
    this.errorMessage = this.extractErrorMessage(err, 'Erreur lors de la création du compte');
  }
});
  }

  private extractErrorMessage(err: any, fallback: string): string {
    const msg = err?.error?.message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg;
    }
    if (Array.isArray(msg) && msg.length) {
      return msg.join(', ');
    }
    return fallback;
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}