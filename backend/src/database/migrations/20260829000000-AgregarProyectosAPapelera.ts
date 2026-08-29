import { MigrationInterface, QueryRunner } from 'typeorm';

export class AgregarProyectosAPapelera20260829000000 implements MigrationInterface {
  name = 'AgregarProyectosAPapelera20260829000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "proyectos" ADD COLUMN "deleted_at" timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "proyectos" ADD COLUMN "activo_antes_papelera" boolean`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_proyectos_deleted_at" ON "proyectos" ("deleted_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_proyectos_deleted_at"`);
    await queryRunner.query(
      `ALTER TABLE "proyectos" DROP COLUMN "activo_antes_papelera"`,
    );
    await queryRunner.query(`ALTER TABLE "proyectos" DROP COLUMN "deleted_at"`);
  }
}
