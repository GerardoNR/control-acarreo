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
import { ChecadoresService } from './checadores.service';
import { CreateChecadorDto } from './dto/create-checador.dto';
import { UpdateChecadorDto } from './dto/update-checador.dto';

@Controller('checadores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class ChecadoresController {
  constructor(private readonly checadoresService: ChecadoresService) {}

  @Get()
  findAll() {
    return this.checadoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.checadoresService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateChecadorDto) {
    return this.checadoresService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChecadorDto,
  ) {
    return this.checadoresService.update(id, dto);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
  ) {
    return this.checadoresService.cambiarEstado(id, dto.activo);
  }
}
