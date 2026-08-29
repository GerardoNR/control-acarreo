import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Ubicacion } from '../ubicaciones/ubicacion.entity';

@Index(
  'UQ_rutas_acarreo_proyecto_clave_vigencia',
  ['proyecto', 'clave', 'vigente_desde'],
  { unique: true },
)
@Index('IDX_rutas_acarreo_busqueda', [
  'proyecto',
  'ubicacion_origen',
  'ubicacion_destino',
  'activo',
])
@Check(
  'CHK_rutas_acarreo_ubicaciones_diferentes',
  'ubicacion_origen_id <> ubicacion_destino_id',
)
@Check(
  'CHK_rutas_acarreo_distancias',
  'distancia_pavimento >= 0 AND distancia_total >= distancia_pavimento',
)
@Check(
  'CHK_rutas_acarreo_vigencia',
  'vigente_hasta IS NULL OR vigente_hasta >= vigente_desde',
)
@Entity({ name: 'rutas_acarreo' })
export class RutaAcarreo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Proyecto, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @Column({ type: 'varchar', length: 50 })
  clave: string;

  @ManyToOne(() => Ubicacion, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ubicacion_origen_id' })
  ubicacion_origen: Ubicacion;

  @ManyToOne(() => Ubicacion, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ubicacion_destino_id' })
  ubicacion_destino: Ubicacion;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 3 })
  distancia_pavimento: string;

  @Column({ type: 'numeric', precision: 10, scale: 3 })
  distancia_total: string;

  @Column({ type: 'date' })
  vigente_desde: string;

  @Column({ type: 'date', nullable: true })
  vigente_hasta: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}
