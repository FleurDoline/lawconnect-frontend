/*import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export type ConsultationMode = 'Visio' | 'Telephone' | 'Cabinet';
export type ConsultationStatut = 'Confirme' | 'En attente' | 'Nouveau' | 'Termine' | 'Annule';

export interface Consultation {
  id: string;
  date: string;        // display value e.g. '15 Juin'
  heure: string;        // e.g. '09:00'
  avocatNom: string;
  avocatInitiales: string;
  specialite: string;
  mode: ConsultationMode;
  statut: ConsultationStatut;
  isUpcoming: boolean;
}

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.scss']
})
export class ConsultationComponent implements OnInit {

  activeTab: 'upcoming' | 'past' = 'upcoming';

  currentPage = 1;
  totalPages = 3;
  pageSize = 5;

  // TODO: replace with data from a ConsultationService (HTTP call to backend)
  consultations: Consultation[] = [
    {
      id: 'c-001',
      date: '15 Juin',
      heure: '09:00',
      avocatNom: 'Jean Dupont',
      avocatInitiales: 'JD',
      specialite: 'Immobilier',
      mode: 'Visio',
      statut: 'Confirme',
      isUpcoming: true
    },
    {
      id: 'c-002',
      date: '18 Juin',
      heure: '10:30',
      avocatNom: 'Sarah Cohen',
      avocatInitiales: 'SC',
      specialite: 'Travail',
      mode: 'Telephone',
      statut: 'En attente',
      isUpcoming: true
    },
    {
      id: 'c-003',
      date: '25 Juin',
      heure: '14:30',
      avocatNom: 'Thomas Durand',
      avocatInitiales: 'TD',
      specialite: 'Famille',
      mode: 'Cabinet',
      statut: 'Nouveau',
      isUpcoming: true
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // TODO: this.loadConsultations(this.activeTab, this.currentPage);
  }

  get filteredConsultations(): Consultation[] {
    return this.consultations.filter(c =>
      this.activeTab === 'upcoming' ? c.isUpcoming : !c.isUpcoming
    );
  }

  selectTab(tab: 'upcoming' | 'past'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    // TODO: this.loadConsultations(tab, 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) { return; }
    this.currentPage = page;
    // TODO: this.loadConsultations(this.activeTab, page);
  }

  statutClass(statut: ConsultationStatut): string {
    switch (statut) {
      case 'Confirme': return 'badge badge--confirme';
      case 'En attente': return 'badge badge--attente';
      case 'Nouveau': return 'badge badge--nouveau';
      case 'Termine': return 'badge badge--termine';
      case 'Annule': return 'badge badge--annule';
      default: return 'badge';
    }
  }

  modeIcon(mode: ConsultationMode): string {
    switch (mode) {
      case 'Visio': return '#i-video';
      case 'Telephone': return '#i-phone';
      case 'Cabinet': return '#i-building';
      default: return '#i-info';
    }
  }

  actionLabel(consultation: Consultation): string {
    if (!consultation.isUpcoming) { return 'Detail'; }
    return consultation.statut === 'Confirme' ? 'Rejoindre' : 'Detail';
  }

  onAction(consultation: Consultation): void {
    if (consultation.isUpcoming && consultation.statut === 'Confirme') {
      // TODO: hook into your Visio/Telephone join flow
      console.log('Rejoindre la consultation', consultation.id);
      return;
    }
    this.router.navigate(['/client/consultations', consultation.id]);
  }

  openNouvelleConsultation(): void {
    // TODO: navigate to avocat search ("Trouver un Avocat") or open booking modal
    this.router.navigate(['/client/dashboard'], { queryParams: { action: 'trouver-avocat' } });
  }
}*/