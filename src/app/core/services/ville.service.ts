import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environnment';

export interface Ville {
  cityName: string;
  cityRegion: string;
}

@Injectable({ providedIn: 'root' })
export class VilleService {
  private baseUrl = `${environment.apiUrl}/villes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Ville[]> {
    return this.http.get<Ville[]>(this.baseUrl);
  }
}