import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Administrador } from '../administradores/administrador.entity';
import { Camion } from '../camiones/camion.entity';
import { Checador } from '../checadores/checador.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Ubicacion } from '../ubicaciones/ubicacion.entity';

export enum TipoEntidadSuspension {
  CHECADOR = 'checador',
  CHOFER = 'chofer',
  CAMION = 'camion',
  UBICACION = 'ubicacion',
}

@Entity({ name: 'suspensiones' })
@Check(
  'CHK_suspensiones_una_entidad',
  'num_nonnulls(checador_id, chofer_id, camion_id, ubicacion_id) = 1',
)
@Check(
  'CHK_suspensiones_fechas',
  '(indefinida = true AND fecha_fin IS NULL) OR (indefinida = false AND fecha_fin IS NOT NULL AND fecha_fin >= fecha_inicio)',
)
@Index('IDX_suspensiones_checador', ['checador'])
@Index('IDX_suspensiones_chofer', ['chofer'])
@Index('IDX_suspensiones_camion', ['camion'])
@Index('IDX_suspensiones_ubicacion', ['ubicacion'])
export class Suspension {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Checador, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'checador_id' })
  checador: Checador | null;

  @ManyToOne(() => Chofer, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'chofer_id' })
  chofer: Chofer | null;

  @ManyToOne(() => Camion, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'camion_id' })
  camion: Camion | null;

  @ManyToOne(() => Ubicacion, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ubicacion_id' })
  ubicacion: Ubicacion | null;

  @Column({ type: 'varchar', length: 80 })
  motivo: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ type: 'date' })
  fecha_inicio: string;

  @Column({ type: 'date', nullable: true })
  fecha_fin: string | null;

  @Column({ type: 'boolean', default: false })
  indefinida: boolean;

  @ManyToOne(() => Administrador, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creada_por_id' })
  creada_por: Administrador;

  @CreateDateColumn({ type: 'timestamptz' })
  creada_en: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finalizada_at: Date | null;

  @ManyToOne(() => Administrador, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'finalizada_por_id' })
  finalizada_por: Administrador | null;
}
