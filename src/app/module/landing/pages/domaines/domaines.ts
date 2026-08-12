import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

interface DomainItem {
  icon: 'family' | 'building' | 'penal' | 'commercial' | 'travail' | 'divorce' | 'etrangers' | 'social' | 'immigration' | 'sante' | 'violences' | 'accident' | 'autre';
  title: string;
  description: string;
}

@Component({
  selector: 'app-domaines-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './domaines.html',
  styleUrl: './domaines.scss'
})
export class DomainesPage {
  allDomaines: DomainItem[] = [
    { icon: 'commercial', title: 'Droit des Affaires', description: 'Création d\'entreprise, contrats commerciaux' },
    { icon: 'family', title: 'Droit de la Famille', description: 'Divorce, garde et succession' },
    { icon: 'penal', title: 'Droit Pénal', description: 'Défense, assistance, recours' },
    { icon: 'building', title: 'Droit immobilier', description: 'Baux, copropriété, transactions' },
    { icon: 'travail', title: 'Droit du Travail', description: 'Contrats, licenciements, litiges salariaux' },
    { icon: 'divorce', title: 'Divorce', description: 'Procédures, garde d\'enfants, partage des biens' },
    { icon: 'etrangers', title: 'Droit des Étrangers', description: 'Titres de séjour, naturalisation, recours' },
    { icon: 'social', title: 'Droit Social', description: 'Relations collectives, sécurité sociale' },
    { icon: 'immigration', title: 'Immigration', description: 'Visas, régularisation, démarches administratives' },
    { icon: 'sante', title: 'Droit de la Santé', description: 'Responsabilité médicale, litiges hospitaliers' },
    { icon: 'violences', title: 'Violences Conjugales', description: 'Protection, plaintes, accompagnement juridique' },
    { icon: 'accident', title: 'Accident de la Route', description: 'Indemnisation, responsabilité, recours assurance' },
    { icon: 'autre', title: 'Autre', description: 'Besoin juridique non listé ci-dessus' }
  ];

  constructor(private router: Router) {}

  goToAvocatsByDomaine(item: DomainItem): void {
    this.router.navigate(['/avocat'], {
      queryParams: { specialites: item.title }
    });
  }
}