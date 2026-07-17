export enum StatutConsultationEnum {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRMEE = 'CONFIRMEE',
  TERMINEE = 'TERMINEE',
  ANNULEE = 'ANNULEE',
}

export interface ConsultationAvocatSummary {
  id: number;
  nomComplet: string;
  telephone: string;
  email: string;
  ville: string;
  typePersonne: string;
  mission: string;
  situation: string;
  attentes: string[];
  urgent: string;
  statut: StatutConsultationEnum;
  createdAt: string; // ISO date string from LocalDateTime
}