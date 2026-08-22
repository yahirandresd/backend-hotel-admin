import { MigrationInterface, QueryRunner } from 'typeorm';

// Supabase habilita automáticamente RLS en cualquier tabla nueva del schema
// public sin policies (para que no quede expuesta por accidente vía su API
// REST/GraphQL a los roles anon/authenticated). Eso alcanza a `hotel`, que en
// este proyecto nunca tuvo RLS (no es una tabla tenant-scoped por hotel_id,
// es la raíz — su control de acceso vive en la capa de aplicación). Sin una
// policy, rooma_app (que no tiene BYPASSRLS) queda bloqueado por completo en
// hotel: HotelModule usa TypeOrmModule.forFeature([Hotel]) directo (no pasa
// por el manager con app.hotel_id seteado), así que todo endpoint /hotels
// devolvería 0 filas o fallaría el WITH CHECK en Supabase sin este fix.
export class AllowRoomaAppOnHotel1787439450406 implements MigrationInterface {
  name = 'AllowRoomaAppOnHotel1787439450406';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hotel" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY rooma_app_full_access ON "hotel"
      FOR ALL TO rooma_app
      USING (true)
      WITH CHECK (true);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS rooma_app_full_access ON "hotel";`);
    await queryRunner.query(`ALTER TABLE "hotel" DISABLE ROW LEVEL SECURITY;`);
  }
}
