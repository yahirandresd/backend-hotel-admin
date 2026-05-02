import { Module } from '@nestjs/common';
//import { APP_GUARD } from '@nestjs/core';
//import { SupabaseGuard } from './guards/supabase.guard';

@Module({
  providers: [
  //  {
    //  provide:  APP_GUARD,
     // useClass: SupabaseGuard, // 👈 aplica el guard a TODAS las rutas globalmente
    //},
  ],
})
export class AuthModule {}