export const ESTADOS_HABITACION = [
  'disponible',
  'ocupada',
  'mantenimiento',
  'fuera_de_servicio',
] as const;

export type HabitacionEstado = (typeof ESTADOS_HABITACION)[number];

export const ESTADOS_FUERA_DE_SERVICIO: HabitacionEstado[] = [
  'fuera_de_servicio',
  'mantenimiento',
];
