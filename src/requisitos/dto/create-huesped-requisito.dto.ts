import {
  IsInt, IsPositive, IsBoolean,
  IsOptional, IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHuespedRequisitoDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  huespedId!: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  reservacionId!: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  requisitoId!: number;

  @IsBoolean()
  respuesta!: boolean;

  @IsOptional()
  @IsString()
  notas?: string;
}