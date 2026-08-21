import { Injectable, NestMiddleware } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { NextFunction, Request, Response } from 'express';

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
  constructor(private readonly dataSource: DataSource) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const hotelId = (req as any).user?.hotelId;

    // Sin hotelId (superadmin sin impersonar, o rutas ya excluidas) — se sigue
    // usando el pool por defecto, sin transacción de tenant.
    if (hotelId === undefined || hotelId === null) {
      return next();
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    await queryRunner.manager.query(
      'SELECT set_config($1, $2, true)',
      ['app.hotel_id', String(hotelId)],
    );

    (req as any).manager = queryRunner.manager;

    let finalized = false;
    const finalize = async (commit: boolean) => {
      if (finalized || queryRunner.isReleased) return;
      finalized = true;
      try {
        if (commit) await queryRunner.commitTransaction();
        else await queryRunner.rollbackTransaction();
      } catch (err) {
        console.error('[request-tx] error al finalizar transacción:', err);
      } finally {
        await queryRunner.release();
      }
    };

    res.on('finish', () => {
      void finalize(res.statusCode < 400);
    });
    res.on('close', () => {
      void finalize(false);
    });

    next();
  }
}
