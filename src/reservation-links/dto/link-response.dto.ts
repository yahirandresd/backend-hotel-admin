 import { ReservationLink } from '../entities/reservation-link.entity';

export interface LinkResponseDto {
  id:             number;
  code:           string;
  url:            string;
  reservationId?: number;
  usado:          boolean;
  createdAt:      Date;
}

export function toLinkResponse(link: ReservationLink, baseUrl: string): LinkResponseDto {
  return {
    id:            link.id,
    code:          link.code,
    url:           `${baseUrl}/${link.code}`,
    reservationId: link.reservationId,
    usado:         !!link.reservationId,
    createdAt:     link.createdAt,
  };
}