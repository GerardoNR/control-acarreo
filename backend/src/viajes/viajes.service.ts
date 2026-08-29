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
  ILike,
  LessThan,
  MoreThanOrEqual,
  QueryFailedError,
} from 'typeorm';
import { Administrador } from '../administradores/administrador.entity';
import { Camion } from '../camiones/camion.entity';
import { Checador } from '../checadores/checador.entity';
import { Chofer } from '../choferes/chofer.entity';
import {
  EstadoLicencia,
  obtenerEstadoLicencia,
} from '../choferes/licencia-status';
import { Material } from '../materiales/material.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import {
  EstadoOrdenAcarreo,
  OrdenAcarreo,
} from '../ordenes-acarreo/orden-acarreo.entity';
import { Role } from '../auth/enums/role.enum';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Ubicacion } from '../ubicaciones/ubicacion.entity';
import { SuspensionesService } from '../suspensiones/suspensiones.service';
import { TipoEntidadSuspension } from '../suspensiones/suspension.entity';
import { TipoCobroTarifa } from '../tarifas/tarifa.entity';
import { Tarifa } from '../tarifas/tarifa.entity';
import { RutaAcarreo } from '../rutas-acarreo/ruta-acarreo.entity';
import { UnidadControl } from '../unidades-control/unidad-control.entity';
import {
  IncidenciasViajeService,
  NuevaIncidenciaAutomatica,
} from '../incidencias-viaje/incidencias-viaje.service';
import { TipoIncidenciaViaje } from '../incidencias-viaje/incidencia-viaje.entity';
import { TicketsService } from '../tickets/tickets.service';
import { obtenerFechaOperativa } from '../common/operational-datetime';
import { calcularAcarreoEscalonado } from './calculos-acarreo';
import { CancelarViajeDto } from './dto/cancelar-viaje.dto';
import { RegistrarLlegadaViajeDto } from './dto/registrar-llegada-viaje.dto';
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
  constructor(
    private readonly dataSource: DataSource,
    private readonly suspensionesService: SuspensionesService,
    private readonly ticketsService: TicketsService,
    private readonly incidenciasService: IncidenciasViajeService,
  ) {}

  async consultar(
    filtros: ConsultarViajesDto,
  ): Promise<ViajesPaginadosResponse> {
    const where: FindOptionsWhere<Viaje> = {};
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.folio) where.folio = ILike(`%${filtros.folio}%`);
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
  ): Promise<ViajeResponse> {
    if (usuario.rol !== Role.CHECADOR) {
      throw new ForbiddenException(
        'Solo un checador puede registrar una salida',
      );
    }

    if (
      dto.ubicacion_origen_id !== undefined &&
      dto.ubicacion_origen_id === dto.ubicacion_destino_id
    ) {
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

  async registrarLlegada(
    id: string,
    dto: RegistrarLlegadaViajeDto,
    usuario: AuthUser,
  ): Promise<ViajeResponse> {
    if (usuario.rol !== Role.CHECADOR) {
      throw new ForbiddenException(
        'Solo un checador puede registrar una llegada',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const viaje = await manager.findOne(Viaje, {
        where: { id },
        relations: {
          proyecto: true,
          material: true,
          ubicacion_destino: true,
          checador_salida: true,
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (!viaje) {
        throw new NotFoundException(`Viaje con id ${id} no encontrado`);
      }
      const checador = await this.obtenerChecadorAutenticado(manager, usuario);
      if (viaje.estado === EstadoViaje.COMPLETADO) {
        const viajeCompletado = await manager.findOneOrFail(Viaje, {
          where: { id },
          relations: this.relacionesConsulta(),
        });
        return this.aRespuesta(viajeCompletado);
      }
      if (viaje.estado !== EstadoViaje.EN_TRANSITO) {
        throw new ConflictException('El viaje ya no está en tránsito');
      }

      const destinoReal = dto.ubicacion_destino_real_id
        ? await manager.findOne(Ubicacion, {
            where: { id: dto.ubicacion_destino_real_id },
            relations: { proyecto: true },
          })
        : viaje.ubicacion_destino;
      if (!destinoReal || !destinoReal.activo) {
        throw new BadRequestException(
          'La ubicación de destino real no es válida',
        );
      }
      if (
        destinoReal.proyecto &&
        destinoReal.proyecto.id !== viaje.proyecto.id
      ) {
        throw new BadRequestException(
          'El destino real debe pertenecer al proyecto del viaje',
        );
      }

      const materialLlegada = dto.material_llegada_id
        ? await manager.findOneBy(Material, { id: dto.material_llegada_id })
        : viaje.material;
      if (!materialLlegada || !materialLlegada.activo) {
        throw new BadRequestException('El material de llegada no es válido');
      }

      const unidadControl = dto.unidad_control_id
        ? await manager.findOne(UnidadControl, {
            where: { id: dto.unidad_control_id },
            relations: { proyecto: true },
          })
        : viaje.unidad_control;
      if (dto.unidad_control_id && (!unidadControl || !unidadControl.activo)) {
        throw new BadRequestException(
          'La unidad de control seleccionada no existe o está retirada',
        );
      }
      if (
        unidadControl?.proyecto &&
        unidadControl.proyecto.id !== viaje.proyecto.id
      ) {
        throw new BadRequestException(
          'La unidad de control debe pertenecer al proyecto del viaje',
        );
      }

      viaje.cantidad_llegada = dto.cantidad_llegada?.toString() ?? null;
      viaje.fecha_hora_llegada = new Date();
      viaje.checador_llegada = checador;
      viaje.ubicacion_destino_real = destinoReal;
      viaje.material_llegada = materialLlegada;
      viaje.material_destino_nombre_snapshot = materialLlegada.nombre;
      viaje.unidad_control = unidadControl;
      viaje.unidad_control_nombre_snapshot = unidadControl?.nombre ?? null;
      viaje.folio_destino = dto.folio_destino ?? null;
      viaje.observaciones_llegada = dto.observaciones_llegada ?? null;
      viaje.estado = EstadoViaje.COMPLETADO;

      await manager.save(Viaje, viaje);
      await this.incidenciasService.registrarAutomaticas(
        manager,
        viaje,
        this.incidenciasLlegada(viaje, destinoReal, materialLlegada, checador),
      );
      const viajeActualizado = await manager.findOneOrFail(Viaje, {
        where: { id },
        relations: this.relacionesConsulta(),
      });
      return this.aRespuesta(viajeActualizado);
    });
  }

  private incidenciasLlegada(
    viaje: Viaje,
    destinoReal: Ubicacion,
    materialLlegada: Material,
    checadorLlegada: Checador,
  ): NuevaIncidenciaAutomatica[] {
    const incidencias: NuevaIncidenciaAutomatica[] = [];
    if (destinoReal.id !== viaje.ubicacion_destino.id) {
      incidencias.push({
        tipo: TipoIncidenciaViaje.DESTINO_DIFERENTE,
        mensaje: 'El destino real es diferente al destino esperado',
        datos: {
          destino_esperado_id: viaje.ubicacion_destino.id,
          destino_real_id: destinoReal.id,
        },
      });
    }
    if (materialLlegada.id !== viaje.material.id) {
      incidencias.push({
        tipo: TipoIncidenciaViaje.MATERIAL_DESTINO_DIFERENTE,
        mensaje: 'El material de llegada es diferente al material esperado',
        datos: {
          material_esperado_id: viaje.material.id,
          material_llegada_id: materialLlegada.id,
        },
      });
    }
    if (checadorLlegada.id === viaje.checador_salida.id) {
      incidencias.push({
        tipo: TipoIncidenciaViaje.MISMO_CHECADOR,
        mensaje: 'El mismo checador registró la salida y la llegada',
        datos: { checador_id: checadorLlegada.id },
      });
    }
    return incidencias;
  }

  async cancelar(
    id: string,
    dto: CancelarViajeDto,
    usuario: AuthUser,
  ): Promise<ViajeResponse> {
    if (usuario.rol !== Role.ADMINISTRADOR) {
      throw new ForbiddenException(
        'Solo un administrador puede cancelar un viaje',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const viaje = await manager.findOne(Viaje, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!viaje) {
        throw new NotFoundException(`Viaje con id ${id} no encontrado`);
      }
      if (viaje.estado !== EstadoViaje.EN_TRANSITO) {
        throw new ConflictException('El viaje ya no está en tránsito');
      }

      const administrador = await this.obtenerAdministradorAutenticado(
        manager,
        usuario,
      );
      viaje.estado = EstadoViaje.CANCELADO;
      viaje.fecha_hora_cancelacion = new Date();
      viaje.administrador_cancelacion = administrador;
      viaje.motivo_cancelacion = dto.motivo_cancelacion;

      await manager.save(Viaje, viaje);
      const viajeActualizado = await manager.findOneOrFail(Viaje, {
        where: { id },
        relations: this.relacionesConsulta(),
      });
      return this.aRespuesta(viajeActualizado);
    });
  }

  private async registrarSalidaEnTransaccion(
    manager: EntityManager,
    dto: RegistrarSalidaViajeDto,
    usuario: AuthUser,
  ): Promise<ViajeResponse> {
    const fechaHoraSalida = new Date();
    const fechaOperativa = obtenerFechaOperativa(fechaHoraSalida);
    const orden = dto.orden_acarreo_id
      ? await manager.findOne(OrdenAcarreo, {
          where: { id: dto.orden_acarreo_id },
          relations: {
            proyecto: true,
            material: true,
            ubicacion_origen: true,
            ubicacion_destino: true,
            ruta_acarreo: true,
            unidad_control: true,
            tarifa: true,
          },
        })
      : null;
    if (dto.orden_acarreo_id && !orden) {
      throw new NotFoundException(
        `Orden de acarreo con id ${dto.orden_acarreo_id} no encontrada`,
      );
    }
    if (
      orden &&
      ![EstadoOrdenAcarreo.PENDIENTE, EstadoOrdenAcarreo.EN_PROCESO].includes(
        orden.estado,
      )
    ) {
      throw new BadRequestException('La orden de acarreo no está disponible');
    }
    if (orden?.unidad_control && !orden.unidad_control.activo) {
      throw new BadRequestException(
        'La unidad de control sugerida por la orden está retirada',
      );
    }
    if (
      orden &&
      (orden.fecha_inicio > fechaOperativa ||
        (orden.fecha_fin !== null && orden.fecha_fin < fechaOperativa))
    ) {
      throw new BadRequestException('La orden de acarreo no está vigente');
    }

    const proyectoId = dto.proyecto_id ?? orden?.proyecto.id;
    const materialId = dto.material_id ?? orden?.material.id;
    const origenId = dto.ubicacion_origen_id ?? orden?.ubicacion_origen.id;
    const destinoId = dto.ubicacion_destino_id ?? orden?.ubicacion_destino.id;
    if (!proyectoId || !materialId || !origenId || !destinoId) {
      throw new BadRequestException(
        'Debe indicar una orden de acarreo o todos los datos operativos del viaje',
      );
    }
    if (origenId === destinoId) {
      throw new BadRequestException(
        'La ubicación de origen y destino deben ser diferentes',
      );
    }

    const proyecto = await manager.findOneBy(Proyecto, {
      id: proyectoId,
    });
    if (!proyecto) {
      throw new NotFoundException(
        `Proyecto con id ${proyectoId} no encontrado`,
      );
    }
    this.validarActivo(proyecto, 'El proyecto está inactivo');

    const material = await manager.findOneBy(Material, {
      id: materialId,
    });
    if (!material) {
      throw new NotFoundException(
        `Material con id ${materialId} no encontrado`,
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
    if (!camion.codigo_ticket_unidad) {
      throw new BadRequestException(
        'El camión no tiene configurado su código de ticket.',
      );
    }
    await this.suspensionesService.validarDisponible(
      TipoEntidadSuspension.CAMION,
      camion.id,
      'El camión está suspendido temporalmente',
    );

    const chofer = await manager.findOneBy(Chofer, { id: dto.chofer_id });
    if (!chofer) {
      throw new NotFoundException(
        `Chofer con id ${dto.chofer_id} no encontrado`,
      );
    }
    this.validarActivo(chofer, 'El chofer está inactivo');
    if (chofer.deleted_at) {
      throw new BadRequestException('El chofer está en la Papelera');
    }
    if (
      obtenerEstadoLicencia(chofer.vigencia_licencia) === EstadoLicencia.VENCIDA
    ) {
      throw new BadRequestException(
        'La licencia del chofer está vencida. Debe renovarse antes de asignarlo a un nuevo viaje.',
      );
    }
    await this.suspensionesService.validarDisponible(
      TipoEntidadSuspension.CHOFER,
      chofer.id,
      'El chofer está suspendido temporalmente',
    );

    const ubicacionOrigen = await manager.findOne(Ubicacion, {
      where: { id: origenId },
      relations: { proyecto: true },
    });
    if (!ubicacionOrigen) {
      throw new NotFoundException(
        `Ubicación de origen con id ${origenId} no encontrada`,
      );
    }
    this.validarActivo(ubicacionOrigen, 'La ubicación de origen está inactiva');
    await this.suspensionesService.validarDisponible(
      TipoEntidadSuspension.UBICACION,
      ubicacionOrigen.id,
      'La ubicación de origen está suspendida temporalmente',
    );

    const ubicacionDestino = await manager.findOne(Ubicacion, {
      where: { id: destinoId },
      relations: { proyecto: true },
    });
    if (!ubicacionDestino) {
      throw new NotFoundException(
        `Ubicación de destino con id ${destinoId} no encontrada`,
      );
    }
    this.validarActivo(
      ubicacionDestino,
      'La ubicación de destino está inactiva',
    );
    await this.suspensionesService.validarDisponible(
      TipoEntidadSuspension.UBICACION,
      ubicacionDestino.id,
      'La ubicación de destino está suspendida temporalmente',
    );

    const checador = await this.obtenerChecadorAutenticado(manager, usuario);

    if (
      ubicacionOrigen.proyecto.id !== proyecto.id ||
      ubicacionDestino.proyecto.id !== proyecto.id
    ) {
      throw new BadRequestException(
        'Las ubicaciones deben pertenecer al proyecto seleccionado',
      );
    }
    if (
      orden &&
      (orden.proyecto.id !== proyecto.id ||
        orden.material.id !== material.id ||
        orden.ubicacion_origen.id !== ubicacionOrigen.id ||
        orden.ubicacion_destino.id !== ubicacionDestino.id)
    ) {
      throw new BadRequestException(
        'El viaje no coincide con el proyecto, material y ruta de la orden',
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

    const ruta = await this.resolverRuta(
      manager,
      orden,
      proyecto.id,
      ubicacionOrigen.id,
      ubicacionDestino.id,
      fechaOperativa,
    );
    const tarifa = await this.resolverTarifa(
      manager,
      orden,
      proyecto.id,
      material.id,
      ubicacionOrigen.id,
      ubicacionDestino.id,
      ruta,
      fechaOperativa,
    );
    const consecutivo = await this.obtenerConsecutivoFolio(manager);
    const snapshotsEconomicos = this.construirSnapshotsEconomicos(
      camion.capacidad_m3,
      ruta,
      tarifa,
    );
    const viaje = manager.create(Viaje, {
      folio: construirFolioViaje(consecutivo, fechaHoraSalida),
      proyecto,
      orden_acarreo: orden,
      folio_origen: dto.folio_origen ?? null,
      folio_destino: null,
      material,
      material_llegada: null,
      camion,
      chofer,
      ubicacion_origen: ubicacionOrigen,
      ubicacion_destino: ubicacionDestino,
      ubicacion_destino_real: null,
      ruta_acarreo: ruta,
      unidad_control: orden?.unidad_control ?? null,
      tarifa_aplicada: tarifa,
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
      proyecto_nombre_snapshot: proyecto.nombre,
      placas_snapshot: camion.placas,
      capacidad_aplicada_m3: camion.capacidad_m3,
      origen_nombre_snapshot: ubicacionOrigen.nombre,
      origen_tipo_snapshot: ubicacionOrigen.tipo,
      destino_nombre_snapshot: ubicacionDestino.nombre,
      destino_tipo_snapshot: ubicacionDestino.tipo,
      material_origen_nombre_snapshot: material.nombre,
      material_destino_nombre_snapshot: null,
      ruta_descripcion_snapshot: ruta?.descripcion ?? null,
      distancia_pavimento_aplicada: ruta?.distancia_pavimento ?? null,
      distancia_total_aplicada: ruta?.distancia_total ?? null,
      unidad_control_nombre_snapshot: null,
      ...snapshotsEconomicos,
    });

    const viajeGuardado = await manager.save(Viaje, viaje);
    await this.ticketsService.crearParaViaje(
      manager,
      viajeGuardado.id,
      camion.codigo_ticket_unidad,
      fechaHoraSalida,
    );
    await this.incidenciasService.registrarAutomaticas(
      manager,
      viajeGuardado,
      this.incidenciasConfiguracion(ruta, tarifa),
    );
    const viajeCompleto = await manager.findOneOrFail(Viaje, {
      where: { id: viajeGuardado.id },
      relations: this.relacionesConsulta(),
    });
    return this.aRespuesta(viajeCompleto);
  }

  private async resolverRuta(
    manager: EntityManager,
    orden: OrdenAcarreo | null,
    proyectoId: number,
    origenId: number,
    destinoId: number,
    fecha: string,
  ): Promise<RutaAcarreo | null> {
    if (orden?.ruta_acarreo) {
      this.validarVigenciaConfiguracion(
        orden.ruta_acarreo.activo,
        orden.ruta_acarreo.vigente_desde,
        orden.ruta_acarreo.vigente_hasta,
        fecha,
        'La ruta configurada en la orden no está vigente',
      );
      return orden.ruta_acarreo;
    }

    const candidatas = await manager
      .createQueryBuilder(RutaAcarreo, 'ruta')
      .where('ruta.proyecto_id = :proyectoId', { proyectoId })
      .andWhere('ruta.ubicacion_origen_id = :origenId', { origenId })
      .andWhere('ruta.ubicacion_destino_id = :destinoId', { destinoId })
      .andWhere('ruta.activo = true')
      .andWhere('ruta.vigente_desde <= :fecha', { fecha })
      .andWhere(
        '(ruta.vigente_hasta IS NULL OR ruta.vigente_hasta >= :fecha)',
        {
          fecha,
        },
      )
      .take(2)
      .getMany();
    if (candidatas.length > 1) {
      throw new ConflictException(
        'Existen varias rutas vigentes; configure una ruta en la orden',
      );
    }
    return candidatas[0] ?? null;
  }

  private async resolverTarifa(
    manager: EntityManager,
    orden: OrdenAcarreo | null,
    proyectoId: number,
    materialId: number,
    origenId: number,
    destinoId: number,
    ruta: RutaAcarreo | null,
    fecha: string,
  ): Promise<Tarifa | null> {
    if (orden?.tarifa) {
      this.validarVigenciaConfiguracion(
        orden.tarifa.activo,
        orden.tarifa.vigente_desde,
        orden.tarifa.vigente_hasta,
        fecha,
        'La tarifa configurada en la orden no está vigente',
      );
      return orden.tarifa;
    }

    const qb = manager
      .createQueryBuilder(Tarifa, 'tarifa')
      .where('tarifa.proyecto_id = :proyectoId', { proyectoId })
      .andWhere('tarifa.material_id = :materialId', { materialId })
      .andWhere('tarifa.ubicacion_origen_id = :origenId', { origenId })
      .andWhere('tarifa.ubicacion_destino_id = :destinoId', { destinoId })
      .andWhere('tarifa.activo = true')
      .andWhere('tarifa.vigente_desde <= :fecha', { fecha })
      .andWhere(
        '(tarifa.vigente_hasta IS NULL OR tarifa.vigente_hasta >= :fecha)',
        { fecha },
      );
    if (ruta) {
      qb.andWhere(
        '(tarifa.ruta_acarreo_id = :rutaId OR tarifa.ruta_acarreo_id IS NULL)',
        { rutaId: ruta.id },
      );
    } else {
      qb.andWhere('tarifa.ruta_acarreo_id IS NULL');
    }
    const candidatas = await qb.take(2).getMany();
    if (candidatas.length > 1) {
      throw new ConflictException(
        'Existen varias tarifas vigentes; configure una tarifa en la orden',
      );
    }
    return candidatas[0] ?? null;
  }

  private validarVigenciaConfiguracion(
    activa: boolean,
    desde: string,
    hasta: string | null,
    fecha: string,
    mensaje: string,
  ): void {
    if (!activa || desde > fecha || (hasta !== null && hasta < fecha)) {
      throw new BadRequestException(mensaje);
    }
  }

  private incidenciasConfiguracion(
    ruta: RutaAcarreo | null,
    tarifa: Tarifa | null,
  ): NuevaIncidenciaAutomatica[] {
    const incidencias: NuevaIncidenciaAutomatica[] = [];
    if (!ruta) {
      incidencias.push({
        tipo: TipoIncidenciaViaje.RUTA_NO_CONFIGURADA,
        mensaje: 'No se encontró una ruta de acarreo vigente para el viaje',
      });
    }
    if (!tarifa) {
      incidencias.push({
        tipo: TipoIncidenciaViaje.TARIFA_NO_CONFIGURADA,
        mensaje: 'No se encontró una tarifa vigente para el viaje',
      });
    }
    return incidencias;
  }

  private validarActivo(entidad: { activo: boolean }, mensaje: string): void {
    if (!entidad.activo) {
      throw new BadRequestException(mensaje);
    }
  }

  private async obtenerChecadorAutenticado(
    manager: EntityManager,
    usuario: AuthUser,
  ): Promise<Checador> {
    const checador = await manager.findOneBy(Checador, { id: usuario.id });
    if (!checador || !checador.activo || checador.usuario !== usuario.usuario) {
      throw new UnauthorizedException('Usuario autenticado no válido');
    }
    await this.suspensionesService.validarDisponible(
      TipoEntidadSuspension.CHECADOR,
      checador.id,
      'La cuenta del checador está suspendida temporalmente',
    );
    return checador;
  }

  private async obtenerAdministradorAutenticado(
    manager: EntityManager,
    usuario: AuthUser,
  ): Promise<Administrador> {
    const administrador = await manager.findOneBy(Administrador, {
      id: usuario.id,
    });
    if (
      !administrador ||
      !administrador.activo ||
      administrador.usuario !== usuario.usuario
    ) {
      throw new UnauthorizedException('Usuario autenticado no válido');
    }
    return administrador;
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
      orden_acarreo: { unidad_control: true },
      material_llegada: true,
      ubicacion_destino_real: true,
      ruta_acarreo: true,
      unidad_control: true,
      tarifa_aplicada: true,
      ticket: true,
      incidencias: true,
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

  private construirSnapshotsEconomicos(
    capacidadM3: string,
    ruta: RutaAcarreo | null,
    tarifa: Tarifa | null,
  ) {
    if (
      !tarifa ||
      !ruta ||
      tarifa.tipo_cobro !== TipoCobroTarifa.POR_DISTANCIA_ESCALONADA ||
      tarifa.precio_primer_km === null ||
      tarifa.precio_km_subsecuente === null
    ) {
      return {
        tipo_tarifa_aplicada: tarifa?.tipo_cobro ?? null,
        precio_unitario_aplicado: tarifa?.precio_unitario ?? null,
        precio_primer_km_aplicado: tarifa?.precio_primer_km ?? null,
        precio_km_subsecuente_aplicado: tarifa?.precio_km_subsecuente ?? null,
        m3_km: null,
        coste_primer_km: null,
        coste_km_subsecuente: null,
        importe_acarreo: null,
      };
    }
    const resultado = calcularAcarreoEscalonado({
      capacidadM3,
      distanciaPavimentoKm: ruta.distancia_pavimento,
      distanciaTotalKm: ruta.distancia_total,
      precioPrimerKm: tarifa.precio_primer_km,
      precioKmSubsecuente: tarifa.precio_km_subsecuente,
    });
    return {
      tipo_tarifa_aplicada: tarifa.tipo_cobro,
      precio_unitario_aplicado: null,
      precio_primer_km_aplicado: tarifa.precio_primer_km,
      precio_km_subsecuente_aplicado: tarifa.precio_km_subsecuente,
      m3_km: resultado.m3Km,
      coste_primer_km: resultado.costePrimerKm,
      coste_km_subsecuente: resultado.costeKmSubsecuente,
      importe_acarreo: resultado.importe,
    };
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
      folio_origen: viaje.folio_origen,
      folio_destino: viaje.folio_destino,
      ticket: viaje.ticket
        ? {
            id: viaje.ticket.id,
            codigo_ticket: viaje.ticket.codigo_ticket,
            fecha_generacion: viaje.ticket.fecha_generacion,
          }
        : null,
      proyecto: catalogo(viaje.proyecto),
      orden_acarreo: viaje.orden_acarreo
        ? { id: viaje.orden_acarreo.id, folio: viaje.orden_acarreo.folio }
        : null,
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
      ubicacion_destino_real: viaje.ubicacion_destino_real
        ? {
            ...catalogo(viaje.ubicacion_destino_real),
            tipo: viaje.ubicacion_destino_real.tipo,
          }
        : null,
      material_llegada: viaje.material_llegada
        ? catalogo(viaje.material_llegada)
        : null,
      ruta_acarreo: viaje.ruta_acarreo
        ? {
            id: viaje.ruta_acarreo.id,
            clave: viaje.ruta_acarreo.clave,
            descripcion: viaje.ruta_descripcion_snapshot,
          }
        : null,
      unidad_control: viaje.unidad_control
        ? catalogo(viaje.unidad_control)
        : null,
      unidad_control_sugerida: viaje.orden_acarreo?.unidad_control
        ? catalogo(viaje.orden_acarreo.unidad_control)
        : null,
      calculo_economico:
        viaje.capacidad_aplicada_m3 !== null &&
        viaje.distancia_pavimento_aplicada !== null &&
        viaje.distancia_total_aplicada !== null &&
        viaje.m3_km !== null &&
        viaje.coste_primer_km !== null &&
        viaje.coste_km_subsecuente !== null &&
        viaje.importe_acarreo !== null
          ? {
              capacidad_m3: viaje.capacidad_aplicada_m3,
              distancia_pavimento_km: viaje.distancia_pavimento_aplicada,
              distancia_total_km: viaje.distancia_total_aplicada,
              m3_km: viaje.m3_km,
              coste_primer_km: viaje.coste_primer_km,
              coste_km_subsecuente: viaje.coste_km_subsecuente,
              importe: viaje.importe_acarreo,
            }
          : null,
      incidencias: (viaje.incidencias ?? []).map((incidencia) => ({
        id: incidencia.id,
        tipo: incidencia.tipo,
        origen: incidencia.origen,
        mensaje: incidencia.mensaje,
        datos: incidencia.datos,
        activa: incidencia.activa,
        detectada_en: incidencia.detectada_en,
      })),
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
