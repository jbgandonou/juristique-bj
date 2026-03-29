import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from './entities/user.entity';
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
}
