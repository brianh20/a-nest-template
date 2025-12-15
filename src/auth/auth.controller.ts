import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {
    console.log('[AuthController] Controller initialized');
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    console.log('[AuthController] POST /auth/login called');
    return this.authService.login(loginDto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  async register(@Body() registerDto: RegisterDto) {
    console.log('[AuthController] POST /auth/register called');
    return this.authService.register(registerDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    console.log('[AuthController] GET /auth/me called for user:', user.id);
    return this.authService.getProfile(user.id);
  }
}
