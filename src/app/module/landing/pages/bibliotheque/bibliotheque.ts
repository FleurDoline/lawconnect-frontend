import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  RessourceJuridiqueService,
  RessourceJuridique
} from '../../../../core/services/ressource-juridique.service';

@Component({
  selector: 'app-bibliotheque-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './bibliotheque.html',
  styleUrl: './bibliotheque.scss'
})
export class BibliothequePage implements OnInit {
  ressources: RessourceJuridique[] = [];
  loading = true;
  loadError = false;

  pageNumber = 0;
  pageSize = 12;
  totalPages = 0;
  totalElements = 0;

  private readonly colorPalette: Array<'navy' | 'blue' | 'gold' | 'coral'> = ['navy', 'blue', 'gold', 'coral'];

  constructor(
    private router: Router,
    private ressourceService: RessourceJuridiqueService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerRessources();
  }

  private chargerRessources(): void {
    this.loading = true;
    this.loadError = false;

    this.ressourceService.getAll(undefined, this.pageNumber, this.pageSize).subscribe({
      next: (res) => {
        this.ressources = res.content;
        this.totalPages = res.totalPages;
        this.totalElements = res.totalElements;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement bibliothèque:', err);
        this.ressources = [];
        this.loading = false;
        this.loadError = true;
        this.cdr.detectChanges();
      },
    });
  }

  colorFor(index: number): string {
    return this.colorPalette[index % this.colorPalette.length];
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.pageNumber) {
      return;
    }
    this.pageNumber = page;
    this.chargerRessources();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onReadExtract(ressource: RessourceJuridique): void {
    const url = this.ressourceService.getFichierUrl(ressource.cheminFichier);
    window.open(url, '_blank');
  }
}