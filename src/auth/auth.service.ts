import { ForbiddenException, Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );

  async createStaff(email: string, password: string, nombre: string, apellido: string, hotelId: number) {
    return this.supabase.auth.admin.createUser({
      email,
      password,
      app_metadata:  { role: 'staff', hotel_id: hotelId },
      user_metadata: { nombre, apellido },
    });
  }

  async createAdmin(email: string, password: string, nombre: string, apellido: string, hotelId: number) {
    return this.supabase.auth.admin.createUser({
      email,
      password,
      app_metadata:  { role: 'admin', hotel_id: hotelId },
      user_metadata: { nombre, apellido },
    });
  }

  async updateMetadata(
    userId: string,
    data: { nombre?: string; apellido?: string },
    caller: { role: string; hotelId?: number },
  ) {
    // superadmin puede editar cualquier usuario; admin/staff solo dentro de su
    // propio hotel (evita que un admin del hotel A edite a alguien del hotel B).
    if (caller.role !== 'superadmin') {
      const { data: target, error } = await this.supabase.auth.admin.getUserById(userId);
      if (error || !target.user) {
        throw new ForbiddenException('Usuario no encontrado');
      }
      const targetHotelId = (target.user.app_metadata as any)?.hotel_id;
      if (targetHotelId !== caller.hotelId) {
        throw new ForbiddenException('No puedes editar usuarios de otro hotel');
      }
    }

    return this.supabase.auth.admin.updateUserById(userId, {
      user_metadata: data,
    });
  }
}
