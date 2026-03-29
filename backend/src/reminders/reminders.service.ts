import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Reminder } from './entities/reminder.entity';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private readonly repo: Repository<Reminder>,
  ) {}

  async create(userId: string, dto: CreateReminderDto): Promise<Reminder> {
    const reminder = this.repo.create({ ...dto, userId });
    return this.repo.save(reminder);
  }

  async findAll(userId: string): Promise<Reminder[]> {
    return this.repo.find({
      where: { userId },
      relations: ['text'],
      order: { remindAt: 'ASC' },
    });
  }

  async findUpcoming(userId: string): Promise<Reminder[]> {
    return this.repo.find({
      where: { userId, isCompleted: false },
      relations: ['text'],
      order: { remindAt: 'ASC' },
    });
  }

  async findDue(): Promise<Reminder[]> {
    return this.repo.find({
      where: {
        isCompleted: false,
        isSent: false,
        remindAt: LessThanOrEqual(new Date()),
      },
      relations: ['text'],
    });
  }

  async markCompleted(id: string, userId: string): Promise<Reminder> {
    const reminder = await this.repo.findOne({ where: { id, userId } });
    if (!reminder) throw new NotFoundException('Reminder not found');
    reminder.isCompleted = true;
    return this.repo.save(reminder);
  }

  async markSent(id: string): Promise<void> {
    await this.repo.update(id, { isSent: true });
  }

  async update(id: string, userId: string, data: Partial<CreateReminderDto>): Promise<Reminder> {
    const reminder = await this.repo.findOne({ where: { id, userId } });
    if (!reminder) throw new NotFoundException('Reminder not found');
    Object.assign(reminder, data);
    return this.repo.save(reminder);
  }

  async delete(id: string, userId: string): Promise<void> {
    const reminder = await this.repo.findOne({ where: { id, userId } });
    if (!reminder) throw new NotFoundException('Reminder not found');
    await this.repo.remove(reminder);
  }
}
