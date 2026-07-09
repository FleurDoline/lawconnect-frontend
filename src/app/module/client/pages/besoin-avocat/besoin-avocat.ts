import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AvocatService } from '../../../../core/services/avocat.service';

@Component({
  selector: 'app-besoin-avocat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './besoin-avocat.html',
  styleUrls: ['./besoin-avocat.scss']
})
export class BesoinAvocatComponent implements OnInit {
  avocat: any;
  flowType: 'message' | 'consultation' = 'message';
  avocatId!: string;
  eligibiliteChoice: 'oui' | 'non' | 'inconnu' | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private avocatService: AvocatService,
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
    return !!photo && photo.startsWith('http');
  }

  onSelectEligibilite(choice: 'oui' | 'non' | 'inconnu'): void {
    this.eligibiliteChoice = choice;
    console.log('Éligibilité sélectionnée:', choice);
  }

  onPrecedent(): void {
    // à adapter : navigation vers la page précédente réelle (ex: retour au profil avocat)
    window.history.back();
  }
}