import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type FormuleAbonnement = 'BASIC' | 'STANDARD' | 'PREMIUM';
export type CycleAbonnement = 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL';
export type StatutPaiement = 'EN_ATTENTE' | 'PAYE' | 'EXPIRE' | 'ANNULE' | 'ECHOUE';

export interface Abonnement {
  id: number;
  reference: string;
  formule: FormuleAbonnement;
  cycle: CycleAbonnement;
  montant: number;
  statut: StatutPaiement;
  prochainRenouvellement: string; // format ISO "2026-06-01"
  createdAt: string;
  updatedAt: string;
  avocatId: number;
  avocatFullName: string;
  avocatEmail: string;
}

export interface AbonnementCreateRequest {
  formule: FormuleAbonnement;
  cycle: CycleAbonnement;
  montant: number;
  avocatId: number;
}

@Injectable({ providedIn: 'root' })
export class AbonnementService {
  private baseUrl = `${environment.apiUrl}/abonnements`;

  constructor(private http: HttpClient) {}

  getActiveAbonnement(avocatId: number): Observable<Abonnement> {
    return this.http.get<Abonnement>(`${this.baseUrl}/avocat/${avocatId}/actif`);
  }

  getAbonnementsByAvocat(avocatId: number): Observable<Abonnement[]> {
    return this.http.get<Abonnement[]>(`${this.baseUrl}/avocat/${avocatId}`);
  }

  createAbonnement(payload: AbonnementCreateRequest): Observable<Abonnement> {
    return this.http.post<Abonnement>(this.baseUrl, payload);
  }
}