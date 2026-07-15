import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TopbarComponent, TopbarNavItem } from '../../../../shared/components/topbar/topbar';

type ConsultationStatut = 'CONFIRMEE' | 'EN_ATTENTE' | 'NOUVEAU' | 'TERMINEE' | 'ANNULEE';
type ConsultationMode = 'visio' | 'telephone' | 'cabinet';

interface ConsultationRow {
  id: number;
  date: string;
  heure: string;
  avocatNom: string;
  avocatInitiales: string;
  avatarColor: string;
  specialite: string;
  mode: ConsultationMode;
  statut: ConsultationStatut;
  isPast: boolean;
}

interface AvocatOption {
  id: number;
  nom: string;
  initiales: string;
  color: string;
  specialite: string;
}

interface NouvelleConsultationForm {
  avocatId: number | null;
  date: string;
  heure: string;
  mode: ConsultationMode | '';
  description: string;
}

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarComponent],
  templateUrl: './consultations.html',
  styleUrls: ['./consultations.scss'],
})
export class ConsultationsComponent implements OnInit {

  clientNom = '';

  navItems: TopbarNavItem[] = [
    { label: 'Dashboard',    icon: 'dashboard', route: '/client/dashboard' },
    { label: 'Mes dossiers', icon: 'folder',    route: '/client/dossiers' },
    { label: 'Consultation', icon: 'calendar',  route: '/client/consultations' },
    { label: 'Paramètre',    icon: 'settings',  route: '/client/parametres' },
    { label: 'Deconnexion',  icon: 'logout' },
  ];

  activeTab: 'avenir' | 'passees' = 'avenir';
  pageSize = 3;
  currentPage = 1;
  loading = true;

  private allConsultations: ConsultationRow[] = [];

  // ---- avocats available for booking (mock; replace with a real service call) ----
  avocats: AvocatOption[] = [
    { id: 1, nom: 'Jean Dupont',    initiales: 'JD', color: '#2f5fd6', specialite: 'Immobilier' },
    { id: 2, nom: 'Sarah Cohen',    initiales: 'SC', color: '#2f9e5f', specialite: 'Travail' },
    { id: 3, nom: 'Thomas Durand',  initiales: 'TD', color: '#8a6d1f', specialite: 'Famille' },
    { id: 4, nom: 'Elodie Martin',  initiales: 'EM', color: '#7a3fbf', specialite: 'Famille' },
    { id: 5, nom: 'Marc Nguyen',    initiales: 'MN', color: '#c0392b', specialite: 'Pénal' },
  ];

  // ---- Nouvelle consultation modal state ----
  showNouvelleModal = false;
  submitting = false;
  errors: Partial<Record<keyof NouvelleConsultationForm, string>> = {};

  form: NouvelleConsultationForm = {
    avocatId: null,
    date: '',
    heure: '',
    mode: '',
    description: '',
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.clientNom = this.authService.getFullName() || 'Client';

    // TODO: swap for this.consultationService.getMesConsultations().subscribe(...)
    setTimeout(() => {
      this.allConsultations = this.mockData();
      this.loading = false;
      this.cdr.detectChanges();
    }, 300);
  }

  onNavSelect(item: TopbarNavItem): void {
    if (item.label === 'Deconnexion') {
      this.authService.logout(); // adjust to your actual AuthService method
      this.router.navigate(['/login']);
      return;
    }
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  private mockData(): ConsultationRow[] {
    return [
      { id: 1, date: '15 Juin', heure: '09:00', avocatNom: 'Jean Dupont', avocatInitiales: 'JD', avatarColor: '#2f5fd6', specialite: 'Immobilier', mode: 'visio', statut: 'CONFIRMEE', isPast: false },
      { id: 2, date: '18 juin', heure: '10:30', avocatNom: 'Sarah Cohen', avocatInitiales: 'SC', avatarColor: '#2f9e5f', specialite: 'Travail', mode: 'telephone', statut: 'EN_ATTENTE', isPast: false },
      { id: 3, date: '25 juin', heure: '14:30', avocatNom: 'Thomas Durand', avocatInitiales: 'TD', avatarColor: '#8a6d1f', specialite: 'Famille', mode: 'cabinet', statut: 'NOUVEAU', isPast: false },
      { id: 4, date: '2 juin', heure: '11:00', avocatNom: 'Elodie Martin', avocatInitiales: 'EM', avatarColor: '#7a3fbf', specialite: 'Famille', mode: 'visio', statut: 'TERMINEE', isPast: true },
      { id: 5, date: '28 mai', heure: '16:00', avocatNom: 'Marc Nguyen', avocatInitiales: 'MN', avatarColor: '#c0392b', specialite: 'Pénal', mode: 'cabinet', statut: 'ANNULEE', isPast: true },
    ];
  }

  get filtered(): ConsultationRow[] {
    return this.allConsultations.filter(c => this.activeTab === 'avenir' ? !c.isPast : c.isPast);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get pagedConsultations(): ConsultationRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  setTab(tab: 'avenir' | 'passees'): void {
    this.activeTab = tab;
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  statutLabel(statut: ConsultationStatut): string {
    const labels: Record<ConsultationStatut, string> = {
      CONFIRMEE: 'Confirmé',
      EN_ATTENTE: 'En attente',
      NOUVEAU: 'Nouveau',
      TERMINEE: 'Terminée',
      ANNULEE: 'Annulée',
    };
    return labels[statut];
  }

  modeLabel(mode: ConsultationMode): string {
    const labels: Record<ConsultationMode, string> = {
      visio: 'Visio',
      telephone: 'Téléphone',
      cabinet: 'Cabinet',
    };
    return labels[mode];
  }

  modeIcon(mode: ConsultationMode): string {
    return mode === 'visio' ? 'video' : mode === 'telephone' ? 'phone' : 'building';
  }

  canJoin(c: ConsultationRow): boolean {
    return c.mode === 'visio' && c.statut === 'CONFIRMEE';
  }

  rejoindre(c: ConsultationRow): void {
    this.router.navigate(['/client/consultation', c.id]);
  }

  detail(c: ConsultationRow): void {
    this.router.navigate(['/client/consultations', c.id]);
  }

  get todayIso(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // ---- Nouvelle consultation modal actions ----
  nouvelleConsultation(): void {
    this.showNouvelleModal = true;
  }

  closeNouvelleModal(): void {
    this.showNouvelleModal = false;
    this.errors = {};
    this.form = { avocatId: null, date: '', heure: '', mode: '', description: '' };
  }

  private validateForm(): boolean {
    const errors: typeof this.errors = {};

    if (!this.form.avocatId) errors.avocatId = 'Veuillez sélectionner un avocat.';

    if (!this.form.date) {
      errors.date = 'La date est requise.';
    } else if (this.form.date < this.todayIso) {
      errors.date = 'La date ne peut pas être dans le passé.';
    }

    if (!this.form.heure) {
      errors.heure = "L'heure est requise.";
    } else if (this.form.date === this.todayIso) {
      const now = new Date();
      const nowHm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (this.form.heure < nowHm) errors.heure = "L'heure ne peut pas être dans le passé.";
    }

    if (!this.form.mode) errors.mode = 'Le mode de consultation est requis.';

    this.errors = errors;
    return Object.keys(errors).length === 0;
  }

  private formatDateLabel(iso: string): string {
    const [y, m, d] = iso.split('-');
    const mois = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
    return `${parseInt(d, 10)} ${mois[parseInt(m, 10) - 1]}`;
  }

  submitNouvelleConsultation(): void {
    if (!this.validateForm()) return;

    const avocat = this.avocats.find(a => a.id === this.form.avocatId);
    if (!avocat) return;

    this.submitting = true;

    // TODO: replace with this.consultationService.create(this.form).subscribe(...)
    setTimeout(() => {
      const nextId = Math.max(0, ...this.allConsultations.map(c => c.id)) + 1;

      const newRow: ConsultationRow = {
        id: nextId,
        date: this.formatDateLabel(this.form.date),
        heure: this.form.heure,
        avocatNom: avocat.nom,
        avocatInitiales: avocat.initiales,
        avatarColor: avocat.color,
        specialite: avocat.specialite,
        mode: this.form.mode as ConsultationMode,
        statut: 'NOUVEAU',
        isPast: false,
      };

      this.allConsultations = [newRow, ...this.allConsultations];
      this.activeTab = 'avenir';
      this.currentPage = 1;
      this.submitting = false;
      this.closeNouvelleModal();
      this.cdr.detectChanges();
    }, 500);
  }
}