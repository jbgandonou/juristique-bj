import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly repo: Repository<Bookmark>,
  ) {}

  async create(userId: string, dto: CreateBookmarkDto): Promise<Bookmark> {
    const bookmark = this.repo.create({ ...dto, userId });
    return this.repo.save(bookmark);
  }

  async findByUser(userId: string, pagination: PaginationDto): Promise<PaginatedResult<Bookmark>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResult(data, total, page, limit);
  }

  async delete(id: string, userId: string): Promise<void> {
    const bookmark = await this.repo.findOne({ where: { id, userId } });
    if (!bookmark) throw new NotFoundException(`Bookmark ${id} not found`);
    await this.repo.remove(bookmark);
  }
}
