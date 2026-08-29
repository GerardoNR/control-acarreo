import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Administrador } from '../administradores/administrador.entity';
import { Viaje } from '../viajes/viaje.entity';

export enum TipoIncidenciaViaje {
  DESTINO_DIFERENTE = 'DESTINO_DIFERENTE',
  MATERIAL_SALIDA_DIFERENTE = 'MATERIAL_SALIDA_DIFERENTE',
  MATERIAL_DESTINO_DIFERENTE = 'MATERIAL_DESTINO_DIFERENTE',
  MISMO_CHECADOR = 'MISMO_CHECADOR',
  ORIGEN_NO_CONCILIADO = 'ORIGEN_NO_CONCILIADO',
  DESTINO_NO_CONCILIADO = 'DESTINO_NO_CONCILIADO',
  RUTA_NO_CONFIGURADA = 'RUTA_NO_CONFIGURADA',
  TARIFA_NO_CONFIGURADA = 'TARIFA_NO_CONFIGURADA',
}

export enum OrigenIncidenciaViaje {
  AUTOMATICA = 'AUTOMATICA',
  MANUAL = 'MANUAL',
}

@Index('IDX_incidencias_viaje_viaje', ['viaje'])
@Index('IDX_incidencias_viaje_tipo_activa', ['tipo', 'activa'])
@Index('UQ_incidencias_viaje_automatica_activa', ['viaje', 'tipo'], {
  unique: true,
  where: `"origen" = 'AUTOMATICA' AND "activa" = true`,
})
@Entity({ name: 'incidencias_viaje' })
export class IncidenciaViaje {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @ManyToOne(() => Viaje, (viaje) => viaje.incidencias, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'viaje_id' })
  viaje: Viaje;

  @Column({
    type: 'enum',
    enum: TipoIncidenciaViaje,
    enumName: 'incidencias_viaje_tipo_enum',
  })
  tipo: TipoIncidenciaViaje;

  @Column({
    type: 'enum',
    enum: OrigenIncidenciaViaje,
    enumName: 'incidencias_viaje_origen_enum',
    default: OrigenIncidenciaViaje.AUTOMATICA,
  })
  origen: OrigenIncidenciaViaje;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'jsonb', nullable: true })
  datos: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  resuelta_en: Date | null;

  @ManyToOne(() => Administrador, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'resuelta_por_id' })
  resuelta_por: Administrador | null;

  @Column({ type: 'text', nullable: true })
  observacion_resolucion: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  detectada_en: Date;
}
