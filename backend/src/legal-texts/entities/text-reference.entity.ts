import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { LegalText } from './legal-text.entity';

export enum ReferenceType {
  CITE = 'cite',
  MODIFIE = 'modifie',
  ABROGE = 'abroge',
  APPLIQUE = 'applique',
}

@Entity('text_references')
export class TextReference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source_text_id' })
  sourceTextId: string;

  @ManyToOne(() => LegalText)
  @JoinColumn({ name: 'source_text_id' })
  sourceText: LegalText;

  @Column({ name: 'target_text_id' })
  targetTextId: string;

  @ManyToOne(() => LegalText)
  @JoinColumn({ name: 'target_text_id' })
  targetText: LegalText;

  @Column({ name: 'ref_type', type: 'enum', enum: ReferenceType })
  refType: ReferenceType;
}
