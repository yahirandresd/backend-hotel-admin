// Único lugar donde se declara el motor de BD y cómo se leen host/puerto/nombre
// desde el entorno. Lo comparten el runtime (config/database.config.ts), el CLI
// de migraciones (database/data-source.ts) y el seeder (seed.ts), que solo
// cambian las credenciales.
export const DB_TYPE = 'postgres' as const;

export interface BaseConnectionOptions {
  type: typeof DB_TYPE;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export function baseConnectionOptions(
  username: string,
  password: string,
): BaseConnectionOptions {
  return {
    type: DB_TYPE,
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username,
    password,
    database: process.env.DB_NAME ?? 'hotel_reservations',
  };
}
