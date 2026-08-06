import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  dateRendezVous: string; // format ISO "2026-08-03T14:00:00"
  modeConsultation: string;
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
  dateRendezVous: string | null;   
  modeConsultation: string; 
}

export interface ConsultationDetail {
  id: number;
  avocatNom: string;
  avocatInitiales: string;
  specialite: string;
  date: string;
  heure: string;
  statut: 'CONFIRMEE' | 'EN_ATTENTE' | 'TERMINEE' | 'ANNULEE';
  mode: 'visio' | 'telephone' | 'cabinet';
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
  heure: string;
  statut: 'CONFIRMEE' | 'EN_ATTENTE' | 'TERMINEE' | 'ANNULEE';
  mode: 'visio' | 'telephone' | 'cabinet';
  avocatTelephone: string;
  dateAfficheeIso: string;
}


// ---- Avocat listing (GET /api/v1/avocats) ----

export type StatutAvocat = 'EN_ATTENTE' | 'VALIDE' | 'SUSPENDU' | 'REJETE';

export interface AvocatSummary {
  id: number;
  prenom: string;
  nom: string;
  specialites: string[];
  ville: string;
  tarif: number;
  noteMoyenne: number;
  photo: string;
  statut: StatutAvocat;
  bio: string;
  experience: number;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private baseUrl = `${environment.apiUrl}/consultations`;
  private avocatsUrl = `${environment.apiUrl}/avocats`;

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

  accepterDemande(id: number): Observable<ConsultationResponse> {
    return this.http.patch<ConsultationResponse>(`${this.baseUrl}/${id}/accepter`, {});
  }

  refuserDemande(id: number): Observable<ConsultationResponse> {
    return this.http.patch<ConsultationResponse>(
       `${this.baseUrl}/${id}/refuser`,
     {}
    );
  }

  getAvocatsDisponibles(
    page = 0,
    size = 50,
    specialites?: string[],
    ville?: string
  ): Observable<PageResponse<AvocatSummary>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (specialites?.length) {
      specialites.forEach(s => (params = params.append('specialites', s)));
    }
    if (ville) {
      params = params.set('ville', ville);
    }

    return this.http.get<PageResponse<AvocatSummary>>(this.avocatsUrl, { params });
  }

  getCreneauxDisponibles(avocatId: number, date: string): Observable<string[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<string[]>(`${this.baseUrl}/avocats/${avocatId}/creneaux-disponibles`, { params });
  }

  getProchainsRendezVous(): Observable<DemandeConsultation[]> {
    return this.http.get<DemandeConsultation[]>(
    `${this.baseUrl}/prochains-rendez-vous`
    );
  }
}