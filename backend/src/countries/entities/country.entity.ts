import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('countries')
export class Country extends BaseEntity {
  @Column()
  name: string;

  @Index({ unique: true })
  @Column({ type: 'char', length: 2 })
  code: string;

  @Column({ name: 'flag_url', nullable: true })
  flagUrl: string;

  @Column({ nullable: true })
  region: string;

  @Column({ name: 'legal_system', nullable: true })
  legalSystem: string;

  @Column({ name: 'official_lang', default: 'Français' })
  officialLang: string;
}
