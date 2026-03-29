import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('source_configs')
export class SourceConfig extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'scraper_type' })
  scraperType: string;

  @Column({ name: 'base_url' })
  baseUrl: string;

  @Column({ default: 'daily' })
  schedule: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_run_at', type: 'timestamp', nullable: true })
  lastRunAt: Date;

  @Column({ name: 'last_success_at', type: 'timestamp', nullable: true })
  lastSuccessAt: Date;

  @Column({ name: 'config_json', type: 'jsonb', nullable: true })
  configJson: Record<string, any>;
}
