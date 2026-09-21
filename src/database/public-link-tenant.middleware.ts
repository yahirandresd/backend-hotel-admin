import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { TenantDb } from './tenant-db';

// Versión de RequestTransactionMiddleware para las 2 rutas públicas (sin JWT):
// resuelve el hotelId a partir del `code` vía la función SQL
// hotel_id_for_link_code() (SECURITY DEFINER — bypasea RLS solo para esa
// lectura puntual, sin exponer la tabla completa a una conexión sin contexto
// de tenant) y abre la misma transacción de tenant que TenantMiddleware +
// RequestTransactionMiddleware para las rutas autenticadas.
//
// Si el code no resuelve a ningún hotel (inválido o ya usado), se deja pasar
// sin transacción — el service (ReservationLinksService.validate) da el
// 404/400 apropiado al no ver ninguna fila bajo el hotel por defecto (ninguno).
@Injectable()
export class PublicLinkTenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantDb: TenantDb) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const code = req.params?.code;
    if (!code) return next();

    const hotelId = await this.tenantDb.hotelIdForLinkCode(String(code));
    if (hotelId === null) {
      return next();
    }

    (req as any).manager = await this.tenantDb.openRequestTransaction(
      hotelId,
      res,
      'public-link-tx',
    );

    next();
  }
}
