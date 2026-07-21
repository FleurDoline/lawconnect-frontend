import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AvocatService } from '../../../../../core/services/avocat.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { AvocatUpdateRequest } from '../../../../../core/models/avocat.model';
import { TopbarComponent, TopbarNavItem } from '../../../../../shared/components/topbar/topbar';

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

  avocatId: number | null = null;
  photo: string | null = null;
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

  ngOnInit(): void {
    this.form = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9+\s]{6,20}$/)]]
    });

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

        this.form.patchValue({
          prenom: avocat.prenom,
          nom: avocat.nom,
          email: avocat.email,
          telephone: avocat.telephone || ''
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
      prenom: this.form.value.prenom,
      nom: this.form.value.nom,
      telephone: this.form.value.telephone
    };

    this.avocatService.update(this.avocatId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.saveError = true;
        this.cdr.detectChanges();
      }
    });
  }
}