import {
  IsString, IsNotEmpty, IsOptional,
  IsBoolean, IsIn, IsPositive, Length,
} from 'class-validator';
import { Type } from 'class-transformer';

const CATEGORIAS = ['alimentacion', 'transporte', 'spa', 'tour', 'otro'];

export class CreateServicioDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(1, 100)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  @Type(() => Number)
  precio!: number;

  @IsString()
  @IsNotEmpty({ message: 'La categoría es requerida' })
  @IsIn(CATEGORIAS, { message: 'Categoría inválida' })
  categoria!: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}