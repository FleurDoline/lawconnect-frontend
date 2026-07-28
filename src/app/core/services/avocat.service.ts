import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AvocatFilters, AvocatPageResponse, AvocatUpdateRequest } from '../models/avocat.model';

@Injectable({ providedIn: 'root' })
export class AvocatService {
  private baseUrl = `${environment.apiUrl}/avocats`;

  constructor(private http: HttpClient) {}

  rechercher(filters: AvocatFilters, page: number = 0, size: number = 10): Observable<AvocatPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (filters.specialite) {
      params = params.set('specialites', filters.specialite);
    }
    if (filters.ville) {
      params = params.set('ville', filters.ville);
    }
    return this.http.get<AvocatPageResponse>(this.baseUrl, { params });
  }

  getById(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  getByUserId(userId: string | number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/by-user-id/${userId}`);
  }

  update(id: string | number, request: AvocatUpdateRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, request);
  }

  uploadPhoto(avocatId: number, file: File): Observable<string> {
  const formData = new FormData();
  formData.append('file', file);

  return this.http.post(
    `${environment.apiUrl}/avocats/${avocatId}/photo`,
    formData,
    { responseType: 'text' }
  );
}
}