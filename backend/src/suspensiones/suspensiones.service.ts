import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Administrador } from '../administradores/administrador.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Camion } from '../camiones/camion.entity';
import { Checador } from '../checadores/checador.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Ubicacion } from '../ubicaciones/ubicacion.entity';
import { EstadoViaje } from '../viajes/enums/estado-viaje.enum';
import { formatearFechaOperativa } from '../viajes/viajes.constants';
import { Viaje } from '../viajes/viaje.entity';
import { CrearSuspensionDto } from './dto/crear-suspension.dto';
import { Suspension, TipoEntidadSuspension } from './suspension.entity';
import { MOTIVOS_SUSPENSION, SuspensionResumen } from './suspensiones.types';

type EntidadSuspendible = Checador | Chofer | Camion | Ubicacion;

@Injectable()
export class SuspensionesService {
  constructor(
    @InjectRepository(Suspension)
    private readonly repository: Repository<Suspension>,
    private readonly auditoria: AuditoriaService,
  ) {}

  async suspender(
    tipoEntrada: string,
    id: number,
    dto: CrearSuspensionDto,
    usuario: AuthUser,
  ) {
    const tipo = this.tipo(tipoEntrada);
    this.validarDto(tipo, dto);
    const entidad = await this.encontrarEntidad(
      this.repository.manager,
      tipo,
      id,
    );
    if (entidad.deleted_at)
      throw new ConflictException('El registro se encuentra en la Papelera');
    if (!entidad.activo)
      throw new ConflictException(
        'El registro no está disponible para suspenderse',
      );
    if (tipo === TipoEntidadSuspension.CAMION)
      await this.validarCamionSinViaje(id);
    if (await this.buscarAbierta(tipo, id)) {
      throw new ConflictException(
        'El registro ya tiene una suspensión vigente o programada',
      );
    }
    const administrador = await this.repository.manager.findOneBy(
      Administrador,
      { id: usuario.id },
    );
    if (!administrador)
      throw new NotFoundException('Administrador no encontrado');
    const suspension = this.repository.create({
      checador: tipo === TipoEntidadSuspension.CHECADOR ? entidad : null,
      chofer: tipo === TipoEntidadSuspension.CHOFER ? entidad : null,
      camion: tipo === TipoEntidadSuspension.CAMION ? entidad : null,
      ubicacion: tipo === TipoEntidadSuspension.UBICACION ? entidad : null,
      motivo: dto.motivo,
      observaciones: dto.observaciones?.trim() || null,
      fecha_inicio: dto.fecha_inicio,
      fecha_fin: dto.indefinida ? null : dto.fecha_fin!,
      indefinida: dto.indefinida,
      creada_por: administrador,
      finalizada_at: null,
      finalizada_por: null,
    });
    const guardada = await this.repository.save(suspension);
    await this.auditoria.registrar({
      usuario,
      accion: `SUSPENDER_${tipo.toUpperCase()}`,
      entidad: tipo,
      entidadId: id,
      valorNuevo: { ...this.resumen(guardada) },
    });
    return this.resumen(guardada);
  }

  async reanudar(tipoEntrada: string, id: number, usuario: AuthUser) {
    const tipo = this.tipo(tipoEntrada);
    await this.encontrarEntidad(this.repository.manager, tipo, id);
    const suspension = await this.buscarAbierta(tipo, id);
    if (!suspension)
      throw new ConflictException(
        'El registro no tiene una suspensión vigente o programada',
      );
    const administrador = await this.repository.manager.findOneBy(
      Administrador,
      { id: usuario.id },
    );
    if (!administrador)
      throw new NotFoundException('Administrador no encontrado');
    suspension.finalizada_at = new Date();
    suspension.finalizada_por = administrador;
    await this.repository.save(suspension);
    await this.auditoria.registrar({
      usuario,
      accion: `REANUDAR_${tipo.toUpperCase()}`,
      entidad: tipo,
      entidadId: id,
      valorAnterior: { ...this.resumen(suspension) },
      valorNuevo: { finalizada_at: suspension.finalizada_at.toISOString() },
    });
    return { reanudado: true };
  }

  async finalizarPorPapelera(
    tipoEntrada: string,
    id: number,
    usuario: AuthUser,
  ): Promise<void> {
    const tipo = this.tipo(tipoEntrada);
    const suspension = await this.buscarAbierta(tipo, id);
    if (!suspension) return;
    const administrador = await this.repository.manager.findOneBy(
      Administrador,
      { id: usuario.id },
    );
    if (!administrador) return;
    suspension.finalizada_at = new Date();
    suspension.finalizada_por = administrador;
    await this.repository.save(suspension);
  }

  async actual(
    tipoEntrada: string,
    id: number,
    fecha = new Date(),
  ): Promise<SuspensionResumen | null> {
    const tipo = this.tipo(tipoEntrada);
    const hoy = this.hoy(fecha);
    const alias = 'suspension';
    const suspension = await this.repository
      .createQueryBuilder(alias)
      .where(`${alias}.${this.columna(tipo)} = :id`, { id })
      .andWhere(`${alias}.finalizada_at IS NULL`)
      .andWhere(`${alias}.fecha_inicio <= :hoy`, { hoy })
      .andWhere(`(${alias}.indefinida = true OR ${alias}.fecha_fin >= :hoy)`, {
        hoy,
      })
      .orderBy(`${alias}.creada_en`, 'DESC')
      .getOne();
    return suspension ? this.resumen(suspension) : null;
  }

  async activas(
    tipoEntrada: string,
    fecha = new Date(),
  ): Promise<Record<number, SuspensionResumen>> {
    const tipo = this.tipo(tipoEntrada);
    const hoy = this.hoy(fecha);
    const rows = await this.repository
      .createQueryBuilder('s')
      .leftJoinAndSelect(`s.${tipo}`, tipo)
      .where(`s.${this.columna(tipo)} IS NOT NULL`)
      .andWhere('s.finalizada_at IS NULL')
      .andWhere('s.fecha_inicio <= :hoy', { hoy })
      .andWhere('(s.indefinida = true OR s.fecha_fin >= :hoy)', { hoy })
      .getMany();
    return Object.fromEntries(
      rows.map((row) => [this.entidadId(row, tipo), this.resumen(row)]),
    );
  }

  async estaSuspendido(
    tipo: TipoEntidadSuspension,
    id: number,
    fecha = new Date(),
  ): Promise<boolean> {
    return (await this.actual(tipo, id, fecha)) !== null;
  }

  async validarDisponible(
    tipo: TipoEntidadSuspension,
    id: number,
    mensaje: string,
  ): Promise<void> {
    if (await this.estaSuspendido(tipo, id))
      throw new ConflictException(mensaje);
  }

  private async buscarAbierta(
    tipo: TipoEntidadSuspension,
    id: number,
  ): Promise<Suspension | null> {
    const hoy = this.hoy(new Date());
    return this.repository
      .createQueryBuilder('s')
      .where(`s.${this.columna(tipo)} = :id`, { id })
      .andWhere('s.finalizada_at IS NULL')
      .andWhere('(s.indefinida = true OR s.fecha_fin >= :hoy)', { hoy })
      .orderBy('s.creada_en', 'DESC')
      .getOne();
  }

  private async validarCamionSinViaje(id: number): Promise<void> {
    const enTransito = await this.repository.manager
      .getRepository(Viaje)
      .exists({
        where: { camion: { id }, estado: EstadoViaje.EN_TRANSITO },
      });
    if (enTransito)
      throw new ConflictException(
        'El camión tiene un viaje en tránsito. Finaliza o cancela el viaje antes de suspenderlo.',
      );
  }

  private validarDto(
    tipo: TipoEntidadSuspension,
    dto: CrearSuspensionDto,
  ): void {
    if (!MOTIVOS_SUSPENSION[tipo].includes(dto.motivo))
      throw new BadRequestException('Motivo de suspensión no válido');
    if (dto.motivo === 'Otro' && !dto.observaciones?.trim())
      throw new BadRequestException('Especifica el motivo en Observaciones');
    if (dto.indefinida && dto.fecha_fin)
      throw new BadRequestException(
        'Una suspensión indefinida no debe tener fecha de fin',
      );
    if (!dto.indefinida && !dto.fecha_fin)
      throw new BadRequestException('La fecha de fin es obligatoria');
    if (dto.fecha_fin && dto.fecha_fin < dto.fecha_inicio)
      throw new BadRequestException(
        'La fecha de fin debe ser igual o posterior a la fecha de inicio',
      );
  }

  private async encontrarEntidad(
    manager: EntityManager,
    tipo: TipoEntidadSuspension,
    id: number,
  ): Promise<
    EntidadSuspendible & { deleted_at: Date | null; activo: boolean }
  > {
    const target = {
      checador: Checador,
      chofer: Chofer,
      camion: Camion,
      ubicacion: Ubicacion,
    }[tipo];
    const entidad = await manager.getRepository(target).findOneBy({ id });
    if (!entidad)
      throw new NotFoundException(
        `Registro ${tipo} con id ${id} no encontrado`,
      );
    return entidad;
  }

  private tipo(valor: string): TipoEntidadSuspension {
    if (
      !Object.values(TipoEntidadSuspension).includes(
        valor as TipoEntidadSuspension,
      )
    )
      throw new BadRequestException('Tipo de suspensión no válido');
    return valor as TipoEntidadSuspension;
  }

  private columna(tipo: TipoEntidadSuspension): string {
    return `${tipo}_id`;
  }
  private entidadId(s: Suspension, tipo: TipoEntidadSuspension): number {
    const entidad = {
      checador: s.checador,
      chofer: s.chofer,
      camion: s.camion,
      ubicacion: s.ubicacion,
    }[tipo];
    return entidad!.id;
  }
  private hoy(fecha: Date): string {
    const compacta = formatearFechaOperativa(fecha);
    return `${compacta.slice(0, 4)}-${compacta.slice(4, 6)}-${compacta.slice(6)}`;
  }
  private resumen(s: Suspension): SuspensionResumen {
    return {
      id: s.id,
      motivo: s.motivo,
      observaciones: s.observaciones,
      fecha_inicio: s.fecha_inicio,
      fecha_fin: s.fecha_fin,
      indefinida: s.indefinida,
    };
  }
}
