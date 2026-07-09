import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ADD THIS IMPORT
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

interface Consultation {
  id: number;
  avocatNom: string;
  avocatInitiales: string;
  specialite: string;
  date: string;
  statut: 'confirme' | 'attente' | 'nouveau';
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule], // ADD FormsModule HERE
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class ClientDashboardComponent implements OnInit {
  clientNom = '';
  specialite = '';
  ville = '';

  dossiersActifs = 0;
  messagesNonLus = 0;
  prochaineConsultation: Consultation | null = null;

  consultationsRecentes: Consultation[] = [];

  loading = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // TODO: remplacer par appel réel à ton ClientService / DossierService / MessagerieService
    this.chargerDonneesMock();
  }

  private chargerDonneesMock(): void {
    setTimeout(() => {
      this.clientNom = 'Jean Dupont';
      this.dossiersActifs = 4;
      this.messagesNonLus = 7;

      this.prochaineConsultation = {
        id: 1,
        avocatNom: 'Anne Martin',
        avocatInitiales: 'AM',
        specialite: 'Immobilier',
        date: 'Demain à 14h30',
        statut: 'confirme'
      };

      this.consultationsRecentes = [
        { id: 1, avocatNom: 'Marc Lefebvre', avocatInitiales: 'ML', specialite: 'Immobilier', date: '12 Oct 2023, 10:00', statut: 'confirme' },
        { id: 2, avocatNom: 'Sophie Durand', avocatInitiales: 'SD', specialite: 'Famille', date: '05 Oct 2023, 15:30', statut: 'attente' },
        { id: 3, avocatNom: 'Pierre Bertrand', avocatInitiales: 'PB', specialite: 'Fiscalité', date: '28 Sep 2023, 09:00', statut: 'nouveau' }
      ];

      this.loading = false;
      this.cdr.detectChanges();
    }, 400);
  }

  rechercherAvocat(): void {
    this.router.navigate(['/avocat'], {
      queryParams: {
        specialite: this.specialite || undefined,
        ville: this.ville || undefined
      }
    });
  }

  ouvrirDossier(id: number): void {
    this.router.navigate(['/client/dossiers', id]);
  }

  ouvrirMessagerie(): void {
    this.router.navigate(['/client/messagerie']);
  }

  ouvrirDossiers(): void {
    this.router.navigate(['/client/dossiers']);
  }

  nouvelleConsultation(): void {
    this.router.navigate(['/consultation/nouvelle']);
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      confirme: 'Confirmée',
      attente: 'En attente',
      nouveau: 'Nouveau'
    };
    return labels[statut] || statut;
  }
}