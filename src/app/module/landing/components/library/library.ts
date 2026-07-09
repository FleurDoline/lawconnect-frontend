import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface Book {
  id: number;
  category: string;
  title: string;
  author: string;
  description: string;
  colorVariant: 'navy' | 'blue' | 'gold' | 'coral';
  extractUrl?: string;
}

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './library.html',
  styleUrls: ['./library.scss'],
})
export class LibraryComponent {

  books: Book[] = [
    {
      id: 1,
      category: 'Droit Civil',
      title: 'Code civil annoté',
      author: 'Editions Dalloz',
      description: "L'ouvrage de référence, mis à jour avec la jurisprudence récente",
      colorVariant: 'navy',
    },
    {
      id: 2,
      category: 'Famille',
      title: 'Le divorce en pratique',
      author: 'Mme Sophie Garnier',
      description: 'Procédure, conséquences patrimoniales et garde des enfants',
      colorVariant: 'blue',
    },
    {
      id: 3,
      category: 'Affaires',
      title: 'Droit des sociétés',
      author: 'P. Merle, A. Fauchon',
      description: 'Création, gouvernance et fiscalité des entreprises',
      colorVariant: 'gold',
    },
    {
      id: 4,
      category: 'Travail',
      title: 'Manuel du contrat de travail',
      author: 'LexisNexis',
      description: 'Modèles et clauses commentées pour employeurs et salariés',
      colorVariant: 'navy',
    },
    {
      id: 5,
      category: 'Immobilier',
      title: "Baux d'habitation",
      author: 'Mr. Henri Vasser',
      description: 'Rédaction, contentieux et nouvelles obligations énergétiques',
      colorVariant: 'blue',
    },
    {
      id: 6,
      category: 'Pénal',
      title: 'Procédure Pénale expliquée',
      author: 'Prof M. Lenfac',
      description: "Garde à vue, instruction & audience : connaître vos droits",
      colorVariant: 'coral',
    },
  ];

  constructor(private router: Router) {}

  onViewLibrary(): void {
    this.router.navigate(['/bibliotheque']);
  }

  onReadExtract(book: Book): void {
    if (book.extractUrl) {
      window.open(book.extractUrl, '_blank');
    } else {
      this.router.navigate(['/bibliotheque', book.id]);
    }
  }

  onCreateAccount(): void {
    this.router.navigate(['/auth/inscription']);
  }

  onLawyerSpace(): void {
    this.router.navigate(['/avocat/login']);
  }
}