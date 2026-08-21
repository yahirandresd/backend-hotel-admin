import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { ENTITIES } from './entities';

// DataSource usado solo por el CLI de TypeORM (migration:generate/run/revert).
// Se conecta con el rol dueño de las tablas (hoy el mismo que usa la app,
// hasta que en la Fase 5 se introduzca el rol dedicado rooma_app).
export const AppDataSource = new DataSource({
  type:     'postgres',
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME     ?? 'hotel_reservations',
  entities: ENTITIES,
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: true,
});
