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
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CambiarEstadoDto } from '../common/dto/cambiar-estado.dto';
import { CreateUbicacionDto } from './dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';
import { UbicacionesService } from './ubicaciones.service';

@Controller('ubicaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class UbicacionesController {
  constructor(private readonly ubicacionesService: UbicacionesService) {}

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  findAll() {
    return this.ubicacionesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ubicacionesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUbicacionDto) {
    return this.ubicacionesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUbicacionDto,
  ) {
    return this.ubicacionesService.update(id, dto);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
  ) {
    return this.ubicacionesService.cambiarEstado(id, dto.activo);
  }
}
