import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CambiarEstadoDto } from '../common/dto/cambiar-estado.dto';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { PapeleraService } from '../papelera/papelera.service';
import { CamionesService } from './camiones.service';
import { CreateCamionDto } from './dto/create-camion.dto';
import { UpdateCamionDto } from './dto/update-camion.dto';

@Controller('camiones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class CamionesController {
  constructor(
    private readonly camionesService: CamionesService,
    private readonly papeleraService: PapeleraService,
  ) {}

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  findAll() {
    return this.camionesService.findAll();
  }

  @Get('nfc/:uid')
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  findByNfc(@Param('uid') uid: string) {
    return this.camionesService.findByNfc(uid);
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.camionesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCamionDto) {
    return this.camionesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCamionDto) {
    return this.camionesService.update(id, dto);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
  ) {
    return this.camionesService.cambiarEstado(id, dto.activo);
  }

  @Delete(':id')
  enviarPapelera(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.papeleraService.enviar('camion', id, usuario);
  }
}
