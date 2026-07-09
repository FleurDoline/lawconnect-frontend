import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Lawyer {
  id: number;
  initials: string;
  name: string;
  rating: number;
  specialite: string;
  avis: number;
}

@Component({
  selector: 'app-featured-lawyers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './featured-lawyers.html',
  styleUrl: './featured-lawyers.scss'
})
export class FeaturedLawyers {
  lawyers: Lawyer[] = [
    {
      id: 1,
      initials: 'AV',
      name: 'Maitre Aicha Vance',
      rating: 4.9,
      specialite: 'Droit de famille',
      avis: 128
    },
    {
      id: 2,
      initials: 'TD',
      name: 'Maitre Thomas Durand',
      rating: 4.8,
      specialite: 'Droit de commercial',
      avis: 92
    },
    {
      id: 3,
      initials: 'NP',
      name: 'Maitre Nathalie Petit',
      rating: 5.0,
      specialite: 'Droit de immobilier',
      avis: 76
    },
    {
      id: 4,
      initials: 'SC',
      name: 'Maitre Sarah Cohen',
      rating: 3.9,
      specialite: 'Droit penal',
      avis: 100
    }
  ];

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}