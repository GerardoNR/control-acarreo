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
import { Administrador } from '../administradores/administrador.entity';
import { Camion } from '../camiones/camion.entity';
import { Checador } from '../checadores/checador.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Material } from '../materiales/material.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Ubicacion } from '../ubicaciones/ubicacion.entity';
import { EstadoViaje } from './enums/estado-viaje.enum';

@Index('IDX_viajes_camion_estado', ['camion', 'estado'])
@Index('IDX_viajes_proyecto', ['proyecto'])
@Index('IDX_viajes_estado', ['estado'])
@Index('UQ_viajes_camion_en_transito', ['camion'], {
  unique: true,
  where: `"estado" = 'en_transito'`,
})
@Check(
  'CHK_viajes_ubicaciones_diferentes',
  'ubicacion_origen_id <> ubicacion_destino_id',
)
@Check('CHK_viajes_cantidad_salida_positiva', 'cantidad_salida > 0')
@Check(
  'CHK_viajes_cantidad_llegada_positiva',
  'cantidad_llegada IS NULL OR cantidad_llegada > 0',
)
@Check(
  'CHK_viajes_fecha_llegada_posterior',
  'fecha_hora_llegada IS NULL OR fecha_hora_llegada > fecha_hora_salida',
)
@Entity({ name: 'viajes' })
export class Viaje {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Identificador integer anterior, conservado para trazabilidad histórica.
  @Column({ type: 'integer', nullable: true, unique: true })
  id_legacy: number | null;

  @Index('IDX_viajes_folio')
  @Column({ type: 'varchar', length: 19, unique: true })
  folio: string;

  @ManyToOne(() => Proyecto, { nullable: false })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @ManyToOne(() => Camion, { nullable: false })
  @JoinColumn({ name: 'camion_id' })
  camion: Camion;

  @ManyToOne(() => Chofer, { nullable: false })
  @JoinColumn({ name: 'chofer_id' })
  chofer: Chofer;

  @ManyToOne(() => Material, { nullable: false })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @ManyToOne(() => Ubicacion, { nullable: false })
  @JoinColumn({ name: 'ubicacion_origen_id' })
  ubicacion_origen: Ubicacion;

  @ManyToOne(() => Ubicacion, { nullable: false })
  @JoinColumn({ name: 'ubicacion_destino_id' })
  ubicacion_destino: Ubicacion;

  @ManyToOne(() => Checador, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'checador_salida_id' })
  checador_salida: Checador;

  @ManyToOne(() => Checador, { nullable: true })
  @JoinColumn({ name: 'checador_llegada_id' })
  checador_llegada: Checador | null;

  @ManyToOne(() => Administrador, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'administrador_cancelacion_id' })
  administrador_cancelacion: Administrador | null;

  @ManyToOne(() => Checador, { nullable: true })
  @JoinColumn({ name: 'checador_origen_id' })
  checador_origen: Checador | null;

  @ManyToOne(() => Checador, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'checador_destino_id' })
  checador_destino: Checador | null;

  @Column({ type: 'numeric', precision: 12, scale: 3 })
  cantidad_salida: string;

  @Column({ type: 'numeric', precision: 12, scale: 3, nullable: true })
  cantidad_llegada: string | null;

  @Column({ type: 'varchar' })
  unidad_medida: string;

  @Index('IDX_viajes_fecha_hora_salida')
  @Column({ type: 'timestamptz' })
  fecha_hora_salida: Date;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_hora_llegada: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_hora_cancelacion: Date | null;

  @Column({
    type: 'enum',
    enum: EstadoViaje,
    enumName: 'viajes_estado_enum',
    default: EstadoViaje.EN_TRANSITO,
  })
  estado: EstadoViaje;

  @Column({ type: 'text', nullable: true })
  observaciones_salida: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones_llegada: string | null;

  @Column({ type: 'text', nullable: true })
  motivo_cancelacion: string | null;

  // Campos del modelo anterior conservados por compatibilidad e historial.
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  cantidad_m3: string | null;

  @Column({ type: 'varchar', nullable: true })
  folio_banco: string | null;

  @Column({ type: 'timestamp', nullable: true })
  fecha_hora_origen: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  fecha_hora_destino: Date | null;

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
