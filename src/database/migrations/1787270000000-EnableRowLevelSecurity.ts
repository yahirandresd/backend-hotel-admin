import { MigrationInterface, QueryRunner } from 'typeorm';

// Tablas operacionales — todas llevan hotel_id y quedan bajo RLS.
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

export class EnableRowLevelSecurity1787270000000 implements MigrationInterface {
  name = 'EnableRowLevelSecurity1787270000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Rol de aplicación (NOBYPASSRLS — el owner/superusuario sí bypasea RLS) ──
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'rooma_app') THEN
          CREATE ROLE rooma_app LOGIN PASSWORD '${process.env.ROOMA_APP_DB_PASSWORD}' NOBYPASSRLS;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`GRANT CONNECT ON DATABASE ${process.env.DB_NAME ?? 'hotel_reservations'} TO rooma_app;`);
    await queryRunner.query(`GRANT USAGE ON SCHEMA public TO rooma_app;`);
    await queryRunner.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON hotel TO rooma_app;`);
    await queryRunner.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON migrations TO rooma_app;`);

    for (const table of TENANT_TABLES) {
      await queryRunner.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON "${table}" TO rooma_app;`);
    }

    // Secuencias de las columnas SERIAL — sin esto los INSERT fallan.
    await queryRunner.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rooma_app;`);

    // ── Función pública para resolver el hotel de un reservation_link sin JWT ──
    // SECURITY DEFINER: corre con los privilegios del owner (bypasea RLS), pero
    // solo devuelve un entero — no expone ninguna fila de la tabla.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.hotel_id_for_link_code(p_code text)
      RETURNS int
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      SET search_path = public
      AS $$
        SELECT hotel_id FROM reservation_links
        WHERE code = p_code AND "reservationId" IS NULL;
      $$;
    `);
    await queryRunner.query(`REVOKE ALL ON FUNCTION public.hotel_id_for_link_code(text) FROM PUBLIC;`);
    await queryRunner.query(`GRANT EXECUTE ON FUNCTION public.hotel_id_for_link_code(text) TO rooma_app;`);

    // ── Row-Level Security ──────────────────────────────────────────────────
    for (const table of TENANT_TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      await queryRunner.query(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`);
      await queryRunner.query(`
        CREATE POLICY tenant_isolation ON "${table}"
        USING (hotel_id = NULLIF(current_setting('app.hotel_id', true), '')::int)
        WITH CHECK (hotel_id = NULLIF(current_setting('app.hotel_id', true), '')::int);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TENANT_TABLES) {
      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON "${table}";`);
      await queryRunner.query(`ALTER TABLE "${table}" NO FORCE ROW LEVEL SECURITY;`);
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`);
    }

    await queryRunner.query(`DROP FUNCTION IF EXISTS public.hotel_id_for_link_code(text);`);

    for (const table of TENANT_TABLES) {
      await queryRunner.query(`REVOKE ALL ON "${table}" FROM rooma_app;`);
    }
    await queryRunner.query(`REVOKE ALL ON hotel FROM rooma_app;`);
    await queryRunner.query(`REVOKE ALL ON migrations FROM rooma_app;`);
    await queryRunner.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM rooma_app;`);
  }
}
