export enum StatutAvocatEnum {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE'
}

export interface SpecialiteDroit {
  id: number;
  nom: string;
}

export interface Avocat {
  id: number;
  prenom: string;
  nom: string;
  specialites: string[];   // <-- corrigé : pluriel + tableau (correspond au backend)
  ville: string;
  tarif: number;
  noteMoyenne: number;
  photo: string | null;
  statut: StatutAvocatEnum;
  bio?: string;
  experience?: number;
  adresseCabinet?: string;
}

export interface AvocatPageResponse {
  content: Avocat[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AvocatFilters {
  specialite?: string;
  ville?: string;
  type?: string;
}

export interface AvocatUpdateRequest {
  prenom?: string;
  nom?: string;
  telephone?: string;
  specialiteIds?: number[];
  bio?: string;
  lienAgenda?: string;
  diplome?: string;
  carteProfessionnel?: string;
  pieceIdentite?: string;
  photo?: string;
  adresseCabinet?: string;
  ville?: string;
  tarif?: number;
  experience?: number;
}