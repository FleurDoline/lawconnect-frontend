import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

export interface DemandeConsultation {
  id: number;
  nomComplet: string;
  telephone: string;
  email: string;
  ville: string;
  typePersonne: string;
  mission: string;
  situation: string;
  attentes: string[];
  urgent: string; // 'oui' | 'non'
  statut: string; // ex: 'EN_ATTENTE', 'CONFIRMEE', 'TERMINEE', 'ANNULEE'
  createdAt: string; // ISO string
}

export interface ConsultationAcceptRequest {
  dateRendezVous: string; // ISO datetime string, e.g. "2026-07-20T14:30:00"
  modeConsultation: 'visioconférence' | 'présentiel';
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

  getMesDemandes(): Observable<DemandeConsultation[]> {
    return this.http.get<DemandeConsultation[]>(`${this.baseUrl}/mes-demandes`);
  }

  accepterDemande(id: number, payload: ConsultationAcceptRequest): Observable<ConsultationResponse> {
    return this.http.patch<ConsultationResponse>(`${this.baseUrl}/${id}/accepter`, payload);
  }
}