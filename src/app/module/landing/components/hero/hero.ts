import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SearchModalComponent } from '../search-modal/search-modal';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, CommonModule, SearchModalComponent],
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class HeroComponent {
  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }
}