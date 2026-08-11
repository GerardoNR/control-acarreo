import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CambiarEstadoDto } from '../common/dto/cambiar-estado.dto';
import { CamionesService } from './camiones.service';
import { CreateCamionDto } from './dto/create-camion.dto';
import { UpdateCamionDto } from './dto/update-camion.dto';

@Controller('camiones')
export class CamionesController {
  constructor(private readonly camionesService: CamionesService) {}

  @Get()
  findAll() {
    return this.camionesService.findAll();
  }

  @Get('nfc/:uid')
  findByNfc(@Param('uid') uid: string) {
    return this.camionesService.findByNfc(uid);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.camionesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCamionDto) {
    return this.camionesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCamionDto,
  ) {
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
