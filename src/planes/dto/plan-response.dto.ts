import { Plan } from '../entities/plan.entity';

export interface PlanActividadResponseDto {
  id:          number;
  actividadId: number;
  nombre:      string;
  precio:      number;
  cantidad:    number;
}

export interface PlanServicioResponseDto {
  id:         number;
  servicioId: number;
  nombre:     string;
  precio:     number;
  cantidad:   number;
}

export interface PlanResponseDto {
  id:            number;
  nombre:        string;
  descripcion?:  string;
  precioPersona: number;
  maxPersonas?:  number;
  noches:        number;
  activo:        boolean;
  actividades:   PlanActividadResponseDto[];
  servicios:     PlanServicioResponseDto[];
  createdAt:     Date;
}

export function toPlanResponse(plan: Plan): PlanResponseDto {
  return {
    id:            plan.id,
    nombre:        plan.nombre,
    descripcion:   plan.descripcion,
    precioPersona: Number(plan.precioPersona),
    maxPersonas:   plan.maxPersonas,
    noches:        plan.noches,
    activo:      plan.activo,
    createdAt:   plan.createdAt,
    actividades: plan.actividades?.map((pa) => ({
      id:          pa.id,
      actividadId: pa.actividadId,
      nombre:      pa.actividad?.nombre ?? '',
      precio:      Number(pa.actividad?.precio ?? 0),
      cantidad:    pa.cantidad,
    })) ?? [],
    servicios: plan.servicios?.map((ps) => ({
      id:         ps.id,
      servicioId: ps.servicioId,
      nombre:     ps.servicio?.nombre ?? '',
      precio:     Number(ps.servicio?.precio ?? 0),
      cantidad:   ps.cantidad,
    })) ?? [],
  };
}