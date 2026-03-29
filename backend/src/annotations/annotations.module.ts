import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Annotation } from './entities/annotation.entity';
import { AnnotationsService } from './annotations.service';
import { AnnotationsController } from './annotations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Annotation])],
  controllers: [AnnotationsController],
  providers: [AnnotationsService],
  exports: [AnnotationsService],
})
export class AnnotationsModule {}
