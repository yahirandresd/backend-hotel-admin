import { Plan } from '../entities/plan.entity';

export interface PlanResponseDto {
  id:            number;
  nombre:        string;
  descripcion?:  string;
  precioPersona: number;
  maxPersonas?:  number;
  noches:        number;
  activo:        boolean;
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
    activo:        plan.activo,
    createdAt:     plan.createdAt,
  };
}
