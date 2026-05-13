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
  synchronize: true,
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
    nombre:        'Plan Romántico',
    descripcion:   'Ideal para parejas: 2 noches en Suite Junior, desayuno y cena romántica incluidos',
    precioPersona: 425000,
    maxPersonas:   2,
    noches:        2,
    activo:        true,
  });
  const planAventura = await planRepo.save({
    nombre:        'Plan Aventura',
    descripcion:   '3 noches con desayuno, kayak y senderismo incluidos para toda la familia',
    precioPersona: 467000,
    maxPersonas:   6,
    noches:        3,
    activo:        true,
  });
  const planCompleto = await planRepo.save({
    nombre:        'Plan Todo Incluido',
    descripcion:   '4 noches con todas las comidas, spa, tour y pesca incluidos',
    precioPersona: 550000,
    maxPersonas:   8,
    noches:        4,
    activo:        true,
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

  // ── Reservaciones de prueba ───────────────────────────────────────────────
  const resRepo  = ds.getRepository(Reservation);
  const guestRepo = ds.getRepository(Guest);
  const hrRepo   = ds.getRepository(HuespedReservacion);
  const rSvcRepo = ds.getRepository(ReservacionServicio);
  const rActRepo = ds.getRepository(ReservacionActividad);
  const pagoRepo = ds.getRepository(Pago);

  // 1. Pendiente — sin habitación asignada aún
  const res1 = await resRepo.save({
    titularDocNum: '12345678',
    fechaIngreso:  '2026-06-15',
    fechaSalida:   '2026-06-18',
    motivo:        'Turismo',
    estado:        'pendiente',
    canalOrigen:   'web',
    precioTotal:   0,
    aceptaTerminos: true,
  });
  await guestRepo.save([
    { reservationId: res1.id, docType: 'CC', docNum: '12345678', nombre: 'Juan',  apellido: 'Pérez',   fechaNac: '1990-03-15', ciudadResidencia: 'Bogotá',    ciudadOrigen: 'Bogotá',    tel1: '3001234567', vacuna: 'si', esTitular: true  },
    { reservationId: res1.id, docType: 'CC', docNum: '98765432', nombre: 'Laura', apellido: 'Pérez',   fechaNac: '1993-07-22', ciudadResidencia: 'Bogotá',    ciudadOrigen: 'Bogotá',    tel1: '3009876543', vacuna: 'si', esTitular: false },
  ]);

  // 2. Confirmada — habitación asignada, desayuno agregado
  const res2 = await resRepo.save({
    titularDocNum: '23456789',
    fechaIngreso:  '2026-06-01',
    fechaSalida:   '2026-06-04',
    motivo:        'Negocios',
    estado:        'confirmada',
    canalOrigen:   'telefono',
    precioTotal:   0,
    aceptaTerminos: true,
  });
  const g2 = await guestRepo.save(
    { reservationId: res2.id, docType: 'CC', docNum: '23456789', nombre: 'María', apellido: 'García', fechaNac: '1985-11-05', ciudadResidencia: 'Medellín', ciudadOrigen: 'Medellín', tel1: '3112345678', vacuna: 'si', esTitular: true },
  );
  await hrRepo.save({ reservacionId: res2.id, guestId: g2.id, habitacionId: 5, precioNoche: 200000, esTitular: true });
  await rSvcRepo.save({ reservacionId: res2.id, servicioId: desayuno.id, cantidad: 3, precioUnitario: 25000 });

  // 3. Check-in activo — habitación ocupada, spa agregado, pago parcial
  const res3 = await resRepo.save({
    titularDocNum: '34567890',
    fechaIngreso:  '2026-05-10',
    fechaSalida:   '2026-05-14',
    motivo:        'Turismo',
    estado:        'check_in',
    canalOrigen:   'directo',
    precioTotal:   0,
    aceptaTerminos: true,
  });
  const g3a = await guestRepo.save(
    { reservationId: res3.id, docType: 'CC', docNum: '34567890', nombre: 'Carlos', apellido: 'Rodríguez', fechaNac: '1978-06-20', ciudadResidencia: 'Cali', ciudadOrigen: 'Cali', tel1: '3201234567', vacuna: 'si', esTitular: true  },
  );
  const g3b = await guestRepo.save(
    { reservationId: res3.id, docType: 'CC', docNum: '34567891', nombre: 'Sofía',  apellido: 'Rodríguez', fechaNac: '2005-02-10', ciudadResidencia: 'Cali', ciudadOrigen: 'Cali', vacuna: 'no', esTitular: false },
  );
  // Habitación 103 (Doble, id=3) marcada como ocupada
  await habRepo.update(3, { estado: 'ocupada' });
  await hrRepo.save({ reservacionId: res3.id, guestId: g3a.id, habitacionId: 3, precioNoche: 200000, esTitular: true  });
  await hrRepo.save({ reservacionId: res3.id, guestId: g3b.id, habitacionId: 3, precioNoche: 200000, esTitular: false });
  await rSvcRepo.save({ reservacionId: res3.id, servicioId: spa.id, cantidad: 1, precioUnitario: 120000 });
  await rActRepo.save({ reservacionId: res3.id, eventoId: evSenderismo.id, cantidadPersonas: 2, precioUnitario: 50000 });
  await pagoRepo.save({ reservacionId: res3.id, monto: 400000, metodo: 'nequi',    estado: 'completado', referencia: 'NEQ-001' });
  await pagoRepo.save({ reservacionId: res3.id, monto: 200000, metodo: 'efectivo', estado: 'pendiente' });

  // 4. Check-out — estadía completada
  const res4 = await resRepo.save({
    titularDocNum: '45678901',
    fechaIngreso:  '2026-05-01',
    fechaSalida:   '2026-05-05',
    motivo:        'Visita familiar',
    estado:        'check_out',
    canalOrigen:   'web',
    precioTotal:   0,
    aceptaTerminos: true,
  });
  const g4 = await guestRepo.save(
    { reservationId: res4.id, docType: 'CE', docNum: '45678901', nombre: 'Ana', apellido: 'López', fechaNac: '1995-09-30', ciudadResidencia: 'Bucaramanga', ciudadOrigen: 'Bucaramanga', tel1: '3151234567', vacuna: 'si', esTitular: true },
  );
  await hrRepo.save({ reservacionId: res4.id, guestId: g4.id, habitacionId: 1, precioNoche: 120000, esTitular: true });
  await pagoRepo.save({ reservacionId: res4.id, monto: 480000, metodo: 'transferencia', estado: 'completado', referencia: 'TRF-2024-001' });

  // 5. Con plan — Plan Aventura asignado
  const res5 = await resRepo.save({
    titularDocNum: '56789012',
    fechaIngreso:  '2026-06-20',
    fechaSalida:   '2026-06-23',
    motivo:        'Turismo',
    estado:        'confirmada',
    canalOrigen:   'ota',
    planId:        planAventura.id,
    precioTotal:   934000,
    aceptaTerminos: true,
  });
  const g5a = await guestRepo.save(
    { reservationId: res5.id, docType: 'CC', docNum: '56789012', nombre: 'Pedro',   apellido: 'Martínez', fechaNac: '1982-04-18', ciudadResidencia: 'Barranquilla', ciudadOrigen: 'Barranquilla', tel1: '3251234567', vacuna: 'si', esTitular: true  },
  );
  const g5b = await guestRepo.save(
    { reservationId: res5.id, docType: 'CC', docNum: '56789013', nombre: 'Valentina', apellido: 'Martínez', fechaNac: '2010-12-01', ciudadResidencia: 'Barranquilla', ciudadOrigen: 'Barranquilla', vacuna: 'si', esTitular: false },
  );
  await hrRepo.save({ reservacionId: res5.id, guestId: g5a.id, habitacionId: 9, precioNoche: 480000, esTitular: true  });
  await hrRepo.save({ reservacionId: res5.id, guestId: g5b.id, habitacionId: 9, precioNoche: 480000, esTitular: false });
  await pagoRepo.save({ reservacionId: res5.id, monto: 700000, metodo: 'tarjeta_credito', estado: 'completado', referencia: 'TC-9988' });

  console.log('✔ Reservaciones (5) con huéspedes, asignaciones, servicios y pagos');

  await ds.destroy();
  console.log('\n🎉 Seed completado exitosamente');
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
