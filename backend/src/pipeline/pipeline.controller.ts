import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PipelineService } from './pipeline.service';
import { CreatePipelineJobDto, CreateSourceConfigDto } from './dto/create-pipeline-job.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('pipeline')
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly service: PipelineService) {}

  @Post('jobs')
  @ApiOperation({ summary: 'Create a pipeline job' })
  createJob(@Body() dto: CreatePipelineJobDto) {
    return this.service.createJob(dto);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List pipeline jobs' })
  findAllJobs(@Query() pagination: PaginationDto) {
    return this.service.findAllJobs(pagination);
  }

  @Post('sources')
  @ApiOperation({ summary: 'Create a source config' })
  createSource(@Body() dto: CreateSourceConfigDto) {
    return this.service.createSource(dto);
  }

  @Get('sources')
  @ApiOperation({ summary: 'List source configs' })
  findAllSources() {
    return this.service.findAllSources();
  }
}
