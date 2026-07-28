import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AvocatService } from '../../../../../core/services/avocat.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { AvocatUpdateRequest } from '../../../../../core/models/avocat.model';
import { TopbarComponent, TopbarNavItem } from '../../../../../shared/components/topbar/topbar';
import { environment } from '../../../../../../environments/environment';

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
  form!: FormGroup;

  passwordForm!: FormGroup;
  changingPassword = false;
  passwordSuccess = false;
  passwordError = '';

  photoBaseUrl = environment.apiUrl.replace('/api/v1', '');
  progression = 0;

  avocatId: number | null = null;
  photo: string | null = null;
  carteProfessionnel: string | null = null;
  diplome: string | null = null;
  pieceIdentite: string | null = null;
  specialitesActuelles: string[] = [];
  barreau: string | null = null;

  loading = true;
  error = false;
  saving = false;
  saveSuccess = false;
  saveError = false;

  userName = '';
  userPlan = 'AVOCAT';

  navItems: TopbarNavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/avocat/dashboard' },
    { label: 'Rendez-vous',    icon: 'calendar' },
    { label: 'Messagerie',     icon: 'message' },
    { label: 'Paiement',       icon: 'card' },
    { label: 'Paramètre',      icon: 'settings', route: '/avocat/parametre/profil' },
    { label: 'Deconnexion',    icon: 'logout' },
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
        this.pieceIdentite = avocat.pieceIdentite || null;

        const nomComplet = avocat.fullName?.trim()
          || [avocat.prenom, avocat.nom].filter(Boolean).join(' ').trim();

        this.form.patchValue({
          fullName: nomComplet,
          email: avocat.email,
          telephone: avocat.telephone || '',
          lienAgenda: avocat.lienAgenda || ''
        });

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  selectTab(tab: ParametreTab): void {
    this.activeTab = tab.key;
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
      lienAgenda: this.form.value.lienAgenda
    };

    this.avocatService.update(this.avocatId, payload).subscribe({
      next: (avocat) => {
        this.saving = false;
        this.saveSuccess = true;
        this.progression = avocat.progression ?? this.progression;
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

  onDocumentSelected(event: Event, type: 'CARTE_PROFESSIONNELLE' | 'DIPLOME' | 'PIECE_IDENTITE'): void {
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