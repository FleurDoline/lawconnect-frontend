import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AvisCreateRequest {
  consultationId: number;
  note: number;
  commentaire?: string;
}

export interface AvisResponse {
  id: number;
  consultationId: number;
  note: number;
  commentaire: string | null;
  nomClient: string;
  createdAt: string;
}

export interface NoteMoyenneResponse {
  moyenne: number | null;
  nombreAvis: number;
}

@Injectable({ providedIn: 'root' })
export class AvisService {
  private readonly baseUrl = `${environment.apiUrl}/avis`;

  constructor(private http: HttpClient) {}

  creerAvis(request: AvisCreateRequest): Observable<AvisResponse> {
    return this.http.post<AvisResponse>(this.baseUrl, request);
  }

  getAvisPourAvocat(avocatUserId: number): Observable<AvisResponse[]> {
    return this.http.get<AvisResponse[]>(`${this.baseUrl}/avocat/${avocatUserId}`);
  }

  getNoteMoyenne(avocatUserId: number): Observable<NoteMoyenneResponse> {
    return this.http.get<NoteMoyenneResponse>(`${this.baseUrl}/avocat/${avocatUserId}/moyenne`);
  }
}