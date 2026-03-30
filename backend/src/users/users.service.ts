import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.repo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.repo.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      profession: dto.profession,
      countryId: dto.countryId,
      barNumber: dto.barNumber,
    });
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.repo.update(id, { lastLoginAt: new Date() });
  }

  async setVerificationToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    await this.repo.update(userId, {
      verificationToken: token,
      verificationTokenExpires: expires,
    });
    return token;
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await this.repo.findOne({
      where: { verificationToken: token },
    });
    if (!user) throw new NotFoundException('Invalid verification token');
    if (user.verificationTokenExpires < new Date()) {
      throw new NotFoundException('Verification token expired');
    }
    user.isVerified = true;
    user.verificationToken = null as any;
    user.verificationTokenExpires = null as any;
    return this.repo.save(user);
  }

  async setResetToken(email: string): Promise<{ token: string; user: User }> {
    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    await this.repo.update(user.id, {
      resetToken: token,
      resetTokenExpires: expires,
    });
    return { token, user };
  }

  async promoteToAdmin(userId: string): Promise<void> {
    await this.repo.update(userId, { role: UserRole.ADMIN, isVerified: true });
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    const user = await this.repo.findOne({ where: { resetToken: token } });
    if (!user) throw new NotFoundException('Invalid reset token');
    if (user.resetTokenExpires < new Date()) {
      throw new NotFoundException('Reset token expired');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetToken = null as any;
    user.resetTokenExpires = null as any;
    return this.repo.save(user);
  }

  async findAll(page: number = 1, limit: number = 50): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['country'],
    });
    return { data, total, page, limit };
  }

  async getStats(): Promise<{ total: number; admins: number; editors: number; premium: number; free: number; verified: number }> {
    const total = await this.repo.count();
    const admins = await this.repo.count({ where: { role: UserRole.ADMIN } });
    const editors = await this.repo.count({ where: { role: UserRole.EDITOR } });
    const premium = await this.repo.count({ where: { role: UserRole.PREMIUM } });
    const free = await this.repo.count({ where: { role: UserRole.FREE } });
    const verified = await this.repo.count({ where: { isVerified: true } });
    return { total, admins, editors, premium, free, verified };
  }

  async updateRole(id: string, role: string): Promise<User> {
    const user = await this.findById(id);
    user.role = role as UserRole;
    return this.repo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.repo.remove(user);
  }
}
