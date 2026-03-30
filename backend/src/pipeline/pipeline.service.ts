import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { PipelineJob } from './entities/pipeline-job.entity';
import { SourceConfig } from './entities/source-config.entity';
import { CreatePipelineJobDto, CreateSourceConfigDto } from './dto/create-pipeline-job.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class PipelineService {
  constructor(
    @InjectRepository(PipelineJob)
    private readonly jobRepo: Repository<PipelineJob>,
    @InjectRepository(SourceConfig)
    private readonly sourceRepo: Repository<SourceConfig>,
    @InjectQueue('pipeline')
    private readonly pipelineQueue: Queue,
  ) {}

  async createJob(dto: CreatePipelineJobDto): Promise<PipelineJob> {
    const job = this.jobRepo.create(dto);
    const saved = await this.jobRepo.save(job);

    // Dispatch to BullMQ queue
    await this.pipelineQueue.add('scrape', {
      pipelineJobId: saved.id,
      sourceName: saved.sourceName,
    }, {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: false,
    });

    return saved;
  }

  async findAllJobs(pagination: PaginationDto): Promise<PaginatedResult<PipelineJob>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const [data, total] = await this.jobRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return new PaginatedResult(data, total, page, limit);
  }

  async updateJobStatus(id: string, status: string, extra?: Partial<PipelineJob>): Promise<PipelineJob> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    Object.assign(job, { status, ...extra });
    return this.jobRepo.save(job);
  }

  async createSource(dto: CreateSourceConfigDto): Promise<SourceConfig> {
    const source = this.sourceRepo.create(dto);
    return this.sourceRepo.save(source);
  }

  async findAllSources(): Promise<SourceConfig[]> {
    return this.sourceRepo.find({ order: { name: 'ASC' } });
  }
}
