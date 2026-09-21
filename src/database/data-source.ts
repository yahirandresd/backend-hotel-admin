import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { ENTITIES } from './entities';
import { baseConnectionOptions } from './connection';

// DataSource usado solo por el CLI de TypeORM (migration:generate/run/revert).
// Se conecta con el rol dueño de las tablas (hoy el mismo que usa la app,
// hasta que en la Fase 5 se introduzca el rol dedicado rooma_app).
export const AppDataSource = new DataSource({
  ...baseConnectionOptions(
    process.env.DB_USER     ?? 'postgres',
    process.env.DB_PASSWORD ?? 'postgres',
  ),
  entities: ENTITIES,
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: true,
});
