import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Auditoria, UsuarioTipoAuditoria } from './auditoria.entity';

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
  ) {}

  registrar(params: {
    usuario?: AuthUser;
    accion: string;
    entidad: string;
    entidadId?: number | string;
    valorAnterior?: Record<string, unknown>;
    valorNuevo?: Record<string, unknown>;
  }): Promise<Auditoria> {
    return this.auditoriaRepository.save(
      this.auditoriaRepository.create({
        usuario_tipo: params.usuario
          ? UsuarioTipoAuditoria.ADMINISTRADOR
          : UsuarioTipoAuditoria.SISTEMA,
        usuario_id: params.usuario?.id.toString() ?? null,
        accion: params.accion,
        entidad: params.entidad,
        entidad_id: params.entidadId?.toString() ?? null,
        valor_anterior: params.valorAnterior ?? null,
        valor_nuevo: params.valorNuevo ?? null,
      }),
    );
  }
}
