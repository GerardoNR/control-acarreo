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
import { Proyecto } from '../proyectos/proyecto.entity';

@Index('UQ_unidades_control_proyecto_nombre', ['proyecto', 'nombre'], {
  unique: true,
})
@Index('IDX_unidades_control_proyecto_activo', ['proyecto', 'activo'])
@Entity({ name: 'unidades_control' })
export class UnidadControl {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Proyecto, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}
