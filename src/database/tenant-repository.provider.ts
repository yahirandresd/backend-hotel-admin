import { Provider, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, ObjectLiteral } from 'typeorm';
import type { Request } from 'express';
import { REQUEST_MANAGER } from './tenant-context';

// Repositorio request-scoped: en vez del pool por defecto, usa el EntityManager
// de la transacción de tenant abierta por RequestTransactionMiddleware
// (req.manager) cuando existe. Si no existe (rutas sin hotelId — superadmin sin
// impersonar, o rutas públicas), cae al DataSource normal.
//
// IMPORTANTE: cualquier service que inyecte uno de estos repos se vuelve
// request-scoped por Nest automáticamente (y en cascada, sus controllers) —
// es el costo aceptado de que RLS pueda ver el hotel_id correcto en cada query.
export function tenantRepositoryProvider<T extends ObjectLiteral>(
  entity: new (...args: any[]) => T,
): Provider {
  return {
    provide: getRepositoryToken(entity),
    scope: Scope.REQUEST,
    inject: [REQUEST, DataSource],
    useFactory: (req: Request, dataSource: DataSource) => {
      const manager = (req as any).manager ?? dataSource.manager;
      return manager.getRepository(entity);
    },
  };
}

// Para los pocos services que necesitan el EntityManager directamente (en vez
// de un Repository de una entidad) — ej. para abrir "sub-transacciones" que
// TypeORM reutiliza sin problema si ya hay una activa.
export const requestManagerProvider: Provider = {
  provide: REQUEST_MANAGER,
  scope: Scope.REQUEST,
  inject: [REQUEST, DataSource],
  useFactory: (req: Request, dataSource: DataSource) => (req as any).manager ?? dataSource.manager,
};
