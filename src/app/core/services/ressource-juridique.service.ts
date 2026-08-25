import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RessourceJuridique {
  id: number;
  titre: string;
  auteur: string;
  description: string;
  specialiteNom: string;
  specialiteId: number;
  cheminFichier: string;
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
export class RessourceJuridiqueService {
  private baseUrl = `${environment.apiUrl}/ressources`;

  constructor(private http: HttpClient) {}

  getAll(specialiteId?: number, page = 0, size = 20): Observable<PageResponse<RessourceJuridique>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (specialiteId) {
      params = params.set('specialiteId', String(specialiteId));
    }

    return this.http.get<PageResponse<RessourceJuridique>>(this.baseUrl, { params });
  }

  getFichierUrl(cheminFichier: string): string {
    return `${environment.apiUrl.replace('/api/v1', '')}${cheminFichier}`;
  }
}