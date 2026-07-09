import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, HostListener, ElementRef } from '@angular/core';

interface Appointment {
  dayLabel: string;
  time: string;
  name: string;
  matter: string;
  type: string;
  canJoin: boolean;
}

interface NavItem {
  label: string;
  icon: string; // key into iconPaths
}

interface NouveauDossier {
  clientNom: string;
  typeAffaire: string;
  description: string;
  date: string;
  heure: string;
  mode: 'visioconférence' | 'présentiel' | '';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent {
  lawyerName = 'Maître Jean Dupont';
  userName = 'Jean Dupont';
  userPlan = 'CLIENT PREMIUM';
  menuOpen = false;

  stats = {
    revenue: '12 450,00 Fcfa',
    consultations: 42,
    rating: 4.9,
  };

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard' },
    { label: 'Rendez-vous',    icon: 'calendar' },
    { label: 'Messagerie',     icon: 'message' },
    { label: 'Paiement',       icon: 'card' },
    { label: 'Paramètre',      icon: 'settings' },
    { label: 'Deconnexion',    icon: 'logout' },
  ];

  appointments: Appointment[] = [
    { dayLabel: "Aujourd'hui", time: '14:30', name: 'Jean Luc Dupont',
      matter: 'litige immobilier', type: 'visioconférence', canJoin: true },
    { dayLabel: "Aujourd'hui", time: '16:00', name: 'Cabinet S.A.R.L Rossi',
      matter: 'Droit commercial . Presidentiel', type: '', canJoin: true },
    { dayLabel: 'Demain', time: '09:00', name: 'Elodie Martin',
      matter: 'Droite de Famille', type: 'visioconférence', canJoin: false },
  ];

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

  constructor(private host: ElementRef) {}

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
    console.log('Navigate to', item.label);
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.host.nativeElement.contains(e.target)) this.menuOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showDossierModal) this.closeDossierModal();
  }

  onJoin(a: Appointment) { console.log('Rejoindre', a); }
  onDetails(a: Appointment) { console.log('Details', a); }

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
    // TODO: replace with actual API call, e.g. this.dossierService.create(this.dossier)
    setTimeout(() => {
      console.log('Nouveau dossier créé', this.dossier);
      this.dossierSubmitting = false;
      this.closeDossierModal();
    }, 600);
  }
}