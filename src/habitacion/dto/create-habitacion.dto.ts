import {
  IsString, IsNotEmpty, IsOptional,
  IsInt, IsPositive, IsIn, Length,
} from 'class-validator';
import { Type } from 'class-transformer';

const ESTADOS = ['disponible', 'ocupada', 'mantenimiento', 'fuera_de_servicio'];

export class CreateHabitacionDto {
  @IsString()
  @IsNotEmpty({ message: 'El número de habitación es requerido' })
  @Length(1, 10)
  numero!: string;

  @IsInt()
  @IsPositive({ message: 'El piso debe ser mayor a 0' })
  @Type(() => Number)
  piso!: number;

  @IsOptional()
  @IsString()
  @IsIn(ESTADOS, { message: 'Estado inválido' })
  estado?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsInt()
  @IsPositive({ message: 'El tipo de habitación es requerido' })
  @Type(() => Number)
  tipoId!: number;
}