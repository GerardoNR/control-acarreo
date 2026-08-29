import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'camiones' })
export class Camion {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_camiones_placas')
  @Column({ type: 'varchar', unique: true })
  placas: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  numero_economico: string | null;

  @Column({ type: 'char', length: 5, nullable: true, unique: true })
  codigo_ticket_unidad: string | null;

  @Index('IDX_camiones_nfc_tag_uid')
  @Column({ type: 'varchar', unique: true })
  nfc_tag_uid: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  capacidad_m3: string;

  @Column({ type: 'varchar', nullable: true })
  tipo_camion: string | null;

  @Column({ type: 'varchar', nullable: true })
  marca: string | null;

  @Column({ type: 'varchar', nullable: true })
  modelo: string | null;

  @Column({ type: 'integer', nullable: true })
  anio: number | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  @Column({ type: 'boolean', nullable: true })
  activo_antes_papelera: boolean | null;

  @CreateDateColumn({ type: 'timestamp' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  actualizado_en: Date;
}
