import { MigrationInterface, QueryRunner } from 'typeorm';

export class SuspensionesTemporales20260828000000 implements MigrationInterface {
  name = 'SuspensionesTemporales20260828000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "suspensiones" (
      "id" SERIAL NOT NULL,
      "checador_id" integer,
      "chofer_id" integer,
      "camion_id" integer,
      "ubicacion_id" integer,
      "motivo" varchar(80) NOT NULL,
      "observaciones" text,
      "fecha_inicio" date NOT NULL,
      "fecha_fin" date,
      "indefinida" boolean NOT NULL DEFAULT false,
      "creada_por_id" integer NOT NULL,
      "creada_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "finalizada_at" TIMESTAMP WITH TIME ZONE,
      "finalizada_por_id" integer,
      CONSTRAINT "PK_suspensiones" PRIMARY KEY ("id"),
      CONSTRAINT "CHK_suspensiones_una_entidad" CHECK (num_nonnulls("checador_id", "chofer_id", "camion_id", "ubicacion_id") = 1),
      CONSTRAINT "CHK_suspensiones_fechas" CHECK (("indefinida" = true AND "fecha_fin" IS NULL) OR ("indefinida" = false AND "fecha_fin" IS NOT NULL AND "fecha_fin" >= "fecha_inicio"))
    )`);
    for (const [nombre, columna, tabla] of [
      ['FK_suspensiones_checador', 'checador_id', 'checadores'],
      ['FK_suspensiones_chofer', 'chofer_id', 'choferes'],
      ['FK_suspensiones_camion', 'camion_id', 'camiones'],
      ['FK_suspensiones_ubicacion', 'ubicacion_id', 'ubicaciones'],
      ['FK_suspensiones_creada_por', 'creada_por_id', 'administradores'],
      [
        'FK_suspensiones_finalizada_por',
        'finalizada_por_id',
        'administradores',
      ],
    ]) {
      await queryRunner.query(
        `ALTER TABLE "suspensiones" ADD CONSTRAINT "${nombre}" FOREIGN KEY ("${columna}") REFERENCES "${tabla}"("id") ON DELETE RESTRICT`,
      );
    }
    for (const columna of [
      'checador_id',
      'chofer_id',
      'camion_id',
      'ubicacion_id',
    ]) {
      await queryRunner.query(
        `CREATE INDEX "IDX_suspensiones_${columna.replace('_id', '')}" ON "suspensiones" ("${columna}")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "suspensiones"');
  }
}
