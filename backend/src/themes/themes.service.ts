import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Theme } from './entities/theme.entity';
import { CreateThemeDto } from './dto/create-theme.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class ThemesService {
  constructor(
    @InjectRepository(Theme)
    private readonly repo: Repository<Theme>,
  ) {}

  async create(dto: CreateThemeDto): Promise<Theme> {
    const theme = this.repo.create(dto);
    return this.repo.save(theme);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Theme>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const [data, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
    return new PaginatedResult(data, total, page, limit);
  }

  async findOne(id: string): Promise<Theme> {
    const theme = await this.repo.findOne({ where: { id }, relations: ['children'] });
    if (!theme) throw new NotFoundException(`Theme ${id} not found`);
    return theme;
  }

  async findBySlug(slug: string): Promise<Theme> {
    const theme = await this.repo.findOne({ where: { slug }, relations: ['children'] });
    if (!theme) throw new NotFoundException(`Theme ${slug} not found`);
    return theme;
  }

  async getTree(): Promise<Theme[]> {
    return this.repo.find({
      where: { parentId: IsNull() },
      relations: ['children'],
      order: { name: 'ASC' },
    });
  }
}
