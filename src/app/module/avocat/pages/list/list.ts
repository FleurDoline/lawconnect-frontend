import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AvocatService } from '../../../../core/services/avocat.service';
import { Avocat, AvocatFilters } from '../../../../core/models/avocat.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ContactAvocatModalComponent } from '../../../../shared/contact-avocat-modal/contact-avocat-modal';
import { environment } from '../../../../../environments/environment';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-list-avocats',
  standalone: true,
  imports: [CommonModule, ContactAvocatModalComponent, RouterLink],
  templateUrl: './list.html',
  styleUrls: ['./list.scss']
})
export class ListeAvocatsComponent implements OnInit {
  avocats: Avocat[] = [];
  totalElements = 0;
  defaultAvatar = '/images/dupont.jpeg';
  photoBaseUrl = environment.apiUrl.replace('/api/v1', '');
  totalPages = 0;
  currentPage = 0;
  pageSize = 10;
  loading = true;
  error = false;
  filters: AvocatFilters = {};

  // ==== Modal contact ====
  modalOuvert = false;
  avocatSelectionne: Avocat | null = null;

  constructor(
    private avocatService: AvocatService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit called');
    this.route.queryParams.subscribe(params => {
      console.log('queryParams fired:', params);
      this.filters = {
        specialite: params['specialite'] || undefined,
        ville: params['ville'] || undefined,
        type: params['type'] || undefined
      };
      this.currentPage = 0;
      this.fetchAvocats();
    });
  }

  fetchAvocats(): void {
    this.loading = true;
    this.error = false;
    this.avocatService.rechercher(this.filters, this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        console.log('API response:', res);
        this.avocats = res.content;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.loading = false;
        console.log('loading set to false, avocats:', this.avocats);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('API error:', err);
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.fetchAvocats();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  nomComplet(a: Avocat): string {
    return [a.prenom, a.nom].filter(Boolean).join(' ') || a.nom;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.defaultAvatar;
  }

  // ============ STAR RATING METHODS ============
 getStars(rating: number): ('full' | 'half' | 'empty')[] {
  const stars: ('full' | 'half' | 'empty')[] = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push('full');
    else if (rating >= i - 0.5) stars.push('half');
    else stars.push('empty');
  }
  return stars;
}
  getAvisCount(a: Avocat): number {
    return (a as any).nombreAvis || (a as any).nbAvis || (a as any).nbReviews || 0;
  }

  // ============ CONTACT MODAL ============
  onContacter(a: Avocat): void {
  if (!this.authService.isLoggedIn()) {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url, avocatId: a.id }
    });
    return;
  }

  if (!this.authService.isClient()) {
    // connecté mais avocat/admin -> pas censé contacter un avocat
    alert('Seuls les clients peuvent contacter un avocat.');
    return;
  }

  this.avocatSelectionne = a;
  this.modalOuvert = true;
}

  fermerModal(): void {
    this.modalOuvert = false;
    this.avocatSelectionne = null;
  }
expandedBios = new Set<number>();

toggleBio(id: number): void {
  if (this.expandedBios.has(id)) {
    this.expandedBios.delete(id);
  } else {
    this.expandedBios.add(id);
  }
}

isBioLong(bio: string | undefined): boolean {
  return !!bio && bio.length > 140;
}
retourDashboard(): void {
  this.router.navigate(['/client/dashboard']);
}
}