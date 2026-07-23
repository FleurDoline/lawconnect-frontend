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
  role: 'CLIENT' | 'AVOCAT' = 'CLIENT';
  roleLockedByUrl = false;

  private readonly GOOGLE_CLIENT_ID = '281235908564-cj79femv17cdimi678nrur62qr09scik.apps.googleusercontent.com';

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
    this.loading = true;
    this.authService.googleLogin(response.credential, this.role).subscribe({
      next: () => {
        this.loading = false;
        this.authService.redirectByRole();
      },
      error: (err) => {
        this.loading = false;
        console.error('Google signup failed', err);
        alert(err?.error?.message || 'Erreur lors de la connexion avec Google');
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.prenom || !this.nom || !this.email || !this.password || !this.confirmPassword) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (this.password !== this.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    if (!this.acceptTerms) {
      alert('Veuillez accepter les conditions d\'utilisation');
      return;
    }

    this.loading = true;

    this.authService.register({
      fullName: `${this.prenom} ${this.nom}`,
      email: this.email,
      password: this.password,
      role: this.role
    }).subscribe({
      next: () => {
        this.loading = false;
        this.authService.redirectByRole();
      },
      error: (err) => {
        this.loading = false;
        console.error('Register failed', err);
        alert(err?.error?.message || 'Erreur lors de la création du compte');
      }
    });
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}