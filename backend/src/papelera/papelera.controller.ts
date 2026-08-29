import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { PapeleraService } from './papelera.service';

@Controller('papelera')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class PapeleraController {
  constructor(private readonly papeleraService: PapeleraService) {}

  @Get()
  listar() {
    return this.papeleraService.listar();
  }

  @Patch(':tipo/:id/restaurar')
  restaurar(
    @Param('tipo') tipo: string,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.papeleraService.restaurar(tipo, id, usuario);
  }

}
