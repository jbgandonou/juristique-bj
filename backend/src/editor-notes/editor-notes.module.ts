import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditorNote } from './entities/editor-note.entity';
import { EditorNotesService } from './editor-notes.service';
import { EditorNotesController } from './editor-notes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EditorNote])],
  controllers: [EditorNotesController],
  providers: [EditorNotesService],
  exports: [EditorNotesService],
})
export class EditorNotesModule {}
