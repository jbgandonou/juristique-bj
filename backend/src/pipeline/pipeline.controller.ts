import { Controller, Get, Post, Patch, Delete, Body, Query, Param } from '@nestjs/common';
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

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get a single pipeline job' })
  findOneJob(@Param('id') id: string) {
    return this.service.findOneJob(id);
  }

  @Patch('jobs/:id/cancel')
  @ApiOperation({ summary: 'Cancel a pipeline job' })
  cancelJob(@Param('id') id: string) {
    return this.service.cancelJob(id);
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: 'Delete a pipeline job' })
  deleteJob(@Param('id') id: string) {
    return this.service.deleteJob(id);
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
