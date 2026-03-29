import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum AlertType { THEME = 'theme', COUNTRY = 'country', KEYWORD = 'keyword' }
export enum AlertFrequency { REALTIME = 'realtime', DAILY = 'daily', WEEKLY = 'weekly' }
export enum AlertChannel { EMAIL = 'email', PUSH = 'push', IN_APP = 'in_app' }

@Entity('alerts')
export class Alert extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'alert_type', type: 'enum', enum: AlertType })
  alertType: AlertType;

  @Column({ name: 'filter_value' })
  filterValue: string;

  @Column({ type: 'enum', enum: AlertFrequency, default: AlertFrequency.DAILY })
  frequency: AlertFrequency;

  @Column({ type: 'enum', enum: AlertChannel, default: AlertChannel.EMAIL })
  channel: AlertChannel;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
