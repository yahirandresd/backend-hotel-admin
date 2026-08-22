import {
  IsString, IsNotEmpty, IsIn, IsOptional, IsEmail, Length, MaxLength,
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

  @IsOptional() @IsString() @MaxLength(100)
  ciudadResidencia?: string;

  @IsOptional() @IsString() @MaxLength(100)
  ciudadOrigen?: string;

  @IsOptional() @IsString() @MaxLength(20)
  tel1?: string;

  @IsOptional() @IsString() @MaxLength(20)
  tel2?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  @MaxLength(150)
  email?: string;

  @IsString() @IsNotEmpty() @IsIn(VACUNA_VALUES)
  vacuna!: string;
}