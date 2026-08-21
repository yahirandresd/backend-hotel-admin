import { Hotel } from '../hotel/entities/hotel.entity';
import { TipoHabitacion } from '../tipo-habitacion/entities/tipo-habitacion.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { Plan } from '../planes/entities/plan.entity';
import { Requisito } from '../requisitos/entities/requisito.entity';
import { HuespedRequisito } from '../requisitos/entities/huesped-requisito.entity';
import { Guest } from '../guests/entities/guest.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { HuespedReservacion } from '../reservations/entities/huesped-reservacion.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { ReservationLink } from '../reservation-links/entities/reservation-link.entity';

// Fuente única de la lista de entidades — usada por database.config.ts (runtime)
// y por data-source.ts (CLI de migraciones), para que nunca se desincronicen.
// `Reporte` (src/reportes/entities/reporte.entity.ts) no lleva @Entity — es un stub
// muerto, no se registra.
export const ENTITIES = [
  Hotel,
  TipoHabitacion,
  Habitacion,
  Plan,
  Requisito,
  HuespedRequisito,
  Guest,
  Reservation,
  HuespedReservacion,
  Pago,
  ReservationLink,
];
