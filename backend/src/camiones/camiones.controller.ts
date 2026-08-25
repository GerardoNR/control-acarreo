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
import { CamionesService } from './camiones.service';
import { CreateCamionDto } from './dto/create-camion.dto';
import { UpdateCamionDto } from './dto/update-camion.dto';

@Controller('camiones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class CamionesController {
  constructor(private readonly camionesService: CamionesService) {}

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
}
