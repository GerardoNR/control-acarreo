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

export enum TipoCobroTarifa {
  POR_VOLUMEN = 'POR_VOLUMEN',
  POR_VIAJE = 'POR_VIAJE',
  POR_DISTANCIA_ESCALONADA = 'POR_DISTANCIA_ESCALONADA',
}

@Index('IDX_tarifas_busqueda', [
  'proyecto',
  'material',
  'ubicacion_origen',
  'ubicacion_destino',
  'ruta_acarreo',
  'tipo_cobro',
  'activo',
])
@Entity({ name: 'tarifas' })
export class Tarifa {
  @PrimaryGeneratedColumn() id: number;
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
  @Column({
    type: 'enum',
    enum: TipoCobroTarifa,
    enumName: 'tarifas_tipo_cobro_enum',
    default: TipoCobroTarifa.POR_VOLUMEN,
  })
  tipo_cobro: TipoCobroTarifa;
  @Column({ type: 'varchar' }) unidad_medida: string;
  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: true })
  precio_unitario: string | null;
  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: true })
  precio_primer_km: string | null;
  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: true })
  precio_km_subsecuente: string | null;
  @Column({ type: 'date' }) vigente_desde: string;
  @Column({ type: 'date', nullable: true }) vigente_hasta: string | null;
  @Column({ type: 'boolean', default: true }) activo: boolean;
  @CreateDateColumn({ type: 'timestamp' }) creado_en: Date;
  @UpdateDateColumn({ type: 'timestamp' }) actualizado_en: Date;
}
