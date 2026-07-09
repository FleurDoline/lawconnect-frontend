import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-modal.html',
  styleUrls: ['./search-modal.scss']
})
export class SearchModalComponent {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  selectedSpecialite: string | null = null;
  selectedVille = '';
  selectedType = '';
  description = '';

  specialites = [
    { label: 'Droit des affaires', value: 'droit des affaires' },
    { label: 'Droit de la famille', value: 'droit de la famille' },
    { label: 'Droit pénal', value: 'droit pénal' },
    { label: 'Immobilier', value: 'droit immobilier' },
    { label: 'Droit du travail', value: 'droit du travail' },
    { label: 'Divorce', value: 'divorce' },
    { label: 'Droit des étrangers', value: 'droit des étrangers' },
    { label: 'Droit social', value: 'droit social' },
    { label: 'Immigration', value: 'immigration' },
    { label: 'Droit de la santé', value: 'droit de la santé' },
    { label: 'Violences conjugales', value: 'violences conjugales' },
    { label: 'Accident de la route', value: 'accident de la route' },
    { label: 'Autre', value: 'autre' },
  ];

  villes = ['Yaoundé', 'Douala', 'Bafoussam', 'Garoua', 'Maroua'];
  types = ['Consultation', 'Rédaction de contrat', 'Représentation', 'Conseil juridique'];

  constructor(private router: Router) {}

  toggleSpecialite(value: string): void {
    this.selectedSpecialite = this.selectedSpecialite === value ? null : value;
  }

  isSelected(value: string): boolean {
    return this.selectedSpecialite === value;
  }

  close() {
    this.closed.emit();
  }

  closeOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }

  rechercher() {
    const params: any = {};
    if (this.selectedSpecialite) {
      params['specialites'] = this.selectedSpecialite;
    }
    if (this.selectedVille) params['ville'] = this.selectedVille;
    if (this.selectedType) params['type'] = this.selectedType;
    this.router.navigate(['/avocat'], { queryParams: params });
    this.close();
  }
}