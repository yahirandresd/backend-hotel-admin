import { Actividad } from '../entities/actividad.entity';
import { ActividadEvento } from '../entities/actividad-evento.entity';
import { ActividadEventoGasto } from '../entities/actividad-evento-gasto.entity';

export interface ActividadEventoGastoResponseDto {
  id:       number;
  concepto: string;
  monto:    number;
  notas?:   string;
}

export interface ActividadEventoResponseDto {
  id:               number;
  actividadId:      number;
  fecha:            string;
  cuposDisponibles?: number;
  estado:           string;
  gastos:           ActividadEventoGastoResponseDto[];
  totalGastos:      number;
  totalIngresos?:   number;
  utilidad?:        number;
}

export interface ActividadResponseDto {
  id:             number;
  nombre:         string;
  descripcion?:   string;
  precio:         number;
  duracionHoras?: number;
  activo:         boolean;
}

export function toGastoResponse(gasto: ActividadEventoGasto): ActividadEventoGastoResponseDto {
  return {
    id:       gasto.id,
    concepto: gasto.concepto,
    monto:    Number(gasto.monto),
    notas:    gasto.notas,
  };
}

export function toEventoResponse(
  evento: ActividadEvento,
  totalIngresos?: number,
): ActividadEventoResponseDto {
  const gastos     = evento.gastos?.map(toGastoResponse) ?? [];
  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
  const utilidad   = totalIngresos !== undefined ? totalIngresos - totalGastos : undefined;

  return {
    id:               evento.id,
    actividadId:      evento.actividadId,
    fecha:            evento.fecha,
    cuposDisponibles: evento.cuposDisponibles,
    estado:           evento.estado,
    gastos,
    totalGastos,
    totalIngresos,
    utilidad,
  };
}

export function toActividadResponse(actividad: Actividad): ActividadResponseDto {
  return {
    id:            actividad.id,
    nombre:        actividad.nombre,
    descripcion:   actividad.descripcion,
    precio:        Number(actividad.precio),
    duracionHoras: actividad.duracionHoras,
    activo:        actividad.activo,
  };
}