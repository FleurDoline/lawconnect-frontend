import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  tap
} from 'rxjs/operators';
import { TopbarComponent, TopbarNavItem } from '../../../../shared/components/topbar/topbar';
import { CityAutocompleteComponent } from '../../../../shared/components/city-autocomplete/city-autocomplete';
import { City } from '../../../../core/models/city.model';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
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
  imports: [CommonModule, RouterModule, FormsModule, TopbarComponent, CityAutocompleteComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('topbar') topbar!: TopbarComponent;

   navItems: TopbarNavItem[] = [
    { label: 'Dashboard',    icon: 'dashboard', route: '/client/dashboard' },
    { label: 'Mes dossiers', icon: 'folder',    route: '/client/dossiers' },
    { label: 'Consultation', icon: 'calendar',  route: '/client/consultations' },
    { label: 'Paramètre',    icon: 'settings',  route: '/client/parametres' },
    { label: 'Deconnexion',  icon: 'logout', route: '/client/deconnexion' },
  ];

  onNavSelect(item: TopbarNavItem): void {
  if (item.label === 'Deconnexion') {
    this.authService.logout();
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

  refuserEnCours: number | null = null;

  private specialiteInput$ = new Subject<SpecialiteQuery>();
  private inputToken = 0;
private specialiteSub!: Subscription;

  demandesEnAttente = 0;
 notificationsNonLues = 0;

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
    private notificationService: NotificationService, 
    private consultationService: ConsultationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.clientNom =
      this.authService.getFullName() || 'Client';

    this.chargerNotifications();
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

  // ---- Aperçu "Consultations Récentes" (liste complète disponible sur /client/consultations) ----
  private readonly apercuLimite = 3;

  get apercuConsultationsRecentes(): Consultation[] {
    return this.consultationsRecentes.slice(0, this.apercuLimite);
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
  // remplace ouvrirNotifications() par :
ouvrirNotifications(): void {
  this.topbar.openNotifications();
}

  // Dossiers actifs / messages non lus restent mockés pour l'instant —
  // aucun endpoint backend disponible pour ces deux valeurs à ce jour.
  // remplace chargerStatsMock() entièrement par :
private chargerNotifications(): void {
  this.notificationService.getUnreadCount().subscribe({
    next: (res) => {
      this.notificationsNonLues = res.count;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erreur chargement notifications:', err);
      this.notificationsNonLues = 0;
      this.cdr.detectChanges();
    }
  });
}

  private chargerConsultations(): void {
  this.consultationService.getMesConsultations().subscribe({
    next: (data: ConsultationSummary[]) => {
      this.consultationsRecentes = data;
      this.prochaineConsultation = this.calculerProchaineConsultation(data);
      this.demandesEnAttente = data.filter(c => c.statut === 'EN_ATTENTE').length; // ajouté
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erreur chargement consultations:', err);
      this.consultationsRecentes = [];
      this.prochaineConsultation = null;
      this.demandesEnAttente = 0; // ajouté
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

  private calculerProchaineConsultation(data: ConsultationSummary[]): Consultation | null {
    const now = new Date();

    const prochaine = data
      .filter(c => c.statut === 'CONFIRMEE' && c.dateAfficheeIso && new Date(c.dateAfficheeIso) > now)
      .sort((a, b) => new Date(a.dateAfficheeIso).getTime() - new Date(b.dateAfficheeIso).getTime())[0];

    if (!prochaine) return null;

    return {
      id: prochaine.id,
      avocatNom: prochaine.avocatNom,
      avocatInitiales: prochaine.avocatInitiales,
      specialite: prochaine.specialite,
      date: this.formatDateCarte(new Date(prochaine.dateAfficheeIso)),
      statut: prochaine.statut as Consultation['statut'],
    };
  }

  private formatDateCarte(date: Date): string {
    const now = new Date();
    const demain = new Date();
    demain.setDate(now.getDate() + 1);

    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    const heure = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (isSameDay(date, now)) return `Aujourd'hui à ${heure}`;
    if (isSameDay(date, demain)) return `Demain à ${heure}`;

    return `${date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })} à ${heure}`;
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

  ouvrirDemandesEnAttente(): void {
  this.router.navigate(['/client/consultations'], {
    queryParams: { statut: 'EN_ATTENTE' }
  });
}

  rejoindreConsultation(id: number): void {

    this.router.navigate([
      '/client/consultations',
      id
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

  ouvrirDossier(id: number): void {
  this.router.navigate(['/client/dossiers', id]);
}

  nouvelleConsultation(): void {

    this.router.navigate([
      '/consultation/nouvelle'
    ]);

  }

  refuserDemande(id: number, event: Event): void {
     event.stopPropagation();

      this.refuserEnCours = id;

    this.consultationService.refuserDemande(id).subscribe({
        next: () => {
           this.refuserEnCours = null;
           const consultation = this.consultationsRecentes.find(c => c.id === id);
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

  statutLabel(statut: string): string {

    const labels: Record<string, string> = {

      CONFIRMEE: 'Confirmée',

      EN_ATTENTE: 'En attente',

      TERMINEE: 'Terminée',

      ANNULEE: 'Annulée'

    };

    return labels[statut] || statut;

  }

  onVilleSelected(city: City): void {
    this.ville = city.cityName;
  }

}