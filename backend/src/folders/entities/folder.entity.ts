import { Entity, Column, ManyToOne, OneToMany, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalText } from '../../legal-texts/entities/legal-text.entity';

@Entity('folders')
export class Folder extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  color: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ name: 'is_shared', default: false })
  isShared: boolean;

  @ManyToMany(() => LegalText)
  @JoinTable({
    name: 'folder_texts',
    joinColumn: { name: 'folder_id' },
    inverseJoinColumn: { name: 'text_id' },
  })
  texts: LegalText[];

  @OneToMany(() => FolderShare, share => share.folder)
  shares: FolderShare[];
}

@Entity('folder_shares')
export class FolderShare extends BaseEntity {
  @Column({ name: 'folder_id' })
  folderId: string;

  @ManyToOne(() => Folder, folder => folder.shares)
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;

  @Column({ name: 'shared_with_id' })
  sharedWithId: string;

  @Column({ name: 'permission', default: 'read' })
  permission: string; // 'read', 'comment', 'edit'
}
