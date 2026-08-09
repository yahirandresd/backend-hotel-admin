import {
  IsString, IsNotEmpty, IsIn, IsOptional,
  IsInt, IsPositive, IsNumber, IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

const ESTADOS = ['pendiente', 'confirmada', 'check_in', 'check_out', 'cancelada', 'no_show'];
const CANALES = ['directo', 'web', 'telefono', 'ota', 'walk_in'];

export class UpdateEstadoDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(ESTADOS, { message: 'Estado inválido' })
  estado!: string;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class AsignarHabitacionDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  guestId!: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  habitacionId!: number;
}

export class AsignarPlanDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  planId!: number;
}

export class UpdateReservationAdminDto {
  @IsOptional()
  @IsString()
  @IsIn(CANALES)
  canalOrigen?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  precioTotal?: number;
}