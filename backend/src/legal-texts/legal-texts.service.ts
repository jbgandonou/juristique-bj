import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalText } from './entities/legal-text.entity';
import { CreateLegalTextDto } from './dto/create-legal-text.dto';
import { QueryLegalTextDto } from './dto/query-legal-text.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { Theme } from '../themes/entities/theme.entity';

@Injectable()
export class LegalTextsService {
  constructor(
    @InjectRepository(LegalText)
    private readonly repo: Repository<LegalText>,
    @InjectRepository(Theme)
    private readonly themeRepo: Repository<Theme>,
  ) {}

  async create(dto: CreateLegalTextDto): Promise<LegalText> {
    const { themeIds, ...rest } = dto;
    const text = this.repo.create(rest);

    if (themeIds?.length) {
      text.themes = await this.themeRepo.findByIds(themeIds);
    }

    return this.repo.save(text);
  }

  async findAll(query: QueryLegalTextDto): Promise<PaginatedResult<LegalText>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { countryCode, themeSlug, textType, status, isInForce } = query;

    const qb = this.repo
      .createQueryBuilder('text')
      .leftJoinAndSelect('text.country', 'country')
      .leftJoinAndSelect('text.themes', 'theme');

    if (countryCode) {
      qb.andWhere('country.code = :countryCode', { countryCode: countryCode.toUpperCase() });
    }
    if (themeSlug) {
      qb.andWhere('theme.slug = :themeSlug', { themeSlug });
    }
    if (textType) {
      qb.andWhere('text.textType = :textType', { textType });
    }
    if (status) {
      qb.andWhere('text.status = :status', { status });
    }
    if (isInForce !== undefined) {
      qb.andWhere('text.isInForce = :isInForce', { isInForce });
    }

    qb.orderBy('text.promulgationDate', 'DESC', 'NULLS LAST')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResult(data, total, page, limit);
  }

  async findOne(id: string): Promise<LegalText> {
    const text = await this.repo.findOne({
      where: { id },
      relations: ['country', 'themes', 'parentText', 'replaces'],
    });
    if (!text) throw new NotFoundException(`LegalText ${id} not found`);

    await this.repo.increment({ id }, 'viewCount', 1);
    return text;
  }
}
