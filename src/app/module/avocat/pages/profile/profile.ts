import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AvocatService } from '../../../../core/services/avocat.service';
import { Avocat } from '../../../../core/models/avocat.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ContactAvocatModalComponent } from '../../../../shared/contact-avocat-modal/contact-avocat-modal';

@Component({
  selector: 'app-avocat-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ContactAvocatModalComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class AvocatProfileComponent implements OnInit {
  avocat: Avocat | null = null;
  loading = true;
  error = false;
  defaultAvatar = '/images/images.jpeg';

  modalOuvert = false;

  constructor(
    private avocatService: AvocatService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchAvocat(id);
      }
    });
  }

  private fetchAvocat(id: string): void {
    this.loading = true;
    this.error = false;

    this.avocatService.getById(id).subscribe({
      next: (res: Avocat) => {
        this.avocat = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  nomComplet(): string {
    if (!this.avocat) return '';
    return [this.avocat.prenom, this.avocat.nom].filter(Boolean).join(' ') || this.avocat.nom;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.defaultAvatar;
  }

  getStars(rating: number): ('full' | 'half' | 'empty')[] {
    const stars: ('full' | 'half' | 'empty')[] = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push('full');
      else if (rating >= i - 0.5) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  }

  onContacter(): void {
    if (!this.avocat) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url, avocatId: this.avocat.id }
      });
      return;
    }

    if (!this.authService.isClient()) {
      alert('Seuls les clients peuvent contacter un avocat.');
      return;
    }

    this.modalOuvert = true;
  }

  fermerModal(): void {
    this.modalOuvert = false;
  }
}