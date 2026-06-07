import {
  Injectable, UnauthorizedException, BadRequestException,
  ConflictException, NotFoundException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../common/entities/all.entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    if (user.status !== 'active') throw new UnauthorizedException('Hesabınız aktif değil');
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    return user;
  }

  async login(user: User, ipAddress?: string) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });
    const refreshToken = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersRepo.update(user.id, { refreshTokenHash, lastLoginAt: new Date() });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        preferredLanguage: user.preferredLanguage,
      },
    };
  }

  async register(dto: any) {
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Bu e-posta zaten kayıtlı');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationToken = uuidv4();
    const user = this.usersRepo.create({
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: 'customer',
      emailVerificationToken: verificationToken,
    });
    await this.usersRepo.save(user);
    return { message: 'Kayıt başarılı. Lütfen e-postanızı doğrulayın.' };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException();
    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) throw new UnauthorizedException('Geçersiz refresh token');
    return this.login(user);
  }

  async logout(userId: string) {
    await this.usersRepo.update(userId, { refreshTokenHash: null });
    return { message: 'Çıkış yapıldı' };
  }

  async changePassword(userId: string, dto: any) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Mevcut şifre hatalı');
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.update(userId, { passwordHash });
    return { message: 'Şifre güncellendi' };
  }
}
