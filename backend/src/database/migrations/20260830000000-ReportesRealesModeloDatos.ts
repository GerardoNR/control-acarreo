import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReportesRealesModeloDatos20260830000000 implements MigrationInterface {
  name = 'ReportesRealesModeloDatos20260830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "camiones" ADD COLUMN "codigo_ticket_unidad" char(5)`,
    );
    await queryRunner.query(
      `ALTER TABLE "camiones" ADD CONSTRAINT "UQ_camiones_codigo_ticket_unidad" UNIQUE ("codigo_ticket_unidad")`,
    );
    await queryRunner.query(
      `ALTER TABLE "camiones" ADD CONSTRAINT "CHK_camiones_codigo_ticket_unidad" CHECK ("codigo_ticket_unidad" IS NULL OR "codigo_ticket_unidad" ~ '^[0-9]{5}$')`,
    );

    await queryRunner.query(`CREATE TABLE "rutas_acarreo" (
      "id" SERIAL NOT NULL,
      "proyecto_id" integer NOT NULL,
      "clave" varchar(50) NOT NULL,
      "ubicacion_origen_id" integer NOT NULL,
      "ubicacion_destino_id" integer NOT NULL,
      "descripcion" text,
      "distancia_pavimento" numeric(10,3) NOT NULL,
      "distancia_total" numeric(10,3) NOT NULL,
      "vigente_desde" date NOT NULL,
      "vigente_hasta" date,
      "activo" boolean NOT NULL DEFAULT true,
      "creado_en" timestamptz NOT NULL DEFAULT now(),
      "actualizado_en" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_rutas_acarreo" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_rutas_acarreo_proyecto_clave_vigencia" UNIQUE ("proyecto_id", "clave", "vigente_desde"),
      CONSTRAINT "CHK_rutas_acarreo_ubicaciones_diferentes" CHECK ("ubicacion_origen_id" <> "ubicacion_destino_id"),
      CONSTRAINT "CHK_rutas_acarreo_distancias" CHECK ("distancia_pavimento" >= 0 AND "distancia_total" >= "distancia_pavimento"),
      CONSTRAINT "CHK_rutas_acarreo_vigencia" CHECK ("vigente_hasta" IS NULL OR "vigente_hasta" >= "vigente_desde"),
      CONSTRAINT "FK_rutas_acarreo_proyecto" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_rutas_acarreo_origen" FOREIGN KEY ("ubicacion_origen_id") REFERENCES "ubicaciones"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_rutas_acarreo_destino" FOREIGN KEY ("ubicacion_destino_id") REFERENCES "ubicaciones"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_rutas_acarreo_busqueda" ON "rutas_acarreo" ("proyecto_id", "ubicacion_origen_id", "ubicacion_destino_id", "activo")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rutas_acarreo_vigencia" ON "rutas_acarreo" ("vigente_desde", "vigente_hasta")`,
    );

    await queryRunner.query(`CREATE TABLE "unidades_control" (
      "id" SERIAL NOT NULL,
      "proyecto_id" integer NOT NULL,
      "nombre" varchar(100) NOT NULL,
      "descripcion" text,
      "activo" boolean NOT NULL DEFAULT true,
      "creado_en" timestamptz NOT NULL DEFAULT now(),
      "actualizado_en" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_unidades_control" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_unidades_control_proyecto_nombre" UNIQUE ("proyecto_id", "nombre"),
      CONSTRAINT "FK_unidades_control_proyecto" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_unidades_control_proyecto_activo" ON "unidades_control" ("proyecto_id", "activo")`,
    );

    await queryRunner.query(
      `ALTER TABLE "tarifas" DROP CONSTRAINT "CHK_tarifas_precio_positivo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarifas" ALTER COLUMN "precio_unitario" TYPE numeric(12,4), ALTER COLUMN "precio_unitario" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarifas" ADD COLUMN "ruta_acarreo_id" integer, ADD COLUMN "precio_primer_km" numeric(12,4), ADD COLUMN "precio_km_subsecuente" numeric(12,4)`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarifas" ADD CONSTRAINT "FK_tarifas_ruta_acarreo" FOREIGN KEY ("ruta_acarreo_id") REFERENCES "rutas_acarreo"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(`ALTER TABLE "tarifas" ADD CONSTRAINT "CHK_tarifas_modalidad" CHECK (
      ("tipo_cobro" = 'POR_DISTANCIA_ESCALONADA' AND "precio_unitario" IS NULL AND "precio_primer_km" > 0 AND "precio_km_subsecuente" > 0)
      OR
      ("tipo_cobro" IN ('POR_VOLUMEN', 'POR_VIAJE') AND "precio_unitario" > 0 AND "precio_primer_km" IS NULL AND "precio_km_subsecuente" IS NULL)
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_tarifas_ruta_tipo_vigencia" ON "tarifas" ("ruta_acarreo_id", "tipo_cobro", "vigente_desde", "vigente_hasta")`,
    );

    await queryRunner.query(
      `ALTER TABLE "ordenes_acarreo" ADD COLUMN "ruta_acarreo_id" integer, ADD COLUMN "unidad_control_id" integer, ADD COLUMN "tarifa_id" integer`,
    );
    for (const [constraint, column, table] of [
      ['FK_ordenes_ruta_acarreo', 'ruta_acarreo_id', 'rutas_acarreo'],
      ['FK_ordenes_unidad_control', 'unidad_control_id', 'unidades_control'],
      ['FK_ordenes_tarifa', 'tarifa_id', 'tarifas'],
    ]) {
      await queryRunner.query(
        `ALTER TABLE "ordenes_acarreo" ADD CONSTRAINT "${constraint}" FOREIGN KEY ("${column}") REFERENCES "${table}"("id") ON DELETE RESTRICT`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_ordenes_${column.replace('_id', '')}" ON "ordenes_acarreo" ("${column}")`,
      );
    }

    await queryRunner.query(`CREATE TABLE "tickets" (
      "id" uuid NOT NULL,
      "viaje_id" uuid NOT NULL,
      "codigo_ticket" varchar(21) NOT NULL,
      "fecha_generacion" timestamptz NOT NULL,
      "fecha_primera_impresion" timestamptz,
      "fecha_ultima_impresion" timestamptz,
      "cantidad_reimpresiones" integer NOT NULL DEFAULT 0,
      "dispositivo_emisor_id" varchar,
      "creado_en" timestamptz NOT NULL DEFAULT now(),
      "actualizado_en" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_tickets" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_tickets_viaje" UNIQUE ("viaje_id"),
      CONSTRAINT "UQ_tickets_codigo_ticket" UNIQUE ("codigo_ticket"),
      CONSTRAINT "CHK_tickets_codigo_formato" CHECK (char_length("codigo_ticket") = 21 AND "codigo_ticket" ~ '^[0-9]{21}$'),
      CONSTRAINT "CHK_tickets_reimpresiones" CHECK ("cantidad_reimpresiones" >= 0),
      CONSTRAINT "FK_tickets_viaje" FOREIGN KEY ("viaje_id") REFERENCES "viajes"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_tickets_fecha_generacion" ON "tickets" ("fecha_generacion")`,
    );

    await queryRunner.query(`ALTER TABLE "viajes"
      ADD COLUMN "folio_origen" varchar(64),
      ADD COLUMN "folio_destino" varchar(64),
      ADD COLUMN "material_llegada_id" integer,
      ADD COLUMN "ubicacion_destino_real_id" integer,
      ADD COLUMN "ruta_acarreo_id" integer,
      ADD COLUMN "unidad_control_id" integer,
      ADD COLUMN "tarifa_aplicada_id" integer,
      ADD COLUMN "proyecto_nombre_snapshot" varchar,
      ADD COLUMN "placas_snapshot" varchar,
      ADD COLUMN "capacidad_aplicada_m3" numeric(10,3),
      ADD COLUMN "origen_nombre_snapshot" varchar,
      ADD COLUMN "origen_tipo_snapshot" varchar(20),
      ADD COLUMN "destino_nombre_snapshot" varchar,
      ADD COLUMN "destino_tipo_snapshot" varchar(20),
      ADD COLUMN "material_origen_nombre_snapshot" varchar,
      ADD COLUMN "material_destino_nombre_snapshot" varchar,
      ADD COLUMN "ruta_descripcion_snapshot" text,
      ADD COLUMN "distancia_pavimento_aplicada" numeric(10,3),
      ADD COLUMN "distancia_total_aplicada" numeric(10,3),
      ADD COLUMN "unidad_control_nombre_snapshot" varchar,
      ADD COLUMN "tipo_tarifa_aplicada" varchar(40),
      ADD COLUMN "precio_unitario_aplicado" numeric(12,4),
      ADD COLUMN "precio_primer_km_aplicado" numeric(12,4),
      ADD COLUMN "precio_km_subsecuente_aplicado" numeric(12,4),
      ADD COLUMN "m3_km" numeric(14,2),
      ADD COLUMN "coste_primer_km" numeric(14,2),
      ADD COLUMN "coste_km_subsecuente" numeric(14,2),
      ADD COLUMN "importe_acarreo" numeric(14,2)`);
    for (const [constraint, column, table] of [
      ['FK_viajes_material_llegada', 'material_llegada_id', 'materiales'],
      [
        'FK_viajes_ubicacion_destino_real',
        'ubicacion_destino_real_id',
        'ubicaciones',
      ],
      ['FK_viajes_ruta_acarreo', 'ruta_acarreo_id', 'rutas_acarreo'],
      ['FK_viajes_unidad_control', 'unidad_control_id', 'unidades_control'],
      ['FK_viajes_tarifa_aplicada', 'tarifa_aplicada_id', 'tarifas'],
    ]) {
      await queryRunner.query(
        `ALTER TABLE "viajes" ADD CONSTRAINT "${constraint}" FOREIGN KEY ("${column}") REFERENCES "${table}"("id") ON DELETE RESTRICT`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_viajes_${column.replace('_id', '')}" ON "viajes" ("${column}")`,
      );
    }
    await queryRunner.query(
      `CREATE INDEX "IDX_viajes_folio_origen" ON "viajes" ("folio_origen") WHERE "folio_origen" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_viajes_folio_destino" ON "viajes" ("folio_destino") WHERE "folio_destino" IS NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "viajes" ADD CONSTRAINT "CHK_viajes_snapshot_valores" CHECK (
      ("capacidad_aplicada_m3" IS NULL OR "capacidad_aplicada_m3" > 0)
      AND ("distancia_pavimento_aplicada" IS NULL OR "distancia_pavimento_aplicada" >= 0)
      AND ("distancia_total_aplicada" IS NULL OR "distancia_total_aplicada" >= COALESCE("distancia_pavimento_aplicada", 0))
      AND ("m3_km" IS NULL OR "m3_km" >= 0)
      AND ("coste_primer_km" IS NULL OR "coste_primer_km" >= 0)
      AND ("coste_km_subsecuente" IS NULL OR "coste_km_subsecuente" >= 0)
      AND ("importe_acarreo" IS NULL OR "importe_acarreo" >= 0)
    )`);

    await queryRunner.query(
      `CREATE TYPE "incidencias_viaje_tipo_enum" AS ENUM ('DESTINO_DIFERENTE', 'MATERIAL_SALIDA_DIFERENTE', 'MATERIAL_DESTINO_DIFERENTE', 'MISMO_CHECADOR', 'ORIGEN_NO_CONCILIADO', 'DESTINO_NO_CONCILIADO', 'RUTA_NO_CONFIGURADA', 'TARIFA_NO_CONFIGURADA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "incidencias_viaje_origen_enum" AS ENUM ('AUTOMATICA', 'MANUAL')`,
    );
    await queryRunner.query(`CREATE TABLE "incidencias_viaje" (
      "id" BIGSERIAL NOT NULL,
      "viaje_id" uuid NOT NULL,
      "tipo" "incidencias_viaje_tipo_enum" NOT NULL,
      "origen" "incidencias_viaje_origen_enum" NOT NULL DEFAULT 'AUTOMATICA',
      "mensaje" text NOT NULL,
      "datos" jsonb,
      "activa" boolean NOT NULL DEFAULT true,
      "resuelta_en" timestamptz,
      "resuelta_por_id" integer,
      "observacion_resolucion" text,
      "detectada_en" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_incidencias_viaje" PRIMARY KEY ("id"),
      CONSTRAINT "FK_incidencias_viaje_viaje" FOREIGN KEY ("viaje_id") REFERENCES "viajes"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_incidencias_viaje_resuelta_por" FOREIGN KEY ("resuelta_por_id") REFERENCES "administradores"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_incidencias_viaje_viaje" ON "incidencias_viaje" ("viaje_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_incidencias_viaje_tipo_activa" ON "incidencias_viaje" ("tipo", "activa")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_incidencias_viaje_automatica_activa" ON "incidencias_viaje" ("viaje_id", "tipo") WHERE "origen" = 'AUTOMATICA' AND "activa" = true`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_incidencias_viaje_detectada_en" ON "incidencias_viaje" ("detectada_en")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM "tarifas" WHERE "tipo_cobro"::text = 'POR_DISTANCIA_ESCALONADA') THEN
          RAISE EXCEPTION 'No se puede revertir: existen tarifas escalonadas';
        END IF;
      END $$`);
    await queryRunner.query(
      `DROP INDEX "UQ_incidencias_viaje_automatica_activa"`,
    );
    await queryRunner.query(`DROP TABLE "incidencias_viaje"`);
    await queryRunner.query(`DROP TYPE "incidencias_viaje_origen_enum"`);
    await queryRunner.query(`DROP TYPE "incidencias_viaje_tipo_enum"`);

    await queryRunner.query(
      `ALTER TABLE "viajes" DROP CONSTRAINT "CHK_viajes_snapshot_valores"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_viajes_folio_destino"`);
    await queryRunner.query(`DROP INDEX "IDX_viajes_folio_origen"`);
    for (const [constraint, column] of [
      ['FK_viajes_tarifa_aplicada', 'tarifa_aplicada_id'],
      ['FK_viajes_unidad_control', 'unidad_control_id'],
      ['FK_viajes_ruta_acarreo', 'ruta_acarreo_id'],
      ['FK_viajes_ubicacion_destino_real', 'ubicacion_destino_real_id'],
      ['FK_viajes_material_llegada', 'material_llegada_id'],
    ]) {
      await queryRunner.query(
        `DROP INDEX "IDX_viajes_${column.replace('_id', '')}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "viajes" DROP CONSTRAINT "${constraint}"`,
      );
    }
    for (const column of [
      'importe_acarreo',
      'coste_km_subsecuente',
      'coste_primer_km',
      'm3_km',
      'precio_km_subsecuente_aplicado',
      'precio_primer_km_aplicado',
      'precio_unitario_aplicado',
      'tipo_tarifa_aplicada',
      'unidad_control_nombre_snapshot',
      'distancia_total_aplicada',
      'distancia_pavimento_aplicada',
      'ruta_descripcion_snapshot',
      'material_destino_nombre_snapshot',
      'material_origen_nombre_snapshot',
      'destino_tipo_snapshot',
      'destino_nombre_snapshot',
      'origen_tipo_snapshot',
      'origen_nombre_snapshot',
      'capacidad_aplicada_m3',
      'placas_snapshot',
      'proyecto_nombre_snapshot',
      'tarifa_aplicada_id',
      'unidad_control_id',
      'ruta_acarreo_id',
      'ubicacion_destino_real_id',
      'material_llegada_id',
      'folio_destino',
      'folio_origen',
    ]) {
      await queryRunner.query(`ALTER TABLE "viajes" DROP COLUMN "${column}"`);
    }

    await queryRunner.query(`DROP TABLE "tickets"`);

    for (const [constraint, column] of [
      ['FK_ordenes_tarifa', 'tarifa_id'],
      ['FK_ordenes_unidad_control', 'unidad_control_id'],
      ['FK_ordenes_ruta_acarreo', 'ruta_acarreo_id'],
    ]) {
      await queryRunner.query(
        `DROP INDEX "IDX_ordenes_${column.replace('_id', '')}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "ordenes_acarreo" DROP CONSTRAINT "${constraint}", DROP COLUMN "${column}"`,
      );
    }

    await queryRunner.query(`DROP INDEX "IDX_tarifas_ruta_tipo_vigencia"`);
    await queryRunner.query(
      `ALTER TABLE "tarifas" DROP CONSTRAINT "CHK_tarifas_modalidad", DROP CONSTRAINT "FK_tarifas_ruta_acarreo", DROP COLUMN "precio_km_subsecuente", DROP COLUMN "precio_primer_km", DROP COLUMN "ruta_acarreo_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarifas" ALTER COLUMN "precio_unitario" TYPE numeric(12,2), ALTER COLUMN "precio_unitario" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarifas" ADD CONSTRAINT "CHK_tarifas_precio_positivo" CHECK ("precio_unitario" > 0)`,
    );

    await queryRunner.query(`DROP TABLE "unidades_control"`);
    await queryRunner.query(`DROP TABLE "rutas_acarreo"`);

    await queryRunner.query(
      `ALTER TABLE "camiones" DROP CONSTRAINT "CHK_camiones_codigo_ticket_unidad", DROP CONSTRAINT "UQ_camiones_codigo_ticket_unidad", DROP COLUMN "codigo_ticket_unidad"`,
    );
  }
}
