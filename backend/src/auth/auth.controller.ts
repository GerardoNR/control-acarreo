import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { Role } from './enums/role.enum';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import type { AuthUser } from './interfaces/auth-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@CurrentUser() usuario: AuthUser) {
    return usuario;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @Get('admin-only')
  adminOnly(@CurrentUser() usuario: AuthUser) {
    return {
      mensaje: 'Acceso autorizado para administrador',
      usuario,
    };
  }
}
