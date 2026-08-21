import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHotelAndHotelId1787268093549 implements MigrationInterface {
    name = 'AddHotelAndHotelId1787268093549'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hotel" ("id" SERIAL NOT NULL, "nombre" character varying(120) NOT NULL, "slug" character varying(60) NOT NULL, "nombreLegal" character varying(160), "nit" character varying(30), "email" character varying(120), "telefono" character varying(30), "direccion" character varying(200), "ciudad" character varying(100), "pais" character varying(2) NOT NULL DEFAULT 'CO', "timezone" character varying(50) NOT NULL DEFAULT 'America/Bogota', "moneda" character varying(3) NOT NULL DEFAULT 'COP', "logoUrl" text, "checkInHora" TIME NOT NULL DEFAULT '15:00:00', "checkOutHora" TIME NOT NULL DEFAULT '12:00:00', "politicaCancelacion" text, "activo" boolean NOT NULL DEFAULT true, "notasInternas" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4400ea6a904a7af0e4ab6c3354b" UNIQUE ("slug"), CONSTRAINT "PK_3a62ac86b369b36c1a297e9ab26" PRIMARY KEY ("id"))`);

        // M1 — hotel único preexistente: todos los datos actuales de la BD son suyos.
        await queryRunner.query(`INSERT INTO "hotel" ("nombre", "slug") VALUES ('Hotel Norcasia', 'norcasia')`);

        // M2 — hotel_id nullable en las 10 tablas operacionales (compatible con el código
        // que corría antes de esta migración).
        await queryRunner.query(`ALTER TABLE "habitacion" ADD "hotel_id" integer`);
        await queryRunner.query(`ALTER TABLE "tipo_habitacion" ADD "hotel_id" integer`);
        await queryRunner.query(`ALTER TABLE "plan" ADD "hotel_id" integer`);
        await queryRunner.query(`ALTER TABLE "huesped_requisito" ADD "hotel_id" integer`);
        await queryRunner.query(`ALTER TABLE "requisito" ADD "hotel_id" integer`);
        await queryRunner.query(`ALTER TABLE "pago" ADD "hotel_id" integer`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD "hotel_id" integer`);
        await queryRunner.query(`ALTER TABLE "guests" ADD "hotel_id" integer`);
        await queryRunner.query(`ALTER TABLE "huesped_reservacion" ADD "hotel_id" integer`);
        await queryRunner.query(`ALTER TABLE "reservation_links" ADD "hotel_id" integer`);

        // M3 — backfill: todas las filas existentes pertenecen al hotel recién creado.
        const [{ id: hotelId }] = await queryRunner.query(
            `SELECT "id" FROM "hotel" WHERE "slug" = 'norcasia'`,
        );
        for (const table of [
            'habitacion', 'tipo_habitacion', 'plan', 'huesped_requisito', 'requisito',
            'pago', 'reservations', 'guests', 'huesped_reservacion', 'reservation_links',
        ]) {
            await queryRunner.query(`UPDATE "${table}" SET "hotel_id" = $1 WHERE "hotel_id" IS NULL`, [hotelId]);
        }

        // NOT NULL, default por GUC, FKs compuestas e índices llegan en una migración
        // posterior (M4), una vez exista el plumbing de tenant (pools por hotel que fijan
        // app.hotel_id en cada conexión) — hasta entonces la app sigue escribiendo estas
        // columnas explícitamente y NOT NULL/DEFAULT current_setting() romperían los inserts.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation_links" DROP COLUMN "hotel_id"`);
        await queryRunner.query(`ALTER TABLE "huesped_reservacion" DROP COLUMN "hotel_id"`);
        await queryRunner.query(`ALTER TABLE "guests" DROP COLUMN "hotel_id"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP COLUMN "hotel_id"`);
        await queryRunner.query(`ALTER TABLE "pago" DROP COLUMN "hotel_id"`);
        await queryRunner.query(`ALTER TABLE "requisito" DROP COLUMN "hotel_id"`);
        await queryRunner.query(`ALTER TABLE "huesped_requisito" DROP COLUMN "hotel_id"`);
        await queryRunner.query(`ALTER TABLE "plan" DROP COLUMN "hotel_id"`);
        await queryRunner.query(`ALTER TABLE "tipo_habitacion" DROP COLUMN "hotel_id"`);
        await queryRunner.query(`ALTER TABLE "habitacion" DROP COLUMN "hotel_id"`);
        await queryRunner.query(`DROP TABLE "hotel"`);
    }

}
