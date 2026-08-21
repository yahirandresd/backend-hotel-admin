import {
  IsString, IsNotEmpty, IsOptional, IsBoolean,
  IsEmail, Length, Matches,
} from 'class-validator';

export class CreateHotelDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(1, 120)
  nombre!: string;

  @IsString()
  @IsNotEmpty({ message: 'El slug es requerido' })
  @Length(1, 60)
  @Matches(/^[a-z0-9-]+$/, { message: 'El slug solo admite minúsculas, números y guiones' })
  slug!: string;

  @IsOptional() @IsString() @Length(0, 160) nombreLegal?: string;
  @IsOptional() @IsString() @Length(0, 30)  nit?: string;
  @IsOptional() @IsEmail()  email?: string;
  @IsOptional() @IsString() @Length(0, 30)  telefono?: string;
  @IsOptional() @IsString() @Length(0, 200) direccion?: string;
  @IsOptional() @IsString() @Length(0, 100) ciudad?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  pais?: string;

  @IsOptional() @IsString() timezone?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  moneda?: string;

  @IsOptional() @IsString() logoUrl?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'checkInHora debe tener formato HH:mm' })
  checkInHora?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'checkOutHora debe tener formato HH:mm' })
  checkOutHora?: string;

  @IsOptional() @IsString() politicaCancelacion?: string;

  @IsOptional() @IsBoolean() activo?: boolean;

  @IsOptional() @IsString() notasInternas?: string;
}
