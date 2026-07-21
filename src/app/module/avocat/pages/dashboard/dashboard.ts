import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, HostListener, ElementRef, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import {
  ConsultationService,
  DemandeConsultation,
  ConsultationAcceptRequest,
} from '../../../../core/services/consultation.service';
import { Router } from '@angular/router';

interface Appointment {
  id: number;
  dayLabel: string;
  time: string;
  name: string;
  matter: string;
  type: string;
  canJoin: boolean;
}

interface NavItem {
  label: string;
  icon: string;
  route?: string;
}

interface NouveauDossier {
  clientNom: string;
  typeAffaire: string;
  description: string;
  date: string;
  heure: string;
  mode: 'visioconférence' | 'présentiel' | '';
}

interface AcceptForm {
  date: string;
  heure: string;
  mode: 'visio' | 'telephone' | 'cabinet' | '';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit {
  lawyerName = 'Maître';
  userName = '';
  userPlan = 'CLIENT PREMIUM';
  menuOpen = false;

  stats = {
    revenue: '12 450,00 Fcfa',
    consultations: 42,
    rating: 4.9,
  };

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard' , route: '/avocat/dashboard'},
    { label: 'Rendez-vous',    icon: 'calendar' },
    { label: 'Messagerie',     icon: 'message' },
    { label: 'Paiement',       icon: 'card' },
    { label: 'Paramètre',      icon: 'settings', route: '/avocat/parametre/profil'},
    { label: 'Deconnexion',    icon: 'logout' },
  ];

  // Raw data from backend, kept so the detail modal can look up full info by id
  demandes: DemandeConsultation[] = [];

  appointments: Appointment[] = [];
  appointmentsLoading = true;
  appointmentsError = false;

  availabilities = [
    { day: 'Lun', hours: '09h-18h' },
    { day: 'Mar', hours: '09h-18h' },
    { day: 'Mer', hours: '09h-12h' },
    { day: 'Jeu', hours: '09h-18h' },
    { day: 'Ven', hours: '09h-12h' },
  ];

  // ---- Nouveau dossier modal state ----
  showDossierModal = false;
  dossierSubmitting = false;
  dossierErrors: Partial<Record<keyof NouveauDossier, string>> = {};

  dossier: NouveauDossier = {
    clientNom: '',
    typeAffaire: '',
    description: '',
    date: '',
    heure: '',
    mode: '',
  };

  affaireTypes = [
    'Litige immobilier',
    'Droit commercial',
    'Droit de la famille',
    'Droit du travail',
    'Droit pénal',
    'Autre',
  ];

  // ---- Détails / Accepter modal state ----
  showDetailModal = false;
  selectedDemande: DemandeConsultation | null = null;
  acceptForm: AcceptForm = { date: '', heure: '', mode: '' };
  acceptErrors: Partial<Record<keyof AcceptForm, string>> = {};
  acceptSubmitting = false;
  acceptApiError = '';

  constructor(
    private host: ElementRef,
    private authService: AuthService,
    private consultationService: ConsultationService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    const fullName = this.authService.getFullName();
    if (fullName) {
      this.lawyerName = `Maître ${fullName}`;
      this.userName = fullName;
    }
    this.cdr.detectChanges();

    this.loadProchainRendezVous();
  }

  private loadProchainRendezVous(): void {
    this.appointmentsLoading = true;
    this.appointmentsError = false;

    this.consultationService.getMesDemandes().subscribe({
      next: (demandes) => {
        this.demandes = demandes;
        this.appointments = demandes
          .filter((d) => d.statut === 'EN_ATTENTE')
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 4)
          .map((d) => this.toAppointment(d));
        this.appointmentsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des demandes de consultation', err);
        this.demandes = [];
        this.appointments = [];
        this.appointmentsLoading = false;
        this.appointmentsError = true;
        this.cdr.detectChanges();
      },
    });
  }

  private toAppointment(d: DemandeConsultation): Appointment {
    const created = new Date(d.createdAt);
    return {
      id: d.id,
      dayLabel: this.formatDayLabel(created),
      time: this.formatTime(created),
      name: d.nomComplet,
      matter: d.mission || d.typePersonne || 'Consultation',
      type: '',
      canJoin: false,
    };
  }

  private formatDayLabel(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (isSameDay(date, today)) return "Aujourd'hui";
    if (isSameDay(date, yesterday)) return 'Hier';

    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  get todayIso(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  toggleMenu(e: MouseEvent) {
    e.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  selectNav(item: NavItem) {
  this.menuOpen = false;

  if (item.label === 'Deconnexion') {
    this.authService.logout();
    return;
  }

  if (item.route) {
    this.router.navigate([item.route]);
  }
}
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.host.nativeElement.contains(e.target)) this.menuOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showDossierModal) this.closeDossierModal();
    if (this.showDetailModal) this.closeDetailModal();
  }

  onJoin(a: Appointment) { console.log('Rejoindre', a); }

  onDetails(a: Appointment) {
    const demande = this.demandes.find((d) => d.id === a.id);
    if (!demande) return;

    this.selectedDemande = demande;
    this.acceptForm = { date: '', heure: '', mode: '' };
    this.acceptErrors = {};
    this.acceptApiError = '';
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedDemande = null;
    this.acceptErrors = {};
    this.acceptApiError = '';
  }

  private validateAccept(): boolean {
    const errors: typeof this.acceptErrors = {};

    if (!this.acceptForm.date) {
      errors.date = 'La date est requise.';
    } else if (this.acceptForm.date < this.todayIso) {
      errors.date = 'La date ne peut pas être dans le passé.';
    }

    if (!this.acceptForm.heure) {
      errors.heure = "L'heure est requise.";
    } else if (this.acceptForm.date === this.todayIso) {
      const now = new Date();
      const nowHm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (this.acceptForm.heure < nowHm) {
        errors.heure = "L'heure ne peut pas être dans le passé.";
      }
    }

    if (!this.acceptForm.mode) errors.mode = 'Le mode de consultation est requis.';

    this.acceptErrors = errors;
    return Object.keys(errors).length === 0;
  }

  accepterDemande(): void {
    if (!this.selectedDemande) return;
    if (!this.validateAccept()) return;

    this.acceptSubmitting = true;
    this.acceptApiError = '';

    const payload: ConsultationAcceptRequest = {
      dateRendezVous: `${this.acceptForm.date}T${this.acceptForm.heure}:00`,
      modeConsultation: this.acceptForm.mode as 'visio' | 'telephone' | 'cabinet',
    };

    this.consultationService.accepterDemande(this.selectedDemande.id, payload).subscribe({
      next: () => {
        this.acceptSubmitting = false;
        this.closeDetailModal();
        this.loadProchainRendezVous(); // refresh — the accepted one is no longer EN_ATTENTE
      },
      error: (err) => {
        console.error("Erreur lors de l'acceptation de la consultation", err);
        this.acceptSubmitting = false;
        this.acceptApiError = "Impossible de confirmer ce rendez-vous. Veuillez réessayer.";
        this.cdr.detectChanges();
      },
    });
  }

  // ---- Nouveau dossier modal actions ----
  onNewDossier() {
    this.showDossierModal = true;
  }

  closeDossierModal() {
    this.showDossierModal = false;
    this.dossierErrors = {};
    this.dossier = {
      clientNom: '',
      typeAffaire: '',
      description: '',
      date: '',
      heure: '',
      mode: '',
    };
  }

  private validateDossier(): boolean {
    const errors: typeof this.dossierErrors = {};
    if (!this.dossier.clientNom.trim()) errors.clientNom = 'Le nom du client est requis.';
    if (!this.dossier.typeAffaire) errors.typeAffaire = "Le type d'affaire est requis.";

    if (!this.dossier.date) {
      errors.date = 'La date est requise.';
    } else if (this.dossier.date < this.todayIso) {
      errors.date = 'La date ne peut pas être dans le passé.';
    }

    if (!this.dossier.heure) {
      errors.heure = "L'heure est requise.";
    } else if (this.dossier.date === this.todayIso) {
      const now = new Date();
      const nowHm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (this.dossier.heure < nowHm) {
        errors.heure = "L'heure ne peut pas être dans le passé.";
      }
    }

    if (!this.dossier.mode) errors.mode = 'Le mode de consultation est requis.';
    this.dossierErrors = errors;
    return Object.keys(errors).length === 0;
  }

  submitDossier() {
    if (!this.validateDossier()) return;

    this.dossierSubmitting = true;
    setTimeout(() => {
      console.log('Nouveau dossier créé', this.dossier);
      this.dossierSubmitting = false;
      this.closeDossierModal();
      this.cdr.detectChanges();
    }, 600);
  }
}