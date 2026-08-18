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
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MaterialesService } from './materiales.service';

@Controller('materiales')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class MaterialesController {
  constructor(private readonly materialesService: MaterialesService) {}

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  findAll() {
    return this.materialesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materialesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMaterialDto) {
    return this.materialesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialDto,
  ) {
    return this.materialesService.update(id, dto);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
  ) {
    return this.materialesService.cambiarEstado(id, dto.activo);
  }
}
