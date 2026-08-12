import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface DomainItem {
  icon: 'family' | 'building' | 'penal' | 'commercial' | 'travail' | 'divorce' | 'etrangers' | 'social' | 'immigration' | 'sante' | 'violences' | 'accident' | 'autre';
  title: string;
  description: string;
}

@Component({
  selector: 'app-domain',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './domain.html',
  styleUrl: './domain.scss'
})
export class Domain {
  domaines: DomainItem[] = [
  { icon: 'family', title: 'Droit de la famille', description: 'Divorce, garde et succession' },
  { icon: 'building', title: 'Droit immobilier', description: 'Baux, copropriété, transactions' },
  { icon: 'penal', title: 'Droit pénal', description: 'Défense, assistance, recours' },
  { icon: 'commercial', title: 'Droit Commercial', description: 'Contrat, sociétés et litiges' }
];

  constructor(private router: Router) {}

  goToAvocatsByDomaine(item: DomainItem): void {
    this.router.navigate(['/avocat'], {
      queryParams: { specialites: item.title }
    });
  }

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}