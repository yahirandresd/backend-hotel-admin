import { DataSource } from 'typeorm';

const TENANT_TABLES = [
  'habitacion',
  'tipo_habitacion',
  'plan',
  'huesped_requisito',
  'requisito',
  'pago',
  'reservations',
  'guests',
  'huesped_reservacion',
  'reservation_links',
];

// Corre antes de app.listen() (ver main.ts). Si algo de esto falla, el proceso
// NO arranca — convierte "se me olvidó la policy en la tabla nueva" o "la app
// quedó conectada como dueña de las tablas" en un deploy roto y visible, en
// vez de una fuga cross-tenant silenciosa.
export async function assertRowLevelSecurity(dataSource: DataSource): Promise<void> {
  const [{ is_superuser }] = await dataSource.query(
    `SELECT current_setting('is_superuser') AS is_superuser`,
  );
  if (is_superuser !== 'off') {
    throw new Error(
      'La conexión de la app tiene privilegios de superusuario — RLS no aplicaría. ' +
      'Verifica APP_DB_USER en .env (debe ser rooma_app, no el dueño de las tablas).',
    );
  }

  for (const table of TENANT_TABLES) {
    const [row] = await dataSource.query(
      `SELECT relrowsecurity, relforcerowsecurity
       FROM pg_class WHERE relname = $1 AND relkind = 'r'`,
      [table],
    );

    if (!row) {
      throw new Error(`Tabla "${table}" no encontrada al verificar RLS.`);
    }
    if (!row.relrowsecurity || !row.relforcerowsecurity) {
      throw new Error(
        `RLS no está ENABLE+FORCE en la tabla "${table}". ` +
        `Corre la migración EnableRowLevelSecurity o agrégala si es una tabla nueva.`,
      );
    }

    const policies = await dataSource.query(
      `SELECT 1 FROM pg_policies WHERE tablename = $1`,
      [table],
    );
    if (policies.length === 0) {
      throw new Error(`La tabla "${table}" tiene RLS activo pero ninguna policy — todo query devolvería 0 filas.`);
    }
  }

  // Sin app.hotel_id seteado, una tabla protegida debe devolver 0 filas.
  const [{ count }] = await dataSource.query(
    `SELECT count(*)::int AS count FROM reservations`,
  );
  if (Number(count) !== 0) {
    throw new Error(
      'RLS no está bloqueando lecturas sin app.hotel_id — la conexión de arranque ' +
      `vio ${count} fila(s) de "reservations" sin contexto de tenant.`,
    );
  }
}
