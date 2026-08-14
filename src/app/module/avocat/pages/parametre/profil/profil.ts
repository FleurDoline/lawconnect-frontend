import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AvocatService, TypePieceIdentite } from '../../../../../core/services/avocat.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ConsultationService } from '../../../../../core/services/consultation.service';
import { AvocatUpdateRequest, SpecialiteDroit } from '../../../../../core/models/avocat.model';
import { TopbarComponent, TopbarNavItem } from '../../../../../shared/components/topbar/topbar';
import { environment } from '../../../../../../environments/environment';
import { AbonnementService, Abonnement } from '../../../../../core/services/abonnement.service';

interface ParametreTab {
  label: string;
  key: string;
}

@Component({
  selector: 'app-avocat-parametre-profil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TopbarComponent],
  templateUrl: './profil.html',
  styleUrl: './profil.scss'
})
export class AvocatParametreProfilComponent implements OnInit {
  @ViewChild('pieceIdentiteInput') pieceIdentiteInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;

  passwordForm!: FormGroup;
  changingPassword = false;
  passwordSuccess = false;
  passwordError = '';

  photoBaseUrl = environment.apiUrl.replace('/api/v1', '');
  progression = 0;

  // --- Spécialités : liste complète + sélection en cours ---
  specialitesDisponibles: SpecialiteDroit[] = [];
  selectedSpecialiteIds: number[] = [];
  showSpecialiteSelector = false;

  // true si l'avocat gère ses créneaux sur la plateforme (via Disponibilite).
  // false => il gère son agenda en externe => lienAgenda devient obligatoire.
  avocatGereDisponibilites = true;

  get progressionColor(): string {
    if (this.progression < 40) return '#ef4444';
    if (this.progression < 70) return '#f59e0b';
    if (this.progression < 100) return '#3b82f6';
    return '#22c55e';
  }

  avocatId: number | null = null;
  photo: string | null = null;
  carteProfessionnel: string | null = null;
  diplome: string | null = null;

  // Pièce d'identité : recto/verso séparés + type choisi
  pieceIdentiteRecto: string | null = null;
  pieceIdentiteVerso: string | null = null;
  typePieceIdentite: TypePieceIdentite | null = null;

  // Sélecteur de type de pièce (affiché avant d'ouvrir l'explorateur de fichiers)
  showTypeSelector = false;
  // Segment en cours d'upload : 'RECTO' ou 'VERSO' (pour savoir quel input déclencher / quel type envoyer)
  private uploadEnCours: 'RECTO' | 'VERSO' | null = null;

  specialitesActuelles: string[] = [];
  barreau: string | null = null;

  loading = true;
  error = false;
  saving = false;
  saveSuccess = false;
  saveError = false;

  abonnementActif: Abonnement | null = null;
  abonnementLoading = false;
  abonnementCharge = false;

  userName = '';
  userPlan = 'AVOCAT';

  navItems: TopbarNavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/avocat/dashboard' },
    { label: 'Rendez-vous',    icon: 'calendar', route: '/avocat/rendez-vous' },
    { label: 'Messagerie',     icon: 'message', route: '/avocat/messagerie' },
    { label: 'Paiement',       icon: 'card', route: '/avocat/paiement' },
    { label: 'Paramètre',      icon: 'settings', route: '/avocat/parametre/profil' },
    { label: 'Deconnexion',    icon: 'logout', route: '/avocat/deconnexion' },
  ];

  tabs: ParametreTab[] = [
    { label: 'Profil', key: 'profil' },
    { label: 'Documents', key: 'documents' },
    { label: 'Cabinet', key: 'cabinet' },
    { label: 'Notifications', key: 'notifications' },
    { label: 'Securite', key: 'securite' },
    { label: 'Facturation', key: 'facturation' },
  ];
  activeTab = 'profil';

  constructor(
    private fb: FormBuilder,
    private avocatService: AvocatService,
    private authService: AuthService,
    private abonnementService: AbonnementService,
    private consultationService: ConsultationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  private passwordsMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9+\s]{6,20}$/)]],
      lienAgenda: ['', [Validators.pattern(/^https?:\/\/.+/)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator });

    const fullName = this.authService.getFullName();
    if (fullName) {
      this.userName = fullName;
    }

    this.chargerSpecialitesDisponibles();
    this.chargerProfil();
  }

  private chargerProfil(): void {
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
        this.photo = avocat.photo || null;
        this.specialitesActuelles = avocat.specialites || [];
        this.progression = avocat.progression ?? 0;
        this.carteProfessionnel = avocat.carteProfessionnel || null;
        this.diplome = avocat.diplome || null;
        this.pieceIdentiteRecto = avocat.pieceIdentiteRecto || null;
        this.pieceIdentiteVerso = avocat.pieceIdentiteVerso || null;
        this.typePieceIdentite = avocat.typePieceIdentite || null;

        this.syncSelectedSpecialiteIds();

        const nomComplet = avocat.fullName?.trim()
          || [avocat.prenom, avocat.nom].filter(Boolean).join(' ').trim();

        this.form.patchValue({
          fullName: nomComplet,
          email: avocat.email,
          telephone: avocat.telephone || '',
          lienAgenda: avocat.lienAgenda || ''
        });

        // Détermine si le lien d'agenda doit être obligatoire :
        // l'avocat n'a de créneaux configurés sur la plateforme.
        this.consultationService.avocatGereDisponibilites(avocat.id).subscribe({
          next: (gereDisponibilites) => {
            this.avocatGereDisponibilites = gereDisponibilites;

            const lienAgendaCtrl = this.form.get('lienAgenda');
            if (!gereDisponibilites) {
              lienAgendaCtrl?.setValidators([
                Validators.required,
                Validators.pattern(/^https?:\/\/.+/)
              ]);
            } else {
              lienAgendaCtrl?.setValidators([Validators.pattern(/^https?:\/\/.+/)]);
            }
            lienAgendaCtrl?.updateValueAndValidity();

            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            // En cas d'échec de la vérification, on ne bloque pas le chargement du profil ;
            // le lien reste simplement optionnel comme avant.
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Spécialités : chargement de la liste + sélection ---

  private chargerSpecialitesDisponibles(): void {
    this.avocatService.getSpecialites().subscribe({
      next: (specialites) => {
        this.specialitesDisponibles = specialites;
        this.syncSelectedSpecialiteIds();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement specialites', err)
    });
  }

  private syncSelectedSpecialiteIds(): void {
    if (!this.specialitesDisponibles.length || !this.specialitesActuelles.length) return;
    this.selectedSpecialiteIds = this.specialitesDisponibles
      .filter(s => this.specialitesActuelles.includes(s.nom))
      .map(s => s.id);
  }

  ouvrirSpecialiteSelector(): void {
    this.showSpecialiteSelector = true;
  }

  fermerSpecialiteSelector(): void {
    this.showSpecialiteSelector = false;
  }

  toggleSpecialite(id: number): void {
    const idx = this.selectedSpecialiteIds.indexOf(id);
    if (idx > -1) {
      this.selectedSpecialiteIds.splice(idx, 1);
    } else {
      this.selectedSpecialiteIds.push(id);
    }
  }

  isSpecialiteSelected(id: number): boolean {
    return this.selectedSpecialiteIds.includes(id);
  }

  private chargerAbonnement(): void {
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
       this.abonnementActif = null;
       this.abonnementLoading = false;
       this.abonnementCharge = true;
       this.cdr.detectChanges();
      }
   });
  }

nomFormuleAffiche(formule?: string): string {
  switch (formule) {
    case 'BASIC': return 'Classique';
    case 'STANDARD': return 'Pro';
    case 'PREMIUM': return 'Premium';
    default: return '—';
  }
}

formatDateFr(dateStr: string): string {
  const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')} ${mois[d.getMonth()]} ${d.getFullYear()}`;
}

allerVersPaiement(): void {
  this.router.navigate(['/avocat/paiement']);
}

  selectTab(tab: ParametreTab): void {
     this.activeTab = tab.key;
     if (tab.key === 'facturation' && !this.abonnementCharge) {
       this.chargerAbonnement();
     }
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

  onAnnuler(): void {
    this.chargerProfil();
    this.saveSuccess = false;
    this.saveError = false;
  }

  onEnregistrer(): void {
    if (this.form.invalid || !this.avocatId) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.saveSuccess = false;
    this.saveError = false;

    const payload: AvocatUpdateRequest = {
      fullName: this.form.value.fullName,
      telephone: this.form.value.telephone,
      lienAgenda: this.form.value.lienAgenda,
      specialiteIds: this.selectedSpecialiteIds
    };

    this.avocatService.update(this.avocatId, payload).subscribe({
      next: (avocat) => {
        this.saving = false;
        this.saveSuccess = true;
        this.progression = avocat.progression ?? this.progression;
        this.specialitesActuelles = avocat.specialites || this.specialitesActuelles;
        this.syncSelectedSpecialiteIds();
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.saveError = true;
        this.cdr.detectChanges();
      }
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.avocatId) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      console.error('Le fichier doit être une image');
      return;
    }

    this.avocatService.uploadPhoto(this.avocatId, file).subscribe({
      next: () => {
        this.chargerProfil(); // recharge photo + progression à jour depuis le backend
      },
      error: (err) => {
        console.error('Erreur upload photo', err);
      }
    });

    input.value = '';
  }

  onDocumentSelected(event: Event, type: 'CARTE_PROFESSIONNELLE' | 'DIPLOME'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.avocatId) return;

    const file = input.files[0];
    const isValid = file.type.startsWith('image/') || file.type === 'application/pdf';

    if (!isValid) {
      console.error('Le fichier doit être une image ou un PDF');
      return;
    }

    this.avocatService.uploadDocument(this.avocatId, type, file).subscribe({
      next: () => {
        this.chargerProfil(); // recharge documents + progression à jour
      },
      error: (err) => {
        console.error(`Erreur upload document ${type}`, err);
      }
    });

    input.value = '';
  }

  // --- Pièce d'identité : sélection du type puis upload recto/verso ---

  /** Ouvre le sélecteur de type (CNI / Passeport / Permis) avant d'uploader le recto. */
  onAjouterPieceIdentiteClick(): void {
    this.showTypeSelector = true;
  }

  fermerTypeSelector(): void {
    this.showTypeSelector = false;
  }

  /** L'avocat choisit CNI / Passeport / Permis : on déclenche l'explorateur de fichiers pour le recto. */
  onTypeSelected(type: TypePieceIdentite): void {
  this.typePieceIdentite = type;
  this.showTypeSelector = false;
  this.uploadEnCours = 'RECTO';
  this.pieceIdentiteInput?.nativeElement.click();
}

  /** Déclenché par le bouton "Ajouter le verso" (uniquement visible si CNI). */
  onAjouterVersoClick(): void {
    this.uploadEnCours = 'VERSO';
    this.pieceIdentiteInput?.nativeElement.click();
  }

  onPieceIdentiteSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.avocatId || !this.uploadEnCours) return;

    const file = input.files[0];
    const isValid = file.type.startsWith('image/') || file.type === 'application/pdf';

    if (!isValid) {
      console.error('Le fichier doit être une image ou un PDF');
      input.value = '';
      return;
    }

    const documentType = this.uploadEnCours === 'RECTO' ? 'PIECE_IDENTITE_RECTO' : 'PIECE_IDENTITE_VERSO';
    const typePiece = this.uploadEnCours === 'RECTO' ? (this.typePieceIdentite ?? undefined) : undefined;

    this.avocatService.uploadDocument(this.avocatId, documentType, file, typePiece).subscribe({
      next: () => {
        this.uploadEnCours = null;
        this.chargerProfil();
      },
      error: (err) => {
        console.error(`Erreur upload piece identite (${documentType})`, err);
        this.uploadEnCours = null;
      }
    });

    input.value = '';
  }

  onChangerMotDePasse(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) return;

    this.changingPassword = true;
    this.passwordSuccess = false;
    this.passwordError = '';

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    this.authService.changePassword(userId, currentPassword, newPassword, confirmPassword).subscribe({
      next: () => {
        this.changingPassword = false;
        this.passwordSuccess = true;
        this.passwordForm.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.changingPassword = false;
        this.passwordError = err.error?.message || 'Une erreur est survenue';
        this.cdr.detectChanges();
      }
    });
  }
}