import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CrearSuspensionDto } from './dto/crear-suspension.dto';
import { SuspensionesService } from './suspensiones.service';

@Controller('suspensiones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class SuspensionesController {
  constructor(private readonly service: SuspensionesService) {}

  @Get(':tipo/activas')
  activas(@Param('tipo') tipo: string) {
    return this.service.activas(tipo);
  }

  @Post(':tipo/:id')
  suspender(
    @Param('tipo') tipo: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearSuspensionDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.suspender(tipo, id, dto, usuario);
  }

  @Patch(':tipo/:id/reanudar')
  reanudar(
    @Param('tipo') tipo: string,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.reanudar(tipo, id, usuario);
  }
}
