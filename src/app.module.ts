import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { ReservationsModule } from './reservations/reservations.module';
import { GuestsModule } from './guests/guests.module';
import { AuthModule } from './auth/auth.module';
import { TipoHabitacionModule } from './tipo-habitacion/tipo-habitacion.module';
import { HabitacionModule } from './habitacion/habitacion.module';
import { ServiciosModule } from './servicios/servicios.module';
import { ActividadesModule } from './actividades/actividades.module';
import { PlanesModule } from './planes/planes.module';
import { RequisitosModule } from './requisitos/requisitos.module';
import { ReportesModule } from './reportes/reportes.module';

import { DashboardModule } from './dashboard/dashboard.module';
import { PagosModule } from './pagos/pagos.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
        configService.get<TypeOrmModuleOptions>('database')!,
    }),
    AuthModule,
    ReservationsModule,
    GuestsModule,
    TipoHabitacionModule,
    HabitacionModule,
    ServiciosModule,
    ActividadesModule,
    PlanesModule,
    RequisitosModule,
    PagosModule,
    DashboardModule,
    ReportesModule,
  ],
})
export class AppModule {}