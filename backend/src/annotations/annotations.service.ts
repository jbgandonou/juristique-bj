import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Annotation } from './entities/annotation.entity';
import { CreateAnnotationDto } from './dto/create-annotation.dto';

@Injectable()
export class AnnotationsService {
  constructor(
    @InjectRepository(Annotation)
    private readonly repo: Repository<Annotation>,
  ) {}

  async create(userId: string, dto: CreateAnnotationDto): Promise<Annotation> {
    const annotation = this.repo.create({ ...dto, userId, isPrivate: true });
    return this.repo.save(annotation);
  }

  async findByText(textId: string, userId: string): Promise<Annotation[]> {
    return this.repo.find({
      where: { textId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByFolder(folderId: string, userId: string): Promise<Annotation[]> {
    return this.repo.find({
      where: { folderId, userId },
      relations: ['text'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(userId: string): Promise<Annotation[]> {
    return this.repo.find({
      where: { userId },
      relations: ['text'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, userId: string, data: { content?: string; sticker?: string; label?: string }): Promise<Annotation> {
    const annotation = await this.repo.findOne({ where: { id, userId } });
    if (!annotation) throw new NotFoundException('Annotation not found');
    if (data.content !== undefined) annotation.content = data.content;
    if (data.sticker !== undefined) annotation.sticker = data.sticker;
    if (data.label !== undefined) annotation.label = data.label;
    return this.repo.save(annotation);
  }

  async delete(id: string, userId: string): Promise<void> {
    const annotation = await this.repo.findOne({ where: { id, userId } });
    if (!annotation) throw new NotFoundException('Annotation not found');
    await this.repo.remove(annotation);
  }
}
