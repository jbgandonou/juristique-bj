import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalText } from '../../legal-texts/entities/legal-text.entity';

@Entity('reminders')
export class Reminder extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'remind_at', type: 'timestamp' })
  remindAt: Date;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ name: 'is_sent', default: false })
  isSent: boolean;

  @Column({ name: 'text_id', nullable: true })
  textId: string;

  @ManyToOne(() => LegalText, { nullable: true })
  @JoinColumn({ name: 'text_id' })
  text: LegalText;

  @Column({ name: 'folder_id', nullable: true })
  folderId: string;

  @Column({ name: 'annotation_id', nullable: true })
  annotationId: string;

  @Column({ nullable: true })
  label: string; // 'urgent', 'a_relire', etc — same labels as annotations

  @Column({ nullable: true })
  sticker: string; // emoji
}
