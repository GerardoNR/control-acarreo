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
import { Material } from '../materiales/material.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Ubicacion } from '../ubicaciones/ubicacion.entity';
import { RutaAcarreo } from '../rutas-acarreo/ruta-acarreo.entity';
import { Tarifa } from '../tarifas/tarifa.entity';
import { UnidadControl } from '../unidades-control/unidad-control.entity';

export enum EstadoOrdenAcarreo {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

@Entity({ name: 'ordenes_acarreo' })
export class OrdenAcarreo {
  @PrimaryGeneratedColumn() id: number;
  @Index('UQ_ordenes_acarreo_folio', { unique: true })
  @Column({ type: 'varchar', length: 19 })
  folio: string;
  @ManyToOne(() => Proyecto, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;
  @ManyToOne(() => Material, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'material_id' })
  material: Material;
  @ManyToOne(() => Ubicacion, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ubicacion_origen_id' })
  ubicacion_origen: Ubicacion;
  @ManyToOne(() => Ubicacion, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ubicacion_destino_id' })
  ubicacion_destino: Ubicacion;
  @ManyToOne(() => RutaAcarreo, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ruta_acarreo_id' })
  ruta_acarreo: RutaAcarreo | null;
  @ManyToOne(() => UnidadControl, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unidad_control_id' })
  unidad_control: UnidadControl | null;
  @ManyToOne(() => Tarifa, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tarifa_id' })
  tarifa: Tarifa | null;
  @Column({ type: 'numeric', precision: 12, scale: 3 })
  cantidad_solicitada: string;
  @Column({ type: 'varchar' }) unidad_medida: string;
  @Column({ type: 'date' }) fecha_inicio: string;
  @Column({ type: 'date', nullable: true }) fecha_fin: string | null;
  @Column({
    type: 'enum',
    enum: EstadoOrdenAcarreo,
    enumName: 'ordenes_acarreo_estado_enum',
    default: EstadoOrdenAcarreo.PENDIENTE,
  })
  estado: EstadoOrdenAcarreo;
  @Column({ type: 'text', nullable: true }) observaciones: string | null;
  @CreateDateColumn({ type: 'timestamp' }) creado_en: Date;
  @UpdateDateColumn({ type: 'timestamp' }) actualizado_en: Date;
}
