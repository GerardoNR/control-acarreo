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
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CambiarEstadoDto } from '../common/dto/cambiar-estado.dto';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { ProyectosService } from './proyectos.service';
import { PapeleraService } from '../papelera/papelera.service';

@Controller('proyectos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class ProyectosController {
  constructor(
    private readonly proyectosService: ProyectosService,
    private readonly papeleraService: PapeleraService,
  ) {}

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  findAll() {
    return this.proyectosService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proyectosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProyectoDto) {
    return this.proyectosService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProyectoDto,
  ) {
    return this.proyectosService.update(id, dto);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
  ) {
    return this.proyectosService.cambiarEstado(id, dto.activo);
  }

  @Patch(':id/finalizar')
  finalizar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.proyectosService.finalizar(id, usuario);
  }

  @Delete(':id')
  enviarPapelera(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.papeleraService.enviar('proyecto', id, usuario);
  }
}
