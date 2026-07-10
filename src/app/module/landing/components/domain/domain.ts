import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
    { icon: 'family', title: 'Droit de Famille', description: 'Divorce, garde et succession' },
    { icon: 'building', title: 'Immobilier', description: 'Baux, copropriété, transactions' },
    { icon: 'penal', title: 'Droit Pénal', description: 'Défense, assistance, recours' },
    { icon: 'commercial', title: 'Droit Commercial', description: 'Contrat, sociétés et litiges' }
  ];

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}