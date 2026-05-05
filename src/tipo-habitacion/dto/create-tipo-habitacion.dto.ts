import {
  IsString, IsNotEmpty, IsOptional,
  IsInt, IsPositive, Min, Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTipoHabitacionDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(1, 100)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsInt()
  @IsPositive({ message: 'La capacidad debe ser mayor a 0' })
  @Type(() => Number)
  capacidad!: number;

  @IsPositive({ message: 'El precio base debe ser mayor a 0' })
  @Min(0)
  @Type(() => Number)
  precioBase!: number;
}