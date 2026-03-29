import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalText } from '../../legal-texts/entities/legal-text.entity';

@Entity('annotations')
export class Annotation extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'text_id' })
  textId: string;

  @ManyToOne(() => LegalText)
  @JoinColumn({ name: 'text_id' })
  text: LegalText;

  @Column({ name: 'article_ref', nullable: true })
  articleRef: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  sticker: string; // emoji sticker e.g. '⚠️', '✅', '📌', '🔥', '💡', '❓'

  @Column({ name: 'label', nullable: true })
  label: string; // 'urgent', 'a_relire', 'important', 'en_cours', 'termine', 'question'

  @Column({ name: 'is_private', default: true })
  isPrivate: boolean;

  @Column({ name: 'folder_id', nullable: true })
  folderId: string;
}
