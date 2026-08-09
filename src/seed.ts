import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';

import { TipoHabitacion } from './tipo-habitacion/entities/tipo-habitacion.entity';
import { Habitacion } from './habitacion/entities/habitacion.entity';
import { Plan } from './planes/entities/plan.entity';
import { Requisito } from './requisitos/entities/requisito.entity';
import { ReservationLink } from './reservation-links/entities/reservation-link.entity';
import { Guest } from './guests/entities/guest.entity';
import { Reservation } from './reservations/entities/reservation.entity';
import { HuespedReservacion } from './reservations/entities/huesped-reservacion.entity';
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
    Plan,
    Requisito, HuespedRequisito,
    Guest, Reservation, HuespedReservacion, Pago,
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
      huesped_reservacion,
      reservation_links,
      guests,
      reservations,
      plan,
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

  // ── Planes ────────────────────────────────────────────────────────────────
  const planRepo = ds.getRepository(Plan);
  const planAventura = await planRepo.save({
    nombre:        'Plan Aventura',
    descripcion:   '3 noches todo incluido para toda la familia',
    precioPersona: 467000,
    maxPersonas:   6,
    noches:        3,
    activo:        true,
  });
  await planRepo.save([
    {
      nombre:        'Plan Romántico',
      descripcion:   'Ideal para parejas: 2 noches en Suite Junior',
      precioPersona: 425000,
      maxPersonas:   2,
      noches:        2,
      activo:        true,
    },
    {
      nombre:        'Plan Todo Incluido',
      descripcion:   '4 noches con todas las comidas incluidas',
      precioPersona: 550000,
      maxPersonas:   8,
      noches:        4,
      activo:        true,
    },
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

  // 2. Confirmada — habitación asignada
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

  // 3. Check-in activo — habitación ocupada, pago parcial
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

  console.log('✔ Reservaciones (5) con huéspedes, asignaciones y pagos');

  await ds.destroy();
  console.log('\n🎉 Seed completado exitosamente');
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
