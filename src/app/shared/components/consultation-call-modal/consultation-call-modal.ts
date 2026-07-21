import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConsultationCallInfo {
  contactNom: string;
  contactSpecialite?: string;
  contactTelephone: string | null;
  dateRendezVous: string;
  heureRendezVous: string;
}

@Component({
  selector: 'app-consultation-call-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consultation-call-modal.html',
  styleUrls: ['./consultation-call-modal.scss']
})
export class ConsultationCallModalComponent {
  @Input() isOpen = false;
  @Input() callInfo: ConsultationCallInfo | null = null;

  @Output() closeModal = new EventEmitter<void>();

  onClose(): void {
    this.closeModal.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  get hasPhone(): boolean {
    return !!this.callInfo?.contactTelephone?.trim();
  }

  get telHref(): string {
    if (!this.callInfo) return '';
    if (!this.callInfo.contactTelephone) return '';
    const cleaned = this.callInfo.contactTelephone.replace(/[^\d+]/g, '');
    return `tel:${cleaned}`;
  }
}