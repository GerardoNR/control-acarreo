import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { EstimacionDetalle } from './estimacion-detalle.entity';
import { PagoEstimacion } from './pago-estimacion.entity';

export enum EstadoEstimacion {
  BORRADOR = 'BORRADOR',
  CERRADA = 'CERRADA',
  FACTURADA = 'FACTURADA',
  PAGADA = 'PAGADA',
  CANCELADA = 'CANCELADA',
}

@Entity({ name: 'estimaciones' })
export class Estimacion {
  @PrimaryGeneratedColumn() id: number;
  @Index('UQ_estimaciones_folio', { unique: true })
  @Column({ type: 'varchar', length: 19 })
  folio: string;
  @ManyToOne(() => Proyecto, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;
  @Column({ type: 'date' }) fecha_desde: string;
  @Column({ type: 'date' }) fecha_hasta: string;
  @Column({
    type: 'enum',
    enum: EstadoEstimacion,
    enumName: 'estimaciones_estado_enum',
    default: EstadoEstimacion.BORRADOR,
  })
  estado: EstadoEstimacion;
  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  importe_facturado: string | null;
  @Column({ type: 'date', nullable: true }) fecha_facturacion: string | null;
  @Column({ type: 'varchar', nullable: true }) referencia_factura:
    string | null;
  @Column({ type: 'text', nullable: true }) observaciones: string | null;
  @OneToMany(() => EstimacionDetalle, (detalle) => detalle.estimacion)
  detalles: EstimacionDetalle[];
  @OneToMany(() => PagoEstimacion, (pago) => pago.estimacion)
  pagos: PagoEstimacion[];
  @CreateDateColumn({ type: 'timestamp' }) creado_en: Date;
  @UpdateDateColumn({ type: 'timestamp' }) actualizado_en: Date;
}
