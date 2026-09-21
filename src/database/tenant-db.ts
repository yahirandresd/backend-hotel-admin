import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import type { Response } from 'express';

// Único lugar que conoce el mecanismo de aislamiento por tenant de Postgres:
// abrir una transacción y fijar `app.hotel_id` con `set_config(..., true)`
// (scope LOCAL: se pierde al hacer commit/rollback, nunca puede filtrarse a la
// siguiente petición que reutilice la conexión del pool). También resuelve el
// hotel de un link público vía hotel_id_for_link_code() (SECURITY DEFINER).
//
// Si algún día cambia el motor de BD o el mecanismo de RLS, este es el archivo
// a reescribir — los middlewares y HotelService solo llaman a estos métodos.
@Injectable()
export class TenantDb {
  constructor(private readonly dataSource: DataSource) {}

  // Abre una transacción con `app.hotel_id` ya fijado. El que llama es
  // responsable de commit/rollback y de liberar el QueryRunner.
  private async begin(hotelId: number | string): Promise<QueryRunner> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.query('SELECT set_config($1, $2, true)', [
        'app.hotel_id',
        String(hotelId),
      ]);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw err;
    }
    return queryRunner;
  }

  // Transacción atada al ciclo de vida de la response: commit si status < 400,
  // rollback si es >= 400 o si la conexión se cierra antes de terminar. Devuelve
  // el EntityManager de esa transacción para que el middleware lo guarde en
  // `req.manager`.
  async openRequestTransaction(
    hotelId: number | string,
    res: Response,
    logLabel: string,
  ): Promise<EntityManager> {
    const queryRunner = await this.begin(hotelId);

    let finalized = false;
    const finalize = async (commit: boolean) => {
      if (finalized || queryRunner.isReleased) return;
      finalized = true;
      try {
        if (commit) await queryRunner.commitTransaction();
        else await queryRunner.rollbackTransaction();
      } catch (err) {
        console.error(`[${logLabel}] error al finalizar transacción:`, err);
      } finally {
        await queryRunner.release();
      }
    };

    res.on('finish', () => void finalize(res.statusCode < 400));
    res.on('close', () => void finalize(false));

    return queryRunner.manager;
  }

  // Ejecuta `work` en una transacción con `app.hotel_id` fijado a `hotelId` y
  // hace commit/rollback al terminar. Para código que corre fuera de un request
  // de tenant (ej. bootstrap de un hotel nuevo por el superadmin).
  async runInTenant<T>(
    hotelId: number | string,
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const queryRunner = await this.begin(hotelId);
    try {
      const result = await work(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // Resuelve el hotel dueño de un link público. SECURITY DEFINER: bypasea RLS
  // solo para este lookup puntual. null si el code no existe o ya fue usado.
  async hotelIdForLinkCode(code: string): Promise<number | null> {
    const rows = await this.dataSource.query(
      'SELECT hotel_id_for_link_code($1) AS hotel_id',
      [code],
    );
    return rows?.[0]?.hotel_id ?? null;
  }
}
