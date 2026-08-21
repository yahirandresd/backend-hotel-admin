import {
  IsEmail, IsString, IsOptional, IsInt, IsPositive, MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  // Solo lo usa superadmin: a qué hotel pertenece el usuario nuevo. Un admin
  // creando su propio staff nunca lo manda — se toma de su propio hotelId.
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  hotelId?: number;
}
