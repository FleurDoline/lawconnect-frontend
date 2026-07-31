import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AvocatService } from '../../../../core/services/avocat.service';
import { ConsultationService, ConsultationCreateRequest } from '../../../../core/services/consultation.service';
import { CityAutocompleteComponent } from '../../../../../app/shared/components/city-autocomplete/city-autocomplete';
import { City } from '../../../../core/models/city.model';

interface CountryCode {
  name: string;
  code: string;
  dial: string;
  flag: string;
}

type ModeConsultation = 'visio' | 'telephone' | 'cabinet';

@Component({
  selector: 'app-besoin-avocat',
  standalone: true,
  imports: [CommonModule, FormsModule, CityAutocompleteComponent],
  templateUrl: './besoin-avocat.html',
  styleUrls: ['./besoin-avocat.scss']
})
export class BesoinAvocatComponent implements OnInit {
  avocat: any;
  flowType: 'message' | 'consultation' = 'message';
  avocatId!: string;
  isLoading = true;

  // Gestion des étapes
  // 'confirmation' est un état terminal, il n'entre pas dans le calcul de la barre de progression
  readonly steps: Array<'eligibilite' | 'formulaire' | 'situation' | 'coordonnees'> =
    ['eligibilite', 'formulaire', 'situation', 'coordonnees'];
  step: 'eligibilite' | 'formulaire' | 'situation' | 'coordonnees' | 'confirmation' = 'eligibilite';

  eligibiliteChoice: 'oui' | 'non' | 'inconnu' | null = null;

  // Données du formulaire (étape 2)
  typePersonne: 'particulier' | 'professionnel' = 'particulier';
  mission: string = '';
  attentes: string[] = [];
  urgent: 'oui' | 'non' | null = null;

  missionOptions = [
    'Consultation juridique',
    'Rédaction de contrat',
    'Lancer une procédure',
    'Représentation en justice',
    'Médiation / négociation',
    'Suivi de procédure en cours',
    'Autre'
  ];
  attentesOptions = ['À l\'écoute', 'Disponible', 'Combattif', 'Efficace', 'Abordable'];

  // Données de situation (étape 3)
  situation: string = '';
  readonly SITUATION_MIN_LENGTH = 30;

  // Données de coordonnées (étape 4)

  nomComplet: string = '';
  indicatifTelephone: string = '+237';
  telephone: string = '';
  email: string = '';
  ville: string = '';
  villesOptions: string[] = [];
  contactPreference: 'mail_telephone' | 'mail' | 'telephone' = 'mail_telephone';

  // Données de rendez-vous (étape 4) — requises par le backend
  // (ConsultationCreateRequest.dateRendezVous et .modeConsultation sont @NotNull/@NotBlank)
  modeConsultation: ModeConsultation | null = null;
  dateRendezVousJour: string = '';   // "YYYY-MM-DD" (ex: valeur d'un <input type="date">)
  dateRendezVousHeure: string = '';  // "HH:mm" (ex: valeur d'un <input type="time">)

  private readonly modeToBackend: Record<ModeConsultation, string> = {
    visio: 'visioconférence',
    telephone: 'téléphone',
    cabinet: 'présentiel',
  };

  // --- Sélecteur d'indicatif téléphonique ---
  isCountryDropdownOpen = false;
  countrySearch = '';

  readonly countries: CountryCode[] = [
    { name: 'Cameroon', code: 'CM', dial: '+237', flag: '🇨🇲' },
    { name: 'France', code: 'FR', dial: '+33', flag: '🇫🇷' },
    { name: 'Senegal', code: 'SN', dial: '+221', flag: '🇸🇳' },
    { name: 'Algeria', code: 'DZ', dial: '+213', flag: '🇩🇿' },
    { name: 'Ivory Coast', code: 'CI', dial: '+225', flag: '🇨🇮' },
    { name: 'Nigeria', code: 'NG', dial: '+234', flag: '🇳🇬' },
    { name: 'Gabon', code: 'GA', dial: '+241', flag: '🇬🇦' },
    { name: 'Belgium', code: 'BE', dial: '+32', flag: '🇧🇪' },
    { name: 'Canada', code: 'CA', dial: '+1', flag: '🇨🇦' },
    { name: 'Morocco', code: 'MA', dial: '+212', flag: '🇲🇦' },
  ];

  selectedCountry: CountryCode = this.countries[0]; // Cameroon par défaut

  get filteredCountries(): CountryCode[] {
    const term = this.countrySearch.trim().toLowerCase();
    if (!term) return this.countries;
    return this.countries.filter(c =>
      c.name.toLowerCase().includes(term) || c.dial.includes(term)
    );
  }

  onCitySelected(city: City): void {
    this.ville = city.cityName;
  }
  toggleCountryDropdown(): void {
    this.isCountryDropdownOpen = !this.isCountryDropdownOpen;
    if (this.isCountryDropdownOpen) this.countrySearch = '';
  }

  selectCountry(country: CountryCode): void {
    this.selectedCountry = country;
    this.indicatifTelephone = country.dial;
    this.isCountryDropdownOpen = false;
  }

  closeCountryDropdown(): void {
    this.isCountryDropdownOpen = false;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private avocatService: AvocatService,
    private consultationService: ConsultationService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.avocatId = this.route.snapshot.paramMap.get('id')!;
    this.flowType = (this.route.snapshot.queryParamMap.get('type') as 'message' | 'consultation') || 'message';

    this.avocatService.getById(this.avocatId).subscribe({
      next: (data: any) => {
        this.ngZone.run(() => {
          this.avocat = data;
          this.isLoading = false;
          if (data?.ville) {
            this.ville = data.ville;
            this.villesOptions = [data.ville];
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Erreur chargement avocat:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  hasValidPhoto(): boolean {
    const photo = this.avocat?.photo;
    return !!photo && photo.trim().length > 0;
  }

  get fallbackPhoto(): string {
    const nom = (this.avocat?.nom || '').toLowerCase();
    if (nom.includes('durand')) return 'images/durand.jpeg';
    if (nom.includes('cohen')) return 'images/cohen.jpeg';
    if (nom.includes('moreau')) return 'images/moreau.jpeg';
    return 'images/dupont.jpeg';
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.fallbackPhoto;
  }

  // --- Progression ---
  get currentStepIndex(): number {
    return this.steps.indexOf(this.step as any);
  }

  get progressPercent(): number {
    if (this.step === 'confirmation') return 100;
    return ((this.currentStepIndex + 1) / this.steps.length) * 100;
  }

  // --- Étape 1 : Éligibilité ---
  onSelectEligibilite(choice: 'oui' | 'non' | 'inconnu'): void {
    this.eligibiliteChoice = choice;
    this.step = 'formulaire';
  }

  // --- Étape 2 : Formulaire ---
  toggleAttente(option: string): void {
    const index = this.attentes.indexOf(option);
    if (index > -1) {
      this.attentes.splice(index, 1);
    } else if (this.attentes.length < 2) {
      this.attentes.push(option);
    }
  }

  isAttenteSelected(option: string): boolean {
    return this.attentes.includes(option);
  }

  isAttenteDisabled(option: string): boolean {
    return this.attentes.length >= 2 && !this.isAttenteSelected(option);
  }

  isFormValid(): boolean {
    return !!this.mission && !!this.urgent;
  }

  onSuivant(): void {
    if (!this.isFormValid()) return;
    this.step = 'situation';
  }

  // --- Étape 3 : Situation ---
  get situationLength(): number {
    return this.situation.length;
  }

  isSituationValid(): boolean {
    return this.situation.trim().length >= this.SITUATION_MIN_LENGTH;
  }

  onSuivantSituation(): void {
    if (!this.isSituationValid()) return;
    this.step = 'coordonnees';
  }

  // --- Étape 4 : Coordonnées ---
  isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  isTelephoneValid(): boolean {
    return this.telephone.trim().length >= 8;
  }

  isRendezVousValid(): boolean {
    return !!this.modeConsultation
      && !!this.dateRendezVousJour
      && !!this.dateRendezVousHeure;
  }

  isCoordonneesValid(): boolean {
    return !!this.nomComplet.trim()
      && this.isTelephoneValid()
      && this.isEmailValid()
      && !!this.ville
      && this.isRendezVousValid();
  }

  isSubmitting = false;

  private buildDateRendezVous(): string {
    // dateRendezVousJour: "YYYY-MM-DD", dateRendezVousHeure: "HH:mm"
    // Backend expects a LocalDateTime-compatible string, e.g. "2026-08-05T14:00:00"
    const heure = this.dateRendezVousHeure.length === 5
      ? `${this.dateRendezVousHeure}:00`
      : this.dateRendezVousHeure;
    return `${this.dateRendezVousJour}T${heure}`;
  }

  onSuivantCoordonnees(): void {
    if (!this.isCoordonneesValid() || this.isSubmitting) return;

    const payload: ConsultationCreateRequest = {
      avocatId: Number(this.avocatId),
      flowType: this.flowType,
      eligibilite: this.eligibiliteChoice,
      typePersonne: this.typePersonne,
      mission: this.mission,
      attentes: this.attentes,
      urgent: this.urgent,
      situation: this.situation,
      nomComplet: this.nomComplet,
      telephone: `${this.indicatifTelephone} ${this.telephone}`,
      email: this.email,
      ville: this.ville,
      contactPreference: this.contactPreference,
      dateRendezVous: this.buildDateRendezVous(),
      modeConsultation: this.modeToBackend[this.modeConsultation as ModeConsultation],
    };

    this.isSubmitting = true;

    this.consultationService.envoyerDemande(payload).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.isSubmitting = false;
          this.step = 'confirmation';
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Erreur envoi demande:', err);
          this.isSubmitting = false;
          // TODO: afficher un message d'erreur à l'utilisateur
          this.cdr.detectChanges();
        });
      }
    });
  }

  // --- Étape 5 : Confirmation ---
  onContacterAutresAvocats(): void {
    this.router.navigate(['/avocats'], {
      queryParams: this.ville ? { ville: this.ville } : {}
    });
  }

  onRetourDashboard(): void {
    this.router.navigate(['/client/dashboard']);
  }

  // --- Navigation arrière ---
  onPrecedent(): void {
    if (this.step === 'coordonnees') {
      this.step = 'situation';
    } else if (this.step === 'situation') {
      this.step = 'formulaire';
    } else if (this.step === 'formulaire') {
      this.step = 'eligibilite';
    } else {
      window.history.back();
    }
  }
}