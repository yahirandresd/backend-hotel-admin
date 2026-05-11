import {
  IsString, IsNotEmpty, IsOptional,
  IsInt, IsPositive, IsIn, Length,
} from 'class-validator';
import { Type } from 'class-transformer';

const METODOS = [
  'efectivo', 'tarjeta_credito', 'tarjeta_debito',
  'transferencia', 'nequi', 'daviplata', 'otro',
];
const ESTADOS = ['pendiente', 'completado', 'reembolsado', 'fallido'];

export class CreatePagoDto {
  @IsInt()
  @IsPositive({ message: 'La reservación es requerida' })
  @Type(() => Number)
  reservacionId!: number;

  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  @Type(() => Number)
  monto!: number;

  @IsString()
  @IsNotEmpty({ message: 'El método de pago es requerido' })
  @IsIn(METODOS, { message: 'Método de pago inválido' })
  metodo!: string;

  @IsOptional()
  @IsString()
  @IsIn(ESTADOS, { message: 'Estado inválido' })
  estado?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  referencia?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}