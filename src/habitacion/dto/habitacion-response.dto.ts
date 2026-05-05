import { Habitacion } from '../entities/habitacion.entity';
import { TipoHabitacionResponseDto, toTipoHabitacionResponse } from '../../tipo-habitacion/dto/tipo-habitacion-response.dto';

export interface HabitacionResponseDto {
  id:      number;
  numero:  string;
  piso:    number;
  estado:  string;
  notas?:  string;
  tipoId:  number;
  tipo?:   TipoHabitacionResponseDto;
}

export function toHabitacionResponse(habitacion: Habitacion): HabitacionResponseDto {
  return {
    id:      habitacion.id,
    numero:  habitacion.numero,
    piso:    habitacion.piso,
    estado:  habitacion.estado,
    notas:   habitacion.notas,
    tipoId:  habitacion.tipoId,
    tipo:    habitacion.tipo ? toTipoHabitacionResponse(habitacion.tipo) : undefined,
  };
}