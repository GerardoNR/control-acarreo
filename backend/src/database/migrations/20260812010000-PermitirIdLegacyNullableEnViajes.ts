import { MigrationInterface, QueryRunner } from 'typeorm';

export class PermitirIdLegacyNullableEnViajes20260812010000 implements MigrationInterface {
  name = 'PermitirIdLegacyNullableEnViajes20260812010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "id_legacy" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM "viajes" WHERE "id_legacy" IS NULL
        ) THEN
          RAISE EXCEPTION
            'No se puede restaurar NOT NULL: existen viajes con id_legacy nulo';
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "id_legacy" SET NOT NULL`,
    );
  }
}
