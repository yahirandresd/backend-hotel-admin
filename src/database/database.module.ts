import { Global, Module } from '@nestjs/common';
import { TenantDb } from './tenant-db';

// Global para que AppModule (los middlewares de tenant) y HotelModule puedan
// inyectar TenantDb sin importar este módulo cada uno.
@Global()
@Module({
  providers: [TenantDb],
  exports: [TenantDb],
})
export class DatabaseModule {}
