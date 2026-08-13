import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  And,
  DataSource,
  EntityManager,
  FindOptionsWhere,
  LessThan,
  MoreThanOrEqual,
  QueryFailedError,
} from 'typeorm';
import { Camion } from '../camiones/camion.entity';
import { Checador } from '../checadores/checador.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Material } from '../materiales/material.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Role } from '../auth/enums/role.enum';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { TipoUbicacion, Ubicacion } from '../ubicaciones/ubicacion.entity';
import { RegistrarSalidaViajeDto } from './dto/registrar-salida-viaje.dto';
import { ConsultarViajesDto } from './dto/consultar-viajes.dto';
import { EstadoViaje } from './enums/estado-viaje.enum';
import {
  ViajeResponse,
  ViajesPaginadosResponse,
} from './interfaces/viaje-response.interface';
import { Viaje } from './viaje.entity';
import {
  construirFolioViaje,
  esFechaSimple,
  esUnidadMetrosCubicos,
  INDICE_CAMION_EN_TRANSITO,
  SECUENCIA_FOLIO_VIAJES,
  inicioDiaOperativo,
  sumarDiasFechaSimple,
} from './viajes.constants';

@Injectable()
export class ViajesService {
  constructor(private readonly dataSource: DataSource) {}

  async consultar(
    filtros: ConsultarViajesDto,
  ): Promise<ViajesPaginadosResponse> {
    const where: FindOptionsWhere<Viaje> = {};
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.proyecto_id) where.proyecto = { id: filtros.proyecto_id };
    if (filtros.material_id) where.material = { id: filtros.material_id };
    if (filtros.camion_id) where.camion = { id: filtros.camion_id };
    if (filtros.chofer_id) where.chofer = { id: filtros.chofer_id };
    if (filtros.ubicacion_origen_id) {
      where.ubicacion_origen = { id: filtros.ubicacion_origen_id };
    }
    if (filtros.ubicacion_destino_id) {
      where.ubicacion_destino = { id: filtros.ubicacion_destino_id };
    }

    const fechaDesde = filtros.fecha_desde
      ? this.convertirLimiteFecha(filtros.fecha_desde, false)
      : undefined;
    const fechaHasta = filtros.fecha_hasta
      ? this.convertirLimiteFecha(filtros.fecha_hasta, true)
      : undefined;
    if (fechaDesde && fechaHasta && fechaDesde >= fechaHasta) {
      throw new BadRequestException(
        'fecha_desde debe ser anterior a fecha_hasta',
      );
    }
    if (fechaDesde && fechaHasta) {
      where.fecha_hora_salida = And(
        MoreThanOrEqual(fechaDesde),
        LessThan(fechaHasta),
      );
    } else if (fechaDesde) {
      where.fecha_hora_salida = MoreThanOrEqual(fechaDesde);
    } else if (fechaHasta) {
      where.fecha_hora_salida = LessThan(fechaHasta);
    }

    const repositorio = this.dataSource.getRepository(Viaje);
    const [viajes, total] = await repositorio.findAndCount({
      where,
      relations: this.relacionesConsulta(),
      order: { fecha_hora_salida: 'DESC', id: 'DESC' },
      skip: (filtros.page - 1) * filtros.limit,
      take: filtros.limit,
    });
    return {
      data: viajes.map((viaje) => this.aRespuesta(viaje)),
      meta: {
        page: filtros.page,
        limit: filtros.limit,
        total,
        total_pages: Math.ceil(total / filtros.limit),
      },
    };
  }

  async consultarPorId(id: string): Promise<ViajeResponse> {
    const viaje = await this.dataSource.getRepository(Viaje).findOne({
      where: { id },
      relations: this.relacionesConsulta(),
    });
    if (!viaje) {
      throw new NotFoundException(`Viaje con id ${id} no encontrado`);
    }
    return this.aRespuesta(viaje);
  }

  async consultarActivoPorNfc(uid: string): Promise<ViajeResponse> {
    const camion = await this.dataSource.getRepository(Camion).findOneBy({
      nfc_tag_uid: uid,
      activo: true,
    });
    if (!camion) {
      throw new NotFoundException(`No existe un camión con el UID NFC ${uid}`);
    }
    const viaje = await this.dataSource.getRepository(Viaje).findOne({
      where: { camion: { id: camion.id }, estado: EstadoViaje.EN_TRANSITO },
      relations: this.relacionesConsulta(),
    });
    if (!viaje) {
      throw new NotFoundException(
        'El camión no tiene un viaje activo en tránsito',
      );
    }
    return this.aRespuesta(viaje);
  }

  async registrarSalida(
    dto: RegistrarSalidaViajeDto,
    usuario: AuthUser,
  ): Promise<Viaje> {
    if (usuario.rol !== Role.CHECADOR) {
      throw new ForbiddenException(
        'Solo un checador puede registrar una salida',
      );
    }

    if (dto.ubicacion_origen_id === dto.ubicacion_destino_id) {
      throw new BadRequestException(
        'La ubicación de origen y destino deben ser diferentes',
      );
    }

    try {
      return await this.dataSource.transaction((manager) =>
        this.registrarSalidaEnTransaccion(manager, dto, usuario),
      );
    } catch (error) {
      if (this.esConflictoCamionEnTransito(error)) {
        throw new ConflictException('El camión ya tiene un viaje en tránsito');
      }
      throw error;
    }
  }

  private async registrarSalidaEnTransaccion(
    manager: EntityManager,
    dto: RegistrarSalidaViajeDto,
    usuario: AuthUser,
  ): Promise<Viaje> {
    const proyecto = await manager.findOneBy(Proyecto, {
      id: dto.proyecto_id,
    });
    if (!proyecto) {
      throw new NotFoundException(
        `Proyecto con id ${dto.proyecto_id} no encontrado`,
      );
    }
    this.validarActivo(proyecto, 'El proyecto está inactivo');

    const material = await manager.findOneBy(Material, {
      id: dto.material_id,
    });
    if (!material) {
      throw new NotFoundException(
        `Material con id ${dto.material_id} no encontrado`,
      );
    }
    this.validarActivo(material, 'El material está inactivo');

    const camion = await manager.findOneBy(Camion, { id: dto.camion_id });
    if (!camion) {
      throw new NotFoundException(
        `Camión con id ${dto.camion_id} no encontrado`,
      );
    }
    this.validarActivo(camion, 'El camión está inactivo');

    const chofer = await manager.findOneBy(Chofer, { id: dto.chofer_id });
    if (!chofer) {
      throw new NotFoundException(
        `Chofer con id ${dto.chofer_id} no encontrado`,
      );
    }
    this.validarActivo(chofer, 'El chofer está inactivo');

    const ubicacionOrigen = await manager.findOne(Ubicacion, {
      where: { id: dto.ubicacion_origen_id },
      relations: { proyecto: true },
    });
    if (!ubicacionOrigen) {
      throw new NotFoundException(
        `Ubicación de origen con id ${dto.ubicacion_origen_id} no encontrada`,
      );
    }
    this.validarActivo(ubicacionOrigen, 'La ubicación de origen está inactiva');

    const ubicacionDestino = await manager.findOne(Ubicacion, {
      where: { id: dto.ubicacion_destino_id },
      relations: { proyecto: true },
    });
    if (!ubicacionDestino) {
      throw new NotFoundException(
        `Ubicación de destino con id ${dto.ubicacion_destino_id} no encontrada`,
      );
    }
    this.validarActivo(
      ubicacionDestino,
      'La ubicación de destino está inactiva',
    );

    const checador = await manager.findOneBy(Checador, { id: usuario.id });
    if (!checador || !checador.activo || checador.usuario !== usuario.usuario) {
      throw new UnauthorizedException('Usuario autenticado no válido');
    }

    if (
      ubicacionOrigen.proyecto.id !== proyecto.id ||
      ubicacionDestino.proyecto.id !== proyecto.id
    ) {
      throw new BadRequestException(
        'Las ubicaciones deben pertenecer al proyecto seleccionado',
      );
    }
    if (ubicacionOrigen.tipo !== TipoUbicacion.BANCO) {
      throw new BadRequestException(
        'La ubicación de origen debe ser de tipo banco',
      );
    }
    if (ubicacionDestino.tipo !== TipoUbicacion.FRENTE) {
      throw new BadRequestException(
        'La ubicación de destino debe ser de tipo frente',
      );
    }

    const unidadMedida = material.unidad_medida.trim();
    if (!unidadMedida) {
      throw new BadRequestException(
        'El material no tiene una unidad de medida válida',
      );
    }

    if (
      esUnidadMetrosCubicos(unidadMedida) &&
      dto.cantidad_salida > Number(camion.capacidad_m3)
    ) {
      throw new BadRequestException(
        'La cantidad de salida supera la capacidad del camión',
      );
    }

    const viajeActivo = await manager.findOne(Viaje, {
      where: {
        camion: { id: camion.id },
        estado: EstadoViaje.EN_TRANSITO,
      },
    });
    if (viajeActivo) {
      throw new ConflictException('El camión ya tiene un viaje en tránsito');
    }

    const fechaHoraSalida = new Date();
    const consecutivo = await this.obtenerConsecutivoFolio(manager);
    const viaje = manager.create(Viaje, {
      folio: construirFolioViaje(consecutivo, fechaHoraSalida),
      proyecto,
      material,
      camion,
      chofer,
      ubicacion_origen: ubicacionOrigen,
      ubicacion_destino: ubicacionDestino,
      checador_salida: checador,
      checador_llegada: null,
      administrador_cancelacion: null,
      cantidad_salida: dto.cantidad_salida.toString(),
      cantidad_llegada: null,
      unidad_medida: unidadMedida,
      fecha_hora_salida: fechaHoraSalida,
      fecha_hora_llegada: null,
      fecha_hora_cancelacion: null,
      estado: EstadoViaje.EN_TRANSITO,
      observaciones_salida: dto.observaciones_salida ?? null,
      observaciones_llegada: null,
      motivo_cancelacion: null,
    });

    return manager.save(Viaje, viaje);
  }

  private validarActivo(entidad: { activo: boolean }, mensaje: string): void {
    if (!entidad.activo) {
      throw new BadRequestException(mensaje);
    }
  }

  private async obtenerConsecutivoFolio(
    manager: EntityManager,
  ): Promise<number> {
    const resultado = await manager.query<Array<{ consecutivo: string }>>(
      `SELECT nextval('${SECUENCIA_FOLIO_VIAJES}') AS consecutivo`,
    );
    const consecutivo = Number(resultado[0]?.consecutivo);

    if (!Number.isInteger(consecutivo) || consecutivo < 1) {
      throw new Error('No fue posible generar el folio del viaje');
    }
    return consecutivo;
  }

  private esConflictoCamionEnTransito(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driverError = error.driverError as {
      code?: string;
      constraint?: string;
    };
    return (
      driverError.code === '23505' &&
      driverError.constraint === INDICE_CAMION_EN_TRANSITO
    );
  }

  private convertirLimiteFecha(valor: string, esHasta: boolean): Date {
    if (!esFechaSimple(valor)) return new Date(valor);
    try {
      return inicioDiaOperativo(
        esHasta ? sumarDiasFechaSimple(valor, 1) : valor,
      );
    } catch {
      throw new BadRequestException('El rango contiene una fecha inválida');
    }
  }

  private relacionesConsulta() {
    return {
      proyecto: true,
      material: true,
      camion: true,
      chofer: true,
      ubicacion_origen: true,
      ubicacion_destino: true,
      checador_salida: true,
      checador_llegada: true,
      administrador_cancelacion: true,
    } as const;
  }

  private aRespuesta(viaje: Viaje): ViajeResponse {
    const catalogo = (persona: { id: number; nombre: string }) => ({
      id: persona.id,
      nombre: persona.nombre,
    });
    return {
      id: viaje.id,
      id_legacy: viaje.id_legacy,
      folio: viaje.folio,
      proyecto: catalogo(viaje.proyecto),
      material: {
        ...catalogo(viaje.material),
        unidad_medida: viaje.material.unidad_medida,
      },
      camion: {
        id: viaje.camion.id,
        placas: viaje.camion.placas,
        numero_economico: viaje.camion.numero_economico,
        nfc_tag_uid: viaje.camion.nfc_tag_uid,
      },
      chofer: {
        ...catalogo(viaje.chofer),
        apellido_paterno: viaje.chofer.apellido_paterno,
        apellido_materno: viaje.chofer.apellido_materno,
      },
      ubicacion_origen: {
        ...catalogo(viaje.ubicacion_origen),
        tipo: viaje.ubicacion_origen.tipo,
      },
      ubicacion_destino: {
        ...catalogo(viaje.ubicacion_destino),
        tipo: viaje.ubicacion_destino.tipo,
      },
      checador_salida: catalogo(viaje.checador_salida),
      checador_llegada: viaje.checador_llegada
        ? catalogo(viaje.checador_llegada)
        : null,
      administrador_cancelacion: viaje.administrador_cancelacion
        ? catalogo(viaje.administrador_cancelacion)
        : null,
      cantidad_salida: viaje.cantidad_salida,
      cantidad_llegada: viaje.cantidad_llegada,
      unidad_medida: viaje.unidad_medida,
      fecha_hora_salida: viaje.fecha_hora_salida,
      fecha_hora_llegada: viaje.fecha_hora_llegada,
      fecha_hora_cancelacion: viaje.fecha_hora_cancelacion,
      estado: viaje.estado,
      observaciones_salida: viaje.observaciones_salida,
      observaciones_llegada: viaje.observaciones_llegada,
      motivo_cancelacion: viaje.motivo_cancelacion,
      creado_en: viaje.creado_en,
      actualizado_en: viaje.actualizado_en,
    };
  }
}
