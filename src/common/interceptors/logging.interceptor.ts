import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx      = context.switchToHttp();
    const request  = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const start    = Date.now();

    return next.handle().pipe(
      tap(() => {
        const user   = (request as any).user;
        const ms     = Date.now() - start;
        const ip     = request.headers['x-forwarded-for']
                       ?? request.socket.remoteAddress
                       ?? 'unknown';
        const now    = new Date().toISOString().replace('T', ' ').slice(0, 19);

        console.log(
          `[${now}] ${user?.email ?? 'anonymous'} | ${user?.role ?? '-'} | ${ip} | ${request.method} ${request.url} | ${response.statusCode} | ${ms}ms`,
        );
      }),
    );
  }
}
