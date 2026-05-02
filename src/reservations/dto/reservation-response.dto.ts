import { Reservation } from '../entities/reservation.entity';
import { GuestResponseDto, toGuestResponse } from '../../guests/dto/guest-response.dto';

export interface ReservationResponseDto {
  id:             number;
  titularDocNum:  string;
  fechaIngreso:   string;
  fechaSalida:    string;
  motivo:         string;
  aceptaTerminos: boolean;
  createdAt:      Date;
  updatedAt:      Date;
  titular:        GuestResponseDto | null;
  guests:         GuestResponseDto[];
}

export function toReservationResponse(reservation: Reservation): ReservationResponseDto {
  const guests = reservation.guests?.map(toGuestResponse) ?? [];

  return {
    id:             reservation.id,
    titularDocNum:  reservation.titularDocNum,
    fechaIngreso:   reservation.fechaIngreso,
    fechaSalida:    reservation.fechaSalida,
    motivo:         reservation.motivo,
    aceptaTerminos: reservation.aceptaTerminos,
    createdAt:      reservation.createdAt,
    updatedAt:      reservation.updatedAt,
    titular:        guests.find((g) => g.esTitular) ?? null,
    guests,
  };
}