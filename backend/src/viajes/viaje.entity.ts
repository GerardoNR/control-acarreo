import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Camion } from '../camiones/camion.entity';
import { Checador } from '../checadores/checador.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Material } from '../materiales/material.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Ubicacion } from '../ubicaciones/ubicacion.entity';

export enum EstadoViaje {
  EN_TRANSITO = 'en_transito',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado',
}

@Index('IDX_viajes_camion_estado', ['camion', 'estado'])
@Entity({ name: 'viajes' })
export class Viaje {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_viajes_folio')
  @Column({ type: 'varchar', unique: true })
  folio: string;

  @ManyToOne(() => Proyecto, { nullable: false })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @ManyToOne(() => Camion, { nullable: false })
  @JoinColumn({ name: 'camion_id' })
  camion: Camion;

  @ManyToOne(() => Chofer, { nullable: true })
  @JoinColumn({ name: 'chofer_id' })
  chofer: Chofer | null;

  @ManyToOne(() => Material, { nullable: false })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @ManyToOne(() => Ubicacion, { nullable: false })
  @JoinColumn({ name: 'ubicacion_origen_id' })
  ubicacion_origen: Ubicacion;

  @ManyToOne(() => Ubicacion, { nullable: false })
  @JoinColumn({ name: 'ubicacion_destino_id' })
  ubicacion_destino: Ubicacion;

  @ManyToOne(() => Checador, { nullable: false })
  @JoinColumn({ name: 'checador_origen_id' })
  checador_origen: Checador;

  @ManyToOne(() => Checador, { nullable: true })
  @JoinColumn({ name: 'checador_destino_id' })
  checador_destino: Checador | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad_m3: string;

  @Column({ type: 'varchar', nullable: true })
  folio_banco: string | null;

  @Index('IDX_viajes_fecha_hora_origen')
  @Column({ type: 'timestamp' })
  fecha_hora_origen: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_hora_destino: Date | null;

  @Index('IDX_viajes_estado')
  @Column({
    type: 'enum',
    enum: EstadoViaje,
    default: EstadoViaje.EN_TRANSITO,
  })
  estado: EstadoViaje;

  @Column({ type: 'text', nullable: true })
  nota: string | null;

  @Column({ type: 'boolean', default: false })
  impreso: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fecha_impresion: Date | null;

  @Column({ type: 'varchar', nullable: true })
  dispositivo_origen_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  dispositivo_destino_id: string | null;

  @Column({ type: 'boolean', default: false })
  sincronizado: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  actualizado_en: Date;
}
