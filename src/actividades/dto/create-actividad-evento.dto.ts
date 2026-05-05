import {
  IsString, IsNotEmpty, IsOptional,
  IsInt, IsPositive, IsIn, ValidateNested, IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

const ESTADOS = ['programada', 'realizada', 'cancelada'];

export class CreateActividadEventoGastoDto {
  @IsString()
  @IsNotEmpty({ message: 'El concepto es requerido' })
  concepto!: string;

  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  @Type(() => Number)
  monto!: number;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class CreateActividadEventoDto {
  @IsInt()
  @IsPositive({ message: 'La actividad es requerida' })
  @Type(() => Number)
  actividadId!: number;

  @IsString()
  @IsNotEmpty({ message: 'La fecha es requerida' })
  fecha!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  cuposDisponibles?: number;

  @IsOptional()
  @IsString()
  @IsIn(ESTADOS, { message: 'Estado inválido' })
  estado?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActividadEventoGastoDto)
  gastos?: CreateActividadEventoGastoDto[];
}