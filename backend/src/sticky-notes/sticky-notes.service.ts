import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StickyNote } from './entities/sticky-note.entity';
import { CreateStickyNoteDto } from './dto/create-sticky-note.dto';

@Injectable()
export class StickyNotesService {
  constructor(
    @InjectRepository(StickyNote)
    private readonly repo: Repository<StickyNote>,
  ) {}

  async create(userId: string, dto: CreateStickyNoteDto): Promise<StickyNote> {
    const note = this.repo.create({ ...dto, userId });
    return this.repo.save(note);
  }

  async findAll(userId: string): Promise<StickyNote[]> {
    return this.repo.find({
      where: { userId },
      order: { isPinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async findByText(textId: string, userId: string): Promise<StickyNote[]> {
    return this.repo.find({
      where: { textId, userId },
      order: { isPinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async findByFolder(folderId: string, userId: string): Promise<StickyNote[]> {
    return this.repo.find({
      where: { folderId, userId },
      order: { isPinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Pick<StickyNote, 'content' | 'color' | 'isPinned' | 'positionX' | 'positionY'>>,
  ): Promise<StickyNote> {
    const note = await this.repo.findOne({ where: { id, userId } });
    if (!note) throw new NotFoundException('Sticky note not found');
    if (data.content !== undefined) note.content = data.content;
    if (data.color !== undefined) note.color = data.color;
    if (data.isPinned !== undefined) note.isPinned = data.isPinned;
    if (data.positionX !== undefined) note.positionX = data.positionX;
    if (data.positionY !== undefined) note.positionY = data.positionY;
    return this.repo.save(note);
  }

  async delete(id: string, userId: string): Promise<void> {
    const note = await this.repo.findOne({ where: { id, userId } });
    if (!note) throw new NotFoundException('Sticky note not found');
    await this.repo.remove(note);
  }
}
