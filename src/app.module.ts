import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import databaseConfig from './config/database.config';
import { HotelModule } from './hotel/hotel.module';
import { TenantMiddleware } from './auth/tenant.middleware';
import { RequestTransactionMiddleware } from './database/request-transaction.middleware';
import { PublicLinkTenantMiddleware } from './database/public-link-tenant.middleware';
import { ReservationsModule } from './reservations/reservations.module';
import { GuestsModule } from './guests/guests.module';
import { AuthModule } from './auth/auth.module';
import { TipoHabitacionModule } from './tipo-habitacion/tipo-habitacion.module';
import { HabitacionModule } from './habitacion/habitacion.module';
import { PlanesModule } from './planes/planes.module';
import { RequisitosModule } from './requisitos/requisitos.module';
import { ReportesModule } from './reportes/reportes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PagosModule } from './pagos/pagos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
    ThrottlerModule.forRoot([
      {
        name:  'global',
        ttl:   60000,
        limit: 60,
      },
      {
        name:  'public',
        ttl:   60000,
        limit: 10,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
        configService.get<TypeOrmModuleOptions>('database')!,
    }),
    AuthModule,
    HotelModule,
    ReservationsModule,
    GuestsModule,
    TipoHabitacionModule,
    HabitacionModule,
    PlanesModule,
    RequisitosModule,
    PagosModule,
    DashboardModule,
    ReportesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    TenantMiddleware,
    RequestTransactionMiddleware,
    PublicLinkTenantMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    const publicRoutes = [
      { path: 'public/links/:code', method: RequestMethod.GET },
      { path: 'public/reservations/:code', method: RequestMethod.POST },
    ];

    // TenantMiddleware resuelve el tenant (request.user.hotelId) en toda ruta
    // autenticada. Las 2 rutas públicas (sin JWT) quedan afuera explícitamente
    // — usan PublicLinkTenantMiddleware, que resuelve el hotel desde el `code`.
    consumer.apply(TenantMiddleware).exclude(...publicRoutes).forRoutes('{*splat}');

    // RequestTransactionMiddleware corre DESPUÉS (mismo orden de .apply()) —
    // abre la transacción de tenant usando el hotelId que ya resolvió
    // TenantMiddleware. Debe excluir las mismas rutas públicas.
    consumer.apply(RequestTransactionMiddleware).exclude(...publicRoutes).forRoutes('{*splat}');

    // Las 2 rutas públicas usan su propio middleware de tenant (sin JWT).
    consumer.apply(PublicLinkTenantMiddleware).forRoutes(...publicRoutes);
  }
}
