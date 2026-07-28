import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Disponibilite {
  id?: number;
  jour: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  heureDebut: string; // format "09:00:00"
  heureFin: string;
}

@Injectable({ providedIn: 'root' })
export class DisponibiliteService {
  private baseUrl = 'http://localhost:8081/api/avocat/disponibilites';

  constructor(private http: HttpClient) {}

  getMesDisponibilites(): Observable<Disponibilite[]> {
    return this.http.get<Disponibilite[]>(this.baseUrl);
  }

  enregistrerDisponibilites(disponibilites: Disponibilite[]): Observable<Disponibilite[]> {
    return this.http.post<Disponibilite[]>(this.baseUrl, disponibilites);
  }
}