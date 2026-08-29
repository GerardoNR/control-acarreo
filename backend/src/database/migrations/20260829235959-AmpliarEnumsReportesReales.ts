import { MigrationInterface, QueryRunner } from 'typeorm';

export class AmpliarEnumsReportesReales20260829235959 implements MigrationInterface {
  name = 'AmpliarEnumsReportesReales20260829235959';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "ubicaciones_tipo_enum" RENAME TO "ubicaciones_tipo_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "ubicaciones_tipo_enum" AS ENUM ('banco', 'frente', 'traza')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ubicaciones" ALTER COLUMN "tipo" TYPE "ubicaciones_tipo_enum" USING "tipo"::text::"ubicaciones_tipo_enum"`,
    );
    await queryRunner.query(`DROP TYPE "ubicaciones_tipo_enum_old"`);

    await queryRunner.query(
      `ALTER TABLE "tarifas" ALTER COLUMN "tipo_cobro" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "tarifas_tipo_cobro_enum" RENAME TO "tarifas_tipo_cobro_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "tarifas_tipo_cobro_enum" AS ENUM ('POR_VOLUMEN', 'POR_VIAJE', 'POR_DISTANCIA_ESCALONADA')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarifas" ALTER COLUMN "tipo_cobro" TYPE "tarifas_tipo_cobro_enum" USING "tipo_cobro"::text::"tarifas_tipo_cobro_enum", ALTER COLUMN "tipo_cobro" SET DEFAULT 'POR_VOLUMEN'`,
    );
    await queryRunner.query(`DROP TYPE "tarifas_tipo_cobro_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM "tarifas" WHERE "tipo_cobro"::text = 'POR_DISTANCIA_ESCALONADA') THEN
          RAISE EXCEPTION 'No se puede revertir: existen tarifas escalonadas';
        END IF;
        IF EXISTS (SELECT 1 FROM "ubicaciones" WHERE "tipo"::text = 'traza') THEN
          RAISE EXCEPTION 'No se puede revertir: existen ubicaciones de tipo traza';
        END IF;
      END $$`);

    await queryRunner.query(
      `ALTER TABLE "tarifas" ALTER COLUMN "tipo_cobro" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "tarifas_tipo_cobro_enum" RENAME TO "tarifas_tipo_cobro_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "tarifas_tipo_cobro_enum" AS ENUM ('POR_VOLUMEN', 'POR_VIAJE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarifas" ALTER COLUMN "tipo_cobro" TYPE "tarifas_tipo_cobro_enum" USING "tipo_cobro"::text::"tarifas_tipo_cobro_enum", ALTER COLUMN "tipo_cobro" SET DEFAULT 'POR_VOLUMEN'`,
    );
    await queryRunner.query(`DROP TYPE "tarifas_tipo_cobro_enum_old"`);

    await queryRunner.query(
      `ALTER TYPE "ubicaciones_tipo_enum" RENAME TO "ubicaciones_tipo_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "ubicaciones_tipo_enum" AS ENUM ('banco', 'frente')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ubicaciones" ALTER COLUMN "tipo" TYPE "ubicaciones_tipo_enum" USING "tipo"::text::"ubicaciones_tipo_enum"`,
    );
    await queryRunner.query(`DROP TYPE "ubicaciones_tipo_enum_old"`);
  }
}
