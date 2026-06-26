export const ESTADOS_RESERVACION = [
  'pendiente',
  'confirmada',
  'check_in',
  'check_out',
  'cancelada',
  'no_show',
] as const;

export type ReservacionEstado = (typeof ESTADOS_RESERVACION)[number];

export const ESTADOS_QUE_LIBERAN_HABITACION: ReservacionEstado[] = [
  'check_out',
  'cancelada',
  'no_show',
];

export const ESTADOS_ACTIVOS: ReservacionEstado[] = [
  'pendiente',
  'confirmada',
  'check_in',
];
