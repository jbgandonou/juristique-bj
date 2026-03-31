import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PipelineJob } from './pipeline-job.entity';
import { AlertType, AlertSeverity } from '../scrapers/scraper.interface';

@Entity('pipeline_alerts')
export class PipelineAlert extends BaseEntity {
  @Column({ name: 'job_id', nullable: true })
  jobId: string;

  @ManyToOne(() => PipelineJob, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'job_id' })
  job: PipelineJob;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;

  @Column({ type: 'enum', enum: AlertSeverity })
  severity: AlertSeverity;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  acknowledged: boolean;
}
