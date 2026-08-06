import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TopbarComponent, TopbarNavItem } from '../../../../shared/components/topbar/topbar';
import { CityAutocompleteComponent } from '../../../../shared/components/city-autocomplete/city-autocomplete';
import { City } from '../../../../core/models/city.model';
import {
  ConsultationService,
  ConsultationSummary,
  AvocatSummary,
  ConsultationCreateRequest,
} from '../../../../core/services/consultation.service';
import {
  ConsultationCallModalComponent,
  ConsultationCallInfo,
} from '../../../../shared/components/consultation-call-modal/consultation-call-modal';

type ConsultationStatut = 'CONFIRMEE' | 'EN_ATTENTE' | 'TERMINEE' | 'ANNULEE';
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
  avocatTelephone: string;
  dateAfficheeIso: string;
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
  typePersonne: 'particulier' | 'entreprise' | '';
  mission: string;
  situation: string;
  attentes: string[];
  urgent: 'oui' | 'non' | '';
  nomComplet: string;
  telephone: string;
  email: string;
  ville: string;
  contactPreference: 'email' | 'telephone' | '';
  mode: ConsultationMode | '';
}

interface EditConsultationForm {
  date: string;
  heure: string;
  mode: ConsultationMode | '';
  note: string;
}

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarComponent, CityAutocompleteComponent, ConsultationCallModalComponent],
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
  pageSize = 8;
  currentPage = 1;
  loading = true;
  loadError = false;

  // ---- Sélection créneau (Nouvelle Consultation) ----
  prochainsJours: { label: string; iso: string }[] = [];
  jourSelectionne: string | null = null;
  creneauxDisponibles: string[] = [];
  creneauSelectionne: string | null = null;
  loadingCreneaux = false;
  creneauxError = false;
  creneauErreur: string | null = null;
  refuserEnCours: number | null = null;

  private allConsultations: ConsultationRow[] = [];

  private readonly avatarPalette = ['#2f5fd6', '#2f9e5f', '#8a6d1f', '#7a3fbf', '#c0392b', '#0f766e', '#b45309'];

  private readonly modeToBackend: Record<ConsultationMode, string> = {
    visio: 'visio',
    telephone: 'telephone',
    cabinet: 'cabinet',
  };
  private readonly modeLabels: Record<ConsultationMode, string> = {
    visio: 'Visioconférence',
    telephone: 'Téléphone',
    cabinet: 'Cabinet',
  };

  readonly attentesOptions = [
    { value: 'conseil', label: 'Conseil juridique' },
    { value: 'representation', label: 'Représentation en justice' },
    { value: 'redaction', label: 'Rédaction de documents' },
    { value: 'mediation', label: 'Médiation' },
  ];

  readonly SITUATION_MIN_LENGTH = 30;

  avocats: AvocatOption[] = [];
  loadingAvocats = false;
  loadAvocatsError = false;

  showNouvelleModal = false;
  submitting = false;
  submitError: string | null = null;

  showDetailModal = false;
  selectedConsultation: ConsultationRow | null = null;
  errors: Partial<Record<keyof NouvelleConsultationForm, string>> = {};

  // ---- Edit modal ----
  showEditModal = false;
  selectedForEdit: ConsultationRow | null = null;
  editSubmitting = false;
  editSubmitError: string | null = null;
  editForm: EditConsultationForm = { date: '', heure: '', mode: '', note: '' };
  editErrors: Partial<Record<keyof EditConsultationForm, string>> = {};

  isCallModalOpen = false;
  selectedCallInfo: ConsultationCallInfo | null = null;

  form: NouvelleConsultationForm = {
    avocatId: null,
    typePersonne: '',
    mission: '',
    situation: '',
    attentes: [],
    urgent: '',
    nomComplet: '',
    telephone: '',
    email: '',
    ville: '',
    contactPreference: '',
    mode: '',
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private consultationService: ConsultationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.clientNom = this.authService.getFullName() || 'Client';
    this.chargerConsultations();
    this.chargerAvocats();
  }

  private chargerConsultations(): void {
    this.loading = true;
    this.loadError = false;

    this.consultationService.getMesConsultations().subscribe({
      next: (data: ConsultationSummary[]) => {
        this.allConsultations = data.map(c => this.toRow(c));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement consultations:', err);
        this.allConsultations = [];
        this.loading = false;
        this.loadError = true;
        this.cdr.detectChanges();
      },
    });
  }

  private chargerAvocats(): void {
    this.loadingAvocats = true;
    this.loadAvocatsError = false;

    this.consultationService.getAvocatsDisponibles().subscribe({
      next: (page) => {
        this.avocats = page.content.map((a: AvocatSummary) => {
          const parts = (a.nom ?? '').trim().split(/\s+/);
          const initiales = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : (parts[0]?.[0] ?? '').toUpperCase();
          return {
            id: a.id,
            nom: a.nom ?? '',
            initiales,
            color: this.colorFor(initiales),
            specialite: a.specialites?.join(', ') ?? '',
          };
        });
        this.loadingAvocats = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement avocats:', err);
        this.avocats = [];
        this.loadingAvocats = false;
        this.loadAvocatsError = true;
        this.cdr.detectChanges();
      },
    });
  }

  private toRow(c: ConsultationSummary): ConsultationRow {
    return {
      id: c.id,
      date: c.date,
      heure: c.heure,
      avocatNom: c.avocatNom,
      avocatInitiales: c.avocatInitiales,
      avatarColor: this.colorFor(c.avocatInitiales),
      specialite: c.specialite,
      mode: this.normalizeMode(c.mode),
      statut: c.statut,
      avocatTelephone: c.avocatTelephone,
      dateAfficheeIso: c.dateAfficheeIso,
    };
  }

  private normalizeMode(raw: unknown): ConsultationMode {
    const v = String(raw ?? '').trim().toLowerCase();
    if (v.includes('visio') || v.includes('video')) return 'visio';
    if (v.includes('tel')) return 'telephone';
    return 'cabinet';
  }

  modeLabel(mode: ConsultationMode): string {
    return this.modeLabels[mode] ?? mode;
  }

  private colorFor(initiales: string): string {
    let hash = 0;
    for (let i = 0; i < initiales.length; i++) {
      hash = initiales.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.avatarPalette.length;
    return this.avatarPalette[index];
  }

  onNavSelect(item: TopbarNavItem): void {
    if (item.label === 'Deconnexion') {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  canCancel(c: ConsultationRow): boolean {
  return c.statut === 'EN_ATTENTE';
}

refuserDemande(c: ConsultationRow): void {
  if (c.statut !== 'EN_ATTENTE') return;

  this.refuserEnCours = c.id;

  this.consultationService.refuserDemande(c.id).subscribe({
    next: () => {
      this.refuserEnCours = null;
      const consultation = this.allConsultations.find(x => x.id === c.id);
      if (consultation) {
        consultation.statut = 'ANNULEE';
      }
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erreur lors de l\'annulation de la consultation', err);
      this.refuserEnCours = null;
      this.cdr.detectChanges();
    },
  });
}

  get filtered(): ConsultationRow[] {
    const now = new Date();
    return this.allConsultations.filter(c => {
      const rdvPasse = c.dateAfficheeIso ? new Date(c.dateAfficheeIso) < now : false;
      const estTerminee = c.statut === 'TERMINEE' || c.statut === 'ANNULEE' || rdvPasse;
      return this.activeTab === 'avenir' ? !estTerminee : estTerminee;
    });
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
      CONFIRMEE: 'Confirmée',
      EN_ATTENTE: 'En attente',
      TERMINEE: 'Terminée',
      ANNULEE: 'Annulée',
    };
    return labels[statut];
  }

  canJoin(c: ConsultationRow): boolean {
    return c.statut === 'CONFIRMEE';
  }

  canEdit(c: ConsultationRow): boolean {
    return c.statut === 'EN_ATTENTE';
  }

  rejoindre(c: ConsultationRow): void {
    if (c.mode === 'telephone') {
      this.selectedCallInfo = {
        contactNom: c.avocatNom,
        contactSpecialite: c.specialite,
        contactTelephone: c.avocatTelephone,
        dateRendezVous: c.date,
        heureRendezVous: c.heure,
      };
      this.isCallModalOpen = true;
      return;
    }

    this.router.navigate(['/client/consultation', c.id]);
  }

  closeCallModal(): void {
    this.isCallModalOpen = false;
    this.selectedCallInfo = null;
  }

  detail(c: ConsultationRow): void {
    this.selectedConsultation = c;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedConsultation = null;
  }

  get todayIso(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // ---- Sélection créneau (Nouvelle Consultation) ----

  private genererProchainsJours(): void {
    const jours: { label: string; iso: string }[] = [];
    const noms = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const label = `${noms[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
      jours.push({ label, iso });
    }

    this.prochainsJours = jours;
  }

  onAvocatChange(): void {
    this.jourSelectionne = null;
    this.creneauSelectionne = null;
    this.creneauxDisponibles = [];
    this.creneauErreur = null;
    if (this.form.avocatId) {
      this.genererProchainsJours();
    }
  }

  selectionnerJour(iso: string): void {
    this.jourSelectionne = iso;
    this.creneauSelectionne = null;
    this.loadingCreneaux = true;
    this.creneauxError = false;

    this.consultationService.getCreneauxDisponibles(this.form.avocatId!, iso).subscribe({
      next: (creneaux) => {
        this.creneauxDisponibles = creneaux;
        this.loadingCreneaux = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.creneauxError = true;
        this.loadingCreneaux = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectionnerCreneau(heure: string): void {
    this.creneauSelectionne = heure;
  }

  // ---- Nouvelle consultation modal actions ----
  nouvelleConsultation(): void {
    this.form.nomComplet = this.clientNom;
    this.showNouvelleModal = true;
  }

  closeNouvelleModal(): void {
    this.showNouvelleModal = false;
    this.submitError = null;
    this.errors = {};
    this.form = {
      avocatId: null,
      typePersonne: '',
      mission: '',
      situation: '',
      attentes: [],
      urgent: '',
      nomComplet: '',
      telephone: '',
      email: '',
      ville: '',
      contactPreference: '',
      mode: '',
    };
    this.prochainsJours = [];
    this.jourSelectionne = null;
    this.creneauSelectionne = null;
    this.creneauxDisponibles = [];
    this.creneauErreur = null;
  }

  toggleAttente(value: string): void {
    const i = this.form.attentes.indexOf(value);
    if (i === -1) {
      this.form.attentes.push(value);
    } else {
      this.form.attentes.splice(i, 1);
    }
  }

  onCitySelected(city: City): void {
    this.form.ville = city.cityName;
  }

  private validateForm(): boolean {
    const errors: typeof this.errors = {};

    if (!this.form.avocatId) errors.avocatId = 'Veuillez sélectionner un avocat.';
    if (!this.form.typePersonne) errors.typePersonne = 'Ce champ est requis.';
    if (!this.form.mission.trim()) errors.mission = "L'objet de la demande est requis.";
    if (!this.form.situation.trim()) errors.situation = 'Veuillez décrire votre situation.';
    if (!this.form.urgent) errors.urgent = 'Ce champ est requis.';
    if (!this.form.nomComplet.trim()) errors.nomComplet = 'Le nom complet est requis.';
    if (!this.form.telephone.trim()) errors.telephone = 'Le téléphone est requis.';
    if (!this.form.email.trim()) {
      errors.email = "L'email est requis.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
      errors.email = 'Email invalide.';
    }
    if (!this.form.ville.trim()) errors.ville = 'La ville est requise.';
    if (!this.form.contactPreference) errors.contactPreference = 'Ce champ est requis.';
    if (!this.form.mode) errors.mode = 'Veuillez choisir un mode de consultation.';

    this.creneauErreur = (!this.jourSelectionne || !this.creneauSelectionne)
      ? 'Veuillez choisir une date et une heure.'
      : null;

    this.errors = errors;
    return Object.keys(errors).length === 0 && !this.creneauErreur;
  }

  submitNouvelleConsultation(): void {
    this.submitError = null;
    if (!this.validateForm()) return;

    this.submitting = true;

    const payload: ConsultationCreateRequest = {
      avocatId: this.form.avocatId!,
      flowType: 'consultation',
      eligibilite: null,
      typePersonne: this.form.typePersonne,
      mission: this.form.mission.trim(),
      attentes: this.form.attentes,
      urgent: this.form.urgent,
      situation: this.form.situation.trim(),
      nomComplet: this.form.nomComplet.trim(),
      telephone: this.form.telephone.trim(),
      email: this.form.email.trim(),
      ville: this.form.ville.trim(),
      contactPreference: this.form.contactPreference,
      modeConsultation: this.modeToBackend[this.form.mode as ConsultationMode],
      dateRendezVous: `${this.jourSelectionne}T${this.creneauSelectionne}`,
    };

    this.consultationService.envoyerDemande(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.closeNouvelleModal();
        this.setTab('avenir');
        this.chargerConsultations();
      },
      error: (err) => {
        console.error('Erreur lors de la création de la demande:', err);
        this.submitting = false;
        this.submitError = "Une erreur est survenue lors de l'envoi de votre demande. Veuillez réessayer.";
        this.cdr.detectChanges();
      },
    });
  }

  // ---- Edit consultation modal actions ----

  openEdit(c: ConsultationRow): void {
    this.selectedForEdit = c;
    this.editForm = {
      date: this.toDateInputValue(c),
      heure: this.toTimeInputValue(c),
      mode: c.mode,
      note: '',
    };
    this.editErrors = {};
    this.editSubmitError = null;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedForEdit = null;
    this.editForm = { date: '', heure: '', mode: '', note: '' };
    this.editErrors = {};
    this.editSubmitError = null;
  }

  private toDateInputValue(c: ConsultationRow): string {
    if (c.dateAfficheeIso) {
      return c.dateAfficheeIso.split('T')[0];
    }
    return '';
  }

  private toTimeInputValue(c: ConsultationRow): string {
    return (c.heure ?? '').substring(0, 5);
  }

  private validateEditForm(): boolean {
    const errors: typeof this.editErrors = {};

    if (!this.editForm.date) errors.date = 'La date est requise.';
    if (!this.editForm.heure) errors.heure = "L'heure est requise.";
    if (!this.editForm.mode) errors.mode = 'Veuillez choisir un mode de consultation.';

    this.editErrors = errors;
    return Object.keys(errors).length === 0;
  }

  submitEdit(): void {
    this.editSubmitError = null;
    if (!this.selectedForEdit || !this.validateEditForm()) return;

    this.editSubmitting = true;
    const id = this.selectedForEdit.id;

    // TODO: backend PATCH endpoint needed, e.g. PATCH /api/v1/consultations/{id}
    // and a corresponding ConsultationService.modifierConsultation(id, payload) method,
    // similar in shape to the accepter flow on the avocat dashboard.
    const payload = {
      date: this.editForm.date,
      heure: this.editForm.heure,
      mode: this.modeToBackend[this.editForm.mode as ConsultationMode],
      note: this.editForm.note?.trim() || undefined,
    };

    if (typeof (this.consultationService as any).modifierConsultation === 'function') {
      (this.consultationService as any).modifierConsultation(id, payload).subscribe({
        next: () => {
          this.editSubmitting = false;
          this.closeEditModal();
          this.chargerConsultations();
        },
        error: (err: unknown) => {
          console.error('Erreur lors de la modification de la consultation:', err);
          this.editSubmitting = false;
          this.editSubmitError = 'Une erreur est survenue lors de la modification. Veuillez réessayer.';
          this.cdr.detectChanges();
        },
      });
    } else {
      this.editSubmitting = false;
      this.editSubmitError = "La modification n'est pas encore disponible côté serveur.";
      this.cdr.detectChanges();
    }
  }

}