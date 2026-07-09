import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service'; // match your login.ts path

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class SignupComponent implements OnInit {
  prenom = '';
  nom = '';
  email = '';
  password = '';
  confirmPassword = '';
  acceptTerms = false;
  showPassword = false;
  loading = false;
  role: 'CLIENT' | 'AVOCAT' = 'CLIENT';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['role'] === 'avocat') {
        this.role = 'AVOCAT';
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

  onGoogleSignup(): void {
    console.log('Google signup');
    this.router.navigate(['/']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}