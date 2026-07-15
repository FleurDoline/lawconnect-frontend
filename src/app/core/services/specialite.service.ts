import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SpecialiteDroit {
  id: number;
  nom: string;
}

@Injectable({ providedIn: 'root' })
export class SpecialiteService {
  private baseUrl = 'http://localhost:8081/api/specialites';

  constructor(private http: HttpClient) {}

  search(query: string): Observable<SpecialiteDroit[]> {
    return this.http.get<SpecialiteDroit[]>(this.baseUrl, { params: { query } });
  }
}