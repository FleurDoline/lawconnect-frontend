import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environnment';
import { AvocatFilters, AvocatPageResponse } from '../models/avocat.model';

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
}