import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    const token = await this.usersService.setVerificationToken(user.id);
    await this.mailService.sendVerificationEmail(user.email, user.fullName, token);
    return this.generateTokens(user);
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.verifyEmail(token);
    await this.mailService.sendWelcomeEmail(user.email, user.fullName);
    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const { token, user } = await this.usersService.setResetToken(email);
    await this.mailService.sendPasswordResetEmail(user.email, user.fullName, token);
    return { message: 'Reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    await this.usersService.resetPassword(token, newPassword);
    return { message: 'Password reset successfully' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await this.usersService.validatePassword(user, dto.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    await this.usersService.updateLastLogin(user.id);
    return this.generateTokens(user);
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    const { passwordHash, ...result } = user as any;
    return result;
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
