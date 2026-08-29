import { MigrationInterface, QueryRunner } from 'typeorm';

export class AgregarPapeleraYFinalizacion20260826000000 implements MigrationInterface {
  name = 'AgregarPapeleraYFinalizacion20260826000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const tabla of [
      'checadores',
      'choferes',
      'camiones',
      'materiales',
      'ubicaciones',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "${tabla}" ADD COLUMN "deleted_at" timestamp`,
      );
      await queryRunner.query(
        `ALTER TABLE "${tabla}" ADD COLUMN "activo_antes_papelera" boolean`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_${tabla}_deleted_at" ON "${tabla}" ("deleted_at")`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "proyectos" ADD COLUMN "finalizado_at" timestamp`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "proyectos" DROP COLUMN "finalizado_at"`,
    );
    for (const tabla of [
      'ubicaciones',
      'materiales',
      'camiones',
      'choferes',
      'checadores',
    ]) {
      await queryRunner.query(`DROP INDEX "IDX_${tabla}_deleted_at"`);
      await queryRunner.query(
        `ALTER TABLE "${tabla}" DROP COLUMN "activo_antes_papelera"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${tabla}" DROP COLUMN "deleted_at"`,
      );
    }
  }
}
