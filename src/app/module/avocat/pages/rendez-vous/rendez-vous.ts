import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConsultationService, DemandeConsultation } from '../../../../core/services/consultation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TopbarComponent, TopbarNavItem } from '../../../../shared/components/topbar/topbar';

type ModeConsultation = 'visio' | 'telephone' | 'cabinet';
type FiltreMode = 'tout' | ModeConsultation;

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmé',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

const STATUT_CLASSES: Record<string, string> = {
  EN_ATTENTE: 'badge-warning',
  CONFIRMEE: 'badge-success',
  TERMINEE: 'badge-neutral',
  ANNULEE: 'badge-danger',
};

const MODE_LABELS: Record<string, string> = {
  visio: 'Visio',
  telephone: 'Téléphone',
  cabinet: 'Cabinet',
};

@Component({
  selector: 'app-rendez-vous',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarComponent],
  templateUrl: './rendez-vous.html',
  styleUrl: './rendez-vous.scss',
})
export class RendezVousComponent implements OnInit {
  consultations = signal<DemandeConsultation[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  searchTerm = signal('');
  filtreMode = signal<FiltreMode>('tout');
  pageActuelle = signal(1);
  readonly itemsParPage = 8;

  accepterEnCours = signal<number | null>(null);
  consultationSelectionnee = signal<DemandeConsultation | null>(null);

  statutLabels = STATUT_LABELS;
  statutClasses = STATUT_CLASSES;
  modeLabels = MODE_LABELS;

  userName = '';
  userPlan = 'AVOCAT';

  accepterApiError = signal<string | null>(null);

  navItems: TopbarNavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/avocat/dashboard' },
    { label: 'Rendez-vous',     icon: 'calendar',  route: '/avocat/rendez-vous' },
    { label: 'Messagerie',      icon: 'message', route: '/avocat/messagerie' },
    { label: 'Paiement',       icon: 'card', route: '/avocat/paiement' },
    { label: 'Paramètre',       icon: 'settings',  route: '/avocat/parametre/profil' },
    { label: 'Deconnexion',     icon: 'logout', route: '/avocat/deconnexion' },
  ];

  constructor(
    private consultationService: ConsultationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const fullName = this.authService.getFullName();
    if (fullName) {
      this.userName = fullName;
    }
    this.chargerConsultations();
  }

  onNavSelect(item: TopbarNavItem): void {
    if (item.label === 'Deconnexion') {
      this.authService.logout();
      return;
    }
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  chargerConsultations(): void {
    this.loading.set(true);
    this.consultationService.getMesDemandes().subscribe({
      next: (data) => {
        this.consultations.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les rendez-vous.');
        this.loading.set(false);
      },
    });
  }

  filtrees = computed(() => {
    const terme = this.searchTerm().trim().toLowerCase();
    const mode = this.filtreMode();

    return this.consultations().filter((c) => {
      const matchMode = mode === 'tout' || c.modeConsultation === mode;
      const matchTerme =
        !terme ||
        c.nomComplet.toLowerCase().includes(terme) ||
        c.mission?.toLowerCase().includes(terme);
      return matchMode && matchTerme;
    });
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtrees().length / this.itemsParPage))
  );

  consultationsPage = computed(() => {
    const start = (this.pageActuelle() - 1) * this.itemsParPage;
    return this.filtrees().slice(start, start + this.itemsParPage);
  });

  setFiltre(mode: FiltreMode): void {
    this.filtreMode.set(mode);
    this.pageActuelle.set(1);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.pageActuelle.set(1);
  }

  pagePrecedente(): void {
    if (this.pageActuelle() > 1) this.pageActuelle.update((p) => p - 1);
  }

  pageSuivante(): void {
    if (this.pageActuelle() < this.totalPages()) this.pageActuelle.update((p) => p + 1);
  }

  allerAPage(p: number): void {
    this.pageActuelle.set(p);
  }
  

  accepterEtFermer(id: number): void {
     this.accepterApiError.set(null);
     this.accepterEnCours.set(id);

     this.consultationService.accepterDemande(id).subscribe({
    next: () => {
      this.consultations.update((list) =>
        list.map((c) => (c.id === id ? { ...c, statut: 'CONFIRMEE' } : c))
      );
      this.accepterEnCours.set(null);
      this.fermerDetails();
    },
       error: (err) => {
        this.accepterEnCours.set(null);
        this.accepterApiError.set(
         err?.error?.message ?? "Impossible d'accepter cette demande. Veuillez réessayer."
        );
      },
   });
  }
  numRdv(index: number): string {
    const globalIndex = (this.pageActuelle() - 1) * this.itemsParPage + index + 1;
    return `RDV-${String(globalIndex).padStart(3, '0')}`;
  }

  initiales(nomComplet: string): string {
    return nomComplet
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0].toUpperCase())
      .join('');
  }

  accepter(id: number, event: Event): void {
    event.stopPropagation();
    this.accepterEnCours.set(id);
    this.consultationService.accepterDemande(id).subscribe({
      next: () => {
        this.consultations.update((list) =>
          list.map((c) => (c.id === id ? { ...c, statut: 'CONFIRMEE' } : c))
        );
        this.accepterEnCours.set(null);
      },
      error: () => {
        this.accepterEnCours.set(null);
        this.error.set("Impossible d'accepter la demande.");
      },
    });
  }

  ouvrirDetails(c: DemandeConsultation): void {
    this.consultationSelectionnee.set(c);
  }

  fermerDetails(): void {
    this.consultationSelectionnee.set(null);
  }

  rejoindre(c: DemandeConsultation, event: Event): void {
    event.stopPropagation();
    // TODO: brancher sur le composant modal partagé "Rejoindre" existant
    console.log('Rejoindre', c.id);
  }
}