import { MigrationInterface, QueryRunner } from 'typeorm';

// hotel_id_for_link_code() filtraba "reservationId IS NULL", así que un
// código ya usado no resolvía ningún hotel — el middleware público entonces
// no abría transacción, y ReservationLinksService.validate() nunca llegaba a
// dar su 400 "este enlace ya fue utilizado" (se quedaba en un 404 genérico
// de "código inválido", vía RLS bloqueando la lectura sin contexto de tenant).
// Se quita el filtro: la función solo resuelve el hotel del código, la
// distinción "usado vs. no encontrado" la sigue dando el service, ya con la
// fila real disponible dentro de la transacción de tenant correcta.
export class FixLinkCodeFunctionUsedLinks1787270100000 implements MigrationInterface {
  name = 'FixLinkCodeFunctionUsedLinks1787270100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.hotel_id_for_link_code(p_code text)
      RETURNS int
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      SET search_path = public
      AS $$
        SELECT hotel_id FROM reservation_links WHERE code = p_code;
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
  }
}
