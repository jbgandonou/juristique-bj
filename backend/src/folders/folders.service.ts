import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder, FolderShare } from './entities/folder.entity';
import { CreateFolderDto, ShareFolderDto } from './dto/create-folder.dto';
import { LegalText } from '../legal-texts/entities/legal-text.entity';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private readonly folderRepo: Repository<Folder>,
    @InjectRepository(FolderShare)
    private readonly shareRepo: Repository<FolderShare>,
    @InjectRepository(LegalText)
    private readonly textRepo: Repository<LegalText>,
  ) {}

  async create(ownerId: string, dto: CreateFolderDto): Promise<Folder> {
    const folder = this.folderRepo.create({ ...dto, ownerId });
    return this.folderRepo.save(folder);
  }

  async findMyFolders(userId: string): Promise<Folder[]> {
    const owned = await this.folderRepo.find({
      where: { ownerId: userId },
      relations: ['texts', 'texts.country', 'texts.themes', 'shares'],
      order: { updatedAt: 'DESC' },
    });

    const shared = await this.shareRepo.find({
      where: { sharedWithId: userId },
      relations: ['folder', 'folder.texts', 'folder.texts.country', 'folder.texts.themes'],
    });

    const sharedFolders = shared.map(s => ({
      ...s.folder,
      _sharedPermission: s.permission,
    }));

    return [...owned, ...sharedFolders as any];
  }

  async findOne(id: string, userId: string): Promise<Folder> {
    const folder = await this.folderRepo.findOne({
      where: { id },
      relations: ['texts', 'texts.country', 'texts.themes', 'shares'],
    });
    if (!folder) throw new NotFoundException(`Folder ${id} not found`);

    if (folder.ownerId !== userId) {
      const share = await this.shareRepo.findOne({
        where: { folderId: id, sharedWithId: userId },
      });
      if (!share) throw new ForbiddenException('Access denied');
    }

    return folder;
  }

  async update(id: string, userId: string, dto: Partial<CreateFolderDto>): Promise<Folder> {
    const folder = await this.findOne(id, userId);
    if (folder.ownerId !== userId) throw new ForbiddenException('Only the owner can edit');
    Object.assign(folder, dto);
    return this.folderRepo.save(folder);
  }

  async delete(id: string, userId: string): Promise<void> {
    const folder = await this.folderRepo.findOne({ where: { id, ownerId: userId } });
    if (!folder) throw new NotFoundException('Folder not found or access denied');
    await this.folderRepo.remove(folder);
  }

  async addText(folderId: string, textId: string, userId: string): Promise<Folder> {
    const folder = await this.findOne(folderId, userId);
    const text = await this.textRepo.findOne({ where: { id: textId } });
    if (!text) throw new NotFoundException(`Text ${textId} not found`);

    if (!folder.texts) folder.texts = [];
    if (!folder.texts.find(t => t.id === textId)) {
      folder.texts.push(text);
      await this.folderRepo.save(folder);
    }
    return this.findOne(folderId, userId);
  }

  async removeText(folderId: string, textId: string, userId: string): Promise<Folder> {
    const folder = await this.findOne(folderId, userId);
    folder.texts = folder.texts.filter(t => t.id !== textId);
    await this.folderRepo.save(folder);
    return this.findOne(folderId, userId);
  }

  async share(folderId: string, userId: string, dto: ShareFolderDto): Promise<FolderShare> {
    const folder = await this.folderRepo.findOne({ where: { id: folderId, ownerId: userId } });
    if (!folder) throw new ForbiddenException('Only the owner can share');

    // Find user by email — we need UsersService for this, but to keep it simple:
    // Store email as sharedWithId for now, resolve later
    const share = this.shareRepo.create({
      folderId,
      sharedWithId: dto.email, // Will be resolved to userId
      permission: dto.permission,
    });

    folder.isShared = true;
    await this.folderRepo.save(folder);
    return this.shareRepo.save(share);
  }

  async removeShare(folderId: string, shareId: string, userId: string): Promise<void> {
    const folder = await this.folderRepo.findOne({ where: { id: folderId, ownerId: userId } });
    if (!folder) throw new ForbiddenException('Only the owner can manage shares');
    await this.shareRepo.delete(shareId);
  }
}
