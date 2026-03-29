import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalText } from './legal-text.entity';

@Entity('text_versions')
export class TextVersion extends BaseEntity {
  @Column({ name: 'text_id' })
  textId: string;

  @ManyToOne(() => LegalText)
  @JoinColumn({ name: 'text_id' })
  text: LegalText;

  @Column()
  version: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'change_summary', type: 'text', nullable: true })
  changeSummary: string;

  @Column({ name: 'changed_by', nullable: true })
  changedBy: string;
}
