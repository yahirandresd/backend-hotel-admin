import { Hotel } from '../entities/hotel.entity';

export interface HotelResponseDto {
  id:                    number;
  nombre:                string;
  slug:                  string;
  nombreLegal?:          string;
  nit?:                  string;
  email?:                string;
  telefono?:             string;
  direccion?:            string;
  ciudad?:               string;
  pais:                  string;
  timezone:              string;
  moneda:                string;
  logoUrl?:               string;
  checkInHora:           string;
  checkOutHora:          string;
  politicaCancelacion?:  string;
  activo:                boolean;
  createdAt:             Date;
  updatedAt:             Date;
}

export function toHotelResponse(hotel: Hotel): HotelResponseDto {
  return {
    id:                   hotel.id,
    nombre:               hotel.nombre,
    slug:                 hotel.slug,
    nombreLegal:          hotel.nombreLegal,
    nit:                  hotel.nit,
    email:                hotel.email,
    telefono:             hotel.telefono,
    direccion:            hotel.direccion,
    ciudad:               hotel.ciudad,
    pais:                 hotel.pais,
    timezone:             hotel.timezone,
    moneda:               hotel.moneda,
    logoUrl:              hotel.logoUrl,
    checkInHora:          hotel.checkInHora,
    checkOutHora:         hotel.checkOutHora,
    politicaCancelacion:  hotel.politicaCancelacion,
    activo:               hotel.activo,
    createdAt:            hotel.createdAt,
    updatedAt:            hotel.updatedAt,
  };
}

// Subconjunto seguro para el endpoint público (formulario de auto-checkin):
// nunca exponer notasInternas, nit, ni datos internos.
export interface HotelPublicResponseDto {
  nombre:                string;
  logoUrl?:               string;
  checkInHora:           string;
  checkOutHora:          string;
  politicaCancelacion?:  string;
}

export function toHotelPublicResponse(hotel: Hotel): HotelPublicResponseDto {
  return {
    nombre:               hotel.nombre,
    logoUrl:              hotel.logoUrl,
    checkInHora:          hotel.checkInHora,
    checkOutHora:         hotel.checkOutHora,
    politicaCancelacion:  hotel.politicaCancelacion,
  };
}
