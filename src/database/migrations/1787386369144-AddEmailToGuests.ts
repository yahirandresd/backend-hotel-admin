import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailToGuests1787386369144 implements MigrationInterface {
    name = 'AddEmailToGuests1787386369144'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "guests" ADD "email" character varying(150)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "guests" DROP COLUMN "email"`);
    }

}
