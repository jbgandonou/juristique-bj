import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('editor_notes')
export class EditorNote extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'folder_id', nullable: true })
  folderId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string; // JSON content from the editor (blocks format)

  @Column({ name: 'content_html', type: 'text', nullable: true })
  contentHtml: string; // HTML version for export

  @Column({ name: 'content_text', type: 'text', nullable: true })
  contentText: string; // Plain text version for search

  @Column({ name: 'is_pinned', default: false })
  isPinned: boolean;

  @Column({ nullable: true })
  icon: string; // emoji icon for the note
}
