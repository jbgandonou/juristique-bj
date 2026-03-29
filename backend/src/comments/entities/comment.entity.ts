import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalText } from '../../legal-texts/entities/legal-text.entity';

export enum CommentType {
  COMMENT = 'comment',
  ANALYSIS = 'analysis',
  ANNOTATION = 'annotation',
}

@Entity('comments')
export class Comment extends BaseEntity {
  @Column({ name: 'text_id' })
  textId: string;

  @ManyToOne(() => LegalText)
  @JoinColumn({ name: 'text_id' })
  text: LegalText;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: CommentType, default: CommentType.COMMENT })
  type: CommentType;

  @Column({ name: 'article_ref', nullable: true })
  articleRef: string;

  @Column({ default: 0 })
  upvotes: number;

  @Column({ name: 'is_flagged', default: false })
  isFlagged: boolean;
}
