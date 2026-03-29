import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './entities/country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country)
    private readonly repo: Repository<Country>,
  ) {}

  async create(dto: CreateCountryDto): Promise<Country> {
    const country = this.repo.create(dto);
    return this.repo.save(country);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Country>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const [data, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
    return new PaginatedResult(data, total, page, limit);
  }

  async findOne(id: string): Promise<Country> {
    const country = await this.repo.findOne({ where: { id } });
    if (!country) throw new NotFoundException(`Country ${id} not found`);
    return country;
  }

  async findByCode(code: string): Promise<Country> {
    const country = await this.repo.findOne({ where: { code: code.toUpperCase() } });
    if (!country) throw new NotFoundException(`Country with code ${code} not found`);
    return country;
  }
}
