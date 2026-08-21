import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1787267853495 implements MigrationInterface {
    name = 'InitialSchema1787267853495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "habitacion" ("id" SERIAL NOT NULL, "numero" character varying(10) NOT NULL, "piso" integer NOT NULL, "estado" character varying(20) NOT NULL DEFAULT 'disponible', "notas" text, "tipoId" integer NOT NULL, CONSTRAINT "PK_73bc53f59f307a6e3a405ff0fec" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tipo_habitacion" ("id" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "descripcion" text, "capacidad" integer NOT NULL, "precioBase" numeric(10,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4e386396f14c49c795334c7be20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "plan" ("id" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "descripcion" text, "precioPersona" numeric(10,2) NOT NULL, "noches" integer NOT NULL, "maxPersonas" integer, "activo" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_54a2b686aed3b637654bf7ddbb3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "huesped_requisito" ("id" SERIAL NOT NULL, "huespedId" integer NOT NULL, "reservacionId" integer NOT NULL, "respuesta" boolean NOT NULL, "notas" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "requisitoId" integer NOT NULL, CONSTRAINT "PK_138afbe840e68c3ef094672e7d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "requisito" ("id" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "descripcion" text, "activo" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_94cf717715ddf9d0ddc8e4b704f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pago" ("id" SERIAL NOT NULL, "monto" numeric(10,2) NOT NULL, "metodo" character varying(30) NOT NULL, "estado" character varying(20) NOT NULL DEFAULT 'completado', "referencia" character varying(100), "notas" text, "reservacionId" integer NOT NULL, "fechaPago" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6be14be998d5e41f10e58c0e651" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reservations" ("id" SERIAL NOT NULL, "titularDocNum" character varying(20) NOT NULL, "fechaIngreso" date NOT NULL, "fechaSalida" date NOT NULL, "motivo" character varying(100) NOT NULL, "estado" character varying(20) NOT NULL DEFAULT 'pendiente', "planId" integer, "precioTotal" numeric(10,2) NOT NULL DEFAULT '0', "canalOrigen" character varying(20) NOT NULL DEFAULT 'web', "notas" text, "aceptaTerminos" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_da95cef71b617ac35dc5bcda243" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "guests" ("id" SERIAL NOT NULL, "docType" character varying(10) NOT NULL, "docNum" character varying(20) NOT NULL, "nombre" character varying(100) NOT NULL, "apellido" character varying(100) NOT NULL, "fechaNac" date NOT NULL, "ciudadResidencia" character varying(100), "ciudadOrigen" character varying(100), "tel1" character varying(20), "tel2" character varying(20), "vacuna" character varying(2) NOT NULL, "esTitular" boolean NOT NULL DEFAULT false, "reservationId" integer NOT NULL, CONSTRAINT "PK_4948267e93869ddcc6b340a2c46" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "huesped_reservacion" ("id" SERIAL NOT NULL, "guestId" integer NOT NULL, "reservacionId" integer NOT NULL, "habitacionId" integer, "precioNoche" numeric(10,2), "esTitular" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee08bb8c652d764cb24e5203ba5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reservation_links" ("id" SERIAL NOT NULL, "code" character varying(7) NOT NULL, "reservationId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fb69d24674b508be734cb18f6e1" UNIQUE ("code"), CONSTRAINT "PK_b7d78271188db104bfbd7f783c0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "habitacion" ADD CONSTRAINT "FK_3fddcf09bc5e048e3dd11cebc46" FOREIGN KEY ("tipoId") REFERENCES "tipo_habitacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "huesped_requisito" ADD CONSTRAINT "FK_4c82d225ba9c43c9256f01adf47" FOREIGN KEY ("requisitoId") REFERENCES "requisito"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pago" ADD CONSTRAINT "FK_7efdae4797332262c3eec795f7e" FOREIGN KEY ("reservacionId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD CONSTRAINT "FK_d592a7b882aa9c62d8524f8437f" FOREIGN KEY ("planId") REFERENCES "plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "guests" ADD CONSTRAINT "FK_3e354b6fecd1810f6fba0195481" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "huesped_reservacion" ADD CONSTRAINT "FK_dc32de507e35bdf3f3acde89c7a" FOREIGN KEY ("reservacionId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "huesped_reservacion" ADD CONSTRAINT "FK_a49777eed02dad12687bca8f5de" FOREIGN KEY ("habitacionId") REFERENCES "habitacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "huesped_reservacion" DROP CONSTRAINT "FK_a49777eed02dad12687bca8f5de"`);
        await queryRunner.query(`ALTER TABLE "huesped_reservacion" DROP CONSTRAINT "FK_dc32de507e35bdf3f3acde89c7a"`);
        await queryRunner.query(`ALTER TABLE "guests" DROP CONSTRAINT "FK_3e354b6fecd1810f6fba0195481"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_d592a7b882aa9c62d8524f8437f"`);
        await queryRunner.query(`ALTER TABLE "pago" DROP CONSTRAINT "FK_7efdae4797332262c3eec795f7e"`);
        await queryRunner.query(`ALTER TABLE "huesped_requisito" DROP CONSTRAINT "FK_4c82d225ba9c43c9256f01adf47"`);
        await queryRunner.query(`ALTER TABLE "habitacion" DROP CONSTRAINT "FK_3fddcf09bc5e048e3dd11cebc46"`);
        await queryRunner.query(`DROP TABLE "reservation_links"`);
        await queryRunner.query(`DROP TABLE "huesped_reservacion"`);
        await queryRunner.query(`DROP TABLE "guests"`);
        await queryRunner.query(`DROP TABLE "reservations"`);
        await queryRunner.query(`DROP TABLE "pago"`);
        await queryRunner.query(`DROP TABLE "requisito"`);
        await queryRunner.query(`DROP TABLE "huesped_requisito"`);
        await queryRunner.query(`DROP TABLE "plan"`);
        await queryRunner.query(`DROP TABLE "tipo_habitacion"`);
        await queryRunner.query(`DROP TABLE "habitacion"`);
    }

}
