import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'hotel_reservations',

    // Carga automáticamente todas las entidades registradas en los módulos
    autoLoadEntities: true,

    // Solo en desarrollo: sincroniza el esquema automáticamente
    // En producción usar migraciones
    synchronize: process.env.NODE_ENV !== 'production',

    logging: process.env.NODE_ENV === 'development',
  }),
);