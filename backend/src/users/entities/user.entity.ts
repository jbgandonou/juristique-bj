import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Country } from '../../countries/entities/country.entity';
import { Exclude } from 'class-transformer';

export enum UserRole {
  FREE = 'free',
  PREMIUM = 'premium',
  EDITOR = 'editor',
  ADMIN = 'admin',
}

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column()
  email: string;

  @Exclude()
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.FREE })
  role: UserRole;

  @Column({ nullable: true })
  profession: string;

  @Column({ name: 'country_id', nullable: true })
  countryId: string;

  @ManyToOne(() => Country, { nullable: true, eager: true })
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @Column({ name: 'bar_number', nullable: true })
  barNumber: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;
}
