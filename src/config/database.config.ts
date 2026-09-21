import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ENTITIES } from '../database/entities';
import { baseConnectionOptions } from '../database/connection';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    // Rol de aplicación (NOBYPASSRLS) — distinto del dueño de las tablas que
    // usan las migraciones (data-source.ts). Sin APP_DB_USER cae al legado
    // DB_USER (dueño), lo cual bypasea RLS — ver la aserción de arranque en
    // main.ts, que falla el arranque si detecta justamente ese caso.
    ...baseConnectionOptions(
      process.env.APP_DB_USER ?? process.env.DB_USER ?? 'postgres',
      process.env.APP_DB_PASSWORD ?? process.env.DB_PASSWORD ?? 'postgres',
    ),

    // Misma lista de entidades que usa el CLI de migraciones (src/database/entities.ts)
    entities: ENTITIES,

    // El esquema se gestiona con migraciones (src/database/migrations), no con sync
    // automático — synchronize:true no conoce RLS, FKs compuestas ni defaults con
    // current_setting(), y los "corregiría" en cada arranque.
    synchronize: false,

    logging: process.env.NODE_ENV === 'development',
  }),
);