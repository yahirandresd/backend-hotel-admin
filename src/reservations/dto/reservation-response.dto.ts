import { Reservation } from '../entities/reservation.entity';
import { GuestResponseDto, toGuestResponse } from '../../guests/dto/guest-response.dto';
import { PagoResponseDto, toPagoResponse } from '../../pagos/dto/pago-response.dto';

export interface PlanResumenDto {
  id:            number;
  nombre:        string;
  precioPersona: number;
  maxPersonas?:  number;
  noches:        number;
}

export interface ReservationResponseDto {
  id:             number;
  titularDocNum:  string;
  fechaIngreso:   string;
  fechaSalida:    string;
  motivo:         string;
  estado:         string;
  canalOrigen:    string;
  precioTotal:    number;
  planId?:        number;
  plan?:          PlanResumenDto;
  notas?:         string;
  aceptaTerminos: boolean;
  createdAt:      Date;
  updatedAt:      Date;
  titular:        GuestResponseDto | null;
  guests:         GuestResponseDto[];
  pagos:          PagoResponseDto[];
}

export function toReservationResponse(reservation: Reservation): ReservationResponseDto {
  const guests = reservation.guests?.map(toGuestResponse) ?? [];

  const plan: PlanResumenDto | undefined = reservation.plan
    ? {
        id:            reservation.plan.id,
        nombre:        reservation.plan.nombre,
        precioPersona: Number(reservation.plan.precioPersona),
        maxPersonas:   reservation.plan.maxPersonas,
        noches:        reservation.plan.noches,
      }
    : undefined;

  return {
    id:             reservation.id,
    titularDocNum:  reservation.titularDocNum,
    fechaIngreso:   reservation.fechaIngreso,
    fechaSalida:    reservation.fechaSalida,
    motivo:         reservation.motivo,
    estado:         reservation.estado,
    canalOrigen:    reservation.canalOrigen,
    precioTotal:    Number(reservation.precioTotal),
    planId:         reservation.planId,
    plan,
    notas:          reservation.notas,
    aceptaTerminos: reservation.aceptaTerminos,
    createdAt:      reservation.createdAt,
    updatedAt:      reservation.updatedAt,
    titular:        guests.find((g) => g.esTitular) ?? null,
    guests,
    pagos:          reservation.pagos?.map(toPagoResponse) ?? [],
  };
}