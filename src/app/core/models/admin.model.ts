export enum StatutAvocatEnum {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  SUSPENDU = 'SUSPENDU',
  REJETE = 'REJETE',
}

export interface AvocatSummaryResponse {
  id: number;
  prenom: string;
  nom: string;
  specialites: string[];
  ville: string;
  tarif: number;
  noteMoyenne: number;
  photo: string;
  statut: StatutAvocatEnum;
  telephone: string;
  bio: string;
  experience: number;
  gereDisponibilites: boolean;
  diplome: string | null;
  carteProfessionnel: string | null;
  pieceIdentite: string | null;
}

export interface AvocatResponse {
  id: number;
  userId: number;
  fullName: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  validAt: string | null;
  validBy: number | null;
  lienAgenda: string | null;
  specialites: string[];
  carteProfessionnel: string | null;
  diplome: string | null;
  pieceIdentite: string | null;
  bio: string;
  tarif: number;
  experience: number;
  photo: string;
  statut: StatutAvocatEnum;
  noteMoyenne: number;
  adresseCabinet: string;
  ville: string;
  progression: number;
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

export interface AdminStatsResponse {
  totalAvocats: number;
  avocatsValides: number;
  avocatsEnAttente: number;
  tauxConversion: number;
  abonnementsActifs: number;
}