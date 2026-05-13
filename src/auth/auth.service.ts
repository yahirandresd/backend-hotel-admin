import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );

  async createStaff(email: string, password: string, nombre: string, apellido: string) {
    return this.supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { role: 'staff', nombre, apellido },
    });
  }

  async createAdmin(email: string, password: string, nombre: string, apellido: string) {
    return this.supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { role: 'admin', nombre, apellido },
    });
  }

  async updateMetadata(userId: string, data: { nombre?: string; apellido?: string }) {
    return this.supabase.auth.admin.updateUserById(userId, {
      user_metadata: data,
    });
  }
}