import { TipoHabitacion } from '../entities/tipo-habitacion.entity';

export interface TipoHabitacionResponseDto {
  id:          number;
  nombre:      string;
  descripcion?: string;
  capacidad:   number;
  precioBase:  number;
  createdAt:   Date;
}

export function toTipoHabitacionResponse(tipo: TipoHabitacion): TipoHabitacionResponseDto {
  return {
    id:          tipo.id,
    nombre:      tipo.nombre,
    descripcion: tipo.descripcion,
    capacidad:   tipo.capacidad,
    precioBase:  Number(tipo.precioBase),
    createdAt:   tipo.createdAt,
  };
}