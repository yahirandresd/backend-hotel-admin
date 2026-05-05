import { Servicio } from '../entities/servicio.entity';

export interface ServicioResponseDto {
  id:           number;
  nombre:       string;
  descripcion?: string;
  precio:       number;
  categoria:    string;
  activo:       boolean;
}

export function toServicioResponse(servicio: Servicio): ServicioResponseDto {
  return {
    id:          servicio.id,
    nombre:      servicio.nombre,
    descripcion: servicio.descripcion,
    precio:      Number(servicio.precio),
    categoria:   servicio.categoria,
    activo:      servicio.activo,
  };
}