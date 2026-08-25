import { Component, ElementRef, EventEmitter, HostListener, Input, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationResponse } from '../../../core/services/notification.service';

export interface TopbarNavItem {
  label: string;
  icon: string;
  route?: string;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.html',
  styleUrls: ['./topbar.scss'],
})
export class TopbarComponent implements OnInit {
  @Input() brandName = 'LawConnect';
  @Input() brandTagline = 'Portail Juridique';
  @Input() searchPlaceholder = 'Rechercher un dossier, un avocat ou un document...';

  @Input() userName = '';
  @Input() userPlan = '';
  @Input() userPhotoUrl: string | null = null;
  @Input() navItems: TopbarNavItem[] = [];

  @Output() navSelect = new EventEmitter<TopbarNavItem>();

  menuOpen = false;

  // ---- Notifications ----
  notifOpen = false;
  unreadCount = 0;
  notifications: NotificationResponse[] = [];
  loadingNotifs = false;

  constructor(
    private host: ElementRef,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerUnreadCount();
  }

  private chargerUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (res) => {
        this.unreadCount = res.count;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur unread-count:', err),
    });
  }

  toggleMenu(e: MouseEvent) {
    e.stopPropagation();
    this.notifOpen = false;
    this.menuOpen = !this.menuOpen;
  }

  // Ouvre le dropdown notifications — appelable en interne (clic cloche)
  // et depuis l'extérieur via @ViewChild (carte dashboard)
  toggleNotifs(e?: MouseEvent) {
    e?.stopPropagation();
    this.menuOpen = false;
    this.notifOpen = !this.notifOpen;

    if (this.notifOpen) {
      this.chargerNotifications();
    }
  }

  openNotifications(): void {
    this.notifOpen = true;
    this.menuOpen = false;
    this.chargerNotifications();
  }

  private chargerNotifications(): void {
    this.loadingNotifs = true;
    this.notificationService.getNotifications(0, 10).subscribe({
      next: (res) => {
        this.notifications = res.content;
        this.loadingNotifs = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement notifications:', err);
        this.loadingNotifs = false;
        this.cdr.detectChanges();
      },
    });
  }

  marquerCommeLue(n: NotificationResponse): void {
    if (n.read) return;
    this.notificationService.markAsRead(n.id).subscribe({
      next: () => {
        n.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur markAsRead:', err),
    });
  }

  toutMarquerCommeLu(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => (n.read = true));
        this.unreadCount = 0;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur markAllAsRead:', err),
    });
  }

  selectNav(item: TopbarNavItem) {
    this.menuOpen = false;
    this.navSelect.emit(item);
  }

  get initials(): string {
    return this.userName
      .trim()
      .split(/\s+/)
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.host.nativeElement.contains(e.target)) {
      this.menuOpen = false;
      this.notifOpen = false;
    }
  }
}