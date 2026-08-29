import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Estimacion } from './estimacion.entity';

@Entity({ name: 'pagos_estimaciones' })
export class PagoEstimacion {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Estimacion, (estimacion) => estimacion.pagos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'estimacion_id' })
  estimacion: Estimacion;
  @Column({ type: 'date' }) fecha: string;
  @Column({ type: 'numeric', precision: 14, scale: 2 }) importe: string;
  @Column({ type: 'varchar', nullable: true }) referencia: string | null;
  @Column({ type: 'text', nullable: true }) observaciones: string | null;
  @CreateDateColumn({ type: 'timestamp' }) creado_en: Date;
}
