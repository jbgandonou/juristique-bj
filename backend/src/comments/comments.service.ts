import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly repo: Repository<Comment>,
  ) {}

  async create(userId: string, dto: CreateCommentDto): Promise<Comment> {
    const comment = this.repo.create({ ...dto, userId });
    return this.repo.save(comment);
  }

  async findByText(textId: string, pagination: PaginationDto): Promise<PaginatedResult<Comment>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const [data, total] = await this.repo.findAndCount({
      where: { textId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResult(data, total, page, limit);
  }

  async findByUser(userId: string, pagination: PaginationDto): Promise<PaginatedResult<Comment>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      relations: ['text'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResult(data, total, page, limit);
  }

  async upvote(id: string): Promise<Comment> {
    const comment = await this.repo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    comment.upvotes += 1;
    return this.repo.save(comment);
  }

  async flag(id: string): Promise<Comment> {
    const comment = await this.repo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    comment.isFlagged = true;
    return this.repo.save(comment);
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.repo.findOne({ where: { id, userId } });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    await this.repo.remove(comment);
  }
}
