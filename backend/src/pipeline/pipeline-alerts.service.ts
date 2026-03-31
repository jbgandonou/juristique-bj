import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PipelineAlert } from './entities/pipeline-alert.entity';
import { ScraperAlert } from './scrapers/scraper.interface';
import { QueryAlertsDto } from './dto/pipeline-alert.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class PipelineAlertsService {
  constructor(
    @InjectRepository(PipelineAlert)
    private readonly repo: Repository<PipelineAlert>,
  ) {}

  async createFromScraper(
    jobId: string | null,
    alerts: ScraperAlert[],
  ): Promise<PipelineAlert[]> {
    const entities = alerts.map((alert) =>
      this.repo.create({
        jobId: jobId ?? undefined,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        metadata: alert.metadata ?? undefined,
        acknowledged: false,
      }),
    );
    return this.repo.save(entities);
  }

  async findAll(query: QueryAlertsDto): Promise<PaginatedResult<PipelineAlert>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.repo
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.job', 'job')
      .orderBy('alert.createdAt', 'DESC');

    if (query.type) {
      qb.andWhere('alert.type = :type', { type: query.type });
    }
    if (query.severity) {
      qb.andWhere('alert.severity = :severity', { severity: query.severity });
    }
    if (query.acknowledged !== undefined) {
      qb.andWhere('alert.acknowledged = :acknowledged', {
        acknowledged: query.acknowledged,
      });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return new PaginatedResult(data, total, page, limit);
  }

  async acknowledge(id: string): Promise<PipelineAlert> {
    await this.repo.update(id, { acknowledged: true });
    return this.repo.findOneByOrFail({ id });
  }

  async countUnacknowledged(): Promise<number> {
    return this.repo.count({ where: { acknowledged: false } });
  }
}
