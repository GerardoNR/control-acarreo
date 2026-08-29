import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tarifa } from '../tarifas/tarifa.entity';
import { Viaje } from '../viajes/viaje.entity';
import { Estimacion } from './estimacion.entity';

@Index('UQ_estimacion_detalles_viaje', ['viaje'], { unique: true })
@Entity({ name: 'estimacion_detalles' })
export class EstimacionDetalle {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Estimacion, (estimacion) => estimacion.detalles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'estimacion_id' })
  estimacion: Estimacion;
  @ManyToOne(() => Viaje, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'viaje_id' })
  viaje: Viaje;
  @ManyToOne(() => Tarifa, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tarifa_id' })
  tarifa: Tarifa;
  @Column({ type: 'numeric', precision: 12, scale: 3 }) cantidad: string;
  @Column({ type: 'varchar' }) unidad_medida: string;
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  precio_unitario_aplicado: string;
  @Column({ type: 'numeric', precision: 14, scale: 2 }) importe: string;
}
