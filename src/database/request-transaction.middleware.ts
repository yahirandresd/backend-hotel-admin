import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { TenantDb } from './tenant-db';

// Abre UNA transacción por request (para las rutas con hotelId resuelto por
// TenantMiddleware — debe registrarse DESPUÉS de él en app.module.ts) y fija
// `app.hotel_id` en esa transacción vía `set_config(..., true)` (scope LOCAL,
// se pierde al hacer commit/rollback — nunca puede filtrarse a la siguiente
// petición que reutilice la conexión del pool).
//
// Todas las queries del request deben ir a través de `req.manager` (o de los
// repositorios request-scoped de tenant-repository.provider.ts, que lo usan
// internamente) para que Row-Level Security (Fase 5) vea el hotel correcto.
// Sin esto, activar RLS haría que cada query devuelva 0 filas.
@Injectable()
export class RequestTransactionMiddleware implements NestMiddleware {
  constructor(private readonly tenantDb: TenantDb) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const hotelId = (req as any).user?.hotelId;

    // Sin hotelId (superadmin sin impersonar, o rutas ya excluidas) — se sigue
    // usando el pool por defecto, sin transacción de tenant.
    if (hotelId === undefined || hotelId === null) {
      return next();
    }

    (req as any).manager = await this.tenantDb.openRequestTransaction(
      hotelId,
      res,
      'request-tx',
    );

    next();
  }
}
