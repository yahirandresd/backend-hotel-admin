import {
  IsString, IsNotEmpty, IsOptional, IsBoolean,
  IsInt, IsPositive, Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(1, 100)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsPositive({ message: 'El precio por persona debe ser mayor a 0' })
  @Type(() => Number)
  precioPersona!: number;

  @IsInt()
  @IsPositive({ message: 'Las noches deben ser mayor a 0' })
  @Type(() => Number)
  noches!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  maxPersonas?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
