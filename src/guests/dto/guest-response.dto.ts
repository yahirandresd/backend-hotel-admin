import { Guest } from '../entities/guest.entity';

export interface GuestResponseDto {
  id:                number;
  docType:           string;
  docNum:            string;
  nombre:            string;
  apellido:          string;
  fechaNac:          string;
  ciudadResidencia?: string;
  ciudadOrigen?:     string;
  tel1?:             string;
  tel2?:             string;
  vacuna:            string;
  esTitular:         boolean;
  reservationId:      number;
  reservationEstado?: string;
  fechaIngreso?:      string;
  fechaSalida?:       string;
}

export function toGuestResponse(guest: Guest): GuestResponseDto {
  return {
    id:               guest.id,
    docType:          guest.docType,
    docNum:           guest.docNum,
    nombre:           guest.nombre,
    apellido:         guest.apellido,
    fechaNac:         guest.fechaNac,
    ciudadResidencia: guest.ciudadResidencia,
    ciudadOrigen:     guest.ciudadOrigen,
    tel1:             guest.tel1,
    tel2:             guest.tel2,
    vacuna:           guest.vacuna,
    esTitular:        guest.esTitular,
    reservationId:    guest.reservationId,
    reservationEstado: guest.reservation?.estado,
    fechaIngreso:      guest.reservation?.fechaIngreso,
    fechaSalida:       guest.reservation?.fechaSalida,
  };
}