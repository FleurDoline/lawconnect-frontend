import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AvocatService } from '../../../../core/services/avocat.service';
import {
  AbonnementService,
  Abonnement,
  FormuleAbonnement,
  CycleAbonnement,
  AbonnementCheckoutRequest
} from '../../../../core/services/abonnement.service';
import { TopbarComponent, TopbarNavItem } from '../../../../shared/components/topbar/topbar';
import { environment } from '../../../../../environments/environment';


interface PlanDefinition {
  formule: FormuleAbonnement;
  nomAffiche: string;
  tagline: string;
  prixMensuel: number;
  prixAnnuel: number;
  features: string[];
  recommande: boolean;
}

type CycleAffichage = 'MENSUEL' | 'ANNUEL';

@Component({
  selector: 'app-avocat-paiement',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarComponent],
  templateUrl: './paiement.html',
  styleUrl: './paiement.scss'
})
export class PaiementComponent implements OnInit {

  loading = true;
  error = false;

  pageSize = 5;
  currentPage = 1;

  avocatId: number | null = null;
  userName = '';
  userPlan = 'AVOCAT';
  avocatPhotoUrl: string | null = null;

  abonnementActif: Abonnement | null = null;
  historique: Abonnement[] = [];
  creationEnCours = false;
  creationSuccessMessage = '';
  creationError = '';

  cycleAffichage: CycleAffichage = 'MENSUEL';

  joursRestants = 0;
  dateRenouvellementAffichee = '';

  // ---- Modal Paiement Mobile Money ----
  showPaiementModal = false;
  planSelectionne: PlanDefinition | null = null;
  channelSelectionne = 'cm.mtn';
  phoneSaisi = '';
  paiementEnCours = false;
  paiementError = '';

  navItems: TopbarNavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/avocat/dashboard' },
    { label: 'Rendez-vous',    icon: 'calendar', route: '/avocat/rendez-vous' },
    { label: 'Messagerie',     icon: 'message', route: '/avocat/messagerie' },
    { label: 'Paiement',       icon: 'card', route: '/avocat/paiement' },
    { label: 'Paramètre',      icon: 'settings', route: '/avocat/parametre/profil' },
    { label: 'Deconnexion',    icon: 'logout', route: '/avocat/deconnexion' },
  ];

  plans: PlanDefinition[] = [
    {
      formule: 'BASIC',
      nomAffiche: 'Classique',
      tagline: "L'essentiel pour exercer sur LawConnect",
      prixMensuel: 5000,
      prixAnnuel: 50000,
      recommande: false,
      features: [
        'Profil professionnel visible par tous les clients',
        'Réception des réservations de consultations',
        'Tableau de bord : agenda, revenus & statistiques'
      ]
    },
    {
      formule: 'STANDARD',
      nomAffiche: 'Pro',
      tagline: 'Plus de visibilité & meilleurs outils',
      prixMensuel: 7500,
      prixAnnuel: 75000,
      recommande: false,
      features: [
        'Profil professionnel visible par tous les clients',
        'Réception des réservations de consultations',
        'Tableau de bord : agenda, revenus & statistiques',
        'Mise en avant dans les résultats de recherche',
        'Statistiques avancées & insights clients',
        'Accès au système de paiement intégré'
      ]
    },
    {
      formule: 'PREMIUM',
      nomAffiche: 'Premium',
      tagline: 'Visibilité maximale & outils avancés',
      prixMensuel: 12500,
      prixAnnuel: 125000,
      recommande: true,
      features: [
        'Profil professionnel visible par tous les clients',
        'Réception des réservations de consultations',
        'Tableau de bord : agenda, revenus & statistiques',
        'Mise en avant dans les résultats de recherche',
        'Statistiques avancées & insights clients',
        'Accès au système de paiement intégré',
        'Support dédié 7j/7',
        'Outils marketing (campagnes, parrainage)'
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private avocatService: AvocatService,
    private abonnementService: AbonnementService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const fullName = this.authService.getFullName();
    if (fullName) this.userName = fullName;

    const userId = this.authService.getUserId();
    if (!userId) {
      this.loading = false;
      this.error = true;
      this.cdr.detectChanges();
      return;
    }

    this.avocatService.getByUserId(userId).subscribe({
      next: (avocat) => {
        this.avocatId = avocat.id;
        this.avocatPhotoUrl = avocat.photo ? environment.fileBaseUrl + avocat.photo : null;
        this.chargerAbonnements();
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  private chargerAbonnements(): void {
    if (!this.avocatId) return;

    this.abonnementService.getActiveAbonnement(this.avocatId).subscribe({
      next: (abonnement) => {
        this.abonnementActif = abonnement;
        this.calculerRenouvellement(abonnement.prochainRenouvellement);
        this.chargerHistorique();
      },
      error: () => {
        this.abonnementActif = null;
        this.chargerHistorique();
      }
    });
  }

  private chargerHistorique(): void {
    if (!this.avocatId) return;

    this.abonnementService.getAbonnementsByAvocat(this.avocatId).subscribe({
      next: (liste) => {
        this.historique = liste.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private calculerRenouvellement(dateStr: string): void {
    const target = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - now.getTime();
    this.joursRestants = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    this.dateRenouvellementAffichee = this.formatDateFr(dateStr);
  }

  formatDateFr(dateStr: string): string {
    const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')} ${mois[d.getMonth()]} ${d.getFullYear()}`;
  }

  formatDateCourte(dateStr: string): string {
    const mois = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')} ${mois[d.getMonth()]} ${d.getFullYear()}`;
  }

  toggleCycle(cycle: CycleAffichage): void {
    this.cycleAffichage = cycle;
  }

  prixAffiche(plan: PlanDefinition): number {
    return this.cycleAffichage === 'MENSUEL' ? plan.prixMensuel : plan.prixAnnuel;
  }

  prixMensuelEquivalent(plan: PlanDefinition): number {
    return Math.round(plan.prixAnnuel / 12);
  }

  estFormuleActuelle(plan: PlanDefinition): boolean {
    return this.abonnementActif?.formule === plan.formule;
  }

  libelleBouton(plan: PlanDefinition): string {
    if (this.estFormuleActuelle(plan)) return 'Formule actuelle';
    if (this.paiementEnCours && this.planSelectionne?.formule === plan.formule) return 'Traitement...';
    return plan.formule === 'PREMIUM' ? 'Passer Premium'
       : plan.formule === 'STANDARD' ? 'Passer Pro'
       : 'Choisir Classique';
  }

  nomFormuleAffiche(formule: FormuleAbonnement | undefined): string {
    switch (formule) {
      case 'BASIC': return 'Classique';
      case 'STANDARD': return 'Pro';
      case 'PREMIUM': return 'Premium';
      default: return '—';
    }
  }

  libelleStatut(statut: string): string {
    switch (statut) {
      case 'PAYE': return 'Payé';
      case 'EN_ATTENTE': return 'En attente';
      case 'EXPIRE': return 'Expiré';
      case 'ANNULE': return 'Annulé';
      case 'ECHOUE': return 'Échec';
      default: return statut;
    }
  }

  classeStatut(statut: string): string {
    switch (statut) {
      case 'PAYE': return 'badge--paye';
      case 'EN_ATTENTE': return 'badge--attente';
      case 'EXPIRE': return 'badge--expire';
      case 'ANNULE': return 'badge--annule';
      case 'ECHOUE': return 'badge--echoue';
      default: return '';
    }
  }

  get totalPages(): number {
     return Math.max(1, Math.ceil(this.historique.length / this.pageSize));
  }

  get historiquePage(): Abonnement[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.historique.slice(start, start + this.pageSize);
  }

  pagePrecedente(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  pageSuivante(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  // ---- Flow de paiement ----

  onChoisirFormule(plan: PlanDefinition): void {
    if (this.estFormuleActuelle(plan) || this.paiementEnCours) return;

    if (this.abonnementActif) {
      alert('Le changement de formule sera bientôt disponible. Contactez le support pour changer de plan pour le moment.');
      return;
    }

    this.planSelectionne = plan;
    this.channelSelectionne = 'cm.mtn';
    this.phoneSaisi = '';
    this.paiementError = '';
    this.showPaiementModal = true;
  }

  fermerModalPaiement(): void {
    if (this.paiementEnCours) return;
    this.showPaiementModal = false;
    this.planSelectionne = null;
  }

 confirmerPaiement(): void {
  if (!this.avocatId || !this.planSelectionne || this.paiementEnCours) return;

  const localNumber = this.phoneSaisi.trim().replace(/\D/g, '');
  if (!localNumber || localNumber.length !== 9) {
    this.paiementError = 'Veuillez saisir un numéro valide (9 chiffres, ex: 670000000).';
    return;
  }

  this.paiementEnCours = true;
  this.paiementError = '';

  const payload: AbonnementCheckoutRequest = {
    formule: this.planSelectionne.formule,
    cycle: (this.cycleAffichage === 'ANNUEL' ? 'ANNUEL' : 'MENSUEL') as CycleAbonnement,
    montant: this.prixAffiche(this.planSelectionne),
    avocatId: this.avocatId,
    channel: this.channelSelectionne,
    phone: '+237' + localNumber
  };

  this.abonnementService.checkout(payload).subscribe({
    next: (res) => {
      this.paiementEnCours = false;
      this.showPaiementModal = false;
      this.planSelectionne = null;
      this.creationSuccessMessage = res.message || 'Paiement initié. Veuillez valider le prompt USSD reçu sur votre téléphone.';
      this.chargerHistorique();
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.paiementEnCours = false;
      this.paiementError = err.error?.message || "Une erreur est survenue lors du paiement.";
      this.cdr.detectChanges();
    }
  });
}
  onGererPaiement(): void {
    alert('La gestion du moyen de paiement arrive bientôt.');
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
}