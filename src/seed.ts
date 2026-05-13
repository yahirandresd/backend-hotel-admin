import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';

import { TipoHabitacion } from './tipo-habitacion/entities/tipo-habitacion.entity';
import { Habitacion } from './habitacion/entities/habitacion.entity';
import { Servicio } from './servicios/entities/servicio.entity';
import { Actividad } from './actividades/entities/actividad.entity';
import { ActividadEvento } from './actividades/entities/actividad-evento.entity';
import { Plan } from './planes/entities/plan.entity';
import { PlanActividad } from './planes/entities/plan-actividad.entity';
import { PlanServicio } from './planes/entities/plan-servicio.entity';
import { Requisito } from './requisitos/entities/requisito.entity';
import { ReservationLink } from './reservation-links/entities/reservation-link.entity';
import { Guest } from './guests/entities/guest.entity';
import { Reservation } from './reservations/entities/reservation.entity';
import { HuespedReservacion } from './reservations/entities/huesped-reservacion.entity';
import { ReservacionServicio } from './reservations/entities/reservacion-servicio.entity';
import { ReservacionActividad } from './actividades/entities/reservacion-actividad.entity';
import { ActividadEventoGasto } from './actividades/entities/actividad-evento-gasto.entity';
import { HuespedRequisito } from './requisitos/entities/huesped-requisito.entity';
import { Pago } from './pagos/entities/pago.entity';

const ds = new DataSource({
  type:     'postgres',
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME     ?? 'hotel_reservations',
  entities: [
    TipoHabitacion, Habitacion,
    Servicio,
    Actividad, ActividadEvento, ActividadEventoGasto, ReservacionActividad,
    Plan, PlanActividad, PlanServicio,
    Requisito, HuespedRequisito,
    Guest, Reservation, HuespedReservacion, ReservacionServicio, Pago,
    ReservationLink,
  ],
  synchronize: false,
});

async function seed() {
  await ds.initialize();
  console.log('✔ Conectado a la BD');

  // ── Limpiar todas las tablas ──────────────────────────────────────────────
  await ds.query(`
    TRUNCATE TABLE
      huesped_requisito,
      pago,
      reservacion_actividad,
      reservacion_servicio,
      huesped_reservacion,
      reservation_links,
      guests,
      reservations,
      actividad_evento_gasto,
      actividad_evento,
      plan_actividad,
      plan_servicio,
      plan,
      actividad,
      servicio,
      habitacion,
      tipo_habitacion,
      requisito
    RESTART IDENTITY CASCADE
  `);
  console.log('✔ Tablas limpiadas');

  // ── Tipo de habitación ────────────────────────────────────────────────────
  const tipoRepo = ds.getRepository(TipoHabitacion);
  const [sencilla, doble, suiteJr, cabana] = await tipoRepo.save([
    { nombre: 'Sencilla',         descripcion: 'Habitación para 1 persona con cama doble',       capacidad: 1, precioBase: 120000 },
    { nombre: 'Doble',            descripcion: 'Habitación para 2 personas con dos camas',        capacidad: 2, precioBase: 200000 },
    { nombre: 'Suite Junior',     descripcion: 'Suite con sala, jacuzzi y vista al jardín',       capacidad: 3, precioBase: 320000 },
    { nombre: 'Cabaña Familiar',  descripcion: 'Cabaña privada para familias, hasta 6 personas',  capacidad: 6, precioBase: 480000 },
  ]);
  console.log('✔ Tipos de habitación');

  // ── Habitaciones ──────────────────────────────────────────────────────────
  const habRepo = ds.getRepository(Habitacion);
  await habRepo.save([
    { numero: '101', piso: 1, estado: 'disponible', tipoId: sencilla.id },
    { numero: '102', piso: 1, estado: 'disponible', tipoId: sencilla.id },
    { numero: '103', piso: 1, estado: 'disponible', tipoId: doble.id },
    { numero: '104', piso: 1, estado: 'disponible', tipoId: doble.id },
    { numero: '201', piso: 2, estado: 'disponible', tipoId: doble.id },
    { numero: '202', piso: 2, estado: 'disponible', tipoId: doble.id },
    { numero: '203', piso: 2, estado: 'disponible', tipoId: suiteJr.id },
    { numero: '301', piso: 3, estado: 'disponible', tipoId: suiteJr.id },
    { numero: '302', piso: 3, estado: 'mantenimiento', notas: 'Cambio de tuberías', tipoId: cabana.id },
    { numero: '303', piso: 3, estado: 'disponible', tipoId: cabana.id },
  ]);
  console.log('✔ Habitaciones');

  // ── Servicios ─────────────────────────────────────────────────────────────
  const svcRepo = ds.getRepository(Servicio);
  const [desayuno, almuerzo, cena, transporte, spa, tour] = await svcRepo.save([
    { nombre: 'Desayuno continental', descripcion: 'Buffet de desayuno incluye jugos y frutas', precio: 25000,  categoria: 'alimentacion', activo: true },
    { nombre: 'Almuerzo',             descripcion: 'Menú del día con sopa, seco y postre',       precio: 38000,  categoria: 'alimentacion', activo: true },
    { nombre: 'Cena romántica',       descripcion: 'Cena a la luz de velas con menú de 4 tiempos', precio: 65000, categoria: 'alimentacion', activo: true },
    { nombre: 'Transporte aeropuerto',descripcion: 'Traslado ida o vuelta al aeropuerto',         precio: 85000,  categoria: 'transporte',   activo: true },
    { nombre: 'Masajes y spa',        descripcion: 'Sesión de masajes relajantes 60 min',         precio: 120000, categoria: 'spa',          activo: true },
    { nombre: 'Tour por el pueblo',   descripcion: 'Recorrido guiado por el centro histórico',    precio: 45000,  categoria: 'tour',         activo: true },
  ]);
  console.log('✔ Servicios');

  // ── Actividades ───────────────────────────────────────────────────────────
  const actRepo = ds.getRepository(Actividad);
  const [kayak, senderismo, pesca] = await actRepo.save([
    { nombre: 'Kayak en el río',      descripcion: 'Recorrido en kayak por el río con guía certificado', precio: 90000,  duracionHoras: 3, activo: true },
    { nombre: 'Senderismo al mirador',descripcion: 'Caminata ecológica con vista panorámica',            precio: 50000,  duracionHoras: 4, activo: true },
    { nombre: 'Pesca deportiva',       descripcion: 'Pesca en el lago con equipo incluido',              precio: 120000, duracionHoras: 5, activo: true },
  ]);
  console.log('✔ Actividades');

  // ── Eventos de actividad ──────────────────────────────────────────────────
  const eventoRepo = ds.getRepository(ActividadEvento);
  const gastoRepo  = ds.getRepository(ActividadEventoGasto);

  const evKayak1 = await eventoRepo.save({
    actividadId: kayak.id, fecha: '2026-06-07', cuposDisponibles: 8, estado: 'programada',
  });
  const evKayak2 = await eventoRepo.save({
    actividadId: kayak.id, fecha: '2026-06-14', cuposDisponibles: 8, estado: 'programada',
  });
  const evSenderismo = await eventoRepo.save({
    actividadId: senderismo.id, fecha: '2026-06-08', cuposDisponibles: 15, estado: 'programada',
  });
  const evPesca = await eventoRepo.save({
    actividadId: pesca.id, fecha: '2026-06-10', cuposDisponibles: 6, estado: 'programada',
  });

  await gastoRepo.save([
    { eventoId: evKayak1.id, concepto: 'Alquiler kayaks', monto: 180000 },
    { eventoId: evKayak1.id, concepto: 'Guía certificado', monto: 80000 },
    { eventoId: evKayak2.id, concepto: 'Alquiler kayaks', monto: 180000 },
    { eventoId: evKayak2.id, concepto: 'Guía certificado', monto: 80000 },
    { eventoId: evSenderismo.id, concepto: 'Guía ecológico', monto: 60000 },
    { eventoId: evSenderismo.id, concepto: 'Refrigerios',   monto: 45000 },
    { eventoId: evPesca.id, concepto: 'Equipo de pesca',    monto: 95000 },
    { eventoId: evPesca.id, concepto: 'Transporte lancha',  monto: 70000 },
  ]);
  console.log('✔ Eventos y gastos de actividades');

  // ── Planes ────────────────────────────────────────────────────────────────
  const planRepo  = ds.getRepository(Plan);
  const pActRepo  = ds.getRepository(PlanActividad);
  const pSvcRepo  = ds.getRepository(PlanServicio);

  const planRomantico = await planRepo.save({
    nombre:      'Plan Romántico',
    descripcion: 'Ideal para parejas: 2 noches en Suite Junior, desayuno y cena romántica incluidos',
    precio:      850000,
    noches:      2,
    activo:      true,
  });
  const planAventura = await planRepo.save({
    nombre:      'Plan Aventura',
    descripcion: '3 noches con desayuno, kayak y senderismo incluidos para toda la familia',
    precio:      1400000,
    noches:      3,
    activo:      true,
  });
  const planCompleto = await planRepo.save({
    nombre:      'Plan Todo Incluido',
    descripcion: '4 noches con todas las comidas, spa, tour y pesca incluidos',
    precio:      2200000,
    noches:      4,
    activo:      true,
  });

  await pSvcRepo.save([
    { planId: planRomantico.id, servicioId: desayuno.id,   cantidad: 2 },
    { planId: planRomantico.id, servicioId: cena.id,       cantidad: 1 },
    { planId: planAventura.id,  servicioId: desayuno.id,   cantidad: 3 },
    { planId: planCompleto.id,  servicioId: desayuno.id,   cantidad: 4 },
    { planId: planCompleto.id,  servicioId: almuerzo.id,   cantidad: 4 },
    { planId: planCompleto.id,  servicioId: cena.id,       cantidad: 4 },
    { planId: planCompleto.id,  servicioId: spa.id,        cantidad: 1 },
    { planId: planCompleto.id,  servicioId: tour.id,       cantidad: 1 },
  ]);
  await pActRepo.save([
    { planId: planAventura.id,  actividadId: kayak.id,       cantidad: 1 },
    { planId: planAventura.id,  actividadId: senderismo.id,  cantidad: 1 },
    { planId: planCompleto.id,  actividadId: kayak.id,       cantidad: 1 },
    { planId: planCompleto.id,  actividadId: pesca.id,       cantidad: 1 },
  ]);
  console.log('✔ Planes');

  // ── Requisitos ────────────────────────────────────────────────────────────
  const reqRepo = ds.getRepository(Requisito);
  await reqRepo.save([
    { nombre: 'Esquema de vacunación completo', descripcion: 'COVID-19 y fiebre amarilla al día', activo: true },
    { nombre: 'Test de antígenos negativo',     descripcion: 'Resultado negativo en últimas 72h', activo: true },
  ]);
  console.log('✔ Requisitos');

  // ── Reservation links de prueba ───────────────────────────────────────────
  const linkRepo = ds.getRepository(ReservationLink);
  await linkRepo.save([
    { code: 'abc1234' },
    { code: 'xyz5678' },
    { code: 'test001' },
  ]);
  console.log('✔ Reservation links de prueba');

  await ds.destroy();
  console.log('\n🎉 Seed completado exitosamente');
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
