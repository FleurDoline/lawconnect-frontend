import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  tap
} from 'rxjs/operators';
import { TopbarComponent, TopbarNavItem } from '../../../../shared/components/topbar/topbar';

import { AuthService } from '../../../../core/services/auth.service';
import {
  SpecialiteService,
  SpecialiteDroit
} from '../../../../core/services/specialite.service';
import {
  ConsultationService,
  ConsultationSummary,
  ConsultationDetail
} from '../../../../core/services/consultation.service';

interface Consultation {
  id: number;
  avocatNom: string;
  avocatInitiales: string;
  specialite: string;
  date: string;
  statut: 'CONFIRMEE' | 'EN_ATTENTE' | 'TERMINEE' | 'ANNULEE';
}

interface SpecialiteQuery {
  query: string;
  token: number;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class ClientDashboardComponent implements OnInit, OnDestroy {

   navItems: TopbarNavItem[] = [
    { label: 'Dashboard',    icon: 'dashboard', route: '/client/dashboard' },
    { label: 'Mes dossiers', icon: 'folder',    route: '/client/dossiers' },
    { label: 'Consultation', icon: 'calendar',  route: '/client/consultations' },
    { label: 'Paramètre',    icon: 'settings',  route: '/client/parametres' },
    { label: 'Deconnexion',  icon: 'logout' },
  ];

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


  clientNom = '';

  specialite = '';
  ville = '';

  specialiteSuggestions: SpecialiteDroit[] = [];
  showSuggestions = false;

  private specialiteInput$ = new Subject<SpecialiteQuery>();
  private inputToken = 0;
  private specialiteSub!: Subscription;

  dossiersActifs = 0;
  messagesNonLus = 0;

  prochaineConsultation: Consultation | null = null;
  consultationsRecentes: Consultation[] = [];

  loading = true;

  // ---- Modal détails consultation ----
  selectedConsultation: ConsultationDetail | null = null;
  showDetailsModal = false;
  loadingDetails = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private specialiteService: SpecialiteService,
    private consultationService: ConsultationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.clientNom =
      this.authService.getFullName() || 'Client';

    this.chargerStatsMock();
    this.chargerConsultations();

    this.specialiteSub = this.specialiteInput$
      .pipe(
        debounceTime(250),

        distinctUntilChanged(
          (a, b) =>
            a.query === b.query &&
            a.token === b.token
        ),

        switchMap(({ query }) =>
          this.specialiteService.search(query).pipe(
            tap(results =>
              console.log(
                '[Specialite] success',
                results
              )
            ),

            catchError(err => {
              console.error(err);
              return of([] as SpecialiteDroit[]);
            })
          )
        )
      )
      .subscribe(results => {

        this.specialiteSuggestions =
          this.specialite.trim().length === 0
            ? results.slice(0, 7)
            : results;

        this.showSuggestions =
          this.specialiteSuggestions.length > 0;

        this.cdr.detectChanges();

      });

  }

  ngOnDestroy(): void {
    this.specialiteSub?.unsubscribe();
  }

  onSpecialiteInput(): void {

    this.specialiteInput$.next({
      query: this.specialite,
      token: this.inputToken
    });

  }

  onSpecialiteFocus(): void {

    this.inputToken++;

    this.specialiteInput$.next({
      query: this.specialite,
      token: this.inputToken
    });

  }

  // ---- pagination for "Consultations Récentes" ----
  pageSize = 10;
  currentPage = 1;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.consultationsRecentes.length / this.pageSize));
  }

  get pagedConsultationsRecentes(): Consultation[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.consultationsRecentes.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  selectSpecialite(s: SpecialiteDroit): void {

    this.specialite = s.nom;
    this.showSuggestions = false;

  }

  hideSuggestionsDelayed(): void {

    setTimeout(() => {
      this.showSuggestions = false;
    }, 150);

  }

  private chargerStatsMock(): void {

    setTimeout(() => {

      this.dossiersActifs = 4;
      this.messagesNonLus = 7;

      this.prochaineConsultation = {
        id: 1,
        avocatNom: 'Anne Martin',
        avocatInitiales: 'AM',
        specialite: 'Immobilier',
        date: 'Demain à 14h30',
        statut: 'CONFIRMEE'
      };

      this.cdr.detectChanges();

    }, 400);

  }

  private chargerConsultations(): void {

    this.consultationService.getMesConsultations().subscribe({
      next: (data: ConsultationSummary[]) => {
        this.consultationsRecentes = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement consultations:', err);
        this.consultationsRecentes = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

  }

  rechercherAvocat(): void {

    const specialite = this.specialite.trim();
    const ville = this.ville.trim();

    if (!specialite && !ville) {

      alert(
        'Veuillez saisir une spécialité ou une ville.'
      );

      return;

    }

    this.router.navigate(['/avocat'], {
      queryParams: {
        ...(specialite && { specialite }),
        ...(ville && { ville })
      }
    });

  }

  ouvrirDossier(id: number): void {

    this.router.navigate([
      '/client/dossiers',
      id
    ]);

  }

  rejoindreConsultation(id: number): void {

    this.router.navigate([
      '/client/consultation',
      id
    ]);

  }

  ouvrirMessagerie(): void {

    this.router.navigate([
      '/client/messagerie'
    ]);

  }

  ouvrirDetailsConsultation(id: number): void {
    this.showDetailsModal = true;
    this.loadingDetails = true;
    this.selectedConsultation = null;

    this.consultationService.getDetails(id).subscribe({
      next: (data) => {
        this.selectedConsultation = data;
        this.loadingDetails = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement détail consultation:', err);
        this.loadingDetails = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedConsultation = null;
  }

  ouvrirDossiers(): void {
    this.router.navigate(['/client/dossiers']);
  }

  nouvelleConsultation(): void {

    this.router.navigate([
      '/consultation/nouvelle'
    ]);

  }

  statutLabel(statut: string): string {

    const labels: Record<string, string> = {

      CONFIRMEE: 'Confirmée',

      EN_ATTENTE: 'En attente',

      TERMINEE: 'Terminée',

      ANNULEE: 'Annulée'

    };

    return labels[statut] || statut;

  }

}