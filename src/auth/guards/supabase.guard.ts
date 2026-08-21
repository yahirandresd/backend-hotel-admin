import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// La verificación real del JWT y la resolución del tenant ocurren en
// TenantMiddleware (corre antes que los guards, en TODAS las rutas menos las
// públicas — ver src/app.module.ts). Este guard queda como fallback barato:
// si la ruta es pública, pasa; si no, exige que el middleware ya haya
// adjuntado request.user (si no está, algo en el wiring de middlewares está
// mal configurado, y es mejor fallar aquí que dejar pasar la petición).
@Injectable()
export class SupabaseGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    if (!(request as any).user) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    return true;
  }
}
