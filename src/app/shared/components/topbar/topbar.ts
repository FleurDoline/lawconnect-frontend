import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class TopbarComponent {
  @Input() brandName = 'LawConnect';
  @Input() brandTagline = 'Portail Juridique';
  @Input() searchPlaceholder = 'Rechercher un dossier, un avocat ou un document...';

  @Input() userName = '';
  @Input() userPlan = '';
  @Input() userPhotoUrl: string | null = null; // NEW
  @Input() navItems: TopbarNavItem[] = [];

  @Output() navSelect = new EventEmitter<TopbarNavItem>();

  menuOpen = false;

  constructor(private host: ElementRef) {}

  toggleMenu(e: MouseEvent) {
    e.stopPropagation();
    this.menuOpen = !this.menuOpen;
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
    if (!this.host.nativeElement.contains(e.target)) this.menuOpen = false;
  }
}