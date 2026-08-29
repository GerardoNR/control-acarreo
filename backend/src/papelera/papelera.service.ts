import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { DataSource, EntityTarget, IsNull, Not, Repository } from 'typeorm';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Camion } from '../camiones/camion.entity';
import { Checador } from '../checadores/checador.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Material } from '../materiales/material.entity';
import { Ubicacion } from '../ubicaciones/ubicacion.entity';
import { Viaje } from '../viajes/viaje.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { OrdenAcarreo } from '../ordenes-acarreo/orden-acarreo.entity';
import { Tarifa } from '../tarifas/tarifa.entity';
import { Estimacion } from '../estimaciones/estimacion.entity';
import { SuspensionesService } from '../suspensiones/suspensiones.service';
import { Suspension } from '../suspensiones/suspension.entity';
import { RutaAcarreo } from '../rutas-acarreo/ruta-acarreo.entity';
import {
  PAPELERA_RETENCION_MS,
  PapeleraItem,
  TIPOS_PAPELERA,
  TipoPapelera,
} from './papelera.types';

const LIMPIEZA_INTERVALO_MS = 24 * 60 * 60 * 1000;

type EntidadPapelera =
  Checador | Chofer | Camion | Material | Ubicacion | Proyecto;
type EntidadPapeleraBase = EntidadPapelera & {
  id: number;
  activo: boolean;
  deleted_at: Date | null;
  activo_antes_papelera: boolean | null;
};

@Injectable()
export class PapeleraService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PapeleraService.name);
  private temporizador?: NodeJS.Timeout;

  constructor(
    private readonly dataSource: DataSource,
    private readonly auditoriaService: AuditoriaService,
    @Optional() private readonly suspensionesService?: SuspensionesService,
  ) {}

  onModuleInit(): void {
    this.ejecutarDepuracionProgramada();
    this.temporizador = setInterval(
      () => this.ejecutarDepuracionProgramada(),
      LIMPIEZA_INTERVALO_MS,
    );
    this.temporizador.unref();
  }

  onModuleDestroy(): void {
    if (this.temporizador) clearInterval(this.temporizador);
  }

  private ejecutarDepuracionProgramada(): void {
    void this.depurarVencidos().catch((error: unknown) => {
      const mensaje =
        error instanceof Error
          ? error.message
          : 'Error de depuración desconocido';
      this.logger.error(`No fue posible depurar la Papelera: ${mensaje}`);
    });
  }

  async listar(): Promise<PapeleraItem[]> {
    await this.depurarVencidos();
    const grupos = await Promise.all(
      TIPOS_PAPELERA.map(async (tipo) => {
        const entidades = await this.repositorio(tipo).find({
          where: { deleted_at: Not(IsNull()) },
        });
        return Promise.all(
          entidades.map((entidad) => this.aItem(tipo, entidad)),
        );
      }),
    );
    return grupos
      .flat()
      .sort((a, b) =>
        b.deleted_at.toISOString().localeCompare(a.deleted_at.toISOString()),
      );
  }

  async enviar(
    tipoEntrada: string,
    id: number,
    usuario: AuthUser,
  ): Promise<PapeleraItem> {
    const tipo = this.validarTipo(tipoEntrada);
    const repositorio = this.repositorio(tipo);
    const entidad = await repositorio.findOneBy({ id });
    if (!entidad) throw this.noEncontrado(tipo, id);
    if (entidad.deleted_at) {
      throw new ConflictException('El registro ya se encuentra en la Papelera');
    }
    const eliminado = new Date();
    if (tipo !== 'material' && tipo !== 'proyecto') {
      await this.suspensionesService?.finalizarPorPapelera(tipo, id, usuario);
    }
    entidad.activo_antes_papelera = entidad.activo;
    entidad.activo = false;
    entidad.deleted_at = eliminado;
    await repositorio.save(entidad);
    await this.auditoriaService.registrar({
      usuario,
      accion: `ENVIAR_PAPELERA_${tipo.toUpperCase()}`,
      entidad: tipo,
      entidadId: id,
      valorAnterior: { activo: entidad.activo_antes_papelera },
      valorNuevo: { activo: false, deleted_at: eliminado.toISOString() },
    });
    return this.aItem(tipo, entidad);
  }

  async restaurar(
    tipoEntrada: string,
    id: number,
    usuario: AuthUser,
  ): Promise<{ restaurado: true }> {
    const tipo = this.validarTipo(tipoEntrada);
    const repositorio = this.repositorio(tipo);
    const entidad = await repositorio.findOneBy({ id });
    if (!entidad?.deleted_at) throw this.noEncontrado(tipo, id);
    const activoRestaurado = entidad.activo_antes_papelera ?? true;
    entidad.activo = activoRestaurado;
    entidad.deleted_at = null;
    entidad.activo_antes_papelera = null;
    await repositorio.save(entidad);
    await this.auditoriaService.registrar({
      usuario,
      accion: `RESTAURAR_${tipo.toUpperCase()}`,
      entidad: tipo,
      entidadId: id,
      valorNuevo: { activo: activoRestaurado, deleted_at: null },
    });
    return { restaurado: true };
  }

  async depurarVencidos(): Promise<void> {
    for (const tipo of TIPOS_PAPELERA) {
      const repositorio = this.repositorio(tipo);
      const entidades = await repositorio.find({
        where: { deleted_at: Not(IsNull()) },
      });
      for (const entidad of entidades) {
        if (!entidad.deleted_at || !this.estaVencido(entidad.deleted_at)) {
          continue;
        }
        try {
          await this.procesarEntidadVencida(tipo, entidad);
        } catch (error: unknown) {
          const mensaje = error instanceof Error ? error.message : 'Error desconocido';
          this.logger.error(
            `No fue posible procesar ${tipo} ${entidad.id}: ${mensaje}`,
          );
        }
      }
    }
  }

  private async aItem(
    tipo: TipoPapelera,
    entidad: EntidadPapeleraBase,
  ): Promise<PapeleraItem> {
    const deletedAt = entidad.deleted_at;
    if (!deletedAt) throw new Error('Registro fuera de Papelera');
    const tieneHistorial = await this.tieneHistorial(tipo, entidad.id);
    return {
      id: entidad.id,
      nombre: this.nombre(tipo, entidad),
      tipo,
      ...(tipo === 'ubicacion'
        ? { tipo_ubicacion: (entidad as Ubicacion).tipo }
        : {}),
      deleted_at: deletedAt,
      delete_after: new Date(deletedAt.getTime() + PAPELERA_RETENCION_MS),
      tiene_historial: tieneHistorial,
    };
  }

  private nombre(tipo: TipoPapelera, entidad: EntidadPapeleraBase): string {
    if (tipo === 'chofer') {
      const chofer = entidad as Chofer;
      return [chofer.nombre, chofer.apellido_paterno, chofer.apellido_materno]
        .filter(Boolean)
        .join(' ');
    }
    if (tipo === 'camion') {
      const camion = entidad as Camion;
      return camion.numero_economico
        ? `${camion.numero_economico} · ${camion.placas}`
        : camion.placas;
    }
    return (entidad as Checador | Chofer | Material | Ubicacion | Proyecto)
      .nombre;
  }

  private async tieneHistorial(
    tipo: TipoPapelera,
    id: number,
  ): Promise<boolean> {
    const referenciasPorTipo = {
      proyecto: [
        [Viaje, 'proyecto_id'],
        [Ubicacion, 'proyecto_id'],
        [OrdenAcarreo, 'proyecto_id'],
        [Tarifa, 'proyecto_id'],
        [Estimacion, 'proyecto_id'],
        [RutaAcarreo, 'proyecto_id'],
      ],
      material: [
        [Viaje, 'material_id'],
        [Viaje, 'material_llegada_id'],
        [OrdenAcarreo, 'material_id'],
        [Tarifa, 'material_id'],
      ],
      ubicacion: [
        [Viaje, 'ubicacion_origen_id'],
        [Viaje, 'ubicacion_destino_id'],
        [Viaje, 'ubicacion_destino_real_id'],
        [OrdenAcarreo, 'ubicacion_origen_id'],
        [OrdenAcarreo, 'ubicacion_destino_id'],
        [Tarifa, 'ubicacion_origen_id'],
        [Tarifa, 'ubicacion_destino_id'],
        [RutaAcarreo, 'ubicacion_origen_id'],
        [RutaAcarreo, 'ubicacion_destino_id'],
        [Suspension, 'ubicacion_id'],
      ],
      checador: [
        [Viaje, 'checador_salida_id'],
        [Viaje, 'checador_llegada_id'],
        [Viaje, 'checador_origen_id'],
        [Viaje, 'checador_destino_id'],
        [Suspension, 'checador_id'],
      ],
      chofer: [
        [Viaje, 'chofer_id'],
        [Suspension, 'chofer_id'],
      ],
      camion: [
        [Viaje, 'camion_id'],
        [Suspension, 'camion_id'],
      ],
    } satisfies Record<
      TipoPapelera,
      ReadonlyArray<readonly [EntityTarget<object>, string]>
    >;
    const referencias = referenciasPorTipo[tipo];
    for (const [entidad, campo] of referencias) {
      const count = await this.dataSource
        .getRepository(entidad)
        .createQueryBuilder('registro')
        .where(`registro.${campo} = :id`, { id })
        .getCount();
      if (count > 0) return true;
    }
    return false;
  }

  private repositorio(tipo: TipoPapelera): Repository<EntidadPapeleraBase> {
    const entidad: EntityTarget<EntidadPapeleraBase> = {
      checador: Checador,
      chofer: Chofer,
      camion: Camion,
      material: Material,
      ubicacion: Ubicacion,
      proyecto: Proyecto,
    }[tipo];
    return this.dataSource.getRepository(entidad);
  }

  private validarTipo(tipo: string): TipoPapelera {
    if (!TIPOS_PAPELERA.includes(tipo as TipoPapelera)) {
      throw new BadRequestException('Tipo de registro no válido');
    }
    return tipo as TipoPapelera;
  }

  private estaVencido(deletedAt: Date): boolean {
    return Date.now() >= deletedAt.getTime() + PAPELERA_RETENCION_MS;
  }

  private async procesarEntidadVencida(
    tipo: TipoPapelera,
    entidad: EntidadPapeleraBase,
  ): Promise<void> {
    if (await this.tieneHistorial(tipo, entidad.id)) {
      await this.conservarComoBaja(tipo, entidad);
      return;
    }
    await this.repositorio(tipo).remove(entidad);
    await this.auditoriaService.registrar({
      accion: `ELIMINAR_DEFINITIVO_${tipo.toUpperCase()}`,
      entidad: tipo,
      entidadId: entidad.id,
    });
  }

  private async conservarComoBaja(
    tipo: TipoPapelera,
    entidad: EntidadPapeleraBase,
    usuario?: AuthUser,
  ): Promise<void> {
    entidad.activo = false;
    entidad.deleted_at = null;
    entidad.activo_antes_papelera = null;
    await this.repositorio(tipo).save(entidad);
    await this.auditoriaService.registrar({
      usuario,
      accion: `CONSERVAR_COMO_BAJA_${tipo.toUpperCase()}`,
      entidad: tipo,
      entidadId: entidad.id,
    });
  }

  private noEncontrado(tipo: TipoPapelera, id: number): NotFoundException {
    return new NotFoundException(
      `Registro ${tipo} con id ${id} no encontrado en la Papelera`,
    );
  }
}
