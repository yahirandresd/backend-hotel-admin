import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { json } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { assertRowLevelSecurity } from './database/rls-assertion';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Si RLS está mal configurado (o la app quedó conectada como dueña de las
  // tablas, bypaseándolo), el proceso no arranca — ver database/rls-assertion.ts.
  await assertRowLevelSecurity(app.get(DataSource));

  // Headers de seguridad HTTP
  app.use(helmet());

  // Límite de tamaño del body
  app.use(json({ limit: '10kb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,
      forbidNonWhitelisted: true,
      transform:            true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS desde variable de entorno
  app.enableCors({
    origin:  process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}/api`);
}

bootstrap();
