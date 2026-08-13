import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrepararModuloViajes20260812000000 implements MigrationInterface {
  name = 'PrepararModuloViajes20260812000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM "viajes" WHERE "chofer_id" IS NULL) THEN
          RAISE EXCEPTION
            'No se puede hacer chofer_id obligatorio: existen viajes sin chofer';
        END IF;

        IF EXISTS (
          SELECT 1
          FROM "viajes"
          WHERE "estado"::text = 'en_transito'
          GROUP BY "camion_id"
          HAVING COUNT(*) > 1
        ) THEN
          RAISE EXCEPTION
            'No se puede crear el indice unico parcial: hay camiones con mas de un viaje en transito';
        END IF;

        IF EXISTS (SELECT 1 FROM "viajes" WHERE length("folio") > 19) THEN
          RAISE EXCEPTION
            'No se puede limitar folio a 19 caracteres: existen folios mas largos';
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS "viajes_folio_seq"
      AS bigint MINVALUE 1 MAXVALUE 999999 START WITH 1 INCREMENT BY 1
    `);
    await queryRunner.query(`
      DO $$
      DECLARE
        max_consecutivo bigint;
      BEGIN
        SELECT COALESCE(MAX(right("folio", 6)::bigint), 0)
        INTO max_consecutivo
        FROM "viajes"
        WHERE "folio" ~ '^VIA-[0-9]{8}-[0-9]{6}$';

        IF max_consecutivo = 0 THEN
          PERFORM setval('viajes_folio_seq', 1, false);
        ELSE
          PERFORM setval('viajes_folio_seq', max_consecutivo, true);
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      DECLARE primary_key_name text;
      BEGIN
        SELECT conname
        INTO primary_key_name
        FROM pg_constraint
        WHERE conrelid = 'viajes'::regclass AND contype = 'p';

        IF primary_key_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "viajes" DROP CONSTRAINT %I', primary_key_name);
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "viajes" RENAME COLUMN "id" TO "id_legacy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "id_legacy" DROP DEFAULT`,
    );
    await queryRunner.query(`
      ALTER TABLE "viajes"
      ADD COLUMN "id" uuid NOT NULL DEFAULT gen_random_uuid()
    `);
    await queryRunner.query(`
      ALTER TABLE "viajes"
      ADD CONSTRAINT "PK_viajes_id" PRIMARY KEY ("id")
    `);
    await queryRunner.query(`
      ALTER TABLE "viajes"
      ADD CONSTRAINT "UQ_viajes_id_legacy" UNIQUE ("id_legacy")
    `);

    await queryRunner.query(
      `ALTER TYPE "viajes_estado_enum" RENAME VALUE 'entregado' TO 'completado'`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "folio" TYPE varchar(19)`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "chofer_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "cantidad_m3" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "fecha_hora_origen" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "checador_origen_id" DROP NOT NULL`,
    );

    await queryRunner.query(`
      ALTER TABLE "viajes"
      ADD COLUMN "checador_salida_id" integer,
      ADD COLUMN "checador_llegada_id" integer,
      ADD COLUMN "administrador_cancelacion_id" integer,
      ADD COLUMN "cantidad_salida" numeric(12,3),
      ADD COLUMN "cantidad_llegada" numeric(12,3),
      ADD COLUMN "unidad_medida" varchar,
      ADD COLUMN "fecha_hora_salida" timestamptz,
      ADD COLUMN "fecha_hora_llegada" timestamptz,
      ADD COLUMN "fecha_hora_cancelacion" timestamptz,
      ADD COLUMN "observaciones_salida" text,
      ADD COLUMN "observaciones_llegada" text,
      ADD COLUMN "motivo_cancelacion" text
    `);

    await queryRunner.query(`
      UPDATE "viajes" AS v
      SET
        "checador_salida_id" = v."checador_origen_id",
        "checador_llegada_id" = v."checador_destino_id",
        "cantidad_salida" = v."cantidad_m3",
        "fecha_hora_salida" = v."fecha_hora_origen" AT TIME ZONE 'America/Monterrey',
        "fecha_hora_llegada" = v."fecha_hora_destino" AT TIME ZONE 'America/Monterrey',
        "observaciones_salida" = v."nota",
        "unidad_medida" = m."unidad_medida"
      FROM "materiales" AS m
      WHERE m."id" = v."material_id"
    `);

    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "checador_salida_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "cantidad_salida" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "unidad_medida" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "fecha_hora_salida" SET NOT NULL`,
    );

    await queryRunner.query(`
      ALTER TABLE "viajes"
      ADD CONSTRAINT "FK_viajes_checador_salida"
        FOREIGN KEY ("checador_salida_id") REFERENCES "checadores"("id") ON DELETE RESTRICT,
      ADD CONSTRAINT "FK_viajes_checador_llegada"
        FOREIGN KEY ("checador_llegada_id") REFERENCES "checadores"("id") ON DELETE RESTRICT,
      ADD CONSTRAINT "FK_viajes_administrador_cancelacion"
        FOREIGN KEY ("administrador_cancelacion_id") REFERENCES "administradores"("id") ON DELETE RESTRICT,
      ADD CONSTRAINT "CHK_viajes_ubicaciones_diferentes"
        CHECK ("ubicacion_origen_id" <> "ubicacion_destino_id"),
      ADD CONSTRAINT "CHK_viajes_cantidad_salida_positiva"
        CHECK ("cantidad_salida" > 0),
      ADD CONSTRAINT "CHK_viajes_cantidad_llegada_positiva"
        CHECK ("cantidad_llegada" IS NULL OR "cantidad_llegada" > 0),
      ADD CONSTRAINT "CHK_viajes_fecha_llegada_posterior"
        CHECK ("fecha_hora_llegada" IS NULL OR "fecha_hora_llegada" > "fecha_hora_salida")
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_viajes_proyecto" ON "viajes" ("proyecto_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_viajes_fecha_hora_salida" ON "viajes" ("fecha_hora_salida")`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_viajes_camion_en_transito"
      ON "viajes" ("camion_id")
      WHERE "estado" = 'en_transito'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_viajes_camion_en_transito"`);
    await queryRunner.query(`DROP INDEX "IDX_viajes_fecha_hora_salida"`);
    await queryRunner.query(`DROP INDEX "IDX_viajes_proyecto"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM "viajes"
          WHERE "cantidad_salida" > 99999999.99 OR "cantidad_salida" < -99999999.99
        ) THEN
          RAISE EXCEPTION
            'No se puede revertir: cantidad_salida excede numeric(10,2)';
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      UPDATE "viajes"
      SET
        "checador_origen_id" = "checador_salida_id",
        "checador_destino_id" = "checador_llegada_id",
        "cantidad_m3" = "cantidad_salida",
        "fecha_hora_origen" = "fecha_hora_salida" AT TIME ZONE 'America/Monterrey',
        "fecha_hora_destino" = "fecha_hora_llegada" AT TIME ZONE 'America/Monterrey',
        "nota" = COALESCE("observaciones_salida", "nota")
    `);
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "cantidad_m3" TYPE numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "cantidad_m3" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "fecha_hora_origen" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "checador_origen_id" SET NOT NULL`,
    );

    await queryRunner.query(`
      ALTER TABLE "viajes"
      DROP CONSTRAINT "CHK_viajes_fecha_llegada_posterior",
      DROP CONSTRAINT "CHK_viajes_cantidad_llegada_positiva",
      DROP CONSTRAINT "CHK_viajes_cantidad_salida_positiva",
      DROP CONSTRAINT "CHK_viajes_ubicaciones_diferentes",
      DROP CONSTRAINT "FK_viajes_administrador_cancelacion",
      DROP CONSTRAINT "FK_viajes_checador_llegada",
      DROP CONSTRAINT "FK_viajes_checador_salida",
      DROP COLUMN "motivo_cancelacion",
      DROP COLUMN "observaciones_llegada",
      DROP COLUMN "observaciones_salida",
      DROP COLUMN "fecha_hora_cancelacion",
      DROP COLUMN "fecha_hora_llegada",
      DROP COLUMN "fecha_hora_salida",
      DROP COLUMN "unidad_medida",
      DROP COLUMN "cantidad_llegada",
      DROP COLUMN "cantidad_salida",
      DROP COLUMN "administrador_cancelacion_id",
      DROP COLUMN "checador_llegada_id",
      DROP COLUMN "checador_salida_id"
    `);

    await queryRunner.query(
      `ALTER TYPE "viajes_estado_enum" RENAME VALUE 'completado' TO 'entregado'`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "folio" TYPE varchar`,
    );

    await queryRunner.query(`
      UPDATE "viajes"
      SET "id_legacy" = nextval('viajes_id_seq')
      WHERE "id_legacy" IS NULL
    `);
    await queryRunner.query(
      `ALTER TABLE "viajes" DROP CONSTRAINT "PK_viajes_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" DROP CONSTRAINT "UQ_viajes_id_legacy"`,
    );
    await queryRunner.query(`ALTER TABLE "viajes" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "viajes" RENAME COLUMN "id_legacy" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "id" SET DEFAULT nextval('viajes_id_seq')`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ALTER COLUMN "id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "viajes" ADD CONSTRAINT "PK_viajes_id" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(`DROP SEQUENCE "viajes_folio_seq"`);
  }
}
