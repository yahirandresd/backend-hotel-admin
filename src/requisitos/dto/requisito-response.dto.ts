import { Requisito } from '../entities/requisito.entity';
import { HuespedRequisito } from '../entities/huesped-requisito.entity';

export interface RequisitoResponseDto {
  id:           number;
  nombre:       string;
  descripcion?: string;
  activo:       boolean;
  createdAt:    Date;
}

export interface HuespedRequisitoResponseDto {
  id:            number;
  huespedId:     number;
  reservacionId: number;
  requisitoId:   number;
  requisito:     string;
  respuesta:     boolean;
  notas?:        string;
  createdAt:     Date;
}

export function toRequisitoResponse(requisito: Requisito): RequisitoResponseDto {
  return {
    id:          requisito.id,
    nombre:      requisito.nombre,
    descripcion: requisito.descripcion,
    activo:      requisito.activo,
    createdAt:   requisito.createdAt,
  };
}

export function toHuespedRequisitoResponse(hr: HuespedRequisito): HuespedRequisitoResponseDto {
  return {
    id:            hr.id,
    huespedId:     hr.huespedId,
    reservacionId: hr.reservacionId,
    requisitoId:   hr.requisitoId,
    requisito:     hr.requisito?.nombre ?? '',
    respuesta:     hr.respuesta,
    notas:         hr.notas,
    createdAt:     hr.createdAt,
  };
}