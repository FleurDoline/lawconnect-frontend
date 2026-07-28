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
  fullName: string;
  email: string;
  telephone?: string;
  lienAgenda?: string;
  specialites: string[];
  ville: string;
  tarif: number;
  noteMoyenne: number;
  photo: string | null;
  statut: StatutAvocatEnum;
  bio?: string;
  experience?: number;
  adresseCabinet?: string;
  progression?: number;
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
  fullName?: string;
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