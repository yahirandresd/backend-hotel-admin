import {
  IsString, IsNotEmpty, IsIn, IsOptional, Length,
} from 'class-validator';

const DOC_TYPES     = ['CC', 'CE', 'PA', 'TI', 'NIT'];
const VACUNA_VALUES = ['si', 'no'];

export class CreateGuestDto {
  @IsString() @IsNotEmpty() @IsIn(DOC_TYPES)
  docType!: string;

  @IsString() @IsNotEmpty() @Length(1, 20)
  docNum!: string;

  @IsString() @IsNotEmpty() @Length(1, 100)
  nombre!: string;

  @IsString() @IsNotEmpty() @Length(1, 100)
  apellido!: string;

  @IsString() @IsNotEmpty()
  fechaNac!: string;

  @IsOptional() @IsString() @Length(1, 100)
  ciudadResidencia?: string;

  @IsOptional() @IsString() @Length(1, 100)
  ciudadOrigen?: string;

  @IsOptional() @IsString() @Length(1, 20)
  tel1?: string;

  @IsOptional() @IsString() @Length(1, 20)
  tel2?: string;

  @IsString() @IsNotEmpty() @IsIn(VACUNA_VALUES)
  vacuna!: string;
}