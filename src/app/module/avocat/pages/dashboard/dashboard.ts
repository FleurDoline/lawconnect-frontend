import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import {
  ConsultationService,
  DemandeConsultation,
} from '../../../../core/services/consultation.service';
import { Router, RouterLink } from '@angular/router';
import { DisponibiliteService, Disponibilite } from '../../../../core/services/disponibilite.service';
import { environment } from '../../../../../environments/environment';
import { AvocatService } from '../../../../core/services/avocat.service';
import { AbonnementService, Abonnement, FormuleAbonnement } from '../../../../core/services/abonnement.service';
import { TopbarComponent, TopbarNavItem } from '../../../../shared/components/topbar/topbar';

interface Appointment {
  id: number;
  dayLabel: string;
  time: string;
  name: string;
  matter: string;
  type: string;
  mode: string;
  urgent: boolean;
  canJoin: boolean;
}

interface ChampProfil {
  cle: string;
  label: string; // avec déterminant, ex: "votre photo"
  rempli: boolean;
}

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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TopbarComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit {
  lawyerName = 'Maître';
  userName = '';
  userPlan = 'AVOCAT PREMIUM';
  avocatPhoto: string | null = null;
  avocatId: number | null = null;
  avocatProgression = 0;
  champsManquants: string[] = [];

  abonnementActif: Abonnement | null = null;
  abonnementLoading = true;
  abonnementCharge = false; // true une fois la requête terminée, qu'il y ait un abonnement ou non

  // Avantages débloqués dès la formule Pro (Premium ajoute support dédié + outils marketing en plus)
  readonly premiumUpsellFeatures = [
    'Mise en avant dans les résultats de recherche',
    'Statistiques avancées & insights clients',
    'Accès au système de paiement intégré',
  ];

  statutLabels = STATUT_LABELS;
  statutClasses = STATUT_CLASSES;

  // Valeurs par défaut avant le premier chargement réel (voir recalculerStatsConsultations())
  stats = {
    demandesEnAttente: 0,
    consultations: 0,
    rating: '0.0',
  };

  navItems: TopbarNavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard' , route: '/avocat/dashboard'},
    { label: 'Rendez-vous',    icon: 'calendar' , route: '/avocat/rendez-vous' },
    { label: 'Messagerie',     icon: 'message' },
    { label: 'Paiement',       icon: 'card', route: '/avocat/paiement' },
    { label: 'Paramètre',      icon: 'settings', route: '/avocat/parametre/profil'},
    { label: 'Deconnexion',    icon: 'logout' ,route: '/avocat/deconnexion'},
  ];

  joursDisponibles = [
    { value: 'MONDAY', label: 'Lundi' },
    { value: 'TUESDAY', label: 'Mardi' },
    { value: 'WEDNESDAY', label: 'Mercredi' },
    { value: 'THURSDAY', label: 'Jeudi' },
    { value: 'FRIDAY', label: 'Vendredi' },
    { value: 'SATURDAY', label: 'Samedi' },
    { value: 'SUNDAY', label: 'Dimanche' },
  ];

  nouvelleDisponibilite: Disponibilite = {
    jour: 'MONDAY',
    heureDebut: '09:00',
    heureFin: '18:00'
  };

  // Raw data from backend, kept so the detail modal can look up full info by id
  demandes: DemandeConsultation[] = [];

  appointments: Appointment[] = [];
  appointmentsLoading = true;
  appointmentsError = false;

  disponibilites: Disponibilite[] = [];

  // ---- Détails / Accepter modal state ----
  showDetailModal = false;
  selectedDemande: DemandeConsultation | null = null;
  showDisponibiliteModal = false;
  acceptSubmitting = false;
  acceptApiError = '';
  disponibilitesSubmitting = false;

  constructor(
    private authService: AuthService,
    private consultationService: ConsultationService,
    private disponibiliteService: DisponibiliteService,
    private avocatService: AvocatService,
    private abonnementService: AbonnementService,
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
    this.loadAvocatProfile();
    this.loadProchainRendezVous();
    this.loadDisponibilites();
  }

  private loadProchainRendezVous(): void {
    this.appointmentsLoading = true;
    this.appointmentsError = false;

    this.consultationService.getMesDemandes().subscribe({
      next: (demandes) => {
        this.demandes = demandes;

        // Filtrer pour garder les rendez-vous avec date (EN_ATTENTE ou CONFIRMEE)
        const prochains = demandes
          .filter(d => d.dateRendezVous && (d.statut === 'EN_ATTENTE' || d.statut === 'CONFIRMEE'))
          .slice(0, 3)
          .map(d => this.toAppointment(d));

        this.appointments = prochains;
        this.appointmentsLoading = false;
        this.recalculerStatsConsultations();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des demandes', err);
        this.appointments = [];
        this.appointmentsLoading = false;
        this.appointmentsError = true;
        this.cdr.detectChanges();
      },
    });
  }

  private toAppointment(d: DemandeConsultation): Appointment {
    const dateAffichee = d.statut === 'CONFIRMEE' && d.dateRendezVous
      ? new Date(d.dateRendezVous)
      : new Date(d.createdAt);

    return {
      id: d.id,
      dayLabel: this.formatDayLabel(dateAffichee),
      time: this.formatTime(dateAffichee),
      name: d.nomComplet,
      matter: d.mission || d.typePersonne || 'Consultation',
      type: this.modeLabel(d.modeConsultation),
      mode: d.modeConsultation,
      canJoin: d.statut === 'CONFIRMEE',
      urgent: d.urgent === 'oui',
    };
  }

  private loadAvocatProfile(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.avocatService.getByUserId(userId).subscribe({
      next: (avocat) => {
        this.avocatId = avocat.id;
        this.avocatPhoto = avocat.photo ? environment.fileBaseUrl + avocat.photo : null;
        this.avocatProgression = avocat.progression ?? 0;
        this.champsManquants = this.calculerChampsManquants(avocat);
        this.stats.rating = Number(avocat.noteMoyenne ?? 0).toFixed(1);
        this.recalculerStatsConsultations();
        this.cdr.detectChanges();
        this.loadAbonnement();
      },
      error: (err) => console.error('Erreur lors du chargement du profil avocat', err),
    });
  }

  /**
   * Recalcule "Demandes en attente" et "Consultations du mois" à partir de
   * this.demandes (chargées par loadProchainRendezVous). Pas de notion de revenu :
   * la plateforme ne connaît ni le tarif réel appliqué ni le paiement du client
   * (géré hors plateforme, entre l'avocat et le client) — seules la date, l'heure
   * et le mode de la consultation sont connus.
   */
  private recalculerStatsConsultations(): void {
    if (!this.demandes.length) return;

    // Demandes qui attendent une décision de l'avocat (accepter/refuser) — actionnable, contrairement à un simple total
    this.stats.demandesEnAttente = this.demandes.filter((d) => d.statut === 'EN_ATTENTE').length;

    const maintenant = new Date();
    const consultationsCeMois = this.demandes.filter((d) => {
      const date = new Date(d.createdAt);
      return (
        date.getMonth() === maintenant.getMonth() &&
        date.getFullYear() === maintenant.getFullYear()
      );
    });

    this.stats.consultations = consultationsCeMois.length;
  }

  private loadAbonnement(): void {
    if (!this.avocatId) return;
    this.abonnementLoading = true;

    this.abonnementService.getActiveAbonnement(this.avocatId).subscribe({
      next: (abonnement) => {
        this.abonnementActif = abonnement;
        this.abonnementLoading = false;
        this.abonnementCharge = true;
        this.cdr.detectChanges();
      },
      error: () => {
        // Pas d'abonnement PAYE actif — l'avocat n'a pas encore souscrit
        this.abonnementActif = null;
        this.abonnementLoading = false;
        this.abonnementCharge = true;
        this.cdr.detectChanges();
      },
    });
  }

  /** null = ne rien afficher (déjà Pro ou Premium) */
  get abonnementCardEtat(): 'AUCUN' | 'CLASSIQUE' | null {
    if (!this.abonnementCharge) return null;
    if (!this.abonnementActif) return 'AUCUN';
    if (this.abonnementActif.formule === 'BASIC') return 'CLASSIQUE';
    return null; // STANDARD ou PREMIUM : déjà bien équipé, pas d'upsell
  }

  goToPaiement(): void {
    this.router.navigate(['/avocat/paiement']);
  }

  private calculerChampsManquants(avocat: any): string[] {
    const champs: ChampProfil[] = [
      { cle: 'photo',       label: 'votre photo',                  rempli: !!avocat.photo },
      { cle: 'specialites', label: 'vos spécialités',              rempli: !!(avocat.specialites?.length) },
      { cle: 'bio',         label: 'votre bio',                    rempli: !!avocat.bio },
      { cle: 'telephone',   label: 'votre téléphone',              rempli: !!avocat.telephone },
      { cle: 'adresse',     label: "l'adresse de votre cabinet",   rempli: !!avocat.adresseCabinet },
      { cle: 'ville',       label: 'votre ville',                  rempli: !!avocat.ville },
      { cle: 'experience',  label: "vos années d'expérience",      rempli: avocat.experience != null },
      { cle: 'diplome',     label: 'votre diplôme',                rempli: !!avocat.diplome },
      { cle: 'cartePro',    label: 'votre carte professionnelle',  rempli: !!avocat.carteProfessionnel },
      { cle: 'pieceId',     label: "votre pièce d'identité",       rempli: !!avocat.pieceIdentiteRecto },
    ];

    return champs.filter(c => !c.rempli).map(c => c.label);
  }

  get profileMissingText(): string {
    const items = this.champsManquants.slice(0, 3); // on n'en montre que 3 max pour rester lisible
    if (items.length === 0) return '';

    if (items.length === 1) return `Ajoutez ${items[0]}.`;

    const dernier = items[items.length - 1];
    const reste = items.slice(0, -1).join(', ');
    return `Ajoutez ${reste} et ${dernier}.`;
  }

  get autresChampsRestants(): number {
    return Math.max(0, this.champsManquants.length - 3);
  }

  // Mêmes seuils que profil.ts (progressionColor) pour rester cohérent dans toute l'app
  get progressionColor(): string {
    if (this.avocatProgression < 40) return '#ef4444';  // rouge
    if (this.avocatProgression < 70) return '#f59e0b';  // orange
    if (this.avocatProgression < 100) return '#3b82f6'; // bleu
    return '#22c55e';                                    // vert
  }

  get progressionStatutLabel(): string {
    if (this.avocatProgression < 40) return 'Profil à compléter';
    if (this.avocatProgression < 70) return 'Profil incomplet';
    if (this.avocatProgression < 100) return 'Presque complet';
    return 'Profil complet';
  }

  goToParametres(): void {
    this.router.navigate(['/avocat/parametre/profil']);
  }

  private modeLabel(mode: string): string {
    const labels: Record<string, string> = {
      visio: 'Visioconférence',
      telephone: 'Téléphone',
      cabinet: 'Présentiel',
    };
    return labels[mode] || '';
  }

  private loadDisponibilites(): void {
    this.disponibiliteService.getMesDisponibilites().subscribe({
      next: (disponibilites) => {
        this.disponibilites = disponibilites;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des disponibilités', err);
        this.disponibilites = [];
      }
    });
  }

  openDisponibiliteModal(): void {
    this.showDisponibiliteModal = true;
  }

  closeDisponibiliteModal(): void {
    this.showDisponibiliteModal = false;
  }

  ajouterDisponibilite(): void {
    this.disponibilites.push({ ...this.nouvelleDisponibilite });
    this.nouvelleDisponibilite = {
      jour: 'MONDAY',
      heureDebut: '09:00',
      heureFin: '18:00'
    };
  }

  getJourLabel(jour: string): string {
    return this.joursDisponibles.find(j => j.value === jour)?.label || jour;
  }

  supprimerLigneDisponibilite(index: number): void {
    this.disponibilites.splice(index, 1);
  }

  enregistrerDisponibilites(): void {
    if (this.disponibilitesSubmitting) return;
    this.disponibilitesSubmitting = true;

    this.disponibiliteService.enregistrerDisponibilites(this.disponibilites).subscribe({
      next: (disponibilites) => {
        this.disponibilites = disponibilites;
        this.showDisponibiliteModal = false;
        this.disponibilitesSubmitting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de l\'enregistrement des disponibilités', err);
        this.disponibilitesSubmitting = false;
        this.cdr.detectChanges();
      }
    });
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

  onNavSelect(item: TopbarNavItem) {
    if (item.label === 'Deconnexion') {
      this.authService.logout();
      return;
    }

    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showDetailModal) this.closeDetailModal();
  }

  onJoin(a: Appointment) { console.log('Rejoindre', a); }

  onDetails(a: Appointment) {
    const demande = this.demandes.find((d) => d.id === a.id);
    if (!demande) return;

    this.selectedDemande = demande;
    this.acceptApiError = '';
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedDemande = null;
    this.acceptApiError = '';
  }

  accepterDemande(): void {
    if (!this.selectedDemande) return;

    this.acceptSubmitting = true;
    this.acceptApiError = '';

    this.consultationService.accepterDemande(this.selectedDemande.id).subscribe({
      next: () => {
        this.acceptSubmitting = false;
        this.closeDetailModal();
        this.loadProchainRendezVous(); // refresh — le statut a changé
      },
      error: (err) => {
        console.error("Erreur lors de l'acceptation de la consultation", err);
        this.acceptSubmitting = false;
        this.acceptApiError =
          err?.error?.message ?? "Impossible d'accepter cette demande. Veuillez réessayer.";
        this.cdr.detectChanges();
      },
    });
  }

  goToRendezVous(): void {
    this.router.navigate(['/avocat/rendez-vous']);
  }

  initiales(nomComplet: string): string {
    return nomComplet
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0].toUpperCase())
      .join('');
  }
}