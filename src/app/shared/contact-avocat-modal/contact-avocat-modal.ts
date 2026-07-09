import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contact-avocat-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-avocat-modal.html',
  styleUrls: ['./contact-avocat-modal.scss']
})
export class ContactAvocatModalComponent {
  @Input() avocatId!: number;
  @Input() avocatNom = '';
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  onClose(): void {
    this.close.emit();
  }

 envoyerMessage(): void {
  console.log('avocatId au clic:', this.avocatId);
  this.router.navigate(['/client/besoin-avocat', this.avocatId], {
    queryParams: { type: 'message' }
  }).then(success => console.log('Navigation réussie ?', success));
  this.onClose();
}

demanderConsultation(): void {
  this.router.navigate(['/client/besoin-avocat', this.avocatId], {
    queryParams: { type: 'consultation' }
  });
  this.onClose();
}
}