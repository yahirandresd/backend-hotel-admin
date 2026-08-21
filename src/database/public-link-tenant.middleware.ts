import { Injectable, NestMiddleware } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { NextFunction, Request, Response } from 'express';

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
  constructor(private readonly dataSource: DataSource) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const code = req.params?.code;
    if (!code) return next();

    const rows = await this.dataSource.query(
      'SELECT hotel_id_for_link_code($1) AS hotel_id',
      [code],
    );
    const hotelId = rows?.[0]?.hotel_id;

    if (hotelId === null || hotelId === undefined) {
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
        console.error('[public-link-tx] error al finalizar transacción:', err);
      } finally {
        await queryRunner.release();
      }
    };

    res.on('finish', () => void finalize(res.statusCode < 400));
    res.on('close', () => void finalize(false));

    next();
  }
}
