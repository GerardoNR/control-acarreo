import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrdenesTarifasEstimaciones20260827000000 implements MigrationInterface {
  name = 'OrdenesTarifasEstimaciones20260827000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "ordenes_acarreo_estado_enum" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "tarifas_tipo_cobro_enum" AS ENUM ('POR_VOLUMEN', 'POR_VIAJE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "estimaciones_estado_enum" AS ENUM ('BORRADOR', 'CERRADA', 'FACTURADA', 'PAGADA', 'CANCELADA')`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE "ordenes_acarreo_folio_seq" START 1`,
    );
    await queryRunner.query(`CREATE SEQUENCE "estimaciones_folio_seq" START 1`);
    await queryRunner.query(
      `CREATE TABLE "ordenes_acarreo" ("id" SERIAL NOT NULL, "folio" varchar(19) NOT NULL, "proyecto_id" integer NOT NULL, "material_id" integer NOT NULL, "ubicacion_origen_id" integer NOT NULL, "ubicacion_destino_id" integer NOT NULL, "cantidad_solicitada" numeric(12,3) NOT NULL, "unidad_medida" varchar NOT NULL, "fecha_inicio" date NOT NULL, "fecha_fin" date, "estado" "ordenes_acarreo_estado_enum" NOT NULL DEFAULT 'PENDIENTE', "observaciones" text, "creado_en" timestamp NOT NULL DEFAULT now(), "actualizado_en" timestamp NOT NULL DEFAULT now(), CONSTRAINT "PK_ordenes_acarreo" PRIMARY KEY ("id"), CONSTRAINT "UQ_ordenes_acarreo_folio" UNIQUE ("folio"), CONSTRAINT "CHK_ordenes_cantidad_positiva" CHECK ("cantidad_solicitada" > 0), CONSTRAINT "CHK_ordenes_fechas" CHECK ("fecha_fin" IS NULL OR "fecha_fin" >= "fecha_inicio"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordenes_acarreo" ADD CONSTRAINT "FK_ordenes_proyecto" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordenes_acarreo" ADD CONSTRAINT "FK_ordenes_material" FOREIGN KEY ("material_id") REFERENCES "materiales"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordenes_acarreo" ADD CONSTRAINT "FK_ordenes_origen" FOREIGN KEY ("ubicacion_origen_id") REFERENCES "ubicaciones"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordenes_acarreo" ADD CONSTRAINT "FK_ordenes_destino" FOREIGN KEY ("ubicacion_destino_id") REFERENCES "ubicaciones"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ADD COLUMN "orden_acarreo_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ADD CONSTRAINT "FK_viajes_orden_acarreo" FOREIGN KEY ("orden_acarreo_id") REFERENCES "ordenes_acarreo"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_viajes_orden_acarreo" ON "viajes" ("orden_acarreo_id")`,
    );
    await queryRunner.query(
      `CREATE TABLE "tarifas" ("id" SERIAL NOT NULL, "proyecto_id" integer NOT NULL, "material_id" integer NOT NULL, "ubicacion_origen_id" integer NOT NULL, "ubicacion_destino_id" integer NOT NULL, "tipo_cobro" "tarifas_tipo_cobro_enum" NOT NULL DEFAULT 'POR_VOLUMEN', "unidad_medida" varchar NOT NULL, "precio_unitario" numeric(12,2) NOT NULL, "vigente_desde" date NOT NULL, "vigente_hasta" date, "activo" boolean NOT NULL DEFAULT true, "creado_en" timestamp NOT NULL DEFAULT now(), "actualizado_en" timestamp NOT NULL DEFAULT now(), CONSTRAINT "PK_tarifas" PRIMARY KEY ("id"), CONSTRAINT "CHK_tarifas_precio_positivo" CHECK ("precio_unitario" > 0), CONSTRAINT "CHK_tarifas_fechas" CHECK ("vigente_hasta" IS NULL OR "vigente_hasta" >= "vigente_desde"), CONSTRAINT "CHK_tarifas_ruta" CHECK ("ubicacion_origen_id" <> "ubicacion_destino_id"))`,
    );
    for (const [name, column, table] of [
      ['FK_tarifas_proyecto', 'proyecto_id', 'proyectos'],
      ['FK_tarifas_material', 'material_id', 'materiales'],
      ['FK_tarifas_origen', 'ubicacion_origen_id', 'ubicaciones'],
      ['FK_tarifas_destino', 'ubicacion_destino_id', 'ubicaciones'],
    ])
      await queryRunner.query(
        `ALTER TABLE "tarifas" ADD CONSTRAINT "${name}" FOREIGN KEY ("${column}") REFERENCES "${table}"("id") ON DELETE RESTRICT`,
      );
    await queryRunner.query(
      `CREATE INDEX "IDX_tarifas_busqueda" ON "tarifas" ("proyecto_id", "material_id", "ubicacion_origen_id", "ubicacion_destino_id", "activo")`,
    );
    await queryRunner.query(
      `CREATE TABLE "estimaciones" ("id" SERIAL NOT NULL, "folio" varchar(19) NOT NULL, "proyecto_id" integer NOT NULL, "fecha_desde" date NOT NULL, "fecha_hasta" date NOT NULL, "estado" "estimaciones_estado_enum" NOT NULL DEFAULT 'BORRADOR', "importe_facturado" numeric(14,2), "fecha_facturacion" date, "referencia_factura" varchar, "observaciones" text, "creado_en" timestamp NOT NULL DEFAULT now(), "actualizado_en" timestamp NOT NULL DEFAULT now(), CONSTRAINT "PK_estimaciones" PRIMARY KEY ("id"), CONSTRAINT "UQ_estimaciones_folio" UNIQUE ("folio"), CONSTRAINT "CHK_estimaciones_fechas" CHECK ("fecha_hasta" >= "fecha_desde"), CONSTRAINT "CHK_estimaciones_facturado" CHECK ("importe_facturado" IS NULL OR "importe_facturado" > 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "estimaciones" ADD CONSTRAINT "FK_estimaciones_proyecto" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `CREATE TABLE "estimacion_detalles" ("id" SERIAL NOT NULL, "estimacion_id" integer NOT NULL, "viaje_id" uuid NOT NULL, "tarifa_id" integer NOT NULL, "cantidad" numeric(12,3) NOT NULL, "unidad_medida" varchar NOT NULL, "precio_unitario_aplicado" numeric(12,2) NOT NULL, "importe" numeric(14,2) NOT NULL, CONSTRAINT "PK_estimacion_detalles" PRIMARY KEY ("id"), CONSTRAINT "UQ_estimacion_detalles_viaje" UNIQUE ("viaje_id"), CONSTRAINT "CHK_estimacion_detalle_valores" CHECK ("cantidad" > 0 AND "precio_unitario_aplicado" > 0 AND "importe" > 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "estimacion_detalles" ADD CONSTRAINT "FK_detalles_estimacion" FOREIGN KEY ("estimacion_id") REFERENCES "estimaciones"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "estimacion_detalles" ADD CONSTRAINT "FK_detalles_viaje" FOREIGN KEY ("viaje_id") REFERENCES "viajes"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "estimacion_detalles" ADD CONSTRAINT "FK_detalles_tarifa" FOREIGN KEY ("tarifa_id") REFERENCES "tarifas"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `CREATE TABLE "pagos_estimaciones" ("id" SERIAL NOT NULL, "estimacion_id" integer NOT NULL, "fecha" date NOT NULL, "importe" numeric(14,2) NOT NULL, "referencia" varchar, "observaciones" text, "creado_en" timestamp NOT NULL DEFAULT now(), CONSTRAINT "PK_pagos_estimaciones" PRIMARY KEY ("id"), CONSTRAINT "CHK_pagos_importe_positivo" CHECK ("importe" > 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "pagos_estimaciones" ADD CONSTRAINT "FK_pagos_estimacion" FOREIGN KEY ("estimacion_id") REFERENCES "estimaciones"("id") ON DELETE RESTRICT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pagos_estimaciones"`);
    await queryRunner.query(`DROP TABLE "estimacion_detalles"`);
    await queryRunner.query(`DROP TABLE "estimaciones"`);
    await queryRunner.query(`DROP TABLE "tarifas"`);
    await queryRunner.query(`DROP INDEX "IDX_viajes_orden_acarreo"`);
    await queryRunner.query(
      `ALTER TABLE "viajes" DROP CONSTRAINT "FK_viajes_orden_acarreo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" DROP COLUMN "orden_acarreo_id"`,
    );
    await queryRunner.query(`DROP TABLE "ordenes_acarreo"`);
    await queryRunner.query(`DROP SEQUENCE "estimaciones_folio_seq"`);
    await queryRunner.query(`DROP SEQUENCE "ordenes_acarreo_folio_seq"`);
    await queryRunner.query(`DROP TYPE "estimaciones_estado_enum"`);
    await queryRunner.query(`DROP TYPE "tarifas_tipo_cobro_enum"`);
    await queryRunner.query(`DROP TYPE "ordenes_acarreo_estado_enum"`);
  }
}
