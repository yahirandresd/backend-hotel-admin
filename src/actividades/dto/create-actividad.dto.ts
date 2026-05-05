import {
  IsString, IsNotEmpty, IsOptional,
  IsBoolean, IsInt, IsPositive, Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActividadDto {
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

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  duracionHoras?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  cupoMaximo?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}