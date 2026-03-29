import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalText } from '../../legal-texts/entities/legal-text.entity';

export enum JobStatus {
  QUEUED = 'queued',
  SCRAPING = 'scraping',
  EXTRACTING = 'extracting',
  ENRICHING = 'enriching',
  READY_FOR_REVIEW = 'ready_for_review',
  FAILED = 'failed',
}

@Entity('pipeline_jobs')
export class PipelineJob extends BaseEntity {
  @Column({ name: 'source_name' })
  sourceName: string;

  @Column({ name: 'source_url', nullable: true })
  sourceUrl: string;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.QUEUED })
  status: JobStatus;

  @Column({ name: 'raw_s3_key', nullable: true })
  rawS3Key: string;

  @Column({ name: 'extracted_text', type: 'text', nullable: true })
  extractedText: string;

  @Column({ name: 'ocr_method', nullable: true })
  ocrMethod: string;

  @Column({ name: 'ocr_quality', type: 'float', nullable: true })
  ocrQuality: number;

  @Column({ name: 'metadata_json', type: 'jsonb', nullable: true })
  metadataJson: Record<string, any>;

  @Column({ name: 'legal_text_id', nullable: true })
  legalTextId: string;

  @ManyToOne(() => LegalText, { nullable: true })
  @JoinColumn({ name: 'legal_text_id' })
  legalText: LegalText;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;
}
