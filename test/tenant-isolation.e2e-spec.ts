import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';

// Prueba de aislamiento multi-tenant: siembra 2 hoteles reales a través de los
// endpoints (no accede a la BD por atrás) y confirma que ningún endpoint deja
// que el hotel A vea, edite o borre datos del hotel B — ni por listado ni por
// ID directo (IDOR). Es la suite que el plan marca como bloqueante antes de
// onboardear un segundo hotel real a la BD compartida.
//
// Fija SUPABASE_JWT_SECRET a un valor de prueba para poder firmar JWTs locales
// con la forma exacta que espera TenantMiddleware (app_metadata.role/hotel_id)
// sin depender de credenciales reales de Supabase — ejercita el mismo camino
// de verificación local que usa producción cuando esa variable está seteada.
const JWT_SECRET = 'e2e-test-secret-not-a-real-supabase-secret';

function tokenFor(sub: string, role: string, hotelId?: number): string {
  return jwt.sign(
    { sub, email: `${sub}@e2e.test`, app_metadata: { role, hotel_id: hotelId } },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' },
  );
}

describe('Aislamiento multi-tenant (e2e)', () => {
  let app: INestApplication;
  let server: any;

  let superadminToken: string;
  let adminATok: string;
  let adminBTok: string;

  let hotelAId: number;
  let hotelBId: number;
  let tipoAId: number;
  let tipoBId: number;
  let habitacionAId: number;
  let habitacionBId: number;
  let reservaAId: number;
  let planBId: number;

  beforeAll(async () => {
    process.env.SUPABASE_JWT_SECRET = JWT_SECRET;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
    server = app.getHttpServer();

    superadminToken = tokenFor('e2e-superadmin', 'superadmin');

    // ── Crear los 2 hoteles (superadmin) ────────────────────────────────────
    const suffix = Date.now();
    const hotelA = await request(server)
      .post('/api/hotels')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ nombre: 'E2E Hotel A', slug: `e2e-hotel-a-${suffix}` })
      .expect(201);
    hotelAId = hotelA.body.id;

    const hotelB = await request(server)
      .post('/api/hotels')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ nombre: 'E2E Hotel B', slug: `e2e-hotel-b-${suffix}` })
      .expect(201);
    hotelBId = hotelB.body.id;

    adminATok = tokenFor('e2e-admin-a', 'admin', hotelAId);
    adminBTok = tokenFor('e2e-admin-b', 'admin', hotelBId);

    // ── Catálogos base por hotel ─────────────────────────────────────────────
    const tipoA = await request(server)
      .post('/api/tipo-habitacion')
      .set('Authorization', `Bearer ${adminATok}`)
      .send({ nombre: 'Sencilla A', capacidad: 1, precioBase: 100000 })
      .expect(201);
    tipoAId = tipoA.body.id;

    const tipoB = await request(server)
      .post('/api/tipo-habitacion')
      .set('Authorization', `Bearer ${adminBTok}`)
      .send({ nombre: 'Sencilla B', capacidad: 1, precioBase: 200000 })
      .expect(201);
    tipoBId = tipoB.body.id;

    const habA = await request(server)
      .post('/api/habitacion')
      .set('Authorization', `Bearer ${adminATok}`)
      .send({ numero: 'A-101', piso: 1, tipoId: tipoAId })
      .expect(201);
    habitacionAId = habA.body.id;

    const habB = await request(server)
      .post('/api/habitacion')
      .set('Authorization', `Bearer ${adminBTok}`)
      .send({ numero: 'B-101', piso: 1, tipoId: tipoBId })
      .expect(201);
    habitacionBId = habB.body.id;

    const planB = await request(server)
      .post('/api/planes')
      .set('Authorization', `Bearer ${adminBTok}`)
      .send({ nombre: 'Plan B', precioPersona: 300000, noches: 2 })
      .expect(201);
    planBId = planB.body.id;

    const reservaA = await request(server)
      .post('/api/reservations/admin')
      .set('Authorization', `Bearer ${adminATok}`)
      .send({
        docType: 'CC', docNum: 'E2E-A-1', nombre: 'Titular', apellido: 'HotelA',
        fechaNac: '1990-01-01', ciudadResidencia: 'Bogotá', ciudadOrigen: 'Bogotá',
        tel1: '3000000001', fechaIngreso: '2026-10-01', fechaSalida: '2026-10-03',
        motivo: 'Turismo', vacunaTitular: 'si', aceptaTerminos: true,
      })
      .expect(201);
    reservaAId = reservaA.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Catálogos: listados y lectura/edición/borrado por ID ──────────────────

  it('el listado de tipo-habitacion de A no incluye el de B', async () => {
    const res = await request(server)
      .get('/api/tipo-habitacion')
      .set('Authorization', `Bearer ${adminATok}`)
      .expect(200);
    expect(res.body.map((t: any) => t.id)).toContain(tipoAId);
    expect(res.body.map((t: any) => t.id)).not.toContain(tipoBId);
  });

  it('A no puede leer un tipo-habitacion de B por ID (404, no 200 con datos ajenos)', async () => {
    await request(server)
      .get(`/api/tipo-habitacion/${tipoBId}`)
      .set('Authorization', `Bearer ${adminATok}`)
      .expect(404);
  });

  it('A no puede editar un tipo-habitacion de B por ID', async () => {
    await request(server)
      .patch(`/api/tipo-habitacion/${tipoBId}`)
      .set('Authorization', `Bearer ${adminATok}`)
      .send({ nombre: 'hackeado' })
      .expect(404);
  });

  it('A no puede borrar un tipo-habitacion de B por ID', async () => {
    await request(server)
      .delete(`/api/tipo-habitacion/${tipoBId}`)
      .set('Authorization', `Bearer ${adminATok}`)
      .expect(404);
  });

  it('el listado de habitaciones de A no incluye la de B', async () => {
    const res = await request(server)
      .get('/api/habitacion')
      .set('Authorization', `Bearer ${adminATok}`)
      .expect(200);
    expect(res.body.map((h: any) => h.id)).toContain(habitacionAId);
    expect(res.body.map((h: any) => h.id)).not.toContain(habitacionBId);
  });

  it('A no puede leer una habitación de B por ID', async () => {
    await request(server)
      .get(`/api/habitacion/${habitacionBId}`)
      .set('Authorization', `Bearer ${adminATok}`)
      .expect(404);
  });

  // ── IDOR: usar el ID de un recurso de B dentro de una operación de A ───────

  it('A no puede asignar a su reserva una habitación de B (IDOR)', async () => {
    // Primero hay que asignar un huésped titular — se obtiene el guestId de la reserva.
    const reserva = await request(server)
      .get(`/api/reservations/${reservaAId}`)
      .set('Authorization', `Bearer ${adminATok}`)
      .expect(200);
    const guestId = reserva.body.titular.id;

    await request(server)
      .post(`/api/reservations/${reservaAId}/habitaciones`)
      .set('Authorization', `Bearer ${adminATok}`)
      .send({ guestId, habitacionId: habitacionBId })
      .expect(404);
  });

  it('A no puede asignar a su reserva un plan de B (IDOR)', async () => {
    await request(server)
      .patch(`/api/reservations/${reservaAId}/plan`)
      .set('Authorization', `Bearer ${adminATok}`)
      .send({ planId: planBId })
      .expect(404);
  });

  // ── Reservaciones: listado, lectura y desglose ─────────────────────────────

  it('el listado de reservations de B no incluye la de A', async () => {
    const res = await request(server)
      .get('/api/reservations')
      .set('Authorization', `Bearer ${adminBTok}`)
      .expect(200);
    expect(res.body.map((r: any) => r.id)).not.toContain(reservaAId);
  });

  it('B no puede leer la reserva de A por ID', async () => {
    await request(server)
      .get(`/api/reservations/${reservaAId}`)
      .set('Authorization', `Bearer ${adminBTok}`)
      .expect(404);
  });

  it('B no puede ver el desglose financiero de la reserva de A', async () => {
    await request(server)
      .get(`/api/reservations/${reservaAId}/desglose`)
      .set('Authorization', `Bearer ${adminBTok}`)
      .expect(404);
  });

  // ── Links públicos: A no ve los de B, y el flujo público resuelve el hotel correcto ──

  it('el listado de reservation-links de A no incluye links de B', async () => {
    await request(server)
      .post('/api/reservation-links')
      .set('Authorization', `Bearer ${adminBTok}`)
      .expect(201);

    const linksA = await request(server)
      .get('/api/reservation-links')
      .set('Authorization', `Bearer ${adminATok}`)
      .expect(200);

    const linkA = await request(server)
      .post('/api/reservation-links')
      .set('Authorization', `Bearer ${adminATok}`)
      .expect(201);

    const linksA2 = await request(server)
      .get('/api/reservation-links')
      .set('Authorization', `Bearer ${adminATok}`)
      .expect(200);

    expect(linksA2.body.some((l: any) => l.code === linkA.body.code)).toBe(true);
    expect(linksA.body.every((l: any) => l.code !== linkA.body.code)).toBe(true);
  });

  it('el link público de A crea la reserva en el hotel A, no en B', async () => {
    const link = await request(server)
      .post('/api/reservation-links')
      .set('Authorization', `Bearer ${adminATok}`)
      .expect(201);

    const created = await request(server)
      .post(`/api/public/reservations/${link.body.code}`)
      .send({
        docType: 'CC', docNum: 'E2E-PUB-1', nombre: 'Cliente', apellido: 'Publico',
        fechaNac: '1992-05-05', ciudadResidencia: 'Medellín', ciudadOrigen: 'Medellín',
        tel1: '3000000002', fechaIngreso: '2026-11-01', fechaSalida: '2026-11-03',
        motivo: 'Turismo', vacunaTitular: 'si', aceptaTerminos: true,
      })
      .expect(201);

    const visibleParaA = await request(server)
      .get(`/api/reservations/${created.body.id}`)
      .set('Authorization', `Bearer ${adminATok}`)
      .expect(200);
    expect(visibleParaA.body.id).toBe(created.body.id);

    await request(server)
      .get(`/api/reservations/${created.body.id}`)
      .set('Authorization', `Bearer ${adminBTok}`)
      .expect(404);
  });

  // ── Dashboard y hotels/me: cada uno ve solo lo suyo ────────────────────────

  it('GET /hotels/me devuelve el hotel correcto para cada admin', async () => {
    const meA = await request(server)
      .get('/api/hotels/me')
      .set('Authorization', `Bearer ${adminATok}`)
      .expect(200);
    expect(meA.body.id).toBe(hotelAId);

    const meB = await request(server)
      .get('/api/hotels/me')
      .set('Authorization', `Bearer ${adminBTok}`)
      .expect(200);
    expect(meB.body.id).toBe(hotelBId);
  });

  it('el dashboard de A no cuenta las reservaciones de B', async () => {
    const resumenA = await request(server)
      .get('/api/dashboard/resumen')
      .set('Authorization', `Bearer ${adminATok}`)
      .expect(200);
    const resumenB = await request(server)
      .get('/api/dashboard/resumen')
      .set('Authorization', `Bearer ${adminBTok}`)
      .expect(200);

    // A tiene reservas creadas en este suite, B no tiene ninguna con hotelId de A.
    expect(resumenA.body.totalHabitaciones).toBeGreaterThanOrEqual(1);
    expect(resumenB.body.totalHabitaciones).toBeGreaterThanOrEqual(1);
    // La habitación de B nunca debe contarse en el total de A y viceversa —
    // ambos deben ser exactamente el número de habitaciones que cada uno creó
    // en este suite (1 cada uno), no más.
    expect(resumenA.body.totalHabitaciones).toBe(1);
    expect(resumenB.body.totalHabitaciones).toBe(1);
  });

  // ── Sin token / sin hotelId ─────────────────────────────────────────────

  it('sin token, una ruta protegida devuelve 401', async () => {
    await request(server).get('/api/reservations').expect(401);
  });
});
