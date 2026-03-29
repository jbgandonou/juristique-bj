import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalText } from '../../legal-texts/entities/legal-text.entity';

@Entity('sticky_notes')
export class StickyNote extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: '#FFF9C4' })
  color: string; // Yellow, pink, green, blue, orange, purple

  @Column({ name: 'text_id', nullable: true })
  textId: string;

  @ManyToOne(() => LegalText, { nullable: true })
  @JoinColumn({ name: 'text_id' })
  text: LegalText;

  @Column({ name: 'folder_id', nullable: true })
  folderId: string;

  @Column({ name: 'is_pinned', default: false })
  isPinned: boolean;

  @Column({ name: 'position_x', default: 0 })
  positionX: number;

  @Column({ name: 'position_y', default: 0 })
  positionY: number;
}
