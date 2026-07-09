import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Step {
  icon: 'search' | 'handshake' | 'video' | 'shield';
  title: string;
  description: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.scss'
})
export class HowItWorks {
  steps: Step[] = [
    {
      icon: 'search',
      title: 'Decrivez votre besoin',
      description: 'Quelques questions suffisent pour cerner votre situation juridique'
    },
    {
      icon: 'handshake',
      title: 'Choisissez votre avocat',
      description: 'Comparez les profils, specialites et avis. Reservez en un instant'
    },
    {
      icon: 'video',
      title: 'Consultez en ligne',
      description: 'Echanger en viso ou au cabinet'
    },
    {
      icon: 'shield',
      title: 'Suivez votre document',
      description: 'Notification, paiements securises et historique complet'
    }
  ];
}