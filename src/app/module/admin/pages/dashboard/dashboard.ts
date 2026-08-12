import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration, ChartData, TooltipItem } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AdminApiService } from '..//../../../core/services/admin.api.service'; 
import { AvocatSummaryResponse, StatutAvocatEnum } from '../../../../core/models/admin.model'; 

interface UserMenuItem {
  icon: string;
  label: string;
  route?: string;
}

interface RevenuMensuel {
  mois: string;
  montant: number;
}

interface TacheATraiter {
  icon: 'check' | 'clock' | 'litige' | 'flag';
  label: string;
  count: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {

  adminNom = 'Jean Dupont';
  userName = 'Jean Dupont';
  userPlan = 'Administrateur';
  avocatPhoto: string | null = null;
  searchQuery = '';
  menuOpen = false;

  navItems: UserMenuItem[] = [
    { icon: 'dashboard', label: "Vue d'ensemble", route: '/admin/dashboard' },
    { icon: 'users', label: 'Avocats', route: '/admin/avocats' },
    { icon: 'users', label: 'Client', route: '/admin/clients' },
    { icon: 'card', label: 'Paiement', route: '/admin/paiements' },
    { icon: 'settings', label: 'Moderation', route: '/admin/moderation' },
    { icon: 'settings', label: 'Paramètre', route: '/admin/parametres' },
    { icon: 'logout', label: 'Déconnexion' }
  ];

  stats = {
    totalAvocats: 0,
    revenuMensuelFcfa: 0,
    abonnementsActifs: 0
  };

  // NEW: needed by loadStats(), were missing before
  statsLoading = false;
  statsError: string | null = null;

  revenus: RevenuMensuel[] = [
    { mois: 'JAN', montant: 120000 },
    { mois: 'FEV', montant: 230000 },
    { mois: 'MAR', montant: 310000 },
    { mois: 'AVR', montant: 240000 },
    { mois: 'MAI', montant: 190000 }
  ];

  tachesATraiter: TacheATraiter[] = [
    { icon: 'check', label: 'Avocats à vérifier', count: 7 },
    { icon: 'clock', label: 'Litiges ouverts', count: 3 },
    { icon: 'litige', label: 'Abonnement en attente', count: 12 },
    { icon: 'flag', label: 'Avis signalées', count: 2 }
  ];

  chartType: 'bar' = 'bar';

  chartData: ChartData<'bar'> = {
    labels: this.revenus.map(r => r.mois),
    datasets: [
      {
        data: this.revenus.map(r => r.montant),
        backgroundColor: '#c7d3e6',
        hoverBackgroundColor: '#aebfda',
        borderRadius: 6,
        maxBarThickness: 64
      }
    ]
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => `${Number(ctx.parsed.y).toLocaleString('fr-FR')} FCFA`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#7c8494', font: { size: 12 } }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 100000,
          color: '#7c8494',
          font: { size: 12 },
          callback: (value: string | number) => `${Number(value) / 1000}k`
        },
        grid: { color: '#e6e8ec' }
      }
    }
  };

  avocatsAValider: AvocatSummaryResponse[] = [];
  avocatsLoading = false;
  avocatsError: string | null = null;
  actionEnCours: Set<number> = new Set(); // pour désactiver les boutons pendant l'appel

  get nombreEnAttente(): number {
    return this.avocatsAValider.length;
  }

  constructor(
    private elementRef: ElementRef,
    private adminApi: AdminApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAvocatsEnAttente();
    this.loadStats();
  }

  loadStats(): void {
  this.statsLoading = true;
  this.statsError = null;

  this.adminApi.getStats().subscribe({
    next: (stats) => {
      this.stats.totalAvocats = stats.totalAvocats;
      this.stats.abonnementsActifs = stats.abonnementsActifs;
      this.statsLoading = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erreur chargement stats admin', err);
      this.statsError = 'Impossible de charger les statistiques.';
      this.statsLoading = false;
    }
  });
}

  loadAvocatsEnAttente(): void {
    this.avocatsLoading = true;
    this.avocatsError = null;

    this.adminApi.getAvocatsByStatut(StatutAvocatEnum.EN_ATTENTE, 0, 10).subscribe({
      next: (page) => {
        this.avocatsAValider = page.content;
        this.avocatsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement avocats en attente', err);
        this.avocatsError = 'Impossible de charger les avocats en attente.';
        this.avocatsLoading = false;
      }
    });
  }

  getDocumentNom(avocat: AvocatSummaryResponse): string {
    const path = avocat.diplome || avocat.carteProfessionnel || avocat.pieceIdentite;
    if (!path) return '—';
    return path.split('/').pop() ?? path;
  }

  getSpecialitesLabel(avocat: AvocatSummaryResponse): string {
    return avocat.specialites?.length ? avocat.specialites.join(', ') : '—';
  }

  onValider(avocat: AvocatSummaryResponse): void {
    this.setStatut(avocat, StatutAvocatEnum.VALIDE);
  }

  onRejeter(avocat: AvocatSummaryResponse): void {
    this.setStatut(avocat, StatutAvocatEnum.REJETE);
  }

  private setStatut(avocat: AvocatSummaryResponse, statut: StatutAvocatEnum): void {
    if (this.actionEnCours.has(avocat.id)) return;
    this.actionEnCours.add(avocat.id);

    this.adminApi.updateStatutAvocat(avocat.id, statut).subscribe({
      next: () => {
        this.avocatsAValider = this.avocatsAValider.filter(a => a.id !== avocat.id);
        this.actionEnCours.delete(avocat.id);
      },
      error: (err) => {
        console.error(`Erreur changement statut avocat ${avocat.id}`, err);
        this.actionEnCours.delete(avocat.id);
        // TODO: toast d'erreur si t'as un système de notifications
      }
    });
  }

  getInitiales(prenom: string, nom: string): string {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  selectNav(item: UserMenuItem): void {
    this.menuOpen = false;
    if (item.label === 'Déconnexion') return;
  }

  onSearch(): void {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.menuOpen = false;
    }
  }

  formatFcfa(montant: number): string {
    return `${montant.toLocaleString('fr-FR')} FCFA`;
  }

  hasDocument(avocat: AvocatSummaryResponse): boolean {
    return !!(avocat.diplome || avocat.carteProfessionnel || avocat.pieceIdentite);
  }
}