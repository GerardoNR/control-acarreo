import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum UsuarioTipoAuditoria {
  ADMINISTRADOR = 'administrador',
  CHECADOR = 'checador',
  SISTEMA = 'sistema',
}

@Entity({ name: 'auditoria' })
export class Auditoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: UsuarioTipoAuditoria })
  usuario_tipo: UsuarioTipoAuditoria;

  @Column({ type: 'bigint', nullable: true })
  usuario_id: string | null;

  @Column({ type: 'varchar' })
  accion: string;

  @Column({ type: 'varchar' })
  entidad: string;

  @Column({ type: 'bigint', nullable: true })
  entidad_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  valor_anterior: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  valor_nuevo: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamp' })
  fecha: Date;
}
