// core/services/current-avocat.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { AvocatService } from './avocat.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CurrentAvocatService {
  private photoSubject = new BehaviorSubject<string | null>(null);
  photo$ = this.photoSubject.asObservable();

  private loaded = false;

  constructor(
    private authService: AuthService,
    private avocatService: AvocatService
  ) {}

  load(): void {
    if (this.loaded) return; // fetch once per session, not once per page
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.loaded = true;
    this.avocatService.getByUserId(userId).subscribe({
      next: (avocat) => {
        this.photoSubject.next(avocat.photo ? environment.fileBaseUrl + avocat.photo : null);
      },
      error: (err) => console.error('Erreur lors du chargement du profil avocat', err),
    });
  }

  refresh(): void {
    this.loaded = false;
    this.load();
  }
}