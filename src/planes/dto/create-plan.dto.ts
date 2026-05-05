import {
  IsString, IsNotEmpty, IsOptional, IsBoolean,
  IsInt, IsPositive, IsArray, ValidateNested, Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PlanActividadDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  actividadId!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  cantidad?: number;
}

export class PlanServicioDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  servicioId!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  cantidad?: number;
}

export class CreatePlanDto {
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

  @IsInt()
  @IsPositive({ message: 'Las noches deben ser mayor a 0' })
  @Type(() => Number)
  noches!: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanActividadDto)
  actividades?: PlanActividadDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanServicioDto)
  servicios?: PlanServicioDto[];
}