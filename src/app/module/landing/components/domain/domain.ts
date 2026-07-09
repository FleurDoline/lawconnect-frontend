import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface domain {
  icon: 'family' | 'building' | 'penal' | 'commercial';
  title: string;
  description: string;
}

@Component({
  selector: 'app-domain',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './domain.html',
  styleUrl: './domain.scss'
})
export class Domain {
  domaines: domain[] = [
    {
      icon: 'family',
      title: 'Droit de Famille',
      description: 'Divorce, garde et sucession'
    },
    {
      icon: 'building',
      title: 'Immobilier',
      description: 'Baux, copropriete, transactions'
    },
    {
      icon: 'penal',
      title: 'Droit Penal',
      description: 'Defense, assistance, recours'
    },
    {
      icon: 'commercial',
      title: 'Droit Commercial',
      description: 'Contrat, societes et litiges'
    }
  ];

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}