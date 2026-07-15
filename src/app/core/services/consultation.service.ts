import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environnment';

export interface ConsultationCreateRequest {
  avocatId: number;
  flowType: 'message' | 'consultation';
  eligibilite: string | null;
  typePersonne: string;
  mission: string;
  attentes: string[];
  urgent: string | null;
  situation: string;
  nomComplet: string;
  telephone: string;
  email: string;
  ville: string;
  contactPreference: string;
  
}

export interface ConsultationDetail {
  id: number;
  avocatNom: string;
  avocatInitiales: string;
  specialite: string;
  date: string;
  heure: string;
  statut: 'CONFIRMEE' | 'EN_ATTENTE' | 'TERMINEE' | 'ANNULEE';
  flowType: string;
  eligibilite: string;
  typePersonne: string;
  mission: string;
  attentes: string[];
  urgent: string;
  situation: string;
  nomComplet: string;
  telephone: string;
  email: string;
  ville: string;
  contactPreference: string;
}

export interface ConsultationResponse {
  id: number;
  statut: string;
  message: string;
}

export interface ConsultationSummary {
  id: number;
  avocatNom: string;
  avocatInitiales: string;
  specialite: string;
  date: string;
  statut: 'CONFIRMEE' | 'EN_ATTENTE' | 'TERMINEE' | 'ANNULEE';
}

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private baseUrl = `${environment.apiUrl}/consultations`;

  constructor(private http: HttpClient) {}

  envoyerDemande(payload: ConsultationCreateRequest): Observable<ConsultationResponse> {
    return this.http.post<ConsultationResponse>(this.baseUrl, payload);
  }

  getMesConsultations(): Observable<ConsultationSummary[]> {
    return this.http.get<ConsultationSummary[]>(`${this.baseUrl}/mes-consultations`);
  }

  getDetails(id: number): Observable<ConsultationDetail> {
    return this.http.get<ConsultationDetail>(`${this.baseUrl}/${id}`);
  }
}