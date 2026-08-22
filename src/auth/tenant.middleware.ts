import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { Hotel } from '../hotel/entities/hotel.entity';

interface AppMetadata {
  role?: string;
  hotel_id?: number;
}

interface VerifiedPayload {
  sub: string;
  email?: string;
  app_metadata?: AppMetadata;
}

// Resuelve el tenant en cada request autenticado: valida el JWT, adjunta
// { id, email, role, hotelId } a request.user, y confirma que el hotel del
// usuario está activo. Corre en TODAS las rutas excepto las públicas
// (src/app.module.ts las excluye explícitamente) — por eso, a diferencia del
// SupabaseGuard viejo, aquí SIEMPRE se exige un token válido.
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );

  // Cache en memoria de "¿el hotel N está activo?" — evita una query por request.
  // TTL corto porque es la vía para cortar servicio a un cliente moroso.
  private readonly hotelActivoCache = new Map<number, { activo: boolean; expiraEn: number }>();
  private readonly CACHE_TTL_MS = 60_000;

  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepo: Repository<Hotel>,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const payload = await this.verify(token);
    const role = payload.app_metadata?.role;

    if (!role) {
      throw new UnauthorizedException('El usuario no tiene un rol asignado');
    }

    let hotelId = payload.app_metadata?.hotel_id;

    // Impersonación de soporte: solo superadmin, y solo vía header explícito.
    const impersonarHeader = req.headers['x-hotel-id'];
    if (role === 'superadmin' && impersonarHeader) {
      const parsed = parseInt(String(impersonarHeader), 10);
      if (Number.isFinite(parsed)) {
        hotelId = parsed;
        console.log(
          `[tenant] superadmin ${payload.sub} impersona hotel_id=${parsed} en ${req.method} ${req.originalUrl}`,
        );
      }
    }

    // Todo rol que no sea superadmin DEBE tener hotel_id — si no, cada query
    // bajo RLS ve/inserta 0 filas de forma silenciosa (o, en tablas sin RLS
    // como `hotel`, TypeORM trata `{ id: undefined }` como "sin filtro" y
    // devuelve cualquier fila). Mejor fallar aquí con un mensaje claro.
    if (role !== 'superadmin' && (hotelId === undefined || hotelId === null)) {
      throw new ForbiddenException(
        'Tu usuario no tiene un hotel asignado (app_metadata.hotel_id) — contacta al administrador',
      );
    }

    if (hotelId !== undefined && hotelId !== null) {
      const activo = await this.hotelEstaActivo(hotelId);
      if (!activo) {
        throw new ForbiddenException('El hotel está inactivo o no existe');
      }
    }

    (req as any).user = {
      id: payload.sub,
      email: payload.email,
      role,
      hotelId,
    };

    next();
  }

  private extractToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return null;
    return header.split(' ')[1];
  }

  private async verify(token: string): Promise<VerifiedPayload> {
    const secret = process.env.SUPABASE_JWT_SECRET;

    // Verificación local (recomendada): sin round-trip a Supabase por request.
    // Requiere SUPABASE_JWT_SECRET en .env (Dashboard → Settings → API → JWT Settings).
    if (secret) {
      try {
        const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
        return decoded as unknown as VerifiedPayload;
      } catch {
        throw new UnauthorizedException('Token inválido o expirado');
      }
    }

    // Fallback mientras SUPABASE_JWT_SECRET no esté configurado: un round-trip
    // a Supabase por request (más lento, no recomendado con varios hoteles).
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
    return {
      sub: data.user.id,
      email: data.user.email,
      app_metadata: data.user.app_metadata as AppMetadata,
    };
  }

  private async hotelEstaActivo(hotelId: number): Promise<boolean> {
    const cached = this.hotelActivoCache.get(hotelId);
    if (cached && cached.expiraEn > Date.now()) {
      return cached.activo;
    }

    const hotel = await this.hotelRepo.findOne({
      where: { id: hotelId },
      select: ['id', 'activo'],
    });
    const activo = !!hotel?.activo;

    this.hotelActivoCache.set(hotelId, { activo, expiraEn: Date.now() + this.CACHE_TTL_MS });
    return activo;
  }
}
