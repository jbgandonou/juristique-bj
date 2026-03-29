import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EditorNote } from './entities/editor-note.entity';
import { CreateEditorNoteDto } from './dto/create-editor-note.dto';

@Injectable()
export class EditorNotesService {
  constructor(
    @InjectRepository(EditorNote)
    private readonly repo: Repository<EditorNote>,
  ) {}

  async create(userId: string, dto: CreateEditorNoteDto): Promise<EditorNote> {
    const note = this.repo.create({ ...dto, userId });
    return this.repo.save(note);
  }

  async findAll(userId: string): Promise<EditorNote[]> {
    return this.repo.find({
      where: { userId },
      order: { isPinned: 'DESC', updatedAt: 'DESC' },
    });
  }

  async findByFolder(folderId: string, userId: string): Promise<EditorNote[]> {
    return this.repo.find({
      where: { folderId, userId },
      order: { isPinned: 'DESC', updatedAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<EditorNote> {
    const note = await this.repo.findOne({ where: { id, userId } });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async update(id: string, userId: string, data: Partial<CreateEditorNoteDto> & { isPinned?: boolean }): Promise<EditorNote> {
    const note = await this.repo.findOne({ where: { id, userId } });
    if (!note) throw new NotFoundException('Note not found');
    Object.assign(note, data);
    return this.repo.save(note);
  }

  async delete(id: string, userId: string): Promise<void> {
    const note = await this.repo.findOne({ where: { id, userId } });
    if (!note) throw new NotFoundException('Note not found');
    await this.repo.remove(note);
  }
}
