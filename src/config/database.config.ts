import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ENTITIES } from '../database/entities';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    // Rol de aplicación (NOBYPASSRLS) — distinto del dueño de las tablas que
    // usan las migraciones (data-source.ts). Sin APP_DB_USER cae al legado
    // DB_USER (dueño), lo cual bypasea RLS — ver la aserción de arranque en
    // main.ts, que falla el arranque si detecta justamente ese caso.
    username: process.env.APP_DB_USER ?? process.env.DB_USER ?? 'postgres',
    password: process.env.APP_DB_PASSWORD ?? process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'hotel_reservations',

    // Misma lista de entidades que usa el CLI de migraciones (src/database/entities.ts)
    entities: ENTITIES,

    // El esquema se gestiona con migraciones (src/database/migrations), no con sync
    // automático — synchronize:true no conoce RLS, FKs compuestas ni defaults con
    // current_setting(), y los "corregiría" en cada arranque.
    synchronize: false,

    // Pool de `pg`. Sin esto el default es 10 conexiones y una petición sin
    // conexión libre espera para siempre. Con connectionTimeoutMillis falla a los
    // 10s (error visible en vez de "pendiente"), y Postgres cierra cualquier
    // transacción abandonada más de 30s para que no se quede con una conexión.
    extra: {
      max: parseInt(process.env.DB_POOL_MAX ?? '15', 10),
      connectionTimeoutMillis: 10_000,
      idle_in_transaction_session_timeout: 30_000,
    },

    logging: process.env.NODE_ENV === 'development',
  }),
);