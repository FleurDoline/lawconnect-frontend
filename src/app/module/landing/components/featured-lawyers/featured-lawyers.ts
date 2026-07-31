import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AvocatService } from '../../../../core/services/avocat.service';
import { Avocat, StatutAvocatEnum } from '../../../../core/models/avocat.model';
import { environment } from '../../../../../environments/environment';

interface FeaturedLawyer {
  id: number;
  initials: string;
  name: string;
  rating: number;
  specialite: string;
  photo: string | null;
}

@Component({
  selector: 'app-featured-lawyers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './featured-lawyers.html',
  styleUrl: './featured-lawyers.scss'
})
export class FeaturedLawyers implements OnInit {
  lawyers: FeaturedLawyer[] = [];
  isLoading = true;
  hasError = false;

  avocat: Avocat | null = null;
  loading = true;
  error = false;
  defaultAvatar = '/images/images.jpeg';
  photoBaseUrl = environment.apiUrl.replace('/api/v1', '');
  constructor(
    private avocatService: AvocatService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFeaturedLawyers();
  }

  private loadFeaturedLawyers(): void {
    this.isLoading = true;
    this.hasError = false;

    this.avocatService.rechercher({}, 0, 20).subscribe({
      next: (response) => {
        const avocats: Avocat[] = response.content ?? [];

        this.lawyers = avocats
          .filter(a => a.statut === StatutAvocatEnum.VALIDE && a.noteMoyenne != null)
          .sort((a, b) => (b.noteMoyenne ?? 0) - (a.noteMoyenne ?? 0))
          .slice(0, 4)
          .map(a => this.toFeaturedLawyer(a));

        this.isLoading = false;
        this.cdr.detectChanges(); // force repaint regardless of zone/OnPush timing
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private toFeaturedLawyer(a: Avocat): FeaturedLawyer {
    return {
      id: a.id,
      initials: this.getInitials(a.prenom, a.nom),
      name: this.buildName(a.prenom, a.nom),
      rating: a.noteMoyenne ?? 0,
      specialite: a.specialites?.[0] ?? 'Spécialité non précisée',
      photo: a.photo ? this.photoBaseUrl + a.photo : null
    };
  }

  private buildName(prenom: string | null, nom: string | null): string {
    const parts = [prenom, nom].filter(p => p && p.trim().length > 0);
    return parts.length > 0 ? `Maître ${parts.join(' ')}` : 'Maître';
  }

  private getInitials(prenom: string | null, nom: string | null): string {
    const first = prenom?.charAt(0) ?? '';
    const last = nom?.charAt(0) ?? '';
    const initials = (first + last).toUpperCase();
    return initials || '??';
  }

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}