import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
// TODO: adapte le chemin d'import à ta structure (environments/environment)
import { environment } from '../../../environments/environment';
import {
  AdminStatsResponse,
  AvocatResponse,
  AvocatSummaryResponse,
  PageResponse,
  StatutAvocatEnum,
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly baseAvocats = `${environment.apiUrl}/avocats`;
  private readonly baseAdmins = `${environment.apiUrl}/admins`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStatsResponse> {
    return this.http.get<AdminStatsResponse>(`${this.baseAdmins}/stats`);
  }

  getAvocatsByStatut(
    statut: StatutAvocatEnum,
    page = 0,
    size = 10
  ): Observable<PageResponse<AvocatSummaryResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PageResponse<AvocatSummaryResponse>>(
      `${this.baseAvocats}/statut/${statut}`,
      { params }
    );
  }

  getAvocatById(id: number): Observable<AvocatResponse> {
    return this.http.get<AvocatResponse>(`${this.baseAvocats}/${id}`);
  }

  updateStatutAvocat(id: number, statut: StatutAvocatEnum): Observable<AvocatResponse> {
    const params = new HttpParams().set('statut', statut);
    return this.http.patch<AvocatResponse>(`${this.baseAvocats}/${id}/statut`, null, { params });
  }
}