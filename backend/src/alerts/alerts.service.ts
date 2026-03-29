import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly repo: Repository<Alert>,
  ) {}

  async create(userId: string, dto: CreateAlertDto): Promise<Alert> {
    const alert = this.repo.create({ ...dto, userId });
    return this.repo.save(alert);
  }

  async findByUser(userId: string): Promise<Alert[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async toggleActive(id: string, userId: string): Promise<Alert> {
    const alert = await this.repo.findOne({ where: { id, userId } });
    if (!alert) throw new NotFoundException(`Alert ${id} not found`);
    alert.isActive = !alert.isActive;
    return this.repo.save(alert);
  }

  async delete(id: string, userId: string): Promise<void> {
    const alert = await this.repo.findOne({ where: { id, userId } });
    if (!alert) throw new NotFoundException(`Alert ${id} not found`);
    await this.repo.remove(alert);
  }
}
