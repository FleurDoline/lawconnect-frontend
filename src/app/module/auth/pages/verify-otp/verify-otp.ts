import { Component, OnInit, OnDestroy, ElementRef, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.scss',
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  email = '';
  digits: string[] = ['', '', '', '', '', ''];
  loading = false;
  resending = false;
  errorMessage = '';
  successMessage = '';

  resendCooldown = 60;
  private cooldownTimer: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      } else {
        this.router.navigate(['/auth/inscription']);
      }
    });
    this.startCooldown();
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
  }

  get otpCode(): string {
    return this.digits.join('');
  }

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');

    this.digits[index] = value.slice(-1);
    input.value = this.digits[index];

    if (value && index < 5) {
      const next = this.otpInputs.toArray()[index + 1];
      next?.nativeElement.focus();
    }

    this.errorMessage = '';
    this.cdr.detectChanges();

    if (this.otpCode.length === 6) {
      this.onSubmit();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key !== 'Backspace') return;

    // On gère tout le comportement du backspace ici, en une seule pression,
    // et on empêche le navigateur de déclencher aussi un événement 'input'
    // (qui provoquerait un double traitement avec onDigitInput).
    event.preventDefault();

    const inputs = this.otpInputs.toArray();

    if (this.digits[index]) {
      // La case courante a un chiffre -> on l'efface et on reste dessus
      this.digits[index] = '';
      inputs[index].nativeElement.value = '';
    } else if (index > 0) {
      // La case courante est déjà vide -> on efface la précédente et on y va
      this.digits[index - 1] = '';
      inputs[index - 1].nativeElement.value = '';
      inputs[index - 1].nativeElement.focus();
    }

    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/[^0-9]/g, '') || '';
    if (!pasted) return;

    const chars = pasted.slice(0, 6).split('');
    chars.forEach((char, i) => (this.digits[i] = char));

    const inputs = this.otpInputs.toArray();
    chars.forEach((char, i) => {
      if (inputs[i]) inputs[i].nativeElement.value = char;
    });

    const lastIndex = Math.min(chars.length, 6) - 1;
    inputs[lastIndex]?.nativeElement.focus();

    this.cdr.detectChanges();

    if (this.otpCode.length === 6) {
      this.onSubmit();
    }
  }

  onSubmit(): void {
    if (this.otpCode.length !== 6 || this.loading) {
      return;
    }

    this.errorMessage = '';
    this.loading = true;
    this.cdr.detectChanges();

    this.authService.verifyOtp(this.email, this.otpCode).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Compte vérifié avec succès.';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.authService.redirectByRole();
        }, 800);
      },
      error: (err) => {
        this.loading = false;
        console.error('OTP verification failed', err);
        this.errorMessage = this.extractErrorMessage(err, 'Code invalide ou expiré.');
        this.digits = ['', '', '', '', '', ''];
        this.otpInputs.forEach(el => (el.nativeElement.value = ''));
        this.otpInputs.first?.nativeElement.focus();
        this.cdr.detectChanges();
      }
    });
  }

  resendCode(): void {
    if (this.resendCooldown > 0 || this.resending) return;

    this.resending = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resendOtp(this.email).subscribe({
      next: () => {
        this.resending = false;
        this.successMessage = 'Un nouveau code a été envoyé.';
        this.startCooldown();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.resending = false;
        this.errorMessage = this.extractErrorMessage(err, "Erreur lors de l'envoi du code.");
        this.cdr.detectChanges();
      }
    });
  }

  private startCooldown(): void {
    this.resendCooldown = 60;
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.cooldownTimer);
      }
      this.cdr.detectChanges();
    }, 1000);
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

  trackByIndex(index: number): number {
    return index;
  }

  goToSignup(): void {
    this.router.navigate(['/auth/inscription']);
  }
}