import {
  Entity, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn, Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Country } from '../../countries/entities/country.entity';
import { Theme } from '../../themes/entities/theme.entity';

export enum TextType {
  CONSTITUTION = 'constitution',
  LOI_ORGANIQUE = 'loi_organique',
  LOI = 'loi',
  ORDONNANCE = 'ordonnance',
  DECRET = 'decret',
  ARRETE = 'arrete',
  TRAITE = 'traite',
  ACTE_UNIFORME = 'acte_uniforme',
  JURISPRUDENCE = 'jurisprudence',
}

export enum TextStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  VERIFIED = 'verified',
  PUBLISHED = 'published',
}

@Entity('legal_texts')
export class LegalText extends BaseEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ name: 'text_type', type: 'enum', enum: TextType })
  textType: TextType;

  @Column({ name: 'hierarchy_rank', default: 5 })
  hierarchyRank: number;

  @Column({ name: 'content_text', type: 'text', nullable: true })
  contentText: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ name: 'promulgation_date', type: 'date', nullable: true })
  promulgationDate: Date;

  @Column({ name: 'publication_date', type: 'date', nullable: true })
  publicationDate: Date;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate: Date;

  @Column({ type: 'enum', enum: TextStatus, default: TextStatus.DRAFT })
  status: TextStatus;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verified_by', nullable: true })
  verifiedBy: string;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ name: 'source_url', nullable: true })
  sourceUrl: string;

  @Column({ name: 'source_name', nullable: true })
  sourceName: string;

  @Column({ name: 'pdf_s3_key', nullable: true })
  pdfS3Key: string;

  @Column({ name: 'ocr_quality', type: 'float', nullable: true })
  ocrQuality: number;

  @Column({ default: 1 })
  version: number;

  @Column({ name: 'parent_text_id', nullable: true })
  parentTextId: string;

  @ManyToOne(() => LegalText, { nullable: true })
  @JoinColumn({ name: 'parent_text_id' })
  parentText: LegalText;

  @Column({ name: 'replaces_id', nullable: true })
  replacesId: string;

  @ManyToOne(() => LegalText, { nullable: true })
  @JoinColumn({ name: 'replaces_id' })
  replaces: LegalText;

  @Column({ name: 'is_in_force', default: true })
  isInForce: boolean;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'country_id' })
  countryId: string;

  @ManyToOne(() => Country, { eager: true })
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @ManyToMany(() => Theme)
  @JoinTable({
    name: 'text_themes',
    joinColumn: { name: 'text_id' },
    inverseJoinColumn: { name: 'theme_id' },
  })
  themes: Theme[];
}
