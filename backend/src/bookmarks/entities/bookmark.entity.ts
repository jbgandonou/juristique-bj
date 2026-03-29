import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalText } from '../../legal-texts/entities/legal-text.entity';

@Entity('bookmarks')
export class Bookmark extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'text_id' })
  textId: string;

  @ManyToOne(() => LegalText, { eager: true })
  @JoinColumn({ name: 'text_id' })
  text: LegalText;

  @Column({ type: 'text', nullable: true })
  note: string;
}
