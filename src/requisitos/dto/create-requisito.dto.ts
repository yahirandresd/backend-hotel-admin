import {
  IsString, IsNotEmpty, IsOptional,
  IsBoolean, Length,
} from 'class-validator';

export class CreateRequisitoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(1, 100)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}