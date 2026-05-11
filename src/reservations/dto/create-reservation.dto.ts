import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsBoolean,
  IsOptional,
  Length,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGuestDto } from '../../guests/dto/create-guest.dto';

const DOC_TYPES = ['CC', 'CE', 'PA', 'TI', 'NIT'];
const MOTIVOS = [
  'Turismo',
  'Negocios',
  'Salud / Médico',
  'Estudio / Formación',
  'Visita familiar',
  'Eventos / Conferencias',
  'Luna de miel',
  'Deporte / Competencia',
  'Otro',
];
const VACUNA_VALUES = ['si', 'no'];

export class CreateReservationDto {
  // Titular (para construir el guest titular)
  @IsString()
  @IsNotEmpty()
  @IsIn(DOC_TYPES)
  docType!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  docNum!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  apellido!: string;

  @IsString()
  @IsNotEmpty()
  fechaNac!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  ciudadResidencia!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  ciudadOrigen!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  tel1!: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  tel2?: string;

  // Estadía
  @IsString()
  @IsNotEmpty()
  fechaIngreso!: string;

  @IsString()
  @IsNotEmpty()
  fechaSalida!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(MOTIVOS)
  motivo!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['si', 'no'])
  vacunaTitular!: string;

  @IsBoolean()
  aceptaTerminos!: boolean;

  // Acompañantes (opcional)
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateGuestDto)
  guests?: CreateGuestDto[];

  // Admin
  @IsOptional()
  @IsString()
  @IsIn(['directo', 'web', 'telefono', 'ota', 'walk_in'])
  canalOrigen?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
