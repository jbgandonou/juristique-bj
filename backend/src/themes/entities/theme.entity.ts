import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('themes')
export class Theme extends BaseEntity {
  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ name: 'text_count', default: 0 })
  textCount: number;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToOne(() => Theme, (theme) => theme.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Theme;

  @OneToMany(() => Theme, (theme) => theme.parent)
  children: Theme[];
}
