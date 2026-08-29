import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Viaje } from '../viajes/viaje.entity';

@Check('CHK_tickets_codigo_formato', "codigo_ticket ~ '^[0-9]{21}$'")
@Check('CHK_tickets_reimpresiones', 'cantidad_reimpresiones >= 0')
@Entity({ name: 'tickets' })
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Viaje, (viaje) => viaje.ticket, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'viaje_id' })
  viaje: Viaje;

  @Column({ type: 'varchar', length: 21, unique: true, update: false })
  codigo_ticket: string;

  @Column({ type: 'timestamptz', update: false })
  fecha_generacion: Date;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_primera_impresion: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_ultima_impresion: Date | null;

  @Column({ type: 'integer', default: 0 })
  cantidad_reimpresiones: number;

  @Column({ type: 'varchar', nullable: true, update: false })
  dispositivo_emisor_id: string | null;

  @CreateDateColumn({ type: 'timestamptz', update: false })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}
