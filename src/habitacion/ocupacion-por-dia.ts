const DIA_MS = 86_400_000;

export interface EstadiaAsignada {
  habitacionId: number;
  fechaIngreso: string | Date;
  fechaSalida: string | Date;
}

// Normaliza a 'YYYY-MM-DD'. Las columnas `date` llegan ya como string; si el
// cliente manda algo más largo (ej. '2026-09-01T10:00') se toma solo el día,
// igual que hacía el cast `::date` del SQL que esto reemplaza.
function aDia(valor: string | Date): string {
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(valor)) return valor.slice(0, 10);
  return new Date(Date.parse(valor)).toISOString().slice(0, 10);
}

const diaSiguiente = (dia: string): string =>
  new Date(Date.parse(dia) + DIA_MS).toISOString().slice(0, 10);

// Cuántas habitaciones distintas están ocupadas cada día del rango
// [desde, hasta] (ambos inclusive). Una estadía ocupa desde su fechaIngreso
// hasta el día ANTERIOR a fechaSalida (el día de salida ya no cuenta). Una
// habitación con varios huéspedes el mismo día cuenta una sola vez.
//
// Es lógica pura (sin BD) a propósito: reemplaza un generate_series/to_char de
// Postgres para que el conteo no dependa del motor.
export function ocupadasPorDia(
  estadias: EstadiaAsignada[],
  desde: string,
  hasta: string,
): { fecha: string; ocupadas: number }[] {
  const desdeDia = aDia(desde);
  const hastaDia = aDia(hasta);

  // Comparar strings 'YYYY-MM-DD' equivale a comparar fechas.
  const porDia = new Map<string, Set<number>>();
  for (let dia = desdeDia; dia <= hastaDia; dia = diaSiguiente(dia)) {
    porDia.set(dia, new Set());
  }

  for (const e of estadias) {
    const ingreso = aDia(e.fechaIngreso);
    const salida = aDia(e.fechaSalida);
    let dia = ingreso > desdeDia ? ingreso : desdeDia;
    for (; dia < salida && dia <= hastaDia; dia = diaSiguiente(dia)) {
      porDia.get(dia)!.add(e.habitacionId);
    }
  }

  return [...porDia].map(([fecha, habitaciones]) => ({
    fecha,
    ocupadas: habitaciones.size,
  }));
}
