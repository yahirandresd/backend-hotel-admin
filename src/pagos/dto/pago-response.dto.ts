import { Pago } from '../entities/pago.entity';

export interface PagoResponseDto {
  id:            number;
  reservacionId: number;
  monto:         number;
  metodo:        string;
  estado:        string;
  referencia?:   string;
  notas?:        string;
  fechaPago:     Date;
}

export function toPagoResponse(pago: Pago): PagoResponseDto {
  return {
    id:            pago.id,
    reservacionId: pago.reservacionId,
    monto:         Number(pago.monto),
    metodo:        pago.metodo,
    estado:        pago.estado,
    referencia:    pago.referencia,
    notas:         pago.notas,
    fechaPago:     pago.fechaPago,
  };
}