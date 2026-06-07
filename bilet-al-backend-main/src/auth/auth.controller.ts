import { Controller, Post, Body, UseGuards, Get, Req, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(AuthGuard('local'))
  @ApiOperation({ summary: 'Kullanıcı girişi' })
  async login(@Req() req: any) {
    return this.authService.login(req.user, req.ip);
  }

  @Post('register')
  @ApiOperation({ summary: 'Yeni kullanıcı kaydı' })
  async register(@Body() dto: any) {
    return this.authService.register(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Token yenileme' })
  async refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.authService.refreshTokens(body.userId, body.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(200)
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.id);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getProfile(@Req() req: any) {
    return req.user;
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async changePassword(@Req() req: any, @Body() dto: any) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
